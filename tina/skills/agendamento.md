---
name: agendamento
description: Skill para programar publicações nos horários ideais por marca e plataforma, respeitando o calendário editorial. Use para agendar posts com antecedência, garantir consistência na frequência de publicação e evitar conflitos entre marcas.
---

# Agendamento

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| office_id | UUID | Contexto do tenant | Sim |
| calendar_entry_id | UUID | Calendário editorial | Sim |
| output_id | UUID | Output aprovado pela Nina | Sim |
| marca | string | Calendar entry | Sim |
| tipo_conteúdo | string | Calendar entry ("carrossel", "story", "reel", "post", "newsletter_email", "newsletter_whatsapp") | Sim |
| plataforma | string | Calendar entry ("instagram", "email", "whatsapp") | Sim |
| data_hora | datetime | Calendário ou Tina ajusta | Sim |
| ação | string | Tina ("agendar", "reagendar", "cancelar") | Sim |
| motivo_reagendamento | string | Mike (se reagendando) | Condicional |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| schedule_entry | registro | Supabase → tabela schedule_entries |
| calendar_update | update | Supabase → calendar_entries (status → 'scheduled') |
| alertas_conflito | lista | Mike (se houver sobreposição) |
| alertas_material | lista | Mike (se material não está pronto) |
| confirmação | texto | Mike/Nina (confirmação de agendamento) |

## Fases de Execução

### Fase 1 — Consultar Calendário Editorial

```sql
-- Buscar entradas do calendário que precisam de agendamento
SELECT ce.id, ce.brand, ce.title, ce.content_type, ce.scheduled_date,
       ce.status, ce.output_id, o.status as output_status,
       o.approval_status
FROM calendar_entries ce
LEFT JOIN outputs o ON ce.output_id = o.id
WHERE ce.office_id = $1
  AND ce.scheduled_date BETWEEN $2 AND $3
  AND ce.status IN ('ready', 'planned')
ORDER BY ce.scheduled_date ASC;

-- Verificar: material pronto e aprovado para cada data?
SELECT ce.id, ce.brand, ce.title, ce.scheduled_date,
       CASE 
         WHEN ce.output_id IS NULL THEN '🔴 Sem output'
         WHEN o.approval_status != 'approved' THEN '🟡 Não aprovado'
         WHEN o.status != 'ready' THEN '🟡 Não finalizado'
         ELSE '✅ Pronto'
       END as status_material
FROM calendar_entries ce
LEFT JOIN outputs o ON ce.output_id = o.id
WHERE ce.office_id = $1
  AND ce.scheduled_date >= NOW()
  AND ce.scheduled_date <= NOW() + INTERVAL '7 days'
ORDER BY ce.scheduled_date ASC;
```

### Fase 2 — Verificar Conflitos e Gaps

```sql
-- Verificar sobreposições (mesma hora para marcas diferentes)
SELECT a.brand as marca_a, b.brand as marca_b,
       a.scheduled_date, a.title as titulo_a, b.title as titulo_b
FROM calendar_entries a
JOIN calendar_entries b ON 
  ABS(EXTRACT(EPOCH FROM (a.scheduled_date - b.scheduled_date))) < 3600  -- menos de 1h de gap
  AND a.brand != b.brand 
  AND a.id < b.id
WHERE a.office_id = $1
  AND a.scheduled_date >= NOW();

-- Verificar gap mínimo de 4h entre publicações da mesma marca
SELECT a.brand, a.title as post_a, b.title as post_b,
       a.scheduled_date as hora_a, b.scheduled_date as hora_b,
       EXTRACT(EPOCH FROM (b.scheduled_date - a.scheduled_date))/3600 as gap_horas
FROM calendar_entries a
JOIN calendar_entries b ON a.brand = b.brand 
  AND b.scheduled_date > a.scheduled_date
  AND EXTRACT(EPOCH FROM (b.scheduled_date - a.scheduled_date))/3600 < 4
  AND a.id != b.id
WHERE a.office_id = $1
  AND a.scheduled_date >= NOW()
ORDER BY a.brand, a.scheduled_date;
```

### Fase 3 — Horários Ideais por Marca e Tipo

**Horários são baseline — ajustar com dados reais do Atlas (kpi_snapshots).**

#### 🎸 LA Music School

| Dia | Tipo | Horário | Plataforma | Prioridade |
|-----|------|---------|------------|------------|
| Segunda | Newsletter email | 09:00 | Email (Resend) | Alta |
| Terça | Carrossel educativo | 18:00 | Instagram | Alta |
| Quarta | Reel | 12:00 | Instagram | Média |
| Quinta | Carrossel/Post | 19:00 | Instagram | Alta |
| Sexta | Newsletter WhatsApp | 18:00 | WhatsApp (UAZAPI) | Alta |
| Sábado | Story bastidores | 11:00 | Instagram | Média |
| Domingo | — (planejamento) | — | — | — |

**Horários de pico School:** 12h-13h (almoço) e 18h-20h (pós-trabalho/aula)

#### 🧠 SonoraMente LA

| Dia | Tipo | Horário | Plataforma | Prioridade |
|-----|------|---------|------------|------------|
| Segunda | Carrossel educativo | 09:00 | Instagram | Alta |
| Terça | — | — | — | — |
| Quarta | Post/Artigo | 10:00 | Instagram | Média |
| Quinta | Story | 09:00 | Instagram | Média |
| Sexta | Newsletter email | 09:00 | Email (Resend) | Alta |
| Sábado | — | — | — | — |
| Domingo | — | — | — | — |

