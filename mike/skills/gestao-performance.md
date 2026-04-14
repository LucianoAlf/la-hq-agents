---
name: gestao-performance
description: Skill para acompanhar KPIs de produção do time de Marketing, custos operacionais por agente, performance individual e do departamento. Use para gerar relatórios, identificar gargalos, medir produtividade e tomar decisões baseadas em dados sobre o time.
---

# Gestão de Performance

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| office_id | UUID | Contexto do tenant | Sim |
| período | string | Humano ou automático ("semana", "mês", "trimestre") | Sim |
| tipo_relatório | string | Humano ("resumo", "detalhado", "custos", "individual") | Não (default: "resumo") |
| agent_id | string | Humano (para relatório individual) | Não |
| marca | string | Humano (filtro por marca) | Não (default: todas) |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| relatório_performance | markdown | Humano (Alf) via reporte semanal |
| alertas_gargalo | lista | Mike → coordenação interna |
| alertas_custo | lista | Mike → decisão sobre modelos/assinaturas |
| ranking_agentes | tabela | Mike → reconhecimento e PDI |
| recomendações | lista | Mike → ações corretivas ou estratégicas |
| kpi_snapshot | registro | Supabase → tabela kpi_snapshots |

## Fases de Execução

### Fase 1 — Coletar Métricas de Produção
```sql
-- Peças produzidas por agente na semana
SELECT agent_id, COUNT(*) as total, type,
       COUNT(CASE WHEN approval_status = 'approved_first' THEN 1 END) as first_pass
FROM tasks 
WHERE office_id = $1
  AND status = 'completed'
  AND completed_at >= [início_semana]
GROUP BY agent_id, type
ORDER BY agent_id;

-- Tempo médio de produção por tipo de conteúdo
SELECT type, 
       AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600) as horas_media,
       MIN(EXTRACT(EPOCH FROM (completed_at - started_at))/3600) as horas_min,
       MAX(EXTRACT(EPOCH FROM (completed_at - started_at))/3600) as horas_max,
       COUNT(*) as total_peças
FROM tasks 
WHERE office_id = $1
  AND status = 'completed'
  AND completed_at >= [início_período]
GROUP BY type
ORDER BY horas_media DESC;

-- Peças por marca no período
SELECT brand, type, COUNT(*) as total,
       COUNT(CASE WHEN status = 'published' THEN 1 END) as publicadas
FROM tasks
WHERE office_id = $1
  AND created_at >= [início_período]
GROUP BY brand, type
ORDER BY brand, total DESC;

-- Tasks pendentes e bloqueadas (fila de produção)
SELECT agent_id, status, COUNT(*) as total,
       MIN(created_at) as mais_antiga
FROM tasks
WHERE office_id = $1
  AND status IN ('pending', 'in_progress', 'blocked')
GROUP BY agent_id, status
ORDER BY agent_id;
```

### Fase 2 — Coletar Custos Operacionais
```sql
-- Custo por agente no período (detalhado por provider)
SELECT agent_id, provider, 
       SUM(cost_usd) as custo_total,
       SUM(tokens_input + tokens_output) as tokens_total,
       SUM(images_generated) as imagens_total,
       COUNT(*) as chamadas_api
FROM agent_costs 
WHERE office_id = $1
  AND period >= [início_período]
GROUP BY agent_id, provider
ORDER BY custo_total DESC;

-- Custo por peça produzida (eficiência)
SELECT t.agent_id, t.type,
       COUNT(t.id) as peças,
       SUM(ac.cost_usd) as custo_total,
       SUM(ac.cost_usd) / NULLIF(COUNT(t.id), 0) as custo_por_peça
FROM tasks t
LEFT JOIN agent_costs ac ON ac.agent_id = t.agent_id 
  AND ac.period >= [início_período]
WHERE t.office_id = $1
  AND t.status = 'completed'
  AND t.completed_at >= [início_período]
GROUP BY t.agent_id, t.type
ORDER BY custo_por_peça DESC;

-- Consumo de assinaturas (% do limite)
SELECT provider, 
       SUM(cost_usd) as gasto_atual,
       -- Limites aproximados por assinatura
       CASE provider
         WHEN 'claude' THEN 20.00
         WHEN 'openai' THEN 20.00
         WHEN 'gemini' THEN 0.00  -- incluso no plano
         WHEN 'pixa' THEN 10.00
       END as limite_mensal,
       ROUND(SUM(cost_usd) / NULLIF(
         CASE provider
           WHEN 'claude' THEN 20.00
           WHEN 'openai' THEN 20.00
           WHEN 'gemini' THEN 0.00
           WHEN 'pixa' THEN 10.00
         END, 0) * 100, 1) as percentual_uso
FROM agent_costs
WHERE office_id = $1
  AND period >= DATE_TRUNC('month', NOW())
GROUP BY provider;
```

