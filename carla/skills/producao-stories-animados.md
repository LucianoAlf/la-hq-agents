---
name: producao-stories-animados
description: Skill para produzir Stories animados (9:16, 15 segundos exatos) com transições e elementos interativos usando Remotion. Diferente do story estático do Diego — este tem MOVIMENTO. Use quando Carla precisa criar um story com animação.
---

# Produção de Stories Animados

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| briefing | documento | Nina (conceito, timing, mensagem) | Sim |
| assets[] | lista asset_ids | Luna (imagens, elementos) | Sim |
| copy | texto | Theo (frase curta, se aplicável) | Não |
| marca | string | Briefing ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| tipo_animação | string | Nina ("reveal", "countdown", "before_after", "slide_sequence", "pulse", "parallax") | Sim |
| trilha_sonora | asset_id | Luna/humano (música de fundo, opcional) | Não |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| mp4_story | arquivo MP4 (1080x1920, 15s exatos) | Supabase Storage |
| output_registro | registro | Supabase → tabela outputs |
| preview_url | URL | Nina → aprovação |

## Fases de Execução

### Fase 1 — Interpretar Briefing e Tipo de Animação

**Tipos de story animado e quando usar:**

| Tipo | Efeito | Quando usar | Duração total |
|------|--------|-------------|---------------|
| **Reveal** | Texto ou imagem se revela progressivamente | Revelar novidade, resultado, surpresa | 15s |
| **Countdown** | Contagem regressiva animada | Evento próximo, lançamento, urgência | 15s |
| **Before/After** | Transição entre dois estados | Resultado de aula, progresso, transformação | 15s |
| **Slide sequence** | Slides animados em sequência | Mini-carrossel em vídeo, dicas rápidas | 15s |
| **Pulse** | Elemento pulsa/respira com ritmo | Frase de impacto, chamada emocional | 15s |
| **Parallax** | Camadas se movem em velocidades diferentes | Visual premium, profundidade | 15s |

### Fase 2 — Montar Composição Remotion

**Estrutura base do story animado:**
```javascript
// AnimatedStory.jsx
import { Composition, AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';

const AnimatedStory = ({ type, assets, copy, brand }) => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill style={{ background: getBgColor(brand) }}>
      {/* Conteúdo dentro da zona segura */}
      <div style={{
        position: 'absolute',
        top: 150, bottom: 200,   // zona segura: Y=150 a Y=1720
        left: 60, right: 60,     // margens laterais
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <AnimationType type={type} frame={frame} assets={assets} copy={copy} brand={brand} />
      </div>
      
      {/* Logo no canto inferior (dentro da zona segura) */}
      <LogoWatermark brand={brand} y={1650} />
    </AbsoluteFill>
  );
};

// Registrar com 15s EXATOS
export const RemotionRoot = () => (
  <Composition
    id="animated-story"
    component={AnimatedStory}
    durationInFrames={450}   // 15s × 30fps = 450 frames EXATOS
    fps={30}
    width={1080}
    height={1920}
  />
);
```

### Fase 3 — Animações por Tipo

**Reveal (revelar progressivamente):**
```javascript
const RevealAnimation = ({ frame, copy, brand }) => {
  // Máscara que sobe revelando o texto/imagem
  const revealY = interpolate(frame, [60, 180], [100, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
  });
  
  // Texto aparece por trás da máscara
  return (
    <div style={{ overflow: 'hidden' }}>
      <h1 style={{
        fontFamily: getDisplayFont(brand),
        fontSize: 56, color: '#FFFFFF',
        transform: `translateY(${revealY}%)`,
      }}>
        {copy}
      </h1>
    </div>
  );
};
// Timeline: 0-2s espera, 2-6s revela, 6-12s segura, 12-15s CTA
```

**Countdown (contagem regressiva):**
```javascript
const CountdownAnimation = ({ frame, targetDate, brand }) => {
  // Números grandes que trocam com flip/bounce
  const currentSecond = Math.floor(frame / 30);
  const numbers = [5, 4, 3, 2, 1];
  
  return numbers.map((num, i) => {
    const showFrom = i * 75;  // 2.5s por número
    const showUntil = showFrom + 75;
    if (frame < showFrom || frame >= showUntil) return null;
    
    const localFrame = frame - showFrom;
    const scale = spring({ frame: localFrame, fps: 30, config: { damping: 8 } });
    
    return (
      <h1 key={num} style={{
        fontFamily: getDisplayFont(brand),
        fontSize: 200, color: getAccentColor(brand),
        transform: `scale(${scale})`,
      }}>
        {num}
      </h1>
    );
  });
};
// Timeline: 5 números × 2.5s = 12.5s + 2.5s para CTA final = 15s
```

