#!/usr/bin/env node
// ============================================================
// LA HQ — tina.js v2.1 — Publisher (Instagram)
// Sprint 1.5 — DRY-RUN default + Fix hashtags duplicadas
// ============================================================
// Modos:
//   - node scripts/tina.js          → DRY-RUN (seguro, default)
//   - node scripts/tina.js --live   → Publicação REAL
//
// FIX P0 (hashtags duplicadas):
//   - Detecta se legenda do Theo já contém hashtags antes de concatenar
//   - Se já tem 3+ hashtags na legenda → não adiciona o array hashtags
//   - Se não tem (ou tem só 1-2) → adiciona o array hashtags
//   - Função buildCaption() isolada e testável
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/lahq/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const AGENTS_DIR = '/home/lahq/agents';

const OFFICE_ID = 'a1b2c3d4-0001-4000-8000-000000000001';
const AGENT_IDS = {
  tina: 'c3d4e5f6-0007-4000-8000-000000000007',
};

const BRAND_GUIDES = {
  'la-music-school': 'shared/brands/brand-la-music-school.md',
  'la-music-kids':   'shared/brands/brand-la-music-kids.md',
  'sonoramente':     'shared/brands/brand-sonoramente.md',
};

const IS_LIVE = process.argv.includes('--live');
const IS_DRY_RUN = !IS_LIVE;

// ============================================================
// FIX P0: Caption builder com detecção de hashtags
// ============================================================

