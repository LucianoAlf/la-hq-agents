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
   - Para técnica/instrumento: fotos reais/cinemáticas são bem-vindas quando ajudam a peça.
   - Não economizar imagem quando o tema pede variedade visual. Se uma lâmina fala de uma ação específica, gerar/usar imagem específica para aquela ação.
   - Evitar reaproveitar a mesma foto em vários cards; cada lâmina deve ter função visual própria quando possível: hero, macro da técnica, detalhe do instrumento, professor/aluno, palco, prática/metrônomo, CTA.
   - Não usar sempre o mesmo padrão de **4 fotos/collage** em todos os cards.
   - Collage com 4 fotos pode funcionar, mas deve aparecer com parcimônia: no máximo em 1–2 cards do carrossel.
   - Variar a solução visual: alternar foto grande hero, foto única recortada, close/macro, card mais tipográfico e card sem foto.
   - Uma foto grande e bem posicionada costuma ficar mais elegante do que quatro fotos pequenas repetidas.
   - Prompt em inglês, sem texto, sem logo, sem watermark.
   - Identidade visual, tipografia e símbolo LA oficial podem sustentar cards sem foto.

4. **Montagem / Diego**
   - Usar Prompt local.
   - Usar somente cores oficiais: `#E91451`, `#0A0A0A`, `#E8E8E8` e variações de opacidade.
   - Compor com halftone dots, chevrons, outline type, pink blob/card e footer pill quando fizer sentido.
   - Pink card/blob pode virar recurso de marca, mas não muleta: usar sombra, profundidade, rotação leve, escala e integração com a foto; evitar blocão chapado repetido.
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
- Tratar o símbolo LA como elemento de composição, não como marca d’água fixa.
- Variar posição, escala, corte, opacidade e versão do SVG conforme a direção do card.
- Pode ser gigante, vazado, colorido/transparente, cortado, saindo pelo topo/lateral/rodapé, atrás de foto, halftone, glow ou forma.
- Pode não aparecer em alguns cards se a composição respirar melhor sem ele.
- Antes de renderizar, definir a função do símbolo card a card. Se o preview mostrar LA sempre no mesmo canto/tamanho, QA reprova.
- O LA deve parecer parte da direção de arte, não carimbo nem repetição mecânica.
- Não confundir: logomarca completa oficial é assinatura de marca e deve aparecer com presença; símbolo solo grande é composição de fundo, não substituto da logo completa.

## Carrossel contínuo / emendado

Para testes avançados, pode criar carrossel com sensação de tela única recortada em cards:

- Planejar uma composição horizontal contínua antes de cortar em cards.
- Elementos grandes podem atravessar bordas entre cards, inclusive o símbolo oficial LA.
- Exemplo: metade do `L` em um card e continuidade do `A` no card seguinte.
- Manter cada card legível individualmente, mas com recompensa visual ao deslizar.
- Usar com intenção; não aplicar em todo carrossel por padrão.

## O que NÃO usar

- `LA` digitado com fonte comum.
- Vários LAs soltos espalhados pela arte sem função compositiva.
- Remover a logomarca completa oficial para tentar fugir de template.
- LA sempre no mesmo lado/tamanho ao longo do carrossel, como se fosse template.
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
- [ ] Logomarca completa oficial presente e legível.
- [ ] Logo/SVG oficial usado, não reconstruído.
- [ ] Watermark usa símbolo oficial, nunca texto `LA`.
- [ ] LA aparece como massa gráfica coerente, com variação real de direção entre os cards.
- [ ] Cores e fontes corretas.
- [ ] Texto legível no mobile.
- [ ] Numeração consistente quando for carrossel.
- [ ] CTA claro.
- [ ] A capa dá vontade de passar pro lado.
- [ ] Imagens não foram repetidas por preguiça; cada foto tem função visual clara.
- [ ] Pink cards/blobs têm profundidade e não parecem blocos chapados repetidos.
- [ ] O preview grid parece campanha, não template.
- [ ] Isso faz o olho brilhar.
- [ ] PNGs finais exportados e revisados.
