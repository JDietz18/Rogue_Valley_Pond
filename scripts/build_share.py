"""Build one self-contained HTML file of the landing page, for sharing.

Every local stylesheet, script and image in site/ is inlined (images as data: URIs),
so the file opens straight from a phone or computer, or can be attached or uploaded
as a single page. The Google Fonts stylesheet stays a link (it falls back to system
fonts offline).

    python3 scripts/build_share.py                 # -> share/rogue-valley-ponds.html
    python3 scripts/build_share.py --fragment OUT  # page body only, for hosts that add their own <head>
"""
import argparse
import base64
import mimetypes
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = ROOT / "share" / "rogue-valley-ponds.html"


def data_uri(rel: str) -> str:
    path = SITE / rel
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def build():
    html = (SITE / "index.html").read_text()
    head, body = html.split("<body>", 1)
    body = body.rsplit("</body>", 1)[0]

    title = re.search(r"<title>(.*?)</title>", head).group(1)
    meta = "\n".join(re.findall(r'<meta (?:name="description"|property="og:[^"]+")[^>]*>', head))
    meta += f'\n<link rel="icon" href="{data_uri(re.search(r"<link rel=\"icon\" href=\"([^\"]+)\"", head).group(1))}">'
    links = re.findall(r'<link rel="stylesheet" href="([^"]+)">', head)
    fonts = "\n".join(f'<link rel="stylesheet" href="{h}">' for h in links if h.startswith("https://"))
    styles = "\n".join(f"<style>\n{(SITE / h).read_text()}\n</style>" for h in links if not h.startswith("https://"))
    styles = re.sub(r"url\((assets/[^)]+)\)", lambda m: f'url("{data_uri(m.group(1))}")', styles)
    # Scripts go at the end of the body, in order, so the DOM exists when they run.
    scripts = "\n".join(f"<script>\n{(SITE / s).read_text()}\n</script>" for s in re.findall(r'<script src="([^"]+)"', head))
    body = re.sub(r'(<img[^>]*?\ssrc=")(assets/[^"]+)"', lambda m: f'{m.group(1)}{data_uri(m.group(2))}"', body)
    return title, meta, fonts + "\n" + styles, body.strip() + "\n" + scripts


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fragment", type=Path, help="write the page without <html>/<head>/<body> to this path")
    args = ap.parse_args()
    title, meta, styles, body = build()
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(
        '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        f"<title>{title}</title>\n{meta}\n{styles}\n</head>\n<body>\n{body}\n</body>\n</html>\n"
    )
    print(f"{OUT.relative_to(ROOT)}  {OUT.stat().st_size / 1e3:.0f} KB")
    if args.fragment:
        args.fragment.write_text(f"<title>{title}</title>\n{styles}\n{body}\n")
        print(f"{args.fragment}  {args.fragment.stat().st_size / 1e3:.0f} KB")


if __name__ == "__main__":
    main()
