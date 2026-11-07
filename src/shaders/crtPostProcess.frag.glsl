uniform sampler2D tDiffuse;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_distortion;   // Default: 0.04 (4% barrel curvature)
uniform float u_scanlineInt;  // Default: 0.06 (accessibility-safe scanline depth)
uniform bool u_crtEnabled;

varying vec2 vUv;

vec2 barrelDistort(vec2 uv, float amt) {
  vec2 centered = uv - 0.5;
  float dist = dot(centered, centered);
  return uv + centered * (dist * amt);
}

void main() {
  if (!u_crtEnabled) {
    gl_FragColor = texture2D(tDiffuse, vUv);
    return;
  }

  vec2 crtUV = barrelDistort(vUv, u_distortion);

  // Rounded CRT corner clipping
  vec2 edge = abs(crtUV - 0.5);
  if (edge.x > 0.5 || edge.y > 0.5) {
    gl_FragColor = vec4(0.027, 0.031, 0.078, 1.0); // #070814 bezel void
    return;
  }

  // Chromatic aberration proportional to distance from tube center
  float centerDist = length(crtUV - 0.5);
  float caOffset = centerDist * 0.0035;
  float r = texture2D(tDiffuse, crtUV + vec2(caOffset, 0.0)).r;
  float g = texture2D(tDiffuse, crtUV).g;
  float b = texture2D(tDiffuse, crtUV - vec2(caOffset, 0.0)).b;
  vec3 color = vec3(r, g, b);

  // Gaussian scanlines (tuned for 224-240 virtual lines) & Trinitron aperture mask
  float scanline = sin(crtUV.y * 672.0) * u_scanlineInt;
  float grille = mix(0.96, 1.04, sin(crtUV.x * u_resolution.x * 1.5));
  color = (color * grille) - scanline;

  // Warm NTSC color temperature (1.04R, 1.01G, 0.95B) & 12% edge vignette
  color *= vec3(1.04, 1.01, 0.95);
  float vignette = 1.0 - dot(crtUV - 0.5, crtUV - 0.5) * 0.48;
  color *= clamp(vignette, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