**Before/After (transição entre estados):**
```javascript
const BeforeAfterAnimation = ({ frame, beforeImg, afterImg, brand }) => {
  // Linha divisória que se move da esquerda para direita
  const dividerX = interpolate(frame, [90, 360], [0, 100], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
  });
  
  return (
    <>
      <img src={afterImg} style={{ position: 'absolute', width: '100%' }} />
      <div style={{
        position: 'absolute', width: `${dividerX}%`, overflow: 'hidden',
      }}>
        <img src={beforeImg} style={{ width: 1080 }} />
      </div>
      <div style={{
        position: 'absolute', left: `${dividerX}%`,
        width: 4, height: '100%', background: getAccentColor(brand),
      }} />
    </>
  );
};
// Timeline: 0-3s "Antes" label, 3-12s transição, 12-15s "Depois" + CTA
```

### Fase 4 — Estilo de Animação por Marca

| Aspecto | School | SonoraMente | Kids |
|---------|--------|-------------|------|
| Velocidade | Rápida, enérgica | Lenta, suave | Média, divertida |
| Easing | Sharp, snappy | Gentle, ease-in-out | Bouncy, overshoot |
| Spring damping | 8-10 (pouco bounce) | 15-20 (sem bounce) | 5-6 (muito bounce) |
| Cores de animação | Pink #E91E63, flash branco | Roxo #5B2D8E, fade lavanda | 4 cores rotativas |
| Elemento decorativo | Diagonal stripe animada | Ondas sonoras pulsando | Confetti, estrelas |
| Transição interna | Wipe, slide rápido | Fade, dissolve | Pop, bounce |

### Fase 5 — Zona Segura e CTA

**Mesma zona segura dos stories estáticos (ver skill montagem-stories):**
- Conteúdo principal: Y = 150 a 1400px
- CTA / fechamento: Y = 1400 a 1720px
- NUNCA: Y < 150 ou Y > 1720

**CTA animado no terço inferior (últimos 3s do story):**
```javascript
// CTA aparece nos últimos 3s (frame 360-450)
<Sequence from={360}>
  <div style={{
    position: 'absolute', bottom: 250,
    left: 0, right: 0, textAlign: 'center',
  }}>
    <button style={{
      fontFamily: getDisplayFont(brand),
      fontSize: 24, padding: '16px 40px',
      background: getAccentColor(brand),
      color: '#FFFFFF', borderRadius: 50, border: 'none',
      transform: `scale(${spring({ frame: useCurrentFrame() - 360, fps: 30 })})`,
    }}>
      {ctaText}
    </button>
  </div>
</Sequence>
```

### Fase 6 — Renderizar e Entregar

```bash
# Renderizar story animado — 15 SEGUNDOS EXATOS
npx remotion render src/index.tsx animated-story \
  --output=story_${marca}_${tipo}_${data}.mp4 \
  --codec=h264 \
  --fps=30 \
  --width=1080 \
  --height=1920 \
  --quality=80
```

**Verificação obrigatória:**
- [ ] Duração = 15.000s EXATOS (verificar com `ffprobe`)
- [ ] Loop-friendly: último frame compatível com primeiro (se possível)
- [ ] Mensagem legível mesmo passando rápido
- [ ] CTA visível no terço inferior nos últimos 3s
- [ ] Conteúdo dentro da zona segura
- [ ] Animação suave, sem stutter ou frame drop

```bash
# Verificar duração exata
ffprobe -v error -show_entries format=duration -of csv=p=0 story_final.mp4
# Deve retornar: 15.000000
```

## Veto Conditions — NUNCA
- NUNCA duração diferente de 15 segundos exatos (nem 14.9s nem 15.1s)
- NUNCA conteúdo fora da zona segura (Y 150-1720)
- NUNCA sem Design System da marca nas cores e animações
- NUNCA animação tão rápida que a mensagem se perde
- NUNCA animação tão lenta que fica entediante
- NUNCA sem CTA nos últimos 3 segundos
- NUNCA estilo de animação de uma marca em story de outra

## Checklist de Conclusão
- [ ] Briefing interpretado (tipo de animação, conceito, timing)
- [ ] Composição Remotion montada (1080x1920, 450 frames, 30fps)
- [ ] Tipo de animação implementado (reveal/countdown/before_after/etc.)
- [ ] Estilo de animação adequado à marca (velocidade, easing, cores)
- [ ] Conteúdo dentro da zona segura
- [ ] CTA animado nos últimos 3 segundos
- [ ] 15 segundos EXATOS verificados com ffprobe
- [ ] Loop-friendly quando possível
- [ ] MP4 renderizado e reprodução testada
- [ ] Upload Supabase Storage + output registrado
- [ ] Preview enviado para Nina aprovar

## Integrações
- **Remotion (VPS)** — composição e renderização de stories animados
- **FFmpeg/FFprobe** — verificação de duração, conversão
- **Supabase Storage** — upload do MP4 final
- **Supabase (outputs)** — registro do story produzido
- **Skill motion-graphics** — componentes reutilizáveis (intros, transições)
- **Design Systems** — identidade visual por marca
