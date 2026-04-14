---
name: gestao-media-library
description: Skill para organizar, taguear, catalogar e manter o banco de assets visuais (Media Library) das 3 marcas. Use sempre que Luna precisa salvar, buscar, organizar ou limpar assets no banco de imagens e vídeos.
---

# Gestão da Media Library

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| office_id | UUID | Contexto do tenant | Sim |
| ação | string | Luna ou automático ("salvar", "buscar", "limpar", "gerar_preventivo", "auditar") | Sim |
| assets[] | lista de arquivos | Geração de imagens, tratamento, upload humano | Condicional (para "salvar") |
| filtros | objeto | Luna ou agente solicitante (marca, tipo, tags, modelo) | Condicional (para "buscar") |
| marca | string | Contexto da operação | Não (default: todas) |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| media_assets[] | registros | Supabase → tabela media_assets |
| asset_ids[] | lista UUID | Agente solicitante (Nina, Diego, Carla) |
| relatório_auditoria | markdown | Mike (para relatório de performance) |
| assets_removidos | lista | Log interno (motivo da remoção) |
| banco_preventivo_status | objeto | Mike (cobertura por marca/tipo) |

## Fases de Execução

### Fase 1 — Estrutura de Organização e Tags

**Tags obrigatórias (todo asset DEVE ter):**

| Tag | Valores possíveis | Exemplo |
|-----|-------------------|---------|
| **marca** | `la-music-school`, `la-music-kids`, `sonoramente`, `grupo` | `la-music-school` |
| **tipo** | `foto`, `ilustracao`, `background`, `elemento`, `logo`, `icone`, `video`, `gif` | `foto` |
| **instrumento** | `guitarra`, `piano`, `bateria`, `violao`, `ukulele`, `voz`, `xilofone`, `percussao`, `geral` | `guitarra` |
| **modelo_ia** | `nano-banana-2`, `gpt-image`, `imagen-4`, `flux-2`, `humano` | `nano-banana-2` |
| **uso** | `carrossel`, `story`, `reel`, `newsletter`, `post`, `campanha`, `geral` | `carrossel` |
| **tratamento** | `original`, `sem-fundo`, `upscale`, `expand`, `editado` | `sem-fundo` |
| **status** | `disponível`, `em-uso`, `arquivado`, `descartado` | `disponível` |

**Tags opcionais (enriquecem a busca):**

| Tag | Valores possíveis | Exemplo |
|-----|-------------------|---------|
| **mood** | `energetico`, `calmo`, `divertido`, `profissional`, `emocional` | `energetico` |
| **cor_dominante** | hex da cor predominante | `#E91E63` |
| **cenário** | `estúdio`, `sala-aula`, `palco`, `ar-livre`, `terapia`, `abstrato` | `estúdio` |
| **faixa_etária** | `criança`, `adolescente`, `adulto`, `família`, `geral` | `adulto` |
| **campanha** | ID ou nome da campanha associada | `matriculas-2026` |

### Fase 2 — Salvar e Catalogar Assets

**Registro no Supabase:**
```sql
-- Inserir novo asset com tags completas
INSERT INTO media_assets (
  office_id, brand, type, file_url, thumbnail_url,
  source, prompt, model_used, tags,
  width, height, aspect_ratio, file_size,
  instrument, mood, scenario, treatment,
  status, briefing_id, created_by, created_at
) VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8, $9::text[],
  $10, $11, $12, $13,
  $14, $15, $16, $17,
  'disponível', $18, 'luna', NOW()
) RETURNING id;

-- Atualizar tags de asset existente
UPDATE media_assets 
SET tags = tags || $2::text[],
    treatment = $3,
    updated_at = NOW()
WHERE id = $1 AND office_id = $4;

-- Marcar asset como em uso (vinculado a output)
UPDATE media_assets
SET status = 'em-uso',
    output_ids = array_append(output_ids, $2)
WHERE id = $1;
```

