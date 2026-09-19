#!/usr/bin/env python3
"""Write version.json for SPACEWALL kiosk auto-reload.

`v` is a content hash of kiosk code (index.html), not the latest git SHA.
Pages also deploys when x-status.json refreshes; hashing code means those
data-only deploys do not bounce wall iPads.
"""

from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ("index.html",)
OUT = ROOT / "version.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def code_version() -> str:
    digest = hashlib.sha256()
    for rel in SOURCES:
        path = ROOT / rel
        digest.update(rel.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()[:16]


def payload() -> dict:
    return {
        "v": code_version(),
        "built_at": utc_now(),
    }


def main() -> int:
    data = payload()
    OUT.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT} v={data['v']} built_at={data['built_at']}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
