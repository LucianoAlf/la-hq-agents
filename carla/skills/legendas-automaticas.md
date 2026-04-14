---
name: legendas-automaticas
description: Skill para gerar e sincronizar legendas (subtitles) em vídeos, com estilo visual alinhado ao Design System da marca. Use em todos os Reels e vídeos que têm narração ou texto falado — 85% do Instagram é assistido sem som.
---

# Legendas Automáticas

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| vídeo_path | string | Carla (vídeo renderizado) ou upload humano | Sim |
| marca | string | Briefing ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| roteiro | texto | Theo (roteiro do vídeo) ou transcrição automática | Condicional |
| áudio_path | string | Extraído do vídeo (para transcrição automática) | Condicional |
| tipo_vídeo | string | Briefing ("reel", "story", "longa") | Sim |
| idioma | string | Default "pt-BR" | Não |
| highlight_words[] | lista | Nina/Theo (palavras-chave para destaque) | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| vídeo_legendado | arquivo MP4 | Supabase Storage → output final |
| arquivo_srt | arquivo SRT | Supabase Storage → backup editável |
| timestamps[] | lista | Registro para edição posterior |
| preview_frame | PNG | Nina (aprovação do estilo visual) |

## Fases de Execução

### Fase 1 — Obter Texto e Timestamps

**Opção A — Roteiro já existe (preferível):**
Se Theo já escreveu o roteiro, usar o texto como base e sincronizar manualmente com o vídeo:
```javascript
// Formato de entrada quando roteiro existe
const subtitles = [
  { start: 0.0,  end: 2.5,  text: "Você sabia que a palhetada alternada" },
  { start: 2.5,  end: 5.0,  text: "é o segredo dos guitarristas rápidos?" },
  { start: 5.0,  end: 8.0,  text: "Vem aprender com a gente" },
  { start: 8.0,  end: 10.0, text: "na LA Music School!" },
];
```

**Opção B — Transcrição automática (quando não há roteiro):**
```javascript
// Extrair áudio do vídeo
const { execSync } = require('child_process');
execSync('ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav');

// Transcrever via Whisper (OpenAI)
const fs = require('fs');
const formData = new FormData();
formData.append('file', fs.createReadStream('audio.wav'));
formData.append('model', 'whisper-1');
formData.append('language', 'pt');
formData.append('response_format', 'verbose_json');  // inclui timestamps
formData.append('timestamp_granularities[]', 'word');

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
  body: formData
});

const transcription = await response.json();
// transcription.words[] → [{word, start, end}, ...]
// transcription.segments[] → [{text, start, end}, ...]
```

**Opção C — Transcrição via Gemini (alternativa gratuita):**
```javascript
// Upload de áudio para Gemini e transcrição
const result = await gemini.generateContent({
  model: "gemini-2.5-flash",
  contents: [{
    parts: [
      { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
      { text: "Transcreva este áudio em português brasileiro. Retorne no formato JSON: [{start: seconds, end: seconds, text: 'frase'}]. Quebre em frases curtas de no máximo 8 palavras." }
    ]
  }]
});
```

### Fase 2 — Formatar Legendas

**Regras de formatação:**
- Máximo **2 linhas** por frame de legenda
- Máximo **8 palavras** por bloco (idealmente 4-6)
- Duração: cada legenda **2-4 segundos** na tela
- Se o texto é longo, dividir em múltiplos frames
- Pausas naturais na fala = quebra de legenda

**Algoritmo de quebra automática:**
```javascript
function formatSubtitles(segments, maxWordsPerBlock = 7, maxLines = 2) {
  const formatted = [];
  
  for (const segment of segments) {
    const words = segment.text.split(' ');
    
    if (words.length <= maxWordsPerBlock) {
      // Cabe em um bloco
      formatted.push({
        start: segment.start,
        end: segment.end,
        text: segment.text,
        lines: words.length > 4 ? splitIntoLines(segment.text, maxLines) : [segment.text]
      });
    } else {
      // Dividir em múltiplos blocos
      const chunks = chunkWords(words, maxWordsPerBlock);
      const duration = segment.end - segment.start;
      const chunkDuration = duration / chunks.length;
      
      chunks.forEach((chunk, i) => {
        formatted.push({
          start: segment.start + (i * chunkDuration),
          end: segment.start + ((i + 1) * chunkDuration),
          text: chunk.join(' '),
          lines: splitIntoLines(chunk.join(' '), maxLines)
        });
      });
    }
  }
  
  return formatted;
}

function splitIntoLines(text, maxLines) {
  const words = text.split(' ');
  if (words.length <= 4 || maxLines === 1) return [text];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

function chunkWords(words, maxPerChunk) {
  const chunks = [];
  for (let i = 0; i < words.length; i += maxPerChunk) {
    chunks.push(words.slice(i, i + maxPerChunk));
  }
  return chunks;
}
```

