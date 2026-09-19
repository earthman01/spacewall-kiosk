# SPACEWALL

Fierce dark outage kiosk — full-viewport SOC wall of live status tiles.

Open on iPad Safari → Share → Add to Home Screen → Guided Access.

Kiosks auto-reload after deploys (they poll `version.json` every few minutes and refresh once when `v` changes). `v` is a content hash of `index.html` (and any other client assets listed in `scripts/write_version.py`). Deploy Pages regenerates `version.json` into the Pages artifact; the committed file on `main` must match, because GitHub Pages currently publishes the branch. After changing kiosk code, run `python3 scripts/write_version.py`.

The first time after enabling auto-reload, force-quit the home-screen web app once so it picks up the watcher. Afterward, deploys should self-update within ~3 minutes.

Live: [earthman01.github.io/spacewall-kiosk](https://earthman01.github.io/spacewall-kiosk/)

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
