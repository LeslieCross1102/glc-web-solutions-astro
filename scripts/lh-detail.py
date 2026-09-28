#!/usr/bin/env python3
"""Summarise LCP breakdown, critical requests and failing audit items from Lighthouse JSON reports.

  python3 scripts/lh-detail.py <report.json>...
"""
import json
import sys

AUDIT_ITEMS = (
    "color-contrast", "heading-order", "inspector-issues", "unsized-images", "uses-long-cache-ttl",
    "font-display-insight", "lcp-lazy-loaded", "meta-description", "uses-responsive-images",
)

for path in sys.argv[1:]:
    audits = json.load(open(path))["audits"]
    print("==", path.rsplit("/", 1)[-1])
    lcp = audits.get("largest-contentful-paint-element", {}).get("details", {}).get("items", [])
    if lcp:
        for item in lcp[0].get("items", []):
            print("  lcp:", item.get("node", {}).get("snippet", "")[:220])
        if len(lcp) > 1:
            print("  phases:", ", ".join(f"{p['phase']} {round(p['timing'])}" for p in lcp[1]["items"]))
    requests = audits["network-requests"]["details"]["items"]
    critical = [r for r in requests if r.get("priority") != "Low"]
    print(f"  non-low bytes {sum(r.get('transferSize', 0) for r in critical)}")
    for r in critical:
        print(f"    {r['priority']:8} {r.get('transferSize', 0):>7} {r['url'][-90:]}")
    for key in AUDIT_ITEMS:
        audit = audits.get(key)
        if not audit or audit.get("score") in (None, 1):
            continue
        for item in audit.get("details", {}).get("items", [])[:6]:
            node = item.get("node", {})
            print(f"  {key}:", (node.get("snippet") or item.get("url") or json.dumps(item))[:220])
