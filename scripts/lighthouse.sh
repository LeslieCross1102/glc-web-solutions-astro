#!/bin/bash
# Usage: glc-lh.sh <origin> <outdir> [mobile|desktop] paths...
origin="$1"; out="$2"; mode="$3"; shift 3
mkdir -p "$out"
preset=""
[ "$mode" = "desktop" ] && preset="--preset=desktop"
for p in "$@"; do
  name=$(echo "$p" | sed 's#[/]#_#g; s#^_##; s#_$##'); [ -z "$name" ] && name=home
  npx -y lighthouse@12 "$origin$p" $preset --quiet --output=json --output-path="$out/$name-$mode.json" \
    --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,accessibility,best-practices,seo >/dev/null 2>&1
  python3 - "$out/$name-$mode.json" "$p" <<'PY'
import json,sys
r=json.load(open(sys.argv[1]))
c=r["categories"]; a=r["audits"]
s={k:round((v["score"] or 0)*100) for k,v in c.items()}
m={k:a[k].get("displayValue","") for k in ["first-contentful-paint","largest-contentful-paint","total-blocking-time","cumulative-layout-shift","speed-index"]}
print(sys.argv[2], s, m)
fails=[]
for cat in c.values():
  for ref in cat["auditRefs"]:
    au=a[ref["id"]]
    if au.get("score") is not None and au["score"]<0.9 and au.get("scoreDisplayMode") not in ("notApplicable","informative","manual"):
      fails.append(f'{ref["id"]}({au["score"]})')
print("   fails:", ", ".join(sorted(set(fails))))
PY
done
