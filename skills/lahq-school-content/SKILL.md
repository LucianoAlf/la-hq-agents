---
name: lahq-school-content
description: Produzir carrosséis, posts, stories e peças visuais específicos da LA Music School usando Design System v2, manifesto LA Music, logo oficial, tipografia Prompt pesada, halftone, foto com atitude, copy aspiracional/técnica e QA de campanha. Use quando o usuário pedir conteúdo visual, copy visual ou direção criativa para LA Music School, jovens/adultos 12+, instrumentos, canto, técnica, palco, performance, aula experimental, matrículas ou posts @lamusicschool.
---

# LAHQ School Content

Use esta skill para criar conteúdo da **LA Music School**.  
Princípio central: **School não é template pink; é música real, impacto, técnica, palco e transformação.**

A skill-mãe `lahq-content-pipeline` orquestra o workflow. Esta skill define a linguagem específica da School.

## Fonte da verdade

Repo local:

```bash
/root/.openclaw/workspace/repos/la-hq-agents
```

Antes de produzir, conferir estado do repo:

```bash
git status --short --branch
```

Se precisar atualizar e não houver mudanças locais conflitantes:

```bash
git pull --ff-only origin main
```

Leia conforme necessidade:

- Brand guide: `shared/brand-guides/brand-la-music-school.md`
- DS canônico: `shared/design-systems/LA_MUSIC_SCHOOL_DS_CANONICAL.md`
- DS HTML v2: `shared/design-systems/la-music-school-design-system-v2-abril-2026.html`
- Runbook: `docs/runbooks/LAHQ_SCHOOL_CARROSSEL.md`
- Logos oficiais: `shared/brand-assets/logos/school/`
- Fontes: `shared/brand-assets/fonts/school/`
- Refs ouro: `shared/design-systems/references/la-music-school-v2-gold/`
- DS recebido v2, quando existir: `shared/design-systems/la-music-school-v2/`

Não usar assets antigos quando o canônico v2 contradisser.

## Alma da School

A LA Music School fala com jovens e adultos que querem aprender, evoluir, tocar melhor e se reconhecer na música.

Energia do Manifesto LA Music:

- música não é aula; é transformação;
- Paixão é brilho nos olhos, fogo, sonho aceso;
- Empatia é escuta, ponte, acolhimento real;
- Coragem é riff, risco, palco, fazer diferente;
- Excelência é sagrado, detalhe, entrega sem meio-termo.

Todo conteúdo School deve carregar pelo menos uma dessas forças: **Paixão, Empatia, Coragem ou Excelência** — mesmo quando for técnico.

Evite copy genérica:

- Ruim: “Aprenda violão com professores qualificados.”
- Melhor: “Seu som merece palco.”
- Melhor: “A técnica é só o começo.”
- Melhor: “Toca mais alto.”
- Melhor: “Aqui, música vira identidade.”

## Referência 11/11 — “O que é ser aluno da LA?”

Alf aprovou a V4 manifesto como referência de identidade School.

Arquivos no repo:
- `shared/design-systems/references/la-music-school-v2-gold/ref-v4-manifesto-ser-aluno-la-grid.jpg`
- `shared/design-systems/references/la-music-school-v2-gold/v4-manifesto-ser-aluno-la/`

O que aprender dessa referência:
- manter a alma, não copiar a forma;
- usar fotos reais de alunos quando trouxerem verdade, palco, gesto ou identidade;
- texto em foto fica em área segura, preferencialmente base/lateral, nunca no rosto/expressão;
- copy deve beber no Manifesto: música não é só aula, é transformação; paixão/sonho aceso; empatia/escuta; coragem/palco; excelência sem frieza;
- frases campeãs do padrão: “Aqui música não é só aula”, “A gente não fabrica músico. A gente revela identidade”, “Paixão vira prática vira palco”, “Empatia sem moleza. Excelência sem frieza.”

## Personalidade verbal

A School é:

- direta;
- musical;
- aspiracional;
- jovem/adulta;
- técnica sem ser fria;
- intensa sem virar exagero vazio;
- humana sem clichê de “família”.

Fale como músico, não como empresa.

### Evitar

- tom infantil;
- formalidade corporativa;
- promessa irreal (“toque em 30 dias”);
- clichês (“venha fazer parte da família”);
- texto longo dentro do card;
- legenda visual que só descreve o óbvio.

## Tokens oficiais

