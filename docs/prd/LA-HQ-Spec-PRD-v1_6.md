# LA HQ — Quartel General Digital da LA Music
## Spec & PRD v1.6 — Abril 2026

---

## 1. VISÃO GERAL

### O que é
Um prédio corporativo virtual composto por escritórios de agentes de IA que operam de forma autônoma, alinhados com a cultura, propósito e valores da LA Music. Cada andar abriga um departamento (squad) com agentes especializados que produzem, executam e otimizam operações da empresa.

### Propósito
Criar uma infraestrutura de inteligência operacional onde agentes de IA e humanos trabalham juntos, com memória compartilhada, rituais culturais e autonomia operacional.

### MVP
Escritório de Marketing — time completo de agentes que produz conteúdo, publica, analisa resultados e otimiza tráfego pago de forma autônoma.

### Marcas atendidas (MVP)
- LA Music School
- LA Music Kids
- SonoraMente LA

### Visão de expansão
Multi-tenant preparado para Maestros da Gestão e rede de mentorados.

---

## 2. CONCEITO E IDENTIDADE VISUAL

### O Prédio
- Localização fictícia: Avenida Paulista, São Paulo
- Visual: prédio espelhado, pretão, moderno, com a marca LA Music no topo
- Renderização: Three.js (3D) ou isométrico em React (estilo SimCity)
- Entrada: lobby com recepcionista digital, elevador para os andares

### Cada Andar
- Identidade visual do departamento (cores e frase da parede)
- Mesas de trabalho com notebooks para cada agente
- Crachás com nome, cargo e foto do agente
- Agentes animados andando pelo escritório
- Sala de reunião com mesa para humanos + agentes

