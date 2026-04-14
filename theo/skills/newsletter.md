---
name: newsletter
description: Skill para criar conteúdo de newsletters para email (Resend) e WhatsApp (UAZAPI), adaptando formato, tom e tamanho por canal e por marca. Use sempre que Theo precisa escrever newsletter semanal, comunicado ou promoção para qualquer marca.
---

# Newsletter

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| marca | string | Calendário editorial | Sim |
| canal | string | Calendário ("email", "whatsapp", "ambos") | Sim |
| tipo | string | Mike/Nina ("semanal", "comunicado", "promoção", "evento") | Sim |
| tema_principal | string | Nina (direção criativa) ou calendário | Sim |
| conteúdo_secundário[] | lista | Calendário (agenda, eventos, novidades) | Não |
| cta | objeto | Nina/Atlas ({texto, url}) | Sim |
| destinatários | string | Tina ("base_completa", "leads_novos", "alunos_ativos") | Não |
| imagem_header | asset_id | Luna (imagem para email) | Não |
| deadline | date | Calendário (conteúdo pronto até quinta para disparo sexta) | Sim |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| conteúdo_email | HTML/markdown | Tina → disparo via Resend |
| assunto_email | string | Tina → campo subject do email |
| assunto_variações[] | lista | Tina → A/B testing (2-3 opções de assunto) |
| conteúdo_whatsapp | texto formatado | Tina → disparo via UAZAPI |
| versão_texto_puro | texto | Tina → fallback do email |

## Fases de Execução

### Fase 1 — Definir Canal e Formato

**Diferenças fundamentais entre canais:**

| Aspecto | Email (Resend) | WhatsApp (UAZAPI) |
|---------|---------------|-------------------|
| Tamanho | 300-500 palavras | 100-200 palavras máximo |
| Formatação | HTML com inline CSS, tabelas | Negrito, itálico, monospace do WhatsApp |
| Imagens | Embed no HTML (header + inline) | Enviar separado como mídia |
| Personalização | Nome do destinatário (merge tag) | Limitada (nome se disponível) |
| CTA | Botão estilizado com link | Link clicável no texto |
| Abertura | Assunto é 50% do sucesso | Primeira linha é o gancho |
| Frequência | 1x/semana por marca (segunda) | 1x/semana por marca (sexta) |
| Tom | Pode ser mais longo e editorial | Direto, escaneável, conversacional |
| Unsubscribe | Obrigatório por lei | Oferecer opção de sair |

### Fase 2 — Templates de Email por Marca

#### 🎸 LA Music School — Email

**Estrutura:**
```html
<!-- HEADER -->
<table width="100%" style="background: #0D0D1A; padding: 24px;">
  <tr><td align="center">
    <img src="logo_la_music_school.png" width="150" alt="LA Music School">
  </td></tr>
</table>

<!-- HERO IMAGE (opcional) -->
<table width="100%" style="background: #0D0D1A;">
  <tr><td align="center">
    <img src="hero_image.png" width="600" style="border-radius: 8px;">
  </td></tr>
</table>

<!-- CONTEÚDO -->
<table width="100%" style="background: #0D0D1A; color: #FFFFFF; font-family: 'Montserrat', Arial, sans-serif; padding: 24px;">
  <tr><td>
    <!-- Abertura -->
    <p style="font-size: 16px; color: #B0B0B0;">Fala, {{nome}}!</p>
    <p style="font-size: 16px; color: #FFFFFF;">[Abertura pessoal — 2 linhas]</p>
    
    <!-- Bloco principal -->
    <h2 style="font-family: 'Bebas Neue', Arial; color: #E91E63; font-size: 28px; margin-top: 24px;">
      🎵 DICA DA SEMANA
    </h2>
    <p style="font-size: 15px; line-height: 1.6; color: #E0E0E0;">
      [Conteúdo técnico ou curiosidade musical — 3-4 parágrafos]
    </p>
    
    <!-- Agenda -->
    <h2 style="font-family: 'Bebas Neue', Arial; color: #E91E63; font-size: 24px; margin-top: 24px;">
      📅 AGENDA
    </h2>
    <p style="font-size: 15px; color: #E0E0E0;">
      [Eventos, recitais, novidades da escola]
    </p>
    
    <!-- CTA -->
    <table width="100%" style="margin-top: 24px;">
      <tr><td align="center">
        <a href="{{cta_url}}" style="background: #E91E63; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
          {{cta_texto}}
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>

<!-- FOOTER -->
<table width="100%" style="background: #0A0A0A; padding: 16px; font-family: Arial; font-size: 12px; color: #666;">
  <tr><td align="center">
    Rock on! 🤘<br>LA Music School<br>
    Campo Grande · Recreio · Barra da Tijuca<br>
    <a href="{{unsubscribe_url}}" style="color: #999;">Cancelar inscrição</a>
  </td></tr>
</table>
```

**Exemplo de assunto com variações (A/B):**
```
Variação A: 🎸 O erro #1 que todo guitarrista comete (e como corrigir)
Variação B: Dica da semana: por que sua palhetada tá travando
Variação C: Fala, {{nome}}! Essa dica vai mudar seu som 🎵
```

