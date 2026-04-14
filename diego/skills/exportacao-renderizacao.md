---
name: exportacao-renderizacao
description: Skill técnica para renderizar HTML/JSX em PNG via Puppeteer na VPS, incluindo configuração, carregamento de fontes, embed de imagens em base64, debug de problemas de renderização e otimização de qualidade. Use sempre que Diego precisa exportar peças finais (carrossel, story, post) de HTML para imagem.
---

# Exportação e Renderização

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| html_files[] | lista de arquivos HTML | Diego (montagem) ou template gerado | Sim |
| formato | string | Briefing ("carrossel", "story", "post") | Sim |
| marca | string | Briefing (define fontes e DS) | Sim |
| imagens_embed[] | lista de caminhos/URLs | Media Library ou geração | Não |
| qualidade | string | Default "alta" ("alta", "média", "preview") | Não |
| output_path | string | Destino no Supabase Storage | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| png_files[] | arquivos PNG | Supabase Storage → pasta do output |
| output_registro | registro | Supabase → tabela outputs |
| preview_urls[] | lista URLs | Nina (aprovação) ou Tina (publicação) |
| tamanho_total | int (bytes) | Mike (controle de storage) |
| relatório_render | objeto | Log (tempo de render, erros, warnings) |

## Fases de Execução

### Fase 1 — Configuração de Viewport por Formato

```javascript
const VIEWPORTS = {
  carrossel:  { width: 1080, height: 1350 },  // 4:5
  story:      { width: 1080, height: 1920 },  // 9:16
  post:       { width: 1080, height: 1080 },  // 1:1
  newsletter: { width: 600,  height: 800  },  // email padrão
  cover:      { width: 1920, height: 1080 },  // 16:9 (capa YouTube, Facebook)
  thumbnail:  { width: 400,  height: 400  },  // preview
};

// Device scale factor para alta resolução
const SCALE_FACTORS = {
  alta:    2,  // 2160x2700 para carrossel (retina quality)
  média:   1,  // 1080x1350 padrão
  preview: 0.5 // 540x675 para aprovação rápida
};
```

### Fase 2 — Carregamento de Fontes por Marca

**Todas as fontes devem ser incluídas no HTML antes da renderização:**

```html
<!-- ============================================ -->
<!-- FONTES LA MUSIC SCHOOL                       -->
<!-- ============================================ -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<!-- Fallback: Inter para corpo alternativo -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

<!-- ============================================ -->
<!-- FONTES SONORAMENTE LA                        -->
<!-- ============================================ -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<!-- Fallback: Source Sans Pro -->
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet">

<!-- ============================================ -->
<!-- FONTES LA MUSIC KIDS                         -->
<!-- ============================================ -->
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

**Mapa de fontes por marca (referência rápida):**

| Marca | Título | Corpo | Destaque |
|-------|--------|-------|----------|
| LA Music School | Bebas Neue (uppercase) | Montserrat / Inter | Bebas Neue bold |
| SonoraMente LA | Playfair Display | DM Sans / Source Sans Pro | Playfair Display italic |
| LA Music Kids | Baloo 2 | Nunito | Baloo 2 bold |

### Fase 3 — Embed de Imagens em Base64

**Converter imagens locais para base64 (garante renderização offline):**

```javascript
const fs = require('fs');
const path = require('path');

/**
 * Converte imagem local para data URI base64
 * @param {string} imagePath - Caminho da imagem
 * @returns {string} Data URI pronta para usar em src=""
 */
function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).slice(1);
  const mimeTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    gif: 'image/gif'
  };
  const mime = mimeTypes[ext] || 'image/png';
  return `data:${mime};base64,${base64}`;
}

// Uso no HTML:
// <img src="${imageToBase64('./assets/foto.png')}" />
```

**Converter imagem de URL remota para base64:**
```javascript
const fetch = require('node-fetch');