- Pink Primary: `#E91451` — marca, CTA, pills, palavra-chave.
- Dark LA: `#373435` — logo/texto em fundo claro.
- Pink Shade: `#B01545` — halftone, gradiente.
- Pink Deep: `#740A28` — sombra, marca d’água, profundidade.
- Pink Light: `#F06292` — detalhe suave.
- Black: `#0A0A0A` — fundo dark principal.
- Black Soft: `#141414` — cards, sombras, camadas.
- Gray Light: `#E8E8E8` — fundo claro canônico. Nunca cream/bege.
- Gray Mid: `#9E9E9E` — texto auxiliar.
- White: `#FFFFFF` — texto e outline.
- Fonte única: `Prompt`.

School trabalha com **pink + dark + cinzas**. Não puxar roxo SonoraMente, multicolor Kids, azul, amarelo ou cream.

## Sistema de logo

Regra do Alf: **a logomarca principal completa deve ficar no topo centralizado em todos os cards**.

- Usar sempre SVG/logo oficial.
- Nunca reconstruir `LA Music School` com fonte/texto.
- Fundo escuro/foto/pink: usar versão branca/dark oficial conforme contraste.
- Fundo claro: usar versão light/dark-gray oficial.
- O símbolo solo `LA` pode ser usado como composição, mas nunca substitui a logomarca completa.
- Marca d’água `LA` deve vir de asset oficial solo/vazado sempre que possível; nunca digitar `LA` como solução final quando houver SVG.

## Sistema tipográfico

A tipografia da School é direção de arte, não decoração.

Antes de desenhar cada card, defina a arquitetura tipográfica:

1. Hero gigante.
2. Palavra-chave pink.
3. Sólido + outline.
4. Quebra silábica/ritmada.
5. Número dominante.
6. Texto vazando/cortando.
7. Tipografia atrás/ao redor da foto.
8. Container pink, se necessário.

### Regras tipográficas

- Usar `Prompt` como família única.
- Preferir `Prompt Black 900` em títulos.
- Misturar caixa natural e UPPERCASE quando der ritmo.
- Usar leading apertado em display: `0.90–0.95`.
- Usar títulos como bloco gráfico.
- Combinar sólido + outline no mesmo título.
- Permitir quebra silábica quando der impacto: `TÉC / NI / CA`, `MA / TRÍ / CU / LAS`.
- Usar número grande quando o conteúdo for lista/técnica: `3`, `5`, `01`.
- Texto pequeno precisa ser mínimo e legível no celular.

A pergunta de QA tipográfico: **o texto parece imagem de campanha ou só texto jogado em cima?**

## Vocabulário visual

Use o sistema inteiro, não só card pink.

### 1. Halftone orgânico

- Pontos em degradê, mais densos nas bordas.
- Nunca grid uniforme morto.
- Pode ficar sobre foto, fundo dark ou pink.
- Em cards com pessoa/foto em destaque, halftone/pontinhos é o recurso preferencial para dar linguagem School sem poluir rosto/corpo.
- Os pontinhos devem aparecer como textura de borda, lateral, canto ou fundo; nunca cobrir demais rosto, boca, microfone ou expressão.

### 2. Marca d’água LA

- Símbolo solo/outline gigante.
- Pode sangrar borda.
- Variar posição, escala, opacidade e corte.
- Deve parecer composição, não carimbo.
- **Regra dura:** em card com pessoa/foto em destaque, não colocar LA gigante por cima de rosto, corpo, braço, mão, pescoço, microfone ou silhueta principal.
- Se não houver máscara/recorte para colocar o LA realmente atrás da pessoa, não usar LA ali. Trocar por halftone/pontinhos, glow, chevrons, padrão de `+`, textura ou gradiente.
- LA sobre pessoa só é aceitável se estiver claramente em área negativa/fundo, sem tocar a figura principal.

### 3. Texto sólido + outline

- Assinatura visual da School.
- Use para contraste e hierarquia.

### 4. Container pink

- Funciona bem, mas não pode aparecer em todos os cards.
- Usar como destaque local.
- Pode ter rotação leve, sombra preta deslocada e profundidade.
- Se todo card depender dele, reprovar.

### 5. Chevrons `»»»`

- Detalhe de movimento.
- Bom para canto inferior, direção, energia.

### 6. Padrão de `+`

- Textura secundária.
- Usar quando halftone não precisa dominar.

### 7. Pill de contato

- CTA inline: WhatsApp, telefone, Instagram.
- Usar em cards de conversão.

