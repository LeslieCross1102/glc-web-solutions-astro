"""Run the EmDash WordPress (WXR) import against a local dev server.

Mirrors the admin UI flow: analyze -> prepare -> execute -> media (batches of 25) -> rewrite-urls.
Used because the Cloudflare Workers Free plan CPU limit kills the import on the deployed Worker.

Usage: python3 scripts/wp-import-local.py <base-url> <token-file> <wxr-file>
"""

import json
import sys
import urllib.request
import uuid

BASE, TOKEN_FILE, WXR = sys.argv[1], sys.argv[2], sys.argv[3]
TOKEN = open(TOKEN_FILE).read().strip()
HEADERS = {"Authorization": f"Bearer {TOKEN}", "X-EmDash-Request": "1"}


def request(path, body=None, files=None, timeout=1800):
    headers = dict(HEADERS)
    if files is not None:
        boundary = uuid.uuid4().hex
        parts = []
        for name, (filename, content, ctype) in files.items():
            disp = f'form-data; name="{name}"' + (f'; filename="{filename}"' if filename else "")
            parts.append(f"--{boundary}\r\nContent-Disposition: {disp}\r\nContent-Type: {ctype}\r\n\r\n".encode() + content + b"\r\n")
        data = b"".join(parts) + f"--{boundary}--\r\n".encode()
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    else:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            payload = json.loads(res.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{path} -> HTTP {e.code}: {e.read()[:1000]!r}")
    if not payload.get("success"):
        raise SystemExit(f"{path} failed: {json.dumps(payload)[:1000]}")
    return payload["data"]


wxr_bytes = open(WXR, "rb").read()
wxr_file = {"file": ("export.xml", wxr_bytes, "text/xml")}

print("1. analyze")
analysis = request("/_emdash/api/import/wordpress/analyze", files=wxr_file)

wanted = {"post": "posts", "page": "pages"}
mappings = {}
for pt in analysis["postTypes"]:
    enabled = pt["name"] in wanted and pt["schemaStatus"]["canImport"]
    mappings[pt["name"]] = {"enabled": enabled, "collection": wanted.get(pt["name"], pt["suggestedCollection"])}
print("   mappings:", {k: v["collection"] for k, v in mappings.items() if v["enabled"]})

to_prepare = [
    pt for pt in analysis["postTypes"]
    if mappings[pt["name"]]["enabled"]
    and (not pt["schemaStatus"]["exists"] or any(f["status"] == "missing" for f in pt["schemaStatus"]["fieldStatus"].values()))
]
if to_prepare:
    print("2. prepare", [pt["name"] for pt in to_prepare])
    prep = request("/_emdash/api/import/wordpress/prepare", {
        "postTypes": [
            {"name": pt["name"], "collection": mappings[pt["name"]]["collection"], "fields": pt["requiredFields"]}
            for pt in to_prepare
        ]
    })
    print("   ", json.dumps(prep)[:300])

me = json.loads(urllib.request.urlopen(urllib.request.Request(BASE + "/_emdash/api/auth/me", headers=HEADERS)).read())["data"]
config = {
    "postTypeMappings": mappings,
    "skipExisting": True,
    "authorMappings": {a["login"]: me["id"] for a in analysis["authors"]},
    "importMenus": True,
    "importSiteTitle": False,
    "importLogo": False,
    "importSeo": True,
}
print("3. execute")
result = request("/_emdash/api/import/wordpress/execute",
                 files={**wxr_file, "config": (None, json.dumps(config).encode(), "application/json")})
print("   imported", result.get("imported"), "skipped", result.get("skipped"), "byCollection", result.get("byCollection"))
for err in result.get("errors", [])[:20]:
    print("   error:", err)

items = analysis["attachments"]["items"]
print(f"4. media ({len(items)} attachments)")
url_map, failed = {}, []
for i in range(0, len(items), 25):
    batch = request("/_emdash/api/import/wordpress/media", {"attachments": items[i:i + 25], "stream": False})
    url_map.update(batch.get("urlMap", {}))
    failed.extend(batch.get("failed", []))
    print(f"   {min(i + 25, len(items))}/{len(items)} imported={len(batch.get('imported', []))} failed={len(batch.get('failed', []))}")
for f in failed[:20]:
    print("   failed:", json.dumps(f)[:200])

if url_map:
    print(f"5. rewrite-urls ({len(url_map)} mappings)")
    rw = request("/_emdash/api/import/wordpress/rewrite-urls", {"urlMap": url_map})
    print("   ", json.dumps(rw)[:300])

json.dump({"result": result, "urlMap": url_map, "failed": failed}, open("/tmp/glc-import-result.json", "w"), indent=1)
print("done")
