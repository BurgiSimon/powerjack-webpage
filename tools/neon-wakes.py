#!/usr/bin/env python3
"""V5 "neon-wakes": the POWERJACK sign waking letter by letter, made from two frames the game rendered (lit and unlit,
same camera). No game render of its own: each frame mixes the two stills per letter, so frame 0 is the unlit still and
the last frame the lit one, pixel for pixel, and the clip can dissolve in over either without a seam.
  python3 tools/neon-wakes.py        (numpy, Pillow, ffmpeg with libx264 + libvpx-vp9 on PATH; run from anywhere)
Writes public/media/video/neon-wakes-1080.{mp4,webm} and the "neon-wakes" key of
src/data/video.json (read-merged: other keys are left as they are)."""
import json, os, subprocess
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
at = lambda *p: os.path.join(ROOT, *p)
FPS, DUR, CAP = 24, 3.5, 700_000
NEON = json.load(open(at('src/data/neon.json')))
W, H = NEON['w'], NEON['h']

def lin(a): a = a / 255.0; return np.where(a <= .04045, a / 12.92, ((a + .055) / 1.055) ** 2.4)
def enc(a): a = np.clip(a, 0, 1); return np.where(a <= .0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - .055)
def still(n):
    im = Image.open(at(f'public/media/frames/{n}-1920.webp')).convert('RGB')
    assert im.size == (W, H), f'{n}: {im.size} is not neon.json space {W}x{H}'
    return np.asarray(im)
L8, O8 = still('jukebox-neon'), still('jukebox-neon-off')
O, D = lin(O8), lin(L8) - lin(O8)   # mixed in linear light: light adds, so half a glow looks like half a glow

FY, FX = np.fft.fftfreq(H)[:, None], np.fft.rfftfreq(W)[None, :]
def blur(m, s): return np.fft.irfft2(np.fft.rfft2(m) * np.exp(-2 * (np.pi * s) ** 2 * (FX ** 2 + FY ** 2)), s=m.shape).astype(np.float32)   # Gaussian σ s px; the sign is far from the edges, so the wrap never shows
def hull(pts): m = Image.new('F', (W, H), 0); ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=1.0); return np.asarray(m, np.float32)
def field(pts):   # per letter: hull blurred σ 6 px (the tube), plus a σ 36 halo at .7 (its glow on the wall)
    M = blur(hull(pts), 6)
    return np.clip(M + .7 * blur(M, 36), 0, 1)
F = np.stack([field(l['pts']) for l in NEON['letters']])
# the glass itself: where the lit still outshines the unlit one by far (the tubes, not their wash on the wall)
TUBE = np.clip(((lin(L8) - lin(O8)) @ np.array([.2126, .7152, .0722]) - .45) / .3, 0, 1).astype(np.float32)
# the wall wash nobody owns follows the sign as a whole, everywhere but on an unlit letter's own glass; excluding its whole
# hull+halo (F) left a dark box round each unlit letter on a washed wall
REST = np.maximum(1 - np.clip(F.sum(0), 0, 1),   # kept as the floor so a fully lit sign is the lit still to the pixel
    1 - np.clip(1.5 * sum(blur(hull(l['pts']) * TUBE, 2) for l in NEON['letters']), 0, 1))
J = [l['ch'] for l in NEON['letters']].index('J')

def level(k, f):   # 0 dark .. 1 lit; P O W E R A C K ignite .15 s apart, the J last, with two blips ≥ 340 ms apart
    t = f / FPS
    if k == J: return 0 if t < 1.70 else 1 if t < 1.75 else 0 if t < 2.10 else 1 if t < 2.17 else .4 if t < 2.50 else 1
    t0 = .30 + .15 * (k if k < J else k - 1)
    return .35 if f == round((t0 + .12) * FPS) else min(1, max(0, (t - t0) / .08))   # 0 → 1 in .08 s, one frame dips to .35

def render():
    w, out = 0.0, []
    for f in range(round(DUR * FPS)):
        lv = np.array([level(k, f) for k in range(len(F))], np.float32)
        w = 1.0 if f / FPS >= 3.0 else w + (lv.mean() - w) * (1 - np.exp(-1 / FPS / .4))   # one-pole, τ .4 s
        a = np.clip(np.clip(np.tensordot(lv, F, 1), 0, 1) + w * REST, 0, 1)[..., None]
        out.append(np.rint(enc(O + D * a) * 255).astype(np.uint8))
    return out

def encode(out, codec):
    args = {'mp4': ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-movflags', '+faststart'],
            'webm': ['-c:v', 'libvpx-vp9', '-b:v', '0', '-row-mt', '1']}[codec]
    crf = 20 if codec == 'mp4' else 32
    while True:   # raise crf by 2 until the file fits the cap
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
            '-i', '-', '-an', '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-colorspace', 'bt709',
            '-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1', '-color_range', 'tv', *args, '-crf', str(crf), out], stdin=subprocess.PIPE)
        for fr in FRAMES: p.stdin.write(fr.tobytes())
        p.stdin.close(); assert p.wait() == 0, f'ffmpeg failed on {out}'
        if os.path.getsize(out) <= CAP: return crf
        crf += 2

if __name__ == '__main__':
    assert level(J, 0) == 0 and all(level(k, round(DUR * FPS) - 1) == 1 for k in range(len(F)))
    FRAMES = render(); first = FRAMES[0]
    assert np.abs(first.astype(int) - O8).max() <= 1, 'frame 0 must be the unlit still'
    assert np.abs(FRAMES[-1].astype(int) - L8).max() <= 1, 'the last frame must be the lit still'
    v = 'media/video/neon-wakes'
    crfs = {c: encode(at('public', f'{v}-1080.{c}'), c) for c in ('mp4', 'webm')}
    man = at('src/data/video.json')
    data = json.load(open(man)) if os.path.exists(man) else {}
    data['neon-wakes'] = {'w': W, 'h': H, 'fps': FPS, 'duration': DUR, 'loop': False,
        'files': {'mp4': f'{v}-1080.mp4', 'webm': f'{v}-1080.webm'},
        'desc': 'The POWERJACK sign wakes letter by letter, the J last: cut by this page from two frames the game rendered, lit and unlit.'}
    json.dump(data, open(man, 'w'), indent=1, ensure_ascii=False); open(man, 'a').write('\n')
    print('crf', crfs, {c: os.path.getsize(at('public', f'{v}-1080.{c}')) for c in crfs})
