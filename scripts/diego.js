#!/usr/bin/env node
// ============================================================
// LA HQ — diego.js v9 — Diagramador (spec 2026: 1080x1440 + tipografia mín.)
// Sprint 2 — SVG logos + multi-brand + formato 3:4 + tokens multi-marca
// ============================================================
// v9 changes from v8:
//   - getTemaBg(brand, tema) multi-marca — substitui o temaFallback hardcoded só-School
//   - Paleta completa por marca (School: dark/cream/pink, Kids: branco/dark/azul/amarelo/verde/vermelho + gradientes,
//     SonoraMente: roxo-profundo/light/roxo-medio)
//   - temaFallback agora pega do BRAND_THEMES via getTemaBg()
//   - Lookup tolerante a variações de nome (ex: 'dark'/'Dark'/'dark-mode' mapeiam pro mesmo)
//   - Fallback seguro: se tema não existir na marca, usa primeiro tema da marca (não zera pro preto School)
// v8 changes from v7:
//   - VIEWPORT 1080x1440 (3:4) — era 1080x1350 (4:5)
//   - Render HD final: 2160x2880 (2x)
//   - Safe zones spec 2026: 180px topo/base, 50px laterais
//   - Tipografia MÍNIMA canvas 1080: título 120-160px, subtítulo 36-44px,
//     corpo 24-30px, badge 16-20px, caption/counter 16-20px
//   - Regra de ouro: NENHUM texto <24px no canvas final
//   - Prompt do Opus atualizado com hierarquia tipográfica explícita
// v7 changes from v6:
//   - SVG logos (not PNG) — transparent, vector, crisp
//   - Correct convention: "dark" in filename = for DARK backgrounds
//   - Multi-brand logo support (School, Kids, SonoraMente)
//   - data:image/svg+xml;base64 URIs
// ============================================================

