/* Home page choreography. Every motion here is one of the keyboard behaviours the newsletters
   are named after (ghost text, strike, squiggle, progress bar, moon), a desk letter's own page
   (Morning Note's front page, Last Print's week to the close, the AI note's signal) or the desk doing its job:
   write, check, stamp, send. Purposes and static alternatives: docs/DESIGN.md, "Motion".
   Nothing here runs under prefers-reduced-motion, and the page is complete without it. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined';
  if (hasGsap && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var motion = hasGsap && !reduce;
  // The caret follows the typing: it sits after the last character revealed, the way a real cursor
  // does. It is absolutely positioned and moved with a transform, so nothing reflows while it moves.
  function caretAt(caret, box, c, before) {
    var b = box.getBoundingClientRect(), r = c.getBoundingClientRect();
    caret.style.transform = 'translate(' + ((before ? r.left : r.right) - b.left).toFixed(1) + 'px,' + (r.top - b.top).toFixed(1) + 'px)';
    caret.style.height = r.height.toFixed(1) + 'px';
  }
  function typeOn(tl, chars, caret, box, step, at) {
    chars.forEach(function (c, i) {
      tl.call(function () { c.className = c.className.replace(/\bon\b/, '') + ' on'; caretAt(caret, box, c); }, null, (at || 0) + i * step);
    });
  }

  /* ---------- intro curtain: the name predicts itself, once per visit ---------- */
  var curtain = $('#curtain');
  var seen = false;
  try { seen = sessionStorage.getItem('sfma-intro') === '1'; } catch (e) {}
  var heroDone = false;
  function heroIn(instant) {
    if (heroDone) return; heroDone = true;
    if (!motion || instant) return;
    gsap.from('.hh .w', {yPercent: 40, duration: .5, stagger: .05, ease: 'power3.out'});
    gsap.fromTo('.hh .my i', {scaleX: 0}, {scaleX: 1, duration: .45, ease: 'power2.out', delay: .3});
    gsap.from('.hm-desk', {y: 24, duration: .6, ease: 'power3.out', delay: .2});
  }
  function endIntro() {
    if (!curtain || curtain.hidden) return;
    try { sessionStorage.setItem('sfma-intro', '1'); } catch (e) {}
    gsap.to(curtain, {yPercent: -100, duration: .5, ease: 'power3.inOut', onComplete: function () { curtain.hidden = true; }});
    heroIn();
  }
  var wantIntro = curtain && motion && !seen && window.innerWidth >= 900 && getComputedStyle(curtain).display !== 'none';
  if (!wantIntro) {
    if (curtain) curtain.hidden = true;
    heroIn(true);
  } else {
    // Every character is in place from the start; typing reveals them, the prediction fades in,
    // accepting it only changes colour. Nothing reflows, so nothing jumps.
    var box = $('#typed'), typedChars = [], ghostChars = [];
    function ch(c, ghostly) { var el = document.createElement('span'); el.className = 'ch' + (ghostly ? ' g' : ''); el.textContent = c; (ghostly ? ghostChars : typedChars).push(el); return el; }
    'Sent from'.split('').forEach(function (c) { box.appendChild(ch(c, false)); });
    var brk = document.createElement('span'); brk.className = 'brk'; box.appendChild(brk); box.appendChild(ch(' ', false));
    'my '.split('').forEach(function (c) { box.appendChild(ch(c, false)); });
    var mark = document.createElement('span'); mark.className = 'mymark'; mark.appendChild(document.createElement('i'));
    var caret = document.createElement('span'); caret.className = 'caret';
    'Agent'.split('').forEach(function (c) { mark.appendChild(ch(c, true)); }); box.appendChild(mark);
    caret.className = 'caret follow'; box.appendChild(caret);
    caretAt(caret, box, typedChars[0], true);
    var ctl = gsap.timeline({delay: .15});
    typeOn(ctl, typedChars, caret, box, .032, 0);
    ctl.to(ghostChars, {className: 'ch g on', duration: .01, stagger: .006}, typedChars.length * .032 + .1);
    ctl.to(ghostChars, {className: 'ch g on acc', duration: .01, stagger: .01}, '+=0.22');
    ctl.set(caret, {className: 'caret off'}, '<');
    ctl.to('.curtain .mymark i', {scaleX: 1, duration: .25, ease: 'power2.out'}, '<');
    ctl.call(endIntro, null, '+=0.3');
    $('#skip').addEventListener('click', endIntro);
    setTimeout(endIntro, 1700);   // never trap anyone: the page is there in under two seconds
  }

  /* ---------- hero line: predictive text, smooth ---------- */
  (function () {
    var el = $('#rot-text'), g = $('#rot-ghost'), caret = $('#rot-caret'), line = el && el.parentElement, box = $('#rotator');
    if (!el) return;
    var lines = [
      'An agent does the reading.',
      'A second agent checks every claim against its source.',
      'Nothing goes out that fails the checks.'
    ];
    // without motion the line keeps the sentence it was served with: nothing grows, nothing shifts
    if (!motion) { g.textContent = ''; if (caret) caret.hidden = true; return; }
    var k = 0;
    function chars(text, into, ghostly) {
      into.textContent = '';
      return text.split('').map(function (c) { var sp = document.createElement('span'); sp.className = 'ch' + (ghostly ? ' g' : ''); sp.textContent = c; into.appendChild(sp); return sp; });
    }
    function show() {
      var str = lines[k % lines.length]; k++;
      var cut = Math.min(str.length, str.indexOf(' ', Math.floor(str.length * 0.35)) + 1);
      var typed = chars(str.slice(0, cut), el, false), ghost = chars(str.slice(cut), g, true);
      line.style.opacity = 1; caret.className = 'caret follow';
      caretAt(caret, box, typed[0], true);
      var tl = gsap.timeline({id: 'rot'});
      typeOn(tl, typed, caret, box, .048, 0);
      tl.to(ghost, {className: 'ch g on', duration: .01, stagger: .008}, typed.length * .048 + .15);
      tl.to(ghost, {className: 'ch g on acc', duration: .01, stagger: .014}, '+=0.7');
      tl.set(caret, {className: 'caret off'}, '<');
      tl.to(line, {opacity: 0, duration: .35, ease: 'power1.in'}, '+=2.6');
      tl.call(show);
    }
    show();
    window.__sfmaHero = function (on) { gsap.globalTimeline.getChildren(false, true, true).forEach(function (t) { if (t.vars && t.vars.id === 'rot') on ? t.play() : t.pause(); }); };
  })();

  /* ---------- the desk: write, check, stamp, send, night ---------- */
  (function () {
    var cap = $('#deskcap');
    if (!$('#scene')) return;
    if (!motion) {
      // resting state: a checked letter
      var stp = $('#stamp'); if (stp) stp.setAttribute('opacity', '1');
      $$('#checks path').forEach(function (p) { p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '0'; });
      var pr = $('#prog'); if (pr) pr.setAttribute('width', '376');
      if (cap) cap.textContent = 'Written, checked, stamped.';
      return;
    }
    var say = function (t) { return function () { cap.textContent = t; }; };
    var lines = $$('#lines > rect, #lines > g');
    var checks = $$('#checks path');
    gsap.set(lines, {scaleX: 0, transformOrigin: 'left center'});
    gsap.set(checks, {strokeDasharray: 1, strokeDashoffset: 1});
    gsap.set(['#strike', '#squig'], {strokeDasharray: 1, strokeDashoffset: 1});
    gsap.set('#prog', {attr: {width: 0}});
    gsap.set('#stamp', {opacity: 0, scale: 1.8, transformOrigin: 'center'});
    gsap.set('#nightg', {opacity: 0});
    gsap.set('#moon', {y: 70});
    gsap.set('#moonbite', {attr: {cx: 300}});
    gsap.set('#pigeon', {opacity: 0});

    var tl = gsap.timeline({repeat: -1, repeatDelay: 1.2, defaults: {ease: 'power2.out'}});
    tl.call(say('The agent writes.'));
    tl.set('#caret', {opacity: 1});
    var ys = [140, 176, 232, 258, 284, 310, 336, 362, 388, 414];
    lines.forEach(function (l, idx) {
      tl.to(l, {scaleX: 1, duration: idx < 2 ? .5 : .32, ease: 'none'}, '>-0.02');
      tl.to('#caret', {y: ys[idx] - 138 + (idx < 2 ? 0 : -8), duration: .01}, '<');
    });
    tl.to('#caret', {opacity: 0, duration: .2});
    tl.call(say('A second agent checks every line.'), null, '+=0.3');
    tl.set('#lens', {opacity: 1, x: 470, y: 150});
    var k = 0;
    [238, 264, 290, 316, 342, 368, 394, 420].forEach(function (y, idx) {
      tl.to('#lens', {y: y, duration: .28, ease: 'power1.inOut'});
      if (y === 290) {
        tl.call(say('One number doesn’t match the source. Struck, and corrected.'));
        tl.to('#lens', {x: 260, duration: .35, ease: 'power1.inOut'});
        tl.to('#strike', {strokeDashoffset: 0, duration: .35, ease: 'power2.inOut'});
        tl.to('#num3', {opacity: .35, duration: .2}, '<');
        tl.fromTo('#fix3', {opacity: 0, y: -10}, {opacity: 1, y: 0, duration: .35});
        tl.to('#lens', {x: 470, duration: .35, ease: 'power1.inOut'}, '+=0.25');
      } else if (y === 342) {
        tl.call(say('A word the source never used. Flagged, then replaced.'));
        tl.to('#lens', {x: 350, duration: .35, ease: 'power1.inOut'});
        tl.to('#squig', {strokeDashoffset: 0, duration: .45, ease: 'power2.inOut'});
        tl.to('#word5', {opacity: 0, duration: .25}, '+=0.2');
        tl.to('#squig', {opacity: 0, duration: .25}, '<');
        tl.to('#newword', {opacity: 1, duration: .25}, '<');
        tl.to('#lens', {x: 470, duration: .35, ease: 'power1.inOut'}, '+=0.2');
      } else {
        tl.to(checks[k++], {strokeDashoffset: 0, duration: .25, ease: 'power2.out'});
      }
      tl.to('#prog', {attr: {width: 376 * (idx + 1) / 8}, duration: .25, ease: 'none'}, '<');
    });
    tl.to('#lens', {opacity: 0, duration: .25});
    tl.call(say('Every check passed.'), null, '+=0.1');
    tl.to('#stamp', {opacity: 1, scale: 1, duration: .32, ease: 'power4.in'});
    tl.to('#scene', {x: -3, duration: .05, yoyo: true, repeat: 3}, '<+0.28');
    tl.call(say('The pigeon takes it. Sent.'), null, '+=0.8');
    tl.set('#pigeon', {opacity: 1, xPercent: -140, top: '34%'});
    tl.to('#pigeon', {xPercent: 4, duration: 1.1, ease: 'power2.out'});
    tl.to('#scene', {scale: .18, x: -70, y: -56, opacity: 0, duration: .65, ease: 'power2.in', transformOrigin: 'center center'}, '<+0.6');
    tl.to('#pigeon', {xPercent: 270, duration: 1.2, ease: 'power2.in'}, '+=0.15');
    $$('#trail i').forEach(function (t, i) {
      tl.set(t, {opacity: 1, left: (30 + i * 12) + '%', top: (55 - i * 1.5) + '%', scale: .6 + i * .2}, '<+' + (0.08 + i * 0.14));
      tl.to(t, {opacity: 0, duration: .7, ease: 'power1.out'}, '<+0.25');
    });
    tl.set('#pigeon', {opacity: 0, xPercent: -140});
    tl.to('#nightg', {opacity: 1, duration: .5}, '-=0.6');
    tl.to('#moon', {y: 0, duration: 1.1, ease: 'power2.out'}, '<');
    tl.to('#moonbite', {attr: {cx: 338}, duration: 1.1, ease: 'power2.out'}, '<');
    tl.call(say('Do not disturb until tomorrow.'));
    tl.to({}, {duration: 1.3});
    tl.set('#scene', {y: 0, rotate: 0, x: 0, scale: 1, opacity: 0});
    tl.set(lines, {scaleX: 0});
    tl.set(checks, {strokeDashoffset: 1});
    tl.set(['#strike', '#squig'], {strokeDashoffset: 1, opacity: 1});
    tl.set(['#num3', '#word5'], {opacity: 1});
    tl.set(['#fix3', '#newword', '#stamp'], {opacity: 0});
    tl.set('#stamp', {scale: 1.8});
    tl.set('#prog', {attr: {width: 0}});
    tl.set('#moon', {y: 70});
    tl.set('#moonbite', {attr: {cx: 300}});
    // the night fades and the fresh page fades in under it: no cut
    tl.to('#nightg', {opacity: 0, duration: .7});
    tl.to('#scene', {opacity: 1, duration: .7}, '<');
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({trigger: '.hm-desk', start: 'top bottom', end: 'bottom top',
        onEnter: function () { tl.play(); }, onLeave: function () { tl.pause(); },
        onEnterBack: function () { tl.play(); }, onLeaveBack: function () { tl.pause(); }});
    }
    document.addEventListener('visibilitychange', function () { document.hidden ? gsap.globalTimeline.pause() : gsap.globalTimeline.play(); });
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.create({trigger: '.hero-home', start: 'top bottom', end: 'bottom top', onLeave: function () { window.__sfmaHero && window.__sfmaHero(false); }, onEnterBack: function () { window.__sfmaHero && window.__sfmaHero(true); }});
  })();

  /* ---------- marquee ---------- */
  (function () {
    var track = $('#track');
    if (!track || !motion) return;
    var clone = track.innerHTML; track.innerHTML = clone + clone;
    var w = track.scrollWidth / 2;
    var tw = gsap.to(track, {x: -w, duration: Math.max(18, w / 90), ease: 'none', repeat: -1});
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.create({trigger: track.parentElement, start: 'top bottom', end: 'bottom top', onEnter: function () { tw.play(); }, onLeave: function () { tw.pause(); }, onEnterBack: function () { tw.play(); }, onLeaveBack: function () { tw.pause(); }});
    track.parentElement.addEventListener('mouseenter', function () { tw.timeScale(.25); });
    track.parentElement.addEventListener('mouseleave', function () { tw.timeScale(1); });
  })();

  // Fit each motif's word to its paper box, once the webfont is in (the fallback is narrower).
  function fitMotifs() {
    $$('.motif').forEach(function (m) {
      var t = $('.t', m), g = $('.g', m);
      if (!t) return;
      if (!t.getAttribute('data-size')) t.setAttribute('data-size', parseFloat(getComputedStyle(t).fontSize) || 40);
      var size = parseFloat(t.getAttribute('data-size')) || 40, w, room = 300;
      t.style.fontSize = size + 'px'; if (g) g.style.fontSize = size + 'px';
      w = t.getComputedTextLength();
      if (w > room) { size = Math.max(20, Math.floor(size * room / w)); t.style.fontSize = size + 'px'; if (g) g.style.fontSize = size + 'px'; }
      var c = $('.tcaret', m);
      if (c) { var base = +t.getAttribute('y') || 170; c.setAttribute('y', Math.round(base - size * 0.74)); c.setAttribute('height', Math.round(size * 0.92)); }
    });
  }
  // Last Print's end mark sits a short space after its masthead, wherever the webfont sets the last letter.
  function placeEndmarks() {
    $$('.motif-final').forEach(function (m) {
      var t = $('.mast', m), em = $('.em', m);
      if (!t || !em || !t.getComputedTextLength) return;
      var w = t.getComputedTextLength(), x = +t.getAttribute('x') || 194;
      if (w) em.setAttribute('x', (x + w / 2 + 3).toFixed(1));
    });
  }
  fitMotifs(); placeEndmarks();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitMotifs(); placeEndmarks(); });

  /* ---------- the AI card's matrix, still: the message in the clear, a quiet field of glyphs around it.
     Built for everyone (motion off included); the motion block below rebuilds it to animate. ---------- */
  $$('.motif-matrix').forEach(function (m) {
    var g = $('.cells', m); if (!g) return;
    var cols = +m.getAttribute('data-cols') || 18, lines = +m.getAttribute('data-lines') || 8;
    var msg = (m.getAttribute('data-rows') || '').split('|'), rowsAt = [0, 1, 3, 4, 6];
    var x0 = 16, y0 = 16, w = 368, h = 268, cw = w / cols, chh = h / lines;
    var glyphs = '01<>{}[]/|=+-*#%&@$:;.ABCDEFGHJKLMNPQRSTUVWXYZ0123456789', seed = 7;
    for (var r = 0; r < lines; r++) {
      var line = rowsAt.indexOf(r) > -1 ? (msg[rowsAt.indexOf(r)] || '') : '';
      var start = Math.floor((cols - line.length) / 2);
      for (var c = 0; c < cols; c++) {
        var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', (x0 + cw * (c + .5)).toFixed(1)); t.setAttribute('y', (y0 + chh * (r + .72)).toFixed(1));
        t.setAttribute('text-anchor', 'middle');
        var ch = (c >= start && c < start + line.length) ? line[c - start] : '';
        seed = (seed * 9301 + 49297) % 233280;   // the same field every visit: no flicker on reload
        if (ch && ch !== ' ') { t.textContent = ch; t.setAttribute('class', 'cell on'); }
        else { t.textContent = ch === ' ' ? '' : glyphs[seed % glyphs.length]; t.setAttribute('class', 'cell'); }
        g.appendChild(t);
      }
    }
  });

  if (!motion || typeof ScrollTrigger === 'undefined') return;

  /* ---------- sheets: slide in, tint the ground, and run each keyboard habit ---------- */
  var eds = $('.eds-home');
  if (eds) {
    // the tint mixes with the live ground, var(--bg), not a colour read once at load: a theme change after
    // load then repaints the section in the new theme instead of keeping the old one until a refresh
    var mix = function (c) { return 'color-mix(in srgb, ' + c + ' 34%, var(--bg))'; };
    var clearTint = function () { eds.style.removeProperty('--tint'); };
    $$('.sheet').forEach(function (sh, idx) {
      gsap.from(sh, {y: 60, rotate: idx % 2 ? 1.2 : -1.2, opacity: 0, duration: .55, ease: 'power3.out',
        scrollTrigger: {trigger: sh, start: 'top 100%', toggleActions: 'play none none none'}});
      ScrollTrigger.create({trigger: sh, start: 'top 60%', end: 'bottom 40%',
        onEnter: function () { eds.style.setProperty('--tint', mix(sh.dataset.tint)); },
        onEnterBack: function () { eds.style.setProperty('--tint', mix(sh.dataset.tint)); }});
    });
    ScrollTrigger.create({trigger: eds, start: 'top 60%', end: 'bottom 40%',
      onLeave: clearTint, onLeaveBack: clearTint});

    var loops = [];
    $$('.motif-ghost').forEach(function (m) {
      // Predictive text as a wipe: the whole phrase is set once; ink is revealed by a clip, the
      // prediction sits behind it in grey, and accepting it finishes the wipe. No reflow.
      var t = $('.t', m), g = $('.g', m), c = $('.tcaret', m), clip = $('.clip', m);
      var cut = +t.getAttribute('data-cut') || 6, full = t.textContent.length;
      var measure = function () { var typedW = t.getSubStringLength(0, Math.min(cut, full)), allW = t.getComputedTextLength(); return {typedW: typedW, allW: allW}; };
      var st = {w: 0};
      var place = function () { clip.setAttribute('width', st.w); c.setAttribute('x', 44 + st.w + 4); };
      var tl = gsap.timeline({repeat: -1, repeatDelay: 1.6, onUpdate: place});
      tl.set(st, {w: 0}); tl.set(g, {opacity: 0}); tl.set(c, {opacity: 1}, '+=0.01');
      tl.to(st, {w: function () { return measure().typedW; }, duration: 1.1, ease: 'none'});
      tl.to(g, {opacity: .38, duration: .35, ease: 'power1.out'}, '-=0.1');
      tl.to(st, {w: function () { return measure().allW + 2; }, duration: .45, ease: 'power2.inOut'}, '+=0.7');
      tl.to(c, {opacity: 0, duration: .25}, '<');
      tl.to({}, {duration: 1.8});
      tl.to([t, g], {opacity: 0, duration: .35}, '>');
      tl.set(t, {opacity: 1}); tl.set(g, {opacity: 0});
      loops.push(tl);
    });
    $$('.motif-strike .strike').forEach(function (p) {
      gsap.set(p, {strokeDasharray: 1, strokeDashoffset: 1});
      loops.push(gsap.timeline({repeat: -1, repeatDelay: 1.2}).to(p, {strokeDashoffset: 0, duration: .7, ease: 'power2.inOut'}).to({}, {duration: 1.4}).to(p, {opacity: 0, duration: .3}).set(p, {strokeDashoffset: 1, opacity: 1}));
    });
    $$('.motif-squiggle .squig').forEach(function (p) {
      gsap.set(p, {strokeDasharray: 1, strokeDashoffset: 1});
      loops.push(gsap.timeline({repeat: -1, repeatDelay: 1.2}).to(p, {strokeDashoffset: 0, duration: 1, ease: 'power1.inOut'}).to({}, {duration: 1.2}).to(p, {opacity: 0, duration: .3}).set(p, {strokeDashoffset: 1, opacity: 1}));
    });
    $$('.motif-underline .uline').forEach(function (p) {
      gsap.set(p, {strokeDasharray: 1, strokeDashoffset: 1});
      loops.push(gsap.timeline({repeat: -1, repeatDelay: 1.2}).to(p, {strokeDashoffset: 0, duration: .6, ease: 'power2.out'}).to({}, {duration: 1.6}).to(p, {opacity: 0, duration: .3}).set(p, {strokeDashoffset: 1, opacity: 1}));
    });
    $$('.motif-paper').forEach(function (m) {
      var yld = m.querySelector('.yld'), dot = m.querySelector('.dot'), lns = m.querySelectorAll('.ln'),
          heads = m.querySelectorAll('.head'), nums = m.querySelectorAll('.num');
      gsap.set(yld, {strokeDasharray: 1, strokeDashoffset: 1});
      var tl = gsap.timeline({repeat: -1, repeatDelay: 2.2});
      tl.fromTo(heads, {opacity: 0, y: 6}, {opacity: 1, y: 0, duration: .5, stagger: .12, ease: 'power2.out'});
      tl.fromTo(lns, {scaleX: 0, transformOrigin: 'left center'}, {scaleX: 1, duration: .35, stagger: .05, ease: 'power1.out'}, '<.2');
      tl.fromTo(dot, {opacity: 0}, {opacity: 0, duration: .01}, 0);
      tl.to(yld, {strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut'}, '<');
      tl.to(dot, {opacity: 1, duration: .2}, '>-.1');
      nums.forEach(function (n) {
        var base = parseFloat(n.getAttribute('data-base')), unit = n.getAttribute('data-unit') || '',
            dec = n.hasAttribute('data-dec') ? +n.getAttribute('data-dec') : 2, o = {v: base - (dec ? .06 : 3)};
        tl.to(o, {v: base, duration: 1.2, ease: 'power2.out', onUpdate: function () { n.textContent = o.v.toFixed(dec) + unit; }}, 0.6);
      });
      tl.to({}, {duration: 1.6});
      tl.to([heads, lns, yld, dot], {opacity: 0, duration: .4});
      tl.set(lns, {scaleX: 0}); tl.set(lns, {opacity: .28}); tl.set(yld, {strokeDashoffset: 1}); tl.set(yld, {opacity: 1});
      loops.push(tl);
    });
    $$('.motif-final').forEach(function (m) {
      // The week prints. A playhead runs Monday to Friday drawing the week's line from the prior Friday's close;
      // each day darkens as it passes; Friday's column inks in, the last print lands, CLOSE is stamped. Then
      // the news fades off the sheet, resets while it's invisible and prints again: no cut, no jump back.
      var press = $('.press', m), yld = $('.yld', m), dot = $('.dot', m), fri = $('.fri', m), ph = $('.ph', m),
          head = $('.head', m), days = $$('.day', m), stamp = $('.lpstamp', m), em = $('.em', m), x0 = 40, x1 = 328;
      var st = {x: x0};
      var put = function () { ph.setAttribute('transform', 'translate(' + (st.x - x0).toFixed(1) + ' 0)'); };
      gsap.set(press, {opacity: 0});
      gsap.set(yld, {strokeDasharray: 1, strokeDashoffset: 1});
      gsap.set(fri, {scaleY: 0, transformOrigin: '50% 100%'});
      gsap.set(dot, {opacity: 0, scale: 0, transformOrigin: '50% 50%'});
      gsap.set(stamp, {opacity: 0});
      gsap.set(days, {opacity: .3});
      gsap.set(em, {opacity: .25});
      var tl = gsap.timeline({repeat: -1});
      tl.set(st, {x: x0}); tl.call(put);
      tl.to(press, {opacity: 1, duration: .45, ease: 'power1.out'});
      tl.fromTo(head, {y: 6}, {y: 0, duration: .45, ease: 'power2.out'}, '<');
      tl.set(ph, {opacity: 1});
      tl.to(st, {x: x1, duration: 2.6, ease: 'none', onUpdate: put});
      tl.to(yld, {strokeDashoffset: 0, duration: 2.6, ease: 'none'}, '<');
      days.forEach(function (d, i) { tl.to(d, {opacity: 1, duration: .2}, '<' + (i ? .58 : .29)); });
      tl.to(fri, {scaleY: 1, duration: .5, ease: 'power2.out'}, '>-.05');
      tl.to(ph, {opacity: 0, duration: .25}, '<');
      tl.to(dot, {opacity: 1, scale: 1, duration: .3, ease: 'back.out(3)'}, '<.2');
      tl.to(em, {opacity: 1, duration: .2}, '<');
      tl.fromTo(stamp, {opacity: 0, scale: 1.7, transformOrigin: '50% 50%'}, {opacity: 1, scale: 1, duration: .3, ease: 'power4.in'}, '+=.25');
      tl.fromTo(m, {x: 0}, {x: -2, duration: .05, yoyo: true, repeat: 3, immediateRender: false}, '>-.02');
      tl.to({}, {duration: 2.4});
      tl.to([press, em], {opacity: function (i) { return i ? .25 : 0; }, duration: .55, ease: 'power1.in'});
      tl.set(yld, {strokeDashoffset: 1}); tl.set(fri, {scaleY: 0}); tl.set(dot, {opacity: 0, scale: 0});
      tl.set(stamp, {opacity: 0}); tl.set(days, {opacity: .3}); tl.set(ph, {opacity: 0});
      tl.to({}, {duration: .5});
      loops.push(tl);
    });
    $$('.motif-matrix').forEach(function (m) {
      // Noise into signal. A grid of glyphs churns; each loop a scan passes top to bottom and the
      // characters under it lock in to spell the message, white on the display; the rest dims to noise.
      var g = $('.cells', m), scan = $('.scan', m);
      while (g.firstChild) g.removeChild(g.firstChild);   // the still version above is replaced by the live one
      var cols = +m.getAttribute('data-cols') || 18, lines = +m.getAttribute('data-lines') || 8;
      var msg = (m.getAttribute('data-rows') || '').split('|');
      var x0 = 16, y0 = 16, w = 368, h = 268, cw = w / cols, chh = h / lines;
      var glyphs = '01<>{}[]/|=+-*#%&@$:;.ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
      var cells = [], target = [], rowsAt = [0, 1, 3, 4, 6];
      for (var r = 0; r < lines; r++) {
        var line = rowsAt.indexOf(r) > -1 ? (msg[rowsAt.indexOf(r)] || '') : '';
        var start = Math.floor((cols - line.length) / 2);
        for (var c = 0; c < cols; c++) {
          var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          t.setAttribute('x', (x0 + cw * (c + .5)).toFixed(1)); t.setAttribute('y', (y0 + chh * (r + .72)).toFixed(1));
          t.setAttribute('text-anchor', 'middle');
          var ch = (c >= start && c < start + line.length) ? line[c - start] : '';
          target.push(ch); cells.push(t); g.appendChild(t);
          if (ch && ch !== ' ') { t.textContent = ch; t.setAttribute('class', 'cell on'); }
          else if (ch === ' ') { t.textContent = ''; t.setAttribute('class', 'cell'); }
          else { t.textContent = glyphs[Math.floor(Math.random() * glyphs.length)]; t.setAttribute('class', 'cell'); }
        }
      }
      var locked = cells.map(function () { return false; }), live = false;
      gsap.ticker.add(function () {
        if (!live) return;
        for (var i = 0; i < 7; i++) {
          var k = Math.floor(Math.random() * cells.length);
          if (!locked[k]) cells[k].textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
        }
      });
      var st = {y: 0}, lit = [];
      cells.forEach(function (t, k) { if (target[k] && target[k] !== ' ') lit.push(k); });
      var tl = gsap.timeline({repeat: -1, repeatDelay: 3});
      // dissolve: the lit glyphs let go in a random order, each turning back into noise
      tl.call(function () {
        live = true;
        var order = lit.slice().sort(function () { return Math.random() - .5; });
        order.forEach(function (k, i) { setTimeout(function () { locked[k] = false; cells[k].setAttribute('class', 'cell'); cells[k].textContent = glyphs[Math.floor(Math.random() * glyphs.length)]; }, i * (1300 / order.length)); });
        for (var k = 0; k < cells.length; k++) if (lit.indexOf(k) < 0) { locked[k] = false; if (target[k] === ' ') cells[k].textContent = glyphs[Math.floor(Math.random() * glyphs.length)]; }
      });
      tl.to({}, {duration: 2.4});
      tl.set(st, {y: y0 - 40});
      tl.set(scan, {opacity: .26});
      tl.to(st, {y: y0 + h, duration: 2.2, ease: 'none', onUpdate: function () {
        scan.setAttribute('y', st.y);
        var row = Math.floor((st.y + 40 - y0) / chh);
        for (var k = 0; k < cells.length; k++) {
          if (Math.floor(k / cols) <= row && !locked[k]) {
            locked[k] = true;
            var ch = target[k];
            if (ch && ch !== ' ') { cells[k].textContent = ch; cells[k].setAttribute('class', 'cell hot'); (function (t) { setTimeout(function () { t.setAttribute('class', 'cell on'); }, 260); })(cells[k]); }
            else if (ch === ' ') { cells[k].textContent = ''; }
          }
        }
      }});
      tl.set(scan, {opacity: 0});
      tl.call(function () { live = false; });
      loops.push(tl);
    });
    $$('.motif-progress .prog').forEach(function (p) {
      loops.push(gsap.timeline({repeat: -1, repeatDelay: .4}).fromTo(p, {attr: {width: 31}}, {attr: {width: 193}, duration: 1.1, ease: 'power1.inOut'}).to(p, {attr: {width: 243}, duration: .9, ease: 'power1.inOut'}).to(p, {attr: {width: 312}, duration: .5, ease: 'power3.out'}).to({}, {duration: 1.2}).to(p, {opacity: 0, duration: .35}).set(p, {attr: {width: 31}}).to(p, {opacity: 1, duration: .35}));
    });
    $$('.motif-moon .moon').forEach(function (m) {
      loops.push(gsap.timeline({repeat: -1, repeatDelay: 1.2}).fromTo(m, {y: 70, opacity: 0}, {y: 0, opacity: 1, duration: 1.4, ease: 'power2.out'}).to({}, {duration: 1.4}).to(m, {y: -20, opacity: 0, duration: .8, ease: 'power2.in'}));
    });
    var all = function (f) { loops.forEach(function (x) { x[f](); }); };
    ScrollTrigger.create({trigger: eds, start: 'top bottom', end: 'bottom top',
      onEnter: function () { all('play'); }, onLeave: function () { all('pause'); },
      onEnterBack: function () { all('play'); }, onLeaveBack: function () { all('pause'); }});
  }

  /* ---------- rows and heads rise in ---------- */
  $$('.latest-home .row, .shead, .latest-home .top, .how-home h2, .how-home .hm-lede, .step').forEach(function (el) {
    gsap.from(el, {y: 28, opacity: 0, duration: .5, ease: 'power3.out', scrollTrigger: {trigger: el, start: 'top 100%'}});
  });

  /* ---------- the ledger counts up ---------- */
  var cnt = $('#count');
  if (cnt) {
    // the true total is in the page from the start; the count-up begins only once the number is fully in view and settles in under a second
    ScrollTrigger.create({trigger: '.count', start: 'bottom 100%', once: true, onEnter: function () {
      var o = {v: 0}, to = +cnt.getAttribute('data-to');
      gsap.to(o, {v: to, duration: .9, ease: 'power3.out', onUpdate: function () { cnt.textContent = Math.round(o.v).toLocaleString('en-US'); }});
      gsap.to('.hm-bar div', {scaleX: 1, duration: .9, ease: 'power3.inOut', stagger: .1});
    }});
  }

  /* ---------- the close: the pigeon walks in, the words rise, the stamp lands ---------- */
  var st = $('#stampimg');
  if (st) {
    gsap.set(st, {opacity: 0, scale: 2.2, rotate: -24});
    gsap.from('#walker', {x: -160, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: {trigger: '.close-home', start: 'top 90%'}});
    gsap.from('.close-home h2 .w', {yPercent: 100, opacity: 0, duration: .6, stagger: .05, ease: 'power4.out', scrollTrigger: {trigger: '.close-home h2', start: 'top 100%'}});
    ScrollTrigger.create({trigger: '.close-home h2', start: 'top 85%', once: true, onEnter: function () {
      gsap.to(st, {opacity: 1, scale: 1, rotate: -12, duration: .3, ease: 'power4.in', delay: .4, onComplete: function () {
        gsap.fromTo('.close-home h2', {x: -4}, {x: 0, duration: .06, repeat: 3, yoyo: true});
      }});
    }});
  }
})();
