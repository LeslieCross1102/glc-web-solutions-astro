"""Generate SQL that replaces the remote D1 content with the local (imported) content.

Keeps remote users, credentials, tokens, options, migrations and collection IDs. Local collection and
user IDs are remapped to the remote ones because EmDash's media-usage triggers embed collection IDs.

Usage: python3 scripts/build-d1-content-sync.py <local.sqlite> <id-map.json> <out.sql>
  id-map.json: {"<local id>": "<remote id>", ...}
"""

import json
import sqlite3
import sys

LOCAL_DB, ID_MAP, OUT = sys.argv[1:4]
id_map = json.load(open(ID_MAP))

TABLES = [
    "taxonomies",
    "_emdash_taxonomy_def_groups",
    "_emdash_taxonomy_defs",
    "_emdash_fields",
    "_emdash_bylines",
    "media",
    "ec_pages",
    "ec_posts",
    "revisions",
    "content_taxonomies",
    "_emdash_content_bylines",
    "_emdash_seo",
    "_emdash_sections",
    "_emdash_menus",
    "_emdash_menu_items",
    "_emdash_widget_areas",
    "_emdash_widgets",
]


def literal(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, bytes):
        return "X'" + v.hex() + "'"
    s = str(v)
    for old, new in id_map.items():
        s = s.replace(old, new)
    return "'" + s.replace("'", "''") + "'"


con = sqlite3.connect(LOCAL_DB)
lines = ["PRAGMA defer_foreign_keys = true;"]
for table in reversed(TABLES):
    lines.append(f'DELETE FROM "{table}";')
for table in TABLES:
    cur = con.execute(f'SELECT * FROM "{table}"')
    cols = ", ".join(f'"{c[0]}"' for c in cur.description)
    for row in cur:
        lines.append(f'INSERT INTO "{table}" ({cols}) VALUES ({", ".join(literal(v) for v in row)});')

open(OUT, "w").write("\n".join(lines) + "\n")
print(f"wrote {len(lines)} statements to {OUT}")
