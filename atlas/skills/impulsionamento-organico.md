---
name: impulsionamento-organico
description: Skill para identificar posts orgânicos com performance excepcional e recomendar/executar impulsionamento pago. Use quando um post orgânico tem engajamento 2x acima da média — é sinal de que vale investir budget nele.
---

# Impulsionamento Orgânico

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| office_id | UUID | Contexto do tenant | Sim |
| marca | string | Tina (alerta) ou monitoramento automático | Sim |
| ig_media_id | string | Instagram (post identificado) | Condicional |
| ação | string | Atlas ("monitorar", "avaliar", "impulsionar") | Sim |
| budget_diário | number | Atlas ou Mike (R$ por dia) | Condicional (para impulsionar) |
| duração_dias | int | Atlas (3-7 dias) | Condicional (para impulsionar) |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| posts_destaque[] | lista | Atlas → avaliação de impulsionamento |
| decisão_boost | objeto | Supabase → registro (impulsionado ou não, motivo) |
| ad_id | string | Meta Ads (ID do anúncio criado) |
| relatório_boost | markdown | Mike → resultado do impulsionamento |

## Fases de Execução

### Fase 1 — Monitorar Performance Orgânica

**Consultar métricas de posts recentes via Instagram Graph API:**
```javascript
async function getRecentPostsMetrics(brand, days = 7) {
  const account = getAccount(brand);
  
  const response = await fetch(
    `${GRAPH_API}/${account.userId}/media?` +
    `fields=id,caption,timestamp,media_type,like_count,comments_count,` +
    `insights.metric(impressions,reach,saved,shares,engagement)&` +
    `limit=50&` +
    `access_token=${account.token}`
  );
  const data = await response.json();
  
  // Filtrar posts do período
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recentPosts = data.data.filter(post => 
    new Date(post.timestamp) >= since
  );
  
  return recentPosts.map(post => ({
    id: post.id,
    caption: post.caption?.substring(0, 100),
    timestamp: post.timestamp,
    type: post.media_type,
    likes: post.like_count,
    comments: post.comments_count,
    impressions: getInsightValue(post, 'impressions'),
    reach: getInsightValue(post, 'reach'),
    saved: getInsightValue(post, 'saved'),
    shares: getInsightValue(post, 'shares'),
    engagement: getInsightValue(post, 'engagement'),
  }));
}

function getInsightValue(post, metric) {
  const insight = post.insights?.data?.find(i => i.name === metric);
  return insight?.values?.[0]?.value || 0;
}
```

**Calcular média e identificar outliers:**
```javascript
function identifyHits(posts) {
  // Calcular médias
  const avgEngagement = posts.reduce((sum, p) => sum + p.engagement, 0) / posts.length;
  const avgSaves = posts.reduce((sum, p) => sum + p.saved, 0) / posts.length;
  const avgShares = posts.reduce((sum, p) => sum + p.shares, 0) / posts.length;
  const avgComments = posts.reduce((sum, p) => sum + p.comments, 0) / posts.length;
  
  // Identificar posts acima do threshold
  const hits = posts.filter(post => 
    post.engagement > avgEngagement * 2 ||
    post.saved > avgSaves * 3 ||
    post.shares > avgShares * 2 ||
    post.comments > avgComments * 2
  ).map(post => ({
    ...post,
    score: {
      engagement_vs_avg: (post.engagement / avgEngagement).toFixed(1) + 'x',
      saves_vs_avg: (post.saved / avgSaves).toFixed(1) + 'x',
      shares_vs_avg: (post.shares / avgShares).toFixed(1) + 'x',
      comments_vs_avg: (post.comments / avgComments).toFixed(1) + 'x',
    },
    recommend_boost: true
  }));
  
  return { hits, averages: { avgEngagement, avgSaves, avgShares, avgComments } };
}
```

