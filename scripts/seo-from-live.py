"""Build SQL that fills EmDash's _emdash_seo table from the live WordPress site.

For every published post/page in the WXR export, fetches its live URL and captures the rendered
<title>, meta description, robots noindex and og:image, so titles/descriptions match production exactly.

Usage: python3 scripts/seo-from-live.py <wxr-file> <import-result.json> <content-ids.json> <out.sql>
  content-ids.json: [{"collection": "pages", "slug": "...", "id": "..."}, ...]
"""

import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

WXR, IMPORT_RESULT, CONTENT_IDS, OUT = sys.argv[1:5]
NS = {"wp": "http://wordpress.org/export/1.2/"}
COLLECTIONS = {"post": "posts", "page": "pages"}

url_map = json.load(open(IMPORT_RESULT)).get("urlMap", {})
ids = {(r["collection"], r["slug"]): r["id"] for r in json.load(open(CONTENT_IDS))}

targets = []
for item in ET.parse(WXR).getroot().iter("item"):
    ptype = item.findtext("wp:post_type", namespaces=NS)
    if ptype not in COLLECTIONS or item.findtext("wp:status", namespaces=NS) != "publish":
        continue
    slug = item.findtext("wp:post_name", namespaces=NS)
    key = (COLLECTIONS[ptype], slug)
    if key in ids:
        targets.append((key, item.findtext("link")))


def meta(page, attr, name):
    for tag in re.findall(r"<meta\b[^>]*>", page, re.I):
        if re.search(rf'{attr}\s*=\s*["\']{re.escape(name)}["\']', tag, re.I):
            m = re.search(r'content\s*=\s*"([^"]*)"', tag, re.I) or re.search(r"content\s*=\s*'([^']*)'", tag, re.I)
            if m:
                return html.unescape(m.group(1)).strip()
    return None


def fetch(target):
    key, url = target
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (GLC EmDash migration)"})
        with urllib.request.urlopen(req, timeout=30) as res:
            page = res.read().decode("utf-8", "replace")
    except Exception as e:
        return key, url, None, str(e)
    title = re.search(r"<title[^>]*>(.*?)</title>", page, re.S | re.I)
    robots = meta(page, "name", "robots") or ""
    og = meta(page, "property", "og:image")
    return key, url, {
        "title": html.unescape(title.group(1)).strip() if title else None,
        "description": meta(page, "name", "description"),
        "noindex": 1 if "noindex" in robots.lower() else 0,
        "image": url_map.get(og) if og else None,
    }, None


def q(v):
    return "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"


with ThreadPoolExecutor(8) as pool:
    results = list(pool.map(fetch, targets))

rows, errors = [], []
for key, url, data, err in results:
    if err or not data:
        errors.append((url, err))
        continue
    collection, _ = key
    rows.append(
        f"INSERT OR REPLACE INTO _emdash_seo (collection, content_id, seo_title, seo_description, seo_image, seo_no_index) "
        f"VALUES ({q(collection)}, {q(ids[key])}, {q(data['title'])}, {q(data['description'])}, {q(data['image'])}, {data['noindex']});"
    )

open(OUT, "w").write("\n".join(rows) + "\n")
print(f"targets={len(targets)} rows={len(rows)} errors={len(errors)}")
for url, err in errors[:20]:
    print("  error:", url, err)
