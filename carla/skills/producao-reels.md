---
name: producao-reels
description: Skill para produzir Reels animados (9:16) usando Remotion na VPS. Use sempre que Carla precisa criar vídeo curto para Instagram Reels — combinando assets da Luna, copy do Theo, roteiro da Nina e legendas automáticas.
---

# Produção de Reels

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| roteiro | documento | Nina (skill briefing-criativo — briefing de vídeo) | Sim |
| assets[] | lista asset_ids | Luna (imagens, elementos, backgrounds) | Sim |
| copy_telas[] | lista textos | Theo (textos por cena, se aplicável) | Não |
| marca | string | Briefing ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| duração | string | Nina ("15s", "30s", "60s") | Sim |
| trilha_sonora | asset_id ou URL | Luna/humano (música de fundo) | Não |
| narração | asset_id | Humano (áudio narrado) ou TTS | Não |
| legendas | boolean | Default: true (obrigatório) | Sim |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| vídeo_mp4 | arquivo MP4 (1080x1920, H.264, AAC) | Supabase Storage |
| output_registro | registro | Supabase → tabela outputs |
| preview_url | URL | Nina → aprovação |
| thumbnail | PNG | Tina → publicação (cover do reel) |

## Fases de Execução

### Fase 1 — Interpretar Roteiro

O roteiro da Nina segue o formato do briefing de vídeo:
```
[00-02s] GANCHO: [visual/texto que prende — obrigatório]
[02-08s] DESENVOLVIMENTO: [conteúdo principal]
[08-12s] PROVA/EXEMPLO: [demonstração, dado, depoimento]
[12-15s] CTA: [fechamento + ação]
```

**Extrair do roteiro:**
- Timing de cada cena (em frames: 1s = 30 frames a 30fps)
- Assets necessários por cena
- Texto/copy por cena
- Tipo de transição entre cenas
- Trilha sonora e timing de narração

**Conversão duração → frames:**
| Duração | Total frames (30fps) |
|---------|---------------------|
| 15s | 450 frames |
| 30s | 900 frames |
| 60s | 1800 frames |

### Fase 2 — Montar Composição Remotion

**Estrutura base do Reel em Remotion:**
```javascript
// ReelComposition.jsx
import { Composition, AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { Img, Video, Audio } from 'remotion';

const ReelVideo = ({ scenes, brand, audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  return (
    <AbsoluteFill style={{ backgroundColor: getBgColor(brand) }}>
      {/* Cenas em sequência */}
      {scenes.map((scene, i) => (
        <Sequence
          key={i}
          from={scene.startFrame}
          durationInFrames={scene.durationFrames}
        >
          <SceneComponent
            scene={scene}
            brand={brand}
          />
        </Sequence>
      ))}
      
      {/* Trilha sonora */}
      {audioSrc && (
        <Audio src={audioSrc} volume={0.3} />
      )}
      
      {/* Legendas (skill legendas-automaticas) */}
      <SubtitleOverlay
        subtitles={subtitles}
        style={getSubtitleStyle(brand)}
      />
      
      {/* Logo da marca no canto (últimos 3s) */}
      <Sequence from={durationInFrames - 90}>
        <LogoWatermark brand={brand} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Registrar composição
export const RemotionRoot = () => (
  <Composition
    id="reel"
    component={ReelVideo}
    durationInFrames={450}  // 15s a 30fps
    fps={30}
    width={1080}
    height={1920}
  />
);
```

**Componente de cena com animação:**
```javascript
// SceneComponent.jsx
import { useCurrentFrame, interpolate, spring } from 'remotion';

const SceneComponent = ({ scene, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Animação de entrada (varia por marca)
  const enterAnimation = getEnterAnimation(brand, frame, fps);
  
  return (
    <AbsoluteFill style={{
      ...enterAnimation,
      padding: 60,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* Background/imagem da cena */}
      {scene.backgroundImage && (
        <Img src={scene.backgroundImage} style={{
          position: 'absolute', width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0
        }} />
      )}
      
      {/* Overlay para legibilidade */}
      <div style={{
        position: 'absolute', width: '100%', height: '100%',
        background: getOverlay(brand), zIndex: 1
      }} />
      
      {/* Conteúdo da cena */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        {scene.title && (
          <h1 style={{
            fontFamily: getDisplayFont(brand),
            fontSize: 56,
            color: '#FFFFFF',
            textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
            ...getTitleAnimation(brand, frame, fps)
          }}>
            {scene.title}
          </h1>
        )}
        {scene.body && (
          <p style={{
            fontFamily: getBodyFont(brand),
            fontSize: 28,
            color: '#FFFFFF',
            marginTop: 20,
            lineHeight: 1.4,
          }}>
            {scene.body}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
```

