#!/usr/bin/env python3
"""Self-host the Google Fonts the theme uses (latin subset only).

Writes woff2 files to public/glc/fonts/ and @font-face rules to
src/generated/fonts.css (+ fonts-serif.css for the pubs/landscapers pages).
The Material Symbols font is subset to the icon names found in the site.
"""
import hashlib
import re
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "public/glc/fonts"
OUT_DIR = ROOT / "src/generated"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"

# Icons set from JS/templates that a static scan can miss.
EXTRA_ICONS = {"close", "menu", "arrow_back", "expand_less", "check", "add", "remove", "star"}

# Text fonts are trimmed to Latin-1 + typographic punctuation and the OpenType features the CSS uses
# (tabular-nums on prices). Needs fonttools: python3 -m venv .venv && .venv/bin/pip install fonttools brotli
PYFTSUBSET = ROOT / ".venv/bin/pyftsubset"
TEXT_UNICODES = (
    "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201E,"
    "U+2022,U+2026,U+2032-2033,U+20AC,U+2122,U+2190-2193,U+2212"
)
TEXT_FEATURES = "kern,liga,calt,ccmp,locl,mark,mkmk,tnum"


def subset_text_font(data: bytes) -> bytes:
    if not PYFTSUBSET.exists():
        return data
    src = FONT_DIR / "_subset-in.woff2"
    dst = FONT_DIR / "_subset-out.woff2"
    src.write_bytes(data)
    subprocess.run(
        [str(PYFTSUBSET), str(src), f"--unicodes={TEXT_UNICODES}", f"--layout-features={TEXT_FEATURES}",
         "--flavor=woff2", f"--output-file={dst}"],
        check=True,
    )
    out = dst.read_bytes()
    src.unlink()
    dst.unlink()
    return out


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def used_icons() -> list[str]:
    out = subprocess.run(
        ["rg", "-oN", "--no-filename", r'material-symbols-outlined[^"]*"[^>]*>\s*([a-z0-9_]+)\s*<', "-r", "$1",
         "public/glc/rendered", "src", "public/glc/assets/js"],
        cwd=ROOT, capture_output=True, text=True,
    ).stdout.split()
    data = subprocess.run(
        ["rg", "-oN", "--no-filename", r'icon:\s*"([a-z_]+)"', "-r", "$1", "src"],
        cwd=ROOT, capture_output=True, text=True,
    ).stdout.split()
    return sorted(set(out) | set(data) | EXTRA_ICONS)


def localise(css: str, only_latin: bool) -> str:
    blocks = re.findall(r"(/\*\s*([\w-]+)\s*\*/\s*)?(@font-face\s*\{[^}]+\})", css)
    kept = []
    for _, subset, block in blocks:
        if only_latin and subset and subset != "latin":
            continue
        url = re.search(r"url\((https://[^)]+)\)", block).group(1)
        data = get(url)
        if only_latin and PYFTSUBSET.exists():
            data = subset_text_font(data)
            block = re.sub(r"unicode-range:[^;]+;", f"unicode-range: {TEXT_UNICODES.replace(',', ', ')};", block)
        family = re.search(r"font-family:\s*'([^']+)'", block).group(1)
        style = re.search(r"font-style:\s*(\w+)", block).group(1)
        name = f"{family.lower().replace(' ', '-')}-{style}-{hashlib.sha1(data).hexdigest()[:8]}.woff2"
        (FONT_DIR / name).write_bytes(data)
        block = block.replace(url, f"/glc/fonts/{name}")
        block = re.sub(r"\s+", " ", block)
        kept.append(block)
        print(f"  {name} {len(data) // 1024} KB")
    return "\n".join(kept) + "\n"


def main() -> None:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in FONT_DIR.glob("*.woff2"):
        old.unlink()

    # Jakarta's italic is a plain slant, so the synthesised oblique is visually identical and saves ~25 KB.
    text = get(
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800"
        "&family=Inter:wght@100..900&display=swap"
    ).decode()
    icons = used_icons()
    print(f"{len(icons)} icons")
    symbols = get(
        "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0..1"
        f"&icon_names={','.join(icons)}&display=block"
    ).decode()
    serif = get(
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap"
    ).decode()

    symbol_class = "\n".join(
        re.sub(r"\s+", " ", rule) for rule in re.findall(r"\.material-symbols-outlined\s*\{[^}]+\}", symbols)
    )
    (OUT_DIR / "fonts.css").write_text(localise(text, True) + localise(symbols, False) + symbol_class + "\n")
    (OUT_DIR / "fonts-serif.css").write_text(localise(serif, True))


if __name__ == "__main__":
    main()
