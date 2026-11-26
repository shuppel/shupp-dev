"""The Shupp display font's apostrophe sits in a 1000-unit-wide cell, so
"Captain's" renders as "Captain ' s" in the game HUD. Redraw it shifted left
in a narrow cell. Only the game's copy is patched.

Usage: python3 atlas/tools/fix_font_apostrophe.py
"""
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

PATH = "public/atlas/assets/fonts/Shupp.otf"
f = TTFont(PATH)
name = f.getBestCmap()[ord("'")]
gs = f.getGlyphSet()
adv, lsb = f["hmtx"][name]
if adv > 400:
    shift = -(lsb - 70)
    pen = T2CharStringPen(200, gs)
    gs[name].draw(TransformPen(pen, (1, 0, 0, 1, shift, 0)))
    cff = f["CFF "].cff
    top = cff.topDictIndex[0]
    cs = pen.getCharString(private=top.CharStrings[name].private, globalSubrs=cff.GlobalSubrs)
    top.CharStrings[name] = cs
    f["hmtx"][name] = (200, 70)
    f.save(PATH)
    print("patched", name)
else:
    print("already narrow")