### 8. Footer pill + listras

- Fechamento recorrente da School.
- Pill com `@lamusicschool`, centralizado no rodapé, com listras diagonais abaixo quando couber.

### 9. Foto com atitude

- Foto deve vender música real: palco, instrumento, microfone, corpo, mão, professor/aluno, estúdio, performance.
- Full-bleed quando precisa impacto.
- Tratamento com contraste, vignette, luz pink/dark e textura.
- Em foto com pessoa em destaque, preferir halftone/pontinhos, glow, textura, chevrons ou padrão de `+` no entorno da figura principal em vez de LA gigante.
- Não usar foto corporativa/fria ou stock genérico.

## Temas visuais

Escolha tema por função do card:

- **Dark Mode** — foto, palco, instrumento, atmosfera, técnica intensa.
- **Pink Gradient** — capa, matrícula, convite, impacto heroico.
- **Light Mode** — explicação educativa, respiro, conteúdo técnico mais limpo. Fundo `#E8E8E8`, nunca bege.
- **Pink Solid** — CTA final, chamada direta, fechamento.

Sequência típica para carrossel:

1. Capa: Dark ou Pink Gradient com foto/typography forte.
2. Desenvolvimento: alternar Dark/Light/Pink conforme ritmo.
3. Card técnico: Light ou Dark com hierarquia clara.
4. CTA: Pink Solid ou Dark com pill forte.

Não repetir o mesmo tema/componente sem intenção.

## Composição por card

Para cada lâmina, decidir antes de renderizar:

- objetivo do card;
- emoção principal: Paixão, Empatia, Coragem ou Excelência;
- tema visual;
- arquitetura tipográfica;
- uso de foto;
- elemento dominante do DS;
- posição do símbolo/marca d’água;
- CTA ou progressão narrativa.

### Capa

Precisa dar vontade de arrastar.

- Foto hero ou tipografia brutal.
- Gancho curto.
- Logo topo centralizado.
- Energia de campanha, não arte institucional genérica.

### Cards intermediários

- Cada card deve ter uma função própria.
- Variar composição sem perder marca.
- Técnica precisa ser clara, mas com desejo.

### Card final

- CTA direto.
- Pink Solid ou Dark de alto contraste.
- Footer/handle claro.
- Convite com energia: “vem tocar”, “experimenta”, “sobe no palco”, “toca com a gente”.

## Workflow LAHQ aplicado

1. **Nina / direção** — conceito, narrativa, ritmo, emoção e direção visual por card.
2. **Theo / copy** — gancho curto, frase musical, CTA humano e direto.
3. **Luna / imagem** — foto/visual sem texto, sem logo fake, sem watermark indevido.
4. **Diego / montagem** — composição 1080x1440 ou formato pedido, usando DS, logo e assets oficiais.
5. **Tina + Nina-approve / QA** — comparar com refs ouro e reprovar se parecer template.

## QA School obrigatório

Antes de entregar, olhar o grid inteiro.

Perguntas duras:

- Parece LA Music School ou post genérico de escola de música?
- A logomarca completa está no topo centralizado em todos os cards?
- O símbolo `LA` de fundo virou carimbo repetido?
- Existe LA gigante por cima de pessoa, rosto, corpo ou microfone? Se sim, reprovar.
- Cards com pessoa/foto têm halftone/pontinhos/textura suficiente para parecer School sem colar logo na pessoa?
- O card pink virou muleta?
- A tipografia está fazendo direção de arte ou só preenchendo espaço?
- Tem sólido + outline, hierarquia e ritmo tipográfico?
- A capa dá vontade de passar pro lado?
- Tem música real, palco, instrumento, corpo ou atitude?
- O conteúdo carrega Paixão, Empatia, Coragem ou Excelência?
- O texto é legível no celular?
- Parece campanha premium ou template de Canva?
- Isso faz o olho brilhar?

Se qualquer resposta importante for “não”, revise antes de entregar.

## Entrega

Salvar outputs em:

```bash
/root/.openclaw/workspace/outputs/<slug-do-projeto>/
```

Para carrossel, entregar:

- PNGs individuais;
- preview grid;
- pacote `.tar.gz`;
- nota curta explicando conceito, elementos usados e QA.

## Regra-mãe

**LA Music School fala como quem acredita que música muda vida — com energia de palco, precisão técnica, coração aceso e acabamento de campanha.**

Suba no palco e arrase.
