---
name: analise-relatorios
description: Skill para gerar dashboards e relatórios de performance de mídia paga e orgânica — consolidando dados de Meta Ads, Google Ads, Instagram Insights e Google Analytics. Use para reportes semanais, análise de funil e recomendações de budget.
---

# Análise e Relatórios

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| office_id | UUID | Contexto do tenant | Sim |
| período | string | Mike ou automático ("semana", "mês", "trimestre", "campanha") | Sim |
| tipo_relatório | string | Mike ("semanal", "mensal", "campanha", "funil", "comparativo") | Sim |
| marca | string | Mike (filtro ou "todas") | Não (default: todas) |
| campanha_id | UUID | Para relatório de campanha específica | Condicional |
| comparar_com | string | Mike ("semana_anterior", "mês_anterior", "mesmo_período_ano_anterior") | Não (default: semana_anterior) |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| relatório_performance | markdown | Mike → reporte semanal para Alf |
| kpi_snapshots[] | registros | Supabase → tabela kpi_snapshots |
| insights[] | lista | Mike → ações recomendadas |
| alertas[] | lista | Mike → problemas que exigem ação |
| recomendações_budget | objeto | Mike/Atlas → redistribuição de verba |
| dashboard_dados | JSON | Para visualização (se implementado) |

## Fases de Execução

### Fase 1 — Coletar Dados das Fontes

**Fontes de dados e o que extrair de cada:**

| Fonte | Dados | Integração | Frequência |
|-------|-------|------------|------------|
| Meta Graph API (Insights) | Alcance, engajamento, seguidores, impressões, saves, shares | API direta | Diária |
| Meta Ads API | Spend, clicks, impressions, conversions, CPA, ROAS, CTR | API direta | Diária |
| Google Ads API | Spend, clicks, impressions, conversions, CPC, CTR | API direta | Diária |
| Google Analytics | Tráfego site, origem, bounce rate, tempo na página, conversões | API/GA4 | Diária |
| Supabase (kpi_snapshots) | Histórico consolidado de todas as métricas | Query SQL | — |
| Supabase (leads) | Leads capturados por fonte, marca, campanha | Query SQL | — |
| Supabase (outputs) | Posts publicados, engajamento vinculado | Query SQL | — |

**Coleta de métricas orgânicas via Instagram Graph API:**
```javascript
const GRAPH_API = 'https://graph.facebook.com/v19.0';

async function getInstagramInsights(brand, since, until) {
  const account = getAccount(brand);
  
  // Métricas do perfil no período
  const profileResponse = await fetch(
    `${GRAPH_API}/${account.userId}/insights?` +
    `metric=impressions,reach,profile_views,website_clicks,follower_count&` +
    `period=day&since=${since}&until=${until}&` +
    `access_token=${account.token}`
  );
  const profileData = await profileResponse.json();
  
  // Métricas de cada post no período
  const mediaResponse = await fetch(
    `${GRAPH_API}/${account.userId}/media?` +
    `fields=id,caption,timestamp,like_count,comments_count,` +
    `insights.metric(impressions,reach,saved,shares,engagement)&` +
    `since=${since}&until=${until}&` +
    `access_token=${account.token}`
  );
  const mediaData = await mediaResponse.json();
  
  return { profile: profileData, media: mediaData };
}
```

**Coleta de métricas de Ads via Meta Ads API:**
```javascript
async function getMetaAdsMetrics(adAccountId, since, until) {
  const response = await fetch(
    `${GRAPH_API}/act_${adAccountId}/insights?` +
    `fields=spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type,` +
    `purchase_roas,frequency,reach&` +
    `time_range={"since":"${since}","until":"${until}"}&` +
    `level=campaign&` +
    `access_token=${META_ADS_TOKEN}`
  );
  const data = await response.json();
  return data;
}
```

