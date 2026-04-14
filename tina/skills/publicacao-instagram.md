---
name: publicacao-instagram
description: Skill para publicar conteúdo no Instagram via Graph API — carrosséis, posts, stories e reels. Use sempre que Tina precisa postar material aprovado pela Nina nas contas corretas das 3 marcas.
---

# Publicação no Instagram

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| office_id | UUID | Contexto do tenant | Sim |
| output_id | UUID | Output aprovado pela Nina | Sim |
| marca | string | Calendar entry | Sim |
| tipo_publicação | string | Calendar entry ("carrossel", "post", "reel", "story") | Sim |
| legenda | texto | Theo (legenda completa com hashtags e CTA) | Sim |
| hashtags | lista | Theo (hashtags da marca) | Sim |
| mídia_urls[] | lista URLs | Supabase Storage (imagens/vídeo público) | Sim |
| horário_agendado | datetime | Calendário editorial / skill agendamento | Sim |
| cover_url | URL | Luna (thumbnail para reel) | Condicional (reel) |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| ig_media_id | string | Supabase → outputs (referência do post publicado) |
| published_url | URL | Registro e compartilhamento |
| calendar_update | update | Supabase → calendar_entries (status → 'published') |
| output_update | update | Supabase → outputs (published: true) |
| métricas_iniciais | objeto | Atlas (após 1h — reach, impressions, engagement) |

## Fases de Execução

### Fase 1 — Verificação Pré-Publicação

**Checklist obrigatório (TODOS devem passar):**
- [ ] Material aprovado pela Nina? (`output.approval_status = 'approved'`)
- [ ] Conta correta? (LA Music School ≠ LA Music Kids ≠ SonoraMente)
- [ ] Formato correto pro tipo de publicação? (4:5 carrossel, 9:16 reel/story, 1:1 post)
- [ ] Legenda completa com hashtags e CTA?
- [ ] Horário correto conforme calendário?
- [ ] Imagens/vídeo acessíveis publicamente? (URLs do Supabase Storage)
- [ ] Tamanho dos arquivos dentro do limite? (imagem <8MB, vídeo <100MB)

**Configuração de contas por marca:**

| Marca | IG User ID | Access Token Env Var |
|-------|-----------|---------------------|
| LA Music School | `IG_USER_ID_SCHOOL` | `IG_TOKEN_SCHOOL` |
| SonoraMente LA | `IG_USER_ID_SONORAMENTE` | `IG_TOKEN_SONORAMENTE` |
| LA Music Kids | `IG_USER_ID_KIDS` | `IG_TOKEN_KIDS` |

```javascript
// Configuração de contas
const IG_ACCOUNTS = {
  'la-music-school': {
    userId: process.env.IG_USER_ID_SCHOOL,
    token: process.env.IG_TOKEN_SCHOOL
  },
  'sonoramente': {
    userId: process.env.IG_USER_ID_SONORAMENTE,
    token: process.env.IG_TOKEN_SONORAMENTE
  },
  'la-music-kids': {
    userId: process.env.IG_USER_ID_KIDS,
    token: process.env.IG_TOKEN_KIDS
  }
};

function getAccount(brand) {
  const account = IG_ACCOUNTS[brand];
  if (!account) throw new Error(`Conta não configurada para marca: ${brand}`);
  return account;
}
```

### Fase 2 — Publicar Carrossel via Graph API

**Fluxo: criar containers para cada slide → criar carrossel → publicar**

