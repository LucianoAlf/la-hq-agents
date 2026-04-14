---
name: otimizacao-budget
description: Skill para monitorar, otimizar e redistribuir budget de campanhas pagas com base em performance real — pausando o que não funciona, escalando o que funciona e maximizando ROAS. Use diariamente para gestão ativa das campanhas.
---

# Otimização de Budget

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| office_id | UUID | Contexto do tenant | Sim |
| ação | string | Atlas ou automático ("monitorar", "pausar", "escalar", "redistribuir", "trocar_criativo") | Sim |
| marca | string | Filtro ou "todas" | Não (default: todas) |
| campanha_id | UUID | Para ação em campanha específica | Condicional |
| budget_novo | number | Mike (para redistribuição manual) | Condicional |
| motivo | string | Atlas (justificativa da decisão) | Sim (para pausar/escalar) |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| status_campanhas | tabela | Mike → visão geral diária |
| decisões_tomadas[] | lista | Supabase → registro de otimizações |
| alertas[] | lista | Mike → problemas que exigem atenção |
| recomendações[] | lista | Mike → ações sugeridas |
| budget_redistribuído | objeto | Meta Ads → atualização de budgets |

## Fases de Execução

### Fase 1 — Monitorar Métricas-Chave

**KPIs que Atlas acompanha diariamente:**

| Métrica | O que significa | Benchmark mínimo | Benchmark excelente | Ação se fora |
|---------|----------------|------------------|--------------------|----|
| **CTR** | Taxa de clique (cliques / impressões) | >1.0% | >2.0% | Trocar criativo |
| **CPC** | Custo por clique | Depende do mercado | <R$ 1,00 | Otimizar público |
| **CPA** | Custo por aquisição (lead ou matrícula) | Meta definida com Mike | <50% da meta | Escalar |
| **ROAS** | Retorno sobre gasto (receita / spend) | >2x | >4x | Escalar agressivamente |
| **Frequência** | Vezes que mesma pessoa viu o anúncio | <3.0 | <2.0 | Trocar criativo ou expandir público |
| **CPM** | Custo por mil impressões | <R$ 30 | <R$ 15 | Otimizar segmentação |
| **Conversion Rate** | % de cliques que viram lead | >5% | >15% | Otimizar LP |

**Coletar métricas via Meta Ads API:**
```javascript
async function getCampaignMetrics(adAccountId, campaignId = null) {
  let url = `${GRAPH_API}/act_${adAccountId}/insights?` +
    `fields=campaign_name,campaign_id,spend,impressions,reach,clicks,` +
    `ctr,cpc,actions,cost_per_action_type,purchase_roas,frequency,cpp&` +
    `date_preset=last_7d&level=campaign&` +
    `access_token=${META_ADS_TOKEN}`;
  
  if (campaignId) {
    url = `${GRAPH_API}/${campaignId}/insights?` +
      `fields=spend,impressions,reach,clicks,ctr,cpc,actions,` +
      `cost_per_action_type,purchase_roas,frequency&` +
      `date_preset=last_7d&` +
      `access_token=${META_ADS_TOKEN}`;
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data.data.map(campaign => ({
    name: campaign.campaign_name,
    id: campaign.campaign_id,
    spend: parseFloat(campaign.spend),
    impressions: parseInt(campaign.impressions),
    reach: parseInt(campaign.reach),
    clicks: parseInt(campaign.clicks),
    ctr: parseFloat(campaign.ctr),
    cpc: parseFloat(campaign.cpc),
    frequency: parseFloat(campaign.frequency),
    leads: getActionValue(campaign.actions, 'lead'),
    cpa: getActionCost(campaign.cost_per_action_type, 'lead'),
    roas: campaign.purchase_roas?.[0]?.value || null
  }));
}

function getActionValue(actions, type) {
  return actions?.find(a => a.action_type === type)?.value || 0;
}
function getActionCost(costs, type) {
  return costs?.find(c => c.action_type === type)?.value || null;
}
```

### Fase 2 — Regras de Otimização