**Nomenclatura padrão de arquivo:**
```
{marca}_{tipo}_{descrição}_{data}_{seq}.{ext}

Exemplos:
la-music-school_foto_guitarrista-estudio_20260413_01.png
sonoramente_background_ondas-roxo_20260413_01.png
la-music-kids_ilustracao_instrumentos-infantis_20260413_01.png
la-music-school_elemento_logo-branco_20260413_01.svg
```

### Fase 3 — Buscar Assets

**Queries de busca por cenário:**
```sql
-- Busca por marca e instrumento
SELECT id, brand, type, file_url, thumbnail_url, tags, 
       model_used, prompt, created_at
FROM media_assets
WHERE office_id = $1 
  AND brand = $2 
  AND 'guitarra' = ANY(tags)
  AND status = 'disponível'
ORDER BY created_at DESC;

-- Busca por modelo de IA usado
SELECT id, brand, type, file_url, model_used, prompt
FROM media_assets 
WHERE office_id = $1
  AND model_used = $2
  AND status = 'disponível'
ORDER BY created_at DESC;

-- Busca por tipo e uso (ex: backgrounds para carrossel)
SELECT id, brand, file_url, thumbnail_url, tags
FROM media_assets
WHERE office_id = $1
  AND type = 'background'
  AND 'carrossel' = ANY(tags)
  AND brand = $2
  AND status = 'disponível'
ORDER BY created_at DESC
LIMIT 20;

-- Busca textual (por descrição ou prompt)
SELECT id, brand, type, file_url, prompt, tags
FROM media_assets
WHERE office_id = $1
  AND (prompt ILIKE '%' || $2 || '%'
       OR array_to_string(tags, ' ') ILIKE '%' || $2 || '%')
  AND status = 'disponível'
ORDER BY created_at DESC
LIMIT 20;

-- Assets recentes (últimos 20)
SELECT id, brand, type, file_url, thumbnail_url, tags, created_at
FROM media_assets 
WHERE office_id = $1
ORDER BY created_at DESC 
LIMIT 20;

-- Contagem por marca e tipo (visão geral do banco)
SELECT brand, type, COUNT(*) as total,
       COUNT(CASE WHEN status = 'disponível' THEN 1 END) as disponíveis
FROM media_assets
WHERE office_id = $1
GROUP BY brand, type
ORDER BY brand, total DESC;
```

### Fase 4 — Manutenção Periódica

**Semanal — Completar tags:**
```sql
-- Assets sem tags completas (faltando marca, tipo ou instrumento)
SELECT id, brand, type, file_url, tags, created_at
FROM media_assets
WHERE office_id = $1
  AND (brand IS NULL 
       OR type IS NULL 
       OR tags IS NULL 
       OR array_length(tags, 1) < 3)
ORDER BY created_at DESC;
```
→ Luna completa manualmente as tags faltantes.

**Mensal — Remover duplicatas e baixa qualidade:**
```sql
-- Possíveis duplicatas (mesmo prompt e modelo)
SELECT prompt, model_used, COUNT(*) as duplicatas,
       array_agg(id) as asset_ids
FROM media_assets
WHERE office_id = $1
  AND prompt IS NOT NULL
GROUP BY prompt, model_used
HAVING COUNT(*) > 1;

-- Assets nunca usados há mais de 90 dias
SELECT id, brand, type, file_url, created_at
FROM media_assets
WHERE office_id = $1
  AND status = 'disponível'
  AND id NOT IN (SELECT UNNEST(asset_ids) FROM outputs WHERE asset_ids IS NOT NULL)
  AND created_at < NOW() - INTERVAL '90 days'
ORDER BY created_at ASC;
```
→ Duplicatas: manter a melhor, arquivar as outras.
→ Assets velhos sem uso: marcar como `arquivado` (não deletar).

**Trimestral — Gerar banco preventivo sazonal:**
- Verificar eventos do próximo trimestre (calendário editorial)
- Gerar assets temáticos antecipadamente
- Ex: Natal → backgrounds com tema natalino por marca; Volta às aulas → fotos de estúdio, crianças

### Fase 5 — Banco Preventivo por Marca

