#!/usr/bin/env node
// ============================================================
// LA HQ — theo.js v2 — Redator (Copy e Conteúdo)
// Sprint 1.5 — Refinado com Memória
// ============================================================
// Carregamento correto (Chat 1):
//   1. SEMPRE: SOUL.md ✅ (v1 já tinha)
//   2. PELA TASK: copy-redes-sociais.md + tom-de-voz-por-marca.md ✅
//   3. PELA MARCA: Brand Guide ✅ (v1 já tinha)
//   4. SE PRECISAR: consulta semantic_memory ✅ (NOVO v2)
// ============================================================

const { spawnSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/lahq/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const AGENTS_DIR = '/home/lahq/agents';

const OFFICE_ID = 'a1b2c3d4-0001-4000-8000-000000000001';
const AGENT_IDS = {
  luna:  'c3d4e5f6-0003-4000-8000-000000000003',
  diego: 'c3d4e5f6-0004-4000-8000-000000000004',
  theo:  'c3d4e5f6-0006-4000-8000-000000000006',
};

const BRAND_GUIDES = {
  'la-music-school': 'shared/brand-guides/brand-la-music-school.md',
  'la-music-kids':   'shared/brand-guides/brand-la-music-kids.md',
  'sonoramente':     'shared/brand-guides/brand-sonoramente.md',
};

function loadFile(relativePath) {
  const fullPath = path.join(AGENTS_DIR, relativePath);
  if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath, 'utf8');
  console.warn(`⚠️  Não encontrado: ${fullPath}`);
  return '';
}

