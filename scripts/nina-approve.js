#!/usr/bin/env node
// ============================================================
// LA HQ — nina-approve.js v2 — Validação de Qualidade
// Sprint 1.5 — COM REGRAS DE CONSISTÊNCIA
// ============================================================
// v2 adiciona (anti-loop perfeccionismo):
//   1. Slide aprovado (ok:true) em revisão anterior → INTOCÁVEL
//   2. Score mínimo APPROVE = 7/10 (publicável, não perfeito)
//   3. Após 2 ciclos de revisão → escalation_to_human automático
//   4. Detecta drift de critério (Nina mudando de opinião)
//   5. Loga drift em semantic_memory pra refinamento futuro
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
  nina:  'c3d4e5f6-0002-4000-8000-000000000002',
  diego: 'c3d4e5f6-0004-4000-8000-000000000004',
  luna:  'c3d4e5f6-0003-4000-8000-000000000003',
  theo:  'c3d4e5f6-0006-4000-8000-000000000006',
  tina:  'c3d4e5f6-0007-4000-8000-000000000007',
};
const BRAND_GUIDES = {
  'la-music-school': 'shared/brand-guides/brand-la-music-school.md',
  'la-music-kids':   'shared/brand-guides/brand-la-music-kids.md',
  'sonoramente':     'shared/brand-guides/brand-sonoramente.md',
};
// REGRAS DE CONSISTÊNCIA (anti-loop)
const APPROVE_MIN_SCORE = 7;
const MAX_REVISION_CYCLES = 2;
// ============================================================
// UTILITÁRIOS
// ============================================================
function loadFile(relativePath) {
  const fullPath = path.join(AGENTS_DIR, relativePath);
  if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath, 'utf8');
  console.warn(`   ⚠️  Não encontrado: ${fullPath}`);
  return '';
}
function callOpus(prompt) {
  const promptFile = `/tmp/nina-approve-${Date.now()}.txt`;
  fs.writeFileSync(promptFile, prompt);
  const t0 = Date.now();
  // Passa prompt como arquivo + paths de imagem referenciados dentro do texto
  const cmd = `claude -p --output-format text < "${promptFile}"`.trim();
  const result = spawnSync('sh', ['-c', cmd], {
    encoding: 'utf8', timeout: 240000, maxBuffer: 10 * 1024 * 1024, cwd: '/home/lahq'
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  try { fs.unlinkSync(promptFile); } catch (e) {}
  if (result.status !== 0) {
    console.error(`   ❌ Opus falhou (${dt}s):`, (result.stderr || '').substring(0, 200));
    return null;
  }
  let output = (result.stdout || '').trim();
  if (output.startsWith('```')) output = output.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();
  console.log(`   ✅ Opus respondeu em ${dt}s (${output.length} chars)`);
  return output;
}
async function recordMemory(content, category, metadata = {}) {
  await supabase.from('semantic_memory').insert({
    office_id: OFFICE_ID, agent_id: AGENT_IDS.nina,
    content, category, metadata, source: 'nina-approve', relevance_score: 0.95,
  });
}
async function recordCost(taskId, tokens) {
  await supabase.from('agent_costs').insert({
    agent_id: AGENT_IDS.nina, provider: 'claude', model: 'opus-4.6',
    tokens_input: tokens, tokens_output: Math.round(tokens * 0.3),
    cost_usd: 0, period: new Date().toISOString().split('T')[0],
    operation_type: 'approval', task_id: taskId,
  });
}
async function fetchMemories() {
  const { data } = await supabase.from('semantic_memory')
    .select('content, category')
    .eq('office_id', OFFICE_ID)
    .or('category.eq.feedback,category.eq.pattern,category.eq.learning')
    .order('created_at', { ascending: false })
    .limit(8);
  return data || [];
}
// REGRA D1 + D2 + D3: Carregar histórico de revisões
async function loadRevisionHistory(parentTaskId) {
  // Buscar todas tasks de revisão anteriores deste parent
  const { data: revisionTasks } = await supabase.from('tasks')
    .select('id, input, created_at, status')
    .eq('parent_task_id', parentTaskId)
    .eq('type', 'revision')
    .order('created_at', { ascending: true });
  const cycles = revisionTasks?.length || 0;
  const approvedSlidesEver = new Set(); // slides que JÁ foram ok:true em algum momento
  // Compilar slides que já foram aprovados em qualquer revisão anterior
  for (const task of (revisionTasks || [])) {
    const fps = task.input?.feedback_por_slide || [];
    for (const fp of fps) {
      if (fp.ok === true) approvedSlidesEver.add(fp.slide);
    }
  }
  return {
    cycles,
    approvedSlidesEver: Array.from(approvedSlidesEver).sort((a, b) => a - b),
    lastRevisionFeedback: revisionTasks?.[revisionTasks.length - 1]?.input?.feedback_por_slide || [],
  };
}
// ============================================================
// FLUXO PRINCIPAL
// ============================================================
async function main() {
  console.log('');
  console.log('============================================================');
  console.log('  🎨 NINA — Aprovação de Output v2 (com regras)');
  console.log('============================================================');
  // 1. Buscar output ready_for_review (MAIS RECENTE primeiro)
  console.log('[NINA-APPROVE] Buscando output pra avaliar...');
  const { data: output, error: outErr } = await supabase
    .from('outputs').select('*')
    .eq('approval_status', 'pending_review')
    .eq('status', 'ready_for_review')
    .order('created_at', { ascending: false })  // mais recente primeiro
    .limit(1).single();
  if (outErr || !output) {
    console.log('   ℹ️  Nenhum output aguardando aprovação.');
    return;
  }
  console.log(`   Output: ${output.id}`);
  console.log(`   Tipo: ${output.type} | Marca: ${output.brand}`);
  console.log(`   Slides: ${output.total_slides}`);
  console.log(`   Título: ${output.title}`);
  // 2. CARREGAR HISTÓRICO DE REVISÕES (regras D)
  console.log('');
  console.log('[NINA-APPROVE] Aplicando regras de consistência...');
  const history = await loadRevisionHistory(output.task_id);
  console.log(`   Ciclos de revisão anteriores: ${history.cycles}`);
  console.log(`   Slides já aprovados antes: [${history.approvedSlidesEver.join(', ') || 'nenhum'}]`);
  // REGRA D3: Após 2 ciclos → escalation
  if (history.cycles >= MAX_REVISION_CYCLES) {
    console.log('');
    console.log(`   🚨 LIMITE DE ${MAX_REVISION_CYCLES} REVISÕES ATINGIDO`);
    console.log('   → Forçando ESCALATION_TO_HUMAN automaticamente');
    await supabase.from('outputs').update({
      approval_status: 'pending_review',
      status: 'ready_for_review',
      approval_feedback: JSON.stringify({
        decision: 'ESCALATE_TO_HUMAN',
        reason: `Limite de ${MAX_REVISION_CYCLES} ciclos de revisão atingido. Esperando aprovação humana.`,
        cycles: history.cycles,
        slides_aprovados_historicamente: history.approvedSlidesEver,
      }),
    }).eq('id', output.id);
    await recordMemory(
      `ESCALATION: Output ${output.id} (${output.brand}) atingiu ${history.cycles} ciclos de revisão. Aprovação automática suspensa, esperando humano. Slides historicamente aprovados: [${history.approvedSlidesEver.join(', ')}].`,
      'pattern',
      { output_id: output.id, cycles: history.cycles, escalated: true }
    );
    console.log('   ✅ Escalation gravada na memória');
    console.log('');
    console.log('  ⚠️  AÇÃO NECESSÁRIA: revisar manualmente no banco ou aprovar via SQL:');
    console.log(`     UPDATE outputs SET approval_status='approved' WHERE id='${output.id}';`);
    return;
  }
  // 3. Status working
  await supabase.from('agents').update({ status: 'working' }).eq('id', AGENT_IDS.nina);
  // 4. Carregar contexto em camadas
  console.log('');
  console.log('[NINA-APPROVE] Carregando contexto em camadas...');
  const soulMd = loadFile('nina/SOUL.md');
  const skillAprovacao = loadFile('nina/skills/aprovacao-outputs.md');
  const checklistVisual = loadFile('shared/checklists/checklist-qualidade-visual.md');
  const brandGuide = loadFile(BRAND_GUIDES[output.brand] || '');
  console.log(`   SOUL.md: ${soulMd.length} chars`);
  console.log(`   aprovacao-outputs.md: ${skillAprovacao.length} chars`);
  console.log(`   checklist-qualidade-visual.md: ${checklistVisual.length} chars`);
  console.log(`   Brand Guide: ${brandGuide.length} chars`);
  // 5. Memórias
  const memories = await fetchMemories();
  const memCtx = memories.length > 0
    ? `\nMEMÓRIAS RELEVANTES:\n${memories.map(m => `- [${m.category}] ${m.content}`).join('\n')}`
    : '';
  console.log(`[NINA-APPROVE] ${memories.length} memória(s) consultadas`);
  // 6. Buscar contexto da produção (Nina dir + Theo copy)
  const { data: parentTask } = await supabase.from('tasks')
    .select('*').eq('id', output.task_id).single();
  const { data: ninaTask } = await supabase.from('tasks')
    .select('output').eq('parent_task_id', output.task_id)
    .eq('type', 'creative_direction').single();
  const { data: theoTask } = await supabase.from('tasks')
    .select('output').eq('parent_task_id', output.task_id)
    .eq('type', 'copywriting').single();
  const ninaDirection = ninaTask?.output?.direction || {};
  const theoCopy = theoTask?.output || {};
  // 7. Baixar PNGs
  console.log('[NINA-APPROVE] Baixando slides do Storage...');
  const reviewDir = `/home/lahq/output/${output.task_id}/review-cycle-${history.cycles + 1}`;
  fs.mkdirSync(reviewDir, { recursive: true });
  const slidesInfo = [];
  for (let i = 0; i < output.file_urls.length; i++) {
    const url = output.file_urls[i];
    const slideNum = i + 1;
    const localPath = `${reviewDir}/slide-${String(slideNum).padStart(2, '0')}.png`;
    try {
      const res = await fetch(url);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(localPath, buf);
      const sizeKB = (buf.length / 1024).toFixed(0);
      console.log(`   Slide ${slideNum}: ${sizeKB} KB ${history.approvedSlidesEver.includes(slideNum) ? '🔒 INTOCÁVEL' : ''}`);
      slidesInfo.push({ slide: slideNum, path: localPath, size_kb: parseInt(sizeKB), url });
    } catch (e) {
      console.log(`   Slide ${slideNum}: ❌ erro ao baixar`);
    }
  }
  console.log('');
  // 8. AVALIAR — prompt com REGRAS DURAS
  console.log('[NINA-APPROVE] Avaliando carrossel com Opus 4.6 + regras de consistência...');
  const consistencyBlock = history.approvedSlidesEver.length > 0 ? `
=========================================================
🔒 REGRAS DURAS DE CONSISTÊNCIA (NÃO PODE QUEBRAR) 🔒
=========================================================
CICLO ATUAL DE REVISÃO: ${history.cycles + 1} de ${MAX_REVISION_CYCLES + 1} máximos.
SLIDES QUE FORAM APROVADOS POR VOCÊ EM REVISÕES ANTERIORES (INTOCÁVEIS):
[${history.approvedSlidesEver.join(', ')}]
REGRA INVIOLÁVEL: Esses slides já foram marcados "ok: true" por você antes.
Você NÃO pode marcar ok:false neles agora — isso é DRIFT DE CRITÉRIO e quebra o sistema.
Se você acha que tem algo a melhorar neles, deve marcar "ok": true mesmo assim e mencionar
no campo "observacoes" que "já aprovado em revisão anterior — mantido por regra de consistência".
Você só pode REPROVAR slides que NÃO estão na lista acima.
REGRAS DE DECISÃO FINAL:
- Score >= ${APPROVE_MIN_SCORE}/10 → APPROVE (publicável, não precisa ser perfeito)
- Score < ${APPROVE_MIN_SCORE}/10 → REVISE (com feedback específico apenas em slides não-aprovados)
- Score < 5/10 → REJECT (problema estrutural)
Lembre-se: 7/10 é um bom carrossel. 10/10 não existe.
=========================================================
` : `
=========================================================
PRIMEIRA AVALIAÇÃO (sem histórico de aprovações)
=========================================================
Score >= ${APPROVE_MIN_SCORE}/10 → APPROVE
Score < ${APPROVE_MIN_SCORE}/10 → REVISE
=========================================================
`;
  const reviewPrompt = `${soulMd}
SKILL ATIVA — APROVAÇÃO DE OUTPUTS:
${skillAprovacao}
CHECKLIST DE QUALIDADE VISUAL:
${checklistVisual}
BRAND GUIDE — ${output.brand}:
${brandGuide}
${memCtx}
${consistencyBlock}
CONTEXTO DO CARROSSEL:
- Tema: ${parentTask?.input?.tema || 'N/A'}
- Marca: ${output.brand}
- Conceito (Nina anterior): ${ninaDirection.conceito_geral || 'N/A'}
- Tom visual: ${ninaDirection.tom_visual || 'N/A'}
- Total slides: ${output.total_slides}
ESTRUTURA ESPERADA:
${(ninaDirection.slides || []).map(s => `Slide ${s.numero} (${s.tipo}/${s.tema_slide}): ${s.titulo}`).join('\n')}
COPY APROVADO DO THEO:
${(theoCopy.slides || []).map(s => `Slide ${s.numero}: [${s.tag}] ${s.titulo} (destaque: ${s.palavra_destaque})`).join('\n')}
ARQUIVOS PRA REVISAR (paths reais — leia cada imagem):
${slidesInfo.map(s => `Slide ${s.slide}: ${s.path} (${s.size_kb} KB)${history.approvedSlidesEver.includes(s.slide) ? ' 🔒 INTOCÁVEL' : ''}`).join('\n')}

INSTRUÇÃO: Analise visualmente cada imagem nos paths acima. Verifique:
- Rosto da criança aparece inteiro ou está cortado?
- Fonte Madelina está sendo usada de forma protagonista (grande, destaque visual)?
- Blobs/formas decorativas estão sobre o rosto ou atrás?
- Hierarquia visual está clara?
=========================================================
🎯 SUA TAREFA — AVALIAR
=========================================================
Use Read tool pra inspecionar cada PNG.
Responda em JSON puro:
{
  "decision": "APPROVE" ou "REVISE" ou "REJECT",
  "score_geral": 0 a 10,
  "scores_por_categoria": {
    "aderencia_brand": 0 a 10,
    "qualidade_visual": 0 a 10,
    "hierarquia_tipografica": 0 a 10,
    "uso_design_system": 0 a 10,
    "variacao_composicao": 0 a 10,
    "legibilidade": 0 a 10
  },
  "pontos_fortes": ["3-5 items"],
  "pontos_fracos": ["3-5 items, APENAS em slides não-intocáveis"],
  "feedback_por_slide": [
    {
      "slide": 1,
      "ok": true ou false,
      "observacoes": "..."
    }
  ],
  "acao_recomendada": "se REVISE, quem refaz e o quê",
  "agente_a_refazer": "diego" ou "luna" ou "theo" ou null,
  "feedback_para_memoria": "aprendizado conciso"
}
LEMBRETE FINAL:
- Score 7+ = APPROVE (publicável)
- Slides intocáveis: SEMPRE ok:true
- Não busque perfeição, busque qualidade publicável.`;
  console.log(`   📸 Enviando paths das imagens no prompt...`);
  const reviewRaw = callOpus(reviewPrompt);
  if (!reviewRaw) {
    console.error('❌ Opus não respondeu.');
    await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.nina);
    return;
  }
  let review;
  try {
    review = JSON.parse(reviewRaw);
  } catch (e) {
    const jsonMatch = reviewRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { review = JSON.parse(jsonMatch[0]); } catch (e2) {
        console.error('❌ JSON inválido');
        await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.nina);
        return;
      }
    }
  }
  // 9. APLICAR REGRAS PÓS-AVALIAÇÃO
  console.log('');
  console.log('[NINA-APPROVE] Aplicando regras pós-avaliação...');
  // REGRA D1: Verificar drift e forçar ok:true em slides intocáveis
  let driftDetected = false;
  const driftedSlides = [];
  if (review.feedback_por_slide && history.approvedSlidesEver.length > 0) {
    review.feedback_por_slide = review.feedback_por_slide.map(f => {
      if (history.approvedSlidesEver.includes(f.slide) && f.ok === false) {
        driftDetected = true;
        driftedSlides.push(f.slide);
        return {
          ...f,
          ok: true,
          observacoes: `[DRIFT CORRIGIDO] Slide foi aprovado em revisão anterior. Critério mantido por regra de consistência. Observação original da Nina: ${f.observacoes}`,
        };
      }
      return f;
    });
  }
  if (driftDetected) {
    console.log(`   ⚠️  DRIFT DETECTADO: Nina tentou reprovar slides já aprovados [${driftedSlides.join(', ')}]`);
    console.log(`   → Corrigido automaticamente: forçado ok:true (regra D1)`);
    // Loga drift na memória
    await recordMemory(
      `DRIFT DETECTADO: Nina tentou reprovar slides [${driftedSlides.join(', ')}] que já tinha aprovado em revisão anterior. Sistema forçou ok:true por regra de consistência. Indício de instabilidade de critério LLM-as-judge.`,
      'pattern',
      { output_id: output.id, drifted_slides: driftedSlides, cycle: history.cycles + 1 }
    );
  }
  // REGRA D2 (fix 19/04/26): decisão final centrada em score, não no Opus
  //   - Score >= 7 → APPROVE (publicável)
  //   - Score <  7 → REVISE (sempre tenta refazer, respeitando MAX_REVISION_CYCLES)
  // Antes: REJECT do Opus arquivava e morria. Agora REJECT vira REVISE até o limite de ciclos.
  let finalDecision = review.decision;
  let decisionOverride = false;
  if (review.score_geral >= APPROVE_MIN_SCORE && review.decision !== 'APPROVE') {
    finalDecision = 'APPROVE';
    decisionOverride = true;
    console.log(`   ⚠️  OVERRIDE: Score ${review.score_geral}/10 >= ${APPROVE_MIN_SCORE} → forçando APPROVE (regra D2)`);
  } else if (review.score_geral < APPROVE_MIN_SCORE && review.decision !== 'REVISE') {
    finalDecision = 'REVISE';
    decisionOverride = true;
    console.log(`   ⚠️  OVERRIDE: Score ${review.score_geral}/10 < ${APPROVE_MIN_SCORE} → forçando REVISE (regra D2 — nunca REJECT/arquivar)`);
    // Se Opus não indicou agente_a_refazer (porque decidiu REJECT), default pra diego
    if (!review.agente_a_refazer) {
      review.agente_a_refazer = 'diego';
      console.log(`   ℹ️  agente_a_refazer não definido pelo Opus → default "diego"`);
    }
  }
  // 10. Log do resultado
  console.log('');
  console.log(`   Decisão Opus: ${review.decision}`);
  console.log(`   Decisão final: ${finalDecision}${decisionOverride ? ' (override)' : ''}`);
  console.log(`   Score geral: ${review.score_geral}/10`);
  if (review.scores_por_categoria) {
    console.log('   Scores:');
    Object.entries(review.scores_por_categoria).forEach(([k, v]) => console.log(`     ${k}: ${v}/10`));
  }
  if (review.pontos_fortes?.length) {
    console.log('   Pontos fortes:');
    review.pontos_fortes.forEach(p => console.log(`     ✅ ${p}`));
  }
  if (review.pontos_fracos?.length) {
    console.log('   Pontos fracos:');
    review.pontos_fracos.forEach(p => console.log(`     ⚠️  ${p}`));
  }
  console.log('');
  // 11. Aplicar decisão no banco
  let approvalStatus, outputStatus;
  if (finalDecision === 'APPROVE') {
    approvalStatus = 'approved';
    outputStatus = 'ready';
  } else if (finalDecision === 'REVISE') {
    approvalStatus = 'revision_requested';
    outputStatus = 'in_production';
  } else {
    approvalStatus = 'rejected';
    outputStatus = 'archived';
  }
  await supabase.from('outputs').update({
    approval_status: approvalStatus,
    approval_feedback: JSON.stringify({
      score_geral: review.score_geral,
      scores: review.scores_por_categoria,
      pontos_fortes: review.pontos_fortes,
      pontos_fracos: review.pontos_fracos,
      feedback_slides: review.feedback_por_slide,
      acao: review.acao_recomendada,
      decision_override: decisionOverride,
      drift_detected: driftDetected,
      cycle: history.cycles + 1,
    }),
    status: outputStatus,
  }).eq('id', output.id);
  // 12. Se REVISE, criar nova sub-task de revisão
  if (finalDecision === 'REVISE' && review.agente_a_refazer) {
    console.log(`[NINA-APPROVE] Criando task de revisão para ${review.agente_a_refazer} (ciclo ${history.cycles + 1})...`);
    const agentId = AGENT_IDS[review.agente_a_refazer];
    if (agentId) {
      await supabase.from('tasks').insert({
        agent_id: agentId,
        squad_id: 'b2c3d4e5-0001-4000-8000-000000000001',
        parent_task_id: output.task_id,
        type: 'revision',
        brand: output.brand,
        input: {
          original_output_id: output.id,
          feedback: review.acao_recomendada,
          feedback_por_slide: review.feedback_por_slide,
          pontos_fracos: review.pontos_fracos,
          cycle_number: history.cycles + 1,
          approved_slides_immutable: history.approvedSlidesEver,
        },
        status: 'pending',
        priority: 'high',
      });
      console.log(`   ✅ Task de revisão criada (ciclo ${history.cycles + 1}/${MAX_REVISION_CYCLES})`);
    }
  }
  // 13. Se APPROVE, desbloquear Tina
  if (finalDecision === 'APPROVE') {
    console.log('[NINA-APPROVE] Desbloqueando Tina pra publicação...');
    const { error: tinaErr } = await supabase.from('tasks')
      .update({
        status: 'pending',
        input: {
          output_id: output.id,
          file_urls: output.file_urls,
          legenda: theoCopy.legenda_instagram,
          hashtags: theoCopy.hashtags,
          brand: output.brand,
        }
      })
      .eq('parent_task_id', output.task_id)
      .eq('agent_id', AGENT_IDS.tina);
    console.log(`   ${tinaErr ? '❌ ' + tinaErr.message : '✅ Tina desbloqueada'}`);
  }
  // 14. Memória
  await recordMemory(
    `APROVAÇÃO ${finalDecision}${decisionOverride ? ' (override)' : ''} para "${parentTask?.input?.tema}" (${output.brand}). Score: ${review.score_geral}/10. Ciclo ${history.cycles + 1}/${MAX_REVISION_CYCLES + 1}. ${driftDetected ? `Drift corrigido em [${driftedSlides.join(',')}]. ` : ''}${review.feedback_para_memoria || ''}`,
    'feedback',
    {
      output_id: output.id,
      task_id: output.task_id,
      brand: output.brand,
      decision: finalDecision,
      decision_override: decisionOverride,
      drift_detected: driftDetected,
      score: review.score_geral,
      scores_por_categoria: review.scores_por_categoria,
      cycle: history.cycles + 1,
    }
  );
  // 15. Custo + status
  await recordCost(output.task_id, 12000);
  await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.nina);
  // RESUMO
  console.log('');
  console.log('============================================================');
  console.log(`  🎨 NINA — DECISÃO: ${finalDecision}${decisionOverride ? ' (override)' : ''}`);
  console.log('============================================================');
  console.log(`  Score: ${review.score_geral}/10 (mínimo APPROVE: ${APPROVE_MIN_SCORE})`);
  console.log(`  Ciclo: ${history.cycles + 1}/${MAX_REVISION_CYCLES + 1}`);
  if (driftDetected) console.log(`  ⚠️  Drift corrigido: slides [${driftedSlides.join(', ')}]`);
  console.log(`  Output: ${output.id} → ${approvalStatus}`);
  if (finalDecision === 'APPROVE') {
    console.log(`  ✅ Aprovado! Tina pode publicar.`);
    console.log('');
    console.log('  🔜 Próximo: node scripts/tina.js (em DRY-RUN por padrão)');
    console.log('     Pra publicação real: node scripts/tina.js --live');
  } else if (finalDecision === 'REVISE') {
    console.log(`  ⚠️  Revisão ${history.cycles + 1}/${MAX_REVISION_CYCLES} solicitada.`);
    console.log(`  Ação: ${review.acao_recomendada}`);
  }
  console.log('============================================================');
}
main().catch(err => { console.error('❌ Erro fatal:', err.message); process.exit(1); });
