(function () {
  // The record: the totals count up once and the bars grow once, as they come into view. Without
  // motion (no JavaScript, or reduced motion) the finished numbers and full bars are there at rest.
  // the claim filter: every row is in the page; the buttons only hide the others
  var bar = document.querySelector('.rec-filter');
  if (bar) {
    var rows = [].slice.call(document.querySelectorAll('.claims > li')), note = bar.querySelector('.rec-filter-n');
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var v = b.getAttribute('data-v');
      [].forEach.call(bar.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var n = 0; rows.forEach(function (li) { var show = v === 'all' || li.classList.contains('v-' + v); li.hidden = !show; if (show) { n++; li.classList.add('in'); } });
      if (note) note.textContent = v === 'all' ? '' : n + ' of ' + rows.length + ' claims shown';
    });
  }

  var root = document.documentElement;
  if (!root.classList.contains('motion') || !('IntersectionObserver' in window)) return;
  function tick(el) {
    var to = parseInt(el.getAttribute('data-to'), 10); if (!to) return;
    var t0 = null, dur = Math.min(900, 400 + to / 4);
    function fmt(n) { return n.toLocaleString('en-US'); }
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(to * e));
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  // rows and bars reveal just before they enter; the count-up starts only when the number is fully in view
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (!en.isIntersecting) return; io.unobserve(en.target); en.target.classList.add('in'); });
  }, {rootMargin: '0px 0px 12% 0px', threshold: 0.01});
  [].forEach.call(document.querySelectorAll('.rec-bar, .claims > li'), function (el) { io.observe(el); });
  var io2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (!en.isIntersecting) return; io2.unobserve(en.target); tick(en.target); });
  }, {threshold: 1});
  [].forEach.call(document.querySelectorAll('.tick'), function (el) { io2.observe(el); });

})();
