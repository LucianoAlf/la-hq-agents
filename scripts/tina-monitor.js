#!/usr/bin/env node
// =============================================================================
// tina-monitor.js
// Localização: /home/lahq/scripts/tina-monitor.js
// Runtime: Node.js 20+
// =============================================================================
// Propósito:
//   Polling a cada 30s na tabela instagram_events (responded = false).
//   Classifica cada evento via Claude Code (Sonnet 4.6), executa a ação
//   apropriada (responder via Graph API, disparar UAZAPI pros consultores),
//   SEMPRE com cópia (CC) pra Andreza que é o suporte humano do IG.
//
// Execução:
//   node scripts/tina-monitor.js                  # modo manual (1 ciclo)
//   pm2 start scripts/tina-monitor.js --name tina-monitor -- --daemon
//
// ENV necessárias (.env):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   IG_TOKEN_LA_MUSIC_SCHOOL
//   IG_TOKEN_LA_MUSIC_KIDS
//   IG_TOKEN_SONORAMENTE  (a partir de maio/2026)
//   UAZAPI_URL
//   UAZAPI_TOKEN
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config({ path: '/home/lahq/.env' });

// =============================================================================
// Configuração
// =============================================================================

const POLL_INTERVAL_MS = 30 * 1000;  // 30 segundos
const MAX_EVENTS_PER_CYCLE = 20;
const MAX_PROCESSING_ATTEMPTS = 3;
const CONFIDENCE_AUTO_RESPOND = 0.85;
const CONFIDENCE_REVIEW = 0.60;
const RATE_LIMIT_PER_HOUR = 180;

const OFFICE_ID = 'a1b2c3d4-0001-4000-8000-000000000001';
const GRAPH_API = 'https://graph.facebook.com/v19.0';

// Mapa de marca → token da Graph API
const BRAND_TOKENS = {
  'la-music-school': process.env.IG_TOKEN_LA_MUSIC_SCHOOL,
  'la-music-kids': process.env.IG_TOKEN_LA_MUSIC_KIDS,
  // 'sonoramente': process.env.IG_TOKEN_SONORAMENTE,  // ATIVAR em maio/2026
};

