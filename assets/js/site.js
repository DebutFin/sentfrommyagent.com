(function () {
  // Motion is opt-in: only with JavaScript and without a reduced-motion preference. Without the
  // class nothing moves and everything is visible at rest (docs/DESIGN.md, "Motion").
  var motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (motion) document.documentElement.classList.add('motion');

  // Theme: Light, Dark or System, chosen in the menu and remembered as the choice itself (not the
  // resolved scheme). System follows the device live. The head script applied the saved choice
  // before first paint; this keeps the radios, storage and other open tabs in step.
  (function () {
    var root = document.documentElement, selects = document.querySelectorAll('select#theme');
    if (!selects.length) return;
    var KEY = 'sfma-theme', NAMES = /^(light|dark|newsprint|pine|espresso|ticker)$/, DARK = /^(dark|espresso)$/;
    function saved() { try { var v = localStorage.getItem(KEY); return NAMES.test(v) ? v : 'system'; } catch (e) { return root.getAttribute('data-theme') || 'system'; } }
    function apply(v) {
      if (NAMES.test(v)) root.setAttribute('data-theme', v); else root.removeAttribute('data-theme');
      // theme-aware pictures download one image: the dark <source> follows the theme's ground, not only the device
      var scheme = DARK.test(v) ? 'dark' : v === 'system' ? 'system' : 'light';
      [].forEach.call(document.querySelectorAll('picture source[data-dark]'), function (src) {
        if (!src.dataset.media) src.dataset.media = src.getAttribute('media');
        var m = src.dataset.media;
        src.setAttribute('media', scheme === 'dark' ? m.replace('(prefers-color-scheme: dark) and ', '').replace('(prefers-color-scheme: dark)', 'all') : scheme === 'light' ? 'not all' : m);
      });
      [].forEach.call(selects, function (s) { s.value = v; });
    }
    apply(saved());
    [].forEach.call(selects, function (s) {
      s.addEventListener('change', function () { var v = s.value; apply(v); try { localStorage.setItem(KEY, v); } catch (err) {} });
    });
    window.addEventListener('storage', function (e) { if (e.key === KEY) apply(saved()); });
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', function () { apply(saved()); });
  })();

  // Menu: Escape closes it and returns focus to the button.
  var mb = document.querySelector('.menu'), mn = document.getElementById('nav');
  if (mb && mn) document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mn.classList.contains('open')) { mn.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.focus(); }
  });

  // Reveal as the reader arrives: figures, update rows, archive rows and section heads below the
  // first screen rise into place once; anything already on screen is left alone.
  if (motion && 'IntersectionObserver' in window) {
    var vh = window.innerHeight || 800;
    var els = document.querySelectorAll('.issue .fig, .issue .upd > li, .issue .four > li, .issue .timeline > li, .issue .callout, .issue .pull, .list > li, .page h2, .eds > li, .deskcard');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {rootMargin: '0px 0px 12% 0px', threshold: 0.01});   // reveal just before an element enters, so nothing is caught half-shown
    [].forEach.call(els, function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      el.setAttribute('data-reveal', ''); io.observe(el);
    });
    // the highlighter sweeps under a marked line as it comes into view; the sign-off stamp lands
    var sweep = document.querySelectorAll('.issue .hl:not(.my), .signoff .stamp');
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io2.unobserve(en.target); } });
    }, {rootMargin: '0px 0px 4% 0px', threshold: 0.2});
    [].forEach.call(sweep, function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) { el.classList.add('in'); return; }
      io2.observe(el);
    });
  } else {
    [].forEach.call(document.querySelectorAll('.issue .hl, .signoff .stamp'), function (el) { el.classList.add('in'); });
  }

  var b = document.querySelector('.menu'), n = document.getElementById('nav');
  if (b && n) b.addEventListener('click', function () {
    var o = n.classList.toggle('open');
    b.setAttribute('aria-expanded', o ? 'true' : 'false');
  });

  // Inside the claude.ai preview viewer, plain download links are blocked; hand the PDF to the
  // viewer's save prompt instead. On the real site window.claude doesn't exist and this does nothing.
  if (window.claude && typeof window.claude.use === 'function') {
    window.claude.use('downloads').then(function (dl) {
      if (!dl) return;
      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[download]');
        if (!a) return;
        e.preventDefault();
        fetch(a.href).then(function (r) { return r.blob(); })
          .then(function (blob) { return dl.save({filename: a.getAttribute('download'), data: blob}); })
          .catch(function () {});
      });
    }).catch(function () {});
  }

  // Subscribe forms with edition choices: at least one must be picked, or the reader would confirm and
  // then receive nothing.
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.hasAttribute || !f.hasAttribute('data-needs-pick')) return;
    var boxes = f.querySelectorAll('input[name=tag][type=checkbox]');
    if (!boxes.length) return;
    var any = [].some.call(boxes, function (b) { return b.checked; });
    var err = f.querySelector('.pickerr');
    if (err) err.hidden = any;
    if (!any) { e.preventDefault(); boxes[0].focus(); }
  });

  // Copy a feed address. Success says "Copied"; if the browser refuses the clipboard, the
  // address is selected so the reader can copy it by hand, and the button says so.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('button.copy');
    if (!btn) return;
    var field = document.getElementById(btn.getAttribute('data-copy'));
    if (!field) return;
    function done(msg, ok) {
      btn.textContent = msg; btn.classList.toggle('ok', ok);
      clearTimeout(btn._t); btn._t = setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('ok'); }, 2400);
    }
    function manual() { field.focus(); field.select(); done('Selected: press copy', false); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(field.value).then(function () { done('Copied', true); }, manual);
    } else { manual(); }
  });

  // Archive search. Uses archive/index.json (every issue of every newsletter); on a newsletter's
  // own archive it searches that newsletter unless "Search every newsletter" is ticked. If the
  // index can't be loaded, it filters the issues listed on this page instead.
  var box = document.querySelector('.search');
  if (!box) return;
  var input = box.querySelector('input[type=search]'), count = box.querySelector('.search-n');
  var all = box.querySelector('.search-all input'), more = box.querySelector('.search-more');
  var results = document.querySelector('.results'), arch = document.querySelector('.arch');
  var root = box.getAttribute('data-root') || '', fileStyle = box.getAttribute('data-style') === 'file';
  var ed = box.getAttribute('data-ed'), edName = box.getAttribute('data-edname');
  var index = null, rows = [].slice.call(document.querySelectorAll('.arch .list li')), limit = 50;
  var label = box.querySelector('label[for=q]'), label0 = label ? label.textContent : '';
  function scopeLabel() { if (label && ed) label.textContent = (all && all.checked) ? 'Search every newsletter' : label0; }
  function remember(q) { try { var u = new URL(location.href); if (q) u.searchParams.set('q', q); else u.searchParams.delete('q'); history.replaceState(null, '', u); } catch (e) {} }
  try { var q0 = new URL(location.href).searchParams.get('q'); if (q0) input.value = q0; } catch (e) {}

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function href(u) { return root + u + (fileStyle ? '/index.html' : '/'); }
  function words(q) { return q.toLowerCase().split(/\s+/).filter(Boolean); }
  function no(n) { return 'No. ' + String(n).padStart(2, '0'); }

  fetch(root + 'archive/index.json').then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { index = d; if (input.value) render(input.value); }).catch(function () { index = null; if (input.value) render(input.value); });

  function render(q) {
    var w = words(q);
    more.hidden = true;
    if (!w.length) { results.hidden = true; arch.hidden = false; rows.forEach(function (li) { li.hidden = false; }); count.textContent = ''; return; }
    if (index) {
      var scoped = ed && !(all && all.checked);
      var hits = index.filter(function (x) {
        if (scoped && x.id !== ed) return false;
        var hay = (x.t + ' ' + x.s + ' ' + (x.k || '') + ' ' + x.e + ' ' + no(x.n) + ' no. ' + x.n + ' ' + x.h + ' ' + x.d).toLowerCase();
        return w.every(function (k) { return hay.indexOf(k) > -1; });
      });
      var shown = hits.slice(0, limit);
      results.innerHTML = shown.map(function (x) {
        return '<li class="ed-' + esc(x.id) + '" style="--mk:' + esc(x.m) + '"><span class="no"><i class="dot"></i>' + esc(x.e) + ' · ' + no(x.n) + '</span>' +
          '<div class="txt"><h3><a href="' + esc(href(x.u)) + '">' + esc(x.t) + '</a></h3><p>' + esc(x.s) + '</p></div>' +
          '<span class="dt"><time datetime="' + esc(x.d) + '">' + esc(x.h) + '</time>' +
          (x.p ? '<a class="pdfl" href="' + esc(root + x.p) + '" target="_blank" rel="noopener" aria-label="PDF of ' + esc(x.e) + ' ' + no(x.n) + '">PDF</a>' : '') + '</span></li>';
      }).join('');
      results.hidden = false; arch.hidden = true;
      var where = scoped ? ' in ' + edName : ' across every newsletter';
      if (!hits.length) count.innerHTML = 'Nothing matches that' + esc(where) + '. Try one word, or browse <a href="' + esc(root + (fileStyle ? 'archive/index.html' : 'archive/')) + '">every issue</a> or <a href="' + esc(root + (fileStyle ? 'editions/index.html' : 'editions/')) + '">the newsletters</a>.';
      else if (hits.length > shown.length) { count.textContent = 'Showing ' + shown.length + ' of ' + hits.length + ' issues' + where + ', newest first.'; more.hidden = false; }
      else count.textContent = hits.length + (hits.length === 1 ? ' issue' : ' issues') + where + '.';
    } else {
      var n = 0;
      rows.forEach(function (li) {
        var ok = w.every(function (k) { return (li.getAttribute('data-q') || '').indexOf(k) > -1; });
        li.hidden = !ok; n += ok ? 1 : 0;
      });
      count.textContent = n ? n + ' on this page' : 'Nothing on this page matches.';
    }
  }
  var t;
  input.addEventListener('input', function () { limit = 50; clearTimeout(t); t = setTimeout(function () { render(input.value); remember(input.value); }, 120); });
  if (all) all.addEventListener('change', function () { scopeLabel(); render(input.value); });
  scopeLabel();
  more.addEventListener('click', function () { limit = Infinity; render(input.value); });
})();
