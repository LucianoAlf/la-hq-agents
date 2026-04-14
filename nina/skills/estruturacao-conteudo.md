---
name: estruturacao-conteudo
description: Skill para planejar a estrutura completa de carrosséis, stories e reels — quantidade de slides, sequência, hierarquia visual, temas por slide. Use antes de briefar o time.
---

# Estruturação de Conteúdo

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| marca | enum | Direção criativa | Sim |
| formato | enum (carrossel, story, reel) | Direção criativa | Sim |
| tema | string | Direção criativa | Sim |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| estrutura de slides/cenas | documento | Briefing criativo |

## Anatomia do Carrossel por Marca

### LA Music School
| Slide | Tema | Função |
|-------|------|--------|
| 01 — Capa | Dark | Parar no feed. Diagonal pink, título Bebas Neue, tag, "Deslize →" |
| 02 a N-1 | Cream/Dark alternado | Entregar valor. Dica, check, badge, numeração |
| N — CTA | Pink | Converter. Headline, botão pill branco, logo, @lamusicschool |

### SonoraMente LA
| Slide | Tema | Função |
|-------|------|--------|
| 01 — Capa | Roxo Profundo | Acolher. Título Playfair, tag lavanda |
| 02 a N-1 | Light/Roxo alternado | Educar. DM Sans, checks roxo |
| N — CTA | Roxo | Convidar. Botão branco pill, @sonoramentela |

### LA Music Kids
| Slide | Tema | Função |
|-------|------|--------|
| 01 — Capa | Dark/Azul | Atrair. Baloo 2, ondas coloridas |
| 02 a N-1 | Branco/Dark alternado | Informar. Badges coloridos, Nunito |
| N — CTA | Azul | Converter. Botão amarelo, @lamusickids |

## Distribuição por quantidade
- **4 slides:** Capa + 2 conteúdo + CTA (dica rápida)
- **6 slides:** Capa + 4 conteúdo + CTA (tutorial curto)
- **8 slides:** Capa + 6 conteúdo + CTA (guia completo)
- **10 slides:** Capa + 8 conteúdo + CTA (masterclass)

## Estrutura de Story (3-5 sequência)
1. Gancho (pergunta/provocação) → 2-3. Conteúdo → 4-5. CTA (enquete/link/DM)

## Veto Conditions — NUNCA
- NUNCA começar carrossel sem capa dark/forte
- NUNCA terminar sem CTA
- NUNCA amontoar informação num slide só
- NUNCA usar mesmo tema em todos os slides (alternar)

## Checklist de Conclusão
- [ ] Estrutura definida com slide-a-slide
- [ ] Tema por slide definido (dark/cream/pink ou equivalente)
- [ ] CTA claro no slide final
- [ ] Número de slides adequado ao conteúdo

## Integrações
- Design Systems — anatomia do carrossel por marca
- Supabase (calendar_entries) — contexto
