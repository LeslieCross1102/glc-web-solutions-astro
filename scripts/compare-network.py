#!/usr/bin/env python3
"""Server-side comparison of two origins: TTFB samples, compressed HTML size, protocol and caching headers.

  python3 scripts/compare-network.py <originA> <originB> <out.json> [paths...]
"""
import json
import statistics
import subprocess
import sys
import time

FMT = "%{http_code} %{time_connect} %{time_appconnect} %{time_starttransfer} %{time_total} %{size_download} %{http_version}"


def sample(url: str) -> dict:
    out = subprocess.run(
        ["curl", "-s", "-o", "/dev/null", "-m", "40", "-H", "Accept-Encoding: br, gzip", "-w", FMT, url],
        capture_output=True, text=True,
    ).stdout.split()
    code, connect, tls, ttfb, total, size, version = out
    return {"code": int(code), "ttfb_ms": float(ttfb) * 1000, "total_ms": float(total) * 1000,
            "bytes": int(size), "http": version, "connect_ms": float(connect) * 1000, "tls_ms": float(tls) * 1000}


def headers(url: str) -> dict:
    raw = subprocess.run(["curl", "-sI", "-m", "40", "-H", "Accept-Encoding: br, gzip", url],
                         capture_output=True, text=True).stdout.lower()
    pick = {}
    for line in raw.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            if k in ("content-encoding", "cache-control", "server", "cf-cache-status", "x-cache", "strict-transport-security"):
                pick[k] = v.strip()
    return pick


def main() -> None:
    a, b, out, *paths = sys.argv[1:]
    paths = paths or ["/"]
    result = {}
    for origin in (a, b):
        rows = {}
        for p in paths:
            url = origin.rstrip("/") + p
            runs = []
            for _ in range(5):
                runs.append(sample(f"{url}?cmp={time.time_ns()}"))
                time.sleep(0.3)
            ttfbs = [r["ttfb_ms"] for r in runs]
            rows[p] = {
                "ttfb_median_ms": round(statistics.median(ttfbs)),
                "ttfb_min_ms": round(min(ttfbs)),
                "ttfb_max_ms": round(max(ttfbs)),
                "html_bytes": runs[-1]["bytes"],
                "http": runs[-1]["http"],
                "status": runs[-1]["code"],
                "headers": headers(url),
            }
            print(origin, p, rows[p]["ttfb_median_ms"], "ms", rows[p]["html_bytes"], "B", flush=True)
        result[origin] = rows
    json.dump(result, open(out, "w"), indent=1)


main()
