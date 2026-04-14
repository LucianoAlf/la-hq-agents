---
name: briefing-criativo
description: Skill para gerar briefings detalhados e acionáveis para Luna (imagens), Diego (diagramação), Carla (vídeo) e Theo (copy). Use sempre que Nina precisa passar demanda pro time com todas as informações necessárias.
---

# Briefing Criativo

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| direção_criativa | documento | Skill direcao-criativa | Sim |
| destinatário | enum (luna, diego, carla, theo) | Nina | Sim |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| briefing formatado | documento | Agente destinatário |
| task registrada | record | Supabase (tasks) |

## Briefings por Agente

### Para Luna (Imagem)
```
BRIEFING DE IMAGEM
Marca: [marca] | Modelo sugerido: [NB2/GPT-image/Imagen4]
Quantidade: [N] | Estilo: [foto/ilustração/abstrato]
Descrição: [cena/composição detalhada]
Elementos obrigatórios: [instrumento, pessoa, cenário]
Elementos proibidos: [rostos reais, logos concorrentes]
Proporção: [4:5/1:1/9:16] | Fundo: [transparente/cor/cenário]
```

### Para Diego (Diagramação)
```
BRIEFING DE DIAGRAMAÇÃO
Marca: [marca] → Design System: [referência]
Tipo: [carrossel/story/post] | Formato: [dimensão]
Slides: [quantidade e estrutura por slide]
- SLIDE 1 (CAPA): tema, tag, título (palavra destaque), subtítulo
- SLIDE 2-N: tema, título, corpo, elementos
- SLIDE FINAL (CTA): headline, botão, @perfil
Assets: [IDs da Luna] | Copy: [textos do Theo]
```

### Para Carla (Vídeo)
```
BRIEFING DE VÍDEO
Marca: [marca] | Tipo: [reel/story/apresentação]
Duração: [15s/30s/60s] | Formato: [9:16/1:1]
ROTEIRO:
[00-02s] GANCHO: [visual/texto]
[02-Xs] DESENVOLVIMENTO: [conteúdo]
[Xs-fim] CTA: [fechamento]
Transições: [tipo] | Trilha: [estilo] | Legendas: [sim/não]
```

### Para Theo (Copy)
```
BRIEFING DE COPY
Marca: [marca] → Tom: [referência ao Brand Guide]
Tipo: [legenda/newsletter/artigo] | Canal: [Instagram/email/WhatsApp]
Tema: [assunto] | Público: [pra quem] | Objetivo: [educar/engajar/converter]
CTA: [ação] | Tamanho: [curto/médio/longo] | Hashtags: [sim/não]
```

## Veto Conditions — NUNCA
- NUNCA enviar briefing incompleto — se falta info, Nina completa
- NUNCA delegar a dúvida ("vê o que fica melhor") — decidir antes
- NUNCA esquecer de indicar marca e Design System
- NUNCA enviar briefing sem prazo

## Checklist de Conclusão
- [ ] Briefing tem TUDO que o agente precisa pra executar sem perguntar
- [ ] Marca e Design System indicados
- [ ] Prazo definido
- [ ] Task registrada no Supabase

## Integrações
- Supabase (tasks, media_assets) — registro e referência