**Gerar arquivo SRT (backup editável):**
```javascript
function generateSRT(subtitles) {
  return subtitles.map((sub, i) => {
    const start = formatSRTTime(sub.start);
    const end = formatSRTTime(sub.end);
    return `${i + 1}\n${start} --> ${end}\n${sub.text}\n`;
  }).join('\n');
}

function formatSRTTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
  return `${h}:${m}:${s},${ms}`;
}

// Salvar SRT
fs.writeFileSync('legendas.srt', generateSRT(formattedSubtitles));
```

### Fase 3 — Aplicar Estilo Visual por Marca

#### 🎸 LA Music School — Impacto e Contraste

```javascript
const STYLE_SCHOOL = {
  // Tipografia
  fontFamily: 'Montserrat',
  fontWeight: 700,               // Bold
  fontSize: 42,                  // px — grande para mobile
  textTransform: 'none',
  
  // Cores
  textColor: '#FFFFFF',
  highlightColor: '#E91E63',     // Pink — palavra-chave
  
  // Background da legenda
  bgEnabled: true,
  bgColor: 'rgba(0, 0, 0, 0.60)',  // preto 60% opacidade
  bgShape: 'pill',               // bordas arredondadas tipo pill
  bgPaddingH: 20,                // padding horizontal
  bgPaddingV: 8,                 // padding vertical
  bgBorderRadius: 50,            // pill shape
  
  // Sombra no texto
  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',  // drop shadow forte
  
  // Posição
  positionY: 1500,               // px do topo (em frame 1920px)
  positionX: 'center',
  
  // Animação
  animation: 'pop',              // aparecer com leve scale
};
```

**Exemplo visual School:**
```
┌─────────────────────────────────┐
│                                 │
│     [vídeo de guitarra]         │
│                                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │ A PALHETADA ALTERNADA é   │  │  ← bg preto 60%, pill
│  │ o segredo da velocidade   │  │  ← "ALTERNADA" em #E91E63
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

#### 🧠 SonoraMente LA — Suavidade e Acolhimento

```javascript
const STYLE_SONORAMENTE = {
  // Tipografia
  fontFamily: 'DM Sans',
  fontWeight: 500,               // Medium
  fontSize: 38,                  // ligeiramente menor, mais delicado
  textTransform: 'none',
  
  // Cores
  textColor: '#FFFFFF',
  highlightColor: '#B39DDB',     // Lavanda suave
  
  // Background da legenda
  bgEnabled: true,
  bgColor: 'rgba(61, 26, 110, 0.70)',  // roxo profundo 70%
  bgShape: 'rounded',
  bgPaddingH: 18,
  bgPaddingV: 10,
  bgBorderRadius: 16,
  
  // Sombra no texto
  textShadow: '1px 1px 3px rgba(0,0,0,0.5)',  // sombra suave
  
  // Posição
  positionY: 1480,
  positionX: 'center',
  
  // Animação
  animation: 'fade',             // fade in suave
};
```

**Exemplo visual SonoraMente:**
```
┌─────────────────────────────────┐
│                                 │
│  [vídeo de sessão de terapia]   │
│                                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │ A musicoterapia estimula  │  │  ← bg roxo 70%, rounded
│  │ conexões neurais          │  │  ← "musicoterapia" em #B39DDB
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

#### 🎨 LA Music Kids — Diversão e Cor