```javascript
const GRAPH_API = 'https://graph.facebook.com/v19.0';

/**
 * Publicar carrossel no Instagram
 * @param {string} brand - marca (la-music-school, sonoramente, la-music-kids)
 * @param {string[]} imageUrls - URLs públicas das imagens dos slides
 * @param {string} caption - legenda completa com hashtags
 */
async function publishCarousel(brand, imageUrls, caption) {
  const account = getAccount(brand);
  
  // 1. Criar container para cada slide
  const childrenIds = [];
  
  for (const url of imageUrls) {
    const response = await fetch(
      `${GRAPH_API}/${account.userId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: url,
          is_carousel_item: true,
          access_token: account.token
        })
      }
    );
    const data = await response.json();
    
    if (data.error) throw new Error(`Erro ao criar slide: ${data.error.message}`);
    childrenIds.push(data.id);
  }
  
  // 2. Criar carrossel com os children
  const carouselResponse = await fetch(
    `${GRAPH_API}/${account.userId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: childrenIds,
        caption: caption,
        access_token: account.token
      })
    }
  );
  const carouselData = await carouselResponse.json();
  
  if (carouselData.error) throw new Error(`Erro ao criar carrossel: ${carouselData.error.message}`);
  
  // 3. Publicar
  const publishResponse = await fetch(
    `${GRAPH_API}/${account.userId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: carouselData.id,
        access_token: account.token
      })
    }
  );
  const publishData = await publishResponse.json();
  
  if (publishData.error) throw new Error(`Erro ao publicar: ${publishData.error.message}`);
  
  return {
    mediaId: publishData.id,
    permalink: `https://www.instagram.com/p/${publishData.id}/`
  };
}
```

### Fase 3 — Publicar Post Único (Imagem)

```javascript
/**
 * Publicar post único (imagem) no Instagram
 */
async function publishSinglePost(brand, imageUrl, caption) {
  const account = getAccount(brand);
  
  // 1. Criar container
  const containerResponse = await fetch(
    `${GRAPH_API}/${account.userId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: account.token
      })
    }
  );
  const containerData = await containerResponse.json();
  
  if (containerData.error) throw new Error(`Erro ao criar container: ${containerData.error.message}`);
  
  // 2. Publicar
  const publishResponse = await fetch(
    `${GRAPH_API}/${account.userId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: account.token
      })
    }
  );
  const publishData = await publishResponse.json();
  
  if (publishData.error) throw new Error(`Erro ao publicar: ${publishData.error.message}`);
  
  return { mediaId: publishData.id };
}
```

### Fase 4 — Publicar Reel (Vídeo)

```javascript
/**
 * Publicar reel no Instagram
 * Reels exigem polling do status do container (processamento do vídeo)
 */
