# WATCHKNIGHT_OS // SYS.96 — Architectural & Design Rules

## 1. Core Identity & Unifying Metaphor
- **Developer:** Abdur Rahman Moayed (`@watchknight`), Computer Science & Engineering (CSE) Undergraduate at East West University, Dhaka, Bangladesh (`23.7644° N, 90.4252° E`, `UTC+6`).
- **Aesthetic Paradigm:** "The 1996 Cyberdeck Workstation Rendering a Real-Time 3D Volumetric Particle Engine" (`WATCHKNIGHT_OS // SYS.96`).
- **Strict Ban on Legacy Styles:** Never use terracotta (`#D9532F`, `#A74024`, `#FF4D1C`), muted sage (`#4E9A7F`), generic dark-grey noise cards, or modern `rounded-2xl` pill boxes. All containers must use sharp 90s Retro-OS window chrome with `2px` beveled borders and `[ - ] [ + ] [ x ]` titlebar controls.

## 2. Dual-Register Cyber-CRT Color Tokens
Enforce these exact CSS custom properties across all stylesheets and shader uniforms:
- `--crt-void-bg`: `#070814` (Primary 3D scene & CRT background void for additive bloom)
- `--crt-phosphor-dark`: `#0D1512` (Inner 90s CRT terminal & workstation screen fill)
- `--crt-panel-slate`: `#131629` (Elevated cyberdeck module surface)
- `--crt-bezel-putty`: `#D6CFC2` (Outer 90s monitor hardware bezel & retro titlebars)
- `--crt-bezel-shadow`: `#2D3645` (Beveled 90s hardware shadow border)
- `--tech-cyan-wave`: `#00F0FF` (3D particle wave troughs, wireframe grids, and `> COMMAND` nav prompts)
- `--tech-magenta-crest`: `#FF2A85` (3D particle wave crests, velocity peaks, and shader badges)
- `--pixel-phosphor-green`: `#4AF626` (90s CRT `[1]`–`[4]` bracket menus, terminal stdout, and power LEDs)
- `--pixel-amber-gold`: `#FFCC00` (Arcade telemetry readouts, star counters, and cursor focal sparks)
- `--pixel-ivory-text`: `#F0EFE6` (Warm NTSC-calibrated off-white `1.04R, 1.01G, 0.95B` for high-contrast body text)

## 3. Typography & CRT Optical Safety
- **Pixel Display & Menus:** Use `'Press Start 2P'` and `'VT323'` at integer pixel sizes (`16px`, `24px`, `32px`, `48px`) with `-webkit-font-smoothing: none` and `image-rendering: pixelated`.
- **Technical Body & Code:** Use `'JetBrains Mono'` and `'Plus Jakarta Sans'` for long-form case studies and terminal telemetry.
- **Readability Guardrails:** Cap scanline overlay opacity over text containers between `0.04` and `0.08`, cap CRT barrel distortion at `0.04` (`4%`), and always preserve the interactive `[ CRT FX: FULL / LITE / OFF ]` bezel switch and `prefers-reduced-motion` fallbacks.

## 4. Three.js, WebGL & Post-Processing Discipline
- **GPU-Only Wave Physics:** Execute all 3D wave displacements, cursor ripples (`u_mouse`), and audio bass reactions (`u_audioBass`) inside GLSL vertex shaders. Never mutate `Float32Array` vertex positions on the CPU per frame.
- **Particle System Flags:** Configure `THREE.Points` with `transparent: true`, `blending: THREE.AdditiveBlending`, `depthWrite: false`, and `frustumCulled = false`.
- **EffectComposer Pass Order:** In Three.js post-processing, `RenderPixelatedPass` renders the scene directly and MUST replace `RenderPass` (`renderPixelatedPass.enabled = true; renderPass.enabled = false`) rather than following it. Follow with `UnrealBloomPass`, `ShaderPass(CRTPostShader)`, and `OutputPass`.
- **Pixel-Art Filtering:** Enforce `ctx.imageSmoothingEnabled = false` on all HTML5 2D canvases and `THREE.NearestFilter` (`minFilter` and `magFilter`) on all pixel-art textures.

## 5. Procedural Web Audio API & Frame Loop Rules
- **Zero External Audio Files:** Synthesize all 8-bit chiptune BGM channels (`square`, `triangle`, `sawtooth`, `sine`) and UI sound effects using the native Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`, `AnalyserNode`, and white noise `AudioBuffer`).
- **Click-Free Envelopes:** Every synthesized note and UI tick must schedule gain ramps using `setValueAtTime` followed by `exponentialRampToValueAtTime(0.001, now + duration)` to eliminate speaker clicks.
- **Unified Ticker:** Drive Lenis smooth scrolling, GSAP ScrollTrigger updates, and the Three.js `EffectComposer` render loop from a single `gsap.ticker` instance with `gsap.ticker.lagSmoothing(0)`.