// Mapa de marca → IG account ID
const BRAND_ACCOUNTS = {
  'la-music-school': '17841401761485758',
  'la-music-kids': '17841404041835860',
  // 'sonoramente': 'A_DEFINIR',  // ATIVAR em maio/2026
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

// =============================================================================
// Loop principal
// =============================================================================

async function main() {
  const isDaemon = process.argv.includes('--daemon');
  console.log(`[tina-monitor] iniciado ${new Date().toISOString()} ${isDaemon ? '(daemon)' : '(one-shot)'}`);

  do {
    try {
      await runCycle();
    } catch (err) {
      console.error('[tina-monitor] erro no ciclo:', err);
    }

    if (isDaemon) {
      await sleep(POLL_INTERVAL_MS);
    }
  } while (isDaemon);
}

async function runCycle() {
  const { data: events, error } = await supabase
    .from('instagram_events')
    .select('*')
    .eq('office_id', OFFICE_ID)
    .eq('responded', false)
    .lt('processing_attempts', MAX_PROCESSING_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(MAX_EVENTS_PER_CYCLE);

  if (error) {
    console.error('[tina-monitor] erro ao buscar eventos:', error);
    return;
  }

  if (!events || events.length === 0) {
    console.log('[tina-monitor] sem eventos pendentes');
    return;
  }

  console.log(`[tina-monitor] ${events.length} evento(s) pendente(s)`);

  for (const event of events) {
    await processEvent(event);
  }
}

// =============================================================================
// Processamento de um evento
// =============================================================================

async function processEvent(event) {
  console.log(`\n[tina-monitor] processando ${event.id} (${event.brand} ${event.event_type} @${event.sender_username})`);

  // Bloquear SonoraMente até maio
  if (event.brand === 'sonoramente' && !BRAND_TOKENS['sonoramente']) {
    console.log('[tina-monitor] SonoraMente desativado até maio/2026, skip');
    await markEvent(event.id, {
      classification: 'stale',
      responded: true,
      responded_at: new Date().toISOString(),
      response_sent: '[sonoramente-pre-launch]',
      processed_by: 'tina-auto',
    });
    return;
  }

  // Incrementa tentativa
  await supabase
    .from('instagram_events')
    .update({ processing_attempts: event.processing_attempts + 1 })
    .eq('id', event.id);

  // Fase 1: eventos antigos
  const ageMs = Date.now() - new Date(event.created_at).getTime();
  if (ageMs > 24 * 60 * 60 * 1000) {
    await markEvent(event.id, {
      classification: 'stale',
      responded: true,
      responded_at: new Date().toISOString(),
      response_sent: '[stale - evento com mais de 24h]',
      processed_by: 'tina-auto',
    });
    return;
  }

  // Fase 2: ruído óbvio
  if (await isObviousNoise(event)) {
    await markEvent(event.id, {
      classification: 'ruido',
      confidence: 1.0,
      responded: true,
      responded_at: new Date().toISOString(),
      response_sent: '[ruido detectado]',
      processed_by: 'tina-auto',
    });
    return;
  }

  // Fase 3: classificação
  const classification = await classifyWithClaude(event);
  if (!classification) return;

  const { classification: cls, confidence } = classification;

  // Fase 4: decidir ação
  if (confidence < CONFIDENCE_REVIEW) {
    await escalateToHuman(event, classification);
    return;
  }

  // Rate limit check
  const recentCount = await countRecentResponses(event.brand, 60);
  if (recentCount >= RATE_LIMIT_PER_HOUR) {
    console.log(`[tina-monitor] rate limit ${event.brand} (${recentCount}/h)`);
    return;
  }

  // Horário comercial (8h-22h)
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 8) {
    console.log('[tina-monitor] fora do horário comercial');
    return;
  }

  // Executar ação
  switch (cls) {
    case 'lead':
      await handleLead(event, classification);
      break;
    case 'aluno':
    case 'evento':
    case 'engajamento':
      await handleSimpleResponse(event, classification);
      break;
    case 'engajamento_leve':
      await handleLike(event, classification);
      break;
    case 'ruido':
      await markEvent(event.id, {
        classification: 'ruido',
        confidence,
        reasoning: classification.reasoning,
        responded: true,
        responded_at: new Date().toISOString(),
        response_sent: '[ruido]',
        processed_by: 'tina-auto',
      });
      break;
    case 'duvida_ambigua':
      await escalateToHuman(event, classification);
      break;
    default:
      await escalateToHuman(event, classification);
  }
}

// =============================================================================
// Fase 2: ruído óbvio
// =============================================================================

async function isObviousNoise(event) {
  if (event.sender_ig_id) {
    const { data } = await supabase
      .from('ig_blocked_users')
      .select('id')
      .eq('office_id', OFFICE_ID)
      .eq('sender_ig_id', event.sender_ig_id)
      .maybeSingle();
    if (data) return true;
  }

  const content = (event.content ?? '').toLowerCase();
  if (/https?:\/\/(?!(?:[\w-]+\.)?(?:lamusic|sonoramente|wa\.me\/55))/i.test(content)) return true;

  const username = (event.sender_username ?? '').toLowerCase();
  if (/^[a-z]+\d{6,}$/.test(username)) return true;

  return false;
}

// =============================================================================
// Fase 3: classificação via Claude
// =============================================================================

async function classifyWithClaude(event) {
  const prompt = buildClassificationPrompt(event);

  try {
    const tempFile = `/tmp/tina-classify-${event.id}.txt`;
    fs.writeFileSync(tempFile, prompt);

    const raw = execSync(
      `claude -p --model sonnet "$(cat ${tempFile})"`,
      { encoding: 'utf-8', timeout: 60000 }
    );

    fs.unlinkSync(tempFile);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[tina-monitor] resposta sem JSON:', raw.slice(0, 300));
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);
    if (!result.classification || typeof result.confidence !== 'number') {
      console.error('[tina-monitor] JSON inválido:', result);
      return null;
    }

    return result;
  } catch (err) {
    console.error('[tina-monitor] erro classificação:', err.message);
    return null;
  }
}

function buildClassificationPrompt(event) {
  return `Voce e a Tina, agente do LA HQ. Classifique esta interacao do Instagram.

Categorias:
- lead: intencao clara de matricula. Sinais: "quanto custa", "valor", "matricula", "aula experimental", "meu filho tem X anos"
- aluno: aluno marcando a escola, compartilhando progresso
- evento: reacao a post de evento/workshop/recital
- engajamento: elogio/pergunta sem intencao de matricula
- engajamento_leve: so emojis
- duvida_ambigua: tem pergunta mas nao da pra decidir
- ruido: spam/irrelevante

Dados:
- Marca: ${event.brand}
- Tipo: ${event.event_type}
- De: @${event.sender_username ?? event.sender_ig_id ?? 'desconhecido'}
- Conteudo: "${(event.content ?? '').replace(/"/g, '\\"').slice(0, 500)}"
${event.media_caption ? `- Post: "${event.media_caption.slice(0, 300)}"` : ''}

Retorne APENAS JSON (sem markdown):
{
  "classification": "lead|aluno|evento|engajamento|engajamento_leve|duvida_ambigua|ruido",
  "confidence": 0.0-1.0,
  "reasoning": "1 frase",
  "unit_hint": "campo-grande|recreio|barra|null",
  "suggested_response": "texto no tom da marca ou null"
}

Tom por marca:
- la-music-school: direto, energetico, "Fala!", 🎸🤘
- la-music-kids: pros PAIS, divertido mas nao infantil, 🎵🎶
- sonoramente: acolhedor + cientifico, NUNCA infantilizar, 💜, NUNCA promete cura

Regras:
- NUNCA prometa preco — encaminhe pro WhatsApp
- NUNCA mais de 2 emojis
- NUNCA caps lock`;
}

