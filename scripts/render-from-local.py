"""Render every page from the Local WordPress site into static body HTML for the Astro templates.

Writes content/rendered/<key>.html (raw; `node scripts/optimise.mjs` turns these into the served
public/glc/rendered/ assets), src/rendered/manifest.json and downloads referenced uploads into
public/glc/uploads/. Header/footer/CSS/JS are not captured (ported separately into Base.astro).

Tag and author archives are followed through their rel="next" pages. The blog and category listings
aren't paged: src/components/glc/blog/BlogIndex.astro lists every post on one page.

Usage: python3 scripts/render-from-local.py [local-origin] [--paged-only]   (default http://glc-web-solutions.local)
  --paged-only  render just the author archive and tag/author pages 2+, merged into the existing manifest
"""

import html as htmllib
import json
import os
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
PAGED_ONLY = "--paged-only" in sys.argv
LOCAL = (ARGS[0] if ARGS else "http://glc-web-solutions.local").rstrip("/")
HOST = re.sub(r"^https?://", "", LOCAL)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "content", "rendered")
UPLOADS = os.path.join(ROOT, "public", "glc", "uploads")
TRADES = ("electricians", "pubs", "landscapers")
THEME_PATH = "/wp-content/themes/glc-web-solutions/"
# Linked from every post byline but absent from the Yoast sitemaps
EXTRA_ARCHIVES = ("/author/gareth-cross/",)


def get(url, binary=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "glc-render"}), timeout=60) as res:
        data = res.read()
        return data if binary else data.decode("utf-8", "replace")


def locs(xml):
    return re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml)


def key_for(path):
    return path.strip("/").replace("/", "__") or "index"


POST_BODY = "<!--glc-post-body-->"


def div_inner(html, start):
    """(start, end) of the inner HTML of the <div> opening at index `start`."""
    i = html.find(">", start) + 1
    depth, pos = 1, i
    tag = re.compile(r"<(/?)div\b[^>]*>", re.I)
    while depth:
        m = tag.search(html, pos)
        if not m:
            raise ValueError("unbalanced div")
        depth += -1 if m.group(1) else 1
        pos = m.end()
    return i, m.start()


def extract_content(html, post=False):
    start = html.find('<div id="content" class="site-content">')
    if start < 0:
        raise ValueError("no #content")
    a, b = div_inner(html, start)
    content = html[a:b]
    if post:
        entry = re.search(r'<div class="entry-content[^"]*"', content)
        if not entry:
            raise ValueError("no .entry-content")
        ea, eb = div_inner(content, entry.start())
        content = content[:ea] + POST_BODY + content[eb:]
    return content


uploads = set()
sizes = {}


def rewrite(fragment):
    fragment = re.sub(r"https?://" + re.escape(HOST) + r"(?=[/\"'?#\s]|$)", "", fragment)
    fragment = re.sub(r"https?:\\/\\/" + re.escape(HOST), "", fragment)
    fragment = re.sub(r"(\?|&#038;|&amp;|&)ver=[\w.\-]+", "", fragment)
    fragment = fragment.replace(THEME_PATH, "/glc/")
    fragment = re.sub(r'<p class="glc-recaptcha-notice">.*?</p>', "", fragment, flags=re.S)
    fragment = re.sub(r'<input type="hidden" name="_wpcf7_recaptcha_response" value="" />', "", fragment)
    for m in re.finditer(r"/wp-content/uploads/([^\s\"'()<>?#,]+)", fragment):
        uploads.add(m.group(1))
    return fragment.replace("/wp-content/uploads/", "/glc/uploads/")