**Coleta de leads e conversões do Supabase:**
```sql
-- Leads capturados no período por marca e fonte
SELECT brand, source, COUNT(*) as total_leads,
       COUNT(CASE WHEN converted = true THEN 1 END) as convertidos,
       ROUND(COUNT(CASE WHEN converted = true THEN 1 END)::numeric / 
             NULLIF(COUNT(*), 0) * 100, 1) as taxa_conversao
FROM leads
WHERE office_id = $1
  AND created_at BETWEEN $2 AND $3
GROUP BY brand, source
ORDER BY brand, total_leads DESC;

-- Leads por campanha
SELECT campaign_id, brand, COUNT(*) as leads,
       COUNT(CASE WHEN converted = true THEN 1 END) as matriculas
FROM leads
WHERE office_id = $1
  AND campaign_id IS NOT NULL
  AND created_at BETWEEN $2 AND $3
GROUP BY campaign_id, brand
ORDER BY leads DESC;
```

### Fase 2 — Relatório Semanal de Performance

**Template completo:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PERFORMANCE DE TRÁFEGO — Semana [DD/MM a DD/MM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎸 LA MUSIC SCHOOL
├── 📱 Orgânico
│   ├── Alcance: XX.XXX (semana anterior: XX.XXX | △ XX%)
│   ├── Engajamento: X.X% (anterior: X.X%)
│   ├── Seguidores: +XX (total: XX.XXX)
│   ├── Saves: XXX | Shares: XXX
│   └── Melhor post: "[título]" — engajamento XX%
├── 💰 Pago (Meta Ads + Google Ads)
│   ├── Investido: R$ X.XXX,XX
│   ├── Impressões: XX.XXX | Cliques: X.XXX
│   ├── CTR: X.X% | CPC: R$ X,XX
│   ├── Leads gerados: XX | CPA: R$ XX,XX
│   ├── Matrículas: XX | ROAS: X.Xx
│   └── Melhor campanha: "[nome]" — CPA R$ XX,XX
└── 🌐 Site
    ├── Visitas: X.XXX (origem: XX% orgânico, XX% pago, XX% direto)
    └── Conversão LP: XX%

🧠 SONORAMENTE LA
├── 📱 Orgânico
│   ├── Alcance: XX.XXX (△ XX%)
│   ├── Engajamento: X.X%
│   ├── Seguidores: +XX
│   └── Melhor post: "[título]"
├── 💰 Pago
│   ├── Investido: R$ XXX,XX
│   ├── CTR: X.X% | CPA: R$ XX,XX
│   └── Leads: XX | Agendamentos: XX
└── 🌐 Site: Visitas X.XXX | Conversão XX%

🎨 LA MUSIC KIDS
├── 📱 Orgânico
│   ├── Alcance: XX.XXX (△ XX%)
│   ├── Engajamento: X.X%
│   ├── Seguidores: +XX
│   └── Melhor post: "[título]"
├── 💰 Pago
│   ├── Investido: R$ XXX,XX
│   ├── CTR: X.X% | CPA: R$ XX,XX
│   └── Leads: XX | Matrículas: XX
└── 🌐 Site: Visitas X.XXX | Conversão XX%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 INSIGHTS DA SEMANA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. [Padrão identificado — ex: "Carrosséis educativos geraram 3x mais saves que reels"]
2. [Insight de público — ex: "Público 25-34 anos respondeu melhor ao criativo X"]
3. [Insight de horário — ex: "Posts às 19h tiveram 40% mais alcance que às 12h"]

⚠️ ALERTAS
• [Alerta 1 — ex: "ROAS da campanha X caiu abaixo de 2x por 2 semanas"]
• [Alerta 2 — ex: "Frequência da campanha Y atingiu 4.2 — fadiga criativa"]

🎯 RECOMENDAÇÕES PARA PRÓXIMA SEMANA
• [Ação 1 — ex: "Pausar campanha X e redistribuir R$200 para campanha Z"]
• [Ação 2 — ex: "Solicitar novo criativo à Nina para público 25-34"]
• [Ação 3 — ex: "Testar stories como formato pago para SonoraMente"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Relatório por Atlas | LA HQ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Fase 3 — Análise de Funil de Conversão

**Funil por marca:**
```
IMPRESSÃO → CLIQUE → VISITA LP → LEAD → CONTATO COMERCIAL → MATRÍCULA

Taxas de conversão por etapa:
┌─────────────────┬──────────┬───────────┬──────────┐
│ Etapa           │ School   │ SonoraMente│ Kids    │
├─────────────────┼──────────┼───────────┼──────────┤
│ Impressão→Clique│ >1.5%    │ >1.0%     │ >1.5%   │
│ (CTR)           │          │           │          │
├─────────────────┼──────────┼───────────┼──────────┤
│ Clique→Lead     │ >10%     │ >8%       │ >10%    │
│ (LP Conversion) │          │           │          │
├─────────────────┼──────────┼───────────┼──────────┤
│ Lead→Matrícula  │ >20%     │ >15%      │ >20%    │
│ (Sales Conv.)   │          │           │          │
└─────────────────┴──────────┴───────────┴──────────┘
```

**Diagnóstico de gargalo:**
```
Onde está o gargalo? → Otimizar ESSA etapa.

CTR baixo (<1%) → Problema no CRIATIVO
  → Ação: pedir novo criativo à Nina, testar headlines diferentes
  → Verificar: público-alvo está correto? formato do anúncio?

LP Conversion baixa (<5%) → Problema na LANDING PAGE
  → Ação: revisar LP com Diego, simplificar formulário
  → Verificar: velocidade de carregamento? CTA claro? mobile-friendly?

Sales Conversion baixa (<10%) → Problema no COMERCIAL
  → Ação: reportar para Mike/Alf, verificar tempo de resposta
  → Verificar: equipe está respondendo rápido? script de venda?
```

**SQL para análise de funil:**
```sql
-- Funil completo por marca e campanha
WITH funnel AS (
  SELECT 
    c.brand,
    c.name as campaign_name,
    c.impressions,
    c.clicks,
    c.spend_brl,
    COUNT(l.id) as leads,
    COUNT(CASE WHEN l.contacted = true THEN 1 END) as contacted,
    COUNT(CASE WHEN l.converted = true THEN 1 END) as matriculas
  FROM campaigns c
  LEFT JOIN leads l ON l.campaign_id = c.id
  WHERE c.office_id = $1
    AND c.created_at BETWEEN $2 AND $3
  GROUP BY c.brand, c.name, c.impressions, c.clicks, c.spend_brl
)
SELECT *,
  ROUND(clicks::numeric / NULLIF(impressions, 0) * 100, 2) as ctr,
  ROUND(leads::numeric / NULLIF(clicks, 0) * 100, 2) as lp_conversion,
  ROUND(matriculas::numeric / NULLIF(leads, 0) * 100, 2) as sales_conversion,
  ROUND(spend_brl / NULLIF(leads, 0), 2) as cpa_lead,
  ROUND(spend_brl / NULLIF(matriculas, 0), 2) as cpa_matricula
FROM funnel
ORDER BY brand, spend_brl DESC;
```

### Fase 4 — Salvar KPIs no Supabase

```sql
-- Salvar snapshot consolidado semanal
INSERT INTO kpi_snapshots (
  office_id, brand, period_start, period_end, period_type,
  -- Orgânico
  organic_reach, organic_impressions, engagement_rate,
  followers_gained, saves_total, shares_total,
  best_post_id, best_post_engagement,
  -- Pago
  ad_spend_brl, ad_impressions, ad_clicks, ad_ctr,
  ad_cpc_brl, ad_leads, ad_cpa_brl, ad_roas,
  ad_frequency, best_campaign_id,
  -- Site
  site_visits, site_bounce_rate, lp_conversion_rate,
  -- Funil
  total_leads, total_contacted, total_matriculas,
  -- Meta
  created_by, created_at
) VALUES (
  $1, $2, $3, $4, 'weekly',
  $5, $6, $7, $8, $9, $10, $11, $12,
  $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
  $23, $24, $25,
  $26, $27, $28,
  'atlas', NOW()
);

-- Comparar com semana anterior
SELECT 
  curr.brand,
  curr.organic_reach as reach_atual,
  prev.organic_reach as reach_anterior,
  ROUND((curr.organic_reach - prev.organic_reach)::numeric / 
        NULLIF(prev.organic_reach, 0) * 100, 1) as variacao_reach,
  curr.engagement_rate as eng_atual,
  prev.engagement_rate as eng_anterior,
  curr.ad_spend_brl as spend_atual,
  prev.ad_spend_brl as spend_anterior,
  curr.ad_cpa_brl as cpa_atual,
  prev.ad_cpa_brl as cpa_anterior
FROM kpi_snapshots curr
LEFT JOIN kpi_snapshots prev ON prev.brand = curr.brand
  AND prev.period_type = 'weekly'
  AND prev.period_end = curr.period_start - INTERVAL '1 day'
WHERE curr.office_id = $1
  AND curr.period_start = $2
  AND curr.period_type = 'weekly'
ORDER BY curr.brand;
```

### Fase 5 — Gerar Insights Automatizados

**Regras de detecção de insights:**

| Condição | Insight gerado | Prioridade |
|----------|---------------|------------|
| Engajamento de post > 3x média | "Post [título] teve performance excepcional — considerar impulsionamento" | 🟢 Alta |
| CTR > 2x média da campanha | "Criativo [nome] está performando acima — considerar escalar budget" | 🟢 Alta |
| ROAS < 2x por 2 semanas | "Campanha [nome] abaixo do retorno mínimo — avaliar pausa" | 🔴 Crítico |
| Frequência > 3.5 | "Público da campanha [nome] saturado — trocar criativo ou expandir público" | 🟡 Atenção |
| CPA subindo 3 semanas seguidas | "Tendência de aumento de CPA em [marca] — investigar causa" | 🟡 Atenção |
| Saves > 3x média | "Conteúdo de alto valor detectado — replicar formato" | 🟢 Alta |
| Seguidores caindo | "Perda de seguidores em [marca] — verificar qualidade do conteúdo" | 🔴 Crítico |
| LP conversion < 5% | "Landing page [marca] com baixa conversão — revisar com Diego" | 🟡 Atenção |

## Veto Conditions — NUNCA
- NUNCA gerar relatório com dados estimados — sempre das APIs oficiais
- NUNCA comparar métricas sem contexto (sazonalidade, feriados, eventos)
- NUNCA apresentar dados sem comparação com período anterior (tendência)
- NUNCA fazer recomendação de budget sem justificativa em dados
- NUNCA ignorar ROAS < 2x por 2+ semanas seguidas — é alerta obrigatório
- NUNCA inventar insights — se não tem padrão claro, reportar os dados e deixar Mike decidir
- NUNCA deixar de entregar relatório semanal (sexta, antes do reporte do Mike)
- NUNCA reportar lacuna de dados sem alertar (ex: "Google Analytics sem dados esta semana")

## Checklist de Conclusão
- [ ] Dados coletados de todas as fontes (Meta Insights, Meta Ads, Google Ads, GA, Supabase)
- [ ] Métricas orgânicas consolidadas por marca (alcance, engajamento, seguidores)
- [ ] Métricas pagas consolidadas por marca (spend, CTR, CPA, ROAS)
- [ ] Funil de conversão calculado (impressão → clique → lead → matrícula)
- [ ] Comparação com período anterior (variação %)
- [ ] Insights identificados (mínimo 1 por semana)
- [ ] Alertas emitidos para métricas críticas
- [ ] Recomendações de ação documentadas com justificativa
- [ ] KPI snapshot salvo no Supabase
- [ ] Relatório formatado e entregue para Mike

## Integrações
- **Meta Graph API (Insights)** — métricas orgânicas do Instagram (alcance, engajamento)
- **Meta Ads API** — métricas de campanhas pagas (spend, CTR, CPA, ROAS)
- **Google Ads API** — métricas de campanhas Google (spend, clicks, conversions)
- **Google Analytics (GA4)** — tráfego do site, origens, conversões
- **Supabase (kpi_snapshots)** — histórico consolidado para comparação
- **Supabase (leads)** — leads por fonte, marca, campanha
- **Supabase (campaigns)** — dados de campanhas ativas
- **Supabase (outputs)** — posts publicados e engajamento vinculado
