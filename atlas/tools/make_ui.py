"""Builds the JRPG menu background and pixel icons in public/atlas/assets/ui/.

Run from the repo root: python3 atlas/tools/make_ui.py
"""
from PIL import Image, ImageDraw
import os, random

OUT = 'public/atlas/assets/ui'
os.makedirs(OUT, exist_ok=True)
random.seed(7)

BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
BRASS, LIGHT, DARK, INK = (204, 140, 77), (240, 194, 122), (107, 61, 30), (20, 8, 20)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def gradient(w, h, top, bottom, steps=6):
    """Banded, ordered-dithered vertical gradient, the way 16-bit menus did it."""
    im = Image.new('RGB', (w, h))
    px = im.load()
    for y in range(h):
        for x in range(w):
            t = y / max(1, h - 1) * steps
            band = int(t) + (1 if (t - int(t)) * 16 > BAYER[y % 4][x % 4] else 0)
            px[x, y] = lerp(top, bottom, min(steps, band) / steps)
    return im

def frame(d, x0, y0, x1, y1, rivets=True):
    d.rectangle([x0, y0, x1, y1], outline=INK)
    d.rectangle([x0 + 1, y0 + 1, x1 - 1, y1 - 1], outline=BRASS)
    d.line([x0 + 1, y0 + 1, x1 - 1, y0 + 1], fill=LIGHT)
    d.line([x0 + 1, y0 + 1, x0 + 1, y1 - 1], fill=LIGHT)
    d.line([x0 + 2, y1 - 1, x1 - 1, y1 - 1], fill=DARK)
    d.line([x1 - 1, y0 + 2, x1 - 1, y1 - 1], fill=DARK)
    d.rectangle([x0 + 2, y0 + 2, x1 - 2, y1 - 2], outline=INK)
    d.rectangle([x0 + 4, y0 + 4, x1 - 4, y1 - 4], outline=(110, 72, 40))
    if rivets:
        for (cx, cy) in [(x0 + 4, y0 + 4), (x1 - 4, y0 + 4), (x0 + 4, y1 - 4), (x1 - 4, y1 - 4)]:
            d.polygon([(cx, cy - 3), (cx + 3, cy), (cx, cy + 3), (cx - 3, cy)], fill=BRASS, outline=INK)
            d.point((cx - 1, cy - 1), fill=LIGHT)

# Menu: 584 x 332, the size of the menu window in the 640 x 360 frame.
W, H = 584, 332
bg = gradient(W, H, (26, 12, 30), (14, 22, 44))
d = ImageDraw.Draw(bg)
# Stars and a couple of constellations.
for _ in range(170):
    x, y = random.randrange(8, W - 8), random.randrange(8, H - 8)
    c = random.choice([(90, 96, 130), (120, 120, 150), (170, 160, 140)])
    d.point((x, y), fill=c)
for (x, y) in [(470, 40), (520, 300), (200, 310), (560, 140), (300, 26)]:
    d.point((x, y), fill=(233, 235, 158))
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        d.point((x + dx, y + dy), fill=(150, 140, 100))
frame(d, 0, 0, W - 1, H - 1)
# Tab column: an inset plate.
tab = gradient(98, 270, (40, 18, 30), (26, 14, 30), 4)
bg.paste(tab, (12, 26))
frame(d, 10, 24, 112, 298, rivets=False)
# Title plate for "MENU".
d.rectangle([12, 6, 72, 20], fill=(40, 18, 30))
frame(d, 10, 4, 74, 22, rivets=False)
bg.save(f'{OUT}/menu_bg.png')

# Selection bar for the active row/tab: brass edged, warm fill.
sel = Image.new('RGBA', (96, 18), (0, 0, 0, 0))
sd = ImageDraw.Draw(sel)
sd.rectangle([0, 0, 95, 17], fill=(238, 140, 64, 70), outline=BRASS)
sd.line([1, 1, 94, 1], fill=LIGHT)
sel.save(f'{OUT}/select.png')

