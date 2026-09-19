#!/usr/bin/env python3
"""Write version.json for SPACEWALL kiosk auto-reload.

`v` is a content hash of kiosk client assets (index.html, wave.html,
hearth.html, deck.js, and any other files listed in SOURCES), not the
latest git SHA. Pages also deploys when x-status.json refreshes; hashing
code means those data-only deploys do not bounce wall iPads.

Deploy Pages always regenerates this file into the artifact. The copy
committed on main must stay in sync too: the live site is published from
the main branch (legacy Pages), so a stale committed version.json is what
wall iPads actually poll.

Each portal loads deck.js with a content-hash query (`?h=…`) so a deck-only
change busts the cached script after the version watcher reloads the page.
`write` restamps those tags; `--check` verifies them.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# Portal html that must load deck.js. Append press.html / reel.html here.
HTML_SOURCES = ("index.html", "wave.html", "hearth.html")
SOURCES = HTML_SOURCES + ("deck.js",)
DEFAULT_OUT = ROOT / "version.json"
DECK_SCRIPT_RE = re.compile(
    r'<script src="\./deck\.js(?:\?h=[a-f0-9]+)?" defer></script>'
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def file_hash(path: Path, n: int = 12) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:n]


def deck_script_tag() -> str:
    return f'<script src="./deck.js?h={file_hash(ROOT / "deck.js")}" defer></script>'


def stamp_deck_src() -> list[str]:
    tag = deck_script_tag()
    changed: list[str] = []
    for rel in HTML_SOURCES:
        path = ROOT / rel
        text = path.read_text(encoding="utf-8")
        new, n = DECK_SCRIPT_RE.subn(tag, text)
        if n == 0:
            raise SystemExit(
                f"FAIL {rel} is missing a deck.js script tag "
                f'(expected {DECK_SCRIPT_RE.pattern})'
            )
        if new != text:
            path.write_text(new, encoding="utf-8")
            changed.append(rel)
    return changed


def check_deck_src() -> str | None:
    tag = deck_script_tag()
    for rel in HTML_SOURCES:
        text = (ROOT / rel).read_text(encoding="utf-8")
        if tag not in text:
            return (
                f"FAIL {rel} deck.js src is stale or missing "
                f"(expected {tag})"
            )
    return None


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

    if args.check:
        stamp_err = check_deck_src()
        if stamp_err:
            print(stamp_err, file=sys.stderr, flush=True)
            return 1
        expected = code_version()
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

    changed = stamp_deck_src()
    if changed:
        print("stamped deck.js hash in " + ", ".join(changed), flush=True)
    data = write_payload(out)
    print(f"wrote {out} v={data['v']} built_at={data['built_at']}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