async function urlToBase64(imageUrl) {
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();
  const base64 = buffer.toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

// Para imagens do Supabase Storage:
const supabaseUrl = supabase.storage.from('media-assets').getPublicUrl('path/to/image.png');
const base64Uri = await urlToBase64(supabaseUrl.data.publicUrl);
```

**Substituir todas as imagens do HTML por base64 automaticamente:**
```javascript
/**
 * Processa HTML substituindo todas as <img src="..."> por base64
 * @param {string} html - HTML com referências de imagem
 * @param {string} basePath - Diretório base para imagens locais
 * @returns {string} HTML com imagens embedadas
 */
async function embedAllImages(html, basePath) {
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  let match;
  let result = html;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    let base64Uri;
    
    if (src.startsWith('http')) {
      base64Uri = await urlToBase64(src);
    } else if (!src.startsWith('data:')) {
      const fullPath = path.resolve(basePath, src);
      base64Uri = imageToBase64(fullPath);
    } else {
      continue; // já é base64
    }
    
    result = result.replace(src, base64Uri);
  }
  
  return result;
}
```

### Fase 4 — Renderização via Puppeteer

**Renderização padrão (single page):**
```javascript
const puppeteer = require('puppeteer');

async function renderHtmlToPng(htmlPath, outputPath, format = 'carrossel', quality = 'alta') {
  const viewport = VIEWPORTS[format];
  const scale = SCALE_FACTORS[quality];
  
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',  // evita crash por memória
      '--font-render-hinting=none' // renderização de fonte mais consistente
    ]
  });
  
  const page = await browser.newPage();
  
  // Configurar viewport com device scale factor
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: scale
  });
  
  // Carregar HTML
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  // CRÍTICO: Esperar fontes carregarem completamente
  await page.evaluateHandle('document.fonts.ready');
  
  // Espera extra para garantir renderização (fontes pesadas)
  await page.waitForTimeout(500);
  
  // Screenshot
  await page.screenshot({
    path: outputPath,
    type: 'png',
    fullPage: false,  // respeitar viewport, não scrollar
    omitBackground: false
  });
  
  await browser.close();
  
  return outputPath;
}
```

**Renderização em batch (carrossel com múltiplos slides):**
```javascript
async function renderCarousel(htmlPaths, outputDir, marca) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const outputs = [];
  
  for (let i = 0; i < htmlPaths.length; i++) {
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1080,
      height: 1350,
      deviceScaleFactor: 2
    });
    
    await page.goto(`file://${htmlPaths[i]}`, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    await page.waitForTimeout(500);
    
    const outputPath = `${outputDir}/${marca}_slide_${String(i + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: outputPath, type: 'png' });
    
    outputs.push(outputPath);
    await page.close();
  }
  
  await browser.close();
  return outputs;
}
```

### Fase 5 — Troubleshooting

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| Fonte não renderizou (serif genérica) | Google Fonts não carregou a tempo | Usar `waitUntil: 'networkidle0'` + `document.fonts.ready` + `waitForTimeout(500)` |
| Imagem em branco | Caminho da imagem errado ou CORS | Usar base64 em vez de caminho local ou URL remota |
| Cores diferentes do esperado | CSS variable `:root` não resolvida | Verificar que `:root` está definido no HTML e não depende de JS |
| PNG muito pesado (>2MB) | Resolução excessiva ou imagem complexa | Comprimir com pngquant ou reduzir deviceScaleFactor |
| Crash do Puppeteer | Memória insuficiente na VPS | Usar `--disable-dev-shm-usage`, fechar pages após uso, processar em batch menor |
| Texto cortado | Overflow no container | Verificar CSS: `overflow: hidden` vs conteúdo que excede |
| Espaçamento errado | Font-size rendering diferente | Usar px em vez de rem/em para consistência pixel-perfect |
| Background transparente indesejado | `omitBackground: true` no screenshot | Setar `omitBackground: false` ou definir background explícito no HTML |
| Sombras/gradientes com banding | deviceScaleFactor baixo | Aumentar para 2x e comprimir depois |

**Debug visual — gerar preview antes do final:**
```javascript
// Preview rápido para verificação antes de render final
async function renderPreview(htmlPath) {
  return renderHtmlToPng(htmlPath, 'preview.png', 'carrossel', 'preview');
  // Gera 540x675 — leve e rápido para verificação visual
}
```

### Fase 6 — Otimização de Tamanho

**Compressão de PNG sem perda visual:**
```bash
# Comprimir PNG com pngquant (lossy mas imperceptível)
pngquant --quality=80-95 --speed 1 --output output_compressed.png output.png

# Comprimir PNG com optipng (lossless — mais lento)
optipng -o5 output.png

# Batch: comprimir todos os PNGs de um diretório
for f in *.png; do pngquant --quality=80-95 --speed 1 --ext .png --force "$f"; done
```

**Compressão programática com Sharp:**
```javascript
const sharp = require('sharp');

async function compressPng(inputPath, outputPath, quality = 90) {
  await sharp(inputPath)
    .png({
      quality: quality,        // 1-100
      compressionLevel: 9,     // 0-9 (9 = máxima compressão)
      adaptiveFiltering: true,
      palette: true            // reduz cores se possível
    })
    .toFile(outputPath);
  
  // Log do resultado
  const original = fs.statSync(inputPath).size;
  const compressed = fs.statSync(outputPath).size;
  const reduction = ((1 - compressed / original) * 100).toFixed(1);
  console.log(`Comprimido: ${(original/1024).toFixed(0)}KB → ${(compressed/1024).toFixed(0)}KB (-${reduction}%)`);
}
```

**Limites de tamanho:**
| Destino | Limite recomendado | Limite máximo |
|---------|-------------------|---------------|
| Instagram Feed | < 1MB | 8MB |
| Instagram Story | < 1.5MB | 8MB |
| Newsletter Email | < 500KB | 1MB |
| WhatsApp | < 1MB | 5MB |
| Supabase Storage | < 2MB | 50MB |

### Fase 7 — Upload e Registro

**Upload para Supabase Storage:**
```javascript
async function uploadRendered(filePath, marca, tipo, taskId) {
  const fileName = path.basename(filePath);
  const storagePath = `outputs/${marca}/${tipo}/${taskId}/${fileName}`;
  
  const fileBuffer = fs.readFileSync(filePath);
  
  const { data, error } = await supabase.storage
    .from('outputs')
    .upload(storagePath, fileBuffer, {
      contentType: 'image/png',
      upsert: false
    });
  
  if (error) throw error;
  
  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from('outputs')
    .getPublicUrl(storagePath);
  
  return urlData.publicUrl;
}
```

**Registrar no Supabase (tabela outputs):**
```sql
INSERT INTO outputs (
  office_id, task_id, brand, type, format,
  file_urls, file_sizes, total_slides,
  rendered_by, render_time_ms,
  status, created_at
) VALUES (
  $1, $2, $3, $4, $5,
  $6::text[], $7::int[], $8,
  'diego', $9,
  'ready_for_review', NOW()
) RETURNING id;
```

## Veto Conditions — NUNCA
- NUNCA entregar PNG sem verificar visualmente (zoom, fontes, cores, imagens)
- NUNCA renderizar sem `waitUntil: 'networkidle0'` + `document.fonts.ready`
- NUNCA usar caminhos locais de imagem — sempre converter para base64
- NUNCA entregar PNG acima de 2MB sem comprimir primeiro
- NUNCA renderizar sem conferir que o viewport está correto para o formato
- NUNCA deixar de incluir as fontes Google Fonts no HTML
- NUNCA processar batch grande sem `--disable-dev-shm-usage` (crash de memória)
- NUNCA sobrescrever PNGs já aprovados por Nina

## Checklist de Conclusão
- [ ] Viewport configurado corretamente para o formato (1080x1350 / 1080x1920 / 1080x1080)
- [ ] Fontes da marca carregadas e renderizando corretamente
- [ ] Imagens convertidas para base64 (sem dependência de URLs/caminhos)
- [ ] Renderização executada com `networkidle0` + `fonts.ready` + delay
- [ ] PNG verificado visualmente (zoom 100%: fonte, cor, imagem, espaçamento)
- [ ] Tamanho do PNG dentro do limite (<2MB, ideal <1MB)
- [ ] Compressão aplicada se necessário (pngquant ou sharp)
- [ ] Upload feito para Supabase Storage com path organizado
- [ ] Output registrado na tabela outputs com status `ready_for_review`
- [ ] Preview enviado para Nina aprovar

## Integrações
- **Puppeteer** — renderização HTML→PNG na VPS (187.127.9.25)
- **Sharp (Node.js)** — compressão, resize, otimização de imagens
- **pngquant** — compressão lossy de PNG (CLI)
- **Supabase Storage** — upload dos PNGs finais
- **Supabase (outputs)** — registro de outputs renderizados
- **Google Fonts CDN** — carregamento de fontes por marca