function buildCaption(legendaTheo, hashtagsArray) {
  const legenda = (legendaTheo || '').trim();
  const hashtags = Array.isArray(hashtagsArray) ? hashtagsArray : [];

  // Detectar quantas hashtags já estão na legenda
  const hashtagsNaLegenda = (legenda.match(/#\w+/g) || []);
  const temHashtagsNaLegenda = hashtagsNaLegenda.length >= 3;

  if (temHashtagsNaLegenda) {
    // Legenda já tem hashtags suficientes — usar como está
    return {
      caption: legenda,
      decision: 'usou_so_legenda',
      reason: `Legenda já contém ${hashtagsNaLegenda.length} hashtags`,
      hashtags_in_legenda: hashtagsNaLegenda.length,
      hashtags_in_array: hashtags.length,
    };
  }

  if (hashtags.length === 0) {
    // Sem hashtags em nenhum lugar — só legenda
    return {
      caption: legenda,
      decision: 'sem_hashtags',
      reason: 'Nenhuma hashtag fornecida',
      hashtags_in_legenda: 0,
      hashtags_in_array: 0,
    };
  }

  // Legenda sem hashtags + array tem hashtags → concatenar
  // Garantir que cada hashtag começa com #
  const tagsClean = hashtags.map(h => h.startsWith('#') ? h : `#${h}`);
  return {
    caption: `${legenda}\n\n${tagsClean.join(' ')}`,
    decision: 'concatenou',
    reason: 'Legenda não tinha hashtags, adicionei do array',
    hashtags_in_legenda: hashtagsNaLegenda.length,
    hashtags_in_array: hashtags.length,
  };
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function loadFile(relativePath) {
  const fullPath = path.join(AGENTS_DIR, relativePath);
  if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath, 'utf8');
  return '';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function recordMemory(content, category, metadata = {}) {
  await supabase.from('semantic_memory').insert({
    office_id: OFFICE_ID, agent_id: AGENT_IDS.tina,
    content, category, metadata, source: 'tina', relevance_score: 0.9,
  });
}

async function recordCost(taskId) {
  await supabase.from('agent_costs').insert({
    agent_id: AGENT_IDS.tina, provider: 'claude', model: 'sonnet-4.6',
    tokens_input: 0, tokens_output: 0, cost_usd: 0,
    period: new Date().toISOString().split('T')[0],
    operation_type: IS_DRY_RUN ? 'publishing_dryrun' : 'publishing', task_id: taskId,
  });
}

// CHECK LOCK: Verificar se publicação está bloqueada
async function checkPublishingLock(brand) {
  const { data } = await supabase.from('semantic_memory')
    .select('content, metadata')
    .eq('office_id', OFFICE_ID)
    .eq('category', 'pattern')
    .filter('metadata->>lock_type', 'eq', 'publishing_lock')
    .filter('metadata->>scope', 'eq', brand.replace('la-music-', ''))
    .order('created_at', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    return { locked: true, reason: data[0].content };
  }
  return { locked: false };
}

// ============================================================
// INSTAGRAM GRAPH API
// ============================================================

async function getCredentials(brand) {
  const { data } = await supabase.from('agent_integrations')
    .select('config')
    .eq('integration_type', 'instagram_graph_api')
    .eq('integration_name', `${brand.replace(/-/g, '_')}_instagram`)
    .eq('active', true)
    .single();
  return data?.config;
}

async function createMediaContainer(igAccountId, imageUrl, accessToken) {
  const url = `https://graph.facebook.com/v21.0/${igAccountId}/media`;
  const params = new URLSearchParams({
    image_url: imageUrl, is_carousel_item: 'true', access_token: accessToken,
  });
  const res = await fetch(`${url}?${params}`, { method: 'POST' });
  const data = await res.json();
  if (data.error) { console.error(`   ❌ Erro IG: ${data.error.message}`); return null; }
  return data.id;
}

async function createCarouselContainer(igAccountId, childrenIds, caption, accessToken) {
  const url = `https://graph.facebook.com/v21.0/${igAccountId}/media`;
  const params = new URLSearchParams({
    media_type: 'CAROUSEL', children: childrenIds.join(','), caption, access_token: accessToken,
  });
  const res = await fetch(`${url}?${params}`, { method: 'POST' });
  const data = await res.json();
  if (data.error) { console.error(`   ❌ Erro IG: ${data.error.message}`); return null; }
  return data.id;
}

async function checkContainerStatus(containerId, accessToken) {
  const url = `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${accessToken}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.status_code;
}

async function publishContainer(igAccountId, containerId, accessToken) {
  const url = `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`;
  const params = new URLSearchParams({ creation_id: containerId, access_token: accessToken });
  const res = await fetch(`${url}?${params}`, { method: 'POST' });
  const data = await res.json();
  if (data.error) { console.error(`   ❌ Erro publicação: ${data.error.message}`); return null; }
  return data.id;
}

// ============================================================
// FLUXO PRINCIPAL
// ============================================================

async function main() {
  console.log('');
  console.log('============================================================');
  console.log(`  📱 TINA v2.1 — Publisher (IG) — ${IS_DRY_RUN ? '🧪 DRY-RUN' : '🔴 LIVE'}`);
  console.log('============================================================');
  if (IS_DRY_RUN) {
    console.log('  🧪 MODO DRY-RUN — não publica de verdade.');
    console.log('  Para publicar: node scripts/tina.js --live');
  } else {
    console.log('  🔴 MODO LIVE — VAI PUBLICAR DE VERDADE!');
  }
  console.log('');

  // 1. Detectar task
  console.log('[TINA] Buscando sub-task pendente...');
  const { data: myTask, error: taskErr } = await supabase
    .from('tasks').select('*')
    .eq('agent_id', AGENT_IDS.tina)
    .eq('status', 'pending')
    .eq('type', 'publishing')
    .order('created_at', { ascending: false })
    .limit(1).single();

  if (taskErr || !myTask) {
    console.log('   ℹ️  Nenhuma sub-task pendente.');
    return;
  }
  console.log(`   Task: ${myTask.id}`);
  console.log(`   Marca: ${myTask.brand}`);

  // 2. CHECK LOCK (P0): bloqueio de publicação?
  if (IS_LIVE) {
    console.log('');
    console.log('[TINA] 🔒 Verificando lock de publicação...');
    const lock = await checkPublishingLock(myTask.brand);
    if (lock.locked) {
      console.log('   🚨 PUBLICAÇÃO BLOQUEADA:');
      console.log(`   ${lock.reason.substring(0, 200)}...`);
      console.log('');
      console.log('   ⚠️  Pra liberar: gravar memória de unlock ou usar DRY-RUN.');
      console.log('   Modo DRY-RUN: node scripts/tina.js (sem flag)');
      return;
    }
    console.log('   ✅ Sem lock ativo');
  }

  console.log('');

  if (IS_LIVE) {
    await supabase.from('tasks').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', myTask.id);
    await supabase.from('agents').update({ status: 'working' }).eq('id', AGENT_IDS.tina);
  }

  // 3. Carregar contexto
  console.log('[TINA] Carregando contexto em camadas...');
  const soulMd = loadFile('tina/SOUL.md');
  const skillPub = loadFile('tina/skills/publicacao-instagram.md');
  const brandGuide = loadFile(BRAND_GUIDES[myTask.brand] || '');
  console.log(`   SOUL.md: ${soulMd.length} chars`);
  console.log(`   publicacao-instagram.md: ${skillPub.length} chars`);
  console.log(`   Brand Guide: ${brandGuide.length} chars`);

  // 4. Output aprovado
  const outputId = myTask.input?.output_id;
  if (!outputId) { console.error('❌ Sem output_id'); return; }

  const { data: output } = await supabase.from('outputs').select('*').eq('id', outputId).single();
  if (!output || output.approval_status !== 'approved') {
    console.error(`❌ Output ${outputId} não aprovado (${output?.approval_status})`);
    return;
  }

  console.log('');
  console.log('[TINA] Output aprovado:');
  console.log(`   Output: ${output.id}`);
  console.log(`   Slides: ${output.total_slides}`);
  console.log(`   Título: ${output.title}`);

  // 5. Credenciais
  const credentials = await getCredentials(myTask.brand);
  if (!credentials) { console.error(`❌ Sem credenciais ${myTask.brand}`); return; }
  console.log(`   Conta IG: @${credentials.username}`);

  const envKey = `IG_TOKEN_${myTask.brand.replace(/-/g, '_').toUpperCase()}`;
  const accessToken = process.env[envKey];
  if (!accessToken) { console.error(`❌ Variável ${envKey} faltando no .env`); return; }
  console.log(`   Token: ${envKey} ✅`);
  console.log('');

  // 6. Validar URLs
  console.log('[TINA] Validando URLs públicas...');
  for (const url of output.file_urls) {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) { console.error(`❌ URL não acessível: ${url}`); return; }
  }
  console.log(`   ✅ ${output.file_urls.length} URLs OK`);

  // 7. FIX P0: Construir caption sem duplicar hashtags
  console.log('');
  console.log('[TINA] 🔧 Construindo caption (com fix anti-duplicação)...');
  const captionResult = buildCaption(myTask.input?.legenda, myTask.input?.hashtags);
  console.log(`   Decisão: ${captionResult.decision}`);
  console.log(`   Razão: ${captionResult.reason}`);
  console.log(`   Hashtags na legenda: ${captionResult.hashtags_in_legenda}`);
  console.log(`   Hashtags no array: ${captionResult.hashtags_in_array}`);
  console.log(`   Caption final: ${captionResult.caption.length} chars`);

  const finalCaption = captionResult.caption;

  // 8. PREVIEW PAYLOAD
  console.log('');
  console.log('============================================================');
  console.log('  📋 PAYLOAD QUE SERIA ENVIADO PRA GRAPH API:');
  console.log('============================================================');
  console.log(`  IG Account: @${credentials.username} (${credentials.instagram_account_id})`);
  console.log(`  Slides: ${output.file_urls.length}`);
  console.log('');
  console.log('  CAPTION FINAL:');
  console.log('  ' + '─'.repeat(56));
  finalCaption.split('\n').forEach(line => console.log(`  ${line}`));
  console.log('  ' + '─'.repeat(56));
  console.log(`  Total: ${finalCaption.length} chars | Hashtags: ${(finalCaption.match(/#\w+/g) || []).length}`);
  console.log('');

  // Sanity check final
  const totalHashtagsCaption = (finalCaption.match(/#\w+/g) || []).length;
  if (totalHashtagsCaption > 30) {
    console.error(`⚠️  ALERTA: ${totalHashtagsCaption} hashtags no caption (Instagram limita 30). Possível duplicação.`);
  } else {
    console.log(`✅ Sanity check hashtags: ${totalHashtagsCaption}/30 — OK`);
  }
  console.log('============================================================');
  console.log('');

  // 9. SE DRY-RUN, parar
  if (IS_DRY_RUN) {
    console.log('🧪 DRY-RUN COMPLETO — todas validações passaram');
    console.log('');
    console.log('  Pra publicar de verdade:');
    console.log(`  node scripts/tina.js --live`);
    console.log('');
    await recordMemory(
      `DRY-RUN executado pra "${output.title}" (${myTask.brand}, @${credentials.username}). Caption: ${finalCaption.length} chars, ${totalHashtagsCaption} hashtags. Decisão builder: ${captionResult.decision}.`,
      'pattern',
      { output_id: output.id, mode: 'dry-run', caption_decision: captionResult.decision, hashtags_count: totalHashtagsCaption }
    );
    await recordCost(myTask.id);
    return;
  }

  // 10. LIVE
  console.log('🔴 LIVE — Publicando no Instagram...');
  console.log('');
  console.log('  Etapa 1/3: Containers dos slides...');
  const childrenIds = [];
  for (let i = 0; i < output.file_urls.length; i++) {
    const containerId = await createMediaContainer(credentials.instagram_account_id, output.file_urls[i], accessToken);
    if (!containerId) return;
    childrenIds.push(containerId);
    console.log(`     Slide ${i + 1}: ${containerId}`);
    await sleep(1000);
  }

  console.log('  Etapa 2/3: Container do carrossel...');
  const carouselId = await createCarouselContainer(credentials.instagram_account_id, childrenIds, finalCaption, accessToken);
  if (!carouselId) return;
  console.log(`     Carrossel: ${carouselId}`);

  console.log('  Etapa 3/3: Aguardando processamento...');
  let status = 'IN_PROGRESS', attempts = 0;
  while (status === 'IN_PROGRESS' && attempts < 30) {
    await sleep(2000);
    status = await checkContainerStatus(carouselId, accessToken);
    attempts++;
    console.log(`     Tentativa ${attempts}: ${status}`);
  }
  if (status !== 'FINISHED') { console.error(`❌ Container: ${status}`); return; }

  console.log('  Publicando...');
  const igMediaId = await publishContainer(credentials.instagram_account_id, carouselId, accessToken);
  if (!igMediaId) return;

  console.log('');
  console.log(`   🎉 PUBLICADO! IG Media ID: ${igMediaId}`);
  console.log(`   🔗 https://www.instagram.com/p/${igMediaId}`);

  await supabase.from('outputs').update({
    published: true, published_at: new Date().toISOString(),
    platform: 'instagram', ig_media_id: igMediaId, status: 'published',
  }).eq('id', output.id);

  await supabase.from('calendar_entries').update({
    status: 'published', published_at: new Date().toISOString(),
    ig_media_id: igMediaId, output_id: output.id,
  }).eq('output_id', output.id);

  await supabase.from('tasks').update({
    status: 'completed',
    output: { ig_media_id: igMediaId, published_at: new Date().toISOString(), account: credentials.username },
    completed_at: new Date().toISOString(),
  }).eq('id', myTask.id);

  await recordMemory(
    `🔴 LIVE PUBLICATION no IG @${credentials.username} (${myTask.brand}): ${output.total_slides} slides. IG Media ID: ${igMediaId}. Caption: ${totalHashtagsCaption} hashtags (${captionResult.decision}).`,
    'decision',
    { output_id: output.id, ig_media_id: igMediaId, account: credentials.username, mode: 'live', caption_decision: captionResult.decision }
  );

  await recordCost(myTask.id);
  await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.tina);

  console.log('');
  console.log('============================================================');
  console.log('  📱 TINA v2.1 — PUBLICAÇÃO LIVE CONCLUÍDA');
  console.log('============================================================');
  console.log(`  Conta: @${credentials.username}`);
  console.log(`  IG Media ID: ${igMediaId}`);
  console.log('============================================================');
}

main().catch(err => { console.error('❌ Erro fatal:', err.message); process.exit(1); });
