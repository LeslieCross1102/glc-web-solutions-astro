#!/usr/bin/env python3
"""Footer service-area links (hub -> spokes) from Local WordPress -> src/generated/footer-locations.json.

WordPress prints them from the glc-service-area-footer mu-plugin on wp_footer, after the
<footer> element, so they are not part of the captured chrome in src/components/glc/chrome.ts.
Rerun after adding, removing or re-tagging location pages:  python3 scripts/extract-footer-locations.py
"""
import json
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

SOURCE = sys.argv[1] if len(sys.argv) > 1 else "http://glc-web-solutions.local/"
OUT = Path(__file__).resolve().parent.parent / "src/generated/footer-locations.json"


class FooterLocations(HTMLParser):
    def __init__(self):
        super().__init__()
        self.groups = []
        self.in_nav = False
        self.in_title = False
        self.href = None
        self.text = ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = (a.get("class") or "").split()
        if tag == "nav" and "glc-footer-locations" in classes:
            self.in_nav = True
        elif not self.in_nav:
            return
        elif tag == "section" and "glc-footer-locations__hub" in classes:
            key = (a.get("aria-labelledby") or "").removeprefix("glc-footer-hub-")
            self.groups.append({"key": key, "name": "", "url": None, "items": []})
        elif tag == "h3":
            self.in_title = True
            self.text = ""
        elif tag == "a":
            self.href = urlsplit(a.get("href") or "").path or "/"
            self.text = ""

    def handle_endtag(self, tag):
        if not self.in_nav:
            return
        if tag == "nav":
            self.in_nav = False
        elif tag == "a" and self.href is not None:
            label = " ".join(self.text.split())
            group = self.groups[-1]
            if self.in_title:
                group["name"], group["url"] = label, self.href
            else:
                group["items"].append({"label": label, "url": self.href})
            self.href = None
        elif tag == "h3":
            if not self.groups[-1]["name"]:
                self.groups[-1]["name"] = " ".join(self.text.split())
            self.in_title = False

    def handle_data(self, data):
        if self.in_nav:
            self.text += data


with urllib.request.urlopen(SOURCE, timeout=60) as res:
    html = res.read().decode("utf-8")

parser = FooterLocations()
parser.feed(html)
if not parser.groups:
    sys.exit(f"No glc-footer-locations nav found at {SOURCE}")

OUT.write_text(json.dumps(parser.groups, indent="\t", ensure_ascii=False) + "\n")
links = sum(len(g["items"]) + (1 if g["url"] else 0) for g in parser.groups)
print(f"{OUT.relative_to(OUT.parent.parent.parent)}: {len(parser.groups)} groups, {links} links")
