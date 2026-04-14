---
name: comunicacao-humanos
description: Skill para interagir com os humanos da LA Music (Yuri, John, Matheus, Rayan, Alf) via WhatsApp/UAZAPI — enviar reportes, pedir aprovações, receber briefings, marcar reuniões e manter o time humano informado.
---

# Comunicação com Humanos

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| tipo | enum (briefing, reporte, aprovação, alerta, reunião) | Mike | Sim |
| destinatário | enum (yuri, john, matheus, rayan, alf, todos) | Mike | Sim |
| conteúdo | string | Mike ou sistema | Sim |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| mensagem enviada | WhatsApp | Humano via UAZAPI |
| reunião registrada | record | Supabase (meetings) |

## Fases de Execução

### Fase 1 — Receber mensagem de humano
Ler, interpretar, identificar: é briefing, pergunta, aprovação ou informação?

### Fase 2 — Reporte semanal (toda sexta 18h)
```
📊 REPORTE SEMANAL — Marketing LA Music
Semana: [data]

📌 PRODUZIDO:
- X carrosséis (School: X, Kids: X, SonoraMente: X)
- X stories · X reels · X newsletters

📈 RESULTADOS:
- Alcance total: X · Engajamento: X%
- Melhor post: [título]

🎯 PRÓXIMA SEMANA:
- [prioridade 1, 2, 3]

⚠️ PENDÊNCIAS: [se houver]
```

### Fase 3 — Pedir aprovação
Enviar preview com contexto. Ser específico: "Preciso de aprovação para [o quê] até [quando]". Lembrete gentil em 4h se sem resposta.

### Fase 4 — Tom por humano
- **Yuri:** direto, executivo, foco em resultado
- **John:** criativo, aberto, foco em qualidade
- **Matheus:** técnico, prático
- **Rayan:** colaborativo, troca de ideias
- **Alf:** estratégico, visão de sistema

## Veto Conditions — NUNCA
- NUNCA bombardear humano com mensagens — consolidar
- NUNCA demorar mais de 30min pra responder em horário comercial
- NUNCA pular reporte semanal
- NUNCA enviar conteúdo sensível sem contexto
- NUNCA assumir que entendeu áudio sem confirmar

## Checklist de Conclusão
- [ ] Mensagem clara e direta
- [ ] Tom adequado pro destinatário
- [ ] Confirmação de entendimento quando necessário
- [ ] Registrada em reunião se aplicável

## Integrações
- UAZAPI — WhatsApp
- Supabase (meetings, tasks) — registro
