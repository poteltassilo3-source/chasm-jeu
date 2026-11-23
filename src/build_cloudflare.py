"""Fabrique cloudflare/public/index.html à partir de index.html (version Claude).
On insère la couche réseau Cloudflare (reseau_cloudflare.js) avant le script du jeu.
Usage, depuis la racine du dépôt : python3 src/build_cloudflare.py"""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
net = (root / 'cloudflare' / 'reseau_cloudflare.js').read_text(encoding='utf-8')
marker = '<script>'
i = html.index(marker)
html = html[:i] + '<script>\n' + net + '\n</script>\n' + html[i:]
html = html.replace("'● MODE LOCAL'", "'● HORS LIGNE'")
out = root / 'cloudflare' / 'public' / 'index.html'
out.write_text(html, encoding='utf-8')
print('écrit :', out.relative_to(root))