// =============================================================================
// Ações
// =============================================================================

async function handleLead(event, classification) {
  const { suggested_response, unit_hint, confidence } = classification;

  // 1. Responder no IG
  const responseResult = await sendInstagramResponse(event, suggested_response);
  if (!responseResult.success) {
    await markEvent(event.id, { response_error: responseResult.error, processed_by: 'tina-auto' });
    return;
  }

  // 2. Criar lead
  const { data: lead } = await supabase
    .from('leads')
    .insert({
      office_id: OFFICE_ID,
      brand: event.brand,
      source: `instagram_${event.event_type}`,
      ig_username: event.sender_username,
      ig_event_id: event.id,
      unit: unit_hint,
      status: 'novo',
    })
    .select('id')
    .single();

  // 3. Consultor da unidade
  const receiver = await getLeadReceiver(unit_hint);

  // 4. Andreza (CC sempre)
  const andreza = await getAndreza();

  // 5. Disparar UAZAPI — consultor + Andreza
  let whatsappDispatched = false;
  if (receiver) {
    whatsappDispatched = await dispatchUazapi(receiver.phone, buildLeadMessage(event, classification, receiver));
  }
  if (andreza) {
    await dispatchUazapi(andreza.phone, buildAndrezaCCMessage(event, classification, receiver));
  }

  // 6. Registrar
  await markEvent(event.id, {
    classification: 'lead',
    confidence,
    reasoning: classification.reasoning,
    unit_hint,
    responded: true,
    responded_at: new Date().toISOString(),
    response_sent: suggested_response,
    response_meta_id: responseResult.meta_id,
    whatsapp_dispatched: whatsappDispatched,
    whatsapp_to: receiver?.name ?? null,
    lead_id: lead?.id,
    processed_by: 'tina-auto',
  });

  console.log(`[tina-monitor] ✓ LEAD: @${event.sender_username} → ${receiver?.name ?? 'sem consultor'} (CC Andreza)`);
}

async function handleSimpleResponse(event, classification) {
  const { suggested_response, confidence, classification: cls } = classification;

  const responseResult = await sendInstagramResponse(event, suggested_response);

  await markEvent(event.id, {
    classification: cls,
    confidence,
    reasoning: classification.reasoning,
    responded: true,
    responded_at: new Date().toISOString(),
    response_sent: suggested_response,
    response_meta_id: responseResult.meta_id,
    response_error: responseResult.success ? null : responseResult.error,
    processed_by: 'tina-auto',
  });

  console.log(`[tina-monitor] ✓ ${cls}: respondido`);
}

async function handleLike(event, classification) {
  if (event.event_type !== 'comment') {
    return handleSimpleResponse(event, { ...classification, suggested_response: '❤️' });
  }

  await markEvent(event.id, {
    classification: 'engajamento_leve',
    confidence: classification.confidence,
    responded: true,
    responded_at: new Date().toISOString(),
    response_sent: '[liked]',
    processed_by: 'tina-auto',
  });
}

async function escalateToHuman(event, classification) {
  // Krissya recebe, Andreza CC
  const krissya = await getKrissya();
  const andreza = await getAndreza();

  const msg = buildEscalationMessage(event, classification);

  let dispatched = false;
  if (krissya) dispatched = await dispatchUazapi(krissya.phone, msg);
  if (andreza) await dispatchUazapi(andreza.phone, `📋 CC escalação\n\n${msg}`);

  await markEvent(event.id, {
    classification: classification.classification,
    confidence: classification.confidence,
    reasoning: classification.reasoning,
    unit_hint: classification.unit_hint,
    requires_human_review: true,
    escalation_reason: classification.reasoning ?? 'confidence baixa',
    whatsapp_dispatched: dispatched,
    whatsapp_to: krissya?.name ?? null,
    processed_by: 'tina-auto',
  });

  console.log(`[tina-monitor] ⚠ ESCALADO: @${event.sender_username} (Krissya + CC Andreza)`);
}

// =============================================================================
// Instagram Graph API
// =============================================================================

