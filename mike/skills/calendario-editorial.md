---
name: calendario-editorial
description: Skill para planejar, manter e sincronizar o calendário editorial das 3 marcas (LA Music School, LA Music Kids, SonoraMente LA). Use quando precisar agendar conteúdo, verificar o que está programado, antecipar datas comemorativas, evitar sobreposições ou vazios, e sincronizar com eventos do negócio.
---

# Calendário Editorial

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| office_id | UUID | Contexto do tenant | Sim |
| período | string | Humano ou automático ("semana", "mês", "Q3") | Sim |
| marca | string | Humano ou todas ("la-music-school", "la-music-kids", "sonoramente") | Não (default: todas) |
| eventos_especiais | lista | Humano (recitais, campanhas, matrículas) | Não |
| campanhas_ativas | lista | Atlas (campanhas pagas em andamento) | Não |
| outputs_prontos | lista | Supabase (peças finalizadas aguardando agendamento) | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| calendar_entries[] | registros | Supabase → tabela calendar_entries |
| alerta_gaps | lista | Mike → coordenação (marcas com gaps >2 dias) |
| alerta_sobreposição | lista | Mike → coordenação (conflitos de horário) |
| briefings_pendentes | lista | Nina → peças que precisam ser criadas |
| agenda_tina | lista | Tina → o que publicar e quando |
| agenda_atlas | lista | Atlas → criativos necessários para campanhas |

## Fases de Execução

### Fase 1 — Planejamento Semanal
- Todo domingo (ou automatizado): revisar a semana seguinte
- Verificar: cada marca tem pelo menos 3-4 posts na semana?
- Verificar: há datas comemorativas ou eventos da escola?
- Verificar: há campanha paga que precisa de criativo alinhado?
- Garantir que nenhuma marca fique mais de 2 dias sem publicação

### Fase 2 — Estrutura do Calendário por Marca

**LA Music School** — "Pra Quem Sabe o Que Quer!"
- Foco: conteúdo técnico, dicas musicais, bastidores da escola, promoções
- Tom: rock/atitude, direto, energético
- Público: jovens e adultos que querem aprender música de verdade
- Exemplos: "5 acordes que todo guitarrista precisa dominar", bastidores de aula, depoimentos de alunos

**LA Music Kids** — "música não é só pra gente grande"
- Foco: diversão, musicalização infantil, conteúdo para pais
- Tom: divertido, colorido, confiante
- Público: pais de crianças de 3-10 anos
- Exemplos: "Como a música desenvolve o cérebro do seu filho", vídeos de aulas, dicas de instrumentos para crianças

**SonoraMente LA** — "onde o som cuida da mente"
- Foco: conteúdo educativo sobre autismo, musicoterapia, acolhimento, inclusão
- Tom: acolhedor, científico, sensível
- Público: famílias de crianças atípicas, profissionais de saúde, educadores
- Exemplos: "O que a musicoterapia pode fazer pelo TEA", relatos de progresso, dicas para pais

### Fase 3 — Registro no Supabase
```sql
-- Inserir nova entrada no calendário
INSERT INTO calendar_entries (
  office_id, brand, title, content_type, 
  scheduled_date, status, output_id, 
  campaign_id, notes, created_by
) VALUES (
  $1, $2, $3, $4,
  $5, 'planned', NULL,
  $6, $7, 'mike'
);

-- Consultar calendário da semana por marca
SELECT id, brand, title, content_type, scheduled_date, status, output_id
FROM calendar_entries
WHERE office_id = $1
  AND scheduled_date BETWEEN [início_semana] AND [fim_semana]
  AND brand = $2
ORDER BY scheduled_date ASC;

-- Verificar gaps (marcas sem publicação há mais de 2 dias)
SELECT brand, MAX(scheduled_date) as ultimo_post,
       NOW() - MAX(scheduled_date) as dias_sem_post
FROM calendar_entries
WHERE office_id = $1 AND status IN ('published', 'ready')
GROUP BY brand
HAVING NOW() - MAX(scheduled_date) > INTERVAL '2 days';

-- Verificar sobreposições (mesma hora para marcas diferentes)
SELECT a.brand as marca_a, b.brand as marca_b, 
       a.scheduled_date, a.title as titulo_a, b.title as titulo_b
FROM calendar_entries a
JOIN calendar_entries b ON a.scheduled_date = b.scheduled_date
  AND a.brand != b.brand AND a.id < b.id
WHERE a.office_id = $1
  AND a.scheduled_date >= NOW();
```

### Fase 4 — Tipos de Conteúdo e Frequência

