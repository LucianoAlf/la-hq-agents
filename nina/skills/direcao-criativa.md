---
name: direcao-criativa
description: Skill para definir a direção criativa de cada conteúdo — tema, conceito visual, tom, referências e estilo. Use sempre que Nina precisa definir o "norte criativo" de uma peça antes do time começar a executar. É o primeiro passo de qualquer produção de conteúdo.
---

# Direção Criativa

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| briefing | objeto | Mike (via humano) ou calendário editorial | Sim |
| marca | string | Briefing ou calendário ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| tipo_conteúdo | string | Briefing ("carrossel", "story", "reel", "newsletter", "post") | Sim |
| objetivo | string | Briefing ("educar", "engajar", "converter", "informar", "conscientizar") | Sim |
| público_específico | string | Briefing (quando diferente do público padrão da marca) | Não |
| referências_visuais | lista | Humano ou Media Library | Não |
| data_entrega | date | Calendário editorial | Não |
| campanha_id | UUID | Atlas (se vinculado a campanha paga) | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| direção_criativa | documento | Luna (design), Diego (diagramação), Carla (vídeo), Theo (copy) |
| assets_referência | lista de IDs | Media Library → referências selecionadas |
| design_system_aplicável | string | Referência ao DS da marca |
| task_assignments | lista | Supabase → tasks para cada agente envolvido |
| briefing_expandido | texto | Supabase → outputs (registro do briefing completo) |

## Fases de Execução

### Fase 1 — Analisar o Briefing

**Origem do briefing:**
- **Humano (via Mike):** Briefing vem com contexto real — recital, campanha, novidade da escola
- **Calendário editorial:** Nina puxa o próximo slot e cria direção proativamente
- **Oportunidade identificada:** Trend, data comemorativa, conteúdo de concorrente que inspira
- **Campanha do Atlas:** Criativo orgânico que precisa alinhar com campanha paga

**Perguntas-chave:**
1. De onde veio? (humano, calendário, oportunidade identificada, campanha)
2. Para qual marca? (define TODO o universo visual e textual)
3. Qual o objetivo? (educar, engajar, converter, informar, conscientizar)
4. Qual o público? (aluno atual, lead, pai, comunidade, profissional de saúde)
5. Há restrição de prazo? (data comemorativa, evento, campanha)
6. Há assets existentes que devem ser usados? (fotos de evento, vídeo de aula)

### Fase 2 — Definir Conceito Criativo

Para cada peça, definir os 4 pilares do conceito:

**Tema central:** Qual a mensagem principal?
- Exemplos: "palhetada alternada", "como a música ajuda no TEA", "musicalização a partir de 6 meses"
- Regra: UMA mensagem por peça — nunca misturar temas

**Ângulo:** Como abordar o tema?
- Técnico: tutorial, passo a passo, dica prática
- Emocional: depoimento, história, transformação
- Prático: checklist, comparação, antes/depois
- Inspiracional: motivação, frase de impacto, provocação
- Educativo/Científico: dados, pesquisas, explicação acessível

**Gancho:** O que faz a pessoa parar de scrollar?
- Curiosidade: "Você sabia que..."
- Dor: "O erro que todo guitarrista comete"
- Promessa: "5 exercícios pra destravar sua mão esquerda"
- Provocação: "Se você não sabe isso, está tocando errado"
- Emoção: "O dia em que meu filho falou a primeira palavra na sessão"

**CTA (Call to Action):** Qual ação esperada?
- Salvar (conteúdo educativo de referência)
- Comentar (provocação, pergunta, enquete)
- Compartilhar (conteúdo emocional, conscientização)
- Clicar no link (matrícula, formulário, newsletter)
- Mandar DM (conversa, dúvida, agendamento)

### Fase 3 — Aplicar Design System por Marca

Nina DEVE carregar e seguir o Design System da marca. Abaixo o resumo operacional que guia a direção criativa:

---

#### 🎸 LA Music School — "Pra Quem Sabe o Que Quer!"