**Árvore de decisão diária:**
```
Campanha com 48h+ de dados?
│
├── CTR < 0.5%?
│   └── SIM → 🔴 PAUSAR (criativo não atrai)
│       → Pedir novo criativo à Nina com briefing do que NÃO funcionou
│
├── CPA > 2x a meta após 72h?
│   └── SIM → 🔴 PAUSAR (muito caro, sem retorno)
│       → Analisar: problema é criativo, público ou LP?
│
├── Frequência > 4.0?
│   └── SIM → 🟡 TROCAR CRIATIVO (público saturado)
│       → Mesmo público, novo anúncio
│       → Ou expandir público (lookalike mais amplo)
│
├── Zero conversões após 72h com spend > R$100?
│   └── SIM → 🔴 PAUSAR (algo está fundamentalmente errado)
│       → Verificar: LP funciona? pixel dispara? público correto?
│
├── CTR > 2.0% E CPA < meta?
│   └── SIM → 🟢 ESCALAR
│       → Aumentar budget +20-30% (NUNCA dobrar de uma vez)
│       → Monitorar 48h após escalar
│
├── ROAS > 4x consistente (7+ dias)?
│   └── SIM → 🟢 ESCALAR AGRESSIVAMENTE
│       → Aumentar budget +30-50%
│       → Considerar duplicar campanha para público similar
│
└── Performance estável (dentro das metas)?
    └── SIM → ✅ MANTER
        → Continuar monitorando diariamente
```

**Ações via Meta Ads API:**
```javascript
// Pausar campanha
async function pauseCampaign(campaignId, reason) {
  await fetch(`${GRAPH_API}/${campaignId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'PAUSED',
      access_token: META_ADS_TOKEN
    })
  });
  
  // Registrar decisão
  await registerDecision(campaignId, 'pause', reason);
}

