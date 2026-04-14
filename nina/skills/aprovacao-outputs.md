---
name: aprovacao-outputs
description: Skill para verificar e aprovar (ou reprovar com feedback) todo material produzido pelo time. NENHUMA peça sai sem aprovação da Nina. Use sempre que um output está pronto e precisa de aprovação.
---

# Aprovação de Outputs

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| output | arquivo(s) | Agente que produziu | Sim |
| briefing_original | referência | Supabase (tasks) | Sim |
| agente_origem | enum | Sistema | Sim |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| veredicto | enum (APPROVE/REVISE/REJECT) | Agente de origem / Tina |
| feedback | string (se REVISE/REJECT) | Agente de origem |
| output atualizado | record | Supabase (outputs) |

## Fases de Execução

### Fase 1 — Entender contexto
Reler briefing original. O que foi pedido vs o que foi entregue? Qual marca?

### Fase 2 — Aplicar checklist de qualidade
Usar `checklists/checklist-qualidade-visual.md` para peças visuais.
Usar `checklists/checklist-qualidade-copy.md` para textos.

### Fase 3 — Scoring e decisão

| Score | Veredicto | Ação |
|-------|-----------|------|
| Todos CRITICAL ok, < 2 falhas | **APPROVE** | → Tina publica |
| Todos CRITICAL ok, 2+ falhas | **REVISE** | → Volta pro agente com feedback |
| Qualquer CRITICAL falhou | **REJECT** | → Volta pro agente, bloqueia entrega |

### Fase 4 — Feedback (se REVISE ou REJECT)
```
## Review Report
Agente: [nome]
Veredicto: [APPROVE/REVISE/REJECT]
Score: [X/Y itens passaram]

### Aprovado ✅
- [itens que passaram]

### Problemas Encontrados
- [CRITICAL/WARN] [descrição] — [como corrigir]

### Recomendação
[Próximo passo]
```

## Veto Conditions — NUNCA
- NUNCA aprovar output com falha CRITICAL
- NUNCA reprovar sem feedback específico e construtivo
- NUNCA modificar o output do agente — só revisar e dar feedback
- NUNCA aprovar peça que mistura Design Systems de marcas diferentes
- NUNCA dizer "tá ruim" — dizer "o título precisa de mais contraste, usar palavra em pink"

## Checklist de Conclusão
- [ ] Briefing original relido
- [ ] Checklist de qualidade aplicado
- [ ] Veredicto definido (APPROVE/REVISE/REJECT)
- [ ] Feedback específico dado (se não aprovado)
- [ ] Output atualizado no Supabase

## Integrações
- Supabase (outputs, tasks) — registro
- Checklists de qualidade — referência
- Design Systems — verificação
