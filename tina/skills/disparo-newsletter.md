---
name: disparo-newsletter
description: Skill para disparar newsletters por email (Resend com domínio próprio) e WhatsApp (UAZAPI). Use sempre que Tina precisa enviar newsletter semanal, comunicado ou promoção para as bases de contatos das 3 marcas.
---

# Disparo de Newsletter

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| office_id | UUID | Contexto do tenant | Sim |
| canal | string | Calendário ou Mike ("email", "whatsapp") | Sim |
| marca | string | Calendário ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| conteúdo_html | HTML | Theo (para email) — aprovado por Nina | Condicional (email) |
| assunto | string | Theo (subject do email) | Condicional (email) |
| assunto_variações[] | lista | Theo (A/B testing — 2-3 opções) | Não |
| conteúdo_whatsapp | texto | Theo (para WhatsApp) — aprovado por Nina | Condicional (whatsapp) |
| lista_destinatários | string | Tina ("base_completa", "alunos_ativos", "leads", "segmento_custom") | Sim |
| imagem_anexa | asset_id | Luna (para WhatsApp — enviar como mídia) | Não |
| campanha_id | UUID | Atlas (se vinculado a campanha) | Não |
| teste_primeiro | boolean | Default: true | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| disparo_id | UUID | Supabase → tabela dispatches |
| status_envio | objeto | Mike (confirmação, total enviados, erros) |
| bounces[] | lista | Mike (emails que falharam — investigar) |
| métricas_abertura | objeto | Atlas (open rate, click rate — após 24h) |
| output_atualizado | update | Supabase → outputs (dispatched: true) |

## Fases de Execução

### Fase 1 — Verificação Pré-Disparo

**Checklist obrigatório antes de qualquer disparo:**
- [ ] Conteúdo aprovado pela Nina? (status: 'approved')
- [ ] Remetente correto (marca certa)?
- [ ] Lista de destinatários correta (não misturar bases)?
- [ ] Links testados e funcionando (clicar em cada um)?
- [ ] Layout responsivo verificado (mobile + desktop)?
- [ ] Link de descadastro presente? (email — obrigatório por lei)
- [ ] Horário adequado? (nunca madrugada, domingo, feriado)
- [ ] Email de teste enviado e verificado visualmente?

```sql
-- Buscar contatos da marca para disparo
SELECT id, name, email, whatsapp, brand, status
FROM contacts
WHERE office_id = $1
  AND brand = $2
  AND status = 'active'
  AND ($3 = 'email' AND email IS NOT NULL
       OR $3 = 'whatsapp' AND whatsapp IS NOT NULL)
ORDER BY name;

-- Contagem antes do disparo (verificar volume)
SELECT brand, COUNT(*) as total,
       COUNT(email) as com_email,
       COUNT(whatsapp) as com_whatsapp
FROM contacts
WHERE office_id = $1
  AND brand = $2
  AND status = 'active'
GROUP BY brand;
```

### Fase 2 — Disparo de Email via Resend

**Configuração por marca:**

| Marca | Remetente (from) | Reply-to | Domínio |
|-------|-----------------|----------|---------|
| LA Music School | `LA Music School <contato@lamusic.com.br>` | `contato@lamusic.com.br` | `lamusic.com.br` |
| SonoraMente LA | `SonoraMente LA <contato@sonoramente.com.br>` | `contato@sonoramente.com.br` | `sonoramente.com.br` |
| LA Music Kids | `LA Music Kids <contato@lamusickids.com.br>` | `contato@lamusickids.com.br` | `lamusickids.com.br` |

**Código de disparo — email individual com personalização:**
```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuração de remetente por marca
const SENDERS = {
  'la-music-school': {
    from: 'LA Music School <contato@lamusic.com.br>',
    replyTo: 'contato@lamusic.com.br'
  },
  'sonoramente': {
    from: 'SonoraMente LA <contato@sonoramente.com.br>',
    replyTo: 'contato@sonoramente.com.br'
  },
  'la-music-kids': {
    from: 'LA Music Kids <contato@lamusickids.com.br>',
    replyTo: 'contato@lamusickids.com.br'
  }
};

/**
 * Disparar email para um destinatário
 */
async function sendEmail(contact, brand, subject, htmlContent) {
  const sender = SENDERS[brand];
  
  // Personalizar HTML (substituir merge tags)
  const personalizedHtml = htmlContent
    .replace(/\{\{nome\}\}/g, contact.name || 'Amigo(a)')
    .replace(/\{\{email\}\}/g, contact.email)
    .replace(/\{\{unsubscribe_url\}\}/g, 
      `https://lamusic.com.br/unsubscribe?id=${contact.id}&brand=${brand}`);
  
  try {
    const { data, error } = await resend.emails.send({
      from: sender.from,
      to: [contact.email],
      replyTo: sender.replyTo,
      subject: subject,
      html: personalizedHtml,
      text: htmlToPlainText(personalizedHtml),  // fallback texto puro
      tags: [
        { name: 'brand', value: brand },
        { name: 'type', value: 'newsletter' },
        { name: 'campaign', value: campaignId || 'weekly' }
      ]
    });
    
    if (error) {
      console.error(`Erro ao enviar para ${contact.email}:`, error);
      return { success: false, email: contact.email, error };
    }
    
    return { success: true, email: contact.email, messageId: data.id };
  } catch (err) {
    console.error(`Exceção ao enviar para ${contact.email}:`, err);
    return { success: false, email: contact.email, error: err.message };
  }
}

