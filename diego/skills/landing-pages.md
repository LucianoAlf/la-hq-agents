---
name: landing-pages
description: Skill para criar landing pages de captação de leads para campanhas de tráfego pago — páginas rápidas, responsivas, com formulário de conversão, seguindo o Design System da marca. Use sempre que Atlas precisa de uma landing page para campanha paga ou quando Nina define uma campanha de captação.
---

# Landing Pages para Tráfego Pago

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| marca | string | Atlas ou Nina ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| tipo_lp | string | Atlas ("aula_experimental", "evento", "lead_magnet", "lista_espera") | Sim |
| campanha_id | UUID | Atlas (para tracking e vinculação) | Sim |
| headline | string | Nina/Theo (headline principal) | Não (Diego pode criar default) |
| benefícios[] | lista | Nina/Theo (3-4 benefícios) | Não |
| depoimentos[] | lista | Mike/humanos (prova social) | Não |
| campos_form | lista | Atlas (campos do formulário) | Não (default por tipo) |
| pixel_meta | string | Atlas (ID do pixel Meta Ads) | Não |
| pixel_google | string | Atlas (ID do Google Ads Tag) | Não |
| imagem_hero | asset_id | Luna (imagem principal) | Não |
| prazo | date | Atlas (data da campanha) | Sim |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| landing_page_html | arquivo HTML | Hospedagem (Supabase Storage / Netlify / Vercel) |
| url_publicada | URL | Atlas → destino da campanha paga |
| formulário_endpoint | URL | Supabase → leads |
| página_confirmação | arquivo HTML | Hospedagem (redirecionamento pós-form) |
| preview_mobile | PNG | Nina (aprovação) |

## Fases de Execução

### Fase 1 — Identificar Tipo de Landing Page

| Tipo | Objetivo | Campos do form | Estrutura |
|------|----------|---------------|-----------|
| **Aula Experimental** (principal) | Lead → equipe comercial contata | Nome, WhatsApp, Instrumento, Unidade, Idade* | Hero + benefícios + prova social + form + CTA |
| **Evento / Workshop** | Inscrição no evento | Nome, WhatsApp, Email | Hero c/ data + detalhes + form + countdown |
| **Material Gratuito** (lead magnet) | Captar email em troca de conteúdo | Nome, Email | Hero + preview do material + form + entrega |
| **Lista de Espera** | Interesse em turma/serviço futuro | Nome, WhatsApp | Hero + descrição + form simples |

*Idade é campo adicional para LA Music Kids e SonoraMente (faixa etária da criança)

### Fase 2 — Anatomia Visual da Landing Page

```
┌─────────────────────────────────────────────┐
│ HERO SECTION                                │
│ ┌─────────────────────────────────────────┐ │
│ │ Headline impactante (Bebas/Playfair/    │ │
│ │ Baloo conforme marca)                   │ │
│ │                                         │ │
│ │ Subtítulo com proposta de valor          │ │
│ │ (1-2 linhas, direto ao ponto)           │ │
│ │                                         │ │
│ │ [  CTA PRIMÁRIO — scroll pro form  ]    │ │
│ │                                         │ │
│ │ Imagem hero (instrumento, pessoa,       │ │
│ │ criança conforme marca)                 │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ BENEFÍCIOS (3-4 cards)                      │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│ │ ✅   │ │ ✅   │ │ ✅   │ │ ✅   │       │
│ │Benef.│ │Benef.│ │Benef.│ │Benef.│       │
│ │  1   │ │  2   │ │  3   │ │  4   │       │
│ └──────┘ └──────┘ └──────┘ └──────┘       │
├─────────────────────────────────────────────┤
│ PROVA SOCIAL                                │
│ "14 anos formando músicos"                  │
│ "1.200+ alunos"                             │
│ "3 unidades no Rio"                         │
│ Depoimento de aluno/pai (se disponível)     │
├─────────────────────────────────────────────┤
│ FORMULÁRIO DE CONVERSÃO                     │
│ ┌─────────────────────────────────────────┐ │
│ │ Título: "Agende sua aula grátis"       │ │
│ │ [Nome________________________]          │ │
│ │ [WhatsApp___________________]          │ │
│ │ [Instrumento ▼______________]          │ │
│ │ [Unidade ▼__________________]          │ │
│ │                                         │ │
│ │ [  QUERO MINHA AULA GRÁTIS  ]          │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ FOOTER                                      │
│ Logo + endereço + WhatsApp + redes          │
└─────────────────────────────────────────────┘
```