Manter pelo menos **10 assets de cada tipo** por marca:

**LA Music School:**
| Tipo | Qtd mínima | Exemplos |
|------|-----------|----------|
| Backgrounds dark | 10 | Estúdio escuro, texturas grunge, diagonal stripes |
| Instrumentos isolados | 10 | Guitarra, baixo, bateria, teclado (fundo transparente) |
| Pessoas tocando | 10 | Guitarrista, baterista, vocalista (rostos IA genéricos) |
| Elementos decorativos | 10 | Notas musicais rock, raios, palhetas, amplificadores |

**SonoraMente LA:**
| Tipo | Qtd mínima | Exemplos |
|------|-----------|----------|
| Backgrounds suaves | 10 | Gradientes roxo/lilás, ondas sonoras, texturas orgânicas |
| Crianças em terapia | 10 | Criança tocando xilofone, com terapeuta (rostos IA) |
| Instrumentos terapêuticos | 10 | Xilofone, tambor, kalimba, flauta doce (fundo transparente) |
| Elementos decorativos | 10 | Ondas sonoras, notas suaves, formas orgânicas, cérebro estilizado |

**LA Music Kids:**
| Tipo | Qtd mínima | Exemplos |
|------|-----------|----------|
| Backgrounds coloridos | 10 | Padrões catavento, cores vibrantes, confetti musical |
| Crianças musicais | 10 | Crianças tocando ukulele, cantando, dançando (rostos IA) |
| Instrumentos infantis | 10 | Ukulele, maracas, pandeiro, triângulo (fundo transparente) |
| Elementos decorativos | 10 | Notas musicais coloridas, estrelas, catavento, balões |

**Query para verificar cobertura:**
```sql
-- Status do banco preventivo por marca e tipo
SELECT brand, type, COUNT(*) as total,
       CASE 
         WHEN COUNT(*) >= 10 THEN '✅ OK'
         WHEN COUNT(*) >= 5 THEN '🟡 Baixo'
         ELSE '🔴 Crítico'
       END as status
FROM media_assets
WHERE office_id = $1
  AND status = 'disponível'
GROUP BY brand, type
ORDER BY brand, total ASC;
```

## Veto Conditions — NUNCA
- NUNCA salvar asset sem tags completas (marca, tipo, instrumento mínimo)
- NUNCA salvar asset gerado por IA sem registrar o prompt usado
- NUNCA deletar asset que está referenciado em output publicado (marcar como `arquivado`)
- NUNCA sobrescrever arquivo original — sempre criar arquivo novo
- NUNCA misturar assets de marca diferente na mesma pasta/collection
- NUNCA deixar assets de humanos reais sem marcar `source: humano`
- NUNCA deixar o banco preventivo abaixo de 5 assets por tipo/marca sem alertar Mike
- NUNCA fazer manutenção destrutiva (deleção) sem backup ou marcação como `arquivado` primeiro

## Checklist de Conclusão
- [ ] Asset salvo com todas as tags obrigatórias preenchidas
- [ ] Prompt de geração registrado (para assets de IA)
- [ ] Nomenclatura segue padrão `{marca}_{tipo}_{desc}_{data}_{seq}.{ext}`
- [ ] Thumbnail gerado para o asset
- [ ] Status do asset definido corretamente (`disponível`, `em-uso`, `arquivado`)
- [ ] Source marcado (`ai_generated`, `humano`, `stock`)
- [ ] Banco preventivo com ≥10 assets por tipo/marca (verificar semanalmente)
- [ ] Assets sem tags auditados e completados (verificar semanalmente)
- [ ] Duplicatas verificadas e resolvidas (verificar mensalmente)

## Integrações
- **Supabase Storage** — armazenamento físico dos arquivos de imagem/vídeo
- **Supabase (media_assets)** — catalogação, tags, busca, metadados
- **Supabase (outputs)** — referência cruzada de quais outputs usam quais assets
- **Nano Banana / Pixa MCP** — collections para organização visual de assets
- **Pixa MCP (assets)** — gerenciamento de assets no Pixa (upload, metadata)
