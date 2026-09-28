#!/usr/bin/env python3
"""Full-height screenshots of key pages for visual regression checks.

  python3 scripts/screens.py <origin> <outdir>          capture
  python3 scripts/screens.py --diff <dirA> <dirB>       compare two captures
"""
import subprocess
import sys
from pathlib import Path

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PAGES = [
    "/",
    "/about/",
    "/costs/",
    "/contacts/",
    "/services/",
    "/digital-consultancy/",
    "/seo-and-geo-services/",
    "/our-work/",
    "/services/website-design-and-development-services-in-dartford/",
    "/services/website-design-for-electricians/",
    "/services/website-design-for-pubs/",
    "/services/website-design-for-landscape-gardeners/",
    "/are-ai-shopping-agents-coming-for-your-website/",
    "/all-posts/",
    "/category/seo/",
    "/privacy-policy/",
]
SIZES = {"m": (412, 9000), "d": (1350, 7000)}


def name(path: str) -> str:
    return path.strip("/").replace("/", "_") or "home"


def capture(origin: str, out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    for path in PAGES:
        for tag, (w, h) in SIZES.items():
            target = out / f"{name(path)}-{tag}.png"
            subprocess.run(
                [
                    CHROME, "--headless=new", "--hide-scrollbars", "--disable-gpu",
                    "--force-device-scale-factor=1", f"--window-size={w},{h}",
                    "--virtual-time-budget=15000", f"--screenshot={target}",
                    origin + path,
                ],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90,
            )
            print("captured", target.name)


def diff(a: Path, b: Path) -> None:
    from PIL import Image, ImageChops

    for fa in sorted(a.glob("*.png")):
        fb = b / fa.name
        if not fb.exists():
            print(f"{fa.name}: missing in {b}")
            continue
        ia, ib = Image.open(fa).convert("RGB"), Image.open(fb).convert("RGB")
        if ia.size != ib.size:
            print(f"{fa.name}: size {ia.size} vs {ib.size}")
            continue
        d = ImageChops.difference(ia, ib).convert("L").point(lambda v: 255 if v > 24 else 0)
        changed = sum(d.histogram()[255:])
        pct = 100 * changed / (ia.size[0] * ia.size[1])
        box = d.getbbox()
        flag = "OK " if pct < 0.2 else "DIFF"
        print(f"{flag} {fa.name}: {pct:.2f}% changed, bbox={box}")
        if pct >= 0.2:
            d.save(b / f"_diff-{fa.name}")


if __name__ == "__main__":
    if sys.argv[1] == "--diff":
        diff(Path(sys.argv[2]), Path(sys.argv[3]))
    else:
        capture(sys.argv[1].rstrip("/"), Path(sys.argv[2]))
