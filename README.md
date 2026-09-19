# SPACEWALL

Fierce dark outage kiosk — full-viewport SOC wall of live status tiles.

Open on iPad Safari → Share → Add to Home Screen → Guided Access.

Kiosks auto-reload after deploys (they poll `version.json` every few minutes and refresh once when `v` changes). `v` is a content hash of `index.html` (and any other client assets listed in `scripts/write_version.py`). Deploy Pages regenerates `version.json` into the Pages artifact; the committed file on `main` must match, because GitHub Pages currently publishes the branch. After changing kiosk code, run `python3 scripts/write_version.py`.

The first time after enabling auto-reload, force-quit the home-screen web app once so it picks up the watcher. Afterward, deploys should self-update within ~3 minutes.

Live: [earthman01.github.io/spacewall-kiosk](https://earthman01.github.io/spacewall-kiosk/)

## OLED room: HEARTH

The 55" Samsung is a **living-room portal**, not a second SPACEWALL — iPads already run the ops grid.

**Fullscreen today:** [hearth.html](https://earthman01.github.io/spacewall-kiosk/hearth.html) (discreet `hearth` link on the wall). Chrome or Safari on the Mac → put that window on the OLED → **View → Enter Full Screen** (or F11). Across-the-room type: Chicago clock, date, a thin day-progress ring. Soft ember/charcoal waves stay alive so the panel is never a black-OFF TV.

### OLED care

What the page does for burn-in mitigation:

- Continuous low-APL motion (blurry waves, no full-field white, no neon)
- Slow **pixel orbit** of the whole composition (~±6px over a few minutes) so type and marks do not sit on the same subpixels
- After ~8 minutes idle, the mural dims a little deeper
- Nothing is a parked high-contrast logo

What the TV / Mac should do:

- On the Samsung, leave **Pixel Shift / Screen Shift on** if the set offers it for this input
- HDMI from a Mac often **does not** get the TV’s own 2-minute screensaver — the set treats a computer as a PC. We supply the motion so the panel is not a static freeze-frame
- Do not max OLED brightness for a portal that sits for hours

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
