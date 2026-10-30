/* SPACEWALL shared nav — Home = Spacewall front (index). Works from root and subdirs. */
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

  /* Prefix so ./foo works from lisa-projects/* as ../foo */
  var BASE = inLisaProjects() ? "../" : "./";

  var LINKS = [
    { href: BASE, file: "index.html", label: "home", home: true },
    { href: BASE + "welcome-lisa.html", file: "welcome-lisa.html", label: "lisa" },
    { href: BASE + "lisa-projects/", file: "lisa-projects", label: "projects", projects: true },
    { href: BASE + "hub.html", file: "hub.html", label: "hub" },
    { href: BASE + "spacewall.html", file: "spacewall.html", label: "grid" },
    { href: BASE + "rich.html", file: "rich.html", label: "rich" },
    { href: BASE + "hearth.html", file: "hearth.html", label: "hearth" },
    { href: BASE + "wave.html", file: "wave.html", label: "wave" },
    { href: BASE + "press.html", file: "press.html", label: "press" },
    { href: BASE + "reel.html", file: "reel.html", label: "reel" }
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
    "html.sw-nav-on{scroll-padding-top:48px}"
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
    brand.href = BASE;
    brand.textContent = "SPACEWALL";
    brand.title = "SPACEWALL home";
    nav.appendChild(brand);
    LINKS.forEach(function (link) {
      var a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
      if (isHere(link)) a.setAttribute("aria-current", "page");
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
