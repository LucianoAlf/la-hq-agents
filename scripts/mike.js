#!/usr/bin/env node
// ============================================================
// LA HQ — mike.js v2 — Gerente do Departamento
// Sprint 1.5 — Refinado com Brand Guide + Memória
// ============================================================
// Carregamento correto (Chat 1):
//   1. SEMPRE: SOUL.md ✅ (v1 já tinha)
//   2. PELA TASK: coordenacao-demandas.md + calendario-editorial.md ✅
//   3. PELA MARCA: Brand Guide da marca do briefing ✅ (NOVO v2)
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
const SQUAD_ID = 'b2c3d4e5-0001-4000-8000-000000000001';

const AGENT_IDS = {
  mike:  'c3d4e5f6-0001-4000-8000-000000000001',
  nina:  'c3d4e5f6-0002-4000-8000-000000000002',
  luna:  'c3d4e5f6-0003-4000-8000-000000000003',
  diego: 'c3d4e5f6-0004-4000-8000-000000000004',
  carla: 'c3d4e5f6-0005-4000-8000-000000000005',
  theo:  'c3d4e5f6-0006-4000-8000-000000000006',
  tina:  'c3d4e5f6-0007-4000-8000-000000000007',
  atlas: 'c3d4e5f6-0008-4000-8000-000000000008',
};

const BRAND_GUIDES = {
  'la-music-school': 'shared/brand-guides/brand-la-music-school.md',
  'la-music-kids':   'shared/brand-guides/brand-la-music-kids.md',
  'sonoramente':     'shared/brand-guides/brand-sonoramente.md',
};

function loadFile(relativePath) {
  const fullPath = path.join(AGENTS_DIR, relativePath);
  if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath, 'utf8');
  console.warn(`⚠️  Arquivo não encontrado: ${fullPath}`);
  return '';
}

