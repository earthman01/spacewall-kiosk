# SPACEWALL

Fierce dark outage kiosk — full-viewport SOC wall of live status tiles.

Open on iPad Safari → Share → Add to Home Screen → Guided Access.

Chrome / Mac Dock: install **SPACEWALL** from [`index.html`](https://earthman01.github.io/spacewall-kiosk/index.html) and **HEARTH** from [`hearth.html`](https://earthman01.github.io/spacewall-kiosk/hearth.html). They are two PWAs — different manifests, ids, file-path scopes, and Dock icons (red **S** vs ember **H**). SPACEWALL’s scope is only `index.html`, so `hearth.html` is not captured as “Open in SPACEWALL”.

If Chrome already installed SPACEWALL from the site root (directory scope), uninstall that app first (`chrome://apps` → remove SPACEWALL), then reinstall from `index.html` and install HEARTH from `hearth.html`. The old install’s broad scope is what blocked a second Dock icon.

Kiosks auto-reload after deploys (they poll `version.json` every few minutes and refresh once when `v` changes). `v` is a content hash of `index.html` (and any other client assets listed in `scripts/write_version.py`). Deploy Pages regenerates `version.json` into the Pages artifact; the committed file on `main` must match, because GitHub Pages currently publishes the branch. After changing kiosk code, run `python3 scripts/write_version.py`.

The first time after enabling auto-reload, force-quit the home-screen web app once so it picks up the watcher. Afterward, deploys should self-update within ~3 minutes.

## iPad deck (swipe)

On iPad / phone, swipe left or right to move between viewing systems. Shared script: [`deck.js`](./deck.js). Each portal keeps its own URL, look, and `version.json` watcher.

**Order (left → right):** SPACEWALL (`index.html`) ↔ HEARTH (`hearth.html`) ↔ WAVE (`wave.html`)

**Add PRESS / REEL later:** append a row to `PAGES` in `deck.js`, create the html with the same `<script src="./deck.js" defer></script>` hook, add the file to `HTML_SOURCES` in `scripts/write_version.py` and the copy list in `.github/workflows/pages.yml`, then `python3 scripts/write_version.py`.

| Flag | Default | Notes |
| --- | --- | --- |
| `?swipe=0` / `?deck=0` | see below | Always off. OLED escape hatch — pin the living-room URL if a swipe ever leaks |
| `?swipe=1` / `?deck=1` | see below | Always on (desktop prove-out; arrows also work) |

Default is **on** for coarse-pointer devices (iPad, phone), including iPad + Magic Keyboard. Default is **off** on a wide canvas (≥1400px) or `display-mode: fullscreen` when there is no coarse pointer — the 55" HEARTH Mac should stay on HEARTH. Iframes and `?embed=1` (WAVE wrapping SPACEWALL) stay off so the inner board cannot swipe away.

Recommended OLED URL stays bare `hearth.html`. Optional belt-and-suspenders: `hearth.html?swipe=0`.

Live: [earthman01.github.io/spacewall-kiosk](https://earthman01.github.io/spacewall-kiosk/)

## OLED room: HEARTH

The 55" Samsung is a **living-room portal**, not a second SPACEWALL — iPads already run the ops grid.

**Install as its own Dock app:** [hearth.html](https://earthman01.github.io/spacewall-kiosk/hearth.html) → Chrome menu → **Install HEARTH** (or Install page as app…). Then put that window on the OLED → **View → Enter Full Screen** (or F11). Across-the-room type: Chicago clock, date, a thin day-progress ring. Soft ember/charcoal waves stay alive so the panel is never a black-OFF TV. Discreet `hearth` link on the wall.

### OLED care (HEARTH v2)

Dim-to-black is **not** the care strategy. Samsung ASBL / logo-luminance was drowning v1 in void black after a long sit. HEARTH now keeps the dark ember/charcoal room, stays readable across the room, and supplies **our** motion so the panel is less likely to crush the image.

What the page does:

- **Luminance floor** — charcoal wash so the mural never reads as “TV off” (still dark, not a bright screensaver)
- Continuous low-APL motion, now a stronger wave/haze drift (elegant, not frantic)
- Slow **pixel orbit** of the whole composition (~±6–7px over a few minutes; `?orbit=strong` is wider)
- Soft **silver** clock (no pure `#fff`); optional slow clock/ring wander
- After ~8 minutes idle, a **gentle** mute of chrome only (`?deeper=crush` is the old brightness crush; `?deeper=0` disables)
- **3 mural slides** (ember / slate / wine) every 3 minutes, all in the same charcoal-room band (`?slides=0` yanks)
- Slow **APL breathe** so average picture level does not lock
- Modest peak whites — no parked high-contrast logos

What the TV / Mac should do:

- On the Samsung, leave **Pixel Shift / Screen Shift on** if the set offers it for this input
- HDMI from a Mac often **does not** get the TV’s own 2-minute screensaver — the set treats a computer as a PC. We supply the motion so the panel is not a static freeze-frame
- Do not max OLED brightness for a portal that sits for hours

### HEARTH URL flags

All kitchen-sink. Omitted = recommended default. `0` / `off` yanks that piece without a rewrite. `?hud=1` shows the active set.

| Flag | Default | Notes |
| --- | --- | --- |
| `?floor=0` | on | Hide the charcoal floor; old near-void black |
| `?deeper=0` / `gentle` / `crush` | `gentle` | Idle after 8 min. `crush` = v1 dim. `?idle=sec` sets the timer (`0` = never) |
| `?waves=0` / `soft` / `strong` | `strong` | `soft` is v1 travel; `0` freezes blobs/bands |
| `?orbit=0` / `1` / `strong` | `1` (~±7px) | Whole-composition pixel shift |
| `?silver=0` | on | Soft silver clock vs older gray |
| `?drift=0` | on | Slow clock/ring position wander |
| `?peaks=0` | modest | `0` allows a brighter face for A/B — not for the panel |
| `?slides=0` | on | Rotate ember → slate → wine (same charcoal-room band). `?slides=fast` or `?slidedur=12` for prove-out. `?slide=slate` starts on a phase |
| `?apl=0` | on | Micro brightness breathe so ASBL does not lock |
| `?hud=1` | off | Tiny flag strip on the floor (includes `swipe:on/off`) |
| `?swipe=0` / `?deck=0` | off on OLED / desktop | Disable iPad deck. See [iPad deck](#ipad-deck-swipe) |

Recommended living-room URL is bare `hearth.html` (all of the above on, slides included until Mark prunes).

### Wave lab (overlay prove-out)

[wave.html](https://earthman01.github.io/spacewall-kiosk/wave.html) is the idle-overlay lab: crisp UI, then a translucent wave after **240s** (`?idle=180` seconds; `?idle=0` now). Mouse / key / click fades it out. **Esc** dismisses. Same pixel orbit; after the wave has been up ~90s it dims further. `?mode=spacewall` puts the real board underneath the wash — a prove-out of Phase B wrapping SPACEWALL, still just a browser page.

**Honesty — Phase A only.** A browser page cannot sit on top of Grok Bot.app or other native windows. Fullscreen the portal on the OLED yourself. Phase B (not in this repo) is a native always-on-top click-through Mac overlay that could float the same wave+shift over Grok Bot and SPACEWALL together.

## Tiles

Cursor, GitHub, Cloudflare, OpenAI, Discord, Slack, Google Workspace, Google Cloud, **X**, **xAI**.

Most tiles poll vendor public JSON status APIs directly in the browser (no proxy).

### xAI

Browser-live RSS: [`https://status.x.ai/feed.xml`](https://status.x.ai/feed.xml) (`Access-Control-Allow-Origin: *`).

- No open / unresolved incident items → **OK** (green)
- Open incident with severity / non-`RESOLVED` → **DEGRADED** (amber) or **OUTAGE** (red)
- Fetch or parse failure → **UNKNOWN** (dim) — never fake green

Human page: [status.x.ai](https://status.x.ai/)

### X

Consumer X has **no official public status API**. SPACEWALL does **not** use Downdetector.

A GitHub Action (every ~10 minutes, plus `workflow_dispatch`) scrapes [`developer.x.com/status`](https://developer.x.com/status) best-effort and writes same-origin [`x-status.json`](./x-status.json) for the kiosk tile. That page is the best available official signal (developer platform health, not a consumer-X status API). If the scrape fails, the tile stays **UNKNOWN** (dim) and is never forced green.

```json
{
  "status": "ok | degraded | outage | unknown",
  "updated_at": "2026-09-19T00:00:00Z",
  "source": "developer.x.com/status",
  "detail": "…"
}
```
