"""Compare every URL in the live WordPress sitemap against the EmDash preview.

Reports HTTP status and <title>/meta description differences.
Usage: python3 scripts/parity-check.py <live-origin> <preview-origin> <out.json>
"""

import html
import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

LIVE, PREVIEW, OUT = sys.argv[1].rstrip("/"), sys.argv[2].rstrip("/"), sys.argv[3]
UA = {"User-Agent": "Mozilla/5.0 (GLC EmDash parity check)"}


def get(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=45) as res:
            return res.status, res.read().decode("utf-8", "replace"), res.url
    except urllib.error.HTTPError as e:
        return e.code, "", url
    except Exception as e:
        return 0, str(e), url


def locs(xml):
    return re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml)


def head(page):
    t = re.search(r"<title[^>]*>(.*?)</title>", page, re.S | re.I)
    d = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)', page, re.I)
    norm = lambda s: re.sub(r"\s+", " ", html.unescape(html.unescape(s))).strip() if s else None
    return norm(t.group(1)) if t else None, norm(d.group(1)) if d else None


_, index, _ = get(LIVE + "/sitemap_index.xml")
urls = []
for sm in locs(index):
    _, xml, _ = get(sm)
    urls.extend(u for u in locs(xml) if not re.search(r"\.(jpe?g|png|gif|webp|svg)$", u, re.I))
urls = sorted(set(urls))


def check(url):
    path = url.replace(LIVE, "", 1) or "/"
    ls, lpage, _ = get(url)
    ps, ppage, final = get(PREVIEW + path)
    lt, ld = head(lpage)
    pt, pd = head(ppage)
    return {
        "path": path, "live_status": ls, "preview_status": ps,
        "redirected_to": final if final != PREVIEW + path else None,
        "title_match": lt == pt, "desc_match": ld == pd,
        "live_title": lt, "preview_title": pt, "live_desc": ld, "preview_desc": pd,
    }


with ThreadPoolExecutor(6) as pool:
    rows = list(pool.map(check, urls))

json.dump(rows, open(OUT, "w"), indent=1)
ok = [r for r in rows if r["preview_status"] == 200 and not r["redirected_to"]]
print(f"sitemap urls={len(rows)} preview_200={len(ok)} title_match={sum(r['title_match'] for r in ok)} desc_match={sum(r['desc_match'] for r in ok)}")
for r in rows:
    if r["preview_status"] != 200 or r["redirected_to"]:
        print(f"  MISSING {r['preview_status']} {r['path']} -> {r['redirected_to'] or ''}")
