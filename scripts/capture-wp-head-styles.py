"""Copy the non-theme stylesheets WordPress prints in <head> (Astra, CF7, core, inline Customizer CSS) into
public/glc/wp/ and record their order relative to the GLC theme sheets in src/rendered/head-styles.json.

Usage: python3 scripts/capture-wp-head-styles.py [page-url]   (default https://glcwebsolutions.co.uk/costs/)
"""

import json
import os
import re
import sys
import urllib.parse
import urllib.request

PAGE = sys.argv[1] if len(sys.argv) > 1 else "https://glcwebsolutions.co.uk/costs/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "glc", "wp")
ORIGIN = "{0.scheme}://{0.netloc}".format(urllib.parse.urlparse(PAGE))


def get(url, binary=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60) as res:
        data = res.read()
        return data if binary else data.decode("utf-8", "replace")


def localise_urls(css, base):
    def repl(m):
        ref = m.group(2).strip()
        if ref.startswith(("data:", "#")):
            return m.group(0)
        absolute = urllib.parse.urljoin(base, ref)
        if not absolute.startswith(ORIGIN):
            return f"url({m.group(1)}{absolute}{m.group(1)})"
        rel = urllib.parse.urlparse(absolute).path.lstrip("/")
        dest = os.path.join(OUT, "assets", rel)
        if not os.path.exists(dest):
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            try:
                with open(dest, "wb") as f:
                    f.write(get(absolute, binary=True))
            except Exception as e:
                print("  asset FAIL", absolute, e)
        return f"url({m.group(1)}/glc/wp/assets/{rel}{m.group(1)})"

    return re.sub(r"url\((['\"]?)([^'\")]+)\1\)", repl, css)


html = get(PAGE)
head = html[: html.find("</head>")]
os.makedirs(OUT, exist_ok=True)
before, after, seen_theme = [], [], False
for m in re.finditer(r"<link[^>]+rel=['\"]stylesheet['\"][^>]*>|<style([^>]*)>(.*?)</style>", head, re.S):
    tag = m.group(0)
    ident = re.search(r"id=['\"]([^'\"]+)['\"]", tag[:300])
    ident = ident.group(1) if ident else f"inline-{m.start()}"
    if "/themes/glc-web-solutions/" in tag or ident == "glc-fonts-css":
        seen_theme = True
        continue
    if tag.startswith("<link"):
        href = re.search(r"href=['\"]([^'\"]+)['\"]", tag).group(1).replace("&#038;", "&")
        css = localise_urls(get(href), href)
    else:
        css = localise_urls(m.group(2), PAGE)
    name = re.sub(r"[^a-z0-9-]", "-", ident.lower()) + ".css"
    with open(os.path.join(OUT, name), "w") as f:
        f.write(css)
    (after if seen_theme else before).append(f"/glc/wp/{name}")
    print(("after " if seen_theme else "before"), name, len(css))

with open(os.path.join(ROOT, "src", "rendered", "head-styles.json"), "w") as f:
    json.dump({"before": before, "after": after}, f, indent="\t")
