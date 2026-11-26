"""Builds the console glow and prompt cloud sprites in public/atlas/assets/fx/.

Run from the repo root: python3 atlas/tools/make_fx.py
Each glow is the console's own pixels turned white (brighter detail glows
more) inside a soft oval, plus a faint halo, so it reads as the console lighting up.
"""
from PIL import Image, ImageDraw
import math, os

OUT = 'public/atlas/assets/fx'
os.makedirs(OUT, exist_ok=True)

# scene, name, console box in scene pixels (x0, y0, x1, y1). Keep in sync with GLOWS in atlas/src/fx.rs.
CONSOLES = [
    ('bridge', 'star_console', (444, 104, 560, 158)),
    ('port', 'workbench', (306, 82, 364, 120)),
    ('archive', 'records', (254, 70, 388, 142)),
]
PAD = 14

for scene, name, (x0, y0, x1, y1) in CONSOLES:
    bg = Image.open(f'public/atlas/assets/scenes/{scene}.png').convert('RGB')
    w, h = x1 - x0 + 2 * PAD, y1 - y0 + 2 * PAD
    out = Image.new('RGBA', (w, h))
    cx, cy = w / 2, h / 2
    rx, ry = (x1 - x0) / 2, (y1 - y0) / 2
    for y in range(h):
        for x in range(w):
            d = math.hypot((x - cx) / rx, (y - cy) / ry)
            halo = max(0.0, 1 - (d - 0.6) / 0.75) if d > 0.6 else 1.0
            a = 0.32 * halo
            sx, sy = x0 - PAD + x, y0 - PAD + y
            if d < 1.0 and 0 <= sx < 640 and 0 <= sy < 360:
                r, g, b = bg.getpixel((sx, sy))
                lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255
                inner = 1 - max(0.0, (d - 0.75) / 0.25)
                a = max(a, min(1.0, (lum - 0.12) * 2.2) * inner)
            out.putpixel((x, y), (255, 255, 255, int(255 * max(0.0, min(1.0, a)))))
    out.save(f'{OUT}/glow_{name}.png')

# Thought cloud: puffs with a 1px outline, plus two trailing puffs.
INK, FILL, SHADE = (42, 22, 40, 255), (255, 255, 255, 255), (214, 222, 236, 255)
W, H = 40, 34
mask = Image.new('L', (W, H))
md = ImageDraw.Draw(mask)
for (x, y, r) in [(11, 12, 8), (20, 9, 9), (29, 12, 8), (15, 17, 7), (25, 17, 7)]:
    md.ellipse([x - r, y - r, x + r, y + r], fill=255)
tails = [(9, 27, 3), (4, 31, 2)]
for (x, y, r) in tails:
    md.ellipse([x - r, y - r, x + r, y + r], fill=255)
cloud = Image.new('RGBA', (W, H))
for y in range(H):
    for x in range(W):
        if mask.getpixel((x, y)):
            edge = any(not (0 <= x + dx < W and 0 <= y + dy < H and mask.getpixel((x + dx, y + dy)))
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            shade = mask.getpixel((x, min(H - 1, y + 2))) == 0 or y > 19
            cloud.putpixel((x, y), INK if edge else (SHADE if shade else FILL))
cloud.save(f'{OUT}/cloud.png')

dot = Image.new('RGBA', (4, 4), INK)
for c in ((0, 0), (3, 0), (0, 3), (3, 3)):
    dot.putpixel(c, (0, 0, 0, 0))
dot.save(f'{OUT}/dot.png')

spark = Image.new('RGBA', (5, 5))
for (x, y, a) in [(2, 0, 160), (2, 1, 230), (0, 2, 160), (1, 2, 230), (2, 2, 255), (3, 2, 230), (4, 2, 160), (2, 3, 230), (2, 4, 160)]:
    spark.putpixel((x, y), (255, 255, 255, a))
spark.save(f'{OUT}/spark.png')
print('ok')

# Character outlines: a 1px dark edge around every opaque silhouette, per cell,
# so the sprites read crisply against the busy scene art.
OUTLINE = (24, 14, 22, 255)
for src, cell in [('player/courier_idle', (48, 64)), ('player/courier_walk', (48, 64)),
                  ('cast/technician/npc', (48, 64)), ('cast/archivist/npc', (48, 64))]:
    im = Image.open(f'public/atlas/assets/{src}.png').convert('RGBA')
    W, H = im.size
    px = im.load()
    out = im.copy()
    op = out.load()
    for y in range(H):
        for x in range(W):
            if px[x, y][3] >= 128:
                continue
            cx, cy = x // cell[0], y // cell[1]
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and nx // cell[0] == cx and ny // cell[1] == cy and px[nx, ny][3] >= 128:
                    op[x, y] = OUTLINE
                    break
    out.save(f'public/atlas/assets/{src}_outlined.png')
print('outlined')