**Consulta via Supabase (histórico de 30 dias para média mais estável):**
```sql
-- Média de engajamento dos últimos 30 dias por marca
SELECT brand,
       AVG(engagement_rate) as avg_engagement,
       AVG(saves) as avg_saves,
       AVG(shares) as avg_shares,
       AVG(comments) as avg_comments,
       AVG(reach) as avg_reach,
       COUNT(*) as total_posts
FROM post_metrics
WHERE office_id = $1
  AND brand = $2
  AND published_at >= NOW() - INTERVAL '30 days'
GROUP BY brand;

-- Posts acima de 2x a média (candidatos a impulsionamento)
WITH avg_metrics AS (
  SELECT brand, AVG(engagement_rate) as avg_eng, AVG(saves) as avg_saves
  FROM post_metrics
  WHERE office_id = $1 AND brand = $2
    AND published_at >= NOW() - INTERVAL '30 days'
  GROUP BY brand
)
SELECT pm.*, 
       ROUND(pm.engagement_rate / am.avg_eng, 1) as eng_multiplier,
       ROUND(pm.saves::numeric / NULLIF(am.avg_saves, 0), 1) as saves_multiplier
FROM post_metrics pm
JOIN avg_metrics am ON pm.brand = am.brand
WHERE pm.office_id = $1
  AND pm.brand = $2
  AND pm.published_at >= NOW() - INTERVAL '7 days'
  AND (pm.engagement_rate > am.avg_eng * 2 
       OR pm.saves > am.avg_saves * 3)
ORDER BY eng_multiplier DESC;
```

### Fase 2 — Critérios de Avaliação

**Thresholds para impulsionar:**

| Métrica | Threshold | Significado |
|---------|-----------|-------------|
| Engajamento | >2x média últimos 30 dias | Post ressoa com o público |
| Saves | >3x média | Conteúdo de alto valor (referência) |
| Shares | >2x média | Potencial viral (alcance orgânico amplificado) |
| Comments | >2x média | Gera conversa (sinal de conexão) |

**Avaliação qualitativa (TODAS devem ser SIM para impulsionar):**

| Pergunta | Critério |
|----------|----------|
| O post é atemporal? | Pode continuar gerando resultado por 3-7 dias? Não é notícia datada? |
| O CTA leva pra conversão? | Link pro site, WhatsApp, matrícula, ou pelo menos follow/save? |
| O conteúdo representa bem a marca? | Tom, visual, mensagem alinhados com a marca? |
| Não tem erro? | Legenda correta, imagem certa, sem erros de digitação? |
| O público é relevante? | O engajamento vem do público-alvo (não de bots ou público irrelevante)? |

**Se SIM para pelo menos 3 dos 5: impulsionar.**

### Fase 3 — Configurar e Executar Impulsionamento

**Configuração do boost via Meta Ads API:**
```javascript
async function boostPost(brand, igMediaId, budgetPerDay, durationDays) {
  const account = getAccount(brand);
  
  // 1. Criar campanha de boost
  const campaignResponse = await fetch(
    `${GRAPH_API}/act_${account.adAccountId}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Boost_${brand}_${igMediaId}_${Date.now()}`,
        objective: 'OUTCOME_ENGAGEMENT',  // ou OUTCOME_TRAFFIC se CTA é link
        status: 'ACTIVE',
        special_ad_categories: [],
        access_token: account.adsToken
      })
    }
  );
  const campaign = await campaignResponse.json();
  
  // 2. Criar adset com público
  const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  
  const adsetResponse = await fetch(
    `${GRAPH_API}/act_${account.adAccountId}/adsets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Boost_adset_${igMediaId}`,
        campaign_id: campaign.id,
        daily_budget: budgetPerDay * 100,  // em centavos
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'POST_ENGAGEMENT',
        targeting: getBoostTargeting(brand),
        start_time: new Date().toISOString(),
        end_time: endDate.toISOString(),
        status: 'ACTIVE',
        access_token: account.adsToken
      })
    }
  );
  const adset = await adsetResponse.json();
  
  // 3. Criar ad usando o post orgânico existente
  const adResponse = await fetch(
    `${GRAPH_API}/act_${account.adAccountId}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Boost_ad_${igMediaId}`,
        adset_id: adset.id,
        creative: {
          object_story_id: igMediaId  // usa o post original
        },
        status: 'ACTIVE',
        access_token: account.adsToken
      })
    }
  );
  const ad = await adResponse.json();
  
  return {
    campaignId: campaign.id,
    adsetId: adset.id,
    adId: ad.id,
    budget: budgetPerDay * durationDays,
    duration: durationDays
  };
}

// Público-alvo por marca para boost
function getBoostTargeting(brand) {
  const base = {
    geo_locations: {
      cities: [
        { key: 'campo-grande-rj', radius: 15, distance_unit: 'kilometer' },
        { key: 'recreio-rj', radius: 10, distance_unit: 'kilometer' },
        { key: 'barra-da-tijuca-rj', radius: 10, distance_unit: 'kilometer' }
      ]
    }
  };
  
  switch(brand) {
    case 'la-music-school':
      return { ...base,
        age_min: 15, age_max: 50,
        interests: [{ id: '6003107902433', name: 'Music' },
                    { id: '6003139266461', name: 'Guitar' }]
      };
    case 'sonoramente':
      return { ...base,
        age_min: 25, age_max: 45,
        interests: [{ id: '6003384248805', name: 'Parenting' },
                    { id: '6003349442860', name: 'Special education' }]
      };
    case 'la-music-kids':
      return { ...base,
        age_min: 25, age_max: 40,
        interests: [{ id: '6003384248805', name: 'Parenting' },
                    { id: '6003107902433', name: 'Music' }]
      };
  }
}
```

