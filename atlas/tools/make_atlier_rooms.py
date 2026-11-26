"""The Atlier's new rooms from Erikk's art: the garden concourse bridge, the
Captain's Quarters, their props and walk masks, and the cutaway ship map.

Usage: python3 atlas/tools/make_atlier_rooms.py   (then optimize_pngs.py)
Sources live in atlas/tools/sources/. Coordinates below are logical scene
pixels (640 x 360); keep them in sync with scene_def in atlas/src/lib.rs.
"""
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

S = "atlas/tools/sources/"
A = "public/atlas/assets/"
M = "atlas/masks/"

# --- Backdrops (2x source art, shown at 640 x 360) -----------------------------
bridge = Image.open(S + "bridge-concourse.png").convert("RGB").resize((1280, 720), Image.LANCZOS)
bridge.save(A + "scenes/bridge.png")
quarters = Image.open(S + "captains-quarters.png").convert("RGB").resize((1280, 720), Image.LANCZOS)
quarters.save(A + "scenes/quarters.png")

# --- Walk masks -----------------------------------------------------------------
# The concourse: the plaza, the path back toward the archive, the foot of the
# treehouse stairs and the top of the stairwell down to the engine room.
BRIDGE_FLOOR = [
    (0, 304), (60, 288), (110, 262), (160, 240), (196, 226), (206, 210), (212, 196),
    (250, 194), (296, 176), (318, 152), (342, 130), (392, 130), (398, 150),
    (412, 172), (462, 182), (540, 188), (600, 200), (606, 212), (566, 230),
    (522, 296), (506, 360), (0, 360),
]
# The cabin floor, stopping at the furniture along the back wall.
QUARTERS_FLOOR = [
    (74, 174), (186, 174), (190, 182), (236, 182), (240, 174), (546, 174),
    (548, 186), (622, 186), (640, 206), (640, 360), (0, 360), (0, 292),
    (18, 270), (58, 216),
]


def mask(poly, holes=()):
    m = Image.new("L", (640, 360), 0)
    d = ImageDraw.Draw(m)
    d.polygon(poly, fill=255)
    for h in holes:
        d.polygon(h, fill=0)
    return m.convert("RGB")


# The treehouse stairs, up to the landing at the quarters door.
TREEHOUSE_STAIRS = [(206, 198), (250, 198), (240, 170), (228, 140), (222, 124), (172, 124), (172, 140), (206, 142), (210, 166)]
bm = Image.new("L", (640, 360), 0)
bd = ImageDraw.Draw(bm)
bd.polygon(BRIDGE_FLOOR, fill=255)
bd.polygon(TREEHOUSE_STAIRS, fill=255)
bm.convert("RGB").save(M + "bridge_walkable.png")
# Pongo's bed is solid (keep in sync with PET_BED in lib.rs).
mask(QUARTERS_FLOOR, [[(424, 192), (478, 192), (478, 212), (424, 212)]]).save(M + "quarters_walkable.png")

# --- Glows (same recipe as make_fx.py, from the new bridge) ------------------
small = bridge.resize((640, 360), Image.LANCZOS)
# keep in sync with GLOWS in fx.rs
for name, (x0, y0, x1, y1) in [("star_console", (506, 116, 592, 162)), ("treehouse_door", (170, 84, 212, 136))]:
    PAD = 14
    w, h = x1 - x0 + 2 * PAD, y1 - y0 + 2 * PAD
    glow = Image.new("RGBA", (w, h))
    cx, cy, rx, ry = w / 2, h / 2, (x1 - x0) / 2, (y1 - y0) / 2
    for y in range(h):
        for x in range(w):
            d = math.hypot((x - cx) / rx, (y - cy) / ry)
            a = 0.32 * (max(0.0, 1 - (d - 0.6) / 0.75) if d > 0.6 else 1.0)
            sx, sy = x0 - PAD + x, y0 - PAD + y
            if d < 1.0 and 0 <= sx < 640 and 0 <= sy < 360:
                r, g, b = small.getpixel((sx, sy))
                lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255
                a = max(a, min(1.0, (lum - 0.12) * 2.2) * (1 - max(0.0, (d - 0.75) / 0.25)))
            glow.putpixel((x, y), (255, 255, 255, int(255 * max(0.0, min(1.0, a)))))
    glow.save(A + f"fx/glow_{name}.png")

# --- Props ------------------------------------------------------------------------
# The sheet's background is noisy, nearly transparent speckle: keep only the
# solid object grown from a seed inside each one.
sheet = Image.open(S + "props-petbed-chair-fern.png").convert("RGBA")
solid = sheet.getchannel("A").point(lambda v: 255 if v >= 200 else 0).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
PROPS = [  # name, seed inside the object, logical size (drawn at 2x)
    ("pet_bed", (560, 470), 56),
    ("captain_chair", (1130, 420), 34),
    ("fern", (1780, 470), 46),
]
for name, seed, width in PROPS:
    m = solid.copy()
    ImageDraw.floodfill(m, seed, 128)
    keep = m.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(3))
    obj = sheet.copy()
    obj.putalpha(Image.fromarray(np.minimum(np.array(sheet.getchannel("A")), np.array(keep))))
    obj = obj.crop(keep.getbbox())
    W = width * 2
    H = round(obj.height * W / obj.width)
    obj.resize((W, H), Image.LANCZOS).save(A + f"props/quarters/{name}.png")
    print(name, (W // 2, H // 2))

# --- Ship map: the cutaway, cropped to the hull -----------------------------------
cut = Image.open(S + "atlier-cutaway.png").convert("RGB")
CROP = (10, 85, 1760, 720)  # keep in sync with CUT in ui.rs
cut = cut.crop(CROP)
cut.resize((1200, round(1200 * cut.height / cut.width)), Image.LANCZOS).save(A + "ships/atlier/cutaway.png")
print("cutaway", 1200, round(1200 * cut.height / cut.width))
