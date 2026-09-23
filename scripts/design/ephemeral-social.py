"""Rebuild the Ephemeral sharing card as SVG. Requires fonttools.
Rasterize the SVG to PNG with an SVG renderer (for example sharp).
The approved fonts are converted to paths so rendering does not depend on host fonts.
"""
from pathlib import Path
from html import escape
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/ephemeral'
fonts = {name: TTFont(OUT / 'fonts' / path) for name, path in {
    'serif': 'martel-regular.woff',
    'sans': 'nunito-sans-regular.woff',
    'bold': 'nunito-sans-semibold.woff',
}.items()}
parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">',
         '<title id="title">Ephemeral UI: your day changes. Your tools follow.</title>',
         '<desc id="desc">Black, white and canary-yellow cards for morning preparation, afternoon calls and evening reflection.</desc>']
def rect(x,y,w,h,fill='white',r=0,stroke='black'):
    parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}"/>')
def line(x1,y1,x2,y2):
    parts.append(f'<path d="M{x1} {y1}H{x2}" fill="none" stroke="black"/>' if y1==y2 else f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="black"/>')
def text(content,x,y,size=16,font='sans',fill='black'):
    f=fonts[font]; glyphs=f.getGlyphSet(); cmap=f.getBestCmap(); scale=size/f['head'].unitsPerEm
    paths=[];cursor=0
    for char in content:
        name=cmap.get(ord(char),'.notdef'); pen=SVGPathPen(glyphs);glyphs[name].draw(pen)
        if pen.getCommands(): paths.append(f'<path transform="translate({cursor:.2f} 0)" d="{pen.getCommands()}"/>')
        cursor+=f['hmtx'][name][0]
    parts.append(f'<g aria-label="{escape(content,quote=True)}" transform="translate({x} {y}) scale({scale} {-scale})" fill="{fill}">{"".join(paths)}</g>')
rect(0,0,1200,630,stroke='none')
rect(48,42,43,43,'#F4FF00');text('e.',56,75,31,'serif')
text('ephemeral',104,72,24,'bold');text('A DESIGN SYSTEM FOR THE MOMENT',48,141,12,'bold')
text('Your day',44,226,57,'serif');text('changes.',44,299,57,'serif')
rect(45,366,466,15,'#F4FF00',stroke='none')
text('Your tools follow.',44,375,48,'serif')
text('Same work. Different needs.',48,435,21)
text('An interactive study in adaptive UI.',48,469,17)
text('SHUPP.DEV / EPHEMERAL',48,575,12,'bold')
# Three recognizable components, loosely arranged.
rect(590,48,382,148,r=12);rect(612,66,116,28,'#F4FF00',14)
text('08:30 / PREPARE',624,85,11,'bold');text('Before the first meeting',612,121,22,'serif')
for yy,label in [(151,'Set the agenda'),(177,'Review Mara’s work')]:
    rect(613,yy-12,12,12,r=2);text(label,637,yy,14)
line(974,122,1020,122);line(1020,122,1020,223)
rect(702,224,450,166,r=12);rect(724,242,142,28,'#F4FF00',14)
text('15:00 / REACH OUT',737,261,11,'bold');text('Jules Park',724,307,24,'serif')
text('Pilot follow-up',724,336,14)
rect(724,351,161,24,'#F4FF00',12);text('CALL + ACTION ITEMS',737,368,10,'bold')
parts.append('<circle cx="1104" cy="292" r="23" fill="#F4FF00" stroke="black"/>')
text('JP',1093,299,18,'bold')
line(764,390,764,422);line(764,422,681,422)
rect(588,423,418,156,r=12);rect(609,441,145,28,'#F4FF00',14)
text('19:30 / WIND DOWN',621,460,11,'bold');text('A small place to reflect.',610,504,23,'serif')
text('What moved forward?',610,535,14);text('What can wait until tomorrow?',610,560,14)
parts.append('</svg>')
(OUT/'ephemeral-social.svg').write_text('\n'.join(parts)+'\n')
