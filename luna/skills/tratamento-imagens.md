---
name: tratamento-imagens
description: Skill para tratar imagens — remoção de fundo, redimensionamento, upscale, composição e ajustes. Use sempre que Luna precisa preparar um asset para uso em peças de design (remover fundo, ajustar proporção, melhorar qualidade, compor elementos).
---

# Tratamento de Imagens

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| asset_id ou image_url | string | Media Library ou upload direto | Sim |
| operação | string | Luna ou briefing ("remove_bg", "upscale", "expand", "resize", "compose") | Sim |
| formato_destino | string | Briefing ("4:5", "1:1", "9:16", "16:9") | Condicional (para resize/expand) |
| dimensão_final | string | Briefing ("1080x1350", "1080x1080", "1080x1920") | Não |
| escala_upscale | string | Luna ("2" ou "4") | Condicional (para upscale) |
| elementos_composição | lista | Luna (overlays, textos, gradientes) | Condicional (para compose) |
| marca | string | Contexto (para nomenclatura e catalogação) | Sim |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| imagem_tratada | arquivo PNG/JPG | Supabase Storage |
| media_asset_atualizado | registro | Supabase → tabela media_assets (tag de tratamento) |
| asset_id_novo | UUID | Diego (diagramação) ou Nina (aprovação) |
| comparação_antes_depois | par de URLs | Verificação de qualidade |

## Fases de Execução

### Fase 1 — Identificar Operação Necessária

**Mapa de decisão:**
```
Imagem recebida
├── Precisa remover fundo?
│   └── Sim → Remoção de fundo (Fase 2)
├── Resolução insuficiente (<1080px)?
│   └── Sim → Upscale (Fase 3)
├── Proporção errada para o formato?
│   ├── Pode cortar sem perder conteúdo → Crop/Resize (Fase 4)
│   └── Cortar perderia conteúdo → Expand/Outpainting (Fase 5)
├── Precisa de composição/montagem?
│   └── Sim → Composição (Fase 6)
└── Múltiplas operações?
    └── Sim → Executar na ordem: remove_bg → upscale → expand → compose
```

**Dimensões padrão por formato:**
| Formato | Proporção | Dimensão (px) | Uso |
|---------|-----------|--------------|-----|
| Feed quadrado | 1:1 | 1080 × 1080 | Post padrão |
| Feed vertical | 4:5 | 1080 × 1350 | Feed otimizado (mais espaço) |
| Story/Reel | 9:16 | 1080 × 1920 | Stories e Reels |
| Newsletter header | 16:9 | 1200 × 675 | Email e WhatsApp |
| Thumbnail | 1:1 | 400 × 400 | Media Library preview |

### Fase 2 — Remoção de Fundo

**Via Pixa MCP:**
```javascript
// Remover fundo de imagem
const result = await pixa.edit_image({
  action: "remove_background",
  image: assetId  // ID do asset no Pixa ou URL da imagem
});
// result.asset_id → novo asset sem fundo
// result.url → URL da imagem processada
```

**Quando usar:**
- Logos que precisam ficar sobre fundos de design
- Instrumentos isolados para composição
- Pessoas/alunos que serão colocadas sobre backgrounds da marca
- Produtos ou elementos que precisam de fundo transparente

**Verificação obrigatória pós-remoção:**
- [ ] Bordas limpas (sem halo branco/escuro ao redor)
- [ ] Sem partes do sujeito cortadas indevidamente
- [ ] Transparência correta (verificar em fundo xadrez)
- [ ] Cabelos e detalhes finos preservados
- [ ] Sombras removidas ou preservadas conforme necessidade

**Se a remoção não ficou limpa:**
1. Tentar novamente com a imagem em maior resolução (upscale primeiro)
2. Se persistir, usar GPT-image para edição manual da máscara
3. Se ainda assim falhar, reportar para Luna buscar alternativa

### Fase 3 — Upscale (Aumento de Resolução)

