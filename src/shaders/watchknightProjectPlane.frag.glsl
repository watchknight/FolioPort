// src/shaders/watchknightProjectPlane.frag.glsl
// @watchknight Awwwards SOTY DOM-to-WebGL Project Plane Fragment Shader
//
// Supports 3 Colombel-Style Render Inspector Modes:
// - Mode 0: Beauty Fluid Distortion + Chromatic Aberration + GGX PBR Sheen
// - Mode 1: UV/Normals Telemetry (Texture Coordinates + Normal Vectors + HUD Reticle)
// - Mode 2: Clay/Algorithmic Lattice (Matte Studio Diffuse + Pulsating Wireframe Lattice)

uniform sampler2D uTexture;
uniform float uHasTexture;
uniform float uTime;
uniform float uScrollVelocity;
uniform vec2 uMouse;
uniform vec2 uMouseVelocity;
uniform float uHoverState;
uniform float uAudioBass;
uniform float uSpectralCentroid;
uniform float uBeatPulse;
uniform int uRenderMode;
uniform vec2 uPlaneSize;
uniform vec3 uColorTheme;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying float vWave;
varying float vElevation;

#define PI 3.14159265358979323846

// Cyber-CRT Token Palette Vectors (WATCHKNIGHT_OS // SYS.96)
const vec3 C_OBSIDIAN_VOID   = vec3(0.027, 0.031, 0.078); // #070814 (--crt-void-bg)
const vec3 C_SLATE_SURFACE   = vec3(0.075, 0.086, 0.161); // #131629 (--crt-panel-slate)
const vec3 C_ALABASTER_INK   = vec3(0.941, 0.937, 0.902); // #F0EFE6 (--pixel-ivory-text)
const vec3 C_ASH_MUTED       = vec3(0.557, 0.596, 0.667); // #8E98AA
const vec3 C_TERRACOTTA      = vec3(1.0, 0.165, 0.522);   // #FF2A85 (--tech-magenta-crest)
const vec3 C_VERDIGRIS       = vec3(0.0, 0.941, 1.0);     // #00F0FF (--tech-cyan-wave)

