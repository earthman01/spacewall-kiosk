/* SPACEWALL portal deck — iPad swipe across same-origin pages.
 *
 * Order (left → right):
 *   SPACEWALL  ↔  HEARTH  ↔  WAVE  ↔  PRESS  ↔  HUB  ↔  REEL
 *
 * A new portal: append a row to PAGES, add the html to write_version.py
 * HTML_SOURCES and PORTAL_BY_FILE, the pages.yml copy list, and this
 * script tag on that page:  <script src="./deck.js" defer></script>
 * Then run:  python3 scripts/write_version.py --bump-ship
 *
 * Default: on for iPad / phone (coarse pointer). Off on the OLED /
 * living-room Mac (fine pointer, wide or fullscreen) so HEARTH does
 * not accidentally become SPACEWALL. Escape hatch: ?swipe=0 or ?deck=0.
 * Force on for desktop prove-out: ?swipe=1 or ?deck=1.
 */
(function () {
  const PAGES = [
    { id: "spacewall", file: "index.html", label: "SPACEWALL" },
    { id: "hearth", file: "hearth.html", label: "HEARTH" },
    { id: "wave", file: "wave.html", label: "WAVE" },
    { id: "press", file: "press.html", label: "PRESS" },
    { id: "hub", file: "hub.html", label: "HUB" },
    { id: "reel", file: "reel.html", label: "REEL" }
  ];

  const STORE_DIR = "spacewall-deck-dir";
  const CARRY = ["swipe", "deck"];

  const root = document.documentElement;
  let live = null;

  function mq(q) {
    try {
      return window.matchMedia(q).matches;
    } catch (e) {
      return false;
    }
  }

  function params() {
    try {
      return new URLSearchParams(location.search);
    } catch (e) {
      return new URLSearchParams();
    }
  }

  function flagValue() {
    const q = params();
    const raw = q.get("swipe") || q.get("deck");
    return raw == null ? null : String(raw).toLowerCase();
  }

  function isOffToken(v) {
    return v === "0" || v === "off" || v === "false" || v === "no";
  }

  function isOnToken(v) {
    return v === "1" || v === "on" || v === "true" || v === "yes";
  }

  function framed() {
    try {
      return window.parent !== window;
    } catch (e) {
      return true;
    }
  }

  function embedded() {
    return params().get("embed") === "1";
  }

  function defaultEnabled() {
    if (framed() || embedded()) return false;
    const anyCoarse = mq("(any-pointer: coarse)");
    const hoverNone = mq("(hover: none)");
    const fullscreen = mq("(display-mode: fullscreen)");
    const wide = window.innerWidth >= 1400;

    // OLED / desktop: big canvas or Chrome fullscreen, no tablet pointer.
    // Do not treat hover:none alone as "iPad" — headless and some TVs report that.
    if (!anyCoarse && (fullscreen || wide)) return false;

    // iPad / phone, including iPad + Magic Keyboard (still has a coarse pointer).
    if (anyCoarse) return true;
    return hoverNone && !wide;
  }

  function computeEnabled() {
    const v = flagValue();
    if (v != null && isOffToken(v)) return false;
    if (v != null && isOnToken(v)) return !framed() && !embedded();
    return defaultEnabled();
  }

  function fileFromPath() {
    const path = (location.pathname || "").replace(/\/+$/, "");
    const base = path.split("/").pop() || "";
    if (!base || base === "spacewall-kiosk") return "index.html";
    return base;
  }

  function currentIndex() {
    const file = fileFromPath();
    const i = PAGES.findIndex(function (p) {
      return p.file === file;
    });
    return i >= 0 ? i : 0;
  }

  function currentPage() {
    return PAGES[currentIndex()];
  }

  function reduceMotion() {
    return mq("(prefers-reduced-motion: reduce)");
  }

  function nextUrl(page) {
    const src = params();
    const out = new URLSearchParams();
    CARRY.forEach(function (k) {
      if (src.has(k)) out.set(k, src.get(k));
    });
    const q = out.toString();
    return "./" + page.file + (q ? "?" + q : "");
  }

  const enabled = computeEnabled();
  const page = currentPage();

  root.dataset.deck = enabled ? "on" : "off";
  root.dataset.deckPage = page.id;

  const style = document.createElement("style");
  style.textContent = [
    "html.deck-on, html.deck-on body { overscroll-behavior-x: none; touch-action: pan-y; }",
    "html.deck-dragging { cursor: grabbing; }",
    "html.deck-animating { transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1); }",
    "#deck-chrome { position: fixed; inset: 0; pointer-events: none; z-index: 9999; overflow: hidden; }",
    "#deck-chrome .rail { position: absolute; top: 0; bottom: 0; width: min(46vw, 300px); display: flex; align-items: center; padding: 0 22px; opacity: 0; transition: opacity 0.16s ease; }",
    "#deck-chrome .rail.left { left: 0; justify-content: flex-start; background: linear-gradient(90deg, rgba(0,0,0,0.52), transparent); }",
    "#deck-chrome .rail.right { right: 0; justify-content: flex-end; background: linear-gradient(270deg, rgba(0,0,0,0.52), transparent); }",
    "#deck-chrome .rail.on { opacity: 1; }",
    "#deck-chrome .name { font: 800 12px/1 -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Helvetica, Arial, sans-serif; letter-spacing: 0.22em; text-transform: uppercase; color: #e8e8ec; text-shadow: 0 1px 12px rgba(0,0,0,0.55); }",
    "#deck-chrome .dots { position: absolute; left: 50%; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); display: flex; gap: 7px; opacity: 0; transition: opacity 0.18s ease; }",
    "html.deck-dragging #deck-chrome .dots, html.deck-hint #deck-chrome .dots { opacity: 1; }",
    "#deck-chrome .dots i { width: 5px; height: 5px; border-radius: 50%; background: rgba(232,232,236,0.28); }",
    "#deck-chrome .dots i.on { background: rgba(232,232,236,0.88); }",
    "#deck-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }"
  ].join("\n");
  document.head.appendChild(style);

  function noteHud() {
    const hud = document.getElementById("hud");
    if (!hud || hud.hidden) return;
    const stamp = "swipe:" + (enabled ? "on" : "off");
    const t = hud.textContent || "";
    if (!t) return;
    if (t.indexOf("swipe:") !== -1) {
      hud.textContent = t.replace(/swipe:\S+/, stamp);
    } else {
      hud.textContent = t + "  ·  " + stamp;
    }
  }

  window.SpacewallDeck = {
    pages: PAGES,
    enabled: enabled,
    page: page,
    go: go,
    currentIndex: currentIndex
  };

  noteHud();
  if (!enabled) return;

  root.classList.add("deck-on");

  const chrome = document.createElement("div");
  chrome.id = "deck-chrome";
  chrome.setAttribute("aria-hidden", "true");
  chrome.innerHTML =
    '<div class="rail left"><span class="name"></span></div>' +
    '<div class="rail right"><span class="name"></span></div>' +
    '<div class="dots"></div>' +
    '<div id="deck-live" aria-live="polite"></div>';
  const dotsEl = chrome.querySelector(".dots");
  PAGES.forEach(function (p, i) {
    const dot = document.createElement("i");
    if (i === currentIndex()) dot.className = "on";
    dotsEl.appendChild(dot);
  });
  const leftRail = chrome.querySelector(".rail.left");
  const rightRail = chrome.querySelector(".rail.right");
  live = chrome.querySelector("#deck-live");

  function mountChrome() {
    if (!chrome.isConnected) document.body.appendChild(chrome);
  }

  if (document.body) mountChrome();
  else document.addEventListener("DOMContentLoaded", mountChrome);

  function setRail(el, dest) {
    if (!dest) {
      el.classList.remove("on");
      return;
    }
    el.querySelector(".name").textContent = dest.label;
    el.classList.add("on");
  }

  function updateChrome(tx) {
    const i = currentIndex();
    if (tx < -8) {
      setRail(rightRail, PAGES[i + 1]);
      setRail(leftRail, null);
    } else if (tx > 8) {
      setRail(leftRail, PAGES[i - 1]);
      setRail(rightRail, null);
    } else {
      setRail(leftRail, null);
      setRail(rightRail, null);
    }
  }

  function clearTransform() {
    root.style.transform = "";
    root.classList.remove("deck-animating");
  }

  function animateTo(x, done) {
    if (reduceMotion()) {
      clearTransform();
      if (done) done();
      return;
    }
    root.classList.add("deck-animating");
    root.style.transform = "translate3d(" + x + "px,0,0)";
    let settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      root.removeEventListener("transitionend", finish);
      if (done) done();
    }
    root.addEventListener("transitionend", finish);
    window.setTimeout(finish, 420);
  }

  function go(dir) {
    const i = currentIndex() + dir;
    const dest = PAGES[i];
    if (!dest || !dir) return false;
    try {
      sessionStorage.setItem(STORE_DIR, String(dir));
    } catch (e) {}
    if (live) live.textContent = dest.label;
    location.assign(nextUrl(dest));
    return true;
  }

  function playEnter() {
    let dir = 0;
    try {
      dir = Number(sessionStorage.getItem(STORE_DIR) || 0);
      sessionStorage.removeItem(STORE_DIR);
    } catch (e) {}
    if (!dir || reduceMotion()) return;
    const w = window.innerWidth;
    root.style.transform = "translate3d(" + dir * Math.min(120, w * 0.2) + "px,0,0)";
    root.style.opacity = "0.78";
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        animateTo(0, function () {
          clearTransform();
          root.style.opacity = "";
        });
      });
    });
  }

  playEnter();

  let startX = 0;
  let startY = 0;
  let startT = 0;
  let pid = null;
  let tracking = false;
  let locked = false;
  let dx = 0;
  let suppressClick = false;

  function applyDrag(x) {
    const i = currentIndex();
    let tx = x;
    if ((i <= 0 && x > 0) || (i >= PAGES.length - 1 && x < 0)) tx = x * 0.26;
    root.style.transform = "translate3d(" + tx + "px,0,0)";
    updateChrome(tx);
  }

  function finish(dir) {
    root.classList.remove("deck-dragging");
    updateChrome(0);
    if (!dir) {
      animateTo(0, function () {
        clearTransform();
      });
      return;
    }
    const w = window.innerWidth;
    if (reduceMotion()) {
      go(dir);
      return;
    }
    animateTo(-dir * Math.min(w, 1400) * 0.42, function () {
      if (!go(dir)) clearTransform();
    });
  }

  function onDown(ev) {
    if (ev.isPrimary === false) return;
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    startX = ev.clientX;
    startY = ev.clientY;
    startT = performance.now();
    pid = ev.pointerId;
    tracking = true;
    locked = false;
    dx = 0;
  }

  function onMove(ev) {
    if (!tracking || ev.pointerId !== pid) return;
    const x = ev.clientX - startX;
    const y = ev.clientY - startY;
    if (!locked) {
      if (Math.abs(x) < 14 && Math.abs(y) < 14) return;
      if (Math.abs(y) >= Math.abs(x) * 0.9) {
        tracking = false;
        return;
      }
      locked = true;
      suppressClick = true;
      root.classList.add("deck-dragging");
      try {
        root.setPointerCapture(pid);
      } catch (e) {}
    }
    dx = x;
    ev.preventDefault();
    applyDrag(dx);
  }

  function onUp(ev) {
    if (!tracking || ev.pointerId !== pid) return;
    tracking = false;
    pid = null;
    if (!locked) return;
    ev.preventDefault();
    const dt = Math.max(1, performance.now() - startT);
    const v = dx / dt;
    const w = window.innerWidth;
    const threshold = Math.min(86, w * 0.16);
    let dir = 0;
    if (dx < -threshold || v < -0.5) dir = 1;
    else if (dx > threshold || v > 0.5) dir = -1;
    const i = currentIndex();
    if (dir === 1 && i >= PAGES.length - 1) dir = 0;
    if (dir === -1 && i <= 0) dir = 0;
    finish(dir);
    window.setTimeout(function () {
      suppressClick = false;
    }, 320);
  }

  window.addEventListener(
    "click",
    function (ev) {
      if (!suppressClick) return;
      ev.preventDefault();
      ev.stopPropagation();
    },
    true
  );

  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp, { passive: false });
  window.addEventListener("pointercancel", onUp, { passive: false });

  window.addEventListener("keydown", function (ev) {
    if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (ev.key === "ArrowRight") {
      ev.preventDefault();
      go(1);
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      go(-1);
    }
  });
})();
