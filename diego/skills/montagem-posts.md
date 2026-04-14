---
name: montagem-posts
description: Skill para montar posts quadrados em HTML/JSX (1080x1080) seguindo Design System da marca. Posts competem com fotos reais no feed — impacto visual é prioridade. Use sempre que Diego precisa montar um post estático de imagem única.
---

# Montagem de Posts

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| briefing | documento | Nina (direção criativa) | Sim |
| asset_principal | asset_id | Luna (foto, ilustração ou background) | Sim |
| copy | texto | Theo (headline curta + CTA) | Sim |
| marca | string | Briefing ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| tipo_post | string | Briefing ("frase_impacto", "foto_com_texto", "anuncio", "data_comemorativa") | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| png_post | arquivo PNG 1080x1080 | Supabase Storage |
| output_registro | registro | Supabase → tabela outputs |
| preview_url | URL | Nina → aprovação |

## Fases de Execução

### Fase 1 — Receber Inputs e Identificar Tipo

**Tipos de post e abordagem:**

| Tipo | Abordagem | Proporção imagem/texto |
|------|-----------|----------------------|
| Frase de impacto | Fundo da marca + frase grande centralizada | 20% imagem / 80% texto |
| Foto com texto | Foto como fundo + overlay + texto sobreposto | 70% imagem / 30% texto |
| Anúncio | Visual de campanha com CTA forte | 50/50 |
| Data comemorativa | Visual temático + mensagem da marca | 60% imagem / 40% texto |

**Regra:** post 1:1 compete com fotos reais no feed. Impacto visual > quantidade de texto. UMA mensagem, UMA ação.

### Fase 2 — Composição por Marca

**Princípios gerais do post 1080x1080:**
- Composição centralizada (foco no centro — funciona como thumbnail)
- Margens mínimas: 40px em todos os lados
- Texto mínimo: headline 36-48px, corpo 18-24px (maior que carrossel — menos texto, mais impacto)
- Logo discreto no canto inferior (30-40px)
- UMA mensagem por post — se precisa de mais, é carrossel

#### 🎸 LA Music School
- **Frase de impacto:** fundo #0A0A0A, frase em Bebas Neue branco, palavra-chave em #E91E63, diagonal stripe decorativa
- **Foto com texto:** foto de instrumento/músico, overlay gradiente escuro (bottom 50%), texto Bebas Neue na parte inferior
- **Estilo:** alto contraste, bold, energia de palco

#### 🧠 SonoraMente LA
- **Frase de impacto:** fundo #3D1A6E, frase em Playfair Display branco, palavra-chave em #B39DDB, bordas arredondadas
- **Foto com texto:** foto acolhedora, overlay gradiente roxo suave, texto Playfair na parte inferior
- **Estilo:** suave, elegante, acolhedor — espaçamento generoso

#### 🎨 LA Music Kids
- **Frase de impacto:** fundo #00AFEF ou branco, frase em Baloo 2, palavras alternando cores do catavento
- **Foto com texto:** foto de criança, overlay leve, texto Baloo 2 com fundo colorido translúcido
- **Estilo:** colorido, divertido, energético — barra 4 cores como elemento

### Fase 3 — Técnicas de Overlay para Foto com Texto

**Quando o post tem foto de fundo, texto precisa ser legível:**

```css
/* Gradiente escuro na parte inferior (School) */
.overlay-bottom {
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0) 40%,
    rgba(0,0,0,0.85) 100%
  );
}

/* Gradiente roxo suave (SonoraMente) */
.overlay-purple {
  background: linear-gradient(
    to bottom,
    rgba(61,26,110,0) 30%,
    rgba(61,26,110,0.75) 100%
  );
}

/* Card translúcido centralizado (Kids) */
.overlay-card {
  background: rgba(255,255,255,0.90);
  border-radius: 20px;
  padding: 24px 32px;
  /* Texto fica dentro do card sobre a foto */
}

/* Texto com sombra forte (fallback universal) */
.text-shadow-strong {
  text-shadow: 0 2px 8px rgba(0,0,0,0.8),
               0 4px 16px rgba(0,0,0,0.4);
}
```

### Fase 4 — Montar HTML, Exportar e Entregar

1. Montar HTML 1080x1080px (mesma estrutura base da skill montagem-carrossel)
2. Imagens em base64 (referência: skill exportacao-renderizacao)
3. Exportar via Puppeteer: `setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 })`
4. Verificar: impacto visual, legibilidade, PNG < 2MB
5. Upload Storage → registrar output → enviar para Nina

## Veto Conditions — NUNCA
- NUNCA mais de uma mensagem por post (se precisa de mais, é carrossel)
- NUNCA texto sobre foto sem overlay ou gradiente (ilegível)
- NUNCA sem Design System da marca aplicado
- NUNCA texto menor que 18px (post tem menos espaço que carrossel)
- NUNCA composição descentrada (post funciona como thumbnail no perfil)
- NUNCA sem logo da marca (discreto, mas presente)
- NUNCA imagem de baixa qualidade (post é vitrine do perfil)

## Checklist de Conclusão
- [ ] Briefing recebido e tipo de post identificado
- [ ] Design System da marca aplicado (cores, fontes, elementos)
- [ ] UMA mensagem clara e impactante
- [ ] Overlay/gradiente aplicado se foto com texto
- [ ] Composição centralizada (funciona como thumbnail)
- [ ] Renderizado via Puppeteer (1080x1080, deviceScaleFactor: 2)
- [ ] PNG verificado visualmente e < 2MB
- [ ] Output registrado no Supabase
- [ ] Preview enviado para Nina aprovar

## Integrações
- **Puppeteer (VPS)** — renderização (referência: skill exportacao-renderizacao)
- **Supabase Storage + outputs** — armazenamento e registro
- **Design Systems** — regras visuais por marca
