---
name: lahq-copy-publication
description: Criar copy/caption e preparar publicação Instagram LAHQ para LA Music School, LA Music Kids e SonoraMente em feed estático, carrossel, stories, reels e vídeos. Use quando o usuário pedir legenda, copy, hashtags, CTA, publicar, agendar, subir no Instagram, feed, story, reels, vídeo ou empacotar conteúdo aprovado para Supabase/Tina.
---

# LAHQ Copy + Publication

Use esta skill depois que a peça criativa estiver aprovada ou quando o pedido for especificamente copy/publicação.

Princípio: **criativo aprovado primeiro; publicação depois.** Live no Instagram só com aprovação explícita do Alf.

## Fontes

Repo LAHQ:

```bash
/root/.openclaw/workspace/repos/la-hq-agents
```

Arquivos úteis:
- Theo copy: `theo/skills/copy-redes-sociais.md`
- Tom por marca: `theo/skills/tom-de-voz-por-marca.md`
- Tina publicação: `tina/skills/publicacao-instagram.md`
- Tina script atual: `scripts/tina.js`
- Content pipeline: `skills/lahq-content-pipeline/SKILL.md`
- School específica: `skills/lahq-school-content/SKILL.md`

## Ordem obrigatória

1. Confirmar marca e formato.
2. Confirmar que o criativo foi aprovado pelo Alf/Nina.
3. Escrever copy/caption no tom da marca.
4. Montar hashtags e CTA.
5. Registrar output aprovado no Supabase LAHQ quando necessário.
6. Rodar Tina em dry-run.
7. Rodar live **só depois de aprovação explícita**.
8. Confirmar permalink e salvar memória.

## Formatos suportados

### 1. Feed estático
- Asset: 1 imagem, ideal 4:5 (`1080x1350`) ou conforme arte aprovada.
- Copy: gancho curto + contexto + CTA.
- CTA comum: “link na bio”, “salva”, “manda pra alguém”, “chama no direct”.
- Publicação: container único de imagem.

### 2. Carrossel
- Asset: 2–10 imagens públicas.
- Copy: legenda não deve repetir cada slide. Ela deve abrir o tema, reforçar valor e chamar ação.
- Primeira linha precisa vender o arraste.
- Publicação: containers `is_carousel_item=true` → container `CAROUSEL` → publish.

### 3. Stories
- Asset: 9:16 (`1080x1920`) imagem ou vídeo curto.
- Copy visual curta; legenda externa geralmente não é o foco.
- CTA: sticker/link/DM quando disponível; se não, inserir CTA visual no story.
- Atenção: confirmar se o script atual publica stories; se não publicar, registrar e avisar que precisa extensão da Tina.

### 4. Reels
- Asset: vídeo vertical 9:16; capa/thumbnail se houver.
- Copy: primeira linha forte, descrição curta, CTA de comentário/salvar/link bio.
- Publicação: `media_type=REELS`, `video_url`, polling de processamento, publish.
- Atenção: confirmar suporte real no script antes do live.

### 5. Vídeos/feed vídeo
- Asset: vídeo público, formato conforme destino.
- Copy: contexto + promessa + CTA.
- Publicação: usar endpoint de vídeo adequado; confirmar suporte no script atual.

## Receita de copy

### Estrutura base

```text
[Gancho em 1–2 linhas]

[Contexto curto: por que isso importa]

[Valor prático ou emocional]

[CTA]

#Hashtags
```

### Carrossel técnico School

Use copy técnica, não motivacional genérica.

Bom:
```text
Palhetada alternada não é só velocidade. É controle.

O segredo é simples — e difícil de manter:
↓ ↑ ↓ ↑

Mesmo quando troca de corda, a lógica continua.
Menos braço. Mais pulso. Ataque limpo.

Salva esse treino e testa hoje na guitarra.
```

Ruim:
```text
Desperte seu potencial e viva a música intensamente.
```

### School — tom
- Direto, técnico, jovem/adulto, atitude.
- Falar como músico, não como empresa.
- Pode usar termos reais: palheta, corda, BPM, pulso, ataque, mão direita, mão esquerda, afinação, dinâmica, groove.
- Evitar copy abstrata quando o conteúdo for técnico.

### Kids — tom
- Confiante, afetivo, claro para pais.
- Benefício da criança + segurança + desenvolvimento.
- Evitar infantilizar demais.

### SonoraMente — tom
- Acolhedor, ético, técnico-científico sem frieza.
- Sem promessas terapêuticas absolutas.
- Foco em cuidado, desenvolvimento, vínculo e acompanhamento profissional.

## Hashtags

- Instagram aceita até 30; LAHQ deve usar normalmente 8–15.
- Misturar: marca + tema + instrumento/serviço + localização.
- Não duplicar se a legenda já tiver hashtags.
- Preferir sem acento para hashtags técnicas.

Exemplo School guitarra:
```js
[
  'LAMusicSchool', 'Guitarra', 'AulaDeGuitarra', 'PalhetadaAlternada',
  'TecnicaDeGuitarra', 'Guitarrista', 'EscolaDeMusica',
  'RioDeJaneiro', 'CampoGrandeRJ', 'RecreioDosBandeirantes', 'BarraDaTijuca'
]
```

## Registro para Tina

O script `scripts/tina.js` busca uma task `publishing` pendente para Tina e um `output` aprovado.

Mínimo esperado:
- `outputs.approval_status = 'approved'`
- `outputs.status = 'ready'`
- `outputs.file_urls[]` públicas no Supabase Storage
- `outputs.total_slides`
- `tasks.type = 'publishing'`
- `tasks.status = 'pending'`
- `tasks.agent_id = c3d4e5f6-0007-4000-8000-000000000007`
- `tasks.input.output_id`
- `tasks.input.legenda`
- `tasks.input.hashtags[]`

## Publicação segura

Sempre rodar:

```bash
ssh -i ~/.ssh/openclaw_lahq root@89.116.73.186 "cd /home/lahq && node scripts/tina.js --dry-run"
```

Só após dry-run OK e aprovação explícita:

```bash
ssh -i ~/.ssh/openclaw_lahq root@89.116.73.186 "cd /home/lahq && node scripts/tina.js --live"
```

Depois confirmar permalink via Graph API ou logs da Tina e salvar em memória.

## QA antes do live

- [ ] Marca correta (`@lamusicschool`, Kids ou SonoraMente).
- [ ] Formato correto para destino.
- [ ] Arquivos públicos acessíveis.
- [ ] Caption sem erro, sem tom genérico, com CTA.
- [ ] Hashtags abaixo de 30 e sem duplicação.
- [ ] Output aprovado.
- [ ] Dry-run passou.
- [ ] Alf autorizou live claramente.

## Regra dura

Se for publicação pública: **não improvisar e não pular dry-run.**
