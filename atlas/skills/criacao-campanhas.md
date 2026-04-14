---
name: criacao-campanhas
description: Skill para criar campanhas de mídia paga no Meta Ads e Google Ads, com targeting, criativos e budget por marca.
---

# Criação de Campanhas

## Entrada
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| marca | enum | Sim |
| objetivo | enum (awareness, tráfego, leads, conversão) | Sim |
| budget mensal | number | Sim |
| público-alvo | string | Sim |
| plataforma | enum (meta, google, ambos) | Sim |

## Saída
Campanha configurada + variações de criativo pra teste A/B

## Fases de Execução
### Fase 1 — Definir público por marca
- School: 15-45 anos, interesse em guitarra/música, Campo Grande/Recreio/Barra
- Kids: 25-45 anos (pais), interesse em educação infantil, mesma região
- SonoraMente: 25-50 anos (pais), interesse em autismo/TEA/musicoterapia, RJ

### Fase 2 — Estrutura de campanha
Topo (awareness/cold) → Meio (consideração/warm) → Fundo (conversão/hot)

### Fase 3 — Criativos (aprovados pela Nina)
5 variações com ângulos distintos: problema, benefício, prova social, curiosidade, oferta direta

### Fase 4 — Teste A/B obrigatório
Mínimo 2 variações. Budget dividido igualmente. Avaliar vencedor em 48-72h.

### Fase 5 — Landing page alinhada (pedir ao Diego se necessário)

## Veto Conditions — NUNCA
- NUNCA sem objetivo e KPI definidos antes de rodar
- NUNCA sem criativo aprovado pela Nina
- NUNCA misturar público entre marcas
- NUNCA uma variação só (teste A/B obrigatório)
- NUNCA sem landing page funcional como destino
- NUNCA ignorar políticas da plataforma

## Checklist (usar checklist-qualidade-trafego.md)

## Integrações
- Meta Ads API, Google Ads API, Supabase (kpi_snapshots)