**Paleta:**
| Token | Cor | Uso |
|-------|-----|-----|
| Primary | #E91E63 (Pink) | Títulos, CTAs, destaque principal |
| Secondary | #1A1A2E (Dark Navy) | Fundo, textos pesados |
| Accent | #FFD600 (Amarelo) | Destaques, badges, alertas |
| Background | #0D0D1A (Quase preto) | Fundo padrão |
| Text | #FFFFFF | Texto sobre fundo escuro |

**Tipografia:**
- Títulos: **Bebas Neue** (uppercase, impacto)
- Corpo: **Inter** (legibilidade)

**Elementos visuais:**
- Diagonal stripes (listras diagonais como assinatura)
- Texturas grunge e rock
- Contraste alto — visual que "grita" no feed
- Ícones com estilo bold/filled

**Tom na direção criativa:**
- Direto, enérgico, com atitude
- "Professor de guitarra que toca numa banda nos fins de semana"
- Linguagem de igual pra igual — músico falando com músico
- Sem rodeio, sem corporativês, sem frescura
- Pode ser provocativo ("Se você não sabe isso, está tocando errado")

**Público-alvo para segmentação:**
- Jovens e adultos (15-50 anos) que querem aprender ou evoluir
- Guitarristas, violonistas, bateristas, tecladistas, cantores
- Comunicação direto com o aluno (não com responsável)

**Exemplos de temas:**
- "5 acordes que todo guitarrista precisa dominar"
- "Bastidores: como é uma aula de bateria na LA"
- "Do zero ao palco: a jornada do aluno [nome]"
- "O que ninguém te conta sobre estudar música"

---

#### 🧠 SonoraMente LA — "onde o som cuida da mente"

**Paleta:**
| Token | Cor | Uso |
|-------|-----|-----|
| Primary | #3D1A6E (Roxo profundo) | Fundos, identidade principal |
| Secondary | #7C4DFF (Lilás vibrante) | CTAs, destaques |
| Accent | #E0B0FF (Malva suave) | Badges, detalhes delicados |
| Warm | #F4A261 (Âmbar acolhedor) | Acentos emocionais |
| Background | #F8F5FF (Off-white lavanda) | Fundo claro |
| Text Dark | #2D1B4E | Texto principal |

**Tipografia:**
- Títulos: **Playfair Display** (elegante, serifa, confiável)
- Corpo: **Source Sans Pro** (limpa, acessível)

**Elementos visuais:**
- Ondas sonoras estilizadas (assinatura visual)
- Gradientes suaves (roxo → lilás → malva)
- Formas orgânicas, cantos arredondados
- Ícones com estilo line/outline, traço fino
- Fotografias com warmth, luz natural

**Tom na direção criativa:**
- Acolhedor, científico, humano
- "Musicoterapeuta com doutorado que chora junto com a mãe"
- Embasada em evidências, nunca em achismo
- Nunca julga, nunca apavora, nunca promete milagre
- Sensível à dor e à esperança dos pais

**Público-alvo para segmentação:**
- Pais de crianças de 0-12 anos com TEA ou atrasos de desenvolvimento
- Profissionais de saúde (fonos, psicólogos, pediatras)
- Educadores que trabalham com inclusão
- Comunicação é para os PAIS — nunca diretamente com a criança

**Exemplos de temas:**
- "O que a musicoterapia pode fazer pelo TEA"
- "Como a música estimula a fala: o que a ciência diz"
- "Relato de progresso: 6 meses de sessões"
- "5 sinais de que seu filho pode se beneficiar da musicoterapia"

**Cuidados especiais:**
- Nunca usar "cura" — usar "desenvolvimento", "progresso", "estímulo"
- Nunca infantilizar pais — são adultos informados e angustiados
- Sempre citar embasamento quando fizer afirmação clínica
- Representatividade: crianças diversas nas imagens

---

#### 🎨 LA Music Kids — "música não é só pra gente grande"