```javascript
const STYLE_KIDS = {
  // Tipografia
  fontFamily: 'Nunito',
  fontWeight: 700,               // Bold
  fontSize: 40,
  textTransform: 'none',
  
  // Cores
  textColor: '#FFFFFF',
  highlightColors: [             // Alternando cores do catavento!
    '#FF6B35',  // laranja
    '#4ECDC4',  // turquesa
    '#FFE66D',  // amarelo (com stroke preto para legibilidade)
    '#FF6B9D',  // rosa
  ],
  
  // Background da legenda
  bgEnabled: true,
  bgColor: 'rgba(0, 0, 0, 0.60)',  // preto 60%
  bgShape: 'rounded',
  bgPaddingH: 20,
  bgPaddingV: 10,
  bgBorderRadius: 20,           // mais arredondado
  
  // Sombra no texto
  textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
  
  // Posição
  positionY: 1500,
  positionX: 'center',
  
  // Animação
  animation: 'bounce',          // leve bounce divertido
};

// Highlight alternado — cada palavra-chave ganha cor diferente
function getHighlightColor(index) {
  return STYLE_KIDS.highlightColors[index % STYLE_KIDS.highlightColors.length];
}
```

**Exemplo visual Kids:**
```
┌─────────────────────────────────┐
│                                 │
│  [vídeo de criança tocando]     │
│                                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Música não é só            │  │  ← bg preto 60%, rounded
│  │ pra gente grande! 🎵      │  │  ← "Música" em #FF6B35
│  └───────────────────────────┘  │  ← "grande" em #4ECDC4
│                                 │
└─────────────────────────────────┘
```

### Fase 4 — Renderizar Legendas no Vídeo (Remotion)

**Componente Remotion para legendas:**
```javascript
// SubtitleOverlay.jsx — componente Remotion
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const SubtitleOverlay = ({ subtitles, style, highlightWords = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  
  // Encontrar legenda ativa
  const activeSub = subtitles.find(
    sub => currentTime >= sub.start && currentTime < sub.end
  );
  
  if (!activeSub) return null;
  
  // Animação de entrada
  const subFrame = (currentTime - activeSub.start) * fps;
  const opacity = interpolate(subFrame, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
  const scale = style.animation === 'pop'
    ? spring({ frame: subFrame, fps, config: { damping: 12, stiffness: 200 } })
    : style.animation === 'bounce'
    ? spring({ frame: subFrame, fps, config: { damping: 8, stiffness: 150 } })
    : 1;
  
  // Renderizar texto com highlights
  const renderText = (text) => {
    const words = text.split(' ');
    let highlightIndex = 0;
    
    return words.map((word, i) => {
      const isHighlight = highlightWords.some(
        hw => word.toLowerCase().includes(hw.toLowerCase())
      );
      
      const color = isHighlight
        ? (Array.isArray(style.highlightColor)
          ? style.highlightColors[highlightIndex++ % style.highlightColors.length]
          : style.highlightColor)
        : style.textColor;
      
      return (
        <span key={i} style={{ color, marginRight: '6px' }}>
          {word}
        </span>
      );
    });
  };
  
  return (
    <div style={{
      position: 'absolute',
      bottom: 1920 - style.positionY,
      left: 0, right: 0,
      display: 'flex',
      justifyContent: 'center',
      opacity,
      transform: `scale(${scale})`,
    }}>
      <div style={{
        background: style.bgEnabled ? style.bgColor : 'transparent',
        borderRadius: style.bgBorderRadius,
        padding: `${style.bgPaddingV}px ${style.bgPaddingH}px`,
        maxWidth: '90%',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          fontSize: style.fontSize,
          textShadow: style.textShadow,
          margin: 0,
          lineHeight: 1.3,
        }}>
          {renderText(activeSub.text)}
        </p>
      </div>
    </div>
  );
};

export default SubtitleOverlay;
```

**Uso na composição Remotion:**
```javascript
import { Composition, Video } from 'remotion';
import SubtitleOverlay from './SubtitleOverlay';

const MyVideo = ({ videoSrc, subtitles, brand }) => {
  const style = brand === 'la-music-school' ? STYLE_SCHOOL
    : brand === 'sonoramente' ? STYLE_SONORAMENTE
    : STYLE_KIDS;
  
  return (
    <>
      <Video src={videoSrc} />
      <SubtitleOverlay
        subtitles={subtitles}
        style={style}
        highlightWords={['musicoterapia', 'guitarra', 'música']}
      />
    </>
  );
};
```

### Fase 5 — Posicionamento e Zona Segura

