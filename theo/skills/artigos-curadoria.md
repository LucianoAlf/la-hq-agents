---
name: artigos-curadoria
description: Skill para escrever artigos educativos e fazer curadoria de notícias do mundo da música (LA Music School) e do autismo/musicoterapia (SonoraMente LA). Use para conteúdo longo, revistas digitais, posts de blog e curadoria semanal.
---

# Artigos e Curadoria

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| marca | string | Nina (direção criativa) ou calendário | Sim |
| tipo | string | Briefing ("artigo_educativo", "curadoria_semanal", "revista_digital", "blog_post") | Sim |
| tema | string | Nina ou Mike (tema do artigo/curadoria) | Sim |
| público_específico | string | Briefing | Não (default: público padrão da marca) |
| fontes_obrigatórias | lista | Nina/Mike (links, pesquisas, referências a usar) | Não |
| tamanho | string | Briefing ("curto" 300-500, "médio" 500-800, "longo" 800-1200 palavras) | Não (default: "médio") |
| deadline | date | Calendário editorial | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| artigo_final | markdown | Nina (revisão) → Diego (diagramação) → Tina (publicação) |
| resumo_curadoria | markdown | Nina (revisão) → newsletter ou redes sociais |
| fontes_usadas[] | lista URLs | Registro interno (credibilidade) |
| meta_seo | objeto | Diego/Tina (título, descrição, keywords para blog/site) |

## Fases de Execução

### Fase 1 — Identificar Tipo de Conteúdo

#### Artigos Educativos — LA Music School
Conteúdo técnico aprofundado para músicos e aspirantes:
- Dicas técnicas detalhadas (palhetada alternada, escalas pentatônicas, progressões de acordes)
- História de instrumentos ou gêneros musicais (a evolução da guitarra elétrica, a história do rock brasileiro)
- Perfil de professores ou alunos da escola
- Guias para iniciantes ("Como escolher sua primeira guitarra", "O que esperar da sua primeira aula")
- Comparativos práticos ("Violão ou guitarra: por onde começar?")
- Listas técnicas ("7 exercícios de aquecimento que todo baterista deve fazer")

**Tom:** Direto, técnico mas acessível, com atitude. Professor compartilhando conhecimento.

**Template de artigo LA Music School:**
```markdown
# [Título impactante — direto ao ponto]

[Abertura com gancho — 2-3 linhas que prendem. Pode ser provocação, 
pergunta ou dado surpreendente.]

## O que é [conceito]

[Explicação clara, técnica mas acessível. 2-3 parágrafos.]

## Como fazer [na prática]

[Passo a passo ou dicas numeradas. Linguagem de professor.]

### Dica 1: [nome da dica]
[Explicação com exemplo prático]

### Dica 2: [nome da dica]
[Explicação com exemplo prático]

### Dica 3: [nome da dica]
[Explicação com exemplo prático]

## Erro comum

[O que a maioria faz errado — tom provocativo mas educativo]

## Conclusão

[Fechamento motivacional. CTA para aula experimental ou contato.]

---
*LA Music School — Pra Quem Sabe o Que Quer!*
```

#### Artigos Educativos — SonoraMente LA
Conteúdo sobre autismo, musicoterapia, desenvolvimento infantil:
- Explicações acessíveis sobre TEA e terapias
- Como a musicoterapia atua no desenvolvimento da linguagem
- Orientação para pais (o que observar, quando buscar ajuda)
- Pesquisas científicas traduzidas para linguagem humana
- Desmistificação de mitos sobre autismo
- Relatos de progresso (com autorização)

**Tom:** Acolhedor e científico. Embasado em evidências mas com linguagem humana e empática.

**Template de artigo SonoraMente:**
```markdown
# [Título empático e informativo]

[Abertura que acolhe — reconhecer a dor/dúvida do pai antes 
de informar. 2-3 linhas.]

## O que sabemos

[Base científica acessível. Citar estudos sem jargão. 
2-3 parágrafos.]

## Como a musicoterapia ajuda

[Explicação prática de como funciona na sessão. 
Usar analogias com música.]

## O que observar no seu filho

[Orientação prática para pais — sinais, comportamentos, 
quando buscar ajuda. Sem alarmismo.]

## A experiência na SonoraMente

[Como funciona o processo na clínica — avaliação, 
sessões, acompanhamento familiar.]

## Para os pais

[Fechamento acolhedor. Você não está sozinho. 
CTA gentil para avaliação.]

---
*SonoraMente LA — onde o som cuida da mente*
```

#### Artigos Educativos — LA Music Kids
Conteúdo sobre musicalização infantil, benefícios para desenvolvimento:
- Benefícios da música no desenvolvimento infantil
- Atividades musicais para fazer em casa
- Como escolher instrumento por faixa etária
- Dúvidas comuns dos pais sobre musicalização

**Tom:** Divertido, confiante, informativo para os pais.

**Template de artigo Kids:**
```markdown
# [Título divertido e informativo]

[Abertura leve — conectar com a realidade dos pais. 2-3 linhas.]

## Por que música?

[Benefícios comprovados — desenvolvimento, coordenação, 
socialização. Tom informativo mas leve.]

## Por faixa etária

### 6 meses a 2 anos
[O que acontece na musicalização nessa idade]

### 3 a 5 anos
[O que acontece na musicalização nessa idade]

### 6 a 12 anos
[Transição para instrumentos]

## Dica para fazer em casa

[Atividade prática que os pais podem fazer com os filhos]

## Quer conhecer?

[CTA convidativo para aula experimental]

---
*LA Music Kids — música não é só pra gente grande*
```

### Fase 2 — Processo de Curadoria