#### 🧠 SonoraMente LA — Email

**Estrutura:**
```html
<!-- HEADER -->
<table width="100%" style="background: #3D1A6E; padding: 24px;">
  <tr><td align="center">
    <img src="logo_sonoramente.png" width="150" alt="SonoraMente LA">
    <p style="color: #E0B0FF; font-family: 'Playfair Display', Georgia; font-style: italic; font-size: 14px; margin: 8px 0 0;">
      onde o som cuida da mente
    </p>
  </td></tr>
</table>

<!-- CONTEÚDO -->
<table width="100%" style="background: #FAF8FF; color: #2D1B4E; font-family: 'DM Sans', Arial, sans-serif; padding: 24px;">
  <tr><td>
    <!-- Abertura -->
    <p style="font-size: 16px; color: #6B5B7B;">Olá, {{nome}}</p>
    <p style="font-size: 16px; color: #2D1B4E;">[Abertura empática — 2 linhas]</p>
    
    <!-- Artigo -->
    <h2 style="font-family: 'Playfair Display', Georgia; color: #3D1A6E; font-size: 24px; margin-top: 24px;">
      📖 Artigo da Semana
    </h2>
    <p style="font-size: 15px; line-height: 1.7; color: #2D1B4E;">
      [Conteúdo sobre musicoterapia/autismo — embasado, acolhedor. 3-4 parágrafos.]
    </p>
    
    <!-- Novidades -->
    <h2 style="font-family: 'Playfair Display', Georgia; color: #3D1A6E; font-size: 22px; margin-top: 24px;">
      🗓 Novidades
    </h2>
    <p style="font-size: 15px; color: #2D1B4E;">
      [Eventos, workshops, novos serviços]
    </p>
    
    <!-- CTA -->
    <table width="100%" style="margin-top: 24px;">
      <tr><td align="center">
        <a href="{{cta_url}}" style="background: #5B2D8E; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
          Agende uma avaliação →
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>

<!-- FOOTER -->
<table width="100%" style="background: #EDE8F5; padding: 16px; font-family: Arial; font-size: 12px; color: #6B5B7B;">
  <tr><td align="center">
    Com carinho,<br>SonoraMente LA<br>
    <a href="{{unsubscribe_url}}" style="color: #999;">Cancelar inscrição</a>
  </td></tr>
</table>
```

**Exemplo de assunto com variações:**
```
Variação A: 💜 Como a música ajuda no desenvolvimento da fala
Variação B: O que acontece no cérebro do seu filho quando ouve música
Variação C: {{nome}}, uma descoberta sobre musicoterapia que você precisa conhecer
```

#### 🎨 LA Music Kids — Email

**Estrutura:**
```html
<!-- HEADER com barra de 4 cores -->
<table width="100%" style="height: 6px;">
  <tr>
    <td width="25%" style="background: #FF6B35;"></td>
    <td width="25%" style="background: #4ECDC4;"></td>
    <td width="25%" style="background: #FFE66D;"></td>
    <td width="25%" style="background: #FF6B9D;"></td>
  </tr>
</table>
<table width="100%" style="background: #FFFFFF; padding: 24px;">
  <tr><td align="center">
    <img src="logo_kids.png" width="150" alt="LA Music Kids">
  </td></tr>
</table>

<!-- CONTEÚDO -->
<table width="100%" style="background: #FFF8F0; color: #2D3436; font-family: 'Nunito', Arial, sans-serif; padding: 24px;">
  <tr><td>
    <p style="font-size: 16px;">Oi, papais e mamães! 👋</p>
    <p style="font-size: 16px;">[Abertura divertida — 2 linhas]</p>
    
    <h2 style="font-family: 'Baloo 2', Arial; color: #FF6B35; font-size: 26px; margin-top: 24px;">
      🎵 Novidades da Semana
    </h2>
    <p style="font-size: 15px; line-height: 1.6; color: #2D3436;">
      [Conteúdo divertido e informativo para os pais]
    </p>
    
    <!-- CTA -->
    <table width="100%" style="margin-top: 24px;">
      <tr><td align="center">
        <a href="{{cta_url}}" style="background: #00AFEF; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
          {{cta_texto}} 🎶
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>

<!-- FOOTER com barra de 4 cores -->
<table width="100%" style="background: #FFFFFF; padding: 16px; font-family: Arial; font-size: 12px; color: #636E72;">
  <tr><td align="center">
    Bora fazer música! 🎵<br>LA Music Kids<br>
    <a href="{{unsubscribe_url}}" style="color: #999;">Cancelar inscrição</a>
  </td></tr>
</table>
<table width="100%" style="height: 6px;">
  <tr>
    <td width="25%" style="background: #FF6B35;"></td>
    <td width="25%" style="background: #4ECDC4;"></td>
    <td width="25%" style="background: #FFE66D;"></td>
    <td width="25%" style="background: #FF6B9D;"></td>
  </tr>
</table>
```

### Fase 3 — Templates de WhatsApp por Marca

