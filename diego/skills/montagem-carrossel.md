---
name: montagem-carrossel
description: Skill para montar carrosséis em HTML/JSX (1080x1350) seguindo rigorosamente o Design System da marca, combinando assets da Luna, copy do Theo e briefing da Nina. Use sempre que Diego precisa montar um carrossel para qualquer marca.
---

# Montagem de Carrossel

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| briefing_estrutura | documento | Nina (skill estruturacao-conteudo) | Sim |
| assets[] | lista asset_ids | Luna (imagens prontas) | Sim |
| copy_slides[] | lista textos | Theo (título, corpo, CTA por slide) | Sim |
| marca | string | Briefing ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| total_slides | int | Briefing (4, 6, 8 ou 10) | Sim |
| tema_capa | string | Briefing ("dark", "light", "brand") | Não (default por marca) |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| png_slides[] | arquivos PNG 1080x1350 | Supabase Storage |
| html_slides[] | arquivos HTML | Backup para edição futura |
| output_registro | registro | Supabase → tabela outputs |
| preview_carrossel | lista URLs | Nina → aprovação |

## Fases de Execução

### Fase 1 — Receber e Validar Inputs

Antes de montar, confirmar que tem TUDO:
- **Briefing da Nina:** estrutura slide-a-slide (qual conteúdo em cada slide, tema de cada slide)
- **Assets da Luna:** imagens tratadas, fundo removido se necessário, na proporção correta
- **Copy do Theo:** título, corpo e CTA para cada slide
- **Marca definida:** determina TODO o universo visual

Se faltar qualquer input, **não improvisar** — pedir para Nina/Luna/Theo completar.

### Fase 2 — Carregar Design System da Marca

#### 🎸 LA Music School
```css
:root {
  --bg-dark: #0A0A0A;
  --bg-cream: #F5F1EC;
  --bg-pink: #E91E63;
  --text-white: #FFFFFF;
  --text-dark: #1A1A1A;
  --accent: #E91E63;
  --accent-dark: #C2185B;
  --accent-light: #F06292;
  --font-display: 'Bebas Neue', sans-serif;
  --font-body: 'Montserrat', sans-serif;
  --radius: 0px;          /* School = angulado, sem arredondamento */
  --diagonal-angle: -8deg; /* faixa diagonal pink */
}
```
- Capa: fundo dark, título Bebas Neue uppercase, palavra-chave em pink
- Conteúdo: alternar dark/cream, Montserrat para corpo
- CTA: fundo pink, botão pill branco, @lamusicschool
- Elementos: diagonal stripe, circles, badges numerados

#### 🧠 SonoraMente LA
```css
:root {
  --bg-deep: #3D1A6E;
  --bg-light: #FAF8FF;
  --bg-purple: #5B2D8E;
  --text-white: #FFFFFF;
  --text-dark: #2D1B4E;
  --accent: #5B2D8E;
  --accent-light: #B39DDB;
  --warm: #F4A261;
  --font-display: 'Playfair Display', serif;
  --font-body: 'DM Sans', sans-serif;
  --radius: 16px;          /* SonoraMente = arredondado, suave */
}
```
- Capa: fundo roxo profundo, título Playfair Display, tag lavanda
- Conteúdo: alternar light/roxo, DM Sans para corpo
- CTA: fundo roxo, botão branco pill, @sonoramentela
- Elementos: gradientes suaves, ondas sonoras, bordas arredondadas

#### 🎨 LA Music Kids
```css
:root {
  --bg-white: #FFFFFF;
  --bg-dark: #1A1A1A;
  --bg-blue: #00AFEF;
  --color-1: #FF6B35;      /* laranja catavento */
  --color-2: #4ECDC4;      /* turquesa */
  --color-3: #FFE66D;      /* amarelo sol */
  --color-4: #FF6B9D;      /* rosa catavento */
  --text-dark: #2D3436;
  --text-white: #FFFFFF;
  --font-display: 'Baloo 2', cursive;
  --font-body: 'Nunito', sans-serif;
  --radius: 20px;           /* Kids = super arredondado */
}
```
- Capa: fundo dark ou azul, título Baloo 2, ondas coloridas
- Conteúdo: alternar branco/dark, badges coloridos, Nunito para corpo
- CTA: fundo azul, botão amarelo, @lamusickids
- Elementos: barra 4 cores, catavento, notas musicais coloridas

### Fase 3 — Montar HTML/JSX por Slide

**Cada slide é um arquivo HTML independente de 1080x1350px.**