**Regra de ouro do layout:**
- CTA visível sem scroll no mobile (**above the fold**)
- Formulário com campos MÍNIMOS — cada campo extra reduz conversão em ~10%
- WhatsApp é campo obrigatório (canal principal de contato comercial)

### Fase 3 — Design System por Marca

#### 🎸 LA Music School — Impacto e Energia

```css
/* ═══ LP — LA MUSIC SCHOOL ═══ */
:root {
  --hero-bg: #0D0D1A;              /* dark navy */
  --hero-overlay: rgba(13,13,26,0.7);
  --headline-font: 'Bebas Neue', sans-serif;
  --headline-color: #FFFFFF;
  --headline-accent: #E91E63;       /* pink — palavra-chave */
  --body-font: 'Montserrat', sans-serif;
  --body-color: #E0E0E0;
  --section-bg: #F5F1EC;            /* cream — seções claras */
  --card-bg: #FFFFFF;
  --cta-bg: #E91E63;
  --cta-text: #FFFFFF;
  --cta-hover: #C2185B;
  --cta-radius: 50px;               /* pill button */
  --form-bg: #F5F1EC;               /* cream */
  --form-border: #DDD;
  --form-radius: 8px;
  --accent-element: 45deg;           /* diagonal stripes */
}

/* Headline com palavra em destaque */
.hero h1 { font-family: var(--headline-font); font-size: 48px; text-transform: uppercase; }
.hero h1 span.accent { color: var(--headline-accent); }
/* Ex: "APRENDA <span class='accent'>GUITARRA</span> DE VERDADE" */
```

**Elementos visuais School:**
- Hero: fundo dark com imagem de instrumento/músico + overlay gradiente
- Diagonal pink stripe como elemento decorativo
- Circles/dots pattern sutil no background
- Ícones bold/filled nos benefícios

#### 🧠 SonoraMente LA — Acolhimento e Confiança

```css
/* ═══ LP — SONORAMENTE LA ═══ */
:root {
  --hero-bg: #3D1A6E;               /* roxo profundo */
  --hero-overlay: rgba(61,26,110,0.6);
  --headline-font: 'Playfair Display', serif;
  --headline-color: #FFFFFF;
  --headline-accent: #E0B0FF;       /* malva suave */
  --body-font: 'DM Sans', sans-serif;
  --body-color: #F0E8FF;
  --section-bg: #FAF8FF;            /* off-white lavanda */
  --card-bg: #FFFFFF;
  --cta-bg: #5B2D8E;
  --cta-text: #FFFFFF;
  --cta-hover: #7C4DFF;
  --cta-radius: 50px;
  --form-bg: #EDE8F5;               /* lilás soft */
  --form-border: #D0C4E8;
  --form-radius: 12px;
}

/* Headline empática */
.hero h1 { font-family: var(--headline-font); font-size: 36px; font-weight: 700; }
/* Ex: "O som que cuida do seu filho" */
```

**Elementos visuais SonoraMente:**
- Hero: fundo roxo profundo com imagem acolhedora (criança/terapeuta)
- Gradientes suaves (roxo → lilás → malva)
- Bordas arredondadas generosas (16px+)
- Wave shape dividers entre seções
- Ícones line/outline com traço fino

#### 🎨 LA Music Kids — Diversão e Cor

