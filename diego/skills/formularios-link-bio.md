---
name: formularios-link-bio
description: Skill para criar páginas de Link na Bio (tipo Linktree) customizadas com formulários de captação para Instagram. Use quando a marca precisa de uma página de bio com links, formulários de aula experimental, WhatsApp direto e links para redes sociais — tudo na identidade visual da marca.
---

# Formulários e Link na Bio

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| marca | string | Mike ou Nina ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| ação | string | Mike ("criar", "atualizar", "trocar_destaque") | Sim |
| links[] | lista de objetos | Mike/Tina (ícone, texto, URL) | Condicional (para "criar") |
| destaque_sazonal | objeto | Mike (título, CTA, URL destino) | Não |
| formulário_ativo | boolean | Mike (se inclui form de captação) | Não (default: true) |
| campos_form | lista | Mike (campos do formulário) | Não (default: nome + WhatsApp) |
| campanha_id | UUID | Atlas (para tracking) | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| página_html | arquivo HTML | Supabase Storage / Netlify / Vercel |
| url_publicada | URL | Tina → atualizar link na bio do Instagram |
| formulário_endpoint | URL | Supabase → leads |
| utm_links[] | lista URLs | Atlas → tracking de cliques |

## Fases de Execução

### Fase 1 — Definir Estrutura da Página

**Layout padrão da página Link na Bio:**

```
┌─────────────────────────────────┐
│ HEADER                          │
│ Logo da marca + nome            │
│ Tagline / slogan                │
├─────────────────────────────────┤
│ 🔥 DESTAQUE SAZONAL            │
│ "Matrículas Abertas 2026"       │
│ [Botão CTA → formulário/LP]    │
├─────────────────────────────────┤
│ FORMULÁRIO RÁPIDO (opcional)    │
│ Nome + WhatsApp                 │
│ [Quero saber mais]              │
├─────────────────────────────────┤
│ LINKS                           │
│ 📱 WhatsApp                    │
│ 🌐 Site                        │
│ 📍 Localização                 │
│ 📧 Email                       │
│ 🎵 Spotify/YouTube             │
├─────────────────────────────────┤
│ REDES SOCIAIS                   │
│ [ícones das redes]              │
├─────────────────────────────────┤
│ FOOTER                          │
│ © LA Music 2026                 │
└─────────────────────────────────┘
```

**Variações:**
- Com formulário de captação (padrão — para captação de leads)
- Sem formulário (apenas links — quando não há campanha ativa)
- Com countdown (para eventos com data específica)

### Fase 2 — Design por Marca

#### 🎸 LA Music School — Dark + Pink

```html
<style>
  /* ═══ LA MUSIC SCHOOL — Link na Bio ═══ */
  :root {
    --bg: #0A0A0A;
    --card-bg: #141414;
    --card-border: #E91E63;
    --text-primary: #FFFFFF;
    --text-secondary: #B0B0B0;
    --accent: #E91E63;
    --accent-hover: #C2185B;
    --cta-bg: #E91E63;
    --cta-text: #FFFFFF;
    --font-title: 'Bebas Neue', sans-serif;
    --font-body: 'Montserrat', sans-serif;
    --radius-card: 12px;
    --radius-btn: 50px;
  }
  
  body {
    background: var(--bg);
    font-family: var(--font-body);
    color: var(--text-primary);
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 16px;
  }
  
  .header { text-align: center; margin-bottom: 24px; }
  .header img { width: 80px; height: 80px; border-radius: 50%; }
  .header h1 { font-family: var(--font-title); font-size: 28px; margin: 12px 0 4px; }
  .header p { color: var(--text-secondary); font-size: 14px; }
  
  .destaque {
    background: var(--accent);
    color: var(--cta-text);
    border-radius: var(--radius-btn);
    padding: 16px 24px;
    text-align: center;
    font-weight: 700;
    margin-bottom: 16px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .destaque:hover { background: var(--accent-hover); }
  
  .link-card {
    background: var(--card-bg);
    border-left: 3px solid var(--card-border);
    border-radius: var(--radius-card);
    padding: 14px 18px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.2s;
    text-decoration: none;
    color: var(--text-primary);
  }
  .link-card:hover { background: var(--accent); }
  .link-card .icon { font-size: 20px; }
  .link-card .label { font-size: 15px; font-weight: 500; }
  
  .form-section {
    background: var(--card-bg);
    border-radius: var(--radius-card);
    padding: 20px;
    margin-bottom: 16px;
  }
  .form-section h3 { font-family: var(--font-title); font-size: 20px; margin-bottom: 12px; }
  .form-section input, .form-section select {
    width: 100%;
    padding: 12px;
    border: 1px solid #333;
    border-radius: 8px;
    background: #1A1A1A;
    color: white;
    font-size: 15px;
    margin-bottom: 10px;
    box-sizing: border-box;
  }
  .form-section button {
    width: 100%;
    padding: 14px;
    background: var(--cta-bg);
    color: var(--cta-text);
    border: none;
    border-radius: var(--radius-btn);
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
  }
</style>
```

