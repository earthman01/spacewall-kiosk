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
    /* Force navigation even when already on the front page */
    try {
      location.assign(HOME + "?from=nav&t=" + Date.now());
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
    "#sw-nav .sw-brand{color:#3a404a;margin-right:6px;letter-spacing:.22em}",
    "html.sw-nav-on{scroll-padding-top:52px}",
    /* Kill leftover per-page topnav/brands that ghost under SPACEWALL / REEL on Tesla */
    "html.sw-nav-on .topnav,",
    "html.sw-nav-on .sw-nav-pad,",
    "html.sw-nav-on #orbit > header > .brand,",
    "html.sw-nav-on #orbit > header.top > .brand,",
    "html.sw-nav-on #orbit header .brand,",
    "html.sw-nav-on #orbit > .brand{",
    "display:none!important;visibility:hidden!important;pointer-events:none!important}",
    /* Drop page chrome below the fixed shared nav so BOARD/HUB/etc. cannot sit behind REEL */
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
    brand.textContent = "SPACEWALL";
    brand.title = "SPACEWALL home";
    brand.addEventListener("click", goHome);
    nav.appendChild(brand);
    LINKS.forEach(function (link) {
      var a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
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
