uniform float u_time;
uniform float u_amplitude;
uniform float u_audioBass;
uniform vec2 u_mouse;
uniform float u_pixelRatio;
uniform float u_gridDensity;

varying float v_elevation;
varying vec2 v_uv;
varying float v_distToMouse;

void main() {
  v_uv = uv;
  vec3 pos = position;

  // Dual-frequency interfering sine/cosine topological wave
  float waveX = sin(pos.x * 1.4 + u_time * 1.6) * cos(pos.y * 1.2 + u_time * 1.1);
  float waveY = sin(pos.x * 2.8 - u_time * 2.2) * 0.35;
  
  // Cursor interaction ripple in normalized world coordinates
  float dist = distance(pos.xy, u_mouse * 4.0);
  v_distToMouse = dist;
  float mouseRipple = sin(dist * 6.0 - u_time * 8.0) * exp(-dist * 1.8) * 0.65;

  // Total Z/Y elevation modulated by Web Audio 8-bit bass channel
  float elevation = (waveX + waveY) * (u_amplitude + u_audioBass * 0.45) + mouseRipple;

  // Spatial waypoint grid density modulation (Sector 02 Flagship Systems)
  if (u_gridDensity > 1.05) {
    elevation += sin(pos.x * 4.5 * u_gridDensity + u_time * 2.4) * cos(pos.y * 3.8 * u_gridDensity) * 0.14 * (u_gridDensity - 1.0);
  }

  pos.z += elevation;
  v_elevation = elevation;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Perspective-attenuated particle point size
  gl_PointSize = (6.5 * u_pixelRatio + (elevation * 4.0)) * (1.0 / -mvPosition.z);
}