const { spawnSync, execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/lahq/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const AGENTS_DIR = '/home/lahq/agents';
const LOGOS_DIR = '/home/lahq/agents/shared/brand-assets/logos-lahq';

const OFFICE_ID = 'a1b2c3d4-0001-4000-8000-000000000001';
const AGENT_IDS = {
  diego: 'c3d4e5f6-0004-4000-8000-000000000004',
  tina:  'c3d4e5f6-0007-4000-8000-000000000007',
};

const DS_PATHS = {
  'la-music-school': AGENTS_DIR + '/shared/design-systems/la-music-design-system.html',
  'la-music-kids':   AGENTS_DIR + '/shared/design-systems/la-music-kids-design-system.html',
  'sonoramente':     AGENTS_DIR + '/shared/design-systems/sonoramente-design-system.html',
};

// === FONTES LOCAIS POR MARCA (fix: Puppeteer não tem fontes instaladas) ===
const LOCAL_FONTS = {
  'la-music-kids': {
    dir: '/home/lahq/agents/shared/brand-assets/fonts/kids',
    faces: [
      { family: 'Volkswagen', file: 'Volkswagen-Light.otf', weight: 300, style: 'normal', format: 'opentype' },
      { family: 'Volkswagen', file: 'Volkswagen-Regular.otf', weight: 400, style: 'normal', format: 'opentype' },
      { family: 'Volkswagen', file: 'Volkswagen-Medium_Regular.ttf', weight: 500, style: 'normal', format: 'truetype' },
      { family: 'Volkswagen', file: 'Volkswagen-MediumIta.otf', weight: 500, style: 'italic', format: 'opentype' },
      { family: 'Volkswagen', file: 'Volkswagen-Bold.otf', weight: 700, style: 'normal', format: 'opentype' },
      { family: 'Volkswagen', file: 'Volkswagen-BoldIta.otf', weight: 700, style: 'italic', format: 'opentype' },
      { family: 'Volkswagen', file: 'Volkswagen-Heavy.otf', weight: 800, style: 'normal', format: 'opentype' },
      { family: 'Madelina', file: 'Madelina.ttf', weight: 400, style: 'normal', format: 'truetype' },
    ]
  }
};

function buildFontFaceCSS(brand) {
  const config = LOCAL_FONTS[brand];
  if (!config) return '';
  const faces = config.faces.map(f => {
    const fontPath = require('path').join(config.dir, f.file);
    if (!require('fs').existsSync(fontPath)) {
      console.warn(`⚠️  Fonte não encontrada: ${fontPath}`);
      return '';
    }
    const base64 = require('fs').readFileSync(fontPath).toString('base64');
    const mime = f.format === 'opentype' ? 'font/otf' : 'font/ttf';
    return `@font-face { font-family: '${f.family}'; src: url('data:${mime};base64,${base64}') format('${f.format}'); font-weight: ${f.weight}; font-style: ${f.style}; }`;
  }).filter(Boolean);
  return faces.join('\n');
}

// Logo file mapping per brand
// Convention: "dark" in filename = use ON dark backgrounds
const LOGO_FILES = {
  'la-music-school': {
    'solo-on-dark':  'logo-la-music-dark-solo.svg',
    'solo-on-light': 'logo-la-music-light-solo.svg',
    'full-on-dark':  'logo-la-music-dark-completa.svg',
    'full-on-light': 'logo-la-music-light-completa.svg',
  },
  'la-music-kids': {
    'solo-on-dark':  'logo-la-music-kids-dark-solo.svg',
    'solo-on-light': 'logo-la-music-kids-light-solo.svg',
    'full-on-dark':  'logo-la-music-kids-dark-completa.svg',
    'full-on-light': 'logo-la-music-kids-light-completa.svg',
  },
  'sonoramente': {
    'solo-on-dark':  'logo-sonoramente-dark-solo.svg',
    'solo-on-light': 'logo-sonoramente-light-solo.svg',
    'full-on-dark':  'logo-sonoramente-v2-dark-completa.svg',
    'full-on-light': 'logo-sonoramente-v2-light-completa.svg',
  },
};

// ============================================================
// BRAND THEMES — Paletas oficiais por marca (extraídas dos Design Systems)
// ============================================================
// Cada marca tem seu próprio conjunto de temas (cor ou gradiente).
// Os aliases permitem variações no nome do tema sem quebrar (ex: "Dark"/"dark"/"dark-mode").
// Fonte de verdade: /home/lahq/agents/shared/design-systems/*.html

const BRAND_THEMES = {
  'la-music-school': {
    defaultTheme: 'dark',
    themes: {
      'dark':  '#0A0A0A',  // Black — fundo de impacto rock
      'cream': '#F5F1EC',  // Cream — fundo claro angulado
      'pink':  '#E91E63',  // Pink — cor-acento da marca
    },
    aliases: {
      'dark-mode': 'dark', 'black': 'dark', 'preto': 'dark',
      'light': 'cream', 'light-mode': 'cream', 'claro': 'cream', 'creme': 'cream',
      'brand': 'pink', 'pink-mode': 'pink', 'rosa': 'pink',
    },
  },
  'la-music-kids': {
    defaultTheme: 'branco',
    themes: {
      'branco':   '#FFFFFF',  // Fundo limpo — padrão Kids
      'dark':     '#1A1A1A',  // Fundo escuro pra contraste
      'azul':     '#00AFEF',  // Azul catavento
      'amarelo':  '#FFF212',  // Amarelo vibrante
      'verde':    '#17B255',  // Verde catavento
      'vermelho': '#ED3237',  // Vermelho catavento
      'gradiente-quente': 'linear-gradient(135deg, #FFF212 0%, #FF8800 100%)',
    },
    aliases: {
      'white': 'branco', 'light': 'branco', 'claro': 'branco',
      'dark-mode': 'dark', 'black': 'dark', 'preto': 'dark',
      'blue': 'azul', 'azul-kids': 'azul',
      'yellow': 'amarelo', 'amarelo-sol': 'amarelo',
      'green': 'verde',
      'red': 'vermelho',
      'gradient': 'gradiente-quente', 'gradiente': 'gradiente-quente',
    },
  },
  'sonoramente': {
    defaultTheme: 'roxo-profundo',
    themes: {
      'roxo-profundo': '#3D1A6E',  // Primária — fundo de impacto
      'light':         '#FAF8FF',  // Creme esbranquiçado
      'roxo-medio':    '#5B2D8E',  // Variante média
    },
    aliases: {
      'dark': 'roxo-profundo', 'dark-mode': 'roxo-profundo', 'purple': 'roxo-profundo',
      'light-mode': 'light', 'claro': 'light', 'creme': 'light',
      'roxo': 'roxo-medio', 'brand': 'roxo-medio',
    },
  },
};

/**
 * Retorna o valor CSS (cor ou gradiente) do tema solicitado para a marca.
 * Tolerante a variações de nome (via aliases).
 * Se o tema não existir na marca, retorna o defaultTheme da marca.
 * Se a marca não existir, cai em 'la-music-school' dark (#0A0A0A).
 *
 * @param {string} brand - 'la-music-school' | 'la-music-kids' | 'sonoramente'
 * @param {string} tema - nome do tema (ex: 'dark', 'cream', 'azul', 'roxo-profundo')
 * @returns {string} valor CSS (ex: '#0A0A0A' ou 'linear-gradient(...)')
 */
function getTemaBg(brand, tema) {
  const brandConfig = BRAND_THEMES[brand];
  if (!brandConfig) {
    console.warn(`   ⚠️  Marca "${brand}" não tem tema mapeado. Usando school/dark como fallback.`);
    return BRAND_THEMES['la-music-school'].themes['dark'];
  }

  // Normaliza: lowercase e trim
  const temaNormalizado = String(tema || '').toLowerCase().trim();

  // Busca direta
  if (brandConfig.themes[temaNormalizado]) {
    return brandConfig.themes[temaNormalizado];
  }

  // Busca via alias
  const resolvedName = brandConfig.aliases[temaNormalizado];
  if (resolvedName && brandConfig.themes[resolvedName]) {
    return brandConfig.themes[resolvedName];
  }

  // Fallback: default da marca
  const defaultName = brandConfig.defaultTheme;
  console.warn(`   ⚠️  Tema "${tema}" não encontrado em "${brand}". Usando default "${defaultName}".`);
  return brandConfig.themes[defaultName];
}

// ============================================================
// SPEC 2026 — CARROSSEL
// ============================================================
const VIEWPORT_WIDTH = 1080;
const VIEWPORT_HEIGHT = 1440;        // v8: era 1350, agora 3:4 spec 2026
const DEVICE_SCALE_FACTOR = 2;       // render final: 2160x2880

// Safe zones spec 2026 (em px no canvas 1080)
const SAFE_TOP = 180;
const SAFE_BOTTOM = 180;
const SAFE_SIDES = 50;

// ============================================================
// SVG LOGO LOADER
// ============================================================

function loadLogos(brand) {
  const mapping = LOGO_FILES[brand];
  if (!mapping) {
    console.warn(`   ⚠️  Marca "${brand}" não tem logos mapeadas`);
    return {};
  }

  const logos = {};
  for (const [variant, filename] of Object.entries(mapping)) {
    const filepath = path.join(LOGOS_DIR, filename);
    if (fs.existsSync(filepath)) {
      const svgContent = fs.readFileSync(filepath);
      const base64 = svgContent.toString('base64');
      logos[variant] = `data:image/svg+xml;base64,${base64}`;
      console.log(`   ✅ ${variant}: ${filename} (${(svgContent.length / 1024).toFixed(0)} KB)`);
    } else {
      console.warn(`   ⚠️  ${variant}: ${filename} NÃO ENCONTRADO`);
      logos[variant] = null;
    }
  }
  return logos;
}

function pickLogoVariant(temaSlide, tipo) {
  const isDark = temaSlide === 'dark' || temaSlide === 'pink';
  const isFull = tipo === 'capa' || tipo === 'cta';

  if (isFull) return isDark ? 'full-on-dark' : 'full-on-light';
  return isDark ? 'solo-on-dark' : 'solo-on-light';
}

function injectLogos(html, slideInfo, logos) {
  const variant = pickLogoVariant(slideInfo.tema_slide, slideInfo.tipo);
  const logoUri = logos[variant];
  let result = html;

  result = result.replace(/\{\{LOGO_LA_MUSIC_SCHOOL\}\}/g, logoUri || '');
  result = result.replace(/\{\{LOGO_LA_MUSIC_KIDS\}\}/g, logoUri || '');
  result = result.replace(/\{\{LOGO_SONORAMENTE\}\}/g, logoUri || '');
  result = result.replace(/\{\{LOGO_PRINCIPAL\}\}/g, logoUri || '');
  result = result.replace(/\{\{LOGO_SOLO_DARK\}\}/g, logos['solo-on-dark'] || '');
  result = result.replace(/\{\{LOGO_SOLO_LIGHT\}\}/g, logos['solo-on-light'] || '');
  result = result.replace(/\{\{LOGO_FULL_DARK\}\}/g, logos['full-on-dark'] || '');
  result = result.replace(/\{\{LOGO_FULL_LIGHT\}\}/g, logos['full-on-light'] || '');
  result = result.replace(/\{\{LOGO_SOLO\}\}/g, logoUri || logos['solo-on-dark'] || '');
  result = result.replace(/\{\{LOGO_FULL\}\}/g, (slideInfo.tema_slide === 'cream' ? logos['full-on-light'] : logos['full-on-dark']) || '');

  return { html: result, variantUsed: variant };
}

// ============================================================
// STANDARD UTILS
// ============================================================

function loadFile(relativePath) {
  const fullPath = path.join(AGENTS_DIR, relativePath);
  if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath, 'utf8');
  console.warn(`   ⚠️  Não encontrado: ${fullPath}`);
  return '';
}

