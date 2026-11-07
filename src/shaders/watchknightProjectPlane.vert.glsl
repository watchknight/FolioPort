// src/shaders/watchknightProjectPlane.vert.glsl
// @watchknight Awwwards SOTY DOM-to-WebGL Project Plane Vertex Shader
//
// Invariants:
// - Single vertex shader handling inertial scroll velocity, audio bass deformation, and mouse shockwaves.
// - Surface normal perturbation via tangent/bitangent finite differences for dynamic PBR and normal telemetry.

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

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying float vWave;
varying float vElevation;

#define PI 3.14159265358979323846

float calculateElevation(vec2 uvCoord) {
  // 1. Inertial Scroll Velocity Curvature (Cylindrical barrel curvature)
  float clampedScroll = clamp(uScrollVelocity / 320.0, -2.0, 2.0);
  float scrollWave = sin(uvCoord.x * PI) * clampedScroll * 18.0;

  // 2. Audio-reactive Bass & Beat Pulse Vertex Deformation
  float bassWave = sin(uvCoord.x * 4.0 * PI + uTime * 3.5) * cos(uvCoord.y * 4.0 * PI + uTime * 2.8);
  float audioDisplacement = bassWave * (uAudioBass * 14.0 + uBeatPulse * 20.0);

  // 3. Pointer Proximity & Velocity Shockwave (Aspect-ratio calibrated)
  float aspect = uPlaneSize.x / max(uPlaneSize.y, 1.0);
  vec2 mouseDelta = (uvCoord - uMouse) * vec2(aspect, 1.0);
  float mouseDist = length(mouseDelta);
  float mouseWave = sin(mouseDist * 24.0 - uTime * 7.5) * exp(-mouseDist * 4.2);
  float mouseVelImpulse = length(uMouseVelocity) * 16.0;
  float hoverDisplacement = mouseWave * (uHoverState * 14.0 + mouseVelImpulse);

  return scrollWave + audioDisplacement + hoverDisplacement;
}

void main() {
  vUv = uv;

  // Calculate central vertex elevation
  float totalElevation = calculateElevation(uv);
  vWave = totalElevation * 0.08;
  vElevation = totalElevation;

  vec3 displacedPosition = position + normal * totalElevation;

  // Dynamic surface normal calculation via finite difference tangents
  float eps = 0.01;
  float elevRight = calculateElevation(uv + vec2(eps, 0.0));
  float elevUp = calculateElevation(uv + vec2(0.0, eps));

  vec3 tangent = vec3(eps * uPlaneSize.x, 0.0, elevRight - totalElevation);
  vec3 bitangent = vec3(0.0, eps * uPlaneSize.y, elevUp - totalElevation);
  vec3 perturbedNormal = normalize(cross(tangent, bitangent));

  vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
  vViewPosition = -mvPosition.xyz;
  vNormal = normalize(normalMatrix * perturbedNormal);

  vec4 worldPos = modelMatrix * vec4(displacedPosition, 1.0);
  vWorldPosition = worldPos.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
