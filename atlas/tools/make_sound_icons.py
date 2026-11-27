"""Sound on/off icons for the bottom-left tray, painted to sit beside the
menu icons (brass body, navy outline, cream waves; an amber cross when off).

    python3 atlas/tools/make_sound_icons.py
"""
from pathlib import Path
import random

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[2] / "public/atlas/assets/ui/menu"
S = 4  # supersample
N = 192

OUTLINE = (24, 26, 40, 255)
BRASS = (205, 142, 82, 255)
BRASS_HI = (236, 186, 120, 255)
BRASS_LO = (150, 94, 52, 255)
NAVY = (62, 78, 104, 255)
CREAM = (240, 226, 192, 255)
AMBER = (232, 104, 44, 255)


def speaker(d: ImageDraw.ImageDraw, k: float) -> None:
    def P(pts):
        return [(x * k, y * k) for x, y in pts]

    body = P([(30, 74), (64, 74), (108, 38), (108, 154), (64, 118), (30, 118)])
    d.polygon(body, fill=OUTLINE)
    inner = P([(38, 82), (66, 82), (100, 55), (100, 137), (66, 110), (38, 110)])
    d.polygon(inner, fill=BRASS)
    # Light from the top left, shade at the bottom.
    d.polygon(P([(38, 82), (66, 82), (100, 55), (100, 70), (68, 92), (38, 92)]), fill=BRASS_HI)
    d.polygon(P([(38, 102), (68, 102), (100, 124), (100, 137), (66, 110), (38, 110)]), fill=BRASS_LO)
    # The grille box at the back of the speaker.
    d.rectangle(P([(42, 86), (62, 106)]), fill=NAVY, outline=OUTLINE, width=int(3 * k))


def waves(d: ImageDraw.ImageDraw, k: float) -> None:
    for r, w in [(26, 9), (46, 9), (66, 9)]:
        box = [(108 - r) * k, (96 - r) * k, (108 + r) * k, (96 + r) * k]
        d.arc(box, -48, 48, fill=OUTLINE, width=int((w + 6) * k))
        d.arc(box, -44, 44, fill=CREAM, width=int(w * k))


def cross(d: ImageDraw.ImageDraw, k: float) -> None:
    for a, b in [((124, 70), (170, 122)), ((170, 70), (124, 122))]:
        d.line([a[0] * k, a[1] * k, b[0] * k, b[1] * k], fill=OUTLINE, width=int(22 * k))
    for a, b in [((124, 70), (170, 122)), ((170, 70), (124, 122))]:
        d.line([a[0] * k, a[1] * k, b[0] * k, b[1] * k], fill=AMBER, width=int(13 * k))


def grain(im: Image.Image) -> Image.Image:
    # A little painted noise so the flat fills match the menu icons.
    rnd = random.Random(7)
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a:
                n = rnd.randint(-9, 9)
                px[x, y] = (max(0, min(255, r + n)), max(0, min(255, g + n)), max(0, min(255, b + n)), a)
    return im


def make(on: bool) -> Image.Image:
    big = Image.new("RGBA", (N * S, N * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    speaker(d, S)
    if on:
        waves(d, S)
    else:
        cross(d, S)
    # Fill the cell like the other menu icons do.
    big = big.crop(big.getbbox())
    k = (N - 12) * S / max(big.size)
    big = big.resize((round(big.width * k), round(big.height * k)), Image.LANCZOS)
    cell = Image.new("RGBA", (N * S, N * S), (0, 0, 0, 0))
    cell.alpha_composite(big, ((N * S - big.width) // 2, (N * S - big.height) // 2))
    im = cell.resize((N, N), Image.LANCZOS).filter(ImageFilter.SMOOTH)
    return grain(im)


if __name__ == "__main__":
    make(True).save(OUT / "sound_on.png")
    make(False).save(OUT / "sound_off.png")
    print("wrote", OUT / "sound_on.png", OUT / "sound_off.png")
