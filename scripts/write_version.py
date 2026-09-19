#!/usr/bin/env python3
"""Write version.json for SPACEWALL kiosk auto-reload.

`v` is a content hash of kiosk client assets (index.html, wave.html,
hearth.html, press.html, deck.js, and any other files listed in SOURCES), not the
latest git SHA. Pages also deploys when x-status.json refreshes; hashing
code means those data-only deploys do not bounce wall iPads.

Human-facing stamp (Mark / Tesla-style decimals) lives in the same file:
`year`, `week`, `ship`, `hotfix`, and `label` (YEAR.WEEK.SHIP, plus .HOTFIX
when hotfix > 0). Every UI ship must bump `ship` (or `hotfix` for a tiny
follow-up) and the on-screen stamps. `write` restamps `#ver` fallbacks in
each portal; `--check` verifies hash, label math, and those stamps.

Deploy Pages always regenerates this file into the artifact. The copy
committed on main must stay in sync too: the live site is published from
the main branch (legacy Pages), so a stale committed version.json is what
wall iPads actually poll.

Each portal loads deck.js with a content-hash query (`?h=…`) so a deck-only
change busts the cached script after the version watcher reloads the page.
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
# Portal html that must load deck.js. Append reel.html here.
HTML_SOURCES = ("index.html", "wave.html", "hearth.html", "press.html")
SOURCES = HTML_SOURCES + ("deck.js",)
PORTAL_BY_FILE = {
    "index.html": "SPACEWALL",
    "hearth.html": "HEARTH",
    "wave.html": "WAVE",
    "press.html": "PRESS",
}
DEFAULT_OUT = ROOT / "version.json"
DECK_SCRIPT_RE = re.compile(
    r'<script src="\./deck\.js(?:\?h=[a-f0-9]+)?" defer></script>'
)
VER_EL_RE = re.compile(
    r'(<[^>]*\bid="ver"[^>]*>)(SPACEWALL|HEARTH|WAVE|PRESS) \d+\.\d+\.\d+(?:\.\d+)?(</)'
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def iso_now() -> tuple[int, int]:
    cal = datetime.now(timezone.utc).isocalendar()
    return cal.year % 100, cal.week


def format_label(year: int, week: int, ship: int, hotfix: int) -> str:
    base = f"{year:02d}.{week}.{ship}"
    return f"{base}.{hotfix}" if hotfix else base


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
                f"(expected {DECK_SCRIPT_RE.pattern})"
            )
        if new != text:
            path.write_text(new, encoding="utf-8")
            changed.append(rel)
    return changed


def stamp_ver_labels(label: str) -> list[str]:
    changed: list[str] = []
    for rel in HTML_SOURCES:
        path = ROOT / rel
        text = path.read_text(encoding="utf-8")
        new, n = VER_EL_RE.subn(rf"\1\2 {label}\3", text)
        if n == 0:
            raise SystemExit(
                f"FAIL {rel} is missing an #ver stamp "
                f'(expected id="ver">PORTAL {label})'
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


def check_ver_labels(label: str) -> str | None:
    for rel, name in PORTAL_BY_FILE.items():
        text = (ROOT / rel).read_text(encoding="utf-8")
        needle = f'id="ver"'
        stamp = f"{name} {label}"
        if needle not in text or stamp not in text:
            return f"FAIL {rel} is missing visible stamp {stamp!r}"
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


def read_json(path: Path) -> dict:
    if not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, dict) else {}


def as_int(value: object, fallback: int) -> int:
    try:
        n = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return fallback
    return n if n >= 0 else fallback


def load_release(src: Path, bump_ship: bool, bump_hotfix: bool) -> dict:
    year, week = iso_now()
    ship, hotfix = 1, 0
    data = read_json(src)
    if data:
        year = as_int(data.get("year"), year)
        week = as_int(data.get("week"), week)
        ship = as_int(data.get("ship"), ship)
        hotfix = as_int(data.get("hotfix"), hotfix)
    iso_year, iso_week = iso_now()
    if bump_ship:
        if year != iso_year or week != iso_week:
            year, week, ship, hotfix = iso_year, iso_week, 1, 0
        else:
            ship += 1
            hotfix = 0
    elif bump_hotfix:
        hotfix += 1
    return {
        "year": year,
        "week": week,
        "ship": ship,
        "hotfix": hotfix,
        "label": format_label(year, week, ship, hotfix),
    }


def read_v(path: Path) -> str | None:
    v = read_json(path).get("v")
    return v if isinstance(v, str) and v else None


def write_payload(out: Path, release: dict) -> dict:
    data = {
        "v": code_version(),
        "built_at": utc_now(),
        "year": release["year"],
        "week": release["week"],
        "ship": release["ship"],
        "hotfix": release["hotfix"],
        "label": release["label"],
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return data


def check_release(path: Path) -> str | None:
    data = read_json(path)
    year = as_int(data.get("year"), -1)
    week = as_int(data.get("week"), -1)
    ship = as_int(data.get("ship"), -1)
    hotfix = as_int(data.get("hotfix"), -1)
    label = data.get("label")
    if year < 0 or week < 1 or ship < 1 or hotfix < 0:
        return f"FAIL {path} missing year/week/ship/hotfix"
    expected = format_label(year, week, ship, hotfix)
    if label != expected:
        return f"FAIL {path} label={label!r} expected {expected!r}"
    return None


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
    parser.add_argument(
        "--bump-ship",
        action="store_true",
        help="Increment ship (reset hotfix; new ISO week starts at ship 1)",
    )
    parser.add_argument(
        "--bump-hotfix",
        action="store_true",
        help="Increment hotfix on the current ship",
    )
    args = parser.parse_args()
    out = resolve_out(args.out)
    release_src = DEFAULT_OUT if args.out else out
    release = load_release(release_src, args.bump_ship, args.bump_hotfix)

    if args.check:
        stamp_err = check_deck_src() or check_ver_labels(release["label"]) or check_release(out)
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
        print(f"ok {out} v={expected} label={release['label']}", flush=True)
        return 0

    changed = stamp_ver_labels(release["label"]) + stamp_deck_src()
    if changed:
        print("stamped " + ", ".join(changed), flush=True)
    data = write_payload(out, release)
    print(
        f"wrote {out} v={data['v']} label={data['label']} "
        f"built_at={data['built_at']}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