**Horários de pico SonoraMente:** 9h-11h (manhã, pais pesquisando) e 14h (pausa da tarde)

#### 🎨 LA Music Kids

| Dia | Tipo | Horário | Plataforma | Prioridade |
|-----|------|---------|------------|------------|
| Segunda | — | — | — | — |
| Terça | Carrossel | 10:00 | Instagram | Alta |
| Quarta | Story | 08:00 | Instagram | Média |
| Quinta | Reel | 19:00 | Instagram | Alta |
| Sexta | Newsletter WhatsApp | 18:00 | WhatsApp (UAZAPI) | Alta |
| Sábado | Post/Story | 10:00 | Instagram | Média |
| Domingo | — | — | — | — |

**Horários de pico Kids:** 8h-10h (antes do trabalho, pais no celular) e 19h-20h (após jantar)

### Fase 4 — Registrar Agendamento

```sql
-- Criar registro de agendamento
INSERT INTO schedule_entries (
  office_id, calendar_entry_id, output_id,
  brand, content_type, platform,
  scheduled_at, status,
  created_by, created_at
) VALUES (
  $1, $2, $3,
  $4, $5, $6,
  $7, 'scheduled',
  'tina', NOW()
) RETURNING id;

-- Atualizar calendar_entry para 'scheduled'
UPDATE calendar_entries
SET status = 'scheduled',
    scheduled_at = $2,
    updated_at = NOW()
WHERE id = $1 AND office_id = $3;
```

**Reagendamento:**
```sql
-- Reagendar publicação (com motivo registrado)
UPDATE schedule_entries
SET scheduled_at = $2,
    status = 'rescheduled',
    reschedule_reason = $3,
    rescheduled_by = 'tina',
    updated_at = NOW()
WHERE id = $1 AND office_id = $4;

-- Atualizar calendar_entry
UPDATE calendar_entries
SET scheduled_date = $2,
    status = 'scheduled',
    notes = CONCAT(notes, ' | Reagendado: ', $3),
    updated_at = NOW()
WHERE id = $1;
```

### Fase 5 — Execução Automática no Horário

**Fluxo no momento do agendamento:**
```
Horário chegou (cron job ou trigger)
├── Tipo = Instagram?
│   └── Executar skill: publicacao-instagram
├── Tipo = Newsletter email?
│   └── Executar skill: disparo-newsletter (canal: email)
├── Tipo = Newsletter WhatsApp?
│   └── Executar skill: disparo-newsletter (canal: whatsapp)
└── Após execução:
    ├── Atualizar schedule_entry: status → 'executed'
    ├── Atualizar calendar_entry: status → 'published'
    └── Log de execução com timestamp
```

**Verificação 2h antes do horário:**
```sql
-- Alertar se material não está pronto 2h antes
SELECT se.id, se.brand, se.content_type, se.scheduled_at,
       o.status as output_status, o.approval_status
FROM schedule_entries se
JOIN outputs o ON se.output_id = o.id
WHERE se.office_id = $1
  AND se.status = 'scheduled'
  AND se.scheduled_at BETWEEN NOW() AND NOW() + INTERVAL '2 hours'
  AND (o.status != 'ready' OR o.approval_status != 'approved');
```
→ Se material não está pronto: alertar Mike imediatamente.

### Fase 6 — Monitoramento Pós-Publicação

Após cada publicação, Tina:
1. Confirma que publicou corretamente (sem erro da API)
2. Atualiza status no Supabase
3. Monitora métricas iniciais em 1h (via Atlas)
4. Se performance excepcional: alerta Atlas para considerar impulsionamento

## Veto Conditions — NUNCA
- NUNCA agendar publicação sem material aprovado pela Nina
- NUNCA agendar no mesmo horário para 2 marcas diferentes (risco de erro)
- NUNCA agendar com gap menor que 4h entre publicações da mesma marca
- NUNCA agendar em domingo ou feriado sem planejamento explícito de Mike
- NUNCA inventar publicações que não estejam no calendário editorial
- NUNCA reagendar sem autorização do Mike (registrar motivo)
- NUNCA agendar se material não estará pronto até 2h antes do horário
- NUNCA publicar fora do horário ideal da marca sem justificativa

## Checklist de Conclusão
- [ ] Calendário editorial consultado para o período
- [ ] Material verificado: pronto e aprovado para cada data
- [ ] Conflitos de horário verificados (sem sobreposição entre marcas)
- [ ] Gap mínimo de 4h entre publicações da mesma marca respeitado
- [ ] Horário ideal da marca e tipo de conteúdo aplicado
- [ ] Agendamento registrado no Supabase (schedule_entries)
- [ ] Calendar_entry atualizado para status 'scheduled'
- [ ] Alerta configurado para 2h antes (material não pronto)
- [ ] Domingos e feriados verificados (sem publicação acidental)
- [ ] Mike confirmado sobre reagendamentos (se houver)

## Integrações
- **Supabase (calendar_entries)** — fonte de verdade do calendário editorial
- **Supabase (schedule_entries)** — registro de agendamentos
- **Supabase (outputs)** — verificação de status e aprovação do material
- **Instagram Graph API** — publicação programada (via skill publicacao-instagram)
- **Resend API** — disparo de email programado (via skill disparo-newsletter)
- **UAZAPI** — disparo de WhatsApp programado (via skill disparo-newsletter)
