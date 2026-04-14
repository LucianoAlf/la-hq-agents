---
name: motion-graphics
description: Skill para criar motion graphics reutilizáveis — logos animados, intros, transições e elementos decorativos animados — usando Remotion. Assets que são usados repetidamente em vídeos, reels e stories animados. Use quando Carla precisa criar ou manter a biblioteca de motion assets.
---

# Motion Graphics

## Entrada
| Campo | Tipo | Origem | Obrigatório |
|-------|------|--------|-------------|
| tipo | string | Nina ou Carla ("logo_animado", "intro", "transicao", "elemento_decorativo", "lower_third") | Sim |
| marca | string | Briefing ("la-music-school", "la-music-kids", "sonoramente") | Sim |
| duração | string | Carla ("1s", "2s", "3s", "5s") | Não (default por tipo) |
| fps | int | Carla (30 ou 60) | Não (default: 30) |
| transparente | boolean | Carla (fundo transparente para composição) | Não (default: true) |

## Saída
| Campo | Tipo | Destino |
|-------|------|---------|
| componente_remotion | arquivo JSX | Biblioteca de componentes → reuso em reels e stories |
| mp4_preview | arquivo MP4 | Supabase Storage → preview para Nina |
| webm_transparente | arquivo WebM | Supabase Storage → versão com alpha (se transparente) |
| media_asset | registro | Supabase → tabela media_assets (tag: motion) |

## Fases de Execução

### Fase 1 — Identificar Tipo e Especificações

| Tipo | Duração padrão | Uso | Prioridade de criação |
|------|---------------|-----|----------------------|
| **Logo animado** | 2-3s | Abertura/encerramento de reels | Alta (criar primeiro) |
| **Intro** | 2-3s (máx) | Início de reels e vídeos | Alta |
| **Transição** | 0.5-1s | Entre cenas de um reel | Média |
| **Elemento decorativo** | Loop 2-5s | Background animado, confetti, partículas | Média |
| **Lower third** | 3-5s | Nome/título sobreposto ao vídeo | Baixa |

### Fase 2 — Assets de Motion por Marca

#### 🎸 LA Music School — Energia e Impacto

**Logo animado:**
```javascript
// LogoSchool.jsx — Logo com diagonal pink slide-in
const LogoSchool = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Diagonal pink entra da esquerda
  const diagonalX = interpolate(frame, [0, 15], [-1200, 0], {
    extrapolateRight: 'clamp'
  });
  
  // Logo faz scale-in com spring
  const logoScale = spring({ frame: frame - 10, fps, config: {
    damping: 10, stiffness: 180
  }});
  
  // Texto faz slide-up com fade
  const textY = interpolate(frame, [18, 28], [30, 0], { extrapolateRight: 'clamp' });
  const textOpacity = interpolate(frame, [18, 28], [0, 1], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Diagonal pink stripe */}
      <div style={{
        position: 'absolute', width: '150%', height: 120,
        background: '#E91E63', transform: `rotate(-8deg) translateX(${diagonalX}px)`,
      }} />
      
      {/* Logo */}
      <img src={logoBase64} style={{
        width: 200, transform: `scale(${logoScale})`, zIndex: 2,
      }} />
      
      {/* Slogan */}
      <p style={{
        fontFamily: 'Bebas Neue', fontSize: 28, color: '#FFFFFF',
        transform: `translateY(${textY}px)`, opacity: textOpacity,
        marginTop: 16, zIndex: 2,
      }}>
        PRA QUEM SABE O QUE QUER!
      </p>
    </AbsoluteFill>
  );
};
```

**Transição:** wipe diagonal pink (-8°), 0.5s, da esquerda para direita
**Elementos decorativos:** notas musicais pink flutuando, flash/pulse no beat, partículas de energia

#### 🧠 SonoraMente LA — Suavidade e Acolhimento

**Logo animado:**
```javascript
// LogoSonora.jsx — Logo com fade lavanda + ondas sonoras
const LogoSonora = () => {
  const frame = useCurrentFrame();
  
  // Fundo: gradiente roxo fade-in
  const bgOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  
  // Ondas sonoras pulsando suavemente
  const waveScale = 1 + Math.sin(frame * 0.1) * 0.05;
  
  // Logo fade-in gentil
  const logoOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: 'clamp' });
  const logoY = interpolate(frame, [15, 35], [20, 0], { extrapolateRight: 'clamp' });
  
  // Slogan fade-in depois do logo
  const sloganOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{
      background: `rgba(61, 26, 110, ${bgOpacity})`,
      justifyContent: 'center', alignItems: 'center',
    }}>
      {/* Ondas sonoras de fundo */}
      <div style={{
        position: 'absolute', transform: `scale(${waveScale})`,
        opacity: 0.15,
        /* SVG de ondas sonoras */
      }} />
      
      {/* Logo */}
      <img src={logoBase64} style={{
        width: 180, opacity: logoOpacity,
        transform: `translateY(${logoY}px)`,
      }} />
      
      {/* Slogan em itálico */}
      <p style={{
        fontFamily: 'Playfair Display', fontStyle: 'italic',
        fontSize: 22, color: '#B39DDB', opacity: sloganOpacity,
        marginTop: 12,
      }}>
        onde o som cuida da mente
      </p>
    </AbsoluteFill>
  );
};
```

