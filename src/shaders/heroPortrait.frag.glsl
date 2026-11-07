// src/shaders/heroPortrait.frag.glsl
// @watchknight Awwwards SOTY Hero Portrait Interactive Fluid Displacement Shader
//
// Invariants:
// 1. Fluid Mouse Ripple Displacement: Power3-decaying liquid glass wave on cursor movement.
// 2. Focus Chromatic Aberration: Natural red/cyan channel splitting near edges tied to pointer velocity.
// 3. Audio-Reactive Synchrony: Concentric canvas wave distortion scaled by uBeatPulse and uAudioBass.
// 4. Analog Camera Lens Noise: Subtle industrial film grain overlay at calibrated 0.04 opacity.
// 5. Neuroaesthetic Palette Alignment: Buffered with --wk-obsidian-void (#090A0D) neutral border.

precision highp float;

uniform sampler2D uTexture;
uniform vec2 uPlaneResolution;
uniform vec2 uImageResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uMouseVelocity;
uniform float uVelocityMag;
uniform float uHover;
uniform float uBeatPulse;
uniform float uAudioBass;

varying vec2 vUv;

// Cyber-CRT Token Palette Vectors (WATCHKNIGHT_OS // SYS.96)
const vec3 C_OBSIDIAN_VOID = vec3(0.027, 0.031, 0.078); // #070814 (--crt-void-bg)
const vec3 C_SLATE_SURFACE = vec3(0.075, 0.086, 0.161); // #131629 (--crt-panel-slate)
const vec3 C_ALABASTER_INK = vec3(0.941, 0.937, 0.902); // #F0EFE6 (--pixel-ivory-text)
const vec3 C_TERRACOTTA     = vec3(1.0, 0.165, 0.522);   // #FF2A85 (--tech-magenta-crest)
const vec3 C_VERDIGRIS      = vec3(0.0, 0.941, 1.0);     // #00F0FF (--tech-cyan-wave)

// High-frequency pseudo-random hash generator
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 2D Simplex Noise for procedural liquid glass currents
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Maps UVs to CSS "object-cover object-[center_20%]" focal geometry
vec2 getCoverUv(vec2 uv, vec2 planeRes, vec2 imageRes) {
  float planeAspect = planeRes.x / max(planeRes.y, 0.001);
  float imageAspect = imageRes.x / max(imageRes.y, 0.001);
  vec2 scale = vec2(1.0);
  vec2 offset = vec2(0.0);

  if (planeAspect < imageAspect) {
    // Plane is taller than image: fit height, crop width symmetrically
    scale.x = planeAspect / imageAspect;
    offset.x = (1.0 - scale.x) * 0.5;
  } else {
    // Plane is wider than image: fit width, crop height focusing on upper 20%
    scale.y = imageAspect / planeAspect;
    offset.y = (1.0 - scale.y) * 0.8;
  }

  return uv * scale + offset;
}

void main() {
  float aspect = uPlaneResolution.x / max(uPlaneResolution.y, 0.001);

  // 1. Fluid Mouse Ripple Displacement (Aspect-calibrated)
  vec2 toMouse = (vUv - uMouse) * vec2(aspect, 1.0);
  float mouseDist = length(toMouse);

  // Sinusoidal ripple wave decaying outward from pointer position
  float rippleWave = sin(mouseDist * 26.0 - uTime * 7.2) * exp(-mouseDist * 3.8);
  vec2 rippleDir = normalize(toMouse + vec2(0.0001));

  // Organic 2D curl/simplex current field (GLSL ES 1.0 type-safe vector math)
  float n1 = snoise(vUv * 4.5 + vec2(uTime * 0.45));
  float n2 = snoise(vUv * 4.5 - vec2(uTime * 0.38) + vec2(4.1, 2.3));
  vec2 noiseFlow = vec2(n1, n2);

  // Velocity-driven liquid glass fluid displacement (fades out immediately when mouse is at rest)
  float fluidIntensity = uVelocityMag * 0.052;
  vec2 fluidDisplacement = (rippleDir * rippleWave + uMouseVelocity * 0.35 + noiseFlow * 0.22) * fluidIntensity;

  // 2. Spatial Audio-Reactive Concentric Wave Distortion (uBeatPulse + uAudioBass)
  vec2 toCenter = (vUv - vec2(0.5, 0.5)) * vec2(aspect, 1.0);
  float centerDist = length(toCenter);
  float beatWave = sin(centerDist * 28.0 - uTime * 8.5) * exp(-centerDist * 2.6) * (uBeatPulse * 0.024 + uAudioBass * 0.008);
  vec2 beatDisplacement = normalize(toCenter + vec2(0.0001)) * beatWave;

  // Combined total UV displacement
  vec2 displacedUv = vUv + fluidDisplacement + beatDisplacement;

  // 3. Focus Chromatic Aberration (Splitting red/cyan channels near edges)
  vec2 fromCenterNorm = (displacedUv - 0.5) * 2.0; // [-1.0, 1.0]
  float edgeDist = length(fromCenterNorm);
  float edgeFactor = smoothstep(0.15, 1.35, edgeDist);

  // Aberration intensity linked directly to cursor speed and hover
  float chromaStrength = (uVelocityMag * 0.026 + uHover * 0.005 + uBeatPulse * 0.008) * (0.35 + 0.65 * edgeFactor);
  vec2 chromaDir = normalize(fromCenterNorm + uMouseVelocity * 0.7 + vec2(0.0001));
  vec2 chromaOffset = chromaDir * chromaStrength;

  // Sample Red and Cyan (Green+Blue) channels with chromatic aberration and object-cover alignment
  vec2 uvR = clamp(getCoverUv(displacedUv + chromaOffset, uPlaneResolution, uImageResolution), 0.001, 0.999);
  vec2 uvG = clamp(getCoverUv(displacedUv - chromaOffset * 0.4, uPlaneResolution, uImageResolution), 0.001, 0.999);
  vec2 uvB = clamp(getCoverUv(displacedUv - chromaOffset * 0.8, uPlaneResolution, uImageResolution), 0.001, 0.999);

  float r = texture2D(uTexture, uvR).r;
  float g = texture2D(uTexture, uvG).g;
  float b = texture2D(uTexture, uvB).b;
  float a = texture2D(uTexture, uvG).a;
  vec3 color = vec3(r, g, b);

  // Editorial Tonal Balancing: Rich obsidian depth and contrast
  color = pow(color, vec3(1.04));

  // 4. Industrial Film Grain / Analog Camera Lens Noise Overlay (Calibrated at 0.04 Opacity)
  float grainNoise = (hash(vUv * uPlaneResolution + vec2(fract(uTime * 19.37) * 97.0, fract(uTime * 23.71) * 83.0)) - 0.5) * 0.04;
  color += vec3(grainNoise);

  // 5. Neuroaesthetic Border Vignette: Buffers warm accents with --wk-obsidian-void
  vec2 borderD = min(vUv, 1.0 - vUv);
  float edgeVignette = smoothstep(0.0, 0.055, min(borderD.x, borderD.y));
  color = mix(C_OBSIDIAN_VOID, color, edgeVignette);

  // Hover Terracotta Subtle Edge Sheen
  float borderRim = 1.0 - smoothstep(0.0, 0.016, min(borderD.x, borderD.y));
  color += borderRim * C_TERRACOTTA * (uHover * 0.45);

  gl_FragColor = vec4(color, a);
}
