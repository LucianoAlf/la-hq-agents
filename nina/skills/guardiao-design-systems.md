---
name: guardiao-design-systems
description: Referência rápida dos 3 Design Systems da LA Music. Use sempre que verificar cores, fontes, elementos, tokens ou regras de qualquer marca. Garante que nenhuma marca saia fora da identidade.
---

# Guardião dos Design Systems

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| marca | enum | Qualquer contexto | Sim |
| elemento_verificar | string | Nina | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| referência visual | dados | Nina (verificação) |

## Quick Reference

### LA Music School — "Pra Quem Sabe o Que Quer!"
- **Paleta:** Pink #E91E63 (primária), Dark #C2185B, Light #F06292, Black #0A0A0A, Cream #F5F1EC
- **Display:** Bebas Neue — SEMPRE UPPERCASE
- **Corpo:** Montserrat
- **Elemento:** Faixa diagonal pink (-8°)
- **Temas:** Dark (#0A0A0A) · Light (#F5F1EC) · Pink (#E91E63)
- **Tom:** Direto, impactante, energético

### SonoraMente LA — "onde o som cuida da mente"
- **Paleta:** Roxo Profundo #3D1A6E, Roxo #5B2D8E, Claro #7B4DBE, Lavanda #B39DDB, Creme #FAF8FF
- **Display:** Playfair Display — serifada, elegante
- **Corpo:** DM Sans
- **Elemento:** Gradientes suaves em roxo, bordas 16px
- **Temas:** Roxo Profundo · Light (#FAF8FF) · Roxo (#5B2D8E)
- **Tom:** Acolhedor, científico, humano

### LA Music Kids — "música não é só pra gente grande"
- **Paleta:** Amarelo #FFF212, Verde #17B255, Azul #00AFEF, Vermelho #ED3237
- **Display:** Baloo 2 — arredondada, bold
- **Corpo:** Nunito
- **Elemento:** Ondas coloridas, barra 4 cores
- **Temas:** Branco · Dark (#1A1A1A) · Azul (#00AFEF)
- **Tom:** Divertido, confiante, lúdico

## Tabela NUNCA MISTURAR
| Erro | Marca errada |
|------|-------------|
| Pink em SonoraMente | SonoraMente = ROXO |
| Bebas Neue na Kids | Kids = Baloo 2 |
| Tom infantil na SonoraMente | SonoraMente = acolhedor + científico |
| Diagonal pink na Kids | Kids = ondas coloridas |
| Playfair na School | School = Bebas Neue |

## Veto Conditions — NUNCA
- NUNCA aprovar peça com cor de outra marca
- NUNCA aprovar peça com fonte de outra marca
- NUNCA contaminar uma marca com elementos de outra
- NUNCA improvisar elemento visual sem consultar DS completo

## Integrações
- Arquivos de Design System (3 documentos HTML/PDF)
- Brand Guides (4 documentos .md)
