#!/usr/bin/env python3
"""Genera los iconos de Android a partir de assets/icon-only.png (sin @capacitor/assets).
Escribe ic_launcher.png, ic_launcher_round.png e ic_launcher_foreground.png en cada mipmap
y borra el icono adaptable por defecto de Capacitor para que se use SIEMPRE tu logo."""
import os, shutil, sys
from PIL import Image, ImageDraw

SRC = 'assets/icon-only.png'
RES = 'android/app/src/main/res'
if not os.path.isfile(SRC):
    sys.exit('ERROR: no existe ' + SRC + ' (debe estar en la raiz del repo, junto a package.json)')
im = Image.open(SRC).convert('RGBA')
print('icon-only.png:', im.size)
if im.width != im.height:
    side = min(im.size)
    l, t = (im.width - side) // 2, (im.height - side) // 2
    im = im.crop((l, t, l + side, t + side))
    print('recortado a cuadrado', im.size)
SIZES = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
for d, px in SIZES.items():
    out = os.path.join(RES, 'mipmap-' + d)
    os.makedirs(out, exist_ok=True)
    sq = im.resize((px, px), Image.LANCZOS)
    sq.save(os.path.join(out, 'ic_launcher.png'))
    mask = Image.new('L', (px * 4, px * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, px * 4 - 1, px * 4 - 1), fill=255)
    mask = mask.resize((px, px), Image.LANCZOS)
    rd = sq.copy(); rd.putalpha(mask)
    rd.save(os.path.join(out, 'ic_launcher_round.png'))
    fg = int(px * 108 / 48)
    canvas = Image.new('RGBA', (fg, fg), (0, 0, 0, 0))
    inner = int(fg * 0.66)
    canvas.paste(im.resize((inner, inner), Image.LANCZOS), ((fg - inner) // 2, (fg - inner) // 2))
    canvas.save(os.path.join(out, 'ic_launcher_foreground.png'))
    print('ok', d, px)
shutil.rmtree(os.path.join(RES, 'mipmap-anydpi-v26'), ignore_errors=True)
print('icono adaptable por defecto eliminado: se usara tu logo en todas las versiones de Android')
