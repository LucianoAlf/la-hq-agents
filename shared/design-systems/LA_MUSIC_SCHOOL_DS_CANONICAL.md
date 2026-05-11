# LA Music School — Design System canônico

**Versão correta:** v2 · Abril 2026  
**Arquivo fonte:** `shared/design-systems/la-music-school-design-system-v2-abril-2026.html`

## Correção importante
O arquivo antigo `shared/design-systems/la-music-design-system.html` está desatualizado e não deve ser usado como referência principal para novas peças da LA Music School.

## Tokens principais v2
- Pink Primary: `#E91451`
- Pink Shade/Dark: `#B01545`
- Pink Deep: `#740A28`
- Dark LA: `#373435`
- Black: `#0A0A0A`
- White: `#FFFFFF`
- Gray Light: `#E8E8E8`
- Gray Mid: `#9E9E9E`
- Fonte display: `Prompt`
- Fonte corpo: `Prompt`

## Mudanças em relação ao antigo
- Sai `Bebas Neue + Montserrat` como padrão canônico.
- Entra `Prompt` como família única para display e corpo.
- Pink principal muda de `#E91E63` para `#E91451`.
- Dark LA oficial inclui `#373435`.
- O DS v2 fala em “4 temas alternando impacto” e “anatomia real de um post”.

## Regra operacional
Para qualquer carrossel/post/story da LA Music School, carregar este arquivo canônico antes de renderizar.

## Observações do render Netlify
**URL renderizada:** https://design-system-la-music.netlify.app

### Regras visuais capturadas do render
- Logo LA Music School aparece no topo da peça, não no rodapé.
- Footer padrão é **pill centralizado com @lamusicschool + listras diagonais abaixo**.
- Halftone é orgânico/degradê, não grid uniforme rígido.
- Títulos combinam sólido + outline usando Prompt Black 900.
- Pode misturar caixa natural e uppercase no mesmo título.
- Temas: Dark, Pink Gradient, Light `#E8E8E8`, Pink Solid.
- Sequência recomendada em carrossel: Dark/Pink impactante → Light/Dark alternado → Pink Solid CTA.
- Light correto é cinza claro `#E8E8E8`, não cream/bege.
- A antiga faixa diagonal pink não é assinatura principal v2; no v2 entram halftone, marca d’água LA outline, container pink, chevrons, padrão de +, pill de contato, footer pill + listras.

## Referências reais do feed — imagens enviadas por Alf em 2026-05-10

### Regras extraídas das 10 peças reais
- Formato observado: principalmente feed quadrado 1:1; adaptar para 4:5 mantendo mesma gramática.
- Composição com foto/personagem/instrumento no topo ou centro e headline grande no meio/parte inferior.
- Magenta/rosa vibrante domina; vinho/roxo escuro, preto/grafite e branco sustentam contraste.
- Fundo frequentemente usa halftone/pontos, formas abstratas grandes e textura de movimento.
- Em fotos: tratamento dramático, palco, contraste alto, luz magenta/vermelha, energia jovem/rock.
- Títulos enormes com Prompt/geométrica pesada; mistura de sólido + outline é recorrente.
- Logo LA Music School branco, geralmente no topo, com respiro e contraste.
- Footer/aba inferior recorrente: pill arredondado com Instagram + `@lamusicschool`, muitas vezes ancorado na borda inferior e com barras/listras diagonais.
- Tarjas/containers magenta arredondados podem ser inclinados e ter sombra/preto deslocado para profundidade.
- CTAs comuns: “Leia a legenda”, “Garanta já a sua vaga!”, WhatsApp, Instagram.
- Grafismos aceitos: halftone, setas/chevrons, cruzes, notas musicais, barras diagonais, formas abstratas derivadas do logo.

### O que evitar segundo as peças reais
- Não usar minimalismo branco/pastel.
- Não usar título fino.
- Não remover textura/halftone em posts institucionais.
- Não usar logo colorido; preferir branco.
- Não usar foto corporativa/fria; precisa música, palco, instrumento, atitude.
- Não escrever blocos longos demais dentro do card.

## Referência ouro — qualidade esperada
**Arquivos:**
- `shared/design-systems/references/la-music-school-v2-gold/ref-01.jpg`
- `shared/design-systems/references/la-music-school-v2-gold/ref-02.jpg`
- `shared/design-systems/references/la-music-school-v2-gold/ref-03.jpg`

### Meta visual
Estas peças são o benchmark de qualidade para novos outputs LA Music School. Qualquer carrossel/post gerado pelo Alfredo deve mirar esse nível de acabamento: composição cheia de energia, tipografia Prompt pesada, contraste alto, textura/halftone, foto ou grafismo com presença, logo/branding claro e cara de campanha real — não “arte IA genérica”.

## Referência ouro adicional — posts reais enviados por Alf
**Arquivos adicionados:** `ref-04.jpg` a `ref-07.jpg` em `shared/design-systems/references/la-music-school-v2-gold/`.

### Uso operacional
Antes de gerar uma peça LA Music School, comparar mentalmente com essas referências ouro. Se o output parecer limpo demais, genérico demais, ou com estética de IA/stock, reprovar e refazer.

## Pacote oficial recebido — DS embedado + logos oficiais
**Recebido de Alf em 2026-05-10**

### Arquivos canônicos locais
- DS HTML com fonte Prompt embedada: `shared/design-systems/la-music-school-v2/la-music-design-system-v2-embedded.html`
- Logos oficiais: `shared/design-systems/la-music-school-v2/assets/logos/`
- Referências oficiais: `shared/design-systems/la-music-school-v2/references/feed-school-05.png`, `feed-school-07.png`, `feed-school-12.png`

### Regra crítica
Não usar mais logo fake em texto/box (`LA / MUSIC SCHOOL`). Todo output LA Music School deve usar SVG oficial:
- Fundo escuro/foto: preferir `logo-la-music-dark-completa.svg` ou `logo-la-music-dark-completa-vazada.svg` conforme contraste.
- Fundo claro: usar `logo-la-music-light-completa.svg`.
- Marca d’água/símbolo: usar versões `solo`/`solo-vazada`.

### Benchmark das 3 artes oficiais
- Logo oficial branco no topo, com respiro e contraste.
- Título grande, caixa alta, Prompt/geométrica pesada, alternando sólido branco e outline branco.
- Foto/fundo musical com alto contraste e overlay escuro; palco, instrumento, cantor ou estúdio.
- Halftone magenta/preto como camada gráfica, opacidade baixa/média.
- Footer fixo: cápsula magenta com ícone Instagram + `@lamusicschool`, centralizado na base.
- Magenta deve aparecer como destaque, textura, faixa ou footer — não como excesso decorativo sem função.
- Texto pequeno deve ser mínimo; leitura mobile manda.