**Transição:** crossfade suave, 0.8s, dissolve
**Elementos decorativos:** ondas sonoras pulsando, partículas lavanda flutuando, gradiente aurora suave

#### 🎨 LA Music Kids — Diversão e Movimento

**Logo animado:**
```javascript
// LogoKids.jsx — Logo com catavento girando + confetti
const LogoKids = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Catavento gira (360° em 2s)
  const rotation = interpolate(frame, [0, 60], [0, 360]);
  
  // Logo bounce-in
  const logoScale = spring({ frame: frame - 5, fps, config: {
    damping: 5, stiffness: 120, mass: 0.5,
  }});
  
  // Confetti (4 cores do catavento)
  const confettiColors = ['#FF6B35', '#4ECDC4', '#FFE66D', '#FF6B9D'];
  
  // Slogan pop-in
  const sloganScale = spring({ frame: frame - 30, fps, config: {
    damping: 6, stiffness: 150,
  }});
  
  return (
    <AbsoluteFill style={{
      background: '#FFFFFF',
      justifyContent: 'center', alignItems: 'center',
    }}>
      {/* Confetti animado */}
      {confettiColors.map((color, i) => (
        <ConfettiParticle key={i} color={color} delay={i * 3} />
      ))}
      
      {/* Catavento girando */}
      <div style={{
        transform: `rotate(${rotation}deg) scale(${logoScale})`,
        /* SVG do catavento */
      }} />
      
      {/* Logo */}
      <img src={logoBase64} style={{
        width: 180, transform: `scale(${logoScale})`,
      }} />
      
      {/* Slogan */}
      <p style={{
        fontFamily: 'Baloo 2', fontSize: 24, color: '#2D3436',
        transform: `scale(${sloganScale})`, marginTop: 12,
      }}>
        música não é só pra gente grande
      </p>
    </AbsoluteFill>
  );
};
```

**Transição:** wipe colorido (cada frame numa cor do catavento), 0.5s, bounce
**Elementos decorativos:** confetti 4 cores, notas musicais coloridas flutuando, estrelas piscando

### Fase 3 — Especificações Técnicas

| Parâmetro | Valor |
|-----------|-------|
| Resolução | 1080 × 1920 (composição 9:16) ou tamanho do elemento |
| FPS | 30 (padrão) ou 60 (motion suave) |
| Codec vídeo | H.264 (MP4) ou VP9 (WebM com alpha) |
| Fundo | Transparente quando possível (WebM) ou cor sólida (MP4) |
| Duração | 0.5-5s conforme tipo |
| Peso | < 5MB por asset |

**Renderizar com transparência (WebM):**
```bash
npx remotion render src/index.tsx logo-school \
  --output=logo_school.webm \
  --codec=vp8 \
  --fps=30 \
  --width=1080 \
  --height=1920

# Preview MP4 (para Nina aprovar)
npx remotion render src/index.tsx logo-school \
  --output=logo_school_preview.mp4 \
  --codec=h264 \
  --fps=30
```

### Fase 4 — Organizar Biblioteca de Motion Assets

**Salvar como componente Remotion reutilizável:**
```
/remotion/components/motion/
├── school/
│   ├── LogoSchool.jsx
│   ├── IntroSchool.jsx
│   ├── TransitionSchool.jsx
│   └── ParticlesSchool.jsx
├── sonoramente/
│   ├── LogoSonora.jsx
│   ├── IntroSonora.jsx
│   ├── TransitionSonora.jsx
│   └── WavesSonora.jsx
└── kids/
    ├── LogoKids.jsx
    ├── IntroKids.jsx
    ├── TransitionKids.jsx
    └── ConfettiKids.jsx
```

**Catalogar na Media Library:**
```sql
INSERT INTO media_assets (
  office_id, brand, type, file_url,
  source, tags, model_used,
  width, height, duration_seconds,
  created_by
) VALUES (
  $1, $2, 'motion', $3,
  'remotion', ARRAY['motion', 'logo', 'animacao', $2]::text[], 'remotion',
  1080, 1920, $4,
  'carla'
);
```

## Veto Conditions — NUNCA
- NUNCA motion exagerado ou amador — suave e profissional
- NUNCA intros acima de 3 segundos (atenção é curta)
- NUNCA cores fora da paleta da marca
- NUNCA misturar elementos de marcas (diagonal pink num motion do SonoraMente)
- NUNCA animação que distrai do conteúdo principal (motion é suporte, não protagonista)
- NUNCA entregar sem preview para Nina aprovar

## Checklist de Conclusão
- [ ] Tipo de motion identificado (logo, intro, transição, elemento, lower third)
- [ ] Design System da marca aplicado nas cores e animações
- [ ] Componente Remotion criado e reutilizável
- [ ] Duração dentro do padrão (0.5-5s conforme tipo)
- [ ] Animação suave e profissional (não amadora)
- [ ] WebM com transparência gerado (se aplicável)
- [ ] MP4 preview gerado para aprovação
- [ ] Catalogado na Media Library com tags corretas
- [ ] Salvo na estrutura de pastas de componentes

## Integrações
- **Remotion (VPS)** — composição e renderização de motion graphics
- **Supabase Storage** — armazenamento de MP4/WebM
- **Supabase (media_assets)** — catalogação na Media Library
- **Design Systems** — referência de cores, elementos e estilo por marca