#### 🧠 SonoraMente LA — Suave + Roxo

```html
<style>
  /* ═══ SONORAMENTE LA — Link na Bio ═══ */
  :root {
    --bg: #FAF8FF;
    --card-bg: #FFFFFF;
    --card-border: #5B2D8E;
    --text-primary: #2D1B4E;
    --text-secondary: #6B5B7B;
    --accent: #5B2D8E;
    --accent-hover: #7C4DFF;
    --cta-bg: #5B2D8E;
    --cta-text: #FFFFFF;
    --font-title: 'Playfair Display', serif;
    --font-body: 'DM Sans', sans-serif;
    --radius-card: 16px;
    --radius-btn: 50px;
  }
  
  body {
    background: var(--bg);
    font-family: var(--font-body);
    color: var(--text-primary);
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 16px;
  }
  
  .header { text-align: center; margin-bottom: 24px; }
  .header img { width: 80px; height: 80px; border-radius: 50%; }
  .header h1 { font-family: var(--font-title); font-size: 24px; margin: 12px 0 4px; }
  .header p { color: var(--text-secondary); font-size: 14px; font-style: italic; }
  
  .destaque {
    background: var(--accent);
    color: var(--cta-text);
    border-radius: var(--radius-btn);
    padding: 16px 24px;
    text-align: center;
    font-weight: 600;
    margin-bottom: 16px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .destaque:hover { background: var(--accent-hover); }
  
  .link-card {
    background: var(--card-bg);
    border-left: 3px solid var(--card-border);
    border-radius: var(--radius-card);
    padding: 14px 18px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.2s;
    text-decoration: none;
    color: var(--text-primary);
    box-shadow: 0 1px 4px rgba(93,45,142,0.08);
  }
  .link-card:hover { background: #EDE8F5; }
  
  .form-section {
    background: var(--card-bg);
    border-radius: var(--radius-card);
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(93,45,142,0.08);
  }
  .form-section h3 { font-family: var(--font-title); font-size: 18px; margin-bottom: 12px; }
  .form-section input, .form-section select {
    width: 100%;
    padding: 12px;
    border: 1px solid #E0D6F0;
    border-radius: 12px;
    background: #FAF8FF;
    color: var(--text-primary);
    font-size: 15px;
    margin-bottom: 10px;
    box-sizing: border-box;
  }
  .form-section button {
    width: 100%;
    padding: 14px;
    background: var(--cta-bg);
    color: var(--cta-text);
    border: none;
    border-radius: var(--radius-btn);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
  }
</style>
```

#### 🎨 LA Music Kids — Colorido + Catavento