def render(item):
    url, kind = item
    path = re.sub(r"^https?://[^/]+", "", url) or "/"
    html = get(url)
    body = re.search(r"<body[^>]*class=\"([^\"]*)\"", html)
    classes = [c for c in (body.group(1).split() if body else []) if c not in ("glc-theme", "glc-has-custom-chrome")]
    styles = set(re.findall(r"<link[^>]+id='glc-([a-z-]+)-css'", html))
    head = html[: html.find("</head>")]
    jsonld = "".join(
        re.sub(r"https?:(\\?/){2}" + re.escape(HOST), "{{origin}}", m.group(0))
        for m in re.finditer(r"<script type=\"application/ld\+json\"[^>]*>.*?</script>", head, re.S)
    )
    for m in re.finditer(r"\{\{origin\}\}/wp-content/uploads/([^\s\"'?#]+)", jsonld):
        uploads.add(m.group(1))
    jsonld = jsonld.replace("{{origin}}/wp-content/uploads/", "{{origin}}/glc/uploads/").replace(
        "{{origin}}" + THEME_PATH, "{{origin}}/glc/"
    )
    content = rewrite(extract_content(html, post=kind == "post")).strip()
    key = key_for(path)
    # The theme and Yoast spell the organisation @id differently; one spelling keeps it one entity
    page_html = (content + "\n" + jsonld + "\n").replace("{{origin}}#organization", "{{origin}}/#organization")
    with open(os.path.join(OUT_DIR, key + ".html"), "w") as f:
        f.write(page_html)
    sizes[path] = len(content)
    desc = re.search(r'<meta name="description" content="([^"]*)"', head)
    title = re.search(r"<title>(.*?)</title>", head, re.S)
    return path, {
        "key": key,
        "kind": kind,
        **({"title": htmllib.unescape(title.group(1).strip())} if kind == "archive" and title else {}),
        **({"description": htmllib.unescape(desc.group(1))} if kind == "archive" and desc else {}),
        "bodyClass": classes,
        "sections": "home" in styles,
        "trade": next((t for t in TRADES if t in styles), None),
    }


def next_page(url):
    m = re.search(r'<link rel="next" href="([^"]+)"', get(url))
    return m.group(1) if m else None


def later_pages(url):
    """Listing pages after `url`, following rel="next"."""
    pages = []
    while url := next_page(url):
        pages.append(url)
    return pages


def download(rel):
    dest = os.path.join(UPLOADS, rel)
    if os.path.exists(dest):
        return "skip"
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        data = get(f"{LOCAL}/wp-content/uploads/{rel}", binary=True)
    except Exception as e:
        return f"FAIL {rel} {e}"
    with open(dest, "wb") as f:
        f.write(data)
    return "ok"


os.makedirs(OUT_DIR, exist_ok=True)
MANIFEST = os.path.join(ROOT, "src", "rendered", "manifest.json")
sitemap_items = [
    (url, kind)
    for sitemap, kind in (("page", "page"), ("post", "post"), ("category", "archive"), ("post_tag", "archive"))
    for url in locs(get(f"{LOCAL}/{sitemap}-sitemap.xml"))
]
extra = [(LOCAL + path, "archive") for path in EXTRA_ARCHIVES]
listings = [url for url, kind in sitemap_items + extra if kind == "archive" and "/category/" not in url]
with ThreadPoolExecutor(8) as pool:
    paged = [(url, "archive") for pages in pool.map(later_pages, listings) for url in pages]
    items = extra + paged if PAGED_ONLY else sitemap_items + extra + paged
    results = list(pool.map(render, items))
manifest = json.load(open(MANIFEST)) if PAGED_ONLY else {}
manifest = dict(sorted({**manifest, **dict(results)}.items()))
with open(MANIFEST, "w") as f:
    json.dump(manifest, f, indent="\t")

with ThreadPoolExecutor(8) as pool:
    dl = list(pool.map(download, sorted(uploads)))

total = sum(sizes.values())
print(f"pages: {len(manifest)}  content: {total/1024:.0f} KB  uploads: {len(uploads)} "
      f"(new {dl.count('ok')}, existing {dl.count('skip')})")
for line in (d for d in dl if d.startswith("FAIL")):
    print(line)
