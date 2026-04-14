---
name: geracao-imagens
description: Skill para gerar imagens via IA usando Nano Banana 2 (volume/custo baixo), GPT-image (versatilidade/edição) e Imagen 4 (fotorealismo). Use sempre que Luna precisa criar assets visuais — fotos, ilustrações, backgrounds, elementos gráficos — para qualquer material das 3 marcas.
---

# Geração de Imagens

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| briefing_visual | objeto | Nina (direção criativa) | Sim |
| marca | string | Briefing ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| estilo | string | Briefing ("fotorealista", "ilustração", "abstrato", "composição") | Sim |
| proporção | string | Briefing ("4:5", "1:1", "9:16", "16:9") | Sim |
| elementos_obrigatórios | lista | Briefing (instrumentos, pessoas, cenários) | Não |
| elementos_proibidos | lista | Briefing (o que NÃO pode aparecer) | Não |
| fundo | string | Briefing ("transparente", "cenário", "cor sólida") | Não |
| modelo_preferido | string | Luna decide ou Mike orienta por custo | Não |
| quantidade | int | Briefing (default: 3 variações) | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| imagens_geradas[] | arquivos PNG/JPG | Supabase Storage |
| media_assets[] | registros | Supabase → tabela media_assets (com prompt salvo) |
| asset_ids[] | lista UUID | Nina (para aprovação) ou Diego (para diagramação) |
| variações_descartadas | lista | Log interno (motivo do descarte) |
| custo_geração | objeto | Supabase → agent_costs (modelo, tokens, créditos) |

## Fases de Execução

### Fase 1 — Interpretar Briefing da Nina

Extrair do briefing de direção criativa:
- **Estilo:** fotorealista, ilustração, abstrato, composição mista
- **Proporção:** 4:5 (feed), 1:1 (quadrado), 9:16 (stories/reels), 16:9 (newsletter)
- **Elementos obrigatórios:** instrumentos específicos, tipo de pessoa, cenário
- **Elementos proibidos:** rostos reais de alunos, elementos de marca errada
- **Fundo:** transparente (para composição), cenário (para post final), cor sólida
- **Mood:** energia/atitude (School), acolhimento/calma (SonoraMente), diversão/cor (Kids)

### Fase 2 — Escolher Modelo de IA

| Modelo | Provider | Quando usar | Custo | Qualidade | API/MCP |
|--------|----------|------------|-------|-----------|---------|
| **Nano Banana 2** | Pixa MCP | Volume, iterações rápidas, backgrounds, assets gerais, testes de conceito | Baixo (~40 créditos) | Boa | `generate_media(model="nano-banana-2")` |
| **GPT-image** | OpenAI API | Versatilidade, edição de imagem existente, composição complexa, texto em imagem | Médio (assinatura) | Alta | Via OpenAI API `gpt-image` |
| **Imagen 4** | Gemini/Pixa | Fotorealismo máximo, peças premium, campanhas, hero images | Alto | Muito alta | `generate_media(model="imagen-4-ultra")` |
| **Flux 2** | Pixa MCP | Alternativa alta qualidade, estilo artístico, quando Imagen 4 não resolve | Médio | Alta | `generate_media(model="flux-2")` |

**Árvore de decisão para escolha de modelo:**
```
Precisa de imagem?
├── Background ou asset genérico?
│   └── Sim → Nano Banana 2 (mais barato)
├── Precisa editar imagem existente?
│   └── Sim → GPT-image (melhor para edição)
├── Fotorealismo é essencial?
│   ├── Sim, peça premium → Imagen 4 Ultra
│   └── Sim, mas não premium → Flux 2
├── Ilustração ou estilo artístico?
│   └── Sim → Flux 2 ou GPT-image
└── Texto precisa aparecer na imagem?
    └── Sim → GPT-image (melhor para texto legível)
```

**Regra de ouro:** usar o modelo mais barato que resolve. Se Nano Banana 2 atende, não gastar Imagen 4.

### Fase 3 — Criar Prompt Otimizado

**Estrutura universal de prompt eficaz:**
```
[estilo fotográfico/artístico] [sujeito principal] [ação/pose/estado]
[cenário/fundo] [iluminação] [composição/enquadramento]
[paleta de cores/mood] [detalhes técnicos: proporção, resolução]
```

**Modificadores por qualidade:**
- Fotorealismo: `professional photograph, 8k, sharp focus, shallow depth of field`
- Ilustração: `digital illustration, clean lines, vector style, flat design`
- Abstrato: `abstract composition, geometric shapes, gradient, minimalist`

---

#### Prompts-template por marca:

