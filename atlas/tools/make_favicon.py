"""Site favicon from Erikk's greeting portrait: a round face badge."""
import base64, io
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
src = Image.open(ROOT / "public/atlas/assets/portraits/live.png").convert("RGBA")
cx, cy, half = 386, 76, 66          # greeting frame, face centre
face = src.crop((cx - half, cy - half, cx + half, cy + half))

def badge(n: int) -> Image.Image:
    big = 512
    out = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, big - 1, big - 1), fill=255)
    bg = Image.new("RGBA", (big, big), (36, 18, 30, 255))
    bg.alpha_composite(face.resize((big, big), Image.LANCZOS))
    out.paste(bg, (0, 0), mask)
    ImageDraw.Draw(out).ellipse((6, 6, big - 7, big - 7), outline=(232, 186, 74, 255), width=14)
    return out.resize((n, n), Image.LANCZOS)

pub = ROOT / "public"
for n, name in [(192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png"), (32, "favicon-32.png")]:
    badge(n).save(pub / name, optimize=True)
badge(64).save(pub / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
buf = io.BytesIO(); badge(64).save(buf, "PNG", optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
(pub / "favicon.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64">'
    f'<image width="64" height="64" href="data:image/png;base64,{b64}"/></svg>\n')
print("ok")
