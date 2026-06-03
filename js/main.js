/* Coucou — interactivity (nav & accordions handled by Alpine / native <details>) */
(function () {
  "use strict";
  var GOAL = 600;
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* Copy buttons */
  document.querySelectorAll(".prompt-card").forEach(function (card) {
    var btn = card.querySelector(".copy-btn");
    var pre = card.querySelector("pre");
    if (!btn || !pre) return;
    btn.addEventListener("click", function () {
      var text = pre.innerText;
      var done = function () {
        btn.textContent = "Copied ✓";
        btn.classList.add("bg-green-600");
        btn.classList.remove("bg-slate-900", "hover:bg-slate-800");
        setTimeout(function () {
          btn.textContent = "Copy";
          btn.classList.remove("bg-green-600");
          btn.classList.add("bg-slate-900", "hover:bg-slate-800");
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text, done); });
      } else { fallback(text, done); }
    });
  });
  function fallback(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* Hours → months calculator */
  var calcIn = document.getElementById("calc-hours");
  var calcOut = document.getElementById("calc-out");
  function updateCalc() {
    if (!calcIn || !calcOut) return;
    var h = parseFloat(calcIn.value);
    if (!h || h <= 0) { calcOut.textContent = "enter your daily hours"; return; }
    var months = Math.round((GOAL / (h * 30)) * 10) / 10;
    calcOut.textContent = "≈ " + months + " months to a solid B2";
  }
  if (calcIn) { calcIn.addEventListener("input", updateCalc); updateCalc(); }

  /* First-week checklist */
  document.querySelectorAll("#checklist input[type=checkbox]").forEach(function (box) {
    var key = "lf-check-" + box.getAttribute("data-key");
    if (store.get(key) === "1") box.checked = true;
    box.addEventListener("change", function () { store.set(key, box.checked ? "1" : "0"); });
  });

  /* Progress tracker */
  var addBtn = document.getElementById("track-add");
  var resetBtn = document.getElementById("track-reset");
  var hoursIn = document.getElementById("track-hours");
  var totalEl = document.getElementById("track-total");
  var pctEl = document.getElementById("track-pct");
  var leftEl = document.getElementById("track-left");
  var bar = document.getElementById("progress-bar");
  function render() {
    var total = parseFloat(store.get("lf-hours", "0")) || 0;
    var pct = Math.min(100, (total / GOAL) * 100);
    if (totalEl) totalEl.textContent = Math.round(total * 10) / 10;
    if (pctEl) pctEl.textContent = Math.round(pct) + "%";
    if (leftEl) leftEl.textContent = Math.max(0, Math.round(GOAL - total));
    if (bar) bar.style.width = pct + "%";
  }
  if (addBtn && hoursIn) {
    addBtn.addEventListener("click", function () {
      var total = (parseFloat(store.get("lf-hours", "0")) || 0) + (parseFloat(hoursIn.value) || 0);
      if (total < 0) total = 0;
      store.set("lf-hours", String(total)); render();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (confirm("Reset your logged hours to zero?")) { store.set("lf-hours", "0"); render(); }
    });
  }
  render();

  /* Back to top */
  var toTop = document.getElementById("to-top");
  if (toTop) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 600) { toTop.classList.remove("opacity-0", "pointer-events-none"); }
      else { toTop.classList.add("opacity-0", "pointer-events-none"); }
    }, { passive: true });
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }
})();