```html
<style>
  /* ═══ LA MUSIC KIDS — Link na Bio ═══ */
  :root {
    --bg: #FFFFFF;
    --card-bg: #FFFFFF;
    --color-1: #FF6B35;  /* laranja catavento */
    --color-2: #4ECDC4;  /* turquesa */
    --color-3: #FFE66D;  /* amarelo sol */
    --color-4: #FF6B9D;  /* rosa catavento */
    --text-primary: #2D3436;
    --text-secondary: #636E72;
    --cta-bg: #00AFEF;
    --cta-text: #FFFFFF;
    --font-title: 'Baloo 2', cursive;
    --font-body: 'Nunito', sans-serif;
    --radius-card: 20px;
    --radius-btn: 50px;
  }
  
  body {
    background: var(--bg);
    font-family: var(--font-body);
    color: var(--text-primary);
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 16px;
  }
  
  .header { text-align: center; margin-bottom: 24px; }
  .header img { width: 80px; height: 80px; border-radius: 50%; }
  .header h1 { font-family: var(--font-title); font-size: 26px; margin: 12px 0 4px; }
  .header p { color: var(--text-secondary); font-size: 14px; }
  
  .destaque {
    background: var(--cta-bg);
    color: var(--cta-text);
    border-radius: var(--radius-btn);
    padding: 16px 24px;
    text-align: center;
    font-weight: 700;
    font-family: var(--font-title);
    margin-bottom: 16px;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .destaque:hover { transform: scale(1.02); }
  
  /* Cards com bordas alternando nas 4 cores do catavento */
  .link-card {
    background: var(--card-bg);
    border-radius: var(--radius-card);
    padding: 14px 18px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.2s;
    text-decoration: none;
    color: var(--text-primary);
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .link-card:nth-child(4n+1) { border-left: 4px solid var(--color-1); }
  .link-card:nth-child(4n+2) { border-left: 4px solid var(--color-2); }
  .link-card:nth-child(4n+3) { border-left: 4px solid var(--color-3); }
  .link-card:nth-child(4n+4) { border-left: 4px solid var(--color-4); }
  .link-card:nth-child(4n+1):hover { background: #FFF0E8; }
  .link-card:nth-child(4n+2):hover { background: #E8FAF8; }
  .link-card:nth-child(4n+3):hover { background: #FFFDE8; }
  .link-card:nth-child(4n+4):hover { background: #FFE8F0; }
  
  .form-section {
    background: var(--card-bg);
    border-radius: var(--radius-card);
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .form-section h3 { font-family: var(--font-title); font-size: 20px; margin-bottom: 12px; }
  .form-section input, .form-section select {
    width: 100%;
    padding: 12px;
    border: 2px solid #E0E0E0;
    border-radius: 14px;
    background: #FAFAFA;
    color: var(--text-primary);
    font-size: 15px;
    margin-bottom: 10px;
    box-sizing: border-box;
  }
  .form-section input:focus { border-color: var(--cta-bg); outline: none; }
  .form-section button {
    width: 100%;
    padding: 14px;
    background: var(--cta-bg);
    color: var(--cta-text);
    border: none;
    border-radius: var(--radius-btn);
    font-size: 16px;
    font-weight: 700;
    font-family: var(--font-title);
    cursor: pointer;
  }
</style>
```

### Fase 3 — Formulário Rápido de Captação

**Campos mínimos:**
- Nome (obrigatório) — `text`, placeholder "Seu nome"
- WhatsApp (obrigatório) — `tel`, placeholder "(21) 99999-9999"
- Instrumento/interesse (opcional) — `select` com opções por marca

**Opções de dropdown por marca:**

| LA Music School | SonoraMente LA | LA Music Kids |
|----------------|---------------|---------------|
| Guitarra | Musicoterapia | Musicalização (6m-2 anos) |
| Violão | Fonoaudiologia | Musicalização (3-5 anos) |
| Bateria | Psicologia | Musicalização (6-8 anos) |
| Teclado/Piano | Terapia Integrativa | Musicalização (9-12 anos) |
| Canto | Avaliação geral | Instrumento |
| Baixo | | |
| Outro | | |

**Validação de WhatsApp (formato brasileiro):**
```javascript
function validateWhatsApp(phone) {
  // Remove tudo que não é dígito
  const digits = phone.replace(/\D/g, '');
  // Aceita: (21)99999-9999, 21999999999, +5521999999999
  if (digits.length === 11) return `55${digits}`; // DDD + 9 dígitos
  if (digits.length === 13 && digits.startsWith('55')) return digits;
  return null; // inválido
}

function formatWhatsApp(phone) {
  const clean = validateWhatsApp(phone);
  if (!clean) return null;
  const ddd = clean.slice(2, 4);
  const num = clean.slice(4);
  return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
}
```