### Fase 3 — Animações por Marca

#### 🎸 LA Music School — Energia e Impacto
```javascript
function getSchoolAnimations(frame, fps) {
  return {
    // Entrada: slide rápido da esquerda
    enter: {
      transform: `translateX(${interpolate(frame, [0, 8], [-1080, 0], {
        extrapolateRight: 'clamp'
      })}px)`
    },
    // Transição entre cenas: wipe diagonal (diagonal pink)
    transition: 'wipe-diagonal',
    // Texto: typewriter rápido ou slam (escala de grande para normal)
    titleEffect: {
      transform: `scale(${spring({ frame, fps, config: { damping: 8, stiffness: 200 } })})`,
    },
    // Ritmo: cortes rápidos (2-3s por cena)
    pacing: 'fast',
    // Efeitos extras: shake sutil no beat, flash no drop
  };
}
```

**Transições School:** slide rápido, wipe diagonal, zoom in/out, glitch sutil
**Ritmo:** cortes rápidos (2-3s por cena), energia alta
**Cor de overlay:** `rgba(10, 10, 10, 0.5)` — escuro para contraste

#### 🧠 SonoraMente LA — Suavidade e Calma
```javascript
function getSonoraAnimations(frame, fps) {
  return {
    // Entrada: fade in suave (20 frames = 0.66s)
    enter: {
      opacity: interpolate(frame, [0, 20], [0, 1], {
        extrapolateRight: 'clamp'
      })
    },
    // Transição: dissolve/crossfade
    transition: 'crossfade',
    // Texto: fade up gentil
    titleEffect: {
      opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
      transform: `translateY(${interpolate(frame, [0, 15], [30, 0], {
        extrapolateRight: 'clamp'
      })}px)`
    },
    // Ritmo: cenas longas (4-5s), respiração entre transições
    pacing: 'slow',
  };
}
```

**Transições SonoraMente:** fade/dissolve, crossfade, morph suave
**Ritmo:** cenas mais longas (4-5s), ritmo calmo e acolhedor
**Cor de overlay:** `rgba(61, 26, 110, 0.4)` — roxo translúcido

#### 🎨 LA Music Kids — Diversão e Movimento
```javascript
function getKidsAnimations(frame, fps) {
  return {
    // Entrada: bounce divertido
    enter: {
      transform: `scale(${spring({ frame, fps, config: {
        damping: 6, stiffness: 150, mass: 0.5
      } })})`,
    },
    // Transição: pop/bounce, slide colorido
    transition: 'bounce-pop',
    // Texto: pop com overshoot
    titleEffect: {
      transform: `scale(${spring({ frame, fps, config: {
        damping: 5, stiffness: 120
      } })}) rotate(${interpolate(frame, [0, 10], [-3, 0], {
        extrapolateRight: 'clamp'
      })}deg)`,
    },
    // Ritmo: médio (3-4s por cena), energético mas não frenético
    pacing: 'medium',
  };
}
```

**Transições Kids:** bounce, pop, slide colorido, wipe com cor do catavento
**Ritmo:** médio (3-4s), energético mas não frenético — divertido, não caótico
**Cor de overlay:** `rgba(0, 0, 0, 0.3)` — leve, para manter cores vibrantes

### Fase 4 — Adicionar Legendas

**Obrigatório em todo reel** — 85% do Instagram é assistido sem som.

Usar a skill **legendas-automaticas** da Carla:
- Se tem narração: transcrever com Whisper e sincronizar
- Se é só texto animado: legendas já são o conteúdo visual
- Estilo visual segue o Design System da marca (ver legendas-automaticas Fase 3)

### Fase 5 — Renderizar MP4

