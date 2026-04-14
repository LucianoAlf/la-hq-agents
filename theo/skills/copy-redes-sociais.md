---
name: copy-redes-sociais
description: Skill para escrever legendas de Instagram (carrosséis, posts, reels), incluindo ganchos, corpo, CTAs e hashtags, adaptando tom por marca. Use sempre que Theo escreve copy pra redes sociais.
---

# Copy para Redes Sociais

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| briefing | documento | Nina | Sim |
| marca | enum | Briefing | Sim |
| formato | enum (carrossel, post, reel) | Briefing | Sim |
| tema | string | Briefing | Sim |

## Saída
Legenda completa (gancho + corpo + CTA + hashtags) → Diego/Nina

## Estrutura da Legenda

### Gancho (2 primeiras linhas — visíveis antes do "mais")
Tipos: pergunta provocativa, dado surpreendente, provocação, promessa

### Corpo (após o "mais")
Parágrafos curtos, emojis como bullets quando adequado, informação acionável

### CTA (final)
Específico: "Salva pra praticar 🎵" | "Comenta qual dica precisava" | "Link na bio"

### Hashtags
Máx 10. Mix: 3-4 volume alto + 3-4 nicho + 2-3 marca

## Awareness Routing (do copy-squad)
| Nível | Gancho |
|-------|--------|
| Most Aware (já conhece a escola) | Oferta direta, urgência |
| Product Aware (conhece mas não convenceu) | Prova social, diferencial |
| Solution Aware (sabe que quer aula) | Mecanismo, método LA Music |
| Problem Aware (quer aprender) | Empatia, agitação do problema |
| Unaware (nem sabe que quer) | História, curiosidade, pattern interrupt |

## Tom por Marca
- **School:** Direto, técnico, atitude. "Segure com leveza. A palheta precisa de liberdade."
- **SonoraMente:** Acolhedor, científico. "Cada criança tem seu ritmo."
- **Kids:** Divertido, confiante. "Seu filho vai aprender brincando!"

## Veto Conditions — NUNCA
- NUNCA clichê ("venha fazer parte da família" PROIBIDO)
- NUNCA gancho genérico
- NUNCA misturar tom entre marcas
- NUNCA sem CTA
- NUNCA mais de 10 hashtags
- NUNCA erro de português

## Checklist de Conclusão
- [ ] Gancho prende nas 2 primeiras linhas
- [ ] Tom da marca correto
- [ ] CTA claro e específico
- [ ] Hashtags relevantes (máx 10)
- [ ] Zero erro de português

## Integrações
- Supabase (outputs), Brand Guides (tom), Design Systems