### Fase 4 — Timing e Budget

**Regra de ouro: quanto mais rápido, melhor.**

| Timing | Ação |
|--------|------|
| Post identificado como hit | Impulsionar em até **2 horas** |
| Após 2h | Momentum já diminuiu — ainda vale, mas resultado menor |
| Após 24h | Avaliar se ainda faz sentido — engajamento orgânico já estabilizou |
| Após 48h | Só se o conteúdo for atemporal e o ROAS justificar |

**Budget sugerido por nível de performance:**

| Performance | Budget diário | Duração | Budget total |
|-------------|--------------|---------|--------------|
| 2-3x média (bom) | R$ 20-30 | 3 dias | R$ 60-90 |
| 3-5x média (ótimo) | R$ 30-50 | 5 dias | R$ 150-250 |
| 5x+ média (viral) | R$ 50-100 | 7 dias | R$ 350-700 |

**Regra:** escalar gradualmente. Começar com R$ 20-30/dia, avaliar após 48h, aumentar se ROAS > 2x.

### Fase 5 — Registrar e Monitorar Resultado

```sql
-- Registrar decisão de impulsionamento
INSERT INTO boosts (
  office_id, brand, ig_media_id, post_caption,
  organic_engagement, organic_avg_engagement, multiplier,
  decision, decision_reason,
  budget_daily, duration_days, budget_total,
  ad_campaign_id, ad_adset_id, ad_id,
  started_at, ends_at,
  created_by
) VALUES (
  $1, $2, $3, $4,
  $5, $6, $7,
  $8, $9,
  $10, $11, $12,
  $13, $14, $15,
  NOW(), $16,
  'atlas'
);

-- Após finalizar: registrar resultado
UPDATE boosts
SET total_spend = $2,
    boost_impressions = $3,
    boost_reach = $4,
    boost_engagement = $5,
    boost_clicks = $6,
    boost_leads = $7,
    roas = $8,
    result_notes = $9,
    completed_at = NOW()
WHERE id = $1;
```

**Reportar resultado para Mike no reporte semanal:**
```
📢 BOOST DA SEMANA
Post: "[título resumido]" — [marca]
Performance orgânica: X.Xx acima da média
Budget investido: R$ XX,XX (X dias)
Resultado: +XX.XXX impressões | +X.XXX alcance | XX leads
ROAS: X.Xx
Decisão: [valeu / não valeu o investimento]
```

## Veto Conditions — NUNCA
- NUNCA impulsionar post com performance "normal" (threshold: 2x a média)
- NUNCA impulsionar post com erro (legenda errada, imagem trocada, marca errada)
- NUNCA esperar mais de 24h para impulsionar (momentum se perde)
- NUNCA impulsionar sem budget aprovado por Mike
- NUNCA dobrar budget de uma vez — escalar gradualmente (+20-30%)
- NUNCA impulsionar sem configurar público-alvo adequado à marca
- NUNCA deixar de registrar a decisão no Supabase (mesmo se decidir NÃO impulsionar)
- NUNCA impulsionar conteúdo que não representa bem a marca

## Checklist de Conclusão
- [ ] Métricas de posts recentes coletadas (Instagram Insights API)
- [ ] Média dos últimos 30 dias calculada por marca
- [ ] Posts acima do threshold identificados (2x+ engajamento)
- [ ] Avaliação qualitativa feita (atemporal? CTA? marca? sem erro? público?)
- [ ] Decisão registrada no Supabase (impulsionar ou não, com motivo)
- [ ] Se impulsionar: budget definido, público configurado, ad criado
- [ ] Timing respeitado (idealmente em até 2h após identificação)
- [ ] Resultado monitorado e registrado ao final do período
- [ ] Reportado para Mike no reporte semanal

## Integrações
- **Meta Graph API (Insights)** — métricas orgânicas de posts (alcance, engajamento, saves, shares)
- **Meta Ads API** — criação de campanhas de boost, monitoramento de resultado
- **Supabase (post_metrics)** — histórico de métricas para cálculo de média
- **Supabase (boosts)** — registro de decisões e resultados de impulsionamento
- **Supabase (kpi_snapshots)** — consolidação semanal
