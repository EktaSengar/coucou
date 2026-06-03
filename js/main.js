/* ===== Learn French with AI — interactivity ===== */
(function () {
  "use strict";
  var root = document.documentElement;
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---- Theme ---- */
  var themeBtn = document.querySelector(".theme-toggle");
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    if (themeBtn) themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
  }
  var saved = store.get("lf-theme", null);
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next); store.set("lf-theme", next);
    });
  }

  /* ---- Mobile nav ---- */
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { nav.classList.remove("open"); navToggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---- Scroll-spy ---- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav a[href^='#']"));
  var linkFor = {};
  navLinks.forEach(function (a) { linkFor[a.getAttribute("href").slice(1)] = a; });
  var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = linkFor[en.target.id];
        if (!link) return;
        if (en.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove("active"); });
          link.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---- Copy buttons ---- */
  document.querySelectorAll(".prompt-card").forEach(function (card) {
    var btn = card.querySelector(".copy-btn");
    var pre = card.querySelector("pre");
    if (!btn || !pre) return;
    btn.addEventListener("click", function () {
      var text = pre.innerText;
      var done = function () {
        var orig = "Copy";
        btn.textContent = "Copied ✓"; btn.classList.add("copied");
        setTimeout(function () { btn.textContent = orig; btn.classList.remove("copied"); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
      } else { fallbackCopy(text, done); }
    });
  });
  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---- Hours → months calculator ---- */
  var calcIn = document.getElementById("calc-hours");
  var calcOut = document.getElementById("calc-out");
  var GOAL = 600;
  function updateCalc() {
    if (!calcIn || !calcOut) return;
    var h = parseFloat(calcIn.value);
    if (!h || h <= 0) { calcOut.textContent = "Enter your daily hours"; return; }
    var months = GOAL / (h * 30);
    var rounded = Math.round(months * 10) / 10;
    calcOut.textContent = "≈ " + rounded + " months to a solid B2";
  }
  if (calcIn) { calcIn.addEventListener("input", updateCalc); updateCalc(); }

  /* ---- 30-day checklist ---- */
  document.querySelectorAll("#checklist input[type=checkbox]").forEach(function (box) {
    var key = "lf-check-" + box.getAttribute("data-key");
    if (store.get(key) === "1") box.checked = true;
    box.addEventListener("change", function () { store.set(key, box.checked ? "1" : "0"); });
  });

  /* ---- Progress tracker ---- */
  var addBtn = document.getElementById("track-add");
  var resetBtn = document.getElementById("track-reset");
  var hoursIn = document.getElementById("track-hours");
  var totalEl = document.getElementById("track-total");
  var pctEl = document.getElementById("track-pct");
  var leftEl = document.getElementById("track-left");
  var bar = document.getElementById("progress-bar");
  function renderTracker() {
    var total = parseFloat(store.get("lf-hours", "0")) || 0;
    var pct = Math.min(100, (total / GOAL) * 100);
    if (totalEl) totalEl.textContent = Math.round(total * 10) / 10;
    if (pctEl) pctEl.textContent = Math.round(pct) + "%";
    if (leftEl) leftEl.textContent = Math.max(0, Math.round(GOAL - total));
    if (bar) bar.style.width = pct + "%";
  }
  if (addBtn && hoursIn) {
    addBtn.addEventListener("click", function () {
      var add = parseFloat(hoursIn.value) || 0;
      var total = (parseFloat(store.get("lf-hours", "0")) || 0) + add;
      if (total < 0) total = 0;
      store.set("lf-hours", String(total));
      renderTracker();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (confirm("Reset your logged hours to zero?")) { store.set("lf-hours", "0"); renderTracker(); }
    });
  }
  renderTracker();

  /* ---- Back to top ---- */
  var toTop = document.getElementById("to-top");
  if (toTop) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 600) toTop.classList.add("show"); else toTop.classList.remove("show");
    }, { passive: true });
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }
})();