**Paleta:**
| Token | Cor | Uso |
|-------|-----|-----|
| Primary | #FF6B35 (Laranja catavento) | Energia principal |
| Secondary | #4ECDC4 (Turquesa) | Frescor, equilíbrio |
| Accent 1 | #FFE66D (Amarelo sol) | Alegria, destaque |
| Accent 2 | #FF6B9D (Rosa catavento) | Diversão, lúdico |
| Background | #FFF8F0 (Off-white quente) | Fundo claro |
| Text Dark | #2D3436 | Texto principal |

**Tipografia:**
- Títulos: **Baloo 2** (arredondada, amigável, divertida)
- Corpo: **Nunito** (limpa, suave)

**Elementos visuais:**
- Catavento estilizado (pás em formato de palheta — símbolo da marca)
- 4 cores do catavento em rotação
- Formas arredondadas, cantos suaves
- Ícones coloridos, estilo ilustração infantil mas profissional
- Padrão de notas musicais estilizadas como elemento de fundo

**Tom na direção criativa:**
- Divertido, confiante, lúdico sem infantilizar
- "Professora de musicalização com ukulele colorido e formação séria"
- Comunicação é para ADULTOS (pais) — não para crianças
- Leve mas inteligente, profissional e acessível
- Diversão e aprendizado não são opostos — são a mesma coisa

**Público-alvo para segmentação:**
- Pais de crianças de 6 meses a 12 anos
- Faixas: 6m-2 anos, 3-5 anos, 6-8 anos, 9-12 anos
- Pais que valorizam educação criativa e desenvolvimento
- Comunicação é para ADULTOS — decisão de matrícula é dos pais

**Exemplos de temas:**
- "Seu bebê pode começar música com 6 meses — sabia?"
- "Como a musicalização desenvolve o cérebro do seu filho"
- "Dia de aula na LA Music Kids: olha a energia!"
- "5 instrumentos perfeitos pra crianças de 3 a 5 anos"

**Cuidados especiais:**
- Nunca falar diretamente com a criança no conteúdo
- Nunca infantilizar os PAIS — eles são o público real
- Mostrar diversão mas deixar claro o valor educacional
- Diferenciar claramente das aulas da LA Music School (faixa etária)

---

### Fase 4 — Definir Referências Visuais

1. **Buscar na Media Library** assets existentes que se encaixam no conceito
```sql
-- Buscar assets por marca e tags relevantes
SELECT id, filename, url, tags, type, brand
FROM media_assets
WHERE office_id = $1
  AND brand = $2
  AND (tags @> ARRAY[$tag1, $tag2]
       OR description ILIKE '%' || $termo || '%')
ORDER BY created_at DESC
LIMIT 20;
```

2. **Definir estilo de imagem necessário:**
   - Foto real (de evento, aula, bastidores) → Media Library ou solicitação ao humano
   - Ilustração → Luna gera via Pixa/Gemini
   - Geração IA → Luna gera com prompt detalhado
   - Composição mista → Luna + Diego

3. **Referências de composição:**
   - Layout: horizontal, vertical, grid, split
   - Proporção: 1:1 (feed), 4:5 (feed otimizado), 9:16 (stories/reels)
   - Hierarquia: título → subtítulo → imagem → CTA
   - Espaço negativo: respiro visual adequado ao DS da marca

### Fase 5 — Documentar a Direção Criativa

Output formal que vai para o time executar:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DIREÇÃO CRIATIVA — [ID da task]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 MARCA: [LA Music School / LA Music Kids / SonoraMente LA]
📄 TIPO: [carrossel / story / reel / newsletter / post]
🎯 OBJETIVO: [educar / engajar / converter / informar / conscientizar]
👥 PÚBLICO: [descrição do público-alvo]

💡 CONCEITO
• Tema: [mensagem principal]
• Ângulo: [abordagem — técnico/emocional/prático/inspiracional/educativo]
• Gancho: [frase ou conceito que prende atenção]
• CTA: [ação esperada do público]

