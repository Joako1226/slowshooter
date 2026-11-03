#!/usr/bin/env python3
"""Genera www/index.html a partir de src/tiro-lento-movil.html (juego) añadiendo
fuentes locales, documento HTML completo y el puente nativo (AdMob + Play Games)."""
import re
src = open('src/tiro-lento-movil.html', encoding='utf8').read()
src = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>\n?', '', src)
fonts = '''<style>
@font-face{font-family:"Rye";font-weight:400;font-display:swap;src:url(fonts/rye-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow Condensed";font-weight:500;font-display:swap;src:url(fonts/barlow-condensed-latin-500-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow Condensed";font-weight:600;font-display:swap;src:url(fonts/barlow-condensed-latin-600-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow Condensed";font-weight:700;font-display:swap;src:url(fonts/barlow-condensed-latin-700-normal.woff2) format("woff2")}
html,body{margin:0;background:#150e1f;overflow:hidden;overscroll-behavior:none}
</style>
'''
head = ('<!doctype html>\n<html lang="es"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'
        '<meta name="theme-color" content="#150e1f">\n' + fonts)
src = src.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
bridge = open('native-bridge.js', encoding='utf8').read()
assert src.count("const ADS = {") == 1
# 1) sustituir el objeto ADS por la versión con AdMob
a = src.index("const ADS = {"); b = src.index("let adTimer = null;")
src = src[:a] + bridge.split('/*--ADS--*/')[1] + src[b:]
# 2) clasificación: enviar puntuación al terminar y botón en el perfil
src = src.replace("  $('dbl').hidden = runStars <= 0;\n", "  $('dbl').hidden = runStars <= 0;\n  submitScoreNative(totalScore);\n", 1)
src = src.replace("    row('Pase de batalla',", "    if (NATIVE) { const lb = el('button', 'mini', 'Clasificación'); lb.type = 'button'; lb.addEventListener('click', showLeaderboardNative); box.appendChild(lb); }\n    row('Pase de batalla',", 1)
src = src.replace("fillIcons(); syncSel(); renderMenu();", "fillIcons(); syncSel(); renderMenu(); initNative();", 1)
html = head + src + '</body></html>\n'
# la parte previa al <title> ya es el head; asegurar cierre de head antes del cuerpo
html = html.replace('</style>\n\n<div class="stage"', '</style>\n</head><body>\n<div class="stage"', 1)
open('www/index.html', 'w', encoding='utf8').write(html)
print('www/index.html generado', len(html), 'bytes')
