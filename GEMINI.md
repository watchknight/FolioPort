# GEMINI.md — @watchknight Awwwards SOTY Portfolio Architecture Rules

## 1. Identity & Creative Direction

* **Developer:** Abdur Rahman Moayed (`@watchknight`), Computer Science & Engineering (CSE), East West University, Dhaka, Bangladesh (`23.7644° N, 90.4252° E`, `UTC+6`).
* **Aesthetic Thesis:** "The Chronometric Sentinel & Algorithmic Atelier."
* **Flagship Projects (`https://github.com/watchknight`):**
1. *Position 01 (Primacy Anchor):* **Mental Defrag** — Zero-gravity spatial cognitive web application (Vite, TypeScript, Matter.js physics, vector embeddings, Obsidian canvas integration).
2. *Position 02:* **DocLensBD** — Cloud-backed document intelligence web platform (Cloud Firestore, automated CI/CD pipeline).
3. *Position 03 (Von Restorff Strategic Anomaly):* **Trash Trail & Aether-GL** — Scroll-driven interactive storytelling & audio-reactive WebGPU/WebGL fluid shader showcase (GSAP, ScrollTrigger, GLSL render-pass inspector).
4. *Position 04 (Recency Anchor):* **Rannabanna & Neon Vanguard 2D / OS Kernel Labs** — Full-stack localized Bengali web platform alongside HTML5 2D combat physics & Linux C/C++ POSIX shared-memory/IPC pipelines.

* **Strictly Forbidden ("AI Slop"):** Default Tailwind/shadcn 3-column bento grids, `rounded-2xl` glowing cards, purple-to-cyan neon gradients, CSS `box-shadow` neon glows, un-throttled hover handlers, generic AI filler copy ("Passionate developer..."), and multiple competing `requestAnimationFrame` loops.

## 2. Neuroaesthetic Palette Tokens (Strict Enforcement)

* `--wk-obsidian-void`: `#090A0D` (Primary canvas background — 70% viewport rest zone)
* `--wk-slate-surface`: `#12151C` (Elevated telemetry HUD & drawer surface — 15% area)
* `--wk-alabaster-ink`: `#F2EFE9` (Primary typography & 1px SVG vector rules, >= 14:1 AAA contrast)
* `--wk-ash-muted`: `#7A808C` (Secondary metadata, coordinates & timestamps)
* `--wk-terracotta-pulse`: `#B84A27` (Strategic Von Restorff focal anomaly & CTA accent — 3% area)
* `--wk-verdigris-signal`: `#4E9A7F` (Active telemetry, live status & graph traversal state — 2% area)
* **Chromostereopsis Rule:** Never place `--wk-terracotta-pulse` directly adjacent to saturated blue at near-equal lightness; always buffer warm focal accents with `#090A0D` or `#F2EFE9` neutral borders and maintain a >= 35 L* perceptual lightness delta.

## 3. Motion, WebGL & Audio Invariants

* **Single RAF Loop:** Instantiate exactly ONE `Lenis` instance exposed on `window.__lenis` and driven by `gsap.ticker.add((time) => lenis.raf(time * 1000))` with `gsap.ticker.lagSmoothing(0)`. Sync scroll triggers via `lenis.on('scroll', ScrollTrigger.update)` and drive the Three.js `WebGLRenderer` from the same `gsap.ticker`.
* **Zero-Allocation Pointer Tracking:** Never invoke `gsap.to()` or `gsap.set()` directly inside `mousemove` or `ScrollTrigger` `onUpdate` callbacks. Always pre-allocate `gsap.quickTo()` or `gsap.quickSetter()` setters.
* **Velocity Skew Bounds:** Map `ScrollTrigger.getVelocity() / -280` through `gsap.utils.clamp(-14, 14)` using `transformOrigin: "right center"` and `force3D: true`.
* **Compositor Discipline:** Animate only GPU-composited properties (`x`, `y`, `xPercent`, `yPercent`, `scale`, `rotation`, `skewX`, `skewY`) and `autoAlpha` (which sets `visibility: hidden` at 0). Never animate `top`, `left`, `width`, `height`, or `margin`.
* **Procedural Web Audio Hygiene:** Generate 100% of UI sounds procedurally via the Web Audio API (`AudioContext` lazily initialized on first `pointerdown`/`keydown`). Enforce `hoverThrottleMs: 80`, +/-5% pitch variance, 5ms–10ms fade envelopes, 30% attenuation after 5 rapid triggers, and automatic mute when `prefers-reduced-motion: reduce` is active.
* **Lifecycle Cleanup:** Wrap all motion setup in `gsap.matchMedia()` and ensure every React `useEffect` / `useLayoutEffect` reverts timelines, kills `ScrollTrigger` instances, and disposes Three.js geometries, materials, and textures on unmount.

## 4. Verification Loop Mandate

* Every implementation subagent must run `npm run typecheck && npm run test:unit && npm run build` inside the terminal sandbox and resolve all errors before returning to the orchestrator.