async function sendInstagramResponse(event, text) {
  const token = BRAND_TOKENS[event.brand];
  if (!token) return { success: false, error: `token não configurado: ${event.brand}` };

  try {
    if (event.event_type === 'dm') {
      const res = await fetch(
        `${GRAPH_API}/${BRAND_ACCOUNTS[event.brand]}/messages?access_token=${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: event.sender_ig_id },
            message: { text },
          }),
        }
      );
      const data = await res.json();
      if (data.error) return { success: false, error: data.error.message };
      return { success: true, meta_id: data.message_id };
    }

    if (event.event_type === 'comment' || event.event_type === 'mention') {
      const res = await fetch(
        `${GRAPH_API}/${event.media_id}/replies?access_token=${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        }
      );
      const data = await res.json();
      if (data.error) return { success: false, error: data.error.message };
      return { success: true, meta_id: data.id };
    }

    return { success: false, error: 'event_type desconhecido' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================================================
// Lookups em staff_contacts
// =============================================================================

async function getLeadReceiver(unitHint) {
  // Consultor da unidade (priority_order 10)
  if (unitHint) {
    const { data } = await supabase
      .from('v_lead_receivers')
      .select('name, phone, unit, priority_order')
      .eq('office_id', OFFICE_ID)
      .eq('unit', unitHint)
      .eq('priority_order', 10)
      .limit(1);
    if (data && data[0]) return data[0];
  }
  // Fallback: Krissya (priority_order 90)
  return getKrissya();
}

async function getKrissya() {
  const { data } = await supabase
    .from('v_lead_receivers')
    .select('name, phone, unit, priority_order')
    .eq('office_id', OFFICE_ID)
    .eq('priority_order', 90)
    .limit(1);
  return data?.[0] ?? null;
}

async function getAndreza() {
  const { data } = await supabase
    .from('v_lead_receivers')
    .select('name, phone, unit, priority_order')
    .eq('office_id', OFFICE_ID)
    .eq('priority_order', 95)
    .limit(1);
  return data?.[0] ?? null;
}

// =============================================================================
// Templates UAZAPI
// =============================================================================

function buildLeadMessage(event, classification, receiver) {
  return [
    '🎯 *NOVO LEAD VIA INSTAGRAM*',
    '',
    `Marca: ${event.brand}`,
    `De: @${event.sender_username ?? event.sender_ig_id}`,
    `Unidade: ${classification.unit_hint ?? 'não identificada'}`,
    `Confiança: ${Math.round(classification.confidence * 100)}%`,
    '',
    `Mensagem:`,
    `"${(event.content ?? '').slice(0, 300)}"`,
    '',
    `Resposta da Tina:`,
    `"${(classification.suggested_response ?? '').slice(0, 300)}"`,
    '',
    `Próximos passos:`,
    `- Contato em até 2h`,
    `- Abrir oportunidade no CRM`,
    '',
    `Event ID: ${event.id}`,
  ].join('\n');
}

function buildAndrezaCCMessage(event, classification, receiver) {
  return [
    '📋 *Lead registrado (cópia)*',
    '',
    `Marca: ${event.brand}`,
    `De: @${event.sender_username}`,
    `Unidade: ${classification.unit_hint ?? 'não identificada'}`,
    `Consultor notificado: ${receiver?.name ?? 'nenhum'}`,
    '',
    `A Tina já respondeu no IG.`,
  ].join('\n');
}

function buildEscalationMessage(event, classification) {
  return [
    '⚠️ *REVISÃO HUMANA SOLICITADA*',
    '',
    `Marca: ${event.brand}`,
    `Tipo: ${event.event_type}`,
    `De: @${event.sender_username ?? 'desconhecido'}`,
    `Classificação: ${classification.classification} (${Math.round(classification.confidence * 100)}%)`,
    `Motivo: ${classification.reasoning}`,
    '',
    `Conteúdo:`,
    `"${(event.content ?? '').slice(0, 200)}"`,
    '',
    `Event ID: ${event.id}`,
  ].join('\n');
}

// =============================================================================
// UAZAPI + helpers
// =============================================================================

async function dispatchUazapi(phone, message) {
  try {
    const res = await fetch(`${process.env.UAZAPI_URL}/message/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': process.env.UAZAPI_TOKEN,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });

    if (res.ok) return true;
    const data = await res.json();
    console.error('[tina-monitor] UAZAPI erro:', data);
    return false;
  } catch (err) {
    console.error('[tina-monitor] UAZAPI exception:', err.message);
    return false;
  }
}

async function countRecentResponses(brand, minutes) {
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('instagram_events')
    .select('id', { count: 'exact', head: true })
    .eq('brand', brand)
    .eq('responded', true)
    .gte('responded_at', since);
  return count ?? 0;
}

async function markEvent(id, updates) {
  const { error } = await supabase.from('instagram_events').update(updates).eq('id', id);
  if (error) console.error('[tina-monitor] erro ao marcar:', error);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// =============================================================================
// Start
// =============================================================================

main().catch(err => {
  console.error('[tina-monitor] erro fatal:', err);
  process.exit(1);
});