| Tipo | Frequência por marca | Dia sugerido | Responsável produção |
|------|---------------------|--------------|---------------------|
| Carrossel educativo | 2x/semana | Terça e Quinta | Luna (design) + Diego (diagramação) |
| Story | Diário | Todo dia | Luna (design) ou Carla (vídeo) |
| Reel | 1-2x/semana | Quarta e Sábado | Carla (produção) |
| Newsletter email | 1x/semana | Segunda | Theo (copy) + Tina (disparo) |
| Newsletter WhatsApp | 1x/semana | Sexta | Theo (copy) + Tina (disparo via UAZAPI) |
| Post estático | 1x/semana | Variável | Luna (design) + Diego (finalização) |

**Horários sugeridos por marca:**
| Marca | Melhor horário feed | Melhor horário stories |
|-------|--------------------|-----------------------|
| LA Music School | 18h-20h (pós-trabalho) | 12h e 19h |
| LA Music Kids | 8h-10h (pais antes do trabalho) | 7h e 20h |
| SonoraMente LA | 10h-12h (profissionais) | 9h e 17h |

### Fase 5 — Datas Comemorativas Anuais

**Datas que afetam TODAS as marcas:**
- Dia das Mães (maio) — campanha forte para todas
- Dia dos Pais (agosto) — campanha forte para todas
- Black Friday (novembro) — promoção de matrículas
- Volta às aulas (janeiro/fevereiro) — campanha de captação
- Natal e Ano Novo — conteúdo emocional/retrospectiva
- Férias escolares (julho e dezembro/janeiro) — conteúdo especial

**Datas específicas por marca:**

| Data | Marca | Tipo de conteúdo |
|------|-------|-----------------|
| Dia do Músico (22/nov) | LA Music School | Homenagem, bastidores, promoção |
| Dia do Rock (13/jul) | LA Music School | Conteúdo especial rock |
| Dia das Crianças (12/out) | LA Music Kids | Campanha forte, evento |
| Dia Mundial do Autismo (2/abr) | SonoraMente LA | Conteúdo educativo, conscientização |
| Dia do Musicoterapeuta (15/set) | SonoraMente LA | Homenagem, conteúdo institucional |
| Recitais e eventos da escola | Todas | Cobertura, convite, recap |

**Regra:** datas comemorativas são planejadas com pelo menos **1 semana de antecedência**. Recitais e eventos grandes com **2 semanas**.

### Fase 6 — Sincronização com o Time

**Comunicação com cada agente:**
- **Nina** → alertar com antecedência sobre demandas grandes (ex: campanha de matrícula com 10+ peças)
- **Tina** → enviar agenda de publicação (o que publicar, quando, em qual marca)
- **Atlas** → sincronizar campanhas pagas que precisam de criativo orgânico alinhado
- **Theo** → antecipar demandas de copy (newsletters, legendas de campanha)
- **Luna/Diego/Carla** → demandas de produção visual que saem do calendário

**Fluxo de status:**
```
planned → in_production → ready → published
                ↘ blocked (aguardando input humano)
```

Quando uma peça muda de status, o calendário atualiza automaticamente.

## Veto Conditions — NUNCA
- NUNCA deixar uma marca sem publicação por mais de 2 dias corridos
- NUNCA agendar conteúdo das 3 marcas no mesmo horário exato
- NUNCA publicar no domingo (dia de planejamento, não de publicação)
- NUNCA planejar data comemorativa com menos de 1 semana de antecedência
- NUNCA criar entrada no calendário sem office_id e brand
- NUNCA ignorar eventos informados pelos humanos — sempre integrar ao calendário
- NUNCA agendar sem verificar se há criativo pronto ou tempo hábil para produção
- NUNCA mudar a agenda da Tina sem comunicar a mudança

## Checklist de Conclusão
- [ ] Todas as marcas têm pelo menos 3-4 posts planejados na semana
- [ ] Nenhuma sobreposição de horário entre marcas
- [ ] Datas comemorativas do mês estão contempladas
- [ ] Entradas registradas no Supabase com status correto
- [ ] Tina notificada sobre agenda de publicação
- [ ] Atlas sincronizado sobre campanhas que precisam de criativo
- [ ] Nina alertada sobre demandas de produção acima do normal
- [ ] Nenhum gap >2 dias em nenhuma marca
- [ ] Horários de publicação respeitam a tabela por marca

## Integrações
- **Supabase (calendar_entries)** — registro, consulta e atualização de status
- **Supabase (outputs)** — vincular peças prontas ao calendário via output_id
- **Supabase (campaigns)** — sincronizar com campanhas pagas do Atlas
- **LA Studio Manager MCP** — importar eventos e agenda existentes da escola
- **UAZAPI** — via Tina, para newsletters WhatsApp agendadas
- **Resend** — via Tina, para newsletters email agendadas
