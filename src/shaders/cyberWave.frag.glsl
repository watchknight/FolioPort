precision mediump float;

uniform vec3 u_troughColor;
uniform vec3 u_crestColor;
uniform vec3 u_accentColor;
uniform float u_paletteMorph;
uniform float u_isLightMode;

varying float v_elevation;
varying vec2 v_uv;
varying float v_distToMouse;

void main() {
  // Circular soft particle sprite shaping (discard corners of gl_PointCoord)
  float distFromCenter = length(gl_PointCoord - vec2(0.5));
  if (distFromCenter > 0.5) discard;
  float alpha = smoothstep(0.5, 0.1, distFromCenter);

  // Attenuate particle and wireframe alpha on the left half of the viewport
  float leftAtten = smoothstep(0.05, 0.65, v_uv.x);
  alpha *= mix(0.18, 1.0, leftAtten);

  // Palette interpolation: Vector Cyan (#00F0FF) troughs to Synthwave Magenta (#FF2A85) crests
  vec3 cyanPhosphor = vec3(0.0, 0.941, 1.0);
  vec3 magentaPlasma = vec3(1.0, 0.165, 0.522);
  vec3 amberHighlight = vec3(1.0, 0.8, 0.0);

  float mixStrength = clamp((v_elevation + 0.6) / 1.2, 0.0, 1.0);
  vec3 baseColor = mix(cyanPhosphor, magentaPlasma, mixStrength);

  // Subtle 90s amber phosphor spark near cursor focal point
  float cursorGlow = exp(-v_distToMouse * 2.5);
  vec3 finalColor = mix(baseColor, amberHighlight, cursorGlow * 0.35);

  // Spatial waypoint color morphing (Sector 01 -> Sector 05)
  if (u_paletteMorph > 0.001) {
    vec3 morphTrough = mix(cyanPhosphor, u_troughColor, u_paletteMorph);
    vec3 morphCrest = mix(magentaPlasma, u_crestColor, u_paletteMorph);
    vec3 morphAccent = mix(amberHighlight, u_accentColor, u_paletteMorph);
    vec3 morphedBase = mix(morphTrough, morphCrest, mixStrength);
    vec3 morphedFinal = mix(morphedBase, morphAccent, cursorGlow * 0.35);
    finalColor = mix(finalColor, morphedFinal, clamp(u_paletteMorph, 0.0, 1.0));
  }

  // DAYLIGHT_CAD // SYS.96 High-Contrast Blueprint Interpolation
  if (u_isLightMode > 0.001) {
    vec3 cobaltBlueprint = vec3(0.0, 0.3216, 1.0);
    vec3 laserCrimson = vec3(0.851, 0.0157, 0.3216);
    vec3 graphiteInk = vec3(0.102, 0.1137, 0.1412);
    vec3 burntAmber = vec3(0.784, 0.353, 0.0);

    vec3 lightBaseColor = mix(cobaltBlueprint, laserCrimson, mixStrength);
    float intersectionDepth = smoothstep(0.25, -0.4, v_elevation);
    lightBaseColor = mix(lightBaseColor, graphiteInk, intersectionDepth * 0.4);

    vec3 lightFinal = mix(lightBaseColor, burntAmber, cursorGlow * 0.35);
    finalColor = mix(finalColor, lightFinal, clamp(u_isLightMode, 0.0, 1.0));
  }

  // Alpha calibration: NormalBlending in light mode needs solid visibility
  gl_FragColor = vec4(finalColor, alpha * 0.9);
  if (u_isLightMode > 0.001) {
    gl_FragColor.a = clamp(alpha * 1.35, 0.45, 0.96);
  } else {
    // Dark mode luminance safety clamp
    gl_FragColor.rgb = min(gl_FragColor.rgb, vec3(0.72));
  }
}