```css
/* ═══ LP — LA MUSIC KIDS ═══ */
:root {
  --hero-bg: #00AFEF;               /* azul vibrante */
  --hero-overlay: rgba(0,175,239,0.5);
  --headline-font: 'Baloo 2', cursive;
  --headline-color: #FFFFFF;
  --headline-accent: #FFE66D;       /* amarelo sol */
  --body-font: 'Nunito', sans-serif;
  --body-color: #2D3436;
  --section-bg: #FFF8F0;            /* off-white quente */
  --card-bg: #FFFFFF;
  --cta-bg: #00AFEF;
  --cta-text: #FFFFFF;
  --cta-hover: #0090C8;
  --cta-radius: 50px;
  --form-bg: #FFFFFF;
  --form-border: #E0E0E0;
  --form-radius: 20px;
  --color-1: #FF6B35;               /* catavento */
  --color-2: #4ECDC4;
  --color-3: #FFE66D;
  --color-4: #FF6B9D;
}

/* Headline divertida */
.hero h1 { font-family: var(--headline-font); font-size: 40px; }
/* Ex: "Música não é só pra gente grande! 🎵" */
```

**Elementos visuais Kids:**
- Hero: fundo colorido com imagem de criança tocando
- Barra de 4 cores do catavento como separador
- Ondas coloridas entre seções
- Bordas super arredondadas (20px)
- Confetti ou notas musicais como decoração

### Fase 4 — Formulário de Conversão

**Código do formulário com validação:**
```html
<section class="form-section" id="formulario">
  <h2>Agende sua aula experimental grátis</h2>
  <p>Preencha e entraremos em contato em até 24h</p>
  
  <div id="form-container">
    <input type="text" id="name" placeholder="Seu nome" required>
    <input type="tel" id="whatsapp" placeholder="(21) 99999-9999" required>
    
    <select id="instrument">
      <option value="">Instrumento de interesse</option>
      <!-- Opções variam por marca -->
    </select>
    
    <select id="unit">
      <option value="">Unidade preferida</option>
      <option value="campo-grande">Campo Grande</option>
      <option value="recreio">Recreio</option>
      <option value="barra">Barra da Tijuca</option>
    </select>
    
    <button onclick="submitForm()">QUERO MINHA AULA GRÁTIS</button>
  </div>
  
  <div id="form-success" style="display:none">
    <h3>🎵 Recebemos seus dados!</h3>
    <p>Entraremos em contato em até 24h pelo WhatsApp.</p>
    <p>Enquanto isso, siga a gente no Instagram!</p>
  </div>
</section>
```

**JavaScript do formulário:**
```javascript
async function submitForm() {
  const name = document.getElementById('name').value.trim();
  const whatsapp = document.getElementById('whatsapp').value.trim();
  const instrument = document.getElementById('instrument').value;
  const unit = document.getElementById('unit').value;
  
  // Validação
  if (!name || !whatsapp) {
    alert('Preencha nome e WhatsApp');
    return;
  }
  
  const cleanPhone = whatsapp.replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 13) {
    alert('WhatsApp inválido');
    return;
  }
  const formattedPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
  
  // Desabilitar botão
  const btn = document.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  
  try {
    // 1. Salvar no Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        name,
        whatsapp: formattedPhone,
        instrument,
        unit,
        source: 'landing_page',
        campaign_id: CAMPAIGN_ID,
        brand: BRAND,
        utm_source: new URLSearchParams(location.search).get('utm_source'),
        utm_medium: new URLSearchParams(location.search).get('utm_medium'),
        utm_campaign: new URLSearchParams(location.search).get('utm_campaign'),
        created_at: new Date().toISOString()
      })
    });
    
    // 2. Notificar equipe via UAZAPI
    await fetch(UAZAPI_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedPhone,
        message: `🎵 Novo lead da LP!\nNome: ${name}\nWhatsApp: ${whatsapp}\nInstrumento: ${instrument}\nUnidade: ${unit}\nCampanha: ${CAMPAIGN_ID}`
      })
    });
    
    // 3. Disparar evento de conversão para pixels
    if (typeof fbq !== 'undefined') fbq('track', 'Lead');
    if (typeof gtag !== 'undefined') gtag('event', 'conversion', { send_to: GOOGLE_CONVERSION_ID });
    
    // 4. Mostrar confirmação
    document.getElementById('form-container').style.display = 'none';
    document.getElementById('form-success').style.display = 'block';
    
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = 'QUERO MINHA AULA GRÁTIS';
    alert('Erro ao enviar. Tente novamente.');
  }
}
```

### Fase 5 — Pixels e Tracking