#### Curadoria Semanal — Música (LA Music School)

**Fontes de busca:**
```
Web Search queries:
- "novidades música [semana atual]"
- "lançamento instrumento musical 2026"
- "tecnologia musical educação"
- "festival música Brasil"
- "dicas guitarra bateria violão"
- "educação musical tendências"
```

**Critérios de seleção:**
- Relevância para músicos e estudantes de música
- Novidades do mercado musical brasileiro e internacional
- Tecnologia musical (apps, equipamentos, plugins)
- Eventos e festivais relevantes
- Educação musical e tendências

**Formato da curadoria:**
```markdown
## 🎵 Curadoria Musical da Semana — [DD/MM a DD/MM]

### 1. [Título da notícia]
[Resumo em 2-3 linhas com palavras próprias — NUNCA copiar texto original]
**Nosso comentário:** [1 linha com tom LA Music School — direto, com opinião]
🔗 [Fonte: nome do veículo](url)

### 2. [Título da notícia]
[Resumo + comentário]
🔗 [Fonte](url)

### 3. [Título da notícia]
[Resumo + comentário]
🔗 [Fonte](url)

[... 3 a 5 notícias no total]

---
*Curadoria por Theo | LA Music School*
```

#### Curadoria Semanal — Autismo & Musicoterapia (SonoraMente)

**Fontes de busca:**
```
Web Search queries:
- "autismo pesquisa 2026"
- "musicoterapia estudo recente"
- "TEA desenvolvimento infantil novidade"
- "terapia musical autismo"
- "políticas públicas autismo Brasil"
- "fonoaudiologia infantil novidades"
- "neurociência música cérebro infantil"
```

**Critérios de seleção:**
- Pesquisas científicas sobre TEA e terapias
- Novidades em musicoterapia e abordagens terapêuticas
- Políticas públicas sobre autismo e inclusão
- Eventos e congressos da área
- Histórias inspiradoras (com cuidado — sem romantizar)

**Formato da curadoria:**
```markdown
## 💜 Curadoria SonoraMente — [DD/MM a DD/MM]

### 1. [Título da notícia/pesquisa]
[Resumo em 2-3 linhas com palavras próprias]
**O que isso significa:** [1-2 linhas contextualizando para pais — tom acolhedor]
🔗 [Fonte: nome do veículo/journal](url)

### 2. [Título da notícia/pesquisa]
[Resumo + contextualização]
🔗 [Fonte](url)

### 3. [Título da notícia/pesquisa]
[Resumo + contextualização]
🔗 [Fonte](url)

[... 3 a 5 itens no total]

---
*Curadoria por Theo | SonoraMente LA*
```

### Fase 3 — Revistas Digitais (compilação mensal)

**Revista Música — LA Music School:**
- Compilação mensal: 2-3 artigos educativos + curadoria do mês
- Formato: markdown para Diego diagramar como PDF ou carrossel especial
- Seções: Editorial (Mike) + Artigos + Curadoria + Agenda do mês

**Revista SonoraMente:**
- Compilação mensal: 1-2 artigos + curadoria + relato de progresso
- Formato: markdown para Diego diagramar
- Seções: Carta aos pais + Artigos + Curadoria + Dica para casa

### Fase 4 — Revisão e Entrega

**Checklist de qualidade do artigo:**
1. Embasamento factual verificado (dados, estatísticas, afirmações)
2. Tom da marca consistente do início ao fim
3. Fontes citadas e linkadas
4. Zero erros ortográficos e gramaticais
5. Tamanho dentro do pedido (curto/médio/longo)
6. CTA claro e alinhado com objetivo da peça
7. Títulos e subtítulos informativos e atrativos
8. Parágrafos curtos (3-4 linhas máx — leitura digital)

**Entregar para:**
- Nina → revisão de direção criativa e tom
- Diego → diagramação visual (se para blog/revista)
- Tina → publicação (se para redes sociais direto)

## Veto Conditions — NUNCA
- NUNCA copiar texto de fonte original — sempre resumir em palavras próprias
- NUNCA publicar curadoria sem link da fonte (credibilidade)
- NUNCA escrever artigo sem embasamento factual (sem achismo)
- NUNCA misturar tom entre marcas (artigo SonoraMente não pode soar como LA Music School)
- NUNCA usar linguagem alarmista em conteúdo SonoraMente
- NUNCA usar "cura" em conteúdo SonoraMente — usar "desenvolvimento", "progresso"
- NUNCA falar com crianças em conteúdo Kids (o público é os pais)
- NUNCA publicar sem revisão ortográfica e de tom
- NUNCA inventar dados ou estatísticas — se não tem fonte, não afirma

## Checklist de Conclusão
- [ ] Tipo de conteúdo definido (artigo educativo, curadoria, revista, blog)
- [ ] Marca e tom corretos aplicados do início ao fim
- [ ] Fontes pesquisadas e verificadas (Web Search para curadoria)
- [ ] Conteúdo escrito em palavras próprias (nunca cópia)
- [ ] Links de fonte incluídos (curadoria)
- [ ] Tamanho adequado ao formato solicitado
- [ ] Revisão ortográfica e gramatical feita
- [ ] CTA alinhado com objetivo da peça
- [ ] Entregue para Nina revisar antes de publicar
- [ ] Registrado no Supabase (outputs) com metadados

## Integrações
- **Web Search** — pesquisa de notícias e fontes para curadoria
- **Supabase (outputs)** — registro de artigos e curadorias produzidos
- **Brand Guides (MD)** — referência de tom e público por marca
- **Design Systems** — referência visual para diagramação
- **Calendário editorial** — datas e temas planejados