**🎸 LA Music School — prompts com energia e atitude:**
```
Professional photograph of a young guitarist playing electric guitar,
dramatic side lighting, dark studio background with subtle smoke,
focus on hands and guitar neck, moody atmosphere, high contrast,
wearing black t-shirt, rock attitude, 4:5 aspect ratio, 8k sharp

---

Dynamic close-up of drum sticks hitting snare drum, motion blur on sticks,
sharp focus on drum head, dramatic overhead lighting, dark background,
energy and power, professional music studio, 4:5 aspect ratio

---

Portrait of a confident young vocalist singing into studio microphone,
dramatic rim lighting, dark background with pink accent light (#E91E63),
passion and intensity, professional studio setting, shallow depth of field

---

Dark textured background with subtle diagonal stripes, grunge texture overlay,
perfect for text overlay, LA Music School brand colors (#E91E63 accent),
1080x1350px, dark navy (#1A1A2E) base
```

**🧠 SonoraMente LA — prompts acolhedores e científicos:**
```
Warm soft photograph of a child playing colorful xylophone with a therapist,
gentle natural window lighting, cozy therapy room with wooden toys,
pastel purple tones (#3D1A6E accent), welcoming atmosphere,
shallow depth of field, calm and nurturing mood, 4:5 aspect ratio

---

Tender moment of a small child's hands touching piano keys for the first time,
soft golden hour lighting, warm tones, therapeutic setting,
close-up macro shot, hope and discovery, gentle bokeh background

---

Abstract sound wave visualization in soft purple gradient,
flowing organic shapes, calming colors (#3D1A6E to #E0B0FF),
clean minimalist composition, suitable for text overlay,
representing music therapy and healing

---

Soft pastel background with gentle wave patterns, lavender (#F8F5FF) base,
subtle organic shapes, warm accents (#F4A261), clean and calming,
perfect for educational content overlay, 1080x1350px
```

**🎨 LA Music Kids — prompts divertidos e coloridos:**
```
Bright colorful photograph of a happy child holding a small ukulele,
vibrant studio lighting, clean white background, joyful expression,
high energy, primary colors accents (orange #FF6B35, turquoise #4ECDC4),
child age 4-6, natural genuine smile, 4:5 aspect ratio

---

Playful flat illustration of musical instruments for children,
colorful xylophone, small drum, maracas, triangle, tambourine,
bright vivid colors, clean vector style, white background,
fun and educational, suitable for carousel slides

---

Cheerful classroom scene with children clapping and singing together,
bright natural lighting, colorful room decorations, musical notes floating,
warm and inviting atmosphere, diversity of children, joy and movement

---

Colorful pattern background with musical notes and instruments,
catavento (pinwheel) motif, four rotating colors (#FF6B35, #4ECDC4, #FFE66D, #FF6B9D),
playful but professional, suitable for text overlay, 1080x1350px
```

### Fase 4 — Gerar Imagens via API/MCP

**Geração via Pixa MCP (Nano Banana 2 / Imagen 4 / Flux 2):**
```javascript
// Nano Banana 2 — volume e custo baixo
const result = await pixa.generate_media({
  model: "nano-banana-2",
  prompt: promptOtimizado,
  aspect_ratio: "4:5",       // "1:1", "9:16", "16:9"
  num_variations: 3,          // sempre gerar variações
  output_format: "png"        // ou "jpg" para fotos
});
// result.job_id → usar para poll de status
// result.asset_id → usar para operações downstream

// Imagen 4 Ultra — fotorealismo premium
const result = await pixa.generate_media({
  model: "imagen-4-ultra",
  prompt: promptOtimizado,
  aspect_ratio: "4:5",
  num_variations: 2,          // caro, gerar menos variações
  output_format: "png"
});

// Flux 2 — alta qualidade alternativa
const result = await pixa.generate_media({
  model: "flux-2",
  prompt: promptOtimizado,
  aspect_ratio: "4:5",
  num_variations: 3,
  output_format: "png"
});
```

**Geração via OpenAI API (GPT-image):**
```javascript
const response = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: "gpt-image-1",
    prompt: promptOtimizado,
    n: 3,
    size: "1024x1536",     // ~4:5 | "1024x1024" para 1:1 | "1536x1024" para 16:9
    quality: "high"
  })
});
const data = await response.json();
// data.data[].url → URLs temporárias das imagens geradas
// Baixar e salvar no Supabase Storage imediatamente (URLs expiram)
```

**Edição de imagem existente via GPT-image:**
```javascript
// Para editar/compor sobre imagem existente
const formData = new FormData();
formData.append("image", imageFile);
formData.append("prompt", "Add warm purple lighting and sound wave overlay");
formData.append("model", "gpt-image-1");
formData.append("size", "1024x1536");

const response = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
  body: formData
});
```

