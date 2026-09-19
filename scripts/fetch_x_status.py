#!/usr/bin/env python3
"""Best-effort X developer-platform status snapshot for SPACEWALL.

Consumer X has no official public status API. This scrapes
https://developer.x.com/status (HTML first) and, when that page is
client-rendered with no health text, reads the same-origin
https://developer.x.com/api/status payload the page itself loads.

Never invent a green status: scrape/parse failure → unknown.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

PAGE_URL = "https://developer.x.com/status"
API_URL = "https://developer.x.com/api/status"
SOURCE = "developer.x.com/status"
UA = (
    "SPACEWALL-kiosk/1.0 "
    "(+https://github.com/earthman01/spacewall-kiosk)"
)
OUT = Path(__file__).resolve().parent.parent / "x-status.json"

OVERALL_RE = re.compile(
    r'"overall"\s*:\s*"(operational|degraded|outage|no_data|unknown)"',
    re.I,
)
BANNER_OK = re.compile(
    r"We are not actively mitigating any known incidents", re.I
)
BANNER_DEGRADED = re.compile(
    r"investigating degraded performance", re.I
)
BANNER_OUTAGE = re.compile(
    r"We are actively investigating\.", re.I
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def payload(status: str, detail: str) -> dict:
    return {
        "status": status,
        "updated_at": utc_now(),
        "source": SOURCE,
        "detail": detail,
    }


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        raw = res.read()
        charset = res.headers.get_content_charset() or "utf-8"
        return raw.decode(charset, errors="replace")


def map_overall(raw: str | None) -> tuple[str, str] | None:
    if not raw:
        return None
    key = raw.strip().lower()
    if key in ("operational", "ok", "none", "healthy", "up"):
        return "ok", "We are not actively mitigating any known incidents at this time."
    if key in ("degraded", "minor", "partial"):
        return "degraded", "Investigating degraded performance on some endpoints."
    if key in ("outage", "major", "critical", "down"):
        return "outage", "Actively investigating a platform outage."
    if key in ("no_data", "unknown"):
        return "unknown", "Status page reported no data."
    return None


def strip_tags(html: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text)


def parse_html(html: str) -> tuple[str, str] | None:
    if not html or len(html) < 40:
        return None
    match = OVERALL_RE.search(html)
    if match:
        mapped = map_overall(match.group(1))
        if mapped:
            return mapped
    text = strip_tags(html)
    if BANNER_OK.search(text):
        return "ok", "We are not actively mitigating any known incidents at this time."
    if BANNER_DEGRADED.search(text):
        return "degraded", "Investigating degraded performance on some endpoints."
    if BANNER_OUTAGE.search(text) and re.search(
        r"\b(outage|major incident)\b", text, re.I
    ):
        return "outage", "Actively investigating a platform outage."
    # Visible status chips from a rendered/SSR copy of the page.
    if re.search(r"\bOutage\b", text) and re.search(r"\bOperational\b", text):
        # Mixed labels: prefer the worst chip that is not just a legend.
        if re.search(r"(All systems|overall).{0,40}Outage", text, re.I):
            return "outage", "Status page reports an outage."
    if re.search(r"(All systems|overall).{0,40}Degraded", text, re.I):
        return "degraded", "Status page reports degraded performance."
    if re.search(r"(All systems operational|overall.{0,20}Operational)", text, re.I):
        return "ok", "All systems operational."
    return None


def parse_api(body: str) -> tuple[str, str] | None:
    data = json.loads(body)
    if not isinstance(data, dict):
        return None
    mapped = map_overall(data.get("overall"))
    if not mapped:
        return None
    status, detail = mapped
    endpoints = data.get("endpoints") or []
    counts: dict[str, int] = {}
    for item in endpoints:
        if not isinstance(item, dict):
            continue
        key = str(item.get("status") or "unknown")
        counts[key] = counts.get(key, 0) + 1
    if counts:
        summary = ", ".join(f"{k}={v}" for k, v in sorted(counts.items()))
        if status == "ok":
            detail = f"Developer platform operational ({summary})"
        else:
            detail = f"{detail} ({summary})"
    return status, detail


def scrape() -> dict:
    try:
        html = fetch(PAGE_URL)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return payload("unknown", f"status page fetch failed: {type(exc).__name__}")

    parsed = parse_html(html)
    if parsed:
        status, detail = parsed
        return payload(status, detail)

    try:
        body = fetch(API_URL)
        parsed = parse_api(body)
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError, ValueError) as exc:
        return payload("unknown", f"no HTML signal; api fallback failed: {type(exc).__name__}")

    if parsed:
        status, detail = parsed
        return payload(status, detail)

    return payload("unknown", "no health signal in developer.x.com/status")


def write_if_changed(data: dict) -> bool:
    if OUT.exists():
        try:
            old = json.loads(OUT.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            old = None
        if (
            isinstance(old, dict)
            and old.get("status") == data.get("status")
            and old.get("detail") == data.get("detail")
            and old.get("source") == data.get("source")
        ):
            print(f"unchanged status={data['status']}", flush=True)
            return False
    OUT.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT} status={data['status']}", flush=True)
    return True


def main() -> int:
    data = scrape()
    write_if_changed(data)
    print(json.dumps(data, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