**Formatação WhatsApp:**
- `*negrito*` → **negrito**
- `_itálico_` → _itálico_
- `` `monospace` `` → `monospace`
- `~tachado~` → ~~tachado~~
- Emojis como organizadores visuais de seção

#### 🎸 LA Music School — WhatsApp
```
🎸 *LA Music School — Dica da Semana!*

Fala, galera! 🤘

[Dica técnica curta e direta — 3-4 linhas]

📅 *Agenda:*
• [Evento 1]
• [Evento 2]

👉 [CTA com link]

Rock on! 🎵
_LA Music School — Pra Quem Sabe o Que Quer!_
```

#### 🧠 SonoraMente — WhatsApp
```
💜 *SonoraMente LA — Novidades*

Olá! 🤗

[Conteúdo acolhedor e informativo — 3-4 linhas]

📖 *Você sabia?*
[Dado ou curiosidade sobre musicoterapia]

🗓 *Próximo evento:* [info]

Quer saber mais? 👇
[link]

_SonoraMente LA — onde o som cuida da mente_
```

#### 🎨 LA Music Kids — WhatsApp
```
🎵 *LA Music Kids — Novidades da Semana!*

Oi, papais e mamães! 👋

[Conteúdo curto e divertido — 3-4 linhas]

📅 *Próxima aula especial:* [data e info]

👉 Agende: [link]

Bora fazer música! 🎶
_Música não é só pra gente grande!_
```

### Fase 4 — Assunto do Email (A Parte Mais Importante)

**Regras de assunto:**
- Máximo 50 caracteres (cortado no mobile se for maior)
- 1 emoji no máximo (no início ou fim)
- Gerar SEMPRE 3 variações para A/B testing
- Personalização com nome quando possível (`{{nome}}`)
- Evitar palavras de spam: GRÁTIS, PROMOÇÃO, DESCONTO, URGENTE em caps

**Fórmulas que funcionam:**

| Fórmula | Exemplo School | Exemplo SonoraMente | Exemplo Kids |
|---------|---------------|---------------------|-------------|
| Pergunta | Sua palhetada tá travando? | Como anda o desenvolvimento do seu filho? | Seu filho já fez a primeira nota? |
| Número + promessa | 3 exercícios pra destravar sua mão | 5 sinais de que a musicoterapia pode ajudar | 4 benefícios da música antes dos 3 anos |
| Curiosidade | O segredo que ninguém conta sobre BPM | O que acontece quando a música encontra o TEA | Por que bebês amam ritmo (a ciência explica) |
| Direto | Dica da semana: hammer-on | Artigo: musicoterapia e linguagem | Novidades da turma de 3-5 anos |
| Pessoal | {{nome}}, essa dica é pra você | {{nome}}, quero compartilhar algo | {{nome}}, olha o que sua turma aprontou |

### Fase 5 — Revisão e Entrega

**Prazo:** conteúdo finalizado até **quinta-feira** para Tina disparar na **sexta** (WhatsApp) e **segunda** (email).

**Entregar para Tina:**
1. Conteúdo email (HTML) + assunto com 3 variações + versão texto puro
2. Conteúdo WhatsApp (texto formatado)
3. Indicação de imagem header (asset_id da Luna)
4. CTA com URL final (confirmar com Atlas se é campanha)

## Veto Conditions — NUNCA
- NUNCA enviar newsletter sem revisão ortográfica
- NUNCA misturar tom de marcas (newsletter SonoraMente não pode soar como LA Music School)
- NUNCA enviar email sem link de cancelamento de inscrição (obrigatório por lei)
- NUNCA enviar WhatsApp com mais de 200 palavras (se não cabe numa tela, está longo)
- NUNCA usar assunto de email com mais de 50 caracteres
- NUNCA enviar sem CTA claro e funcional
- NUNCA copiar conteúdo de terceiros na newsletter
- NUNCA atrasar entrega (deadline: quinta para Tina disparar)
- NUNCA enviar imagem embed no WhatsApp (enviar como mídia separada)
- NUNCA usar caps lock em excesso no assunto ("MATRÍCULA GRÁTIS!!!")

## Checklist de Conclusão
- [ ] Marca e tom corretos aplicados
- [ ] Canal definido (email, WhatsApp, ambos)
- [ ] Conteúdo escrito no tamanho adequado (email 300-500 / WhatsApp 100-200 palavras)
- [ ] Assunto do email com 3 variações para A/B testing
- [ ] CTA claro com URL funcional verificada
- [ ] Versão texto puro do email gerada (fallback)
- [ ] Formatação WhatsApp correta (*negrito*, _itálico_)
- [ ] Revisão ortográfica e gramatical feita
- [ ] Personalização com nome quando possível
- [ ] Link de unsubscribe incluído (email)
- [ ] Imagem header indicada (asset_id da Luna)
- [ ] Entregue para Tina até quinta-feira

## Integrações
- **Resend API** — disparo de email (via Tina)
- **UAZAPI** — disparo de WhatsApp (via Tina)
- **Supabase (outputs)** — registro da newsletter produzida
- **Supabase (contacts/leads)** — base de destinatários
- **Brand Guides** — referência de tom por marca
- **Calendário editorial** — datas de publicação e temas