**Estrutura base de um slide:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <!-- Fontes da marca (ver skill exportacao-renderizacao) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=FONTE_DA_MARCA&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      font-family: var(--font-body);
    }
    /* CSS variables da marca (Fase 2) */
    :root { /* ... */ }
    
    .slide {
      width: 100%;
      height: 100%;
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
    }
    
    /* Margens mínimas: 40px em todos os lados */
    /* Texto mínimo: 14px (body), títulos: 36px+ */
    /* Numeração: posição fixa, formato NN/NN */
  </style>
</head>
<body>
  <div class="slide" style="background: TEMA_DO_SLIDE;">
    <!-- Conteúdo do slide -->
  </div>
</body>
</html>
```

**Anatomia por tipo de slide:**

| Slide | Função | Elementos obrigatórios |
|-------|--------|----------------------|
| **Capa (01)** | Parar o scroll | Tag de tema, título display com palavra em destaque, subtítulo, "Deslize →", numeração |
| **Conteúdo (02 a N-1)** | Entregar valor | Título da seção, corpo de texto, ícone/badge/check, imagem (se houver), numeração |
| **CTA (último)** | Converter | Headline de fechamento, botão pill com CTA, logo, @perfil, numeração |

**Regras de composição:**
- Margens mínimas: **40px** em todos os lados (60px ideal)
- Hierarquia: título (36-48px) > subtítulo (24-28px) > corpo (16-20px) > caption (14px)
- Numeração consistente: formato `01/08` — posição fixa (topo-direita ou rodapé)
- Logo no rodapé de TODOS os slides (pequeno, 40-60px)
- Imagens sempre em base64 (nunca URL — ver skill exportacao-renderizacao)
- Alternância de tema entre slides (dark → cream → dark ou deep → light → deep)

### Fase 4 — Exportar via Puppeteer

Usar a skill **exportacao-renderizacao** para renderização:
```javascript
// Referência rápida — detalhes completos na skill exportacao-renderizacao
const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

for (let i = 0; i < totalSlides; i++) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
  await page.goto(`file://${htmlPaths[i]}`, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `${marca}_slide_${String(i+1).padStart(2,'0')}.png`,
    type: 'png'
  });
  await page.close();
}

await browser.close();
```

### Fase 5 — Verificar e Entregar

**Checklist visual por slide:**
- [ ] Tema correto (dark/cream/pink conforme briefing)
- [ ] Fonte display e corpo renderizando corretamente
- [ ] Palavra-chave em destaque na cor da marca
- [ ] Numeração presente e consistente
- [ ] Logo no rodapé visível
- [ ] Texto legível (simular tela de celular)
- [ ] Imagens sem artefatos
- [ ] Espaçamento generoso (sem amontoar)
- [ ] PNG < 2MB (comprimir se necessário)

**Upload e registro:**
```sql
INSERT INTO outputs (
  office_id, task_id, brand, type, format,
  file_urls, total_slides,
  rendered_by, status, created_at
) VALUES (
  $1, $2, $3, 'carrossel', '1080x1350',
  $4::text[], $5,
  'diego', 'ready_for_review', NOW()
);
```

→ Enviar preview para Nina aprovar (skill aprovacao-outputs).

## Veto Conditions — NUNCA
- NUNCA iniciar sem briefing completo da Nina (estrutura + copy + assets)
- NUNCA improvisar cor ou fonte fora do Design System da marca
- NUNCA usar texto menor que 14px (ilegível em mobile)
- NUNCA sem logo no rodapé de cada slide
- NUNCA entregar sem testar renderização no Puppeteer
- NUNCA sem numeração de slides consistente (NN/NN)
- NUNCA amontoar informação — se não cabe com espaçamento, dividir em mais slides
- NUNCA misturar elementos visuais de marcas diferentes

## Checklist de Conclusão
- [ ] Todos os inputs recebidos (briefing Nina, assets Luna, copy Theo)
- [ ] Design System da marca carregado e aplicado corretamente
- [ ] Cada slide montado em HTML independente (1080x1350)
- [ ] Alternância de temas entre slides respeitada
- [ ] Capa com gancho forte + slide final com CTA claro
- [ ] Imagens convertidas para base64
- [ ] Renderizado via Puppeteer com fontes carregadas
- [ ] Verificação visual de cada slide (legibilidade, cores, espaçamento)
- [ ] PNGs com menos de 2MB cada
- [ ] Upload feito para Supabase Storage
- [ ] Output registrado no Supabase com status ready_for_review
- [ ] Preview enviado para Nina aprovar

## Integrações
- **Puppeteer (VPS)** — renderização HTML→PNG (referência: skill exportacao-renderizacao)
- **Supabase Storage** — upload dos PNGs finais
- **Supabase (outputs)** — registro do carrossel produzido
- **Design Systems (HTML/MD)** — regras visuais obrigatórias por marca
- **Google Fonts CDN** — fontes por marca
