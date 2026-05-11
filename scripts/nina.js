#!/usr/bin/env node
// ============================================================
// LA HQ — nina.js — Diretora Criativa
// Sprint 1.2 — Agente independente
// ============================================================
// Nina detecta sua sub-task pendente, carrega SOUL + skills +
// Brand Guide + Design System, usa Opus 4.6 pra pensar a
// direção criativa, gera briefings pra Luna/Theo/Diego,
// e grava tudo no Supabase.
// ============================================================

const { spawnSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/lahq/.env' });

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const AGENTS_DIR = '/home/lahq/agents';

const OFFICE_ID = 'a1b2c3d4-0001-4000-8000-000000000001';

const AGENT_IDS = {
  mike:  'c3d4e5f6-0001-4000-8000-000000000001',
  nina:  'c3d4e5f6-0002-4000-8000-000000000002',
  luna:  'c3d4e5f6-0003-4000-8000-000000000003',
  diego: 'c3d4e5f6-0004-4000-8000-000000000004',
  theo:  'c3d4e5f6-0006-4000-8000-000000000006',
  tina:  'c3d4e5f6-0007-4000-8000-000000000007',
};

// Mapas de recursos por marca
const BRAND_GUIDES = {
  'la-music-school': 'shared/brand-guides/brand-la-music-school.md',
  'la-music-kids':   'shared/brand-guides/brand-la-music-kids.md',
  'sonoramente':     'shared/brand-guides/brand-sonoramente.md',
};

const DESIGN_SYSTEMS = {
  'la-music-school': 'shared/design-systems/la-music-school-design-system-v2-abril-2026.html',
  'la-music-kids':   'shared/design-systems/la-music-kids-design-system.html',
  'sonoramente':     'shared/design-systems/sonoramente-design-system.html',
};

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

function loadFile(relativePath) {
  const fullPath = path.join(AGENTS_DIR, relativePath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, 'utf8');
  }
  console.warn(`⚠️  Arquivo não encontrado: ${fullPath}`);
  return '';
}

// Remove blocos base64 embedados do DS (fontes/imagens) pra não estourar context window do Opus.
// O Opus não precisa dos bytes binários — só das regras/classes/cores do HTML.
function stripBase64(html) {
  if (!html) return html;
  return html.replace(/data:[a-zA-Z0-9+/.\-]+;base64,[A-Za-z0-9+/=\s]+/g, '[base64 removido — ver arquivo HTML original]');
}