**Mapa de zona segura para legendas (9:16 — 1080x1920):**
```
┌────────────────────┐ Y=0
│   Zona do header    │ 
│   Instagram         │ Y=0-120 ⚠️ NÃO colocar legendas
├────────────────────┤
│                    │
│   Área de vídeo    │
│   principal        │
│                    │
│                    │
├────────────────────┤ Y=1350
│                    │
│  ✅ ZONA SEGURA    │ Y=1400-1600 ← LEGENDAS AQUI
│  para legendas     │
│                    │
├────────────────────┤ Y=1700
│  ⚠️ Área do CTA    │
│  Instagram/nome    │ Y=1700-1920 ⚠️ NÃO cobrir
└────────────────────┘ Y=1920
```

**Regras de posicionamento:**
| Zona | Y range (px) | Pode colocar legenda? |
|------|-------------|----------------------|
| Header Instagram | 0-120 | ❌ Nunca |
| Área principal | 120-1350 | ❌ Evitar (só se necessário) |
| **Zona segura** | **1400-1600** | **✅ Ideal** |
| CTA/Nome Instagram | 1700-1920 | ❌ Nunca (coberto pelo app) |

### Fase 6 — Verificação e Entrega

**Checklist de verificação visual:**
- [ ] Legenda legível em tela de celular (simular 375px de largura)
- [ ] Fonte no tamanho mínimo de 38px (24px é muito pequeno na prática)
- [ ] Contraste suficiente (texto branco sobre background escuro)
- [ ] Highlight de palavras-chave na cor da marca
- [ ] Não cobre elementos visuais importantes do vídeo
- [ ] Posicionada na zona segura (Y 1400-1600)
- [ ] Não ultrapassa a zona do CTA do Instagram
- [ ] Sincronização precisa (legenda aparece quando palavra é dita)
- [ ] Máximo 2 linhas por frame
- [ ] Cada bloco de legenda dura 2-4 segundos
- [ ] Animação de entrada suave (não abrupta)

**Teste de legibilidade:**
```javascript
// Gerar frame de preview para verificação
async function generateSubtitlePreview(videoPath, timestamp, subtitleStyle) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  
  // Renderizar frame do vídeo + legenda overlay
  // ... (extrair frame com ffmpeg, montar HTML com legenda)
  
  await page.screenshot({ path: 'subtitle_preview.png' });
  await browser.close();
}
```

## Veto Conditions — NUNCA
- NUNCA publicar vídeo sem legendas — 85% do Instagram é assistido sem som
- NUNCA usar fonte menor que 38px (ilegível em mobile)
- NUNCA colocar legendas na zona do CTA do Instagram (Y > 1700px)
- NUNCA colocar legendas no header (Y < 120px)
- NUNCA ultrapassar 2 linhas por frame de legenda
- NUNCA deixar legenda mais de 4 segundos na tela (dividir em blocos)
- NUNCA usar estilo de legenda de uma marca em vídeo de outra
- NUNCA entregar sem verificar sincronização (legenda = momento da fala)
- NUNCA usar highlight amarelo (#FFE66D) da Kids sem stroke/shadow (ilegível sobre fundo claro)
- NUNCA cobrir rostos ou elementos visuais importantes com a legenda

## Checklist de Conclusão
- [ ] Texto obtido (roteiro existente ou transcrição automática)
- [ ] Timestamps sincronizados com o áudio/vídeo
- [ ] Formatação aplicada (max 2 linhas, max 8 palavras, 2-4s por bloco)
- [ ] Estilo visual da marca aplicado (fonte, cor, background, highlight)
- [ ] Palavras-chave destacadas na cor da marca
- [ ] Posição na zona segura (Y 1400-1600px)
- [ ] Arquivo SRT gerado como backup editável
- [ ] Legibilidade verificada em simulação mobile
- [ ] Sincronização precisa conferida
- [ ] Preview frame enviado para Nina aprovar estilo
- [ ] Vídeo legendado renderizado e salvo no Supabase Storage

## Integrações
- **Remotion** — renderização de legendas sobre vídeo na VPS
- **OpenAI Whisper API** — transcrição automática de áudio para texto com timestamps
- **Gemini API** — alternativa gratuita de transcrição
- **FFmpeg** — extração de áudio do vídeo, manipulação de mídia
- **Puppeteer** — geração de preview frames para verificação
- **Supabase Storage** — armazenamento de vídeos legendados e SRTs
- **Design Systems** — estilos visuais por marca