**Integração — salvar lead no Supabase:**
```javascript
async function submitLead(formData, brand, campaignId) {
  const whatsapp = validateWhatsApp(formData.whatsapp);
  if (!whatsapp) {
    showError('WhatsApp inválido. Use o formato (21) 99999-9999');
    return;
  }
  
  // 1. Salvar no Supabase
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: formData.name,
      whatsapp: whatsapp,
      email: formData.email || null,
      interest: formData.interest || null,
      source: 'link_bio',
      brand: brand,
      campaign_id: campaignId || null,
      utm_source: getUtmParam('utm_source'),
      utm_medium: getUtmParam('utm_medium'),
      utm_campaign: getUtmParam('utm_campaign'),
      created_at: new Date().toISOString()
    });
  
  if (error) {
    showError('Ops, algo deu errado. Tente novamente.');
    console.error(error);
    return;
  }
  
  // 2. Notificar equipe comercial via UAZAPI
  await fetch(UAZAPI_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: whatsapp,
      message: `🎵 Novo lead via Bio!\n` +
               `Nome: ${formData.name}\n` +
               `WhatsApp: ${formatWhatsApp(formData.whatsapp)}\n` +
               `Interesse: ${formData.interest || 'Não informado'}\n` +
               `Marca: ${brand}\n` +
               `Origem: Link na Bio`
    })
  });
  
  // 3. Mostrar confirmação inline (não redirecionar)
  showSuccess('Recebemos seus dados! Entraremos em contato em breve 🎵');
}

// Helper: pegar UTM da URL
function getUtmParam(param) {
  return new URLSearchParams(window.location.search).get(param) || null;
}
```

**Após envio:**
- Mensagem de sucesso inline (NÃO redirecionar — manter na página)
- "Entraremos em contato em breve! 🎵"
- Links continuam visíveis abaixo do formulário

### Fase 4 — Links Padrão por Marca

#### 🎸 LA Music School
| Ordem | Ícone | Texto | Destino |
|-------|-------|-------|---------|
| 1 | 🎸 | Aula Experimental Grátis | → formulário/LP de captação |
| 2 | 📱 | Fale no WhatsApp | → wa.me/5521XXXXXXXXX?text=Oi!+Vi+no+Instagram |
| 3 | 🌐 | Nosso Site | → lamusic.com.br?utm_source=instagram&utm_medium=bio |
| 4 | 📍 | Nossas Unidades | → Google Maps ou página de unidades |
| 5 | 🎵 | YouTube | → canal da LA Music |
| 6 | 🎧 | Spotify | → playlist (se houver) |

#### 🧠 SonoraMente LA
| Ordem | Ícone | Texto | Destino |
|-------|-------|-------|---------|
| 1 | 💜 | Agendar Avaliação | → formulário/LP de agendamento |
| 2 | 📱 | Fale no WhatsApp | → wa.me/5521XXXXXXXXX?text=Olá!+Gostaria+de+saber+mais |
| 3 | 🌐 | Nosso Site | → sonoramente.com.br?utm_source=instagram&utm_medium=bio |
| 4 | 📖 | Blog — Artigos | → blog/artigos sobre musicoterapia |
| 5 | 📍 | Localização | → Google Maps |
| 6 | 📚 | Material Gratuito | → lead magnet (e-book, guia) |

#### 🎨 LA Music Kids
| Ordem | Ícone | Texto | Destino |
|-------|-------|-------|---------|
| 1 | 🎵 | Aula Experimental | → formulário/LP de captação |
| 2 | 📱 | Fale no WhatsApp | → wa.me/5521XXXXXXXXX?text=Oi!+Quero+saber+sobre+aulas+infantis |
| 3 | 🌐 | Nosso Site | → lamusickids.com.br?utm_source=instagram&utm_medium=bio |
| 4 | 📍 | Nossas Unidades | → Google Maps |
| 5 | 🎥 | Vídeos das Aulas | → YouTube/Reels |
| 6 | 👶 | Faixas Etárias | → página com detalhes por idade |

**Todos os links com UTM tracking:**
```
?utm_source=instagram&utm_medium=bio&utm_campaign={campanha_ativa}
```

### Fase 5 — Gestão e Atualização de Links