PAL = {
    'K': (26, 14, 22), 'B': BRASS, 'L': LIGHT, 'D': DARK, 'W': (241, 238, 230), 'C': (233, 235, 158),
    'O': (238, 140, 64), 'T': (121, 148, 150), 'R': (192, 80, 58), 'N': (42, 51, 80), 'S': (224, 160, 112),
    'H': (58, 36, 32), 'G': (172, 193, 150),
}
ICONS = {
    'status': """
................
.....KKKKKK.....
....KHHHHHHK....
...KHHHHHHHHK...
...KHSSSSSSHK...
...KSSKSSKSSK...
...KSSSSSSSSK...
...KHSSKKSSHK...
....KHHSSHHK....
.....KKKKKK.....
...KKOOWWOOKK...
..KOOOOWWOOOOK..
.KOOOOOWWOOOOOK.
.KOOOOOOOOOOOOK.
.KKKKKKKKKKKKKK.
................""",
    'items': """
................
.....KKKKKK.....
....KDK..KDK....
....KDK..KDK....
..KKKKKKKKKKKK..
.KLLLLLLLLLLLLK.
.KBBBBBBBBBBBBK.
.KBBBBKCCKBBBBK.
.KBBBBKCCKBBBBK.
.KBBBBBKKBBBBBK.
.KBBBBBBBBBBBBK.
.KBBBBBBBBBBBBK.
.KDBBBBBBBBBBDK.
.KDDDDDDDDDDDDK.
..KKKKKKKKKKKK..
................""",
    'quests': """
................
..KKKKKKKKKKK...
.KLBBBBBBBBBLK..
.KLKKLWWWWWWLK..
..KWWWWWWWWWK...
..KWKKKKKKWWK...
..KWWWWWWWWWK...
..KWKKKKKWWWK...
..KWWWWWWWWWK...
..KWKKKKKKKWK...
..KWWWWWWWWWK...
..KWKKKKWWRRK...
.KLBBBBBBBRRLK..
.KLLLLLLLLLLLK..
..KKKKKKKKKKK...
................""",
    'map': """
................
.....KKKKKK.....
...KKBBBBBBKK...
..KBBNNNNNNBBK..
..KBNNNNRNNNBK..
.KBNNNNRRNNNNBK.
.KBNNNNRRNNNNBK.
.KLNNNKWWKNNNBK.
.KLNNNKWWKNNNBK.
.KBNNNNCCNNNNBK.
.KBNNNNCCNNNNBK.
..KBNNNCNNNNBK..
..KBBNNNNNNBBK..
...KKBBBBBBKK...
.....KKKKKK.....
................""",
    'credential': """
................
...KKK....KKK...
...KTTK..KRRK...
....KTTKKRRK....
.....KTTRRK.....
......KTRK......
.....KKKKKK.....
....KBLLLLBK....
...KBLBBBBLBK...
...KLBBCCBBLK...
...KLBCCCCBLK...
...KLBBCCBBLK...
...KBLBBBBLBK...
....KBLLLLBK....
.....KKKKKK.....
................""",
    'degree': """
................
................
.......KK.......
.....KKNNKK.....
...KKNNNNNNKK...
.KKNNNNNNNNNNKK.
KNNNNNNNNNNNNNNK
.KKNNNNNNNNNNKKO
...KKNNNNNNKK.KO
...KDKKNNKKDK.KO
...KDDDKKDDDK.CC
...KDDDDDDDDK.CC
...KKDDDDDDKK...
.....KKKKKK.....
................
................""",
    'quest_active': """
................
.......KK.......
......KCCK......
......KCCK......
.....KCCCCK.....
KKKKKKCCCCKKKKKK
KCCCCCCCCCCCCCCK
.KCCCCCCCCCCCCK.
..KCCCCCCCCCCK..
...KCCCCCCCCK...
...KCCCCCCCCK...
..KCCCCKKCCCCK..
..KCCCK..KCCCK..
.KCCK......KCCK.
.KKK........KKK.
................""",
    'quest_done': """
................
................
.............KK.
............KGGK
...........KGGK.
..........KGGK..
.KK......KGGK...
KGGK....KGGK....
.KGGK..KGGK.....
..KGGKKGGK......
...KGGGGK.......
....KGGK........
.....KK.........
................
................
................""",
}
for name, art in ICONS.items():
    rows = [r for r in art.strip('\n').split('\n')]
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row[:16]):
            if ch in PAL:
                im.putpixel((x, y), PAL[ch] + (255,))
    im.save(f'{OUT}/icon_{name}.png')
print('ui ok')

# Key prompts: an E keycap, and a tapping finger for touch screens.
KEY = {
    'key_e': """
..KKKKKKKKKKK..
.KWWWWWWWWWWWK.
.KWWWWWWWWWWWK.
.KWWWKKKKKWWWK.
.KWWWKWWWWWWWK.
.KWWWKWWWWWWWK.
.KWWWKKKKWWWWK.
.KWWWKWWWWWWWK.
.KWWWKWWWWWWWK.
.KWWWKKKKKWWWK.
.KWWWWWWWWWWWK.
.KTTTTTTTTTTTK.
.KTTTTTTTTTTTK.
..KKKKKKKKKKK..
...............""",
    'key_tap': """
.....KK........
....KWWK.......
....KWWK.......
....KWWKKK.....
....KWWKWWKK...
..KKKWWKWWKWK..
.KWWKWWWWWKWWK.
.KWWKWWWWWWWWK.
..KWWWWWWWWWWK.
..KWWWWWWWWWWK.
...KWWWWWWWWK..
...KWWWWWWWWK..
....KWWWWWWK...
....KKKKKKKK...
...............""",
}
for name, art in KEY.items():
    rows = art.strip('\n').split('\n')
    im = Image.new('RGBA', (15, 15), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row[:15]):
            if ch in PAL:
                im.putpixel((x, y), PAL[ch] + (255,))
    im.save(f'{OUT}/{name}.png')
print('keys ok')