**Comando de renderização Remotion:**
```bash
# Renderizar reel com Remotion CLI
npx remotion render src/index.tsx reel \
  --output=output/reel_${marca}_${data}.mp4 \
  --codec=h264 \
  --fps=30 \
  --width=1080 \
  --height=1920 \
  --quality=80 \
  --concurrency=2

# Se precisar adicionar áudio externo (trilha + narração)
ffmpeg -i reel_sem_audio.mp4 -i trilha.mp3 -i narracao.mp3 \
  -filter_complex "[1:a]volume=0.3[trilha];[2:a]volume=1.0[narr];[trilha][narr]amix=inputs=2[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k \
  reel_final.mp4
```

**Especificações técnicas do MP4:**
| Parâmetro | Valor |
|-----------|-------|
| Resolução | 1080 × 1920 (9:16) |
| FPS | 30 |
| Codec vídeo | H.264 |
| Codec áudio | AAC, 128kbps |
| Duração | 15s / 30s / 60s (exato) |
| Tamanho máx | < 100MB (limite Instagram) |
| Bitrate sugerido | 8-12 Mbps |

### Fase 6 — Verificar e Entregar

**Checklist de verificação do reel:**
- [ ] Gancho forte nos primeiros 2 segundos (alguém pararia de scrollar?)
- [ ] Legendas presentes, legíveis e sincronizadas
- [ ] Design System da marca aplicado (cores, fontes, elementos)
- [ ] Transições suaves, sem cortes bruscos não intencionais
- [ ] Sem frame preto no início ou final
- [ ] Duração exata conforme solicitado (15s/30s/60s)
- [ ] Áudio funcional (trilha + narração balanceados)
- [ ] Reprodução testada do início ao fim sem travamento
- [ ] Logo da marca visível (pelo menos nos últimos 3s)

**Gerar thumbnail para cover:**
```bash
# Extrair frame do momento mais impactante como thumbnail
ffmpeg -i reel_final.mp4 -ss 00:00:01 -vframes 1 -q:v 2 thumbnail.png
```

**Upload e registro:**
```sql
INSERT INTO outputs (
  office_id, task_id, brand, type, format,
  file_urls, duration_seconds,
  rendered_by, status, created_at
) VALUES (
  $1, $2, $3, 'reel', '1080x1920',
  ARRAY[$4], $5,
  'carla', 'ready_for_review', NOW()
);
```

## Veto Conditions — NUNCA
- NUNCA sem gancho nos primeiros 2 segundos (o scroll não perdoa)
- NUNCA sem legendas (85% assiste sem som — sem exceção)
- NUNCA frame preto no início ou final (parece erro)
- NUNCA duração acima do especificado (15s/30s/60s exatos)
- NUNCA sem identidade visual da marca nas animações e cores
- NUNCA transição da School num reel do SonoraMente (cada marca tem seu ritmo)
- NUNCA entregar sem testar reprodução completa do início ao fim
- NUNCA áudio desbalanceado (narração inaudível sobre trilha alta)
- NUNCA sem logo da marca visível

## Checklist de Conclusão
- [ ] Roteiro da Nina interpretado (timing, cenas, assets)
- [ ] Composição Remotion montada com cenas em sequência
- [ ] Animações e transições adequadas à marca aplicadas
- [ ] Legendas adicionadas via skill legendas-automaticas
- [ ] Áudio mixado (trilha + narração, se aplicável)
- [ ] MP4 renderizado (H.264, 30fps, 1080x1920)
- [ ] Gancho verificado nos primeiros 2 segundos
- [ ] Reprodução testada sem erros do início ao fim
- [ ] Thumbnail gerada para cover
- [ ] Upload para Supabase Storage
- [ ] Output registrado com status ready_for_review
- [ ] Preview enviado para Nina aprovar

## Integrações
- **Remotion (VPS)** — composição e renderização de vídeo React
- **FFmpeg** — mixagem de áudio, extração de thumbnail, conversão
- **Supabase Storage** — upload do MP4 final
- **Supabase (outputs)** — registro do reel produzido
- **Skill legendas-automaticas** — adição de legendas sincronizadas
- **Skill exportacao-renderizacao** — referência para configuração da VPS
- **Design Systems** — identidade visual por marca