### Design System
- Herda do design system do grupo LA Music (Pink **#E91451** como cor principal do grupo — valor oficial extraído dos logos SVG)
- Tipografia do dashboard LA HQ a definir (não usa Bebas Neue / Montserrat — obsoletos em 2026)
- Dark mode first, desktop first, responsivo
- Detalhes específicos de cada andar/departamento a definir

---

## 3. ARQUITETURA TÉCNICA

### Stack
| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + TypeScript |
| Banco de dados | Supabase (PostgreSQL + pgvector) |
| Storage | Supabase Storage |
| Autenticação | Supabase Auth |
| Renderização de imagens | Puppeteer (na VPS) |
| Renderização de vídeos | Remotion (na VPS) |
| Ambiente visual 3D | Three.js ou React isométrico |
| Processamento pesado | VPS Hostinger (89.116.73.186, Ubuntu 24.04) |

### Modelos de IA e Distribuição de Carga
| Modelo | Provedor | Autenticação | Papel |
|--------|----------|-------------|-------|
| Opus 4.6 | Anthropic | Assinatura via Claude Code na VPS | Orquestração, copy premium, diagramação, trabalho pesado |
| Sonnet 4.6 | Anthropic | Assinatura via Claude Code na VPS | Tarefas leves, rascunhos, processamento rápido |
| GPT-5.4 | OpenAI | Assinatura de $100 | Agente de raciocínio, divide trabalho com Claude |
| GPT-image | OpenAI | Assinatura de $100 | Geração e edição de imagens |
| Imagen 3 | Google (Gemini) | API key (Google AI Studio) | Geração de imagens em volume, custo baixo |
| Imagen 4 | Google (Gemini) | API key (Google AI Studio) | Fotorealismo |

**Princípio de distribuição:** balancear carga entre assinaturas para nenhuma estourar. Interface permite escolha manual de modelo por tarefa para experimentação.

### Diagrama de Infraestrutura
```
VPS Hostinger (89.116.73.186)
│
├── Claude Code (OAuth assinatura Pro/Max)
│   ├── Opus 4.6 → orquestração, copy, diagramação
│   └── Sonnet 4.6 → tarefas leves
│
├── OpenAI (assinatura $100)
│   ├── GPT-5.4 → raciocínio, planejamento
│   └── GPT-image → geração de imagens
│
├── Gemini API (key gratuita/barata)
│   ├── Imagen 3 → imagens em volume, custo baixo
│   └── Imagen 4 → fotorealismo
│
├── Puppeteer → renderização de slides em PNG
├── Remotion → renderização de vídeos
│
└── Dashboard (React + Supabase)
    ├── Ambiente visual gamificado (prédio)
    ├── Módulos funcionais (carrossel, stories, etc.)
    ├── Calendário editorial
    ├── Dashboard de KPIs
    └── Gestão de tráfego pago
```

---

## 4. ARQUITETURA DE MEMÓRIA

Modelo híbrido inspirado na abordagem do Kayan França (comunidade OpenClaw).

### Camada 1 — Arquivos .md (identidade local)
Cada agente tem seu próprio diretório com:
- Identidade e personalidade (SOUL.md)
- Contexto do usuário/marca que atende
- Decisões tomadas e justificativas
- Lições aprendidas
- Notas de sessão

**Por quê:** Se clonar outro escritório (ex: Maestros da Gestão), cada instância mantém sua própria identidade, tom e contexto local sem depender do banco.

### Camada 2 — Supabase + pgvector (memória semântica)
- Contexto, sessões, projetos e aprendizados pesquisáveis por significado
- Busca semântica: "qual carrossel sobre guitarra performou melhor nos últimos 3 meses?"
- Embeddings gerados por modelo e armazenados no pgvector

### Camada 3 — Estado operacional vivo
- Saúde da operação em tempo real
- Métricas atuais
- Filas de trabalho pendente
- Status de cada agente (disponível, trabalhando, em reunião)
- Prioridades do dia

### Camada 4 — Camada estratégica
- Consolidação periódica (noturna ou semanal)
- Captura sinais reais dos resultados (engajamento, tráfego, conversões)
- Destila padrões: "stories com fundo rosa performam 2x melhor"
- Organiza insights e devolve prioridades acionáveis para o próximo ciclo
- Source of truth para relatórios e dashboards

### Camada 5 — Memória compartilhada entre escritórios
- Acessível por todos os andares/departamentos
- Permissões por squad
- Comunicação inter-departamental
- Dados corporativos (metas, OKRs, calendário geral)
- Quando o Marketing sabe que o Comercial tem campanha de matrícula, ajusta o conteúdo

---

## 5. AGENTES DO ESCRITÓRIO DE MARKETING (MVP)

### Hierarquia
```
Mike (Gerente do Departamento)
└── Nina (Diretora Criativa)
    ├── Luna (Designer — Geração Visual)
    ├── Diego (Diagramador — Montagem de Peças)
    ├── Carla (Videomaker — Produção de Vídeo)
    ├── Theo (Redator — Copy e Conteúdo)
    ├── Tina (Publisher — Publicação e Distribuição)
    └── Atlas (Gestor de Tráfego — Mídia Paga)
```

### Mike — Gerente do Departamento
- **Modelo:** Opus 4.6
- **Equação de Valor:** Empatia + Coragem
- **Papel:** Coordena todo o time, distribui demandas, cobra prazos, fala diretamente com os humanos (especialmente Yuri). Marca reuniões, gerencia agenda, lembra de compromissos. Já existe e funciona no LA Studio Manager atual.
- **Comunicação:** WhatsApp (UAZAPI) direto com os humanos

### Nina — Diretora Criativa
- **Modelo:** Opus 4.6
- **Equação de Valor:** Paixão + Excelência
- **Papel:** Cérebro criativo. Define direção, tom visual, aprova outputs, estrutura conteúdo. É quem garante a qualidade premium dos materiais.

### Luna — Designer (Geração Visual)
- **Modelo:** Gemini (Imagen 3/4) + GPT-image
- **Equação de Valor:** Paixão + Empatia
- **Papel:** Gera imagens, remove fundos, cria assets visuais, mantém o media library

### Diego — Diagramador (Montagem de Peças)
- **Modelo:** Opus 4.6 / Sonnet 4.6
- **Equação de Valor:** Excelência + Coragem
- **Papel:** Transforma briefing + imagens em peças finais (HTML/JSX → PNG via Puppeteer)

### Carla — Videomaker (Produção de Vídeo)
- **Modelo:** Sonnet 4.6 + Remotion
- **Equação de Valor:** Coragem + Paixão
- **Papel:** Transforma conteúdo estático em vídeos animados (Reels, Stories)

### Theo — Redator (Copy e Conteúdo)
- **Modelo:** GPT-5.4 + Sonnet 4.6
- **Equação de Valor:** Empatia + Paixão
- **Papel:** Escreve legendas, newsletters, artigos, curadoria de notícias

### Tina — Publisher (Publicação, Distribuição e Monitoramento de Caixa de Entrada)
- **Modelo:** Sonnet 4.6
- **Equação de Valor:** Excelência + Empatia
- **Papel:** Publica nos canais certos nos horários certos. Monitora e responde DMs, comentários e mentions no Instagram das 3 marcas — classifica cada interação (lead, aluno, evento, engajamento, ruído), responde no tom da marca ou escala pra humano quando não tem certeza. Cria leads no CRM e aciona consultores comerciais via UAZAPI (com Andreza sempre em cópia).

### Atlas — Gestor de Tráfego (Mídia Paga)
- **Modelo:** Opus 4.6 / GPT-5.4
- **Equação de Valor:** Coragem + Excelência
- **Papel:** Cria campanhas, otimiza budget, identifica posts orgânicos para impulsionar

### Equação de Valor do Departamento
**Paixão + Excelência = Conteúdo que Transforma**

### Frase da parede do departamento de Marketing
**"Atrair. Tocar. Transformar."**

---

## 6. SKILLS E MCPs

### Estrutura prevista
Cada agente terá:
- Diretório próprio de skills (`/agents/{nome}/skills/`)
- Arquivo SKILL.md por habilidade
- MCPs configurados por agente

### Skills detalhadas por agente (35 Skills + 1 arquivo compartilhado)

Todos os agentes compartilham acesso a todas as integrações (Supabase, UAZAPI, Resend, Claude, GPT, Gemini, Emusys, LA Studio Manager, LA Performance, Super Folha). O arquivo `agents/shared/integracoes-compartilhadas.md` documenta todas as 17 integrações disponíveis.

Além disso, todos os agentes têm acesso aos **Brand Guides** compartilhados:
- `agents/shared/brand-la-music-grupo.md` — DNA do grupo LA Music (manifesto, valores, música, regra de ouro)
- `agents/shared/brand-la-music-school.md` — Brand Guide da LA Music School
- `agents/shared/brand-sonoramente.md` — Brand Guide da SonoraMente LA
- `agents/shared/brand-la-music-kids.md` — Brand Guide da LA Music Kids

#### Mike — Gerente (4 Skills)
| Skill | Arquivo | Função |
|-------|---------|--------|
| Coordenação de Demandas | `coordenacao-demandas.md` | Receber briefings, distribuir tarefas, cobrar prazos |
| Calendário Editorial | `calendario-editorial.md` | Planejar e sincronizar calendário das 3 marcas |
| Comunicação com Humanos | `comunicacao-humanos.md` | WhatsApp com humanos, reportes, reuniões |
| Gestão de Performance | `gestao-performance.md` | KPIs de produção, custos por agente, relatórios |

#### Nina — Diretora Criativa (5 Skills)
| Skill | Arquivo | Função |
|-------|---------|--------|
| Direção Criativa | `direcao-criativa.md` | Definir direção visual, tom, conceito |
| Briefing Criativo | `briefing-criativo.md` | Gerar briefings detalhados pro time |
| Aprovação de Outputs | `aprovacao-outputs.md` | Verificar qualidade e aprovar/reprovar |
| Estruturação de Conteúdo | `estruturacao-conteudo.md` | Planejar slides, sequência, hierarquia |
| Guardião dos Design Systems | `guardiao-design-systems.md` | Garantir aplicação correta do DS por marca |

#### Luna — Designer (3 Skills)
| Skill | Arquivo | Função |
|-------|---------|--------|
| Geração de Imagens | `geracao-imagens.md` | Prompts pra Imagen 3, GPT-image, Imagen 4 |
| Tratamento de Imagens | `tratamento-imagens.md` | Remoção de fundo, resize, upscale, composição |
| Gestão da Media Library | `gestao-media-library.md` | Organizar, taguear, catalogar banco de assets |

#### Diego — Diagramador (6 Skills)
| Skill | Arquivo | Função |
|-------|---------|--------|
| Montagem de Carrossel | `montagem-carrossel.md` | HTML/JSX → PNG (1080x1350) |
| Montagem de Stories | `montagem-stories.md` | HTML/JSX → PNG (1080x1920) |
| Montagem de Posts | `montagem-posts.md` | HTML/JSX → PNG (1080x1080) |
| Exportação e Renderização | `exportacao-renderizacao.md` | Puppeteer, base64, debug, otimização |
| Landing Pages | `landing-pages.md` | Páginas de captação pra tráfego pago |
| Formulários e Link na Bio | `formularios-link-bio.md` | Páginas de link na bio com formulário |

#### Carla — Videomaker (4 Skills)
| Skill | Arquivo | Função |
|-------|---------|--------|
| Produção de Reels | `producao-reels.md` | Vídeos 9:16 animados em Remotion |
| Produção de Stories Animados | `producao-stories-animados.md` | Stories com animações e transições |
| Motion Graphics | `motion-graphics.md` | Logos animados, intros, elementos decorativos |
| Legendas Automáticas | `legendas-automaticas.md` | Gerar e sincronizar legendas em vídeos |

#### Theo — Redator (4 Skills)
| Skill | Arquivo | Função |
|-------|---------|--------|
| Copy para Redes Sociais | `copy-redes-sociais.md` | Legendas, ganchos, hashtags, CTAs |
| Newsletter | `newsletter.md` | Conteúdo pra email (Resend) e WhatsApp (UAZAPI) |
| Artigos e Curadoria | `artigos-curadoria.md` | Conteúdo educativo, curadoria de notícias |
| Tom de Voz por Marca | `tom-de-voz-por-marca.md` | Referência de escrita pra cada marca |

#### Tina — Publisher (5 Skills)
| Skill | Arquivo | Função |
|-------|---------|--------|
| Publicação no Instagram | `publicacao-instagram.md` | Postar via Graph API (carrosséis, stories, reels) |
| Disparo de Newsletter | `disparo-newsletter.md` | Email via Resend + WhatsApp via UAZAPI |
| Agendamento | `agendamento.md` | Programar posts nos horários ideais |
| Controle de Qualidade Final | `controle-qualidade-final.md` | Verificação final antes de publicar |
| Monitoramento do Instagram | `monitoramento-instagram.md` | Polling, classificação e resposta de DMs/comments/mentions; handoff pra consultores comerciais + CC Andreza |

#### Atlas — Gestor de Tráfego (4 Skills)
| Skill | Arquivo | Função |
|-------|---------|--------|
| Criação de Campanhas | `criacao-campanhas.md` | Meta Ads + Google Ads por marca |
| Otimização de Budget | `otimizacao-budget.md` | Monitorar, pausar, escalar campanhas |
| Impulsionamento Orgânico | `impulsionamento-organico.md` | Identificar posts orgânicos pra impulsionar |
| Análise e Relatórios | `analise-relatorios.md` | Dashboard de performance, CPA, ROAS, funil |

#### Estrutura de arquivos
```
/agents/
├── shared/
│   ├── integracoes-compartilhadas.md
│   ├── brands/                              ← Brand Guides (migrado de shared/ raiz em 20/04/26)
│   │   ├── brand-la-music-grupo.md
│   │   ├── brand-la-music-school.md
│   │   ├── brand-sonoramente.md
│   │   └── brand-la-music-kids.md
│   ├── design-systems/                      ← DS HTML (fonte de verdade visual)
│   │   ├── la-music-design-system.html      (~3.8 MB — agentes usam stripBase64 → 80KB)
│   │   ├── la-music-kids-design-system.html (~617 KB, v4)
│   │   └── sonoramente-design-system.html   (~208 KB, v2)
│   └── brand-assets/
│       ├── logos/                           (school, kids, sonoramente — SVGs oficiais)
│       └── fonts/                           (school/Prompt, kids/Volkswagen FREE + Madelina)
├── shared/checklists/
│   ├── checklist-qualidade-visual.md      (Nina, Diego)
│   ├── checklist-qualidade-copy.md        (Nina, Theo)
│   ├── checklist-qualidade-trafego.md     (Atlas, Mike)
│   └── checklist-qualidade-narrativa.md   (Nina, Theo)
├── mike/skills/    (4 skills)
├── nina/skills/    (5 skills)
├── luna/skills/    (3 skills)
├── diego/skills/   (6 skills)
├── carla/skills/   (4 skills)
├── theo/skills/    (4 skills)
├── tina/skills/    (5 skills)
└── atlas/skills/   (4 skills)
```

### Processo de onboarding de agente
Ao criar um novo agente, ele recebe:
1. Nome e crachá
2. Email do departamento
3. Arquivo SOUL.md (identidade, personalidade, Equação de Valor)
4. Skills instaladas
5. MCPs configurados
6. Acesso aos sistemas integrados
7. Integração com a memória compartilhada

---

## 6b. DESIGN SYSTEMS (Identidade Visual por Marca)

Cada marca atendida pelo Escritório de Marketing possui seu próprio Design System completo, que os agentes (especialmente Nina, Luna e Diego) devem seguir rigorosamente.

### LA Music School
- **Arquivo:** `la-music-school-design-system-v2-abril-2026.html` (DS v2 FIXED15, ~3.8 MB raw — agentes usam `stripBase64` pra carregar 80KB efetivo no prompt, Puppeteer carrega inteiro pra renderizar fontes)
- **Paleta oficial (extraída dos logos SVG):** Pink Primary **#E91451** (destaque principal), Black **#0A0A0A** (fundo escuro), Gray Light **#E8E8E8** (fundo claro — NÃO usar Cream #F5F1EC, obsoleto)
- **Tipografia:** Família **Prompt** (Google Fonts OFL, 7 pesos carregados: Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700, Black 900 — e as itálicas). Display sempre em uppercase com letter-spacing ajustado.
- **Elementos visuais reais (auditados em peças de produção):**
  - Halftones (pontos) em degradê como textura dominante
  - Watermark translúcido do número "4" em outline gigante
  - Pink blob footer com handle `@lamusicschool` + sete slashes decorativas (`///////`)
  - Chevrons pink direcionais
  - Texto em outline (vazado) — não preenchido — pra títulos de peso
  - **NOTA:** a "diagonal pink -8°" que constava em versões anteriores do DS NÃO existe nas peças reais; foi removida em abril/2026
- **Temas:** Dark Mode (#0A0A0A), Light Mode (#E8E8E8 Gray Light), Pink Mode (#E91451)
- **Tom:** Impactante, energético, direto. Rock e atitude.

### SonoraMente LA
- **Arquivo:** `sonoramente-design-system.html` (DS v2, ~208 KB, 2180 linhas, 9 seções)
- **Brand Guide:** `brand-sonoramente.md` (v2.1, ~24 KB — inclui manifesto, público TEA, tom científico-acolhedor)
- **Paleta:** Roxo Profundo #3D1A6E (primária), Roxo LA #5B2D8E, Roxo Claro #7B4DBE, Lavanda #B39DDB, Creme #FAF8FF
- **Tipografia:** Playfair Display (display, serifada) + DM Sans (corpo)
- **Elementos:** Gradientes suaves em roxo, bordas arredondadas (16px), espaçamento generoso
- **Temas:** Roxo Profundo (#3D1A6E), Light Mode (#FAF8FF), Roxo Mode (#5B2D8E)
- **Tom:** Acolhedor, científico, humano. Especialista que abraça.

### LA Music Kids
- **Arquivo:** `la-music-kids-design-system.html`
- **Paleta:** Amarelo #FFF212, Verde #17B255, Azul #00AFEF, Vermelho #ED3237 (4 cores do catavento)
- **Tipografia:** Família Volkswagen FREE (7 pesos: Light 300, Regular 400, Medium 500, MediumIta 500i, Bold 700, BoldIta 700i, Heavy 800) + Madelina Script (acento emocional)
- **Elementos:** Ondas coloridas, barra de 4 cores, emojis musicais, badges de faixa etária
- **Temas:** Branco Clean, Dark Mode (#1A1A1A), Azul Kids (#00AFEF)
- **Tom:** Divertido, confiante, lúdico sem infantilizar. Comunicação direcionada aos pais.

---

## 7. MÓDULOS FUNCIONAIS (MVP - Marketing)

### 7.1 Gerador de Carrosséis
- **Formato:** 1080x1440 (3:4 Instagram — spec 2026, atualizado de 1080x1350 em abril/2026)
- **Páginas:** flexíveis (4 a 10 slides por carrossel)
- **Tipos:** Dicas técnicas, Datas comemorativas, Apresentação de cursos
- **Output:** PNGs individuais prontos para upload
- **Identidade:** Cada marca tem seu próprio Design System — LA Music School (Pink #E91451 / Prompt), LA Music Kids (4 cores do catavento / Volkswagen FREE + Madelina), SonoraMente LA (Roxo #3D1A6E / Playfair Display + DM Sans)
- **Fluxo:** Tema → Nina estrutura → Designer gera imagens (Imagen 3/Gemini API) → Diagramador monta slides → Puppeteer exporta PNGs → Preview → Publisher posta

### 7.2 Gerador de Stories
- **Formato:** 1080x1920 (9:16 retrato)
- **Tipos:** Dicas rápidas, Bastidores, Promoções, Enquetes visuais
- **Output:** PNGs e/ou vídeos curtos

### 7.3 Gerador e Editor de Vídeos
- **Tecnologia:** Remotion
- **Tipos:** Reels (9:16), Vídeos curtos (1:1), Apresentações animadas
- **Recursos:** Transições, trilha sonora, legendas automáticas, motion graphics
- **Output:** MP4 nos formatos do Instagram

### 7.4 Gerador de Newsletters
- **Canais:** Email + WhatsApp (UAZAPI)
- **Tipos:** Newsletter semanal, Comunicados, Promoções
- **Email:** HTML email-friendly via **Resend** com domínio próprio
- **WhatsApp:** Texto formatado via UAZAPI
- **Por marca:** Tom de voz e identidade visual diferente para LA Music School, LA Music Kids e SonoraMente LA (cada marca tem seu próprio Design System)

### 7.5 Revistas Digitais
- **Música:** Notícias do mundo da música (marca LA Music School)
- **Autismo:** Notícias do mundo do autismo (marca SonoraMente LA)
- **Formato:** Digital, responsiva, visual premium
- **Curadoria:** Agente Redator busca notícias + humanos validam

---

## 8. DASHBOARD E KPIs

### Componentes do Dashboard
- **Calendário editorial** com preview de cada post agendado
- **Agenda de reuniões** entre humanos e agentes
- **Cards de KPI** com dados reais de performance:
  - Tráfego orgânico (Instagram Insights via Meta Graph API)
  - Tráfego pago (Meta Ads API + Google Ads API)
  - Engajamento por tipo de conteúdo
  - Crescimento de seguidores
  - Conversões (matrículas vindas de redes sociais)
- **Produtividade da equipe:** quantidade de peças produzidas, tempo médio de produção
- **Media Library:** banco de fotos, vídeos, gerações Imagen 3/4 e GPT-image

### DP dos Agentes (Departamento Pessoal)
- Custo operacional de cada agente (consumo de API por agente)
- Performance individual (métricas de output vs resultado)
- PDI dos agentes (ajustes de personalidade, skills, modelo)
- Percentual de uso de cada assinatura (Claude, GPT, Gemini)
- Distribuição de gastos (onde tá gastando mais/menos)
- Sistema de promoção e recompensa gamificada
- Quadro de reconhecimento (melhor performance do mês)

---

## 9. CULTURA ORGANIZACIONAL DOS AGENTES

### DNA Cultural (herdado da LA Music)
- **Propósito:** "Transformar vidas através da música"
- **Missão:** "Realizar sonhos"
- **Valores:** Paixão (95%), Empatia (85%), Coragem (85%), Excelência (90%)
- **Equações de Valor:** cada agente tem sua própria equação calculada

### Rituais
- **Coffee Connection** entre agentes (troca de informações inter-squad)
- **Reunião semanal de squad** (só agentes — consolidam resultados, planejam semana)
- **Reunião com humanos** (Yuri, John, Matheus, Rayan, Alf — brainstorm, curadoria, aprovação)
- **Camada estratégica noturna/semanal** (consolidação automática de aprendizados)

### Guardiões da Cultura
- Cada agente-líder de squad é Guardião da Cultura do andar
- Garantem que outputs estejam alinhados com tom, valores e propósito da marca
- Conceito alinhado com "Guardiões da Cultura" (Clube do Livro abril 2026) e "Estações vs. Doença" (poda sazonal ≠ raiz doente)

### Interação Humanos + Agentes
- Time humano: Yuri, John, Matheus, Rayan e Alf
- Avatares na sala de reunião com os agentes
- Humanos trazem contexto real ("semana que vem tem recital", "aluno fez algo incrível")
- Agentes transformam input humano em conteúdo

---

## 10. INTEGRAÇÕES COM SISTEMAS EXISTENTES

| Sistema | Descrição | Integração |
|---------|-----------|-----------|
| LA Studio Manager | Marketing (sistema atual, onde Mike já opera) | MCP Supabase (rhxqwraqpabgecgojytj) |
| LA Performance | Gestão geral | MCP / API |
| Super Folha | Folha de pagamento (Ana Paula usa) | MCP / API |
| Emusys | Sistema do parceiro | MCP / API |

### APIs externas
| API | Uso |
|-----|-----|
| Instagram Graph API | Publicação de carrosséis, stories, reels |
| Meta Ads API | Criação e gestão de anúncios pagos (Facebook/Instagram) |
| Google Ads API | Criação e gestão de anúncios pagos (Google) |
| Meta Graph API (Insights) | Métricas de performance orgânica |
| Google Analytics API | Métricas de tráfego do site |
| UAZAPI | Disparo de WhatsApp |
| Serviço de email | Resend com domínio próprio — disparo de newsletters por email |

---

## 11. VISÃO DE EXPANSÃO (Outros Andares)

### Escritórios futuros previstos
| Andar | Departamento | Conexão com sistemas existentes |
|-------|-------------|-------------------------------|
| 1 | Marketing (MVP) | LA Studio Manager |
| 2 | Financeiro | MusicFinance, DashFinance |
| 3 | Gente & Cultura / RH | Equações de Valor, Super Folha |
| 4 | Comercial | LA Report CRM, Mila SDR |
| 5 | Pedagógico | LA Journey, Harmonia Prática |
| 6 | Expansão | LA Botafogo, análise de mercado |
| 7 | Gestão Operacional | LA Performance |
| 8 | Coordenação Pedagógica | Emusys |

### Arquitetura multi-tenant
- Conceito de Offices → Squads → Agents → Tasks
- Cada escritório é um "tenant" independente com sua própria identidade
- Arquitetura preparada desde o dia zero para novos andares serem configuração, não desenvolvimento
- Banco: `offices` → `squads` → `agents` → `tasks` → `outputs`
- Potencial SaaS para Maestros da Gestão e rede de mentorados

---

## 12. BANCO DE DADOS (Estrutura inicial)

```sql
-- Escritórios (andares do prédio)
offices (id, name, slug, brand, floor_number, wall_phrase, design_config, created_at)

-- Squads dentro de cada escritório
squads (id, office_id, name, description, leader_agent_id, created_at)

-- Agentes
agents (id, squad_id, name, role, model, personality_config, avatar_url,
        equation_of_value, soul_md_path, status, created_at)

-- Skills dos agentes
agent_skills (id, agent_id, skill_name, skill_md_path, version, active, created_at)

-- MCPs e integrações dos agentes
agent_integrations (id, agent_id, integration_type, config, active, created_at)

-- Tasks (trabalhos executados)
tasks (id, agent_id, squad_id, type, input, output, status, 
       model_used, tokens_consumed, cost, started_at, completed_at)

-- Outputs (peças produzidas)
outputs (id, task_id, type, format, file_url, preview_url, 
         brand, published, published_at, platform, created_at)

-- Calendário editorial
calendar_entries (id, office_id, brand, title, content_type, 
                  scheduled_date, status, output_id, created_at)

-- Reuniões
meetings (id, office_id, title, type, participants, 
          agenda, notes, decisions, scheduled_at, completed_at)

-- KPIs e métricas
kpi_snapshots (id, office_id, brand, platform, metric_type, 
               value, period_start, period_end, created_at)

-- Custos operacionais dos agentes
agent_costs (id, agent_id, provider, model, tokens_input, tokens_output, 
             images_generated, cost_usd, period, created_at)

-- Memória semântica (pgvector)
semantic_memory (id, office_id, agent_id, content, embedding vector(1536), 
                 category, metadata, created_at)

-- Memória compartilhada entre escritórios
shared_memory (id, source_office_id, content, category, 
               visibility, created_at)

-- Media Library
media_assets (id, office_id, brand, type, file_url, thumbnail_url, 
              source, prompt, model_used, tags, created_at)

-- Leads (captação via landing pages e formulários de bio)
leads (id, office_id, brand, name, whatsapp, email, interest,
       source, campaign_id, status, created_at)

-- Contatos / base de destinatários (Tina: disparo-newsletter)
contacts (id, office_id, brand, name, email, whatsapp, 
          status, source, tags, created_at)

-- Disparos de newsletter (Tina: disparo-newsletter)
dispatches (id, office_id, brand, channel, type, subject, 
            content_preview, total_recipients, sent, failed,
            errors, campaign_id, dispatched_by, dispatched_at)

-- Bounces de email (Tina: disparo-newsletter)
email_bounces (id, office_id, dispatch_id, email, 
               error_message, created_at)

-- Agendamentos de publicação (Tina: agendamento)
schedule_entries (id, office_id, calendar_entry_id, output_id,
                  brand, content_type, platform, scheduled_at,
                  status, reschedule_reason, created_by, created_at)

-- Links dinâmicos da bio (Diego: formularios-link-bio)
bio_links (id, office_id, brand, label, url, icon, 
           position, active, clicks, created_at)

-- Campanhas de ads (Atlas: criacao-campanhas, otimizacao-budget)
campaigns (id, office_id, brand, platform, name, objective,
           budget_daily, status, ad_account_id, 
           campaign_ext_id, created_by, created_at)

-- Decisões de impulsionamento (Atlas: impulsionamento-organico)
boosts (id, office_id, brand, ig_media_id, post_caption,
        organic_engagement, organic_avg_engagement, multiplier,
        decision, decision_reason, budget_daily, duration_days,
        budget_total, ad_campaign_id, started_at, ends_at,
        total_spend, boost_reach, boost_engagement, roas,
        created_by, completed_at)

-- Decisões de budget (Atlas: otimizacao-budget)
budget_decisions (id, office_id, brand, campaign_id, campaign_name,
                  decision_type, reason, metric_before, metric_after,
                  budget_before, budget_after, decided_by, decided_at)

-- Métricas por post (Atlas: impulsionamento-organico)
post_metrics (id, office_id, brand, ig_media_id, 
              impressions, reach, engagement_rate, saves,
              shares, comments, likes, published_at, created_at)

-- ============================================================
-- Tabelas do Monitoramento Instagram (Tina: monitoramento-instagram)
-- Adicionadas em abril/2026 via migration instagram_monitoring_*
-- ============================================================

-- Contatos da equipe humana (comerciais, líderes, suporte IG)
-- Usada pela Tina pra saber pra quem disparar UAZAPI ao identificar lead
staff_contacts (id, office_id, name, role, phone, email, unit,
                is_lead_receiver, whatsapp_enabled, priority_order,
                active, notes, created_at, updated_at)

-- Fila de eventos de entrada do Instagram
-- Alimentada pela Edge Function webhook-instagram, consumida pelo tina-monitor.js
instagram_events (id, office_id, meta_event_id, ig_account_id, brand,
                  event_type, sender_ig_id, sender_username, content,
                  media_id, media_caption, raw_payload,
                  classification, confidence, reasoning, unit_hint,
                  requires_human_review, escalation_reason,
                  responded, responded_at, response_sent, response_meta_id, response_error,
                  whatsapp_dispatched, whatsapp_to, lead_id,
                  spam_score, is_minor_account, is_business_account,
                  processed_by, processing_attempts,
                  created_at, updated_at)

-- Anti-spam: perfis que enviaram spam recorrente não são reprocessados
ig_blocked_users (id, office_id, sender_ig_id, sender_username,
                  reason, blocked_by, events_count, created_at)
```

---

## 13. ROADMAP DE FASES

### Fase 0 — Fundação (2-3 semanas)
- Estrutura do banco de dados no Supabase
- Arquitetura de memória (pgvector + .md)
- Setup do Claude Code na VPS com assinatura
- Setup das APIs (Gemini, OpenAI)
- Estrutura base de offices/squads/agents no banco

### Fase 1 — Agentes funcionais sem interface (2-3 semanas)
- Mike operando como gerente (já existe, migrar)
- Nina gerando carrosséis via Claude Code
- Designer gerando imagens via Imagen 3/4 (Gemini API) / GPT-image
- Diagramador montando slides e exportando PNGs
- Publisher postando no Instagram via Graph API
- Fluxo completo: tema → imagens (Gemini API) → slides → PNGs → Instagram

### Fase 1.5 — Expandir Formatos e Marcas (em curso)
- School: 3 carrosséis reais publicados no @lamusicschool (abril/2026)
- Kids: task E2E pausada, pronta pra reexecutar (bug Luna resolvido 19/04)
- SonoraMente: pronta, aguardando inauguração (maio/2026)

### Fase 1.6 — Monitoramento Instagram (95% pronto)
- Tina monitora DMs/comments/mentions, classifica e responde ou escala
- Edge Function webhook + tina-monitor.js + 3 tabelas novas
- Aguardando: ativação do webhook no painel Meta Developer

### Fase 1.7 — Limpeza Arquitetural (concluída 18-20/04/2026)
- 14 skills limpas (hex/fonts obsoletos removidos, delegação ao Brand Guide + DS)
- 3 SOULs reescritos v2 (Nina, Luna, Diego)
- Migração/correção dos scripts para `shared/brand-guides/` em 7 scripts
- Padrão canônico: skills NUNCA replicam valores técnicos

### Fase 1.8 — Fix Diego + Pipeline E2E Validado (concluída 20/04/2026)
- Nina: fix `stripBase64` (DS 3.8MB → 80KB no prompt)
- Diego: prompt reescrito v2c (sem hardcodes, photoBlock isolado, sanitização pós-`</html>`)
- Pipeline E2E aprovado score 8/10, publicação real #3 no @lamusicschool

### Fase 2 — Dashboard funcional (3-4 semanas)
- Interface React com módulos de geração
- Gerador de carrosséis com preview
- Gerador de stories
- Calendário editorial
- Media library
- KPIs básicos (Instagram Insights)

### Fase 3 — Ambiente visual gamificado (3-4 semanas)
- Prédio na Paulista (Three.js ou isométrico)
- Lobby, elevador, andares
- Agentes com avatares, mesas, crachás
- Sala de reunião
- Animações e interatividade

### Fase 4 — Expansão de módulos (4-6 semanas)
- Gerador de vídeos (Remotion)
- Gerador de newsletters (email + WhatsApp)
- Revistas digitais
- Gestor de tráfego pago (Meta Ads + Google Ads)
- DP dos agentes (custos, performance, PDI)

### Fase 5 — Outros andares (ongoing)
- Escritório Financeiro
- Escritório Comercial
- Escritório Gente & Cultura
- E demais departamentos

---

## 14. PENDÊNCIAS E PRÓXIMOS PASSOS

### A definir
- [ ] Design detalhado do ambiente visual (referências, estilo — Fase 3 do roadmap)

### Já definido
- [x] Visão geral e conceito
- [x] Arquitetura técnica e stack
- [x] Modelos de IA e distribuição
- [x] Arquitetura de memória (5 camadas)
- [x] Hierarquia dos agentes (MVP Marketing)
- [x] Nomes de todos os agentes (Mike, Nina, Luna, Diego, Carla, Theo, Tina, Atlas)
- [x] Equação de Valor de cada agente + equação do departamento
- [x] Frase da parede do departamento de Marketing ("Atrair. Tocar. Transformar.")
- [x] Design Systems das 3 marcas (LA Music School, SonoraMente LA, LA Music Kids)
- [x] Serviço de email → Resend com domínio próprio
- [x] Job Descriptions v2.1 dos 8 agentes com persona profile, commands e relationships (Tina expandida com monitoramento Instagram em abril/2026)
- [x] 35 Skills evoluídas com formato Entrada/Saída, Fases, Veto Conditions, Checklist + código por marca (skill `monitoramento-instagram` adicionada em abril/2026 pra Tina)
- [x] Arquitetura de monitoramento Instagram (Edge Function webhook-instagram + tina-monitor.js + 3 tabelas novas no banco: instagram_events, ig_blocked_users, staff_contacts)
- [x] 4 Checklists de Qualidade separados (visual, copy, tráfego, narrativa) com itens CRITICAL
- [x] 4 Brand Guides (grupo + 3 marcas) + 1 arquivo de integrações compartilhadas (43 arquivos .md)
- [x] MCPs e integrações detalhadas — 17 integrações mapeadas
- [x] Brand Guides das 3 marcas + DNA do grupo LA Music (manifesto, música, valores)
- [x] Módulos funcionais (5 módulos)
- [x] Integrações com sistemas existentes (4 sistemas)
- [x] Dashboard e KPIs
- [x] Cultura organizacional dos agentes
- [x] Visão de expansão (8 andares)
- [x] Schema do banco de dados expandido (26 tabelas — 14 originais + 9 das skills evoluídas + 3 novas do monitoramento Instagram)
- [x] Roadmap de fases

---

*Documento gerado em 12 de abril de 2026 · Última atualização: 20 de abril de 2026*
*Versão 1.6 — Atualiza carrossel 1080x1440 (spec 2026), estrutura de arquivos com paths reais (shared/brand-guides/, shared/design-systems/, shared/brand-assets/), nota sobre stripBase64 no DS School, SonoraMente DS v2/BG v2.1, Roadmap com Fases 1.5-1.8. 3 publicações reais no @lamusicschool.*
*Versões anteriores:*
*- v1.5 (18/abr/2026): Monitoramento Instagram, DS School com valores SVG oficiais, DS Kids com Volkswagen FREE*
*- v1.4 (12/abr/2026): Schema de banco expandido (9 tabelas novas), 4 Checklists, 34 Skills evoluídas*
*Projeto LA HQ — Quartel General Digital da LA Music*
