# Runbook — LAHQ School Carrossel

Fonte da verdade para produzir carrosséis da **LA Music School** no pipeline LAHQ/Alfredo.

## Arquivos canônicos

- Brand guide: `shared/brand-guides/brand-la-music-school.md`
- Design system: `shared/design-systems/la-music-school-design-system-v2-abril-2026.html`
- Índice DS: `shared/design-systems/LA_MUSIC_SCHOOL_DS_CANONICAL.md`
- Logos oficiais: `shared/brand-assets/logos/school/`
- Fontes: `shared/brand-assets/fonts/school/`
- Refs ouro: `shared/design-systems/references/la-music-school-v2-gold/`

## Formato padrão

- Instagram carrossel: `1080x1440` px
- Render HD recomendado: `2160x2880` px e downscale/compressão se necessário
- Safe zones: `180px` topo/base, `50px` laterais
- Entrega: PNGs individuais + preview grid + pacote compactado quando houver múltiplos cards

## Workflow compacto LAHQ

1. **Briefing / Nina**
   - Definir marca, objetivo, público, tema, número de cards e CTA.
   - Estruturar card a card: capa, conteúdo, respiro, CTA.
   - Definir direção visual baseada nas refs ouro.

2. **Copy / Theo**
   - Títulos curtos, diretos, com atitude rock.
   - Corpo enxuto: se passar de 3 linhas, quebrar em outro card.
   - CTA claro, sem texto genérico demais.

3. **Imagem / Luna**
   - Para técnica/instrumento: foto real/cinemática é obrigatória.
   - Prompt em inglês, sem texto, sem logo, sem watermark.
   - Foto não precisa aparecer em todos os cards; identidade visual pode sustentar cards de conteúdo e CTA.

4. **Montagem / Diego**
   - Usar Prompt local.
   - Usar somente cores oficiais: `#E91451`, `#0A0A0A`, `#E8E8E8` e variações de opacidade.
   - Compor com halftone dots, chevrons, outline type, pink blob e footer pill quando fizer sentido.
   - Exportar PNG legível e consistente com refs ouro.

5. **QA / Tina + Nina-approve**
   - Comparar visualmente com refs ouro antes de aprovar.
   - Reprovar se inventar logo, fonte, cor ou misturar marca.
   - Reprovar se usar `LA` digitado como watermark.

## Regra crítica do LA oficial

O `LA` da School **não é texto**. É o símbolo oficial da logo.

- Nunca digitar `LA` como watermark, textura ou elemento gráfico.
- Usar os SVGs oficiais de `shared/brand-assets/logos/school/`.
- Para fundo escuro/pink: preferir variações `dark-*`.
- Para fundo claro: preferir variações `light-*`.
- Regra de composição: **preferir 1 LA oficial dominante por card**, grande, sangrado/cortado e integrado ao fundo.
- Variações são permitidas, mas com parcimônia:
  - no máximo 1 LA secundário pequeno quando a composição pedir;
  - nunca repetir vários LAs soltos como padrão/textura;
  - nunca transformar o LA em “confete” decorativo;
  - se a referência ouro não usa repetição, não repetir.
- O LA deve funcionar como massa gráfica/coadjuvante, não competir com título, foto ou CTA.
- Opacidade sugerida do LA dominante: `6%–14%`; secundário, quando existir: `4%–8%`.

## O que NÃO usar

- `LA` digitado com fonte comum.
- Vários LAs soltos espalhados pela arte sem função compositiva.
- Cream/bege `#F5F1EC` como tema School v2.
- Pink antigo `#E91E63`.
- Gold badge como cor de marca.
- Bebas Neue, Montserrat ou Google Fonts genéricas.
- Faixa diagonal pink como assinatura obrigatória.
- Elementos Kids ou SonoraMente em peças School.

## Checklist final

- [ ] Brand guide School consultado.
- [ ] DS canônico School consultado.
- [ ] Refs ouro abertas/comparadas.
- [ ] Logo/SVG oficial usado, não reconstruído.
- [ ] Watermark usa símbolo oficial, nunca texto `LA`.
- [ ] LA aparece como massa gráfica coerente — preferencialmente 1 dominante, não vários soltos.
- [ ] Cores e fontes corretas.
- [ ] Texto legível no mobile.
- [ ] Numeração consistente quando for carrossel.
- [ ] CTA claro.
- [ ] PNGs finais exportados e revisados.
