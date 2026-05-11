#!/usr/bin/env node
// ============================================================
// LA HQ — luna.js v2 — Designer (Geração Visual)
// Sprint 1.5 — Refinado com SOUL + Skill + BG + Memória
// ============================================================
// Carregamento correto (Chat 1):
//   1. SEMPRE: SOUL.md ✅ (NOVO v2 — antes não tinha!)
//   2. PELA TASK: geracao-imagens.md ✅ (NOVO v2)
//   3. PELA MARCA: Brand Guide ✅ (NOVO v2)
//   4. SE PRECISAR: consulta semantic_memory ✅ (NOVO v2)
// ============================================================
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/lahq/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const AGENTS_DIR = '/home/lahq/agents';
const OFFICE_ID = 'a1b2c3d4-0001-4000-8000-000000000001';
const AGENT_IDS = {
  luna:  'c3d4e5f6-0003-4000-8000-000000000003',
  diego: 'c3d4e5f6-0004-4000-8000-000000000004',
  theo:  'c3d4e5f6-0006-4000-8000-000000000006',
};
const BRAND_GUIDES = {
  'la-music-school': 'shared/brands/brand-la-music-school.md',
  'la-music-kids':   'shared/brands/brand-la-music-kids.md',
  'sonoramente':     'shared/brands/brand-sonoramente.md',
};
function loadFile(relativePath) {
  const fullPath = path.join(AGENTS_DIR, relativePath);
  if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath, 'utf8');
  console.warn(`⚠️  Não encontrado: ${fullPath}`);
  return '';
}
async function generateImage(prompt, filepath) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  });
  const data = await res.json();
  if (data.error) { console.warn(`   ⚠️  Gemini: ${data.error.message}`); return null; }
  const img = (data.candidates?.[0]?.content?.parts || []).find(p => p.inlineData);
  if (!img) return null;
  fs.writeFileSync(filepath, Buffer.from(img.inlineData.data, 'base64'));
  return filepath;
}
async function recordMemory(content, category, metadata = {}) {
  await supabase.from('semantic_memory').insert({
    office_id: OFFICE_ID, agent_id: AGENT_IDS.luna,
    content, category, metadata, source: 'luna', relevance_score: 0.8,
  });
}
async function recordCost(taskId) {
  await supabase.from('agent_costs').insert({
    agent_id: AGENT_IDS.luna, provider: 'gemini', model: 'gemini-3-pro-image-preview',
    images_generated: 6, cost_usd: 0,
    period: new Date().toISOString().split('T')[0],
    operation_type: 'image_generation', task_id: taskId,
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
async function checkTheoCompleted(parentTaskId) {
  const { data } = await supabase.from('tasks')
    .select('status').eq('parent_task_id', parentTaskId).eq('agent_id', AGENT_IDS.theo).single();
  return data?.status === 'completed';
}
async function main() {
  console.log('');
  console.log('============================================================');
  console.log('  🖼️  LUNA v2 — Designer (Geração Visual)');
  console.log('============================================================');
  // 1. Detectar sub-task
  console.log('[LUNA] Buscando sub-task pendente...');
  const { data: myTask, error: taskErr } = await supabase
    .from('tasks').select('*')
    .eq('agent_id', AGENT_IDS.luna).eq('status', 'pending').eq('type', 'image_generation')
    .order('created_at', { ascending: true }).limit(1).single();
  if (taskErr || !myTask) {
    console.log('   ℹ️  Nenhuma sub-task pendente.');
    return;
  }
  console.log(`   Task: ${myTask.id} | Marca: ${myTask.brand}`);
  console.log('');
  await supabase.from('tasks').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', myTask.id);
  await supabase.from('agents').update({ status: 'working' }).eq('id', AGENT_IDS.luna);
  // v2 NOVO: Carregar contexto em camadas
  console.log('[LUNA] Carregando contexto em camadas...');
  const soulMd = loadFile('luna/SOUL.md');                              // Camada 1
  const skillGeracao = loadFile('luna/skills/geracao-imagens.md');       // Camada 2
  const brandGuide = loadFile(BRAND_GUIDES[myTask.brand] || '');        // Camada 3
  console.log(`   SOUL.md: ${soulMd.length} chars`);
  console.log(`   geracao-imagens.md: ${skillGeracao.length} chars`);
  console.log(`   Brand Guide: ${brandGuide.length} chars`);
  // v2 NOVO: Camada 5 — memórias
  console.log('[LUNA] Consultando memórias...');
  const memories = await fetchMemories(myTask.brand);
  console.log(`   ${memories.length} memória(s)`);
  // Ler prompts da Nina
  const imagePrompts = myTask.input?.image_prompts || [];
  console.log(`[LUNA] ${imagePrompts.length} prompts de imagem recebidos da Nina`);
  if (imagePrompts.length === 0) {
    console.log('   ⚠️  Nenhum prompt. Abortando.');
    await supabase.from('tasks').update({ status: 'pending' }).eq('id', myTask.id);
    await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.luna);
    return;
  }
  // Diretório de saída
  const outDir = path.join('/home/lahq/output', myTask.parent_task_id, 'images');
  fs.mkdirSync(outDir, { recursive: true });
  const generatedAssets = [];
  for (const p of imagePrompts) {
    if (p.tema === 'cream' || p.tema === 'pink') {
      console.log(`   Slide ${p.slide} (${p.tema}): sem foto necessária`);
      continue;
    }
    // Fix 19/04/26 — evita chamar Gemini com prompt vazio (ex: slide CTA tipográfico)
    if (!p.prompt || p.prompt.trim() === '') {
      console.log(`   Slide ${p.slide}: prompt vazio, pulando`);
      continue;
    }
    const filepath = path.join(outDir, `bg-${String(p.slide).padStart(2, '0')}.png`);
    console.log(`   Slide ${p.slide}: gerando...`);
    const result = await generateImage(p.prompt, filepath);
    if (result) {
      const fileSize = fs.statSync(filepath).size;
      console.log(`   ✅ OK (${(fileSize / 1024).toFixed(0)} KB)`);
      const storagePath = `${myTask.brand}/${myTask.parent_task_id}/bg-${String(p.slide).padStart(2, '0')}.png`;
      const buf = fs.readFileSync(filepath);
      await supabase.storage.from('outputs').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
      const { data: urlData } = supabase.storage.from('outputs').getPublicUrl(storagePath);
      const { data: asset } = await supabase.from('media_assets').insert({
        office_id: OFFICE_ID, brand: myTask.brand, type: 'background',
        file_url: urlData.publicUrl, source: 'ai_generated',
        prompt: p.prompt, model_used: 'gemini-3-pro-image-preview',
        tags: ['carrossel', 'background', `slide-${p.slide}`],
        width: 1080, height: 1350, aspect_ratio: '4:5',
        file_size: fileSize, created_by: 'luna',
      }).select().single();
      if (asset) generatedAssets.push({ slide: p.slide, asset_id: asset.id, url: urlData.publicUrl });
    } else {
      console.log(`   ❌ Falhou`);
    }
  }
  // Marcar completed
  await supabase.from('tasks').update({
    status: 'completed',
    output: { assets: generatedAssets, total_generated: generatedAssets.length },
    completed_at: new Date().toISOString(),
    model_used: 'gemini-3-pro-image-preview',
  }).eq('id', myTask.id);
  // Desbloquear Diego se Theo já terminou
  const theoCompleted = await checkTheoCompleted(myTask.parent_task_id);
  if (theoCompleted) {
    await supabase.from('tasks').update({ status: 'pending' })
      .eq('parent_task_id', myTask.parent_task_id).eq('agent_id', AGENT_IDS.diego);
    console.log('[LUNA] Theo OK → Diego desbloqueado');
  } else {
    console.log('[LUNA] Theo pendente → Diego aguarda');
  }
  // Memória + custo
  await recordMemory(
    `Geradas ${generatedAssets.length} imagens para "${myTask.input?.tema}" (${myTask.brand}). Modelo: Gemini 3 Pro.`,
    'decision', { task_id: myTask.id, parent_task_id: myTask.parent_task_id, assets: generatedAssets.map(a => a.asset_id) }
  );
  await recordCost(myTask.id);
  await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.luna);
  console.log('');
  console.log('============================================================');
  console.log(`  🖼️  LUNA v2 — ${generatedAssets.length} imagens geradas`);
  console.log('============================================================');
}
main().catch(err => { console.error('❌ Erro fatal:', err.message); process.exit(1); });
