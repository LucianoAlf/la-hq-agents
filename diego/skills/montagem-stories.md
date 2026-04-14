---
name: montagem-stories
description: Skill para montar stories estáticos em HTML/JSX (1080x1920 — 9:16) seguindo Design System da marca. Stories são rápidos e verticais — texto grande, mensagem única, CTA claro. Use sempre que Diego precisa montar um story estático.
---

# Montagem de Stories

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| briefing | documento | Nina (direção criativa) | Sim |
| asset_principal | asset_id | Luna (foto, ilustração ou background) | Sim |
| copy | texto | Theo (frase curta + CTA) | Não (story pode ser só visual) |
| marca | string | Briefing ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| tipo_story | string | Briefing ("aviso", "bastidores", "enquete", "promo", "dica_rapida") | Não |
| elementos_interativos | lista | Nina ("enquete", "pergunta", "countdown", "link") | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| png_story | arquivo PNG 1080x1920 | Supabase Storage |
| output_registro | registro | Supabase → tabela outputs |
| preview_url | URL | Nina → aprovação |
| instrução_interativo | texto | Tina (para adicionar stickers do Instagram manualmente) |

## Fases de Execução

### Fase 1 — Entender o Tipo de Story

| Tipo | Objetivo | Duração na tela | Composição |
|------|----------|----------------|------------|
| Aviso/Novidade | Informar rápido | 5s | Fundo marca + texto grande + CTA |
| Bastidores | Humanizar | 5s | Foto real + overlay leve + caption |
| Enquete/Pergunta | Engajar | 5s | Pergunta grande + espaço para sticker IG |
| Promo | Converter | 5s | Visual de campanha + link/swipe up |
| Dica rápida | Educar | 5s | Texto impactante + ícone/emoji |

**Regra:** story tem 5 segundos de atenção. Se a pessoa não entendeu a mensagem em 2 segundos, perdeu.

### Fase 2 — Zona Segura do Instagram

**O Instagram cobre topo e fundo do story com UI. Todo conteúdo DEVE ficar na zona segura:**

```
┌────────────────────┐ Y = 0
│ ██ ZONA MORTA ██   │ 
│ Nome do perfil,    │ Y = 0-150px  ⛔ NUNCA colocar conteúdo
│ ícone de fechar    │
├────────────────────┤ Y = 150
│                    │
│                    │
│  ✅ ZONA SEGURA    │ Y = 150-1400px  ← CONTEÚDO PRINCIPAL
│  para conteúdo     │
│                    │
│                    │
├────────────────────┤ Y = 1400
│                    │
│  🟡 ZONA DE CTA    │ Y = 1400-1720px  ← CTA / swipe up
│  (terço inferior)  │
│                    │
├────────────────────┤ Y = 1720
│ ██ ZONA MORTA ██   │
│ Barra de resposta, │ Y = 1720-1920px  ⛔ NUNCA colocar conteúdo
│ enviar mensagem    │
└────────────────────┘ Y = 1920
```

**Resumo prático:**
- Conteúdo principal: **Y = 150 a 1400px** (1250px de área útil)
- CTA / botão: **Y = 1400 a 1720px** (terço inferior)
- NUNCA colocar nada nos primeiros 150px e últimos 200px

### Fase 3 — Composição por Marca

**Princípios gerais do story 1080x1920:**
- Texto GRANDE: mínimo 24px corpo, 48-64px títulos
- UMA mensagem por story (se precisa de mais, fazer sequência)
- Margens laterais: mínimo 60px (dedos cobrem as bordas ao segurar o celular)
- Se tem foto: overlay obrigatório para legibilidade do texto
- Logo discreto (mas presente) — posição: Y ~1650px centralizado

#### 🎸 LA Music School
- Fundo: dark #0A0A0A ou foto com overlay gradiente escuro
- Título: Bebas Neue 56-64px, branco, palavra-chave em #E91E63
- CTA: pill pink no terço inferior
- Elementos: diagonal stripe, flash de energia

#### 🧠 SonoraMente LA
- Fundo: roxo #3D1A6E ou foto com overlay roxo suave
- Título: Playfair Display 48-56px, branco
- CTA: pill roxo #5B2D8E ou branco no terço inferior
- Elementos: gradiente lavanda, bordas arredondadas 16px

#### 🎨 LA Music Kids
- Fundo: azul #00AFEF ou branco com elementos coloridos
- Título: Baloo 2 52-60px, branco ou colorido
- CTA: pill azul ou amarelo no terço inferior
- Elementos: barra 4 cores no topo (abaixo da zona morta), ondas

### Fase 4 — Elementos Interativos do Instagram

**Stories estáticos podem ser preparados COM espaço para stickers que Tina adiciona no Instagram:**

| Sticker | Espaço a reservar | Onde posicionar |
|---------|-------------------|-----------------|
| Enquete (2 opções) | 400x120px | Centro, Y ~900-1020px |
| Pergunta (caixa texto) | 500x150px | Centro, Y ~900-1050px |
| Countdown | 350x100px | Centro, Y ~1100-1200px |
| Link (swipe up / botão) | Nativo do IG | Terço inferior, Y ~1500px |
| Emoji slider | 400x100px | Centro, Y ~1000px |

**Quando o story inclui interativo:** Diego monta o visual COM o espaço reservado (área vazia ou com placeholder) e envia instrução para Tina sobre qual sticker adicionar e onde.

### Fase 5 — Montar HTML, Exportar e Entregar

1. Montar HTML 1080x1920px (CSS inline, fontes Google Fonts, imagens base64)
2. Respeitar zona segura rigorosamente
3. Exportar via Puppeteer: `setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 })`
4. Verificar: legibilidade rápida (2s test), zona segura, PNG < 2MB
5. Se tem interativo: documentar instrução para Tina
6. Upload Storage → registrar output → enviar para Nina

## Veto Conditions — NUNCA
- NUNCA conteúdo fora da zona segura (Y < 150 ou Y > 1720)
- NUNCA texto pequeno (mín 24px corpo, 48px título) — story é visto rápido
- NUNCA mais de uma mensagem por story (se precisa de mais, fazer sequência)
- NUNCA sem Design System da marca
- NUNCA texto sobre foto sem overlay/gradiente
- NUNCA CTA fora do terço inferior (Y 1400-1720)
- NUNCA margens laterais menores que 60px (dedos cobrem)

## Checklist de Conclusão
- [ ] Briefing recebido e tipo de story identificado
- [ ] Design System da marca aplicado (cores, fontes, elementos)
- [ ] Conteúdo dentro da zona segura (Y 150-1720)
- [ ] Texto grande e legível (teste dos 2 segundos)
- [ ] UMA mensagem clara
- [ ] CTA no terço inferior
- [ ] Overlay aplicado se foto com texto
- [ ] Espaço reservado para stickers interativos (se aplicável)
- [ ] Instrução para Tina documentada (se interativo)
- [ ] Renderizado via Puppeteer (1080x1920)
- [ ] PNG < 2MB, output registrado no Supabase

## Integrações
- **Puppeteer (VPS)** — renderização (referência: skill exportacao-renderizacao)
- **Supabase Storage + outputs** — armazenamento e registro
- **Design Systems** — regras visuais por marca
- **Instagram** — stickers interativos (Tina adiciona manualmente)
