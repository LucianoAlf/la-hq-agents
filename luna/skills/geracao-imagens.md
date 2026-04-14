---
name: geracao-imagens
description: Skill para gerar imagens via IA usando Imagen 3 (volume/custo baixo), GPT-image (versatilidade/edição) e Imagen 4 (fotorealismo). Use sempre que Luna precisa criar assets visuais para qualquer material das 3 marcas.
---

# Geração de Imagens

## Fase 2 — Escolher Modelo de IA

| Modelo | Provider | Quando usar | Custo | Qualidade | API |
|--------|----------|------------|-------|-----------|-----|
| **Imagen 3** | Google Gemini API | Volume, iterações rápidas, backgrounds, assets gerais | Baixo (gratuito/barato) | Boa | Gemini REST API (GEMINI_API_KEY) |
| **GPT-image** | OpenAI (assinatura $100) | Versatilidade, edição, composição complexa, texto em imagem | Médio (assinatura) | Alta | OpenAI Images API (OAuth) |
| **Imagen 4** | Google Gemini API | Fotorealismo máximo, peças premium, campanhas | Médio | Muito alta | Gemini REST API (GEMINI_API_KEY) |

Regra de ouro: usar o modelo mais barato que resolve. Se Imagen 3 atende, não gastar Imagen 4.

## Integrações
- **Google Gemini API (Imagen 3/4)** — geração de imagens via REST API com GEMINI_API_KEY
- **OpenAI (GPT-image)** — geração e edição de imagens via assinatura OAuth
- **Supabase Storage** — upload e armazenamento de arquivos de imagem
- **Supabase (media_assets)** — catalogação, tags, busca de assets
- **Supabase (agent_costs)** — registro de custo por geração
