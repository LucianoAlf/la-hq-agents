---
name: coordenacao-demandas
description: Skill para receber briefings dos humanos ou de outros departamentos, analisar a demanda, distribuir tarefas para os agentes corretos do squad de Marketing, definir prioridades e cobrar prazos. Use sempre que Mike receber uma nova demanda, pedido ou briefing que precisa ser transformado em tarefas para o time.
---

# Coordenação de Demandas

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| briefing | string | Humano ou sistema | Sim |
| marca | enum (la-music-school, la-music-kids, sonoramente) | Humano | Sim |
| prazo | date | Humano ou Mike define | Não |
| urgência | enum (alta, média, baixa) | Mike avalia | Sim |
| material_apoio | files | Humano | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| task registrada | record | Supabase (tasks) |
| briefing distribuído | mensagem | Nina ou agente direto |
| confirmação | mensagem | Humano que pediu |

## Fases de Execução

### Fase 1 — Receber e analisar
1. Identificar: O que está sendo pedido? Para qual marca? Qual prazo?
2. Classificar tipo: carrossel, story, vídeo, newsletter, campanha, conteúdo avulso
3. Verificar se há material de apoio (fotos, textos, referências)
4. Avaliar urgência: evento próximo? Data comemorativa? Rotina?

### Fase 2 — Definir rota de execução
| Tipo de demanda | Rota |
|----------------|------|
| Conteúdo visual (carrossel, story, post) | Mike → Nina → Luna + Diego + Theo |
| Vídeo (reel, story animado) | Mike → Nina → Luna + Carla + Theo |
| Newsletter (email/WhatsApp) | Mike → Theo → Tina |
| Campanha paga | Mike → Atlas + Nina (criativo) |
| Landing page / Bio | Mike → Nina → Diego |
| Copy urgente | Mike → Theo (direto) |

### Fase 3 — Registrar no Supabase
Criar task com: agent_id, squad_id, type, brand, input (briefing), status ('pending'), prazo

### Fase 4 — Comunicar ao time
Enviar briefing claro para Nina (ou agente direto se urgência) com: o quê, marca, prazo, contexto

### Fase 5 — Acompanhar e confirmar
Verificar status periodicamente. Cobrar se prazo se aproxima. Confirmar entrega com humano.

## Veto Conditions — NUNCA
- NUNCA executar a tarefa do agente — sempre delegar
- NUNCA pular a Nina pra demandas criativas (exceto copy urgente pro Theo)
- NUNCA aceitar demanda sem saber pra qual marca é
- NUNCA deixar demanda sem registrar no Supabase
- NUNCA prometer prazo sem verificar carga do time

## Checklist de Conclusão
- [ ] Demanda analisada e classificada
- [ ] Rota de execução definida
- [ ] Task registrada no Supabase
- [ ] Briefing enviado ao agente responsável
- [ ] Humano confirmado que entendemos o pedido

## Integrações
- Supabase (tasks, agents) — registro e acompanhamento
- UAZAPI — comunicação com humanos
- LA Studio Manager MCP — contexto de demandas existentes
