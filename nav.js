/* SPACEWALL shared nav — same fixed bar on every portal. */
(function () {
  if (window.__swNav) return;
  window.__swNav = true;

  var LINKS = [
    { href: "./", file: "index.html", label: "spacewall", match: ["", "index.html", "spacewall.html"] },
    { href: "./welcome-lisa.html", file: "welcome-lisa.html", label: "lisa" },
    { href: "./rich.html", file: "rich.html", label: "rich" },
    { href: "./hearth.html", file: "hearth.html", label: "hearth" },
    { href: "./wave.html", file: "wave.html", label: "wave" },
    { href: "./press.html", file: "press.html", label: "press" },
    { href: "./hub.html", file: "hub.html", label: "hub" },
    { href: "./reel.html", file: "reel.html", label: "reel" }
  ];

  function pathFile() {
    try {
      var p = (location.pathname || "").split("/").pop() || "";
      return decodeURIComponent(p);
    } catch (e) {
      return "";
    }
  }

  function isHere(link, file) {
    var f = (file || "").toLowerCase();
    if (link.match) {
      for (var i = 0; i < link.match.length; i++) {
        if (link.match[i].toLowerCase() === f) return true;
      }
      return false;
    }
    return (link.file || "").toLowerCase() === f;
  }

  var style = document.createElement("style");
  style.textContent = [
    "#sw-nav{position:fixed;top:0;left:0;right:0;z-index:10000;display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;",
    "padding:10px 18px;padding-top:calc(10px + env(safe-area-inset-top,0px));padding-left:calc(18px + env(safe-area-inset-left,0px));",
    "padding-right:calc(18px + env(safe-area-inset-right,0px));",
    "background:linear-gradient(180deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.72) 70%,transparent 100%);",
    "pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Display\",\"Segoe UI\",Helvetica,Arial,sans-serif;",
    "-webkit-font-smoothing:antialiased}",
    "#sw-nav a{pointer-events:auto;color:#5a6270;text-decoration:none;font-size:11px;font-weight:600;",
    "letter-spacing:.14em;text-transform:uppercase;line-height:1.2}",
    "#sw-nav a:hover,#sw-nav a:focus-visible{color:#9eb0c8;outline:none}",
    "#sw-nav a[aria-current=page]{color:#c8d0dc}",
    "#sw-nav .sw-brand{color:#3a404a;margin-right:6px;letter-spacing:.22em}",
    "html.sw-nav-on{scroll-padding-top:48px}",
    "html.sw-nav-on body{padding-top:0}",
    /* Push common chrome below the bar without fighting full-bleed OLED stages */
    "html.sw-nav-on #orbit > .stage,",
    "html.sw-nav-on #orbit > header,",
    "html.sw-nav-on body > header,",
    "html.sw-nav-on #orbit > .topnav,",
    "html.sw-nav-on .sw-nav-pad{padding-top:42px}",
    "html.sw-nav-on body > .brand:first-child,",
    "html.sw-nav-on body > div.brand{margin-top:42px}"
  ].join("");
  document.documentElement.classList.add("sw-nav-on");
  (document.head || document.documentElement).appendChild(style);

  function mount() {
    if (document.getElementById("sw-nav")) return;
    var file = pathFile();
    var nav = document.createElement("nav");
    nav.id = "sw-nav";
    nav.setAttribute("aria-label", "SPACEWALL");
    var brand = document.createElement("span");
    brand.className = "sw-brand";
    brand.textContent = "SPACEWALL";
    nav.appendChild(brand);
    LINKS.forEach(function (link) {
      var a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
      if (isHere(link, file)) a.setAttribute("aria-current", "page");
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
