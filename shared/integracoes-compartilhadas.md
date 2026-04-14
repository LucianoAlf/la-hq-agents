---
name: integracoes-compartilhadas
description: Referência de todas as integrações disponíveis para os agentes do LA HQ. Todo agente do Escritório de Marketing tem acesso a todas estas integrações. Consulte este arquivo sempre que precisar saber como conectar a uma API, banco de dados ou serviço externo.
---

# Integrações Compartilhadas — LA HQ

Todos os agentes do Escritório de Marketing têm acesso às integrações abaixo. O que muda é o **foco de uso** de cada agente, não o acesso.

---

## Banco de Dados & Storage

### Supabase (PostgreSQL + pgvector + Storage + Auth)
- **URL do projeto:** Configurado via variáveis de ambiente
- **Uso:** Banco principal de dados (offices, squads, agents, tasks, outputs, calendar_entries, meetings, kpi_snapshots, agent_costs, semantic_memory, shared_memory, media_assets)
- **Storage:** Upload e download de arquivos (PNGs, MP4s, assets)
- **pgvector:** Memória semântica com busca por similaridade
- **Auth:** Autenticação de usuários humanos

### Tabelas principais
| Tabela | Uso |
|--------|-----|
| `tasks` | Registro de trabalhos executados por agente |
| `outputs` | Peças produzidas (carrosséis, stories, vídeos, newsletters) |
| `calendar_entries` | Calendário editorial por marca |
| `meetings` | Reuniões entre humanos e agentes |
| `kpi_snapshots` | Métricas de performance |
| `agent_costs` | Custos operacionais por agente |
| `media_assets` | Media Library (fotos, vídeos, gerações IA) |
| `semantic_memory` | Memória semântica pesquisável |

---

## Comunicação

### UAZAPI (WhatsApp)
- **Uso:** Envio de mensagens para humanos (Yuri, John, Matheus, Rayan, Alf)
- **Formatos:** Texto formatado, imagens, documentos
- **Endpoint:** Configurado via variáveis de ambiente
- **Importante:** Mensagens devem ser claras, diretas e respeitosas com o tempo dos humanos

### Resend (Email)
- **Uso:** Disparo de newsletters e comunicados por email
- **Domínio:** Domínio próprio da LA Music configurado
- **Formatos:** HTML email-friendly
- **Importante:** Sempre testar envio antes de disparar pra base inteira

---

## Modelos de IA

### Claude (Anthropic)
- **Modelos:** Opus 4.6 (trabalho pesado) / Sonnet 4.6 (tarefas leves)
- **Acesso:** Via Claude Code na VPS (assinatura Pro/Max)
- **Uso:** Orquestração, copy premium, diagramação, raciocínio complexo

### GPT (OpenAI)
- **Modelos:** GPT-5.4 (raciocínio) / GPT-image (geração de imagens)
- **Acesso:** Assinatura de $100
- **Uso:** Raciocínio, planejamento, geração e edição de imagens

### Gemini / Pixa (Google)
- **Modelos:** Nano Banana 2 (imagens em volume) / Imagen 4 (fotorealismo)
- **Acesso:** API key (Google AI Studio) / Pixa MCP
- **Uso:** Geração de imagens em volume com custo baixo

### Princípio de distribuição
Balancear carga entre assinaturas para nenhuma estourar. Usar o modelo mais barato que resolve a tarefa.

---

## Sistemas LA Music

### LA Studio Manager
- **MCP Supabase:** rhxqwraqpabgecgojytj
- **Uso:** Sistema atual de marketing onde Mike já opera

### LA Performance Report
- **Integração:** MCP / API
- **Uso:** Gestão geral e indicadores de performance

### Super Folha LA
- **Integração:** MCP / API
- **Uso:** Folha de pagamento e informações de RH

### Emusys
- **Integração:** MCP / API
- **Uso:** Sistema do parceiro, dados de alunos e turmas

---

## APIs Externas

### Instagram Graph API
- **Uso:** Publicação de carrosséis, stories, reels + métricas orgânicas
- **Autenticação:** Token de acesso (longa duração)
- **Limites:** Respeitar rate limits da Meta

### Meta Ads API
- **Uso:** Criação e gestão de anúncios Facebook/Instagram
- **Autenticação:** Token de acesso do Business Manager

### Google Ads API
- **Uso:** Criação e gestão de anúncios Google
- **Autenticação:** OAuth 2.0

### Meta Graph API (Insights)
- **Uso:** Métricas de performance orgânica (alcance, engajamento, seguidores)

### Google Analytics API
- **Uso:** Métricas de tráfego do site

---

## Infraestrutura (VPS Hostinger)

### Puppeteer
- **Uso:** Renderização de HTML/JSX → PNG
- **Servidor:** VPS Hostinger (187.127.9.25)
- **Formatos:** 1080x1350 (4:5), 1080x1080 (1:1), 1080x1920 (9:16)

### Remotion
- **Uso:** Renderização de vídeos animados
- **Servidor:** VPS Hostinger (187.127.9.25)
- **Formatos:** MP4 em 1080p (9:16, 1:1, 16:9)

### Web Search
- **Uso:** Pesquisa de notícias, tendências, referências
- **Disponível:** Para todos os agentes via Claude Code