/**
 * Disparar para toda a lista (com rate limiting)
 */
async function sendBatch(contacts, brand, subject, htmlContent) {
  const results = { sent: 0, failed: 0, errors: [] };
  
  for (const contact of contacts) {
    const result = await sendEmail(contact, brand, subject, htmlContent);
    
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(result);
    }
    
    // Rate limiting: máx 10 emails/segundo (Resend free tier)
    await sleep(100);
  }
  
  return results;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function htmlToPlainText(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
```

**Enviar email de teste antes do disparo real:**
```javascript
async function sendTestEmail(brand, subject, htmlContent) {
  const testEmail = 'alf@lamusic.com.br'; // ou email de teste definido
  
  const result = await sendEmail(
    { name: 'Teste', email: testEmail, id: 'test' },
    brand,
    `[TESTE] ${subject}`,
    htmlContent
  );
  
  console.log(`Teste enviado para ${testEmail}:`, result);
  return result;
}
```

### Fase 3 — Disparo de WhatsApp via UAZAPI

**Código de disparo WhatsApp:**
```javascript
const UAZAPI_BASE = process.env.UAZAPI_URL;
const UAZAPI_TOKEN = process.env.UAZAPI_TOKEN;

/**
 * Enviar mensagem de texto via UAZAPI
 */
async function sendWhatsApp(phone, message) {
  const response = await fetch(`${UAZAPI_BASE}/send-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${UAZAPI_TOKEN}`
    },
    body: JSON.stringify({
      phone: phone,     // formato: 5521999999999
      message: message
    })
  });
  
  const data = await response.json();
  return data;
}

/**
 * Enviar imagem via UAZAPI (separado do texto)
 */
async function sendWhatsAppImage(phone, imageUrl, caption = '') {
  const response = await fetch(`${UAZAPI_BASE}/send-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${UAZAPI_TOKEN}`
    },
    body: JSON.stringify({
      phone: phone,
      image: imageUrl,
      caption: caption
    })
  });
  
  return await response.json();
}

/**
 * Disparar newsletter WhatsApp para toda a lista
 */
async function sendWhatsAppBatch(contacts, message, imageUrl = null) {
  const results = { sent: 0, failed: 0, errors: [] };
  
  for (const contact of contacts) {
    try {
      // Enviar imagem primeiro (se houver)
      if (imageUrl) {
        await sendWhatsAppImage(contact.whatsapp, imageUrl);
        await sleep(1000); // delay entre imagem e texto
      }
      
      // Personalizar mensagem
      const personalizedMsg = message
        .replace(/\{\{nome\}\}/g, contact.name || '');
      
      await sendWhatsApp(contact.whatsapp, personalizedMsg);
      results.sent++;
      
    } catch (err) {
      results.failed++;
      results.errors.push({ phone: contact.whatsapp, error: err.message });
    }
    
    // Rate limiting: 1 mensagem a cada 2 segundos (evitar bloqueio do WhatsApp)
    await sleep(2000);
  }
  
  return results;
}
```

**Formatação WhatsApp — referência rápida:**
```
*Texto em negrito*        → Texto em negrito
_Texto em itálico_        → Texto em itálico
~Texto tachado~           → Texto tachado
```Texto monospace```      → Texto monospace
```

### Fase 4 — Registrar Disparo e Resultados

```sql
-- Registrar disparo no Supabase
INSERT INTO dispatches (
  office_id, brand, channel, type,
  subject, content_preview,
  total_recipients, sent, failed,
  errors, campaign_id,
  dispatched_by, dispatched_at
) VALUES (
  $1, $2, $3, $4,
  $5, LEFT($6, 200),
  $7, $8, $9,
  $10::jsonb, $11,
  'tina', NOW()
) RETURNING id;