// Pseudo-random hash generator for procedural fallback & grain
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Procedural high-tech architectural canvas pattern for fallback texture
vec3 generateProceduralCanvas(vec2 uv) {
  vec2 grid = fract(uv * 12.0);
  float border = step(0.04, grid.x) * step(grid.x, 0.96) * step(0.04, grid.y) * step(grid.y, 0.96);
  float wire = 1.0 - border;

  // Background subtle gradient
  vec3 bg = mix(C_OBSIDIAN_VOID, C_SLATE_SURFACE, uv.y + uv.x * 0.2);

  // Micro-dot matrix at grid intersections
  vec2 dotCenter = abs(grid - vec2(0.5));
  float dots = 1.0 - step(0.06, length(dotCenter));

  // Diagnostic accent telemetry strip
  float strip = step(0.48, uv.x) * step(uv.x, 0.52);
  vec3 stripColor = mix(C_ASH_MUTED * 0.4, C_TERRACOTTA, strip * (0.6 + 0.4 * sin(uTime * 2.0)));

  vec3 col = bg + wire * C_ASH_MUTED * 0.25 + dots * C_ALABASTER_INK * 0.4;
  col = mix(col, stripColor, strip * 0.5);

  return col;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float aspect = uPlaneSize.x / max(uPlaneSize.y, 1.0);

  // ==========================================================================
  // MODE 0: BEAUTY FLUID DISTORTION + CHROMATIC ABERRATION
  // ==========================================================================
  if (uRenderMode == 0) {
    // 1. Fluid Mouse Ripple Displacement (Aspect-calibrated)
    vec2 toMouse = (vUv - uMouse) * vec2(aspect, 1.0);
    float dist = length(toMouse);
    float rippleFactor = sin(dist * 22.0 - uTime * 6.0) * exp(-dist * 3.8);
    float rippleStrength = uHoverState * 0.038 + length(uMouseVelocity) * 0.05 + uBeatPulse * 0.015;
    vec2 fluidOffset = normalize(vUv - uMouse + vec2(0.0001)) * rippleFactor * rippleStrength;
    vec2 distortedUv = clamp(vUv + fluidOffset, vec2(0.001), vec2(0.999));

    // 2. Chromatic Aberration Channel Splitting
    float chromaMag = abs(uScrollVelocity) * 0.00003 + uHoverState * 0.006 + uBeatPulse * 0.008;
    vec2 chromaOffset = vec2(chromaMag, chromaMag * 0.5);

    vec4 texColor;
    if (uHasTexture > 0.5) {
      float r = texture2D(uTexture, distortedUv + chromaOffset).r;
      float g = texture2D(uTexture, distortedUv).g;
      float b = texture2D(uTexture, distortedUv - chromaOffset).b;
      float a = texture2D(uTexture, distortedUv).a;
      texColor = vec4(r, g, b, a);
    } else {
      vec3 fallbackR = generateProceduralCanvas(distortedUv + chromaOffset);
      vec3 fallbackG = generateProceduralCanvas(distortedUv);
      vec3 fallbackB = generateProceduralCanvas(distortedUv - chromaOffset);
      texColor = vec4(fallbackR.r, fallbackG.g, fallbackB.b, 1.0);
    }

    // 3. Studio Directional Key & Fill Lighting
    vec3 keyDir = normalize(vec3(0.6, 0.8, 1.0));
    float diff = max(dot(normal, keyDir), 0.0);

    vec3 halfDir = normalize(keyDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0) * (0.4 + uHoverState * 0.5);

    // 4. Dynamic Fresnel Rim Glow (Terracotta focal pulse)
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.8);
    vec3 rimColor = mix(C_TERRACOTTA, C_VERDIGRIS, uSpectralCentroid);

    // 5. High-Contrast Border Vignette (Buffers warm accent from edges)
    vec2 borderD = min(vUv, 1.0 - vUv);
    float edgeVignette = smoothstep(0.0, 0.08, min(borderD.x, borderD.y));

    // Composite final Beauty PBR
    vec3 finalBeauty = texColor.rgb * (0.8 + diff * 0.35) + spec * C_ALABASTER_INK * 0.8 + fresnel * rimColor * (0.8 + uHoverState * 0.6);
    finalBeauty = mix(C_OBSIDIAN_VOID, finalBeauty, edgeVignette);

    // Subtle edge highlight on hover
    float borderLine = 1.0 - smoothstep(0.0, 0.015, min(borderD.x, borderD.y));
    finalBeauty += borderLine * C_TERRACOTTA * uHoverState * 0.85;

    // Output calibrated alpha: textured media uses full alpha, procedural fallback maintains card readability
    float alpha = uHasTexture > 0.5 ? texColor.a : (0.35 + uHoverState * 0.45);
    gl_FragColor = vec4(finalBeauty, alpha);
    return;
  }

  // ==========================================================================
  // MODE 1: UV / NORMALS TELEMETRY
  // ==========================================================================
  if (uRenderMode == 1) {
    // 1. Continuous [U, V] Manifold Coordinate Color Space
    vec3 uvSpace = vec3(vUv.x, vUv.y, sin(vUv.x * PI + vUv.y * PI) * 0.5 + 0.5);

    // 2. Normal Unit Vector Field
    vec3 normalSpace = normal * 0.5 + 0.5;

    // 3. 16x16 Telemetry Checkerboard Grid with 1px Vector Rules
    vec2 grid = fract(vUv * 16.0);
    float check = (step(0.5, grid.x) == step(0.5, grid.y)) ? 0.92 : 0.42;

    vec2 edge = step(vec2(0.035), grid) * step(grid, vec2(0.965));
    float gridBorder = 1.0 - (edge.x * edge.y);

    // Mix UV and Normal Space based on spectral centroid
    vec3 telemetryBase = mix(uvSpace, normalSpace, 0.5 + uSpectralCentroid * 0.35) * check;
    vec3 finalTelemetry = mix(telemetryBase, C_ALABASTER_INK, gridBorder * 0.7);

    // Dynamic Cursor HUD Reticle (Aspect-calibrated)
    vec2 cursorDelta = (vUv - uMouse) * vec2(aspect, 1.0);
    float cursorDist = length(cursorDelta);
    float crosshair = step(abs(vUv.x - uMouse.x), 0.002) + step(abs(vUv.y - uMouse.y), 0.002);
    float reticle = (1.0 - smoothstep(0.02, 0.025, abs(cursorDist - 0.06))) + crosshair * step(cursorDist, 0.12);
    finalTelemetry = mix(finalTelemetry, C_TERRACOTTA, reticle * 0.9);

    // Outer framing border
    vec2 borderD = min(vUv, 1.0 - vUv);
    float borderLine = 1.0 - smoothstep(0.0, 0.02, min(borderD.x, borderD.y));
    finalTelemetry = mix(finalTelemetry, C_VERDIGRIS, borderLine * 0.9);

    float alpha = uHasTexture > 0.5 ? 0.95 : (0.45 + uHoverState * 0.45);
    gl_FragColor = vec4(finalTelemetry, alpha);
    return;
  }

  // ==========================================================================
  // MODE 2: CLAY / ALGORITHMIC LATTICE
  // ==========================================================================
  if (uRenderMode == 2) {
    // 1. Matte Diffuse Studio Clay Shading (Roughness ~ 0.85)
    vec3 keyLight = normalize(vec3(0.5, 0.9, 0.7));
    float diff = max(dot(normal, keyLight), 0.0);

    vec3 fillLight = normalize(vec3(-0.6, -0.4, -0.5));
    float fill = max(dot(normal, fillLight), 0.0) * 0.35;

    vec3 clayBase = mix(C_SLATE_SURFACE, C_ALABASTER_INK * 0.82, diff + fill);

    // Ambient occlusion depth in vertex elevation depressions
    float ao = smoothstep(-15.0, 15.0, vElevation);
    clayBase *= (0.65 + ao * 0.35);

    // 2. High-Contrast Procedural Algorithmic Lattice Lines
    vec2 latticeGrid = fract(vUv * 24.0);
    vec2 latticeEdge = step(vec2(0.045), latticeGrid) * step(latticeGrid, vec2(0.955));
    float latticeWire = 1.0 - (latticeEdge.x * latticeEdge.y);

    // Diagonal isometric cross-hatch for algorithmic sentinel topology
    float diag = fract((vUv.x + vUv.y) * 12.0);
    float diagLine = 1.0 - step(0.06, diag);

    // Lattice wire pulses with beat and bass
    float latticePulse = 0.5 + 0.5 * sin(uTime * 3.0) + uBeatPulse * 0.5 + uAudioBass * 0.3;
    vec3 wireColor = mix(C_TERRACOTTA, C_ALABASTER_INK, uBeatPulse * 0.7);

    vec3 finalClay = mix(clayBase, wireColor, max(latticeWire, diagLine * 0.4) * (0.75 + latticePulse * 0.25));

    // Outer framing border
    vec2 borderD = min(vUv, 1.0 - vUv);
    float borderLine = 1.0 - smoothstep(0.0, 0.015, min(borderD.x, borderD.y));
    finalClay = mix(finalClay, C_TERRACOTTA, borderLine);

    float alpha = uHasTexture > 0.5 ? 0.95 : (0.45 + uHoverState * 0.45);
    gl_FragColor = vec4(finalClay, alpha);
    return;
  }

  // Fallback safety
  gl_FragColor = vec4(C_OBSIDIAN_VOID, 1.0);
}