🎨 VISUAL
• Design System: [referência ao DS da marca]
• Estilo de imagem: [foto real / ilustração / IA / misto]
• Layout: [formato, proporção, grid]
• Assets referência: [IDs da Media Library, se houver]
• Paleta destaque: [cores principais para esta peça]

✍️ TOM
• [3-4 adjetivos do tom de voz para esta peça específica]
• Exemplo de headline: [sugestão de título/gancho]

📅 PRAZO
• Data de entrega: [DD/MM/AAAA]
• Campanha vinculada: [se houver]

📋 DISTRIBUIÇÃO
• Luna → [o que precisa fazer]
• Diego → [o que precisa fazer]
• Carla → [o que precisa fazer, se vídeo]
• Theo → [copy, legenda, texto]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Fase 6 — Verificar Histórico e Evitar Repetição

Antes de finalizar a direção, consultar o que já foi feito:
```sql
-- Últimas peças da marca com tema similar
SELECT title, type, theme, created_at, engagement_rate
FROM outputs
WHERE office_id = $1
  AND brand = $2
  AND (theme ILIKE '%' || $tema || '%' 
       OR title ILIKE '%' || $tema || '%')
ORDER BY created_at DESC
LIMIT 10;

-- Temas mais frequentes no último mês (evitar saturação)
SELECT theme, COUNT(*) as vezes, 
       AVG(engagement_rate) as engajamento_medio
FROM outputs
WHERE office_id = $1
  AND brand = $2
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY theme
ORDER BY vezes DESC;
```

Se tema similar foi publicado nas últimas 2 semanas, Nina deve:
- Mudar o ângulo (mesmo tema, abordagem diferente)
- OU escolher outro tema
- OU justificar por que repetir (ex: campanha de matrícula com múltiplos criativos)

## Veto Conditions — NUNCA
- NUNCA iniciar execução (design, copy, vídeo) sem direção criativa documentada
- NUNCA misturar Design Systems de marcas diferentes na mesma peça
- NUNCA misturar mais de um tema central por peça
- NUNCA pular a consulta ao Design System — ele é lei, não sugestão
- NUNCA usar tom de voz de uma marca em conteúdo de outra (ex: tom provocativo da School num post do SonoraMente)
- NUNCA usar "cura" em conteúdo do SonoraMente — usar "desenvolvimento", "progresso", "estímulo"
- NUNCA falar diretamente com crianças no conteúdo da Kids ou SonoraMente — o público é os pais
- NUNCA aprovar direção sem verificar se tema similar foi publicado recentemente
- NUNCA ignorar briefing do humano — se for vago, Nina completa com autonomia e justifica
- NUNCA criar direção sem CTA definido — toda peça precisa de uma ação esperada

## Checklist de Conclusão
- [ ] Briefing analisado e compreendido (origem, marca, objetivo, público)
- [ ] Conceito criativo definido (tema, ângulo, gancho, CTA)
- [ ] Design System da marca consultado e aplicado
- [ ] Referências visuais buscadas na Media Library
- [ ] Estilo de imagem definido (foto/ilustração/IA/misto)
- [ ] Histórico verificado (tema não repetido nas últimas 2 semanas)
- [ ] Direção criativa documentada no formato padrão
- [ ] Tasks distribuídas para os agentes executores (Luna, Diego, Carla, Theo)
- [ ] Prazo definido e alinhado com calendário editorial
- [ ] Se campanha: alinhado com Atlas sobre criativo pago

## Integrações
- **Supabase (tasks)** — criar e distribuir tasks para o time
- **Supabase (outputs)** — consultar histórico de peças produzidas
- **Supabase (calendar_entries)** — verificar prazos e slots do calendário
- **Supabase (media_assets)** — buscar referências visuais existentes
- **Design Systems (HTML/MD)** — regras visuais obrigatórias por marca
- **Brand Guides (MD)** — tom de voz, público, personalidade por marca