**Meta Pixel (Facebook/Instagram Ads):**
```html
<!-- Meta Pixel — inserir no <head> -->
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'META_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=META_PIXEL_ID&ev=PageView&noscript=1"/></noscript>
```

**Google Ads Tag:**
```html
<!-- Google Ads — inserir no <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GOOGLE_ADS_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GOOGLE_ADS_ID');
</script>
```

### Fase 6 — Especificações Técnicas

**Requisitos obrigatórios:**
- HTML responsivo (mobile first — 80%+ do tráfego pago é mobile)
- Carregamento rápido (< 3 segundos — LCP < 2.5s)
- Sem dependências pesadas (sem jQuery, sem Bootstrap)
- Fontes via Google Fonts (preconnect para velocidade)
- Imagens em WebP com lazy loading
- HTTPS obrigatório (SSL)

**Meta tags obrigatórias:**
```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta property="og:title" content="Aula Experimental Grátis — LA Music School">
<meta property="og:description" content="Aprenda o instrumento que você sempre quis. 14 anos formando músicos.">
<meta property="og:image" content="URL_THUMBNAIL_1200x630">
<meta property="og:type" content="website">
<meta name="robots" content="noindex">  <!-- LP de campanha não deve indexar no Google -->
<link rel="icon" href="URL_FAVICON">
```

**Hospedagem:**
- Opção 1: Supabase Storage (estático, gratuito, SSL)
- Opção 2: Netlify (deploy automático, formulário backup, SSL)
- Opção 3: Vercel (deploy automático, edge functions, SSL)

**Performance checklist:**
- [ ] Imagens em WebP (ou AVIF) — não usar PNG/JPG pesados
- [ ] Lazy loading em imagens abaixo do fold
- [ ] Google Fonts com `display=swap` e `preconnect`
- [ ] CSS inline no HTML (evitar request extra)
- [ ] Minificação de HTML/CSS/JS
- [ ] Gzip/Brotli habilitado no servidor

## Veto Conditions — NUNCA
- NUNCA criar LP sem pixel de tracking instalado (Meta e/ou Google) — Atlas precisa medir conversão
- NUNCA incluir campos desnecessários no formulário (cada campo reduz conversão ~10%)
- NUNCA deixar LP sem WhatsApp como campo obrigatório
- NUNCA publicar LP sem testar em celular (mobile first!)
- NUNCA deixar LP sem página de confirmação (lead precisa de feedback)
- NUNCA usar imagens pesadas (>500KB) — usar WebP com lazy loading
- NUNCA indexar LP de campanha no Google (usar noindex)
- NUNCA publicar sem HTTPS
- NUNCA criar LP sem Design System da marca — é extensão da marca
- NUNCA lançar LP sem disparar evento de conversão no submit (fbq/gtag)

## Checklist de Conclusão
- [ ] Tipo de LP definido (aula experimental, evento, lead magnet, lista espera)
- [ ] Design System da marca aplicado (cores, fontes, elementos)
- [ ] Hero com headline + subtítulo + CTA above the fold
- [ ] Benefícios (3-4) apresentados com clareza
- [ ] Prova social incluída (anos, alunos, unidades, depoimentos)
- [ ] Formulário funcional com validação de WhatsApp
- [ ] Lead salvo no Supabase ao submeter
- [ ] Notificação UAZAPI para equipe comercial
- [ ] Meta Pixel instalado e evento Lead configurado
- [ ] Google Ads Tag instalado (se campanha Google)
- [ ] Página de confirmação com próximos passos
- [ ] Meta tags Open Graph configuradas
- [ ] Testado em celular (iPhone + Android)
- [ ] Carregamento < 3 segundos (lighthouse)
- [ ] URL entregue ao Atlas para configurar campanha

## Integrações
- **Supabase (leads)** — armazenamento de leads capturados
- **UAZAPI** — notificação da equipe comercial via WhatsApp
- **Meta Pixel** — tracking de conversão para Facebook/Instagram Ads
- **Google Ads Tag** — tracking de conversão para Google Ads
- **Supabase Storage / Netlify / Vercel** — hospedagem da LP
- **Puppeteer** — gerar preview/thumbnail da LP para aprovação
- **Google Fonts CDN** — fontes por marca