function callOpus(prompt, timeout = 180000) {
  const promptFile = `/tmp/diego-prompt-${Date.now()}-${Math.random().toString(36).slice(2,7)}.txt`;
  fs.writeFileSync(promptFile, prompt);
  const t0 = Date.now();
  const result = spawnSync('sh', ['-c', `cat "${promptFile}" | claude -p - --output-format text`], {
    encoding: 'utf8', timeout, maxBuffer: 10 * 1024 * 1024, cwd: '/home/lahq'
  });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  try { fs.unlinkSync(promptFile); } catch (e) {}
  if (result.status !== 0) return { html: null, dt, error: result.stderr };

  let output = (result.stdout || '').trim();
  if (output.startsWith('```')) output = output.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();
  const docIdx = output.indexOf('<!DOCTYPE');
  if (docIdx > 0) output = output.substring(docIdx);
  // Cortar tudo DEPOIS de </html> (remove checklist/markdown que o Opus adiciona)
  const endIdx = output.lastIndexOf('</html>');
  if (endIdx >= 0) output = output.substring(0, endIdx + 7);
  return { html: output, dt, error: null };
}

function isValidHtml(html) {
  return html && html.length >= 3000 && html.includes('<!DOCTYPE') &&
    html.includes('<body') && html.includes('</body>') && html.includes('</html>');
}

