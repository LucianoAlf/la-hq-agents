# Análise inicial — la-hq-agents

## Veredito
Este repositório já é praticamente o blueprint de um escritório de marketing multiagente da LA Music. A estrutura está muito mais madura do que um simples conjunto de prompts: tem papéis, skills, brand guides, design systems, checklists, integração e fluxo operacional.

## Estrutura encontrada
- 8 agentes/personas: Mike, Nina, Theo, Luna, Diego, Carla, Atlas, Tina.
- 34 skills distribuídas por função.
- 4 brand guides: grupo LA Music, School, Kids, SonoraMente.
- 3 design systems HTML: School, Kids, SonoraMente.
- Checklists de qualidade: visual, copy, narrativa, tráfego.
- Integrações mapeadas: Supabase, UAZAPI, Resend, OpenAI/GPT-image, Gemini/Imagen, Instagram, Meta Ads, Puppeteer, Remotion.

## Pipeline natural
1. Mike coordena demanda e calendário.
2. Nina define direção criativa, briefing e aprovação.
3. Theo escreve copy por marca.
4. Luna gera/trata assets visuais.
5. Diego monta carrosséis/posts/stories em HTML/JSX e exporta PNG via Puppeteer.
6. Carla produz vídeos/Reels/Stories animados via Remotion.
7. Atlas cuida tráfego/performance.
8. Tina publica/distribui após aprovação.

## Ouro imediato
- `shared/brand-guides/brand-la-music-grupo.md`: DNA cultural, Equações de Valor, manifesto e universo visual.
- `nina/skills/guardiao-design-systems.md`: referência rápida perfeita para virar regra operacional do Alfredo.
- `diego/skills/montagem-carrossel.md`: já define formato 1080x1350, anatomia de slides, CSS tokens e exportação Puppeteer.
- `luna/skills/geracao-imagens.md`: já define política de modelo: Imagen 3 volume, GPT-image versatilidade, Imagen 4 fotorealismo.
- `shared/integracoes-compartilhadas.md`: mapa de APIs e infraestrutura.

## Próximo passo recomendado
Transformar esse repo em uma skill OpenClaw nativa: `la-design-system` ou `la-hq-marketing`.

A primeira versão deve conter:
- SKILL.md enxuto com gatilhos: carrossel, post, story, reel, LA Music, Kids, SonoraMente, Equações de Valor.
- Referências importadas dos brand guides e DS.
- Pipeline padrão: briefing → copy → imagem → montagem/exportação → QA.
- Presets visuais:
  1. LA Music School — impacto/pink/rock/atitude
  2. LA Music Kids — lúdico/confiante/colorido
  3. SonoraMente — acolhedor/científico/roxo
  4. Alf Autoridade — editorial premium/fotorrealista

## Atenção
O repo descreve Supabase/Instagram/Meta/Resend como integrações, mas ainda precisa conferir quais credenciais existem no ambiente antes de prometer publicação ou upload automático.