### Fase 3 — KPIs do Departamento

| KPI | Meta | Como medir | Frequência |
|-----|------|-----------|------------|
| Peças produzidas/semana | 15-20 por marca | COUNT tasks completed | Semanal |
| Tempo médio produção | <24h carrossel, <48h vídeo | AVG tempo tasks | Semanal |
| Taxa de aprovação Nina | >85% first-pass | tasks aprovadas / total | Semanal |
| Custo por peça | Otimizar mês a mês | custo total / peças total | Mensal |
| Engajamento médio | Crescer 5% mês | via kpi_snapshots | Mensal |
| Posts no prazo | >95% | publicados no horário agendado | Semanal |
| Taxa de retrabalho | <15% | tasks com revisão / total | Semanal |
| Cobertura do calendário | 100% | slots preenchidos vs planejados | Semanal |

**Benchmark por agente:**

| Agente | Modelo | Peças esperadas/semana | Custo esperado/mês |
|--------|--------|----------------------|-------------------|
| Nina (Diretora Criativa) | Opus 4.6 | 5-8 briefings + aprovações | Médio (revisão) |
| Luna (Designer) | Gemini/GPT-image | 10-15 designs | Alto (geração de imagens) |
| Diego (Diagramador) | Opus/Sonnet | 8-12 diagramações | Médio |
| Carla (Videomaker) | Sonnet + Remotion | 4-6 vídeos | Médio-Alto |
| Theo (Redator) | GPT-5.4 + Sonnet | 15-20 textos | Médio |
| Tina (Publisher) | Sonnet | 20-30 publicações | Baixo |
| Atlas (Gestor Tráfego) | Opus/GPT-5.4 | 5-10 campanhas/ajustes | Médio |

### Fase 4 — Identificar Problemas e Gargalos

**Diagnóstico automático:**
- Agente com taxa de retrabalho alta (>20%) → revisar briefing da Nina ou skill do agente
- Agente com custo desproporcional → verificar modelo de IA usado, considerar downgrade para Sonnet
- Tipo de conteúdo com baixo engajamento → revisar estratégia com Nina, testar formatos novos
- Fila de tasks pending crescendo → redistribuir carga ou repriorizar
- Agente consistentemente atrasado → investigar causa (skill complexa? input insuficiente? modelo lento?)
- Uma marca com muito mais conteúdo que outras → rebalancear calendário editorial
- Custo de assinatura próximo do limite (>80%) → alertar Mike para decisão

**Árvore de decisão para gargalos:**
```
Gargalo identificado
├── Agente sobrecarregado?
│   ├── Sim → Redistribuir tasks para agente com folga
│   └── Não → Verificar complexidade da skill
├── Custo acima do esperado?
│   ├── Sim → Avaliar troca de modelo (Opus→Sonnet, GPT→Gemini)
│   └── Não → Manter configuração atual
├── Qualidade caindo?
│   ├── Sim → Revisar prompts/skills, recalibrar personalidade
│   └── Não → Manter e monitorar
└── Engajamento caindo?
    ├── Sim → Reunião com Nina para revisar estratégia criativa
    └── Não → Manter ritmo
```

### Fase 5 — DP dos Agentes (Departamento Pessoal)

**Para cada agente, acompanhar:**
1. **Custo operacional individual** — quanto custa manter esse agente rodando por mês
2. **Performance: output vs resultado** — peça bonita mas sem engajamento? Volume alto mas qualidade baixa?
3. **PDI (Plano de Desenvolvimento Individual):**
   - Ajustes de personalidade (mais ousado? mais conservador?)
   - Ajustes de skills (precisa de nova skill? skill atual precisa de refinamento?)
   - Ajustes de modelo (Opus vs Sonnet vs GPT vs Gemini — custo-benefício)