**Via Pixa MCP:**
```javascript
// Upscale 2x (dobra a resolução)
const result = await pixa.edit_image({
  action: "upscale",
  image: assetId,
  scale: "2"    // "2" ou "4"
});

// Upscale 4x (quadruplica — usar com cuidado, pode gerar artefatos)
const result = await pixa.edit_image({
  action: "upscale",
  image: assetId,
  scale: "4"
});
```

**Quando usar:**
- Imagem boa em conteúdo mas resolução insuficiente para 1080px
- Foto de humano/evento que não pode ser regravada
- Asset gerado por IA em resolução menor que a necessária

**Regras de upscale:**
| Resolução original | Escala recomendada | Resultado |
|--------------------|--------------------|-----------|
| 540px+ | 2x | ✅ Excelente |
| 270-540px | 4x | 🟡 Bom (verificar artefatos) |
| <270px | — | 🔴 Muito pequena, buscar alternativa |

**Verificação pós-upscale:**
- [ ] Sem artefatos de upscaling (borrões, pixels inventados)
- [ ] Detalhes finos preservados (olhos, texto, bordas)
- [ ] Resolução final ≥ 1080px na menor dimensão

### Fase 4 — Redimensionamento / Crop

**Quando crop é suficiente (sem perda de conteúdo importante):**
```javascript
// Redimensionamento simples — usar Sharp (Node) ou Pillow (Python)
// Em pipeline de processamento:
const sharp = require('sharp');

// Crop para 4:5 centrado
await sharp(inputPath)
  .resize(1080, 1350, { fit: 'cover', position: 'center' })
  .toFile(outputPath);

// Crop para 1:1 centrado
await sharp(inputPath)
  .resize(1080, 1080, { fit: 'cover', position: 'center' })
  .toFile(outputPath);

// Crop para 9:16 centrado
await sharp(inputPath)
  .resize(1080, 1920, { fit: 'cover', position: 'center' })
  .toFile(outputPath);

// Resize mantendo proporção (fit dentro de limite)
await sharp(inputPath)
  .resize(1080, null, { fit: 'inside', withoutEnlargement: true })
  .toFile(outputPath);
```

**Verificação pós-crop:**
- [ ] Sujeito principal não foi cortado
- [ ] Composição continua equilibrada
- [ ] Espaço para texto overlay preservado (se necessário)
- [ ] Qualidade mantida (mínimo 72dpi para tela)

### Fase 5 — Expand / Outpainting

**Via Pixa MCP:**
```javascript
// Expandir para proporção 4:5 (IA preenche as bordas)
const result = await pixa.edit_image({
  action: "expand",
  image: assetId,
  aspect_ratio: "4:5"   // "1:1", "9:16", "16:9"
});

// Expandir com pixels específicos em cada direção
const result = await pixa.edit_image({
  action: "expand",
  image: assetId,
  top: 200,     // pixels a expandir em cima
  bottom: 200,  // pixels a expandir embaixo
  left: 0,      // pixels a expandir à esquerda
  right: 0      // pixels a expandir à direita
});
```

**Quando usar (em vez de crop):**
- Foto 16:9 que precisa virar 4:5 sem cortar o sujeito
- Imagem centralizada que precisa de mais espaço ao redor
- Asset que precisa de área para texto overlay mas não tem margem

**Verificação pós-expand:**
- [ ] Conteúdo gerado pela IA é coerente com a imagem original
- [ ] Sem emendas visíveis entre original e gerado
- [ ] Cores e iluminação consistentes
- [ ] Nenhum elemento indesejado apareceu na expansão

### Fase 6 — Composição e Montagem

**Tipos de composição:**

**Overlay de elementos sobre foto:**
- Gradiente escuro na parte inferior (para texto legível sobre foto)
- Badge ou selo sobre imagem
- Elemento decorativo (notas musicais, ondas sonoras)

