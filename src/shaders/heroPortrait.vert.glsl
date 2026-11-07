// src/shaders/heroPortrait.vert.glsl
// @watchknight Awwwards SOTY Hero Portrait Vertex Shader

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