async function publishReel(brand, videoUrl, caption, coverUrl = null) {
  const account = getAccount(brand);
  
  // 1. Criar container do reel
  const containerBody = {
    media_type: 'REELS',
    video_url: videoUrl,
    caption: caption,
    access_token: account.token
  };
  if (coverUrl) containerBody.cover_url = coverUrl;
  
  const containerResponse = await fetch(
    `${GRAPH_API}/${account.userId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerBody)
    }
  );
  const containerData = await containerResponse.json();
  
  if (containerData.error) throw new Error(`Erro ao criar container reel: ${containerData.error.message}`);
  
  // 2. Polling do status (vídeo precisa ser processado)
  const containerId = containerData.id;
  let status = 'IN_PROGRESS';
  let attempts = 0;
  const maxAttempts = 30; // máx 5 minutos (10s * 30)
  
  while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
    await sleep(10000); // esperar 10 segundos
    
    const statusResponse = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${account.token}`
    );
    const statusData = await statusResponse.json();
    status = statusData.status_code;
    attempts++;
    
    console.log(`Reel processing: attempt ${attempts}, status: ${status}`);
  }
  
  if (status !== 'FINISHED') {
    throw new Error(`Reel não processou após ${attempts} tentativas. Status: ${status}`);
  }
  
  // 3. Publicar
  const publishResponse = await fetch(
    `${GRAPH_API}/${account.userId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: account.token
      })
    }
  );
  const publishData = await publishResponse.json();
  
  if (publishData.error) throw new Error(`Erro ao publicar reel: ${publishData.error.message}`);
  
  return { mediaId: publishData.id };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
```

### Fase 5 — Pós-Publicação

**Atualizar registros no Supabase:**
```sql
-- Atualizar calendar_entry
UPDATE calendar_entries
SET status = 'published',
    published_at = NOW(),
    ig_media_id = $2,
    updated_at = NOW()
WHERE id = $1 AND office_id = $3;

-- Atualizar output
UPDATE outputs
SET published = true,
    platform = 'instagram',
    ig_media_id = $2,
    published_at = NOW(),
    updated_at = NOW()
WHERE id = $1 AND office_id = $3;
```

**Monitorar métricas iniciais (após 1h):**
```javascript
async function checkInitialMetrics(brand, mediaId) {
  const account = getAccount(brand);
  
  const response = await fetch(
    `${GRAPH_API}/${mediaId}/insights?metric=impressions,reach,engagement,saved&access_token=${account.token}`
  );
  const data = await response.json();
  
  const metrics = {};
  data.data.forEach(m => {
    metrics[m.name] = m.values[0].value;
  });
  
  // Alertar Atlas se performance excepcional
  if (metrics.engagement > 100 || metrics.saved > 20) {
    // Performance excepcional → considerar impulsionamento
    return { exceptional: true, metrics };
  }
  
  return { exceptional: false, metrics };
}
```

### Fase 6 — Horários Ideais de Publicação

| Marca | Melhor horário | Segundo melhor | Pior horário |
|-------|---------------|----------------|-------------|
| LA Music School | 18h-20h (terça/quinta) | 12h-13h (quarta) | Madrugada, domingo manhã |
| LA Music Kids | 10h-11h (sábado) | 19h (quarta/quinta) | Madrugada, horário comercial |
| SonoraMente | 9h-10h (segunda/quarta) | 14h (sexta) | Noite, fins de semana |

*Horários são baseline — ajustar conforme dados reais do Instagram Insights (Atlas monitora).*

### Fase 7 — Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `OAuthException` | Token expirado | Renovar access token no Meta Business |
| `Invalid image URL` | URL não pública ou expirada | Verificar URL do Supabase Storage, gerar nova URL pública |
| `Carousel requires 2-10 items` | Menos de 2 ou mais de 10 slides | Ajustar quantidade de slides |
| `Video processing failed` | Vídeo corrompido ou formato errado | Verificar codec (H.264), resolução, duração |
| `Rate limit exceeded` | Muitas chamadas à API | Aguardar, respeitar rate limits |
| `Permission denied` | Conta sem permissão | Verificar permissões do app no Meta Business |
| Post aparece em conta errada | Brand/account mismatch | VERIFICAR 3X: conta certa para a marca |

**Limites da Graph API:**
- Imagens: máx 8MB, formatos JPEG/PNG
- Vídeos (Reels): máx 100MB, 3-90 segundos, H.264, AAC
- Carrossel: 2-10 itens
- Caption: máx 2.200 caracteres
- Hashtags: máx 30 por post (recomendado 15-20)

## Veto Conditions — NUNCA
- NUNCA publicar sem aprovação da Nina (output.approval_status = 'approved')
- NUNCA publicar conteúdo de uma marca na conta de outra (VERIFICAR 3X)
- NUNCA publicar sem legenda completa (texto + hashtags + CTA)
- NUNCA publicar sem verificar formato correto (4:5/1:1/9:16)
- NUNCA ignorar erro da API — se falhar, alertar Mike, não tentar forçar
- NUNCA publicar sem atualizar status no Supabase após publicação
- NUNCA publicar fora do horário planejado sem autorização do Mike
- NUNCA publicar reel sem aguardar processamento completo (status FINISHED)
- NUNCA deixar de monitorar métricas iniciais em 1h

## Checklist de Conclusão
- [ ] Material aprovado pela Nina verificado
- [ ] Conta correta para a marca selecionada (VERIFICAR 3X)
- [ ] Formato correto verificado (carrossel/post/reel)
- [ ] Legenda completa com hashtags e CTA
- [ ] URLs de mídia acessíveis publicamente
- [ ] Publicação executada via Graph API sem erros
- [ ] Calendar_entry atualizado: status → 'published'
- [ ] Output atualizado: published → true, ig_media_id registrado
- [ ] Métricas iniciais verificadas após 1h
- [ ] Atlas alertado se performance excepcional (considerar impulsionamento)
- [ ] Erro reportado a Mike (se houver problema)

## Integrações
- **Instagram Graph API v19.0** — publicação de conteúdo (carrossel, post, reel)
- **Supabase Storage** — URLs públicas das mídias para publicação
- **Supabase (outputs)** — atualização de status (published, ig_media_id)
- **Supabase (calendar_entries)** — atualização de status (published, published_at)
- **Instagram Insights API** — métricas de performance pós-publicação