-- Atualizar output como disparado
UPDATE outputs
SET dispatched = true,
    dispatch_id = $2,
    dispatched_at = NOW(),
    updated_at = NOW()
WHERE id = $1;

-- Registrar bounces para investigação
INSERT INTO email_bounces (
  office_id, dispatch_id, email, error_message, created_at
)
SELECT $1, $2, unnest($3::text[]), unnest($4::text[]), NOW();
```

### Fase 5 — Monitoramento Pós-Disparo

**Email — métricas via Resend (webhooks ou polling):**
- **Open rate** — % de destinatários que abriram (meta: >25%)
- **Click rate** — % que clicou em algum link (meta: >5%)
- **Bounce rate** — % que retornou erro (meta: <2%)
- **Unsubscribe rate** — % que cancelou inscrição (meta: <0.5%)

**WhatsApp — métricas via UAZAPI:**
- **Delivered** — mensagem entregue ao dispositivo
- **Read** — mensagem lida (check azul)
- **Responses** — respostas recebidas (encaminhar para equipe)

**Ações baseadas em métricas:**
| Métrica | Valor | Ação |
|---------|-------|------|
| Open rate < 15% | 🔴 Crítico | Revisar assuntos com Theo |
| Bounce rate > 5% | 🔴 Crítico | Limpar lista, verificar domínio |
| Unsubscribe > 1% | 🟡 Atenção | Revisar frequência e conteúdo |
| Click rate > 10% | 🟢 Excelente | Reportar para Mike, replicar formato |
| WhatsApp blocked | 🔴 Crítico | Pausar disparos, verificar com UAZAPI |

### Fase 6 — Horários Ideais de Disparo

| Canal | Marca | Dia ideal | Horário | Observação |
|-------|-------|-----------|---------|------------|
| Email | LA Music School | Segunda | 09:00 | Início da semana, pico de abertura |
| Email | SonoraMente | Sexta | 09:00 | Pais mais tranquilos |
| Email | LA Music Kids | Terça | 10:00 | Manhã de terça, boa abertura |
| WhatsApp | LA Music School | Sexta | 18:00 | Final da semana, casual |
| WhatsApp | LA Music Kids | Sexta | 18:00 | Pais relaxando no fim do dia |
| WhatsApp | SonoraMente | Quinta | 14:00 | Tarde tranquila |

**Regra:** nunca disparar madrugada (22h-7h), domingo ou feriado.

## Veto Conditions — NUNCA
- NUNCA disparar sem enviar email de teste antes (verificar visual e links)
- NUNCA disparar da conta de uma marca para lista de outra marca
- NUNCA disparar email sem link de descadastro (obrigatório por lei — LGPD)
- NUNCA disparar WhatsApp sem delay entre mensagens (risco de bloqueio)
- NUNCA disparar sem conteúdo aprovado pela Nina
- NUNCA disparar em horário inadequado (madrugada, domingo, feriado)
- NUNCA ignorar bounces — reportar para Mike para limpeza da lista
- NUNCA enviar imagem embed no corpo do WhatsApp (enviar como mídia separada)
- NUNCA reutilizar assunto de email de semana anterior sem modificar
- NUNCA disparar para contatos com status 'unsubscribed' ou 'bounced'

## Checklist de Conclusão
- [ ] Conteúdo recebido do Theo e aprovado pela Nina
- [ ] Remetente correto para a marca (from, replyTo, domínio)
- [ ] Lista de destinatários correta e filtrada (ativos, com email/whatsapp)
- [ ] Links testados e funcionando (clicar em cada um)
- [ ] Layout responsivo verificado (email em mobile + desktop)
- [ ] Link de descadastro presente (email)
- [ ] Email de teste enviado e verificado visualmente
- [ ] Horário adequado (dentro da janela ideal por marca)
- [ ] Disparo executado com rate limiting
- [ ] Resultados registrados no Supabase (dispatches)
- [ ] Bounces reportados para Mike (se houver)
- [ ] Output atualizado como dispatched
- [ ] Métricas de abertura/clique verificadas após 24h

## Integrações
- **Resend API** — disparo de email com domínio próprio por marca
- **UAZAPI** — disparo de WhatsApp para base de contatos
- **Supabase (contacts)** — base de destinatários por marca
- **Supabase (dispatches)** — registro de disparos e resultados
- **Supabase (outputs)** — atualização de status (dispatched)
- **Supabase (email_bounces)** — registro de bounces para limpeza
