#!/usr/bin/env python3
"""Write version.json for SPACEWALL kiosk auto-reload.

`v` is a content hash of kiosk client assets (index.html, wave.html, and
any other files listed in SOURCES), not the latest git SHA. Pages also
deploys when x-status.json refreshes; hashing code means those data-only
deploys do not bounce wall iPads.

Deploy Pages always regenerates this file into the artifact. The copy
committed on main must stay in sync too: the live site is published from
the main branch (legacy Pages), so a stale committed version.json is what
wall iPads actually poll.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ("index.html", "wave.html")
DEFAULT_OUT = ROOT / "version.json"


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


def resolve_out(path: str | None) -> Path:
    if not path:
        return DEFAULT_OUT
    out = Path(path)
    return out if out.is_absolute() else Path.cwd() / out


def read_v(path: Path) -> str | None:
    if not path.is_file():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    v = data.get("v") if isinstance(data, dict) else None
    return v if isinstance(v, str) and v else None


def write_payload(out: Path) -> dict:
    data = {
        "v": code_version(),
        "built_at": utc_now(),
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        help="Path to version.json (default: repo-root version.json)",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 if version.json v does not match the hashed client assets",
    )
    args = parser.parse_args()
    out = resolve_out(args.out)
    expected = code_version()

    if args.check:
        found = read_v(out)
        if found != expected:
            print(
                f"FAIL {out} v={found!r} expected v={expected} "
                f"(hash of {', '.join(SOURCES)})",
                file=sys.stderr,
                flush=True,
            )
            return 1
        print(f"ok {out} v={expected}", flush=True)
        return 0

    data = write_payload(out)
    print(f"wrote {out} v={data['v']} built_at={data['built_at']}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