### Fase 5 — Selecionar e Validar

**Critérios de seleção (em ordem de prioridade):**
1. **Aderência ao briefing** — atende o que Nina pediu?
2. **Qualidade técnica** — sem artefatos, sem mãos deformadas, sem rostos distorcidos
3. **Coerência com Design System** — cores, mood, estilo condizem com a marca?
4. **Composição** — permite overlay de texto? Hierarquia visual funciona?
5. **Resolução** — mínimo 1080px na menor dimensão

**Checklist de qualidade por imagem:**
- [ ] Sem artefatos visuais (glitches, borrões, distorções)
- [ ] Mãos com 5 dedos (problema clássico de IA)
- [ ] Rostos proporcionais e naturais
- [ ] Texto legível (se houver texto na imagem)
- [ ] Cores coerentes com a paleta da marca
- [ ] Proporção correta para o formato de destino
- [ ] Resolução ≥ 1080px na menor dimensão

**Se nenhuma variação atende:** ajustar prompt e gerar novamente (max 3 tentativas por briefing antes de escalar para Nina).

### Fase 6 — Salvar e Catalogar

**Upload para Supabase Storage:**
```javascript
const { data, error } = await supabase.storage
  .from('media-assets')
  .upload(
    `${marca}/${tipo}/${marca}_${tipo}_${desc}_${Date.now()}.png`,
    imageBuffer,
    { contentType: 'image/png' }
  );
```

**Registro na Media Library:**
```sql
INSERT INTO media_assets (
  office_id, brand, type, file_url, thumbnail_url,
  source, prompt, model_used, tags, 
  width, height, aspect_ratio, file_size,
  briefing_id, created_by, created_at
) VALUES (
  $1, $2, $3, $4, $5,
  'ai_generated', $6, $7, $8::text[],
  $9, $10, $11, $12,
  $13, 'luna', NOW()
);
```

**Nomenclatura padrão:**
```
{marca}_{tipo}_{descrição}_{data}_{seq}.png

Exemplos:
la-music-school_background_dark-studio_20260413_01.png
sonoramente_foto_crianca-xilofone_20260413_01.png
la-music-kids_ilustracao_instrumentos-infantis_20260413_01.png
```

**Comunicar entrega:**
- Se Nina pediu → notificar Nina com asset_ids para aprovação
- Se Diego precisa → notificar Diego que assets estão prontos para diagramação
- Se banco preventivo → catalogar e deixar disponível na Media Library

## Veto Conditions — NUNCA
- NUNCA gerar rostos de alunos reais da escola — usar apenas rostos genéricos de IA
- NUNCA entregar imagem com artefatos visíveis (mãos deformadas, rostos distorcidos, glitches)
- NUNCA gerar imagem com estilo visual de uma marca para conteúdo de outra (ex: visual "rock" para SonoraMente)
- NUNCA usar Imagen 4 quando Nano Banana 2 resolve (controle de custo)
- NUNCA salvar asset sem tags completas e prompt registrado
- NUNCA sobrescrever arquivo original — sempre criar novo
- NUNCA gerar imagem sem briefing de direção criativa da Nina
- NUNCA entregar sem gerar pelo menos 2-3 variações para escolha
- NUNCA gerar conteúdo inapropriado para crianças em assets da Kids ou SonoraMente
- NUNCA usar URL temporária da OpenAI sem baixar e salvar no Supabase (URLs expiram)

## Checklist de Conclusão
- [ ] Briefing da Nina interpretado corretamente (estilo, proporção, elementos, marca)
- [ ] Modelo de IA escolhido com base em custo-benefício
- [ ] Prompt otimizado com estrutura padrão + modificadores por marca
- [ ] Pelo menos 2-3 variações geradas
- [ ] Todas as variações verificadas (artefatos, qualidade, aderência)
- [ ] Melhor variação selecionada (ou top 3 enviadas para Nina escolher)
- [ ] Asset salvo no Supabase Storage com nomenclatura padrão
- [ ] Registro criado na Media Library com tags, prompt e metadados completos
- [ ] Custo da geração registrado em agent_costs
- [ ] Nina ou Diego notificados com asset_ids

## Integrações
- **Nano Banana / Pixa MCP** — geração de imagens (Nano Banana 2, Imagen 4 Ultra, Flux 2)
- **OpenAI API** — GPT-image (geração e edição de imagens)
- **Supabase Storage** — upload e armazenamento de arquivos de imagem
- **Supabase (media_assets)** — catalogação, tags, busca de assets
- **Supabase (agent_costs)** — registro de custo por geração (modelo, créditos, tokens)
