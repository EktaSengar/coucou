// Coucou streak — one daily-return counter shared across pages.
//   lf-streak-count : integer, the current run of consecutive active days
//   lf-streak-last  : YYYY-MM-DD of the most recent active day
// "Active" means any real engagement — visiting Lessons, opening a lesson, or
// playing a taste word. touch() records today; call it once per meaningful
// action (it dedupes to the first call of each calendar day).
window.CoucouStreak = (function () {
  var KEY_C = 'lf-streak-count', KEY_D = 'lf-streak-last';
  function ymd(d) { return d.toISOString().slice(0, 10); }
  function today() { return ymd(new Date()); }
  function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); }
  function get() {
    try {
      return {
        count: parseInt(localStorage.getItem(KEY_C) || '0', 10) || 0,
        last: localStorage.getItem(KEY_D) || ''
      };
    } catch (e) { return { count: 0, last: '' }; }
  }
  // Record activity for today and return the resulting streak length.
  // Same day → unchanged; picking up from yesterday → +1; any longer gap
  // (or first ever) → the streak starts fresh at 1.
  function touch() {
    var s = get();
    if (s.last === today()) return s.count;              // already counted today
    var next = (s.last === yesterday()) ? s.count + 1 : 1;
    try {
      localStorage.setItem(KEY_C, String(next));
      localStorage.setItem(KEY_D, today());
    } catch (e) {}
    return next;
  }
  // Read the display streak without recording activity: a streak whose last
  // active day is older than yesterday has lapsed → 0.
  function current() {
    var s = get();
    if (s.last === today() || s.last === yesterday()) return s.count;
    return 0;
  }
  return { touch: touch, current: current, get: get };
})();
