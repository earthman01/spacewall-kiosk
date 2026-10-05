/* Living-room critical alert for SPACEWALL and HEARTH.
 *
 * Polls same-origin ./alert.json on the same cadence as version.json
 * (VERSION_CHECK_MS, overridable with ?vcheck=ms). Not part of the
 * version hash — editing the file does not reload the wall.
 *
 * active:true + level "critical" (level omitted counts as critical):
 *   full-viewport red flash, then a persistent ALERT tile.
 * active:false, any other level, {}, or an empty file clears it.
 * A new id flashes again. The same id stays on the tile (no re-flash
 * every poll). Tap / click / Escape / Enter settles the flash early.
 * ?aflash=seconds sets the flash length (default 10). ?aflash=0 skips
 * straight to the tile.
 */
(function () {
  const VERSION_CHECK_MS = 3 * 60 * 1000;
  const FLASH_MS_DEFAULT = 10 * 1000;
  const SEEN_KEY = "spacewall-room-alert-seen";

  const style = document.createElement("style");
  style.id = "room-alert-style";
  style.textContent = [
    "@property --wash-x { syntax: '<percentage>'; inherits: false; initial-value: 50%; }",
    "@property --wash-y { syntax: '<percentage>'; inherits: false; initial-value: 42%; }",
    "#room-alert-flash {",
    "  display: none;",
    "  position: fixed;",
    "  inset: 0;",
    "  z-index: 10050;",
    "  flex-direction: column;",
    "  align-items: center;",
    "  justify-content: center;",
    "  gap: clamp(12px, 2vh, 28px);",
    "  padding: 8vh 7vw 10vh;",
    "  text-align: center;",
    "  cursor: pointer;",
    "  color: #ffe8ea;",
    "  background:",
    "    radial-gradient(90% 80% at var(--wash-x, 50%) var(--wash-y, 42%), #ff2a3c 0%, #d10e24 40%, #8e0016 74%, #5a000e 100%);",
    "  animation: room-alert-wash 2.8s ease-in-out infinite;",
    "  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Helvetica, Arial, sans-serif;",
    "  -webkit-font-smoothing: antialiased;",
    "  user-select: none;",
    "  -webkit-user-select: none;",
    "}",
    "#room-alert-flash.on { display: flex; }",
    "#room-alert-flash .kicker {",
    "  font-size: clamp(16px, 2.1vw, 28px);",
    "  font-weight: 800;",
    "  letter-spacing: 0.42em;",
    "  text-transform: uppercase;",
    "  color: #ffd0d4;",
    "}",
    "#room-alert-flash .title {",
    "  font-size: clamp(56px, 9vw, 148px);",
    "  font-weight: 800;",
    "  letter-spacing: -0.035em;",
    "  line-height: 0.92;",
    "  max-width: 14ch;",
    "  color: #fff1f2;",
    "  text-shadow: 0 8px 40px rgba(70, 0, 10, 0.35);",
    "}",
    "#room-alert-flash .body {",
    "  font-size: clamp(22px, 3.2vw, 48px);",
    "  font-weight: 620;",
    "  line-height: 1.25;",
    "  max-width: 22ch;",
    "  color: #ffe4e7;",
    "}",
    "#room-alert-flash .time {",
    "  font-size: clamp(16px, 1.8vw, 28px);",
    "  font-weight: 650;",
    "  letter-spacing: 0.08em;",
    "  font-variant-numeric: tabular-nums;",
    "  color: #ffc4cb;",
    "}",
    "#room-alert-flash .hint {",
    "  position: absolute;",
    "  left: 0; right: 0;",
    "  bottom: calc(22px + env(safe-area-inset-bottom));",
    "  font-size: 12px;",
    "  font-weight: 700;",
    "  letter-spacing: 0.22em;",
    "  text-transform: uppercase;",
    "  color: rgba(255, 220, 224, 0.72);",
    "}",
    "@keyframes room-alert-wash {",
    "  0%, 100% { --wash-x: 46%; --wash-y: 38%; filter: saturate(1) brightness(1); }",
    "  50% { --wash-x: 56%; --wash-y: 58%; filter: saturate(1.05) brightness(1.08); }",
    "}",
    "#room-alert-dock {",
    "  position: fixed;",
    "  z-index: 40;",
    "  left: 0;",
    "  right: 0;",
    "  bottom: calc(22px + env(safe-area-inset-bottom));",
    "  display: flex;",
    "  justify-content: center;",
    "  pointer-events: none;",
    "}",
    "#room-alert-dock:not(.on) { display: none; }",
    "#room-alert-tile {",
    "  pointer-events: auto;",
    "  width: min(860px, 88vw);",
    "  padding: 18px 22px 16px;",
    "  border-radius: 12px;",
    "  background: linear-gradient(160deg, #2a050c 0%, #120408 55%, #0a0506 100%);",
    "  border: 1px solid #ff1530;",
    "  box-shadow: 0 0 0 1px rgba(255, 21, 48, 0.35), inset 0 0 60px rgba(255, 0, 51, 0.18), 0 0 40px rgba(255, 0, 51, 0.15);",
    "  color: #f0d4d8;",
    "  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Helvetica, Arial, sans-serif;",
    "  -webkit-font-smoothing: antialiased;",
    "  animation: room-alert-pulse 1.6s ease-in-out infinite, room-alert-wander 110s ease-in-out infinite alternate;",
    "}",
    "#room-alert-tile .kicker {",
    "  font-size: 12px;",
    "  font-weight: 800;",
    "  letter-spacing: 0.28em;",
    "  text-transform: uppercase;",
    "  color: #ff8b98;",
    "}",
    "#room-alert-tile .status {",
    "  margin-top: 4px;",
    "  font-size: clamp(32px, 4vw, 64px);",
    "  font-weight: 800;",
    "  letter-spacing: -0.03em;",
    "  line-height: 0.95;",
    "  text-transform: uppercase;",
    "  color: #ff0033;",
    "  text-shadow: 0 0 28px rgba(255, 0, 51, 0.45);",
    "}",
    "#room-alert-tile .title {",
    "  margin-top: 8px;",
    "  font-size: clamp(18px, 2vw, 32px);",
    "  font-weight: 700;",
    "  letter-spacing: 0.01em;",
    "  line-height: 1.15;",
    "  color: #f2d6da;",
    "}",
    "#room-alert-tile .body {",
    "  margin-top: 4px;",
    "  font-size: clamp(14px, 1.4vw, 20px);",
    "  line-height: 1.3;",
    "  color: #c9a4aa;",
    "}",
    "#room-alert-tile .time {",
    "  margin-top: 8px;",
    "  font-size: 13px;",
    "  font-weight: 650;",
    "  letter-spacing: 0.08em;",
    "  font-variant-numeric: tabular-nums;",
    "  color: #a87880;",
    "}",
    "@keyframes room-alert-pulse {",
    "  0%, 100% { box-shadow: 0 0 0 1px rgba(255, 21, 48, 0.35), inset 0 0 60px rgba(255, 0, 51, 0.18), 0 0 40px rgba(255, 0, 51, 0.12); }",
    "  50% { box-shadow: 0 0 0 1px rgba(255, 21, 48, 0.7), inset 0 0 80px rgba(255, 0, 51, 0.28), 0 0 55px rgba(255, 0, 51, 0.28); }",
    "}",
    "@keyframes room-alert-wander {",
    "  from { margin: 0 0 0 0; }",
    "  to { margin: -8px 0 0 12px; }",
    "}",
    "body[data-alert-portal='hearth'] #room-alert-dock {",
    "  left: calc(28px + env(safe-area-inset-left));",
    "  right: auto;",
    "  width: min(640px, 54vw);",
    "  bottom: calc(28px + env(safe-area-inset-bottom));",
    "  justify-content: flex-start;",
    "}",
    "body[data-alert-portal='hearth'] #room-alert-tile { width: 100%; }",
    "body[data-alert-portal='spacewall'] #room-alert-dock {",
    "  top: calc(env(safe-area-inset-top) + var(--header-h, 52px) + 8px);",
    "  bottom: auto;",
    "  left: calc(12px + env(safe-area-inset-left));",
    "  right: calc(12px + env(safe-area-inset-right));",
    "  justify-content: stretch;",
    "}",
    "body[data-alert-portal='spacewall'] #room-alert-tile {",
    "  width: 100%;",
    "  height: 112px;",
    "  padding: 14px 20px;",
    "  display: grid;",
    "  grid-template-columns: auto minmax(0, 1fr) auto;",
    "  grid-template-rows: auto auto;",
    "  column-gap: 22px;",
    "  row-gap: 2px;",
    "  align-items: center;",
    "  animation: room-alert-pulse 1.6s ease-in-out infinite;",
    "}",
    "body[data-alert-portal='spacewall'] #room-alert-tile .kicker { grid-column: 1; grid-row: 1; }",
    "body[data-alert-portal='spacewall'] #room-alert-tile .status {",
    "  grid-column: 1;",
    "  grid-row: 2;",
    "  margin-top: 0;",
    "  font-size: clamp(28px, 3vw, 44px);",
    "}",
    "body[data-alert-portal='spacewall'] #room-alert-tile .title {",
    "  grid-column: 2;",
    "  grid-row: 1;",
    "  margin-top: 0;",
    "  white-space: nowrap;",
    "  overflow: hidden;",
    "  text-overflow: ellipsis;",
    "}",
    "body[data-alert-portal='spacewall'] #room-alert-tile .body {",
    "  grid-column: 2;",
    "  grid-row: 2;",
    "  margin-top: 0;",
    "  white-space: nowrap;",
    "  overflow: hidden;",
    "  text-overflow: ellipsis;",
    "}",
    "body[data-alert-portal='spacewall'] #room-alert-tile .time {",
    "  grid-column: 3;",
    "  grid-row: 1 / span 2;",
    "  margin-top: 0;",
    "  text-align: right;",
    "}",
    "body[data-alert-portal='spacewall'].room-alert-on main {",
    "  padding-top: 132px;",
    "}",
    "@media (max-width: 720px) {",
    "  body[data-alert-portal='spacewall'] #room-alert-tile {",
    "    height: auto;",
    "    min-height: 96px;",
    "    grid-template-columns: auto minmax(0, 1fr);",
    "  }",
    "  body[data-alert-portal='spacewall'] #room-alert-tile .time {",
    "    grid-column: 2;",
    "    grid-row: 3;",
    "    text-align: left;",
    "  }",
    "  body[data-alert-portal='spacewall'].room-alert-on main { padding-top: 148px; }",
    "}",
    "@media (prefers-reduced-motion: reduce) {",
    "  #room-alert-flash, #room-alert-tile { animation: none; }",
    "}"
  ].join("\n");
  document.head.appendChild(style);

  const flashEl = document.createElement("div");
  flashEl.id = "room-alert-flash";
  flashEl.setAttribute("role", "alertdialog");
  flashEl.setAttribute("aria-modal", "true");
  flashEl.setAttribute("aria-labelledby", "room-alert-flash-title");
  flashEl.setAttribute("aria-describedby", "room-alert-flash-body");
  flashEl.innerHTML =
    '<div class="kicker">Critical alert</div>' +
    '<div class="title" id="room-alert-flash-title"></div>' +
    '<div class="body" id="room-alert-flash-body"></div>' +
    '<div class="time" id="room-alert-flash-time"></div>' +
    '<div class="hint">Tap to hold on the wall</div>';

  const dockEl = document.createElement("div");
  dockEl.id = "room-alert-dock";
  dockEl.innerHTML =
    '<div id="room-alert-tile" role="status" aria-live="polite">' +
    '<div class="kicker">Alert</div>' +
    '<div class="status">Critical</div>' +
    '<div class="title" id="room-alert-tile-title"></div>' +
    '<div class="body" id="room-alert-tile-body"></div>' +
    '<div class="time" id="room-alert-tile-time"></div>' +
    "</div>";

  document.body.appendChild(flashEl);
  document.body.appendChild(dockEl);

  const verEl = document.getElementById("ver");
  const portal = ((verEl && verEl.getAttribute("data-portal")) || "").toLowerCase();
  if (portal) document.body.setAttribute("data-alert-portal", portal);

  const flashTitle = document.getElementById("room-alert-flash-title");
  const flashBody = document.getElementById("room-alert-flash-body");
  const flashTime = document.getElementById("room-alert-flash-time");
  const tileTitle = document.getElementById("room-alert-tile-title");
  const tileBody = document.getElementById("room-alert-tile-body");
  const tileTime = document.getElementById("room-alert-tile-time");

  let mode = "clear";
  let currentId = null;
  let seenId = readSeen();
  let flashTimer = null;

  function readSeen() {
    try {
      return sessionStorage.getItem(SEEN_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function writeSeen(id) {
    try {
      if (id) sessionStorage.setItem(SEEN_KEY, id);
      else sessionStorage.removeItem(SEEN_KEY);
    } catch (e) {}
  }

  function clean(value, max) {
    const text = String(value == null ? "" : value)
      .replace(/[\u0000-\u001F]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trim() + "…";
  }

  function formatWhen(iso) {
    const raw = clean(iso, 80);
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    try {
      return (
        d.toLocaleString("en-US", {
          timeZone: "America/Chicago",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        }) + " CT"
      );
    } catch (e) {
      return d.toISOString();
    }
  }

  function isCritical(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return false;
    if (data.active !== true) return false;
    const level = String(data.level == null || data.level === "" ? "critical" : data.level)
      .trim()
      .toLowerCase();
    return level === "critical";
  }

  function alertId(data) {
    const id = clean(data.id, 160);
    if (id) return id;
    return [clean(data.title, 80), clean(data.at, 40), clean(data.body, 80)].join("|");
  }

  function paint(data) {
    const title = clean(data.title, 80) || "ALERT";
    const body = clean(data.body, 180);
    const when = formatWhen(data.at);
    flashTitle.textContent = title;
    flashBody.textContent = body;
    flashTime.textContent = when;
    flashBody.hidden = !body;
    flashTime.hidden = !when;
    tileTitle.textContent = title;
    tileBody.textContent = body;
    tileTime.textContent = when;
    tileBody.hidden = !body;
    tileTime.hidden = !when;
  }

  function clearFlashTimer() {
    if (flashTimer) {
      clearTimeout(flashTimer);
      flashTimer = null;
    }
  }

  function showTile() {
    clearFlashTimer();
    mode = "tile";
    flashEl.classList.remove("on");
    dockEl.classList.add("on");
    document.body.classList.add("room-alert-on");
  }

  function settle() {
    if (mode === "clear") return;
    if (currentId) {
      seenId = currentId;
      writeSeen(currentId);
    }
    showTile();
  }

  function flash() {
    mode = "flash";
    document.body.classList.add("room-alert-on");
    dockEl.classList.remove("on");
    flashEl.classList.add("on");
    const ms = flashMs();
    if (ms <= 0) {
      settle();
      return;
    }
    clearFlashTimer();
    flashTimer = setTimeout(settle, ms);
  }

  function clear() {
    clearFlashTimer();
    mode = "clear";
    currentId = null;
    seenId = "";
    writeSeen("");
    flashEl.classList.remove("on");
    dockEl.classList.remove("on");
    document.body.classList.remove("room-alert-on");
  }

  function apply(data) {
    if (!isCritical(data)) {
      clear();
      return;
    }
    const id = alertId(data);
    paint(data);
    if (id === currentId && mode !== "clear") return;
    currentId = id;
    if (id && id === seenId) showTile();
    else flash();
  }

  function flashMs() {
    try {
      const raw = new URLSearchParams(location.search).get("aflash");
      if (raw == null || raw === "") return FLASH_MS_DEFAULT;
      const n = Number(raw);
      if (!Number.isFinite(n)) return FLASH_MS_DEFAULT;
      if (n <= 0) return 0;
      if (n > 60) return 60 * 1000;
      return n * 1000;
    } catch (e) {
      return FLASH_MS_DEFAULT;
    }
  }

  function versionCheckMs() {
    try {
      const raw = new URLSearchParams(location.search).get("vcheck");
      const n = raw ? Number(raw) : NaN;
      if (Number.isFinite(n) && n >= 1000) return n;
    } catch (e) {}
    return VERSION_CHECK_MS;
  }

  async function poll() {
    let res;
    try {
      res = await fetch("./alert.json?t=" + Date.now(), { cache: "no-store" });
    } catch (e) {
      return;
    }
    if (res.status === 404) {
      apply(null);
      return;
    }
    if (!res.ok) return;
    let text = "";
    try {
      text = await res.text();
    } catch (e) {
      return;
    }
    if (!String(text).trim()) {
      apply(null);
      return;
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return;
    }
    apply(data);
  }

  flashEl.addEventListener("click", function () {
    if (mode === "flash") settle();
  });

  window.addEventListener(
    "keydown",
    function (ev) {
      if (mode !== "flash") return;
      if (ev.key === "Escape" || ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        ev.stopPropagation();
        settle();
      }
    },
    true
  );

  window.SpacewallAlert = {
    poll: poll,
    settle: settle,
    mode: function () {
      return mode;
    },
    id: function () {
      return currentId;
    }
  };

  poll();
  setInterval(poll, versionCheckMs());
})();