**Links gerenciáveis via Supabase (sem rebuildar HTML):**
```sql
-- Tabela de links dinâmicos
CREATE TABLE IF NOT EXISTS bio_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL,
  brand TEXT NOT NULL,
  position INT NOT NULL,         -- ordem de exibição
  icon TEXT,                     -- emoji ou ícone
  label TEXT NOT NULL,           -- texto do link
  url TEXT NOT NULL,             -- URL de destino
  is_highlight BOOLEAN DEFAULT false,  -- destaque sazonal?
  is_active BOOLEAN DEFAULT true,
  utm_campaign TEXT,
  clicks INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buscar links ativos de uma marca
SELECT icon, label, url, is_highlight
FROM bio_links
WHERE office_id = $1 AND brand = $2 AND is_active = true
ORDER BY is_highlight DESC, position ASC;

-- Trocar destaque sazonal
UPDATE bio_links SET is_highlight = false WHERE office_id = $1 AND brand = $2;
UPDATE bio_links SET is_highlight = true, label = $3, url = $4
WHERE id = $5;

-- Registrar clique
UPDATE bio_links SET clicks = clicks + 1 WHERE id = $1;
```

**Atualização sazonal:**
- Destaque troca conforme campanha ativa (matrícula, evento, promoção)
- Tina atualiza o link na bio do Instagram quando a página muda
- Mike/Tina coordenam quais links estão ativos

### Fase 6 — Especificações Técnicas

**Requisitos:**
- HTML responsivo mobile-first (99% dos acessos vêm do celular via Instagram)
- Carregamento ultra-rápido (< 2 segundos)
- Sem JavaScript pesado — página leve, sem frameworks
- Formulário com validação de WhatsApp (formato brasileiro)
- Meta tags Open Graph (preview bonito quando compartilhado no WhatsApp/Facebook)

**Meta tags obrigatórias:**
```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta property="og:title" content="LA Music School — Links">
<meta property="og:description" content="Pra Quem Sabe o Que Quer! 🎸">
<meta property="og:image" content="URL_DA_THUMBNAIL">
<meta property="og:type" content="website">
<link rel="icon" href="URL_DO_FAVICON">
```

**Hospedagem:**
- Opção 1: Supabase Storage (estático, gratuito)
- Opção 2: Netlify / Vercel (deploy automático, SSL grátis)

**Analytics:**
- UTM tracking em todos os links para Atlas medir
- Pixel do Meta Ads instalado (se campanha paga ativa)
- Contagem de cliques via Supabase (tabela bio_links)

## Veto Conditions — NUNCA
- NUNCA criar página sem Design System da marca (é extensão do perfil)
- NUNCA incluir mais de 3 campos no formulário (cada campo extra reduz conversão)
- NUNCA deixar WhatsApp sem mensagem pré-preenchida no wa.me
- NUNCA publicar sem testar em iPhone E Android
- NUNCA deixar links sem UTM tracking (Atlas precisa medir)
- NUNCA redirecionar após envio do formulário (confirmação inline, manter na página)
- NUNCA misturar estilos de marcas diferentes na mesma página
- NUNCA deixar link quebrado (testar todos antes de publicar)
- NUNCA hospedar sem HTTPS (SSL obrigatório)

## Checklist de Conclusão
- [ ] Design System da marca aplicado corretamente (cores, fontes, estilos)
- [ ] Destaque sazonal configurado (ou removido se não há campanha)
- [ ] Formulário funcional com validação de WhatsApp
- [ ] Lead salvo no Supabase ao submeter formulário
- [ ] Notificação UAZAPI configurada para equipe comercial
- [ ] Todos os links com UTM tracking
- [ ] WhatsApp com mensagem pré-preenchida
- [ ] Meta tags Open Graph configuradas
- [ ] Testado em iPhone e Android (Safari e Chrome)
- [ ] Página carregando em < 2 segundos
- [ ] Tina notificada para atualizar link na bio do Instagram
- [ ] Atlas informado sobre UTMs para tracking

## Integrações
- **Supabase (leads)** — captação e armazenamento de leads do formulário
- **Supabase (bio_links)** — links dinâmicos gerenciáveis sem rebuild
- **UAZAPI** — notificação da equipe comercial quando lead chega
- **Supabase Storage / Netlify / Vercel** — hospedagem da página
- **Instagram** — link na bio (Tina atualiza)
- **Meta Pixel** — tracking de conversão para campanhas pagas
- **Google Analytics / UTM** — rastreamento de cliques por origem