4. **Percentual de uso de cada assinatura** — Claude, GPT, Gemini, Pixa
5. **Reconhecimento** — melhor performance do mês (agente destaque)

**Relatório individual por agente:**
```
📊 Performance [AGENTE] — Semana [DD/MM - DD/MM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Peças produzidas: XX (meta: XX)
⏱ Tempo médio: XXh (meta: <XXh)
✅ Taxa first-pass: XX% (meta: >85%)
💰 Custo período: $X.XX
🔄 Retrabalhos: XX (XX%)
📈 Engajamento médio das peças: XX%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Status: [🟢 Excelente | 🟡 Atenção | 🔴 Crítico]
💡 Recomendação: [ação sugerida]
```

### Fase 6 — Relatório Semanal Consolidado

**Template do reporte semanal para Alf:**
```
🏢 LA HQ — Relatório de Performance Semanal
📅 Semana: [DD/MM - DD/MM/AAAA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PRODUÇÃO
• Total de peças: XX (semana anterior: XX)
• Por marca: School XX | Kids XX | SonoraMente XX
• Publicadas no prazo: XX% 
• Taxa aprovação first-pass: XX%

💰 CUSTOS
• Custo total semana: $XX.XX
• Custo por peça: $X.XX
• Assinaturas: Claude XX% | GPT XX% | Gemini XX% | Pixa XX%

📈 ENGAJAMENTO (via Atlas)
• Alcance total: XX.XXX
• Engajamento médio: XX%
• Melhor peça: [título] — [métrica]

🏆 DESTAQUE DA SEMANA
• Agente: [nome] — [motivo]

⚠️ ALERTAS
• [alerta 1]
• [alerta 2]

📋 PRÓXIMA SEMANA
• [prioridade 1]
• [prioridade 2]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Salvar snapshot no Supabase:**
```sql
INSERT INTO kpi_snapshots (
  office_id, period_start, period_end, period_type,
  total_pieces, by_brand, by_type, by_agent,
  total_cost, cost_by_agent, cost_by_provider,
  avg_production_time, first_pass_rate,
  engagement_avg, best_piece, alerts,
  created_by
) VALUES (
  $1, $2, $3, 'weekly',
  $4, $5::jsonb, $6::jsonb, $7::jsonb,
  $8, $9::jsonb, $10::jsonb,
  $11, $12,
  $13, $14::jsonb, $15::jsonb,
  'mike'
);
```

## Veto Conditions — NUNCA
- NUNCA gerar relatório com dados estimados — sempre consultar Supabase
- NUNCA expor custos individuais dos agentes para outros agentes (dados sensíveis para Mike e Alf)
- NUNCA cobrar agente por atraso sem antes investigar a causa (pode ser input insuficiente)
- NUNCA medir performance apenas por volume — engajamento é o resultado real
- NUNCA deixar de gerar o reporte semanal (toda sexta-feira, sem exceção)
- NUNCA ignorar alertas de custo próximo ao limite de assinatura
- NUNCA comparar agentes de categorias diferentes (videomaker vs redator)
- NUNCA alterar modelo/skill de um agente sem aprovação do Mike/Alf

## Checklist de Conclusão
- [ ] Métricas de produção coletadas do Supabase (tasks completed)
- [ ] Custos operacionais coletados (agent_costs)
- [ ] KPIs calculados e comparados com metas
- [ ] Gargalos identificados com diagnóstico e recomendação
- [ ] Relatório individual por agente gerado (quando solicitado)
- [ ] Relatório semanal consolidado formatado
- [ ] Snapshot salvo no kpi_snapshots
- [ ] Alertas emitidos para custos >80% do limite
- [ ] Agente destaque da semana identificado
- [ ] Recomendações de ação documentadas

## Integrações
- **Supabase (tasks)** — dados de produção, status, tempo de execução
- **Supabase (outputs)** — peças finalizadas e seus metadados
- **Supabase (agent_costs)** — custos por agente, provider, tokens, imagens
- **Supabase (kpi_snapshots)** — histórico de snapshots para comparação
- **Supabase (calendar_entries)** — aderência ao calendário editorial
- **Meta Graph API Insights** — métricas de engajamento real dos posts
- **Google Analytics** — tráfego do site e landing pages
- **LA Performance MCP** — dados de matrícula e conversão (quando disponível)
