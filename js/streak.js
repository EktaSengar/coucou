// Coucou streak — one daily-return counter shared across pages.
//   lf-streak-count : integer, the current run of consecutive active days
//   lf-streak-last  : YYYY-MM-DD of the most recent active day
// "Active" means any real engagement — visiting Lessons, opening a lesson, or
// playing a taste word. touch() records today; call it once per meaningful
// action (it dedupes to the first call of each calendar day).
window.CoucouStreak = (function () {
  var KEY_C = 'lf-streak-count', KEY_D = 'lf-streak-last', KEY_F = 'lf-first-day';
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
    // Stamp day one at the first meaningful action anywhere on the site, not
    // wherever the day number first happens to be read — otherwise a week of
    // lessons followed by a first visit to the home page reads "Day 1".
    try { if (!localStorage.getItem(KEY_F)) localStorage.setItem(KEY_F, today()); } catch (e) {}
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
  // ── today's habits ───────────────────────────────────────────────────
  // lf-day-YYYY-MM-DD : JSON map of habit → 1, e.g. {"learn":1,"speak":1}
  // The Today card on the home page reads this to know what's left in the
  // hour. Kept here rather than in its own module so every page shares one
  // idea of what "today" means.
  var DAY_PREFIX = 'lf-day-';
  function doneToday() {
    try { return JSON.parse(localStorage.getItem(DAY_PREFIX + today()) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function mark(habit, on) {
    var d = doneToday();
    if (on === false) { delete d[habit]; } else { d[habit] = 1; touch(); }
    try { localStorage.setItem(DAY_PREFIX + today(), JSON.stringify(d)); } catch (e) {}
    return d;
  }
  // Days since the very first recorded activity — "Day 12" reads better than
  // a streak that resets, because it never punishes a missed day.
  function dayNumber() {
    try {
      var first = localStorage.getItem(KEY_F);
      if (!first) { localStorage.setItem(KEY_F, today()); first = today(); }
      var ms = new Date(today()) - new Date(first);
      return Math.floor(ms / 86400000) + 1;
    } catch (e) { return 1; }
  }
  return { touch: touch, current: current, get: get, doneToday: doneToday, mark: mark, dayNumber: dayNumber };
})();