**Blend de imagens:**
- Montagem com transparência (foto + background de marca)
- Colagem de múltiplas fotos
- Duo-tone ou color overlay com cor da marca

**Preparação para JSX/Diego:**
- Se a composição final será feita em código (JSX), Luna prepara:
  - Imagem base tratada (fundo removido ou ajustado)
  - Assets isolados em camadas separadas (PNGs transparentes)
  - Especificações de posição e tamanho para Diego

**Regras de composição por marca:**

| Marca | Sobreposição de texto | Estilo overlay | Cores |
|-------|----------------------|----------------|-------|
| LA Music School | Gradiente escuro bold | Alto contraste, angulado | Pink #E91E63 sobre dark #1A1A2E |
| SonoraMente LA | Gradiente suave translúcido | Delicado, orgânico | Roxo #3D1A6E em opacity baixa |
| LA Music Kids | Fundo sólido vibrante ou translúcido | Colorido, arredondado | Laranja #FF6B35, Turquesa #4ECDC4 |

### Fase 7 — Salvar e Catalogar

**Regras de salvamento:**
1. **Arquivo original NUNCA é sobrescrito** — sempre criar arquivo novo
2. **Nomenclatura:** `{marca}_{tipo}_{tratamento}_{data}.png`
   - Ex: `la-music-school_foto_sem-fundo_20260413.png`
   - Ex: `sonoramente_background_expand-4x5_20260413.png`
3. **Tag de tratamento** adicionada ao registro na Media Library
4. **Imagens tratadas** registradas com referência ao asset original

```sql
-- Registrar asset tratado com referência ao original
INSERT INTO media_assets (
  office_id, brand, type, file_url, thumbnail_url,
  source, treatment, original_asset_id, tags,
  width, height, aspect_ratio, created_by
) VALUES (
  $1, $2, $3, $4, $5,
  'treated', $6, $7, $8::text[],
  $9, $10, $11, 'luna'
) RETURNING id;

-- Atualizar tags do asset original (registrar que tem versão tratada)
UPDATE media_assets
SET tags = array_append(tags, 'has-treated-version'),
    updated_at = NOW()
WHERE id = $1;
```

## Veto Conditions — NUNCA
- NUNCA sobrescrever o arquivo original — sempre criar cópia tratada
- NUNCA entregar imagem tratada sem verificar qualidade (zoom, bordas, artefatos)
- NUNCA alterar rostos ou corpos de humanos reais da escola (só tratar, nunca modificar aparência)
- NUNCA fazer upscale 4x em imagem abaixo de 270px (resultado será inutilizável)
- NUNCA entregar composição sem verificar coerência de cores com Design System da marca
- NUNCA usar expand/outpainting em fotos de eventos reais (resultado pode ficar artificial)
- NUNCA salvar asset tratado sem tag de tratamento aplicado
- NUNCA descartar o original após tratamento — manter sempre como referência

## Checklist de Conclusão
- [ ] Operação correta identificada (remove_bg / upscale / expand / resize / compose)
- [ ] Tratamento executado com sucesso
- [ ] Qualidade verificada pós-tratamento (zoom, bordas, artefatos, cores)
- [ ] Arquivo original preservado (não sobrescrito)
- [ ] Novo arquivo salvo com nomenclatura padrão
- [ ] Registro atualizado na Media Library com tag de tratamento
- [ ] Proporção e dimensão corretas para formato de destino
- [ ] Se composição: cores coerentes com Design System da marca
- [ ] Asset pronto comunicado ao solicitante (Nina, Diego, Carla)

## Integrações
- **Nano Banana / Pixa MCP** — `remove_background`, `upscale`, `expand` (edição de imagem)
- **OpenAI API (GPT-image)** — edição avançada quando Pixa não resolve (máscara, composição)
- **Supabase Storage** — upload de assets tratados
- **Supabase (media_assets)** — atualização de tags, metadados, referência ao original
- **Sharp (Node.js)** — crop, resize, conversão de formato em pipeline
