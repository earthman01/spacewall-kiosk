# SPACEWALL

Fierce dark outage kiosk — full-viewport SOC wall of live status tiles.

Open on iPad Safari → Share → Add to Home Screen → Guided Access.

Chrome / Mac Dock: install **SPACEWALL** from [`index.html`](https://earthman01.github.io/spacewall-kiosk/index.html) and **HEARTH** from [`hearth.html`](https://earthman01.github.io/spacewall-kiosk/hearth.html). They are two PWAs — different manifests, ids, file-path scopes, and Dock icons (red **S** vs ember **H**). SPACEWALL’s scope is only `index.html`, so `hearth.html` is not captured as “Open in SPACEWALL”.

If Chrome already installed SPACEWALL from the site root (directory scope), uninstall that app first (`chrome://apps` → remove SPACEWALL), then reinstall from `index.html` and install HEARTH from `hearth.html`. The old install’s broad scope is what blocked a second Dock icon.

Kiosks auto-reload after deploys (they poll `version.json` every few minutes and refresh once when `v` changes). `v` is a content hash of `index.html` (and any other client assets listed in `scripts/write_version.py`). Deploy Pages regenerates `version.json` into the Pages artifact; the committed file on `main` must match, because GitHub Pages currently publishes the branch. After changing kiosk code, run `python3 scripts/write_version.py`.

**Standing rule — every UI ship must do both:** (1) bump `version.json` so walls reload, and (2) show a visible on-screen stamp so Mark can tell the deploy landed without guessing. Do not ship a silent hash-only change.

Format is Tesla-style decimals: `YEAR.WEEK.SHIP.HOTFIX` (2-digit year, ISO week). Omit `.HOTFIX` when it is 0. Display, muted, corner/bottom: `SPACEWALL 26.41.1.1` · `HEARTH 26.41.1.1` · `WAVE 26.41.1.1` · `PRESS 26.41.1.1` · `HUB 26.41.1.1` · `REEL 26.41.1.1` · `RICH 26.41.1.1`. Source of truth is `year` / `week` / `ship` / `hotfix` / `label` in `version.json`. Bump `ship` for a real drop (`python3 scripts/write_version.py --bump-ship`) or `hotfix` for a tiny follow-up (`--bump-hotfix`). That restamps the HTML fallbacks and the content hash. A new ISO week starts again at ship 1.

The first time after enabling auto-reload, force-quit the home-screen web app once so it picks up the watcher. Afterward, deploys should self-update within ~3 minutes.

## iPad deck (swipe)

On iPad / phone, swipe left or right to move between viewing systems. Shared script: [`deck.js`](./deck.js). Each portal keeps its own URL, look, and `version.json` watcher.

**Order (left → right):** SPACEWALL (`index.html`) ↔ HEARTH (`hearth.html`) ↔ WAVE (`wave.html`) ↔ PRESS (`press.html`) ↔ HUB (`hub.html`) ↔ REEL (`reel.html`) ↔ RICH (`rich.html`)

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

## HUB

Live: [hub.html](https://earthman01.github.io/spacewall-kiosk/hub.html)

Planning and build status wall for the personal OS — glance where planning and building stand, on an iPad or the 55" OLED. Near-black, full viewport. A north-star band (headline + short body) sits above four columns of status cards: Sprouted, This week, Building, Parked. Status words use the house palette (green live, amber building, dim parked) so the wall reads from across the room. Sparse chrome. No bright whites.

The page reads same-origin [`hub-board.json`](./hub-board.json), and only while `document.visibilityState === "visible"`. Hidden tabs and background iPads do not poll the board. While visible, a slow refresh (about 20 minutes) can pick up a new file. Fetch failure keeps the last good board.

**Board** is the landing view. **Calendar** (header toggle, or `?view=calendar`) is an upcoming agenda in the same dark cards. Tap an event for the detail sheet: when, place, and — when the event has a location — **Leave by**. Leave-by is the arrival time minus drive minutes minus a buffer. The page does not call a maps API. Drive minutes and the leave-by timestamp are written into the file ahead of time. There is no home street address in the repo or on the page; the place fields are the destination only.

The calendar reads same-origin [`hub-calendar.json`](./hub-calendar.json) on the same visibility rule as the board (slow refresh about every 20 minutes, last good file kept on failure). No iCal feed is wired up: a private Google/iCloud feed URL is a secret, and a world-public calendar would publish the agenda. Same rule as the board — no API key, no OAuth client secret, no token in this page.

Each card can take a short note, and the detail view has the same message box. Send posts only to [Form.taxi](https://form.taxi/s/rvzzhd31), which emails earthbot@mail.grokbot.com. The JSON body includes `item_id` and `item_title` so the note is tagged to that card. There is no sendm8 or FormSubmit path, and no API key in the page. The button shows Sent or Failed and does not open a mail draft. A failed send leaves the text in the field so it can be tried again.

Click a card (not its note field or links) for a detail sheet: status, the longer status line, open and done sub-steps, photos, and the message box. `photos` are same-origin files under `hub-media/` (or an `http`/`https` url). Sub-steps come from `steps` on the item.

A card stays on the board only while it has open work. `archived: true`, `done: true`, or `status: "done"` / `"archived"` drops the whole card. If `steps` is non-empty, a step with `done: true` or `status: "done"` is finished; the card drops off once every step is done. The card face shows only the open steps. `status: "mark"` is the highlighted **Waiting on Mark** state, on the card and on a step.

`watch` is one tucked-away card, **Everything we oversee**, collapsed until opened. It lists areas we only keep an eye on. An entry that is just `{ "id": "…" }` uses the matching board card. Boat trailer is first: the asset stays on that list, and the board card remains because **Schedule 2027 annual maintenance** is still open (2026 maintenance is done).

**No X API, Grok API, or secrets in the client.** CosS refreshes `hub-board.json` and `hub-calendar.json` offline (commit or drop a new JSON file). The page does not call those APIs. Both files are data-only — like `press-feed.json` and `x-status.json` — and are not part of the `version.json` content hash, so a data-only update does not bounce the wall iPads.

Status vocabulary: `live` | `proved` | `building` | `next` | `waiting` | `parked` | `seed`.

```json
{
  "updated_at": "2026-09-22T21:56:00Z",
  "source": "cos-voice-call-…",
  "title": "HUB",
  "subtitle": "Personal OS · planning & build",
  "north_star": { "headline": "…", "body": "…" },
  "columns": [
    {
      "id": "sprouted",
      "label": "Sprouted",
      "items": [
        {
          "id": "…",
          "title": "…",
          "status": "live",
          "detail": "…",
          "url": "https://earthman01.github.io/spacewall-kiosk/… or null"
        }
      ]
    }
  ]
}
```

### Calendar file

Write [`hub-calendar.json`](./hub-calendar.json). Times are ISO-8601 with a numeric offset. Display uses `timezone` (default `America/Chicago`) and labels clocks `CT`.

Leave-by rule, in order:

1. Show a leave-by only when `location` or `address` is non-empty.
2. If `leave_by` is a valid time, the page shows that exact clock. This is the value to edit when you already know the departure.
3. If `leave_by` is null and `drive_minutes` is a number, the page computes `starts_at - drive_minutes - buffer_minutes`. An event `buffer_minutes` overrides the file-level default. A missing buffer means `0` unless the file default is set.
4. If the event has a place and neither `leave_by` nor `drive_minutes`, the sheet says leave-by is not set yet.

Do not put a home street, origin, or “from” address in this file. `address` is the destination. `drive_minutes` and `distance_miles` are precomputed offline. `drive_approx: true` renders the drive as “about”. `url` is optional (`http`/`https` only) and shows as **Map**. The page lists events whose end is still in the future, or, when there is no end, whose start date in `timezone` is today or later. Past rows can stay in the file; they drop off the wall on their own.

```json
{
  "updated_at": "2026-10-29T16:45:00Z",
  "source": "mark-hub-note",
  "timezone": "America/Chicago",
  "buffer_minutes": 15,
  "events": [
    {
      "id": "carmax-dothan-2026-10-30",
      "title": "CarMax Dothan",
      "kind": "appointment",
      "starts_at": "2026-10-30T15:40:00-05:00",
      "ends_at": null,
      "location": "CarMax Dothan",
      "address": "2756 Ross Clark Cir, Dothan, AL 36301",
      "detail": "Tesla recheck.",
      "drive_minutes": 120,
      "drive_approx": true,
      "distance_miles": 90,
      "buffer_minutes": 15,
      "leave_by": "2026-10-30T13:25:00-05:00",
      "url": "https://www.google.com/maps/search/?api=1&query=…"
    }
  ]
}
```

`kind` is `appointment`, `event`, or `reminder` (anything else displays as written). `starts_at` is required. Seeded appointment: Friday, Oct 30, 2026, 3:40 PM CT at CarMax Dothan. Drive is about 2 hr (120 minutes, 90 mi) plus a 15 minute buffer, so leave-by is 1:25 PM CT (`15:40 − 120 − 15 = 13:25`).

Board fields added on an item in `hub-board.json`:

```json
{
  "id": "tower-garden",
  "title": "Tower Garden sale",
  "status": "live",
  "status_text": "All three listings are live. Waiting for buyers.",
  "detail": "…",
  "steps": [
    { "id": "marketplace", "label": "Marketplace", "status": "live", "url": "https://…" }
  ],
  "photos": [
    { "src": "hub-media/tower-garden-towers.jpg", "alt": "Both Tower Garden towers on the deck" }
  ]
}
```

`status` may also be `mark` (Waiting on Mark), `done`, or `archived`. A step `url` (`http` or `https`) makes that label a link. Top-level `watch` is `{ "title": "Everything we oversee", "items": [ … ] }`.

## RICH

Live: [rich.html](https://earthman01.github.io/spacewall-kiosk/rich.html)

Guest welcome for the 55″ OLED and the iPads. Charcoal gulf night, same care band as HEARTH: luminance floor, slow pixel orbit, APL breathe, soft silver type, no parked white. A canvas sky keeps stars, a low aurora, and the waterline moving. `prefers-reduced-motion` holds a still frame and shows the type immediately.

The clock is America/Chicago. Conditions and sunset are Panama City Beach from [Open-Meteo](https://open-meteo.com/) — no key, no account. The page fetches only while the tab is visible. A failed fetch leaves the dash and retries; it never blocks the welcome.

Linked from the SPACEWALL header and the HEARTH footer. Last stop on the iPad deck, after REEL. The living-room Mac still stays put unless someone opens the link (swipe stays off on the wide / fullscreen OLED).

| Flag | Default | Notes |
| --- | --- | --- |
| `?motion=0` | motion on | Freeze the sky, orbit, and the type reveal |
| `?orbit=0` / `1` / `strong` | `1` (~±7px) | Whole-composition pixel shift. Stars also drift in the canvas |
| `?wx=0` | on | Skip the weather fetch |
| `?phase=day` / `dusk` / `night` | follows the clock | Force the sky mix for prove-out |
| `?hud=1` | off | Tiny flag strip (includes `swipe:on/off`) |

## REEL

Live: [reel.html](https://earthman01.github.io/spacewall-kiosk/reel.html)

Slow cinema-ambience float for the 55″ OLED, and the page after HUB on the iPad deck. Near-black full viewport. Large soft-edged panels drift, fade, and restack — calm, Apple TV screensaver energy. Art is original and generative (gradients, geometry, procedural texture). No film stills, hotlinks, or scraped frames.

Mood packs cycle on their own. The on-screen label stays discreet: **Twilight** (cool blue dusk), **Tech Noir** (night chrome, amber/red edge, rain-glass), **2001** (deep field, pale monoliths, slow orbit), **Ember** (warm gold/green dusk). Tap or swipe up for the next pack; swipe down for the previous. `prefers-reduced-motion` holds a still composition. Self-contained — the only fetch is the shared `version.json` poll.

| Flag | Default | Notes |
| --- | --- | --- |
| `?pack=twilight` / `noir` / `void` / `ember` | twilight, then cycle | Start pack. Aliases: `shoegaze`, `tech`, `2001`, `lotr` |
| `?packs=0` | cycle on | Freeze the pack cycle |
| `?packdur=sec` | 180 | Seconds between packs (`12` for prove-out) |
| `?motion=0` | motion on | Freeze drift, restack, rain, and orbit |
| `?hud=1` | off | Tiny flag strip (includes `swipe:on/off`) |

## PRESS

Live: [press.html](https://earthman01.github.io/spacewall-kiosk/press.html)

Thin floating-newspaper portal — glanceable subjects + post-shaped cards on the same near-black OLED wall. Cards fade in, then settle; hover/scan holds the wall so nothing rugpulls mid-read. Tap a card to open an **in-app overlay reader** (same window / same PWA). Back/close returns to the wall. Primary read never leaves `press.html`. Posts may show a small secondary **Open on X** link in the overlay; briefs have no X url.

The page only reads same-origin [`press-feed.json`](./press-feed.json), and only while `document.visibilityState === "visible"`. Hidden tabs and background iPads do not poll the feed. While visible, a slow refresh (about 20 minutes) can pick up a new file. Fetch failure keeps the last good wall, or the hardcoded placeholders if nothing has loaded yet.

**No X API, Grok API, or secrets in the client.** Future refreshes of `press-feed.json` are offline writers (CosS / X / Grok). They commit or drop a new JSON file; the page does not call those APIs. `press-feed.json` is data-only (like `x-status.json`) and is not part of the `version.json` content hash, so a feed-only update does not bounce the wall iPads.

```json
{
  "updated_at": "2026-09-19T23:35:00Z",
  "source": "x-seed-v1",
  "cards": [
    {
      "id": "…",
      "kind": "post | brief",
      "subject": "…",
      "author": "handle",
      "name": "display name",
      "text": "full body",
      "url": "https://x.com/…/status/… or null",
      "created_at": "2026-09-19T12:32:45.000Z",
      "metrics": { "likes": 0, "replies": 0, "impressions": 0 }
    }
  ]
}
```

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