function callOpus(prompt) {
  const promptFile = `/tmp/theo-prompt-${Date.now()}.txt`;
  fs.writeFileSync(promptFile, prompt);
  const t0 = Date.now();
  const result = spawnSync('sh', ['-c', `cat "${promptFile}" | claude -p - --output-format text`], {
    encoding: 'utf8', timeout: 120000, maxBuffer: 5 * 1024 * 1024, cwd: '/home/lahq'
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  try { fs.unlinkSync(promptFile); } catch (e) {}

  if (result.status !== 0) {
    console.error(`   ❌ Opus falhou (${dt}s)`);
    return null;
  }
  let output = (result.stdout || '').trim();
  if (output.startsWith('```')) output = output.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();
  console.log(`   ✅ Opus respondeu em ${dt}s (${output.length} chars)`);
  return output;
}

async function recordMemory(content, category, metadata = {}) {
  await supabase.from('semantic_memory').insert({
    office_id: OFFICE_ID, agent_id: AGENT_IDS.theo,
    content, category, metadata, source: 'theo', relevance_score: 0.8,
  });
}

async function recordCost(taskId, tokens) {
  await supabase.from('agent_costs').insert({
    agent_id: AGENT_IDS.theo, provider: 'claude', model: 'opus-4.6',
    tokens_input: tokens, tokens_output: Math.round(tokens * 0.4),
    cost_usd: 0, period: new Date().toISOString().split('T')[0],
    operation_type: 'copywriting', task_id: taskId,
  });
}

// v2 NOVO: consultar memórias
async function fetchMemories(brand) {
  const { data } = await supabase.from('semantic_memory')
    .select('content, category')
    .eq('office_id', OFFICE_ID)
    .or('category.eq.feedback,category.eq.pattern,category.eq.learning')
    .order('created_at', { ascending: false })
    .limit(5);
  return data || [];
}

async function checkLunaCompleted(parentTaskId) {
  const { data } = await supabase.from('tasks')
    .select('status').eq('parent_task_id', parentTaskId).eq('agent_id', AGENT_IDS.luna).single();
  return data?.status === 'completed';
}

async function main() {
  console.log('');
  console.log('============================================================');
  console.log('  ✍️  THEO v2 — Redator (Copy e Conteúdo)');
  console.log('============================================================');

  // 1. Detectar sub-task
  console.log('[THEO] Buscando sub-task pendente...');
  const { data: myTask, error: taskErr } = await supabase
    .from('tasks').select('*')
    .eq('agent_id', AGENT_IDS.theo).eq('status', 'pending').eq('type', 'copywriting')
    .order('created_at', { ascending: true }).limit(1).single();

  if (taskErr || !myTask) {
    console.log('   ℹ️  Nenhuma sub-task pendente.');
    return;
  }
  console.log(`   Task: ${myTask.id} | Marca: ${myTask.brand}`);
  console.log('');

  await supabase.from('tasks').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', myTask.id);
  await supabase.from('agents').update({ status: 'working' }).eq('id', AGENT_IDS.theo);

  // Carregar contexto em camadas
  console.log('[THEO] Carregando contexto em camadas...');
  const soulMd = loadFile('theo/SOUL.md');
  const skillCopy = loadFile('theo/skills/copy-redes-sociais.md');
  const skillTom = loadFile('theo/skills/tom-de-voz-por-marca.md');
  const brandGuide = loadFile(BRAND_GUIDES[myTask.brand] || '');

  console.log(`   SOUL: ${soulMd.length} chars | Skills: ${skillCopy.length + skillTom.length} chars`);
  console.log(`   Brand Guide: ${brandGuide.length} chars`);

  // v2 NOVO: Camada 5 — memórias
  console.log('[THEO] Consultando memórias...');
  const memories = await fetchMemories(myTask.brand);
  const memCtx = memories.length > 0
    ? `\nAPRENDIZADOS ANTERIORES:\n${memories.map(m => `- [${m.category}] ${m.content}`).join('\n')}`
    : '';
  console.log(`   ${memories.length} memória(s)`);

  // Ler briefing da Nina
  const copyBriefs = myTask.input?.copy_briefs || [];
  const ninaDirection = myTask.input?.nina_direction || {};
  console.log(`[THEO] ${copyBriefs.length} briefings | Conceito: ${ninaDirection.conceito_geral || 'N/A'}`);
  console.log('');

  // Opus refina copy (agora com memórias no prompt)
  console.log('[THEO] Refinando copy com Opus 4.6...');
  const copyPrompt = `${soulMd}

SKILLS:
${skillCopy}
${skillTom}

BRAND GUIDE (${myTask.brand}):
${brandGuide}
${memCtx}

DIREÇÃO CRIATIVA DA NINA:
Conceito: ${ninaDirection.conceito_geral || 'N/A'}
Tom visual: ${ninaDirection.tom_visual || 'N/A'}

BRIEFINGS DE COPY (rascunho da Nina):
${JSON.stringify(copyBriefs, null, 2)}

TAREFA:
Refine e aprimore o copy de cada slide. Escreva a LEGENDA COMPLETA do carrossel pra Instagram.

Responda em JSON puro (sem markdown, sem crases):
{
  "slides": [
    {
      "numero": 1,
      "titulo": "TÍTULO FINAL em uppercase",
      "palavra_destaque": "qual palavra em pink",
      "corpo": "texto do corpo refinado",
      "cta": "CTA se houver",
      "tag": "TAG DO BADGE"
    }
  ],
  "legenda_instagram": "Legenda completa com emojis e CTA (SEM hashtags — hashtags vão em campo separado)",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "notas": "observações do Theo"
}

REGRAS:
- Tom: educativo, acessível, motivador
- Títulos CURTOS (máx 3 palavras, Bebas Neue)
- Corpo conciso — cada slide é lido em 3-5s
- UMA palavra do título em destaque pink
- ⚠️ Legenda: NÃO incluir hashtags no texto da legenda — colocar APENAS no array "hashtags"
- Adequar ao tom de voz da marca ${myTask.brand}`;

  const copyRaw = callOpus(copyPrompt);
  if (!copyRaw) {
    await supabase.from('tasks').update({ status: 'pending' }).eq('id', myTask.id);
    await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.theo);
    return;
  }

  let refinedCopy;
  try {
    refinedCopy = JSON.parse(copyRaw);
  } catch (e) {
    const jsonMatch = copyRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { refinedCopy = JSON.parse(jsonMatch[0]); } catch (e2) {
        console.error('❌ JSON inválido');
        await supabase.from('tasks').update({ status: 'pending' }).eq('id', myTask.id);
        await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.theo);
        return;
      }
    }
  }

  console.log(`   Slides: ${refinedCopy.slides?.length || 0}`);
  refinedCopy.slides?.forEach(s => {
    console.log(`   ${s.numero}. [${s.tag}] ${s.titulo} (destaque: ${s.palavra_destaque})`);
  });
  console.log('');

  // Salvar
  await supabase.from('tasks').update({
    status: 'completed', output: refinedCopy,
    completed_at: new Date().toISOString(), model_used: 'opus-4.6',
  }).eq('id', myTask.id);

  // Desbloquear Diego
  const lunaCompleted = await checkLunaCompleted(myTask.parent_task_id);
  if (lunaCompleted) {
    await supabase.from('tasks').update({ status: 'pending' })
      .eq('parent_task_id', myTask.parent_task_id).eq('agent_id', AGENT_IDS.diego);
    console.log('[THEO] Luna OK → Diego desbloqueado');
  } else {
    console.log('[THEO] Luna pendente → Diego aguarda');
  }

  // Memória + custo
  await recordMemory(
    `Copy refinado para "${myTask.input?.tema}" (${myTask.brand}). ${refinedCopy.slides?.length || 0} slides. Legenda: ${refinedCopy.legenda_instagram?.length || 0} chars. Hashtags separadas do corpo da legenda.`,
    'decision', { task_id: myTask.id, parent_task_id: myTask.parent_task_id }
  );
  await recordCost(myTask.id, 4000);

  await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.theo);

  console.log('');
  console.log('============================================================');
  console.log('  ✍️  THEO v2 — COPY CONCLUÍDO');
  console.log('============================================================');
  console.log(`  Slides: ${refinedCopy.slides?.length || 0}`);
  console.log(`  Legenda: ${refinedCopy.legenda_instagram?.substring(0, 80) || 'N/A'}...`);
  console.log(`  Hashtags: ${refinedCopy.hashtags?.length || 0} (separadas da legenda)`);
  console.log('============================================================');
}

main().catch(err => { console.error('❌ Erro fatal:', err.message); process.exit(1); });
