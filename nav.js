/* SPACEWALL shared nav — Home/brand always load index.html (works from subdirs + same-page). */
(function () {
  if (window.__swNav) return;
  window.__swNav = true;

  function pathParts() {
    try {
      return (location.pathname || "").split("/").filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function inLisaProjects() {
    return pathParts().indexOf("lisa-projects") !== -1;
  }

  /* Absolute site root on github.io; relative fallback for file:// / other hosts */
  function siteRoot() {
    var parts = pathParts();
    var i = parts.indexOf("spacewall-kiosk");
    if (i >= 0) return "/" + parts.slice(0, i + 1).join("/") + "/";
    if (inLisaProjects()) return "../";
    return "./";
  }

  var ROOT = siteRoot();
  var HOME = ROOT + "index.html";

  var LINKS = [
    { href: HOME, label: "home", home: true },
    { href: ROOT + "welcome-lisa.html", label: "lisa's page", file: "welcome-lisa.html" },
    { href: ROOT + "hub.html", label: "hub", file: "hub.html" },
    { href: ROOT + "spacewall.html", label: "grid", file: "spacewall.html" },
    { href: ROOT + "rich.html", label: "rich", file: "rich.html" },
    { href: ROOT + "hearth.html", label: "hearth", file: "hearth.html" },
    { href: ROOT + "wave.html", label: "wave", file: "wave.html" },
    { href: ROOT + "press.html", label: "press", file: "press.html" },
    { href: ROOT + "reel.html", label: "reel", file: "reel.html" }
  ];

  function pathFile() {
    var parts = pathParts();
    return parts.length ? decodeURIComponent(parts[parts.length - 1]) : "";
  }

  function isHere(link) {
    if (link.projects) return inLisaProjects();
    if (link.home) {
      if (inLisaProjects()) return false;
      var f = pathFile().toLowerCase();
      return f === "" || f === "index.html";
    }
    if (inLisaProjects()) return false;
    return pathFile().toLowerCase() === (link.file || "").toLowerCase();
  }

  function goHome(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    var here = pathFile().toLowerCase();
    var onHome = !inLisaProjects() && (here === "" || here === "index.html");
    if (onHome) {
      /* Already home — no reload flash */
      try { history.replaceState(null, "", HOME); } catch (err) {}
      return;
    }
    try {
      location.assign(HOME);
    } catch (err) {
      location.href = HOME;
    }
  }

  var style = document.createElement("style");
  style.textContent = [
    "#sw-nav{position:fixed;top:0;left:0;right:0;z-index:10000;display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;",
    "padding:10px 18px;padding-top:calc(10px + env(safe-area-inset-top,0px));padding-left:calc(18px + env(safe-area-inset-left,0px));",
    "padding-right:calc(18px + env(safe-area-inset-right,0px));",
    "background:rgba(0,0,0,.94);",
    "pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Display\",\"Segoe UI\",Helvetica,Arial,sans-serif;",
    "-webkit-font-smoothing:antialiased}",
    "#sw-nav a{pointer-events:auto;color:#5a6270;text-decoration:none;font-size:11px;font-weight:600;",
    "letter-spacing:.14em;text-transform:uppercase;line-height:1.2}",
    "#sw-nav a:hover,#sw-nav a:focus-visible{color:#9eb0c8;outline:none}",
    "#sw-nav a[aria-current=page]{color:#c8d0dc}",
    /* HOME accent — soft cyan so it reads as the escape hatch */
    "#sw-nav a.sw-home{color:#5a8aa8}",
    "#sw-nav a.sw-home:hover,#sw-nav a.sw-home:focus-visible{color:#8ec8e8}",
    "#sw-nav a.sw-home[aria-current=page]{color:#a8d8f0}",
    /* Brand mark — designed logo, no blink */
    "#sw-nav .sw-brand{display:inline-flex;align-items:center;gap:8px;margin-right:10px;",
    "color:#c8d0dc;letter-spacing:.2em;font-weight:700;font-size:11px}",
    "#sw-nav .sw-brand:hover,#sw-nav .sw-brand:focus-visible{color:#e8eef6}",
    "#sw-nav .sw-mark{position:relative;width:14px;height:14px;flex:0 0 14px}",
    "#sw-nav .sw-mark svg{display:block;width:14px;height:14px}",
    "#sw-nav .sw-mark .sw-glow{filter:drop-shadow(0 0 4px rgba(120,180,255,.55)) drop-shadow(0 0 8px rgba(80,140,255,.35))}",
    "#sw-nav .sw-word{letter-spacing:.22em}",
    "html.sw-nav-on{scroll-padding-top:52px}",
    /* Kill leftover per-page topnav/brands + deck chrome that ghost under SPACEWALL / REEL on Tesla */
    "#deck-chrome{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
    "html.sw-nav-on .topnav,",
    "html.sw-nav-on .sw-nav-pad,",
    "html.sw-nav-on #orbit > header > .brand,",
    "html.sw-nav-on #orbit > header.top > .brand,",
    "html.sw-nav-on #orbit header .brand,",
    "html.sw-nav-on #orbit > .brand{",
    "display:none!important;visibility:hidden!important;pointer-events:none!important}",
    "html.sw-nav-on #orbit{padding-top:48px;box-sizing:border-box}",
    "html.sw-nav-on body > .wrap,",
    "html.sw-nav-on body > .veil + .wrap{padding-top:calc(56px + env(safe-area-inset-top,0px))}"
  ].join("");
  document.documentElement.classList.add("sw-nav-on");
  (document.head || document.documentElement).appendChild(style);

  function mount() {
    if (document.getElementById("sw-nav")) return;
    var nav = document.createElement("nav");
    nav.id = "sw-nav";
    nav.setAttribute("aria-label", "SPACEWALL");

    var brand = document.createElement("a");
    brand.className = "sw-brand";
    brand.href = HOME;
    brand.title = "SPACEWALL home";
    brand.setAttribute("aria-label", "SPACEWALL home");
    brand.innerHTML =
      '<span class="sw-mark" aria-hidden="true">' +
      '<svg class="sw-glow" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="7" cy="7" r="1.6" fill="#9ec8ff"/>' +
      '<ellipse cx="7" cy="7" rx="5.6" ry="2.2" fill="none" stroke="#6a9fd4" stroke-width="0.9" transform="rotate(-28 7 7)"/>' +
      '<ellipse cx="7" cy="7" rx="5.6" ry="2.2" fill="none" stroke="#4a78a8" stroke-width="0.7" opacity="0.85" transform="rotate(38 7 7)"/>' +
      '<circle cx="11.2" cy="5.1" r="0.85" fill="#c8e0ff"/>' +
      "</svg></span>" +
      '<span class="sw-word">SPACEWALL</span>';
    brand.addEventListener("click", goHome);
    nav.appendChild(brand);

    LINKS.forEach(function (link) {
      var a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
      if (link.home) a.className = "sw-home";
      if (isHere(link)) a.setAttribute("aria-current", "page");
      if (link.home) a.addEventListener("click", goHome);
      nav.appendChild(a);
    });
    (document.body || document.documentElement).appendChild(nav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