function callOpus(prompt, label = 'Opus') {
  const promptFile = `/tmp/nina-prompt-${Date.now()}.txt`;
  fs.writeFileSync(promptFile, prompt);

  const t0 = Date.now();
  console.log(`   🧠 ${label} pensando...`);

  const result = spawnSync('sh', ['-c', `cat "${promptFile}" | claude -p - --output-format text`], {
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 10 * 1024 * 1024,
    cwd: '/home/lahq'
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  // Limpar arquivo temporário
  try { fs.unlinkSync(promptFile); } catch (e) {}

  if (result.status !== 0) {
    console.error(`   ❌ ${label} falhou (${dt}s):`, (result.stderr || '').substring(0, 200));
    return null;
  }

  let output = (result.stdout || '').trim();
  if (output.startsWith('```')) output = output.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();

  console.log(`   ✅ ${label} respondeu em ${dt}s (${output.length} chars)`);
  return output;
}

async function recordMemory(content, category, metadata = {}) {
  const { error } = await supabase.from('semantic_memory').insert({
    office_id: OFFICE_ID,
    agent_id: AGENT_IDS.nina,
    content,
    category,
    metadata,
    source: 'nina',
    relevance_score: 0.9,
  });
  if (error) console.warn('   ⚠️  Erro ao gravar memória:', error.message);
}

async function recordCost(taskId, tokensEstimate) {
  const { error } = await supabase.from('agent_costs').insert({
    agent_id: AGENT_IDS.nina,
    provider: 'claude',
    model: 'opus-4.6',
    tokens_input: tokensEstimate,
    tokens_output: Math.round(tokensEstimate * 0.4),
    cost_usd: 0,
    period: new Date().toISOString().split('T')[0],
    operation_type: 'creative_direction',
    task_id: taskId,
  });
  if (error) console.warn('   ⚠️  Erro ao gravar custo:', error.message);
}

async function fetchPastMemories(brand, limit = 5) {
  const { data } = await supabase
    .from('semantic_memory')
    .select('content, category')
    .eq('office_id', OFFICE_ID)
    .or(`category.eq.feedback,category.eq.pattern,category.eq.learning`)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// ============================================================
// FLUXO DA NINA: DETECTAR TASK → DIREÇÃO CRIATIVA → BRIEFINGS
// ============================================================

async function main() {
  console.log('');
  console.log('============================================================');
  console.log('  🎨 NINA — Diretora Criativa');
  console.log('============================================================');

  // 1. Detectar sub-task pendente
  console.log('[NINA] Buscando sub-task pendente...');
  const { data: myTask, error: taskErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('agent_id', AGENT_IDS.nina)
    .eq('status', 'pending')
    .eq('type', 'creative_direction')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (taskErr || !myTask) {
    console.log('   ℹ️  Nenhuma sub-task pendente encontrada. Nina está livre.');
    return;
  }

  console.log(`   Task: ${myTask.id}`);
  console.log(`   Marca: ${myTask.brand}`);
  console.log(`   Tema: ${myTask.input?.tema || 'N/A'}`);
  console.log(`   Parent: ${myTask.parent_task_id}`);
  console.log('');

  // 2. Atualizar status
  await supabase.from('tasks').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', myTask.id);
  await supabase.from('agents').update({ status: 'working' }).eq('id', AGENT_IDS.nina);
  console.log('[NINA] Status: working');

  // 3. Carregar SOUL + skills + Brand Guide + Design System
  console.log('[NINA] Carregando contexto completo...');
  const soulMd = loadFile('nina/SOUL.md');
  const skillDirecao = loadFile('nina/skills/direcao-criativa.md');
  const skillEstruturacao = loadFile('nina/skills/estruturacao-conteudo.md');
  const skillBriefing = loadFile('nina/skills/briefing-criativo.md');

  const brandGuide = loadFile(BRAND_GUIDES[myTask.brand] || '');
  const designSystem = stripBase64(loadFile(DESIGN_SYSTEMS[myTask.brand] || ''));

  console.log(`   SOUL.md: ${soulMd.length} chars`);
  console.log(`   Skills: ${skillDirecao.length + skillEstruturacao.length + skillBriefing.length} chars`);
  console.log(`   Brand Guide: ${brandGuide.length} chars`);
  console.log(`   Design System: ${designSystem.length} chars`);

  // 4. Buscar memórias passadas relevantes
  console.log('[NINA] Consultando memórias anteriores...');
  const memories = await fetchPastMemories(myTask.brand);
  const memoriesContext = memories.length > 0
    ? `\n\nMEMÓRIAS RELEVANTES (aprendizados anteriores):\n${memories.map(m => `- [${m.category}] ${m.content}`).join('\n')}`
    : '\n\nNenhuma memória anterior registrada — esta é a primeira execução.';
  console.log(`   ${memories.length} memória(s) encontrada(s)`);

  // 5. OPUS PENSA A DIREÇÃO CRIATIVA
  console.log('');
  console.log('[NINA] Gerando direção criativa com Opus 4.6...');

  const directionPrompt = `${soulMd}

SKILLS:
${skillDirecao}
${skillEstruturacao}

BRAND GUIDE DA MARCA ${myTask.brand.toUpperCase()}:
${brandGuide}

DESIGN SYSTEM (referência visual completa):
${designSystem}
${memoriesContext}

BRIEFING DO MIKE:
Tema: ${myTask.input?.tema || myTask.input?.briefing}
Tipo: ${myTask.input?.briefing}
Total de slides: ${myTask.input?.total_slides || 6}
Marca: ${myTask.brand}

TAREFA:
Você é a Nina, Diretora Criativa da LA Music. Gere a DIREÇÃO CRIATIVA completa para este carrossel.

Responda em JSON puro (sem markdown, sem crases) com esta estrutura:
{
  "conceito_geral": "conceito criativo em uma frase",
  "tom_visual": "descrição do tom visual desejado",
  "paleta_destaque": "quais cores do DS priorizar neste carrossel",
  "slides": [
    {
      "numero": 1,
      "tipo": "capa",
      "tema_slide": "dark",
      "titulo": "PALHETADA ALTERNADA",
      "subtitulo": "subtítulo do slide",
      "conteudo": "descrição do conteúdo",
      "direcao_visual": "como o slide deve parecer visualmente",
      "luna_prompt": "prompt detalhado para geração de imagem de fundo (em inglês, incluindo 'no text no words no letters no logos no watermarks')",
      "theo_copy": {
        "titulo": "texto do título",
        "corpo": "texto do corpo",
        "cta": "texto do CTA se houver"
      }
    }
  ],
  "notas_diego": "instruções gerais para o Diego sobre layout, variação de composição, uso de componentes do DS",
  "notas_gerais": "observações adicionais"
}

REGRAS:
- SEMPRE 6 slides: capa + 4 conteúdo + CTA
- Alternar temas: slide 1=dark, 2=cream, 3=dark, 4=cream, 5=dark, 6=pink
- Cada slide DEVE ter composição visual diferente
- Usar EXCLUSIVAMENTE elementos visuais e cores da marca — NÃO hardcodar elementos de outras marcas (ex: diagonal pink é exclusivo da School, não usar em Kids ou SonoraMente)
- TEMAS DE SLIDE VÁLIDOS por marca: School = dark/cream/pink. Kids = dark/branco/amarelo/azul/vermelho. SonoraMente = dark/claro/roxo. NUNCA usar tema de outra marca (ex: NÃO usar "cream" em Kids — usar "branco")
- Palavra de destaque na COR PRIMÁRIA da marca conforme Brand Guide (não hardcodar hex aqui)
- Prompts da Luna em inglês, detalhados, estilo fotográfico cinemático real
- REGRA CRÍTICA para luna_prompt em slides de instrumento: a foto DEVE mostrar criança tocando o instrumento ou o instrumento claramente visível — não apenas criança posando. Exemplo correto: "young child aged 5-8 playing ukulele, hands on strings, ukulele visible, natural light, candid moment, no text no words no letters no logos no watermarks". Exemplo errado: "happy child smiling" (sem instrumento).
- Slide CTA (último): luna_prompt deve ser vazio ou null — CTA não precisa de foto, usa só identidade visual do DS
- Copy do Theo deve ser educativo e engajante, adequado ao tom da marca
- Instruções pro Diego devem mencionar variação de layout, componentes do DS da marca, e uso de Madelina GRANDE (80-120px) como destaque emocional nos slides Kids`;

  const directionRaw = callOpus(directionPrompt, 'Direção criativa');
  if (!directionRaw) {
    console.error('❌ Opus não respondeu. Abortando.');
    await supabase.from('tasks').update({ status: 'pending' }).eq('id', myTask.id);
    await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.nina);
    return;
  }

  let direction;
  try {
    direction = JSON.parse(directionRaw);
  } catch (e) {
    console.error('❌ Resposta não é JSON válido. Tentando extrair...');
    // Tentar extrair JSON de dentro de texto
    const jsonMatch = directionRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        direction = JSON.parse(jsonMatch[0]);
      } catch (e2) {
        console.error('❌ Não foi possível parsear JSON:', directionRaw.substring(0, 500));
        await supabase.from('tasks').update({ status: 'pending' }).eq('id', myTask.id);
        await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.nina);
        return;
      }
    }
  }

  console.log(`   Conceito: ${direction.conceito_geral}`);
  console.log(`   Tom visual: ${direction.tom_visual}`);
  console.log(`   Slides definidos: ${direction.slides?.length || 0}`);
  console.log('');

  // 6. Atualizar sub-tasks dos próximos agentes com os briefings
  console.log('[NINA] Distribuindo briefings para os agentes...');

  // Sub-task da Luna — imagens
  const { error: lunaErr } = await supabase.from('tasks')
    .update({
      status: 'pending',
      input: {
        ...myTask.input,
        nina_direction: {
          conceito_geral: direction.conceito_geral,
          tom_visual: direction.tom_visual,
          paleta_destaque: direction.paleta_destaque,
        },
        image_prompts: direction.slides?.map(s => ({
          slide: s.numero,
          tema: s.tema_slide,
          prompt: s.luna_prompt,
        })) || [],
      },
    })
    .eq('parent_task_id', myTask.parent_task_id)
    .eq('agent_id', AGENT_IDS.luna);
  console.log(`   Luna: ${lunaErr ? '❌ ' + lunaErr.message : '✅ briefing entregue, status → pending'}`);

  // Sub-task do Theo — copy
  const { error: theoErr } = await supabase.from('tasks')
    .update({
      status: 'pending',
      input: {
        ...myTask.input,
        nina_direction: {
          conceito_geral: direction.conceito_geral,
          tom_visual: direction.tom_visual,
        },
        copy_briefs: direction.slides?.map(s => ({
          slide: s.numero,
          tipo: s.tipo,
          titulo: s.theo_copy?.titulo,
          corpo: s.theo_copy?.corpo,
          cta: s.theo_copy?.cta,
        })) || [],
      },
    })
    .eq('parent_task_id', myTask.parent_task_id)
    .eq('agent_id', AGENT_IDS.theo);
  console.log(`   Theo: ${theoErr ? '❌ ' + theoErr.message : '✅ briefing entregue, status → pending'}`);

  // Sub-task do Diego — layout (fica blocked até Luna e Theo terminarem)
  const { error: diegoErr } = await supabase.from('tasks')
    .update({
      input: {
        ...myTask.input,
        nina_direction: direction,
        notas_diego: direction.notas_diego,
        slide_structure: direction.slides?.map(s => ({
          numero: s.numero,
          tipo: s.tipo,
          tema_slide: s.tema_slide,
          titulo: s.titulo,
          subtitulo: s.subtitulo,
          conteudo: s.conteudo,
          direcao_visual: s.direcao_visual,
        })) || [],
      },
    })
    .eq('parent_task_id', myTask.parent_task_id)
    .eq('agent_id', AGENT_IDS.diego);
  console.log(`   Diego: ${diegoErr ? '❌ ' + diegoErr.message : '✅ briefing entregue (aguarda Luna+Theo)'}`);

  // 7. Marcar task da Nina como completed
  await supabase.from('tasks').update({
    status: 'completed',
    output: {
      direction,
      slides_count: direction.slides?.length || 0,
    },
    completed_at: new Date().toISOString(),
    model_used: 'opus-4.6',
  }).eq('id', myTask.id);

  // 8. Gravar memória semântica
  console.log('');
  console.log('[NINA] Gravando memória semântica...');
  await recordMemory(
    `Direção criativa definida para carrossel "${myTask.input?.tema}" (${myTask.brand}). Conceito: "${direction.conceito_geral}". Tom visual: "${direction.tom_visual}". ${direction.slides?.length || 0} slides com temas alternados. Notas pro Diego: "${direction.notas_diego}".`,
    'decision',
    {
      task_id: myTask.id,
      parent_task_id: myTask.parent_task_id,
      brand: myTask.brand,
      conceito: direction.conceito_geral,
    }
  );
  console.log('   ✅ Memória gravada');

  // 9. Registrar custo
  await recordCost(myTask.id, 8000);
  console.log('   ✅ Custo registrado');

  // 10. Voltar status
  await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.nina);
  console.log('[NINA] Status: available');

  // RESUMO
  console.log('');
  console.log('============================================================');
  console.log('  🎨 NINA — DIREÇÃO CRIATIVA CONCLUÍDA');
  console.log('============================================================');
  console.log(`  Conceito: ${direction.conceito_geral}`);
  console.log(`  Tom visual: ${direction.tom_visual}`);
  console.log(`  Slides: ${direction.slides?.length || 0}`);
  direction.slides?.forEach(s => {
    console.log(`    ${s.numero}. [${s.tipo}/${s.tema_slide}] ${s.titulo}`);
  });
  console.log('');
  console.log(`  Briefings entregues:`);
  console.log(`    → Luna: ✅ (${direction.slides?.filter(s => s.luna_prompt).length || 0} prompts de imagem)`);
  console.log(`    → Theo: ✅ (copy pra ${direction.slides?.length || 0} slides)`);
  console.log(`    → Diego: ✅ (estrutura + notas de layout)`);
  console.log(`  Memória: ✅ | Custo: ✅`);
  console.log('');
  console.log('  🔜 Próximos: executar luna.js + theo.js (em paralelo)');
  console.log('     (Luna e Theo vão detectar suas sub-tasks com status "pending")');
  console.log('     Diego fica "blocked" até ambos terminarem.');
  console.log('============================================================');
}

main().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