// Escalar budget (+20-30%)
async function scaleBudget(campaignId, currentBudget, increasePercent = 20) {
  const newBudget = Math.round(currentBudget * (1 + increasePercent / 100));
  
  // Atualizar no adset (budget é do adset, não da campanha)
  const adsets = await getAdsets(campaignId);
  for (const adset of adsets) {
    await fetch(`${GRAPH_API}/${adset.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        daily_budget: newBudget * 100, // centavos
        access_token: META_ADS_TOKEN
      })
    });
  }
  
  await registerDecision(campaignId, 'scale', 
    `Budget ${currentBudget} → ${newBudget} (+${increasePercent}%)`);
  
  return newBudget;
}
```

### Fase 3 — Redistribuir Budget

**Princípios de redistribuição:**
1. Tirar de campanhas com CPA alto → colocar em campanhas com CPA baixo
2. Manter sempre pelo menos 1 campanha ativa por marca
3. Reservar 20% do budget total para testes de novos criativos/públicos
4. Nunca zerar budget de marca — mínimo R$ 20/dia por marca ativa

**Algoritmo de redistribuição:**
```javascript
function redistributeBudget(campaigns, totalBudget) {
  // Ordenar por eficiência (CPA mais baixo primeiro)
  const sorted = campaigns
    .filter(c => c.status === 'ACTIVE' && c.cpa > 0)
    .sort((a, b) => a.cpa - b.cpa);
  
  // Reservar 20% para testes
  const testBudget = totalBudget * 0.20;
  const performanceBudget = totalBudget * 0.80;
  
  // Distribuir proporcionalmente ao inverso do CPA
  const totalInverseCpa = sorted.reduce((sum, c) => sum + (1 / c.cpa), 0);
  
  const redistribution = sorted.map(campaign => {
    const share = (1 / campaign.cpa) / totalInverseCpa;
    const newBudget = Math.round(performanceBudget * share);
    
    return {
      campaign: campaign.name,
      id: campaign.id,
      currentBudget: campaign.dailyBudget,
      newBudget: Math.max(newBudget, 2000), // mínimo R$20/dia (em centavos)
      cpa: campaign.cpa,
      reason: newBudget > campaign.dailyBudget ? 'CPA baixo — merece mais' : 'CPA alto — reduzir'
    };
  });
  
  return { redistribution, testBudget };
}
```

**Budget por marca (baseline — ajustar conforme resultado):**

| Marca | % do budget total | Foco principal | Meta CPA |
|-------|------------------|---------------|----------|
| LA Music School | 50% | Matrículas (aula experimental) | R$ 30-50 |
| LA Music Kids | 30% | Matrículas infantis | R$ 40-60 |
| SonoraMente LA | 20% | Agendamentos de avaliação | R$ 50-80 |

### Fase 4 — Gestão de Criativos

**Quando trocar criativo:**
- CTR caindo progressivamente por 3+ dias (fadiga criativa)
- Frequência subindo acima de 3.0 (público vendo repetidamente)
- CPA subindo sem mudança de público (criativo perdeu eficácia)

**Briefing para Nina baseado em dados:**
```
📋 BRIEFING PARA NOVO CRIATIVO — [marca]

📊 Dados da campanha atual:
• CTR: X.X% (caindo de X.X%)
• Frequência: X.X (acima de 3.0)
• Melhor criativo anterior: [descrição do que funcionou]

💡 O que funcionou:
• [Headline/gancho que teve melhor CTR]
• [Formato que performou melhor: carrossel, imagem, vídeo]
• [Público que respondeu melhor: faixa etária, interesse]

🎯 O que preciso:
• Novo criativo para [formato]
• Mesmo público-alvo: [descrição]
• Manter o que funcionou, mudar o visual
• Prazo: [data — urgência de 2-3 dias]
```

### Fase 5 — Registrar Decisões

```sql
-- Registrar decisão de otimização
INSERT INTO budget_decisions (
  office_id, brand, campaign_id, campaign_name,
  decision_type, reason,
  metric_before, metric_after,
  budget_before, budget_after,
  decided_by, decided_at
) VALUES (
  $1, $2, $3, $4,
  $5, $6,        -- 'pause'|'scale'|'redistribute'|'swap_creative', motivo
  $7::jsonb, $8::jsonb,   -- métricas antes e depois
  $9, $10,
  'atlas', NOW()
);

-- Dashboard: decisões da semana
SELECT decision_type, COUNT(*) as total,
       SUM(CASE WHEN decision_type = 'pause' THEN 1 ELSE 0 END) as pausadas,
       SUM(CASE WHEN decision_type = 'scale' THEN 1 ELSE 0 END) as escaladas,
       SUM(budget_after - budget_before) as variacao_budget
FROM budget_decisions
WHERE office_id = $1
  AND decided_at >= NOW() - INTERVAL '7 days'
GROUP BY decision_type;
```

### Fase 6 — Reporte de Performance

**Template de reporte diário (resumo para Mike):**
```
💰 BUDGET REPORT — [DD/MM/AAAA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎸 School: R$ XX,XX gasto | X leads | CPA R$ XX | CTR X.X% | ROAS X.Xx
🧠 SonoraMente: R$ XX,XX | X leads | CPA R$ XX | CTR X.X%
🎨 Kids: R$ XX,XX | X leads | CPA R$ XX | CTR X.X%

📊 Total: R$ XXX,XX | XX leads | CPA médio R$ XX,XX

⚡ Ações tomadas:
• [Campanha X: pausada — CPA 3x acima da meta]
• [Campanha Y: escalada +20% — ROAS 4.2x]

⚠️ Atenção:
• [Frequência da campanha Z atingiu 3.5]
```

## Veto Conditions — NUNCA
- NUNCA tomar decisão de budget com menos de 48h de dados (ruído estatístico)
- NUNCA escalar budget mais que 30% de uma vez (algoritmo do Meta desestabiliza)
- NUNCA dobrar budget de uma vez — escalar gradualmente
- NUNCA pausar campanha sem documentar o motivo
- NUNCA zerar budget de uma marca completamente (manter mínimo R$ 20/dia)
- NUNCA decidir baseado em intuição — sempre em dados das APIs
- NUNCA manter campanha com ROAS < 2x por mais de 2 semanas sem ação
- NUNCA manter campanha com zero conversões após 72h e R$ 100+ gastos
- NUNCA redistribuir budget sem reservar 20% para testes
- NUNCA trocar criativo sem briefar Nina com dados do que funcionou/não funcionou

## Checklist de Conclusão
- [ ] Métricas diárias coletadas de todas as campanhas ativas (Meta Ads + Google Ads)
- [ ] CTR, CPA, ROAS, Frequência verificados contra benchmarks
- [ ] Campanhas abaixo do threshold identificadas (CTR <0.5%, CPA >2x meta)
- [ ] Campanhas acima do threshold identificadas (CTR >2%, ROAS >3x)
- [ ] Decisões tomadas (pausar, escalar, redistribuir, trocar criativo)
- [ ] Decisões registradas no Supabase com motivo e métricas
- [ ] Budget redistribuído conforme performance (80% performance + 20% teste)
- [ ] Briefing enviado para Nina se precisa de novo criativo
- [ ] Reporte diário enviado para Mike
- [ ] Cada real justifica seu retorno

## Integrações
- **Meta Ads API** — métricas de campanhas, pausar/escalar/ajustar budget
- **Google Ads API** — métricas de campanhas Google, ajustes de budget
- **Supabase (budget_decisions)** — registro de decisões de otimização
- **Supabase (kpi_snapshots)** — histórico de KPIs para comparação
- **Supabase (campaigns)** — dados de campanhas ativas e configuração
- **Supabase (leads)** — leads por campanha para cálculo de CPA real