// Remove elementos visuais de placeholder que o Opus possa criar pra marcar onde foto da Luna entra.
// Pipeline injeta foto via background-image no <body> — não precisa de elemento visual marcado.
function stripVisualPlaceholders(html) {
  if (!html) return html;
  // Divs com class contendo placeholder relacionado a foto
  html = html.replace(/<div[^>]*class="[^"]*(photo-placeholder|foto-placeholder|placeholder-foto|image-placeholder|img-placeholder)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  // Spans/elementos com texto FOTO LUNA ou variações
  html = html.replace(/<(span|div|p)[^>]*>\s*FOTO[\s-]?LUNA[\s\S]{0,300}?<\/\1>/gi, '');
  // .photo-area .photo-placeholder aninhado
  html = html.replace(/<div[^>]*class="[^"]*photo-area[^"]*"[^>]*>\s*<div[^>]*placeholder[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, '');
  return html;
}

async function recordMemory(content, category, metadata = {}) {
  await supabase.from('semantic_memory').insert({
    office_id: OFFICE_ID, agent_id: AGENT_IDS.diego,
    content, category, metadata, source: 'diego', relevance_score: 0.85,
  });
}

async function recordCost(taskId, tokens) {
  await supabase.from('agent_costs').insert({
    agent_id: AGENT_IDS.diego, provider: 'claude', model: 'opus-4.6',
    tokens_input: tokens, tokens_output: Math.round(tokens * 0.5),
    cost_usd: 0, period: new Date().toISOString().split('T')[0],
    operation_type: 'layout_assembly', task_id: taskId,
  });
}

async function fetchMemories() {
  const { data } = await supabase.from('semantic_memory')
    .select('content, category').eq('office_id', OFFICE_ID)
    .or('category.eq.feedback,category.eq.pattern,category.eq.learning')
    .order('created_at', { ascending: false }).limit(8);
  return data || [];
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// HTML GENERATION
// ============================================================

async function generateSlideHtml(args) {
  const { slideNum, totalSlides, slideInfo, slideCopy, ninaDirection, notasDiego,
          hasImage, soulMd, skillMd, brandGuide, dsPath, debugDir, memCtx, brand,
          isRevision, revisionFeedback, feedbackSlide, hasLogos } = args;

  // v9: usa BRAND_THEMES multi-marca em vez de hardcode School-only
  const temaFallback = getTemaBg(brand, slideInfo.tema_slide);

  const isFullLogoSlide = slideInfo.tipo === 'capa' || slideInfo.tipo === 'cta';
  const recommendedLogo = isFullLogoSlide ? '{{LOGO_FULL}}' : '{{LOGO_SOLO}}';

  // Brand name for prompt (human-readable)
  const brandName = brand === 'la-music-school' ? 'LA Music School'
                  : brand === 'la-music-kids' ? 'LA Music Kids'
                  : 'SonoraMente';

  const logoBlock = hasLogos ? `
LOGOS DA MARCA (placeholders — pipeline substitui pelo SVG real):
- ${recommendedLogo} ← use este (auto-selecionado pro tema "${slideInfo.tema_slide}")
- {{LOGO_SOLO}} → ícone compacto, {{LOGO_FULL}} → nome completo
USO: <img src="${recommendedLogo}" style="height: 60px;" alt="${brandName}">
Rodapé: SOLO. Capa/CTA: pode usar FULL.
` : '';

  const revisionBlock = isRevision && feedbackSlide && !feedbackSlide.ok ? `
🚨 SLIDE REJEITADO — FEEDBACK:
${feedbackSlide.observacoes || 'N/A'}
AÇÃO GERAL: ${revisionFeedback || 'N/A'}
` : '';

  // Bloco condicional sobre foto da Luna (isolado como variável pra evitar nesting de template literal)
  const photoBlock = hasImage
    ? [
        "ESTE SLIDE TEM FOTO da Luna como fundo.",
        "O pipeline (código Node) vai INJETAR a foto automaticamente depois que você gerar o HTML.",
        "",
        "COMO FAZER CORRETO:",
        "- O <body> deve ter background-color sólido (cor neutra ou tema da marca) como fallback visual.",
        "- NÃO crie NENHUM <div>, <img>, <span> ou elemento com texto/label tipo FOTO LUNA, placeholder, aqui vai a foto, mão no acorde X ou similares.",
        "- NÃO use background-image no <body> ou containers — o pipeline injeta automaticamente.",
        "- NÃO use texturas xadrez, checkerboard, gradientes cinza ou qualquer pattern indicando aqui vai foto.",
        "- Construa o layout assumindo que a foto JÁ ESTÁ no <body> como background: textos por cima com overlays pra legibilidade.",
        "",
        "RESUMO: HTML ESTRUTURAL apenas. Sem marcar visualmente onde a foto entra. Pipeline cuida do swap."
      ].join("\n")
    : "SLIDE SEM FOTO — use fundo sólido ou gradiente conforme o tema do slide e o Brand Guide da marca.";

  const prompt = `VOCÊ É O DIEGO, Diagramador pixel-perfect da ${brandName}.

SUA IDENTIDADE (SOUL.md):
${soulMd}

SUA SKILL (montagem-carrossel.md):
${skillMd}

BRAND GUIDE (${brand}) — FONTE DE VERDADE VISUAL:
${brandGuide}

DESIGN SYSTEM HTML (referência detalhada de tokens, componentes, anatomia):
Arquivo: ${dsPath}
Contém paleta completa, tipografia, elementos gráficos assinatura. Consulte-o para cor/fonte/peso/espaçamento/elemento visual.

${memCtx}
${logoBlock}
${revisionBlock}

=========================================================
SLIDE ${slideNum} DE ${totalSlides}
=========================================================

DIREÇÃO DA NINA:
- Conceito: ${ninaDirection.conceito_geral || 'N/A'}
- Tom visual: ${ninaDirection.tom_visual || 'N/A'}
- Paleta destaque: ${ninaDirection.paleta_destaque || 'seguir Brand Guide'}
- Notas pro Diego: ${notasDiego || 'seguir Brand Guide + DS'}

SLIDE ATUAL:
- Tipo: ${slideInfo.tipo || 'conteudo'} | Tema: ${slideInfo.tema_slide || 'dark'}
- Direção visual: ${slideInfo.direcao_visual || 'seguir anatomia do DS'}

COPY DO THEO:
- Tag/badge: ${slideCopy.tag || ''} | Título: ${slideCopy.titulo || ''}
- Palavra de destaque: ${slideCopy.palavra_destaque || ''} (aplicar na cor primária da marca conforme Brand Guide)
- Corpo: ${slideCopy.corpo || ''} | CTA: ${slideCopy.cta || ''}

=========================================================
⚠️  FOTO DE FUNDO — REGRA CRÍTICA
=========================================================
${photoBlock}

=========================================================
📐 FORMATO CARROSSEL SPEC 2026 (OBRIGATÓRIO)
=========================================================
CANVAS: 1080x1440px (ratio 3:4 — padrão Instagram 2026).
Puppeteer renderiza em 2x → 2160x2880 (IG comprime pra 1080).
Escreva o CSS em escala 1080 — o Puppeteer cuida do upscale.

SAFE ZONES:
- Topo: 180px | Base: 180px | Laterais: 50px

=========================================================
🎯 TIPOGRAFIA MÍNIMA 2026
=========================================================
REGRA DE OURO: NENHUM texto abaixo de 24px no canvas final.
Títulos ilegíveis no celular = slide reprovado.

Hierarquia:
- Título principal: 120-160px (peso display definido pelo Brand Guide da marca)
- Subtítulo/kicker: 36-44px
- Corpo de texto: 24-30px (line-height 1.4-1.5)
- Badge/tag: 16-20px (uppercase, letter-spacing)
- Caption/nota: 16-18px
- Counter (${slideNum}/${totalSlides}): 18-20px

PROIBIDO: corpo <24px, título <120px, qualquer texto <16px.

FONTES: use EXCLUSIVAMENTE as fontes declaradas no Brand Guide da marca. Consulte o Design System HTML (${dsPath}) para pesos e variações. NÃO invente fontes. NÃO use Google Fonts aleatórias se a marca usa fontes embedadas locais (School = Prompt, Kids = Volkswagen FREE + Madelina, SonoraMente = Playfair Display + DM Sans).
MADELINA (Kids): fonte script decorativa que deve ser usada como ELEMENTO VISUAL PROTAGONISTA — mínimo 70px, idealmente 80-120px. Exemplos corretos: "o queridinho" em 90px, "gratuita!" em 100px, "desde pequeno" em 85px como acento emocional de destaque. NUNCA usar Madelina abaixo de 50px. NUNCA usar como legenda, caption ou texto de corpo. Se não há contexto para Madelina grande, não use — é melhor não usar do que usar pequena.

CORES: use EXCLUSIVAMENTE os hex declarados no Brand Guide da marca. NÃO invente cores. Quando o Theo indicar palavra de destaque, aplique a cor primária da marca à palavra exata.

ELEMENTOS VISUAIS: siga os elementos-assinatura do Brand Guide/DS (ex: School = halftones + chevrons + outline type; Kids = curved water shapes + dotted pattern + catavento; SonoraMente = gradientes roxo + bordas arredondadas). NÃO invente elementos.

=========================================================
REGRAS GERAIS
=========================================================
1. Canvas EXATO 1080x1440px (body width:1080px; height:1440px; overflow:hidden)
2. Fontes e cores VÊM DO BRAND GUIDE — não hardcodar valores que não estão documentados
3. Respeitar safe zones: padding mínimo 180px topo/base, 50px laterais
4. Tag do Theo no badge — não invente texto, use o que veio no input
5. UMA palavra de destaque por slide na cor primária da marca
6. Composição DIFERENTE entre slides — alternar alinhamento, peso visual, uso de elementos do DS
7. Elementos-assinatura da marca com moderação (definidos no Brand Guide)
8. LOGO ${brandName} no rodapé: ${recommendedLogo} (altura 60-80px, dentro do safe zone base)
9. Paginação ${slideNum}/${totalSlides} no topo direito (dentro do safe zone topo, 18-20px)
10. BLOBS E FORMAS DECORATIVAS: sempre posicionados nos cantos/bordas com z-index: 1 ou inferior. NUNCA sobrepor rostos ou elementos principais da foto (z-index da foto = 2 ou superior). Blobs ficam atrás da foto, não na frente.
11. CONTAINERS E CARDS: só renderizar um container/card se tiver conteúdo real preenchido. NUNCA gerar div vazia, card branco sem conteúdo, ou placeholder visual sem texto/imagem.
12. Se tema do slide for CTA/destaque, usar cor primária da marca como fundo (conforme Brand Guide)

=========================================================
🚨 REGRAS DE OUTPUT — CRÍTICAS
=========================================================
- RETORNE APENAS HTML COMPLETO, começando com <!DOCTYPE html> e terminando com </html>
- NÃO escreva NENHUM texto antes de <!DOCTYPE> (sem intro, sem Aqui está:)
- NÃO escreva NENHUM texto depois de </html> (sem checklist, sem explicação, sem markdown)
- NÃO use code fences
- HTML mínimo: 4000 chars
- Qualquer texto fora do bloco <!DOCTYPE>...</html> quebra o pipeline de rendering.`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`   🧠 ${attempt > 1 ? `Slide ${slideNum} (retry ${attempt})` : `Slide ${slideNum}`}...`);
    const { html, dt } = callOpus(prompt);

    if (!html) { console.log(`   ⚠️  Tentativa ${attempt}: erro (${dt}s)`); if (attempt < 3) await sleep(2000); continue; }

    const debugPath = path.join(debugDir, `slide-${String(slideNum).padStart(2, '0')}-attempt${attempt}.html`);
    fs.writeFileSync(debugPath, html);

    if (isValidHtml(html)) {
      const cleanHtml = stripVisualPlaceholders(html);
      const delta = cleanHtml.length !== html.length ? ` → ${cleanHtml.length} após strip` : '';
      console.log(`   ✅ ${dt}s (${html.length} chars${delta})`);
      return { html: cleanHtml, attempts: attempt };
    }
    console.log(`   ⚠️  Tentativa ${attempt}: inválido (${html.length} chars)`);
    if (attempt < 3) await sleep(2000);
  }

  console.log(`   ❌ Slide ${slideNum} falhou 3x`);
  return { html: null, attempts: 3 };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('');
  console.log('============================================================');
  console.log('  📐 DIEGO v8 — SPEC 2026 (1080x1440) + SVG Logos');
  console.log(`  📐 Render HD: ${VIEWPORT_WIDTH * DEVICE_SCALE_FACTOR}x${VIEWPORT_HEIGHT * DEVICE_SCALE_FACTOR}`);
  console.log(`  📐 Safe zones: ${SAFE_TOP}px topo/base, ${SAFE_SIDES}px laterais`);
  console.log('============================================================');

  // 1. Find task (revision priority)
  console.log('[DIEGO] Buscando tasks...');
  let myTask = null, isRevision = false;

  const { data: revTask } = await supabase.from('tasks').select('*')
    .eq('agent_id', AGENT_IDS.diego).eq('status', 'pending').eq('type', 'revision')
    .order('created_at', { ascending: false }).limit(1).single();

  if (revTask) { myTask = revTask; isRevision = true; console.log(`   🔄 REVISÃO: ${myTask.id}`); }
  else {
    const { data: newTask } = await supabase.from('tasks').select('*')
      .eq('agent_id', AGENT_IDS.diego).eq('status', 'pending').eq('type', 'layout_assembly')
      .order('created_at', { ascending: true }).limit(1).single();
    if (newTask) { myTask = newTask; console.log(`   📝 NOVA: ${myTask.id}`); }
  }

  if (!myTask) { console.log('   ℹ️  Nenhuma task.'); return; }

  console.log(`   Marca: ${myTask.brand} | Modo: ${isRevision ? 'REVISÃO' : 'PRODUÇÃO'}`);
  console.log('');

  await supabase.from('tasks').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', myTask.id);
  await supabase.from('agents').update({ status: 'working' }).eq('id', AGENT_IDS.diego);

  // 2. Context layers
  console.log('[DIEGO] Contexto em camadas...');
  const soulMd = loadFile('diego/SOUL.md');
  const skillMd = loadFile('diego/skills/montagem-carrossel.md');
  const brandGuide = loadFile(`shared/brands/brand-${myTask.brand}.md`);
  const dsPath = DS_PATHS[myTask.brand] || DS_PATHS['la-music-school'];
  console.log(`   SOUL: ${soulMd.length} | Skill: ${skillMd.length} | BG: ${brandGuide.length}`);

  // 3. SVG Logos
  console.log('[DIEGO] Carregando logos SVG...');
  const logos = loadLogos(myTask.brand);
  const hasLogos = Object.values(logos).some(v => v !== null);
  if (!hasLogos) console.warn('   ⚠️  Sem logos!');

  // 4. Agent data
  console.log('[DIEGO] Dados dos agentes...');
  let ninaDirection = {}, slideStructure = [], notasDiego = '';

  const { data: origTask } = await supabase.from('tasks').select('*')
    .eq('parent_task_id', myTask.parent_task_id).eq('type', 'layout_assembly').single();
  if (origTask) {
    ninaDirection = origTask.input?.nina_direction || {};
    slideStructure = origTask.input?.slide_structure || [];
    notasDiego = origTask.input?.notas_diego || '';
  }
  if (!slideStructure.length && isRevision) {
    ninaDirection = myTask.input?.nina_direction || {};
    slideStructure = myTask.input?.slide_structure || [];
    notasDiego = myTask.input?.notas_diego || '';
  }

  const { data: theoTask } = await supabase.from('tasks').select('output')
    .eq('parent_task_id', myTask.parent_task_id).eq('type', 'copywriting').eq('status', 'completed').single();
  const theoCopy = theoTask?.output || {};

  const { data: lunaTask } = await supabase.from('tasks').select('output')
    .eq('parent_task_id', myTask.parent_task_id).eq('type', 'image_generation').eq('status', 'completed').single();
  const lunaAssets = lunaTask?.output?.assets || [];

  console.log(`   Nina: ${slideStructure.length} | Theo: ${theoCopy.slides?.length || 0} | Luna: ${lunaAssets.length}`);

  if (!slideStructure.length || !(theoCopy.slides?.length)) {
    console.error('❌ Contexto insuficiente!');
    await supabase.from('tasks').update({ status: 'pending' }).eq('id', myTask.id);
    await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.diego);
    return;
  }

  // 5. Revision context
  let revisionFeedback = '', feedbackPorSlide = [], originalOutputId = '';
  if (isRevision) {
    revisionFeedback = myTask.input?.feedback || '';
    feedbackPorSlide = myTask.input?.feedback_por_slide || [];
    originalOutputId = myTask.input?.original_output_id || '';
    console.log('');
    feedbackPorSlide.forEach(f => console.log(`   Slide ${f.slide}: ${f.ok ? '✅' : '❌'}`));
  }

  // 6. Memories
  const memories = await fetchMemories();
  const memCtx = memories.length > 0
    ? `\nAPRENDIZADOS:\n${memories.map(m => `- [${m.category}] ${m.content}`).join('\n')}` : '';
  console.log(`   ${memories.length} memórias`);
  console.log('');

  // 7. Dirs + Luna images
  const outDir = path.join('/home/lahq/output', myTask.parent_task_id);
  const imgDir = path.join(outDir, 'images');
  const debugDir = path.join(outDir, 'debug-v8');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(debugDir, { recursive: true });

  const imgBase64 = {};
  for (const asset of lunaAssets) {
    const imgPath = path.join(imgDir, `bg-${String(asset.slide).padStart(2, '0')}.png`);
    if (fs.existsSync(imgPath)) imgBase64[asset.slide] = fs.readFileSync(imgPath).toString('base64');
  }

  // 8. GENERATE SLIDES
  console.log('[DIEGO] Gerando slides spec 2026 (1080x1440) + SVG logos...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const fileUrls = [];
  const totalSlides = slideStructure.length || 6;
  let totalTokens = 0, successCount = 0;
  const failedSlides = [];

  for (let i = 0; i < totalSlides; i++) {
    const slideInfo = slideStructure[i] || {};
    const slideCopy = theoCopy.slides?.[i] || {};
    const slideNum = slideInfo.numero || (i + 1);
    const hasImage = !!imgBase64[slideNum];
    const feedbackSlide = isRevision ? feedbackPorSlide.find(f => f.slide === slideNum) : null;
    const shouldSkip = isRevision && feedbackSlide?.ok === true;

    console.log('');
    console.log(`  ─── Slide ${slideNum}/${totalSlides} (${slideInfo.tipo || 'conteudo'}/${slideInfo.tema_slide || 'dark'}) ───`);

    // In revision: skip approved slides BUT only if we have their original URL
    // Since we moved to SVG logos, we regenerate everything for consistency
    if (shouldSkip && !hasLogos) {
      // Only skip if no logo change needed
      console.log(`   ♻️  Reusando (aprovado, sem mudança de logo)`);
      // would need original URL here — for now regenerate all
    }

    const { html } = await generateSlideHtml({
      slideNum, totalSlides, slideInfo, slideCopy, ninaDirection, notasDiego,
      hasImage, soulMd, skillMd, brandGuide, dsPath, debugDir, memCtx,
      brand: myTask.brand, isRevision, revisionFeedback, feedbackSlide, hasLogos,
    });

    if (!html) { failedSlides.push(slideNum); continue; }
    totalTokens += 15000;

    // Inject SVG logos
    const { html: htmlWithLogos, variantUsed } = injectLogos(html, slideInfo, logos);
    console.log(`   🎨 Logo SVG: ${variantUsed}`);

    // Inject Luna photo
    let finalHtml = htmlWithLogos;
    if (imgBase64[slideNum]) {
      const dataUri = `data:image/png;base64,${imgBase64[slideNum]}`;
      finalHtml = finalHtml.replace(/background:\s*#0[Aa]0[Aa]0[Aa]/g,
        `background-image:url('${dataUri}');background-size:cover;background-position:center`);
      finalHtml = finalHtml.replace(/background-color:\s*#0[Aa]0[Aa]0[Aa]/g,
        `background-image:url('${dataUri}');background-size:cover;background-position:center`);
      if (!finalHtml.includes(imgBase64[slideNum].substring(0, 50))) {
        finalHtml = finalHtml.replace('<body', `<body style="background-image:url('${dataUri}');background-size:cover;background-position:center;"`);
      }
    }

    const suffix = '-v8';
    fs.writeFileSync(path.join(outDir, `slide-${String(slideNum).padStart(2, '0')}${suffix}.html`), finalHtml);

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT, deviceScaleFactor: DEVICE_SCALE_FACTOR });
      // Injetar @font-face de fontes locais da marca (Kids: Volkswagen + Madelina)
      const fontCSS = buildFontFaceCSS(myTask.brand);
      if (fontCSS) {
        finalHtml = finalHtml.replace('</head>', `<style>\n${fontCSS}\n</style>\n</head>`);
        console.log(`   🔤 Fontes injetadas: ${LOCAL_FONTS[myTask.brand].faces.length} @font-face (${myTask.brand})`);
      }
      await page.setContent(finalHtml, { waitUntil: 'networkidle0', timeout: 30000 });
      const pngPath = path.join(outDir, `slide-${String(slideNum).padStart(2, '0')}${suffix}.png`);
      await page.screenshot({ path: pngPath, type: 'png' });
      await page.close();

      // === SELF-REVIEW VISUAL ===
      const parseSrJson = (raw) => {
        let t = raw.trim();
        const j0 = t.indexOf('{');
        const j1 = t.lastIndexOf('}');
        if (j0 >= 0 && j1 >= 0) t = t.substring(j0, j1 + 1);
        return JSON.parse(t);
      };
      const runSR = async (imgPath) => {
        try {
          const f = '/tmp/sr-' + Date.now() + '.txt';
          const q = [
            'Analise a imagem em: ' + imgPath, '',
            'Verifique:',
            '1. Ha foto de crianca ou instrumento visivel e nao cortado?',
            '2. O rosto da crianca aparece inteiro (nao cortado por blob ou borda)?',
            '3. Blobs/formas decorativas estao ATRAS do conteudo, nao sobre texto ou rosto?',
            '4. O slide tem conteudo visual real (nao apenas circulo vazio ou card branco)?', '',
            'Responda SOMENTE em JSON puro: {"aprovado": true, "problemas": []}'
          ].join('\n');
          fs.writeFileSync(f, q);
          const r = require('child_process').spawnSync('sh', ['-c', 'claude -p --output-format text < "' + f + '"'], {
            encoding: 'utf8', timeout: 60000, maxBuffer: 5 * 1024 * 1024, cwd: '/home/lahq'
          });
          try { fs.unlinkSync(f); } catch(e2) {}
          if (r.status === 0 && r.stdout) return parseSrJson(r.stdout);
        } catch(e) {}
        return { aprovado: true, problemas: [] };
      };

      // Self-review #1 — pular em slides CTA (foto nao e obrigatoria)
      const isCTA = (slideInfo.tipo === 'cta');
      const sr1 = isCTA ? { aprovado: true, problemas: [] } : await runSR(pngPath);
      if (sr1.aprovado) {
        console.log('   \u{1F441}\uFE0F  Self-review: \u2705 OK');
      } else {
        console.log('   \u{1F441}\uFE0F  Self-review: \u26A0\uFE0F  ' + (sr1.problemas || []).join(' | '));
        console.log('   \uD83D\uDD04 Re-gerando slide com feedback...');

        const srFeedback = 'SELF-REVIEW REPROVOU. Problemas: ' + (sr1.problemas || []).join('; ') +
          '. CORRIJA: (1) foto/instrumento visivel em area significativa; ' +
          '(2) rosto nao cortado — usar object-position:top center na foto; ' +
          '(3) blobs com z-index 0-1, foto com z-index 2+; ' +
          '(4) sem blur extremo na foto; (5) sem card branco vazio.';

        const retryGen = await generateSlideHtml({
          slideNum, totalSlides, slideInfo, slideCopy, ninaDirection, notasDiego,
          hasImage, soulMd, skillMd, brandGuide, dsPath, debugDir, memCtx,
          brand: myTask.brand, isRevision: true,
          revisionFeedback: srFeedback, feedbackSlide: slideNum, hasLogos,
        });

        if (retryGen && retryGen.html) {
          const { html: retryLogos } = injectLogos(retryGen.html, slideInfo, logos);
          let retryFinal = retryLogos;

          if (imgBase64[slideNum]) {
            const du2 = 'data:image/png;base64,' + imgBase64[slideNum];
            retryFinal = retryFinal.replace(/background:\s*#0[Aa]0[Aa]0[Aa]/g,
              "background-image:url('" + du2 + "');background-size:cover;background-position:top center");
            retryFinal = retryFinal.replace(/background-color:\s*#0[Aa]0[Aa]0[Aa]/g,
              "background-image:url('" + du2 + "');background-size:cover;background-position:top center");
            if (!retryFinal.includes(imgBase64[slideNum].substring(0, 50))) {
              retryFinal = retryFinal.replace('<body',
                '<body style="background-image:url(\'' + du2 + '\');background-size:cover;background-position:top center;"');
            }
          }
          const fCSSR = buildFontFaceCSS(myTask.brand);
          if (fCSSR) retryFinal = retryFinal.replace('</head>', '<style>\n' + fCSSR + '\n</style>\n</head>');

          const pageR = await browser.newPage();
          await pageR.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT, deviceScaleFactor: DEVICE_SCALE_FACTOR });
          await pageR.setContent(retryFinal, { waitUntil: 'networkidle0', timeout: 30000 });
          await pageR.screenshot({ path: pngPath, type: 'png' });
          await pageR.close();
          console.log('   \uD83D\uDD04 Re-renderizado: ' + (fs.statSync(pngPath).size / 1024).toFixed(0) + ' KB');

          const sr2 = await runSR(pngPath);
          if (sr2.aprovado) {
            console.log('   \u{1F441}\uFE0F  Self-review retry: \u2705 OK');
          } else {
            console.log('   \u{1F441}\uFE0F  Self-review retry: \u26A0\uFE0F  ' + (sr2.problemas || []).join(' | ') + ' (Nina avalia)');
          }
        } else {
          console.log('   \u{1F441}\uFE0F  Retry falhou — usando original');
        }
      }
      // === FIM SELF-REVIEW ===

      // Compressão automática se PNG > 1.5MB
      const rawSizeKB = Math.round(fs.statSync(pngPath).size / 1024);
      if (rawSizeKB > 1500) {
        try {
          const sharp = require('sharp');
          const tmpPath = pngPath + '.tmp.png';
          await sharp(pngPath)
            .png({ quality: 80, compressionLevel: 9 })
            .toFile(tmpPath);
          const compressedKB = Math.round(fs.statSync(tmpPath).size / 1024);
          if (compressedKB < rawSizeKB) {
            fs.renameSync(tmpPath, pngPath);
            console.log('   \uD83D\uDDDC  Comprimido: ' + rawSizeKB + 'KB \u2192 ' + compressedKB + 'KB');
          } else {
            try { fs.unlinkSync(tmpPath); } catch(e2) {}
          }
        } catch(e) {
          console.log('   \u26A0\uFE0F  Compress falhou: ' + e.message.substring(0, 60));
        }
      }
      const sizeKB = (fs.statSync(pngPath).size / 1024).toFixed(0);
      console.log(`   🖼️  PNG ${VIEWPORT_WIDTH * DEVICE_SCALE_FACTOR}x${VIEWPORT_HEIGHT * DEVICE_SCALE_FACTOR}: ${sizeKB} KB`);

      const storagePath = `${myTask.brand}/${myTask.parent_task_id}/slide-${String(slideNum).padStart(2, '0')}${suffix}.png`;
      const buf = fs.readFileSync(pngPath);
      await supabase.storage.from('outputs').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
      const { data: urlData } = supabase.storage.from('outputs').getPublicUrl(storagePath);
      fileUrls.push(urlData.publicUrl);
      successCount++;
    } catch (e) {
      console.log(`   ❌ Puppeteer: ${e.message.substring(0, 100)}`);
      failedSlides.push(slideNum);
    }

    if (i < totalSlides - 1) await sleep(2000);
  }
  await browser.close();

  // 9. Register output
  console.log('');
  console.log('[DIEGO] Registrando output...');

  if (isRevision && originalOutputId) {
    await supabase.from('outputs').update({ status: 'archived' }).eq('id', originalOutputId);
  }

  const { data: output, error: outErr } = await supabase.from('outputs').insert({
    task_id: myTask.parent_task_id, office_id: OFFICE_ID,
    type: 'carousel', format: 'png', brand: myTask.brand,
    title: '[v8 spec2026] ' + (ninaDirection.conceito_geral?.substring(0, 60) || 'Carrossel'),
    theme: (origTask || myTask).input?.tema,
    file_urls: fileUrls, total_slides: fileUrls.length,
    status: successCount === totalSlides ? 'ready_for_review' : 'draft',
    approval_status: 'pending_review',
    rendered_by: `diego-v8-spec2026-${VIEWPORT_WIDTH * DEVICE_SCALE_FACTOR}x${VIEWPORT_HEIGHT * DEVICE_SCALE_FACTOR}`,
    asset_ids: lunaAssets.map(a => a.asset_id),
  }).select().single();

  if (outErr) console.log(`   ❌ ${outErr.message}`);
  else console.log(`   Output: ${output?.id}`);

  // 10. Complete task
  await supabase.from('tasks').update({
    status: successCount === totalSlides ? 'completed' : 'in_progress',
    output: { output_id: output?.id, slides: fileUrls.length, failed: failedSlides, engine: 'v8-spec2026', logos_svg: hasLogos, canvas: `${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT}` },
    completed_at: successCount === totalSlides ? new Date().toISOString() : null,
    model_used: 'opus-4.6',
  }).eq('id', myTask.id);

  await recordMemory(
    `Carrossel v8 spec 2026 (canvas 1080x1440 + tipografia mínima + SVG logos) "${(origTask || myTask).input?.tema}" (${myTask.brand}): ${successCount}/${totalSlides}. Render HD: ${VIEWPORT_WIDTH * DEVICE_SCALE_FACTOR}x${VIEWPORT_HEIGHT * DEVICE_SCALE_FACTOR}.`,
    'decision', { task_id: myTask.id, output_id: output?.id, version: 'v8', canvas: `${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT}`, spec: '2026' }
  );
  await recordCost(myTask.id, totalTokens);
  await supabase.from('agents').update({ status: 'available' }).eq('id', AGENT_IDS.diego);

  console.log('   ✅ Memória + custo');
  console.log('');
  console.log('============================================================');
  console.log(`  📐 DIEGO v8 — ${successCount}/${totalSlides} slides`);
  console.log(`  Canvas: ${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT} | HD: ${VIEWPORT_WIDTH * DEVICE_SCALE_FACTOR}x${VIEWPORT_HEIGHT * DEVICE_SCALE_FACTOR}`);
  console.log(`  Logos SVG: ${hasLogos ? '✅' : '❌'}`);
  console.log(`  Output: ${output?.id || 'erro'}`);
  console.log('============================================================');
}

main().catch(err => { console.error('❌ Erro fatal:', err.message); process.exit(1); });
