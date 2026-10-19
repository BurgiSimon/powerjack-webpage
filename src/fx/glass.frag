#version 300 es
precision highp float;
uniform sampler2D uRoom, uClip, uDrops, uDrips;
uniform vec2 uRes;
uniform vec4 uCoverR, uCoverC;
uniform float uMist, uMix, uBaseR, uBaseC;                                   // base LOD: texels per pixel, so nothing aliases
in vec2 vUv; out vec4 outColor;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(.06711056, .00583715)))); }
void main() {
  vec2 uv = vUv;
  vec4 d = texture(uDrops, vec2(uv.x * uRes.x / uRes.y, uv.y) * 2.2);        // ~2.2 tiles per screen height
  vec4 r = texture(uDrips, uv);
  float clear = r.r;
  float bead = smoothstep(.45, .9, d.a) * (1. - clear) + r.g;                // on a bead or a running drip head
  vec2 n = (d.rg * 2. - 1.) * d.a * (1. - clear);
  float mist = smoothstep(.4, .04, uv.y) * (1. - clear) * uMist;            // condensation low on the glass, under the title
  // the lens is focused through the glass on the room: beads are soft, inverting a little of what is behind them
  vec2 q = uv - n * .012;
  float lod = 1.4 * bead + 3.2 * mist;
  vec3 col = mix(textureLod(uRoom, q * uCoverR.xy + uCoverR.zw, lod + uBaseR).rgb,
                 textureLod(uClip, q * uCoverC.xy + uCoverC.zw, lod + uBaseC).rgb, uMix);
  col *= 1. - .3 * bead * (1. - d.b);                                         // a bead's rim reflects the dark street
  vec4 big = textureLod(uDrops, vec2(uv.x * uRes.x / uRes.y, uv.y) * 2.2, 2.);   // at mip 2 only the big beads keep a normal
  col += bead * pow(max(dot(normalize(vec3((big.rg * 2. - 1.) * 2.5, .7)), vec3(-.36, .48, .8)), 0.), 30.) * vec3(.42, .35, .25);   // the shades, caught in them
  col = mix(col, vec3(.21, .17, .135) + col * .25, mist);                      // warm fog
  float vg = length((uv - .5) * vec2(uRes.x / uRes.y, 1.));
  col *= mix(1., pow(cos(min(vg * 1.1, 1.5707)), 4.), .25);                    // cos^4 vignette at .25
  col += (ign(gl_FragCoord.xy) - .5) / 255.;                                   // IGN dither: no banding
  outColor = vec4(col, 1.);
}
