import { gsap } from '../core/motion';
import { dropsMap, drips } from './drops';
import frag from './glass.frag?raw';

// The rain-beaded storefront glass over the hero (SPEC §E.8, minus signs, street, push, lightning): the site's one WebGL context.
export interface Glass { wipe(u: number, v: number, cssPx: number): void; destroy(): void }

const VERT = '#version 300 es\nin vec2 aPos; out vec2 vUv; void main() { vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }';

// object-fit: cover about a focal point, in GL's bottom-up v
const cover = (cw: number, ch: number, iw: number, ih: number, fx: number, fy: number) => {
  const s = Math.max(cw / iw, ch / ih), wx = cw / (iw * s), wy = ch / (ih * s);
  return [wx, wy, (1 - wx) * fx, (1 - wy) * (1 - fy)] as const;
};

export async function acquireGlass(canvas: HTMLCanvasElement, img: HTMLImageElement, clip: HTMLVideoElement | null,
  o: { phone: boolean; active: () => boolean }): Promise<Glass | null> {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  try { await img.decode(); } catch { return null; }
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(prog, 0, 'aPos'); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);   // one full-screen triangle
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);

  const tex = (unit: number, wrap: number, mips: boolean) => {
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.uniform1i(U(['uRoom', 'uClip', 'uDrops', 'uDrips'][unit]), unit);
  };
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  tex(0, gl.CLAMP_TO_EDGE, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D);
  tex(1, gl.CLAMP_TO_EDGE, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);   // the rain maps are already v-up
  tex(2, gl.REPEAT, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, dropsMap()); gl.generateMipmap(gl.TEXTURE_2D);
  const box = canvas.getBoundingClientRect(), [DW, DH] = box.height > box.width ? [128, 256] : [256, 128];   // drip texels stay near square on a portrait phone, so a tap wipes a spot, not a tall streak
  const rain = drips(DW, DH);
  tex(3, gl.CLAMP_TO_EDGE, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, DW, DH, 0, gl.RGBA, gl.UNSIGNED_BYTE, rain.data);
  gl.uniform1f(U('uMist'), 1);

  // the clip: re-uploaded only when it has a new frame; uMix dissolves the still into it on its first 'playing'
  const u = { mix: 0 };
  let fresh = true, dead = false;
  const onFrame = () => { fresh = true; if (!dead) clip!.requestVideoFrameCallback(onFrame); };
  const rvfc = !!clip && 'requestVideoFrameCallback' in clip;
  if (rvfc) clip!.requestVideoFrameCallback(onFrame);
  const onPlaying = () => gsap.to(u, { mix: 1, duration: .8, ease: 'house' });
  if (clip && !clip.paused && clip.readyState >= 2) u.mix = 1; else clip?.addEventListener('playing', onPlaying, { once: true });

  const fx = parseFloat(getComputedStyle(img).objectPosition) / 100 || .5, fy = parseFloat(getComputedStyle(img).objectPosition.split(' ')[1]) / 100 || .5;
  const size = () => {
    // phones too: at .6× the beads alias into blocks; one pass, no clip upload on portrait phones, ≤ 30 fps and the median guard keep it cheap
    const r = canvas.getBoundingClientRect(), k = Math.min(devicePixelRatio, 1.5) * .75;
    canvas.width = Math.max(1, Math.round(r.width * k)); canvas.height = Math.max(1, Math.round(r.height * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U('uRes'), canvas.width, canvas.height);
    const cr = cover(r.width, r.height, img.naturalWidth, img.naturalHeight, fx, fy), cw = clip?.videoWidth || 1280;
    const cc = cover(r.width, r.height, cw, clip?.videoHeight || 720, .5, .5);
    gl.uniform4f(U('uCoverR'), ...cr); gl.uniform4f(U('uCoverC'), ...cc);
    gl.uniform1f(U('uBaseR'), Math.max(0, Math.log2(img.naturalWidth * cr[0] / canvas.width)));
    gl.uniform1f(U('uBaseC'), Math.max(0, Math.log2(cw * cc[0] / canvas.width)));
  };
  const ro = new ResizeObserver(size); ro.observe(canvas);
  size();

  // budget: draw only in view, phones at ≤ 30 fps. Every 60 draws (or 1 s of them) are timed: the canvas shows only after a
  // fast window, so a slow device never sees it flash, and any slow window (the clip joining, a hot phone) falls back to the CSS mist
  const slow = new URLSearchParams(location.search).get('glass') === 'slow', limit = o.phone ? 40 : 24, gaps: number[] = [];
  let last = 0, tick = 0, acc = 0, first = 0;
  const draw = (_t: number, dt: number) => {
    if (!o.active()) { last = first = 0; gaps.length = 0; return; }
    if (o.phone && tick++ & 1) return;   // ≤ 30 fps; the gap then spans two ticks, hence the phone's looser limit
    let steps = 0;
    for (acc += Math.min(dt, 100) / 1000; acc >= 1 / 15; acc -= 1 / 15, steps++) rain.step(1 / 15);
    if (steps) { gl.activeTexture(gl.TEXTURE3); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, DW, DH, gl.RGBA, gl.UNSIGNED_BYTE, rain.data); }   // the rain moves at 15 Hz
    if (clip && u.mix > 0 && clip.readyState >= 2 && (fresh || !rvfc)) {
      fresh = false;
      gl.activeTexture(gl.TEXTURE1); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, clip); gl.generateMipmap(gl.TEXTURE_2D);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }
    gl.uniform1f(U('uMix'), u.mix);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const now = performance.now();
    if (last) gaps.push(now - last);
    last = now; first ||= now;
    if (gaps.length === 60 || (gaps.length && now - first > 1000)) {
      if ((slow ? 99 : gaps.sort((a, b) => a - b)[gaps.length >> 1]) > limit) return fail();
      canvas.dataset.live = ''; gaps.length = 0; first = now;
    }
  };
  const fail = () => { delete canvas.dataset.live; gsap.ticker.remove(draw); gsap.delayedCall(.8, destroy); };
  const destroy = () => {
    if (dead) return;
    dead = true; gsap.ticker.remove(draw); ro.disconnect(); delete canvas.dataset.live;
    clip?.removeEventListener('playing', onPlaying); canvas.removeEventListener('webglcontextlost', fail);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
  canvas.addEventListener('webglcontextlost', fail);
  gsap.ticker.add(draw);
  return {
    wipe: (x, y, px) => rain.wipe(x, y, px * DW / canvas.getBoundingClientRect().width),
    destroy,
  };
}
