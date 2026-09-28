#!/bin/bash
# Usage: scripts/lh-compare.sh — Lighthouse mobile + desktop for live WordPress vs the Worker.
cd "$(dirname "$0")/.."
pages=(/ /about/ /costs/ /contacts/ /services/ /services/website-design-for-electricians/ /are-ai-shopping-agents-coming-for-your-website/)
for mode in mobile desktop; do
  scripts/lighthouse.sh https://glcwebsolutions.co.uk .lighthouse/cmp-live "$mode" "${pages[@]}"
  scripts/lighthouse.sh https://glc-web-solutions.gareth-17d.workers.dev .lighthouse/cmp-new "$mode" "${pages[@]}"
done
echo ALLDONE