function callOpus(prompt) {
  const promptFile = '/tmp/mike-prompt.txt';
  fs.writeFileSync(promptFile, prompt);
  const t0 = Date.now();
  const result = spawnSync('sh', ['-c', `cat "${promptFile}" | claude -p - --output-format text`], {
    encoding: 'utf8', timeout: 120000, maxBuffer: 5 * 1024 * 1024, cwd: '/home/lahq'
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  try { fs.unlinkSync(promptFile); } catch (e) {}

  if (result.status !== 0) {
    console.error(`❌ Opus falhou (${dt}s):`, (result.stderr || '').substring(0, 200));
    return null;
  }
  let output = (result.stdout || '').trim();
  if (output.startsWith('```')) output = output.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();
  console.log(`   ✅ Opus respondeu em ${dt}s (${output.length} chars)`);
  return output;
}

async function recordMemory(agentId, content, category, metadata = {}) {
  await supabase.from('semantic_memory').insert({
    office_id: OFFICE_ID, agent_id: agentId,
    content, category, metadata, source: 'mike', relevance_score: 0.8,
  });
}

async function recordCost(agentId, taskId, tokens) {
  await supabase.from('agent_costs').insert({
    agent_id: agentId, provider: 'claude', model: 'opus-4.6',
    tokens_input: tokens, tokens_output: Math.round(tokens * 0.3),
    cost_usd: 0, period: new Date().toISOString().split('T')[0],
    operation_type: 'coordination', task_id: taskId,
  });
}

// v2 NOVO: consultar memórias
async function fetchMemories(limit = 5) {
  const { data } = await supabase.from('semantic_memory')
    .select('content, category')
    .eq('office_id', OFFICE_ID)
    .or('category.eq.feedback,category.eq.pattern,category.eq.learning,category.eq.decision')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

async function main() {
  let briefing = process.argv.slice(2).join(' ');
  if (!briefing) {
    console.log('Uso: node mike.js "Carrossel sobre palhetada alternada para LA Music School"');
    process.exit(1);
  }

  console.log('');
  console.log('============================================================');
  console.log('  🎩 MIKE v2 — Gerente do Departamento');
  console.log('============================================================');
  console.log(`  📋 Briefing: "${briefing}"`);
  console.log('');

  await supabase.from('agents').update({ status: 'working' }).eq('id', AGENT_IDS.mike);

  // Camada 1: SOUL
  console.log('[MIKE] Carregando contexto em camadas...');
  const soulMd = loadFile('mike/SOUL.md');
  const skillCoord = loadFile('mike/skills/coordenacao-demandas.md');
  const skillCalendario = loadFile('mike/skills/calendario-editorial.md');
  console.log(`   SOUL: ${soulMd.length} chars | Skills: ${skillCoord.length + skillCalendario.length} chars`);

  // v2 NOVO: Camada 5 — memórias
  console.log('[MIKE] Consultando memórias...');
  const memories = await fetchMemories();
  const memCtx = memories.length > 0
    ? `\nAPRENDIZADOS E PADRÕES ANTERIORES:\n${memories.map(m => `- [${m.category}] ${m.content}`).join('\n')}`
    : '';
  console.log(`   ${memories.length} memória(s)`);

  // Primeiro: Opus analisa o briefing pra identificar marca (precisa antes de carregar BG)
  console.log('[MIKE] Opus analisando briefing...');
  const analysisPrompt = `${soulMd}

SKILLS:
${skillCoord}
${skillCalendario}
${memCtx}

BRIEFING RECEBIDO:
"${briefing}"

Analise o briefing e responda em JSON puro (sem markdown, sem crases):
{
  "tipo": "carousel" ou "story" ou "post" ou "reel" ou "newsletter",
  "marca": "la-music-school" ou "la-music-kids" ou "sonoramente",
  "tema": "tema extraído do briefing",
  "titulo_calendario": "título curto pro calendário editorial",
  "total_slides": número (6 para carousel, 1 para post, etc),
  "agentes_necessarios": ["nina", "luna", "theo", "diego", "tina"],
  "prioridade": "low" ou "medium" ou "high" ou "urgent",
  "notas": "observações do Mike"
}`;

  const analysisRaw = callOpus(analysisPrompt);
  if (!analysisRaw) {
    await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.mike);
    process.exit(1);
  }

  let analysis;
  try {
    analysis = JSON.parse(analysisRaw);
  } catch (e) {
    console.error('❌ JSON inválido:', analysisRaw.substring(0, 300));
    await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.mike);
    process.exit(1);
  }

  // v2 NOVO: Camada 3 — Brand Guide (agora que sabemos a marca)
  const brandGuide = loadFile(BRAND_GUIDES[analysis.marca] || '');
  console.log(`   Brand Guide (${analysis.marca}): ${brandGuide.length} chars`);

  console.log(`   Tipo: ${analysis.tipo} | Marca: ${analysis.marca}`);
  console.log(`   Tema: ${analysis.tema} | Slides: ${analysis.total_slides}`);
  console.log(`   Prioridade: ${analysis.prioridade}`);
  console.log(`   Agentes: ${analysis.agentes_necessarios.join(', ')}`);
  console.log('');

  // Criar task principal
  console.log('[MIKE] Criando task principal...');
  const { data: mainTask, error: taskErr } = await supabase.from('tasks').insert({
    agent_id: AGENT_IDS.mike, squad_id: SQUAD_ID,
    type: analysis.tipo, brand: analysis.marca,
    input: { briefing, tema: analysis.tema, total_slides: analysis.total_slides, analysis },
    status: 'in_progress', priority: analysis.prioridade,
    model_used: 'opus-4.6', started_at: new Date().toISOString(),
  }).select().single();

  if (taskErr) { console.error('❌ Erro:', taskErr.message); process.exit(1); }
  console.log(`   Task ID: ${mainTask.id}`);

  // Criar sub-tasks
  console.log('[MIKE] Criando sub-tasks...');
  const subTaskOrder = ['nina', 'luna', 'theo', 'diego', 'tina'];
  const subTasks = {};
  const subTaskTypes = {
    nina: 'creative_direction', luna: 'image_generation',
    theo: 'copywriting', diego: 'layout_assembly', tina: 'publishing',
  };

  for (const agentName of subTaskOrder) {
    if (!analysis.agentes_necessarios.includes(agentName)) continue;

    const { data: subTask, error: subErr } = await supabase.from('tasks').insert({
      agent_id: AGENT_IDS[agentName], squad_id: SQUAD_ID,
      parent_task_id: mainTask.id, type: subTaskTypes[agentName],
      brand: analysis.marca,
      input: { briefing, tema: analysis.tema, total_slides: analysis.total_slides, parent_task_id: mainTask.id },
      status: agentName === 'nina' ? 'pending' : 'blocked',
      priority: analysis.prioridade,
    }).select().single();

    if (subErr) { console.warn(`   ⚠️  ${agentName}: ${subErr.message}`); continue; }
    subTasks[agentName] = subTask.id;
    console.log(`   ${agentName}: ${subTask.id} → ${agentName === 'nina' ? 'pending' : 'blocked'}`);
  }

  // Calendário
  console.log('[MIKE] Calendário editorial...');
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 2);

  const { data: calEntry } = await supabase.from('calendar_entries').insert({
    office_id: OFFICE_ID, brand: analysis.marca,
    title: analysis.titulo_calendario, content_type: analysis.tipo,
    scheduled_date: scheduledDate.toISOString(), status: 'in_production',
    notes: analysis.notas, created_by: 'mike',
  }).select().single();
  console.log(`   Calendário: ${calEntry?.id || 'erro'}`);

  // Memória + custo
  await recordMemory(AGENT_IDS.mike,
    `Briefing: "${briefing}". Análise: tipo=${analysis.tipo}, marca=${analysis.marca}, tema=${analysis.tema}, ${analysis.total_slides} slides. Sub-tasks: ${analysis.agentes_necessarios.join(', ')}. Prioridade: ${analysis.prioridade}.`,
    'decision', { task_id: mainTask.id, sub_tasks: subTasks }
  );
  await recordCost(AGENT_IDS.mike, mainTask.id, 2000);
  await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.mike);

  console.log('   ✅ Memória + custo gravados');
  console.log('');
  console.log('============================================================');
  console.log('  🎩 MIKE v2 — DISTRIBUIÇÃO CONCLUÍDA');
  console.log('============================================================');
  console.log(`  Task: ${mainTask.id} | ${analysis.tipo} | ${analysis.marca}`);
  console.log(`  Sub-tasks: ${Object.keys(subTasks).length}`);
  console.log('  🔜 Próximo: node scripts/nina.js');
  console.log('============================================================');
}

main().catch(err => { console.error('❌ Erro fatal:', err.message); process.exit(1); });
