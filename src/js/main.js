(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // One failing module must never take the rest of the page down with it.
  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.warn('[' + name + ']', e); } }
  // Runs fn once when el is on screen. IntersectionObserver does the work; a
  // scroll check backs it up, because an instant jump (anchor link, back-to-top)
  // can skip past an element without the observer ever reporting it.
  function onView(el, fn, threshold) {
    if (!el) return;
    var done = false, io = null;
    function go() {
      if (done) return;
      done = true;
      if (io) io.disconnect();
      window.removeEventListener('scroll', check);
      fn();
    }
    function check() {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.85 && r.bottom > window.innerHeight * 0.15) go();
    }
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) go(); }, { threshold: threshold || 0.25 });
      io.observe(el);
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  }
  function stamp() { var d = new Date(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (n) { return (n < 10 ? '0' : '') + n; }).join(':'); }
  function jumpTop() {
    window.scrollTo({ top: 0, behavior: 'instant' });
    var logo = $('.head__logo');
    if (logo) logo.focus({ preventScroll: true });
  }

  /* ================= scroll progress bar + back-to-top ================= */
  safe('progress', function () {
    var bar = $('[data-progress]');
    var btn = $('[data-totop]');
    var hero = $('.hero');
    var raf = 0;
    function upd() {
      raf = 0;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      btn.style.setProperty('--p', (p * 100).toFixed(1));
      btn.classList.toggle('is-on', window.scrollY > hero.offsetHeight);
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    window.addEventListener('resize', upd);
    upd();
    btn.addEventListener('click', jumpTop);
    $$('[data-top]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); jumpTop(); }); });
    $$('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
  });

  /* ================= custom cursor (fine pointers, motion allowed) ================= */
  safe('cursor', function () {
    if (!fine || reduce) return;
    var root = $('[data-cursor-root]');
    var dot = $('.cursor__dot', root);
    var ring = $('.cursor__ring', root);
    var label = $('[data-cursor-label]', root);
    var x = -100, y = -100, rx = -100, ry = -100, running = false;
    document.documentElement.classList.add('has-cursor');
    function loop() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) requestAnimationFrame(loop); else running = false;
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      root.style.opacity = '';
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      var text = t.closest('input:not([type="range"]), textarea, select');
      var lab = t.closest('[data-cursor]');
      var hov = t.closest('a, button, [role="button"], [role="tab"], label, .pillar, .person, input[type="range"]');
      root.classList.toggle('is-text', !!text);
      root.classList.toggle('is-label', !!lab && !text);
      root.classList.toggle('is-hover', !!hov && !lab && !text);
      label.textContent = lab ? lab.getAttribute('data-cursor') : '';
    });
    document.addEventListener('mouseleave', function () { root.style.opacity = '0'; });
  });

  /* ================= magnetic buttons ================= */
  safe('magnetic', function () {
    if (!fine || reduce) return;
    $$('.btn--mag').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width;
        var dy = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = 'translate(' + (dx * 10).toFixed(1) + 'px,' + (dy * 8).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  });

  /* ================= header: solid on scroll, hide on scroll down, scrollspy, menu ================= */
  safe('header', function () {
    var head = $('#head');
    var nav = $('[data-nav]');
    var bar = $('[data-nav-bar]');
    var links = $$('[data-spy]');
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('data-spy')); });
    var burger = $('[data-burger]');
    var menu = $('#mmenu');
    var lastY = window.scrollY, active = null, raf = 0;

    function moveBar(a) {
      if (!a) { bar.style.opacity = '0'; return; }
      bar.style.opacity = '1';
      bar.style.width = a.offsetWidth - 28 + 'px';
      bar.style.transform = 'translateX(' + (a.offsetLeft + 14) + 'px)';
    }
    links.forEach(function (a) {
      a.addEventListener('mouseenter', function () { moveBar(a); });
      a.addEventListener('focus', function () { moveBar(a); });
    });
    nav.addEventListener('mouseleave', function () { moveBar(active); });

    function onScroll() {
      raf = 0;
      var y = window.scrollY;
      head.classList.toggle('is-solid', y > 40);
      var menuOpen = !menu.hidden;
      if (!menuOpen && !head.contains(document.activeElement) && y > 400 && y - lastY > 6) head.classList.add('is-hidden');
      else if (lastY - y > 6 || y < 400) head.classList.remove('is-hidden');
      lastY = y;
      var line = window.innerHeight * 0.35, cur = null;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line && t.getBoundingClientRect().bottom > line) cur = links[i]; });
      if (cur !== active) {
        links.forEach(function (a) { a.classList.toggle('is-active', a === cur); if (a === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        active = cur;
        if (!nav.matches(':hover')) moveBar(active);
      }
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(onScroll); }, { passive: true });
    head.addEventListener('focusin', function () { head.classList.remove('is-hidden'); });
    onScroll();

    function setMenu(open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', open);
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) {
        menu.hidden = false;
        head.classList.remove('is-hidden');
        requestAnimationFrame(function () { menu.classList.add('is-in'); });
        $('a', menu).focus({ preventScroll: true });
      } else {
        menu.classList.remove('is-in');
        menu.hidden = true;
      }
    }
    burger.addEventListener('click', function () { setMenu(menu.hidden); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1023 && !menu.hidden) setMenu(false); moveBar(active); });
  });

  /* ================= scroll reveal + count-ups =================
     Content is only hidden once this module opts in (.js-reveal). Anything
     already above the fold line is revealed on every scroll pass too, so an
     anchor jump never leaves a section blank. */
  safe('reveal', function () {
    var auto = '.hub, .sol, .dens, .cmp__row, .ovc, .rmap__main, .quiz, .ways, .founders, .post, .faq, .contact__form, .contact__info, .foot__brand';
    $$(auto).forEach(function (el) { el.classList.add('rv'); });
    // Stagger siblings that share a parent.
    $$('.cmp__row, .post, .faq, .tile, .pillar').forEach(function (el) {
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--rd', Math.min(i, 6) * 0.06 + 's');
    });
    var els = $$('.rv');
    function show(el) { el.classList.add('is-in'); }
    if (reduce) { els.forEach(show); return; }
    document.documentElement.classList.add('js-reveal');
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting || e.boundingClientRect.top < 0) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;
    els.forEach(function (el) { if (io) io.observe(el); else show(el); });
    var raf = 0;
    window.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var line = window.innerHeight * 0.9;
        els.forEach(function (el) { if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < line) show(el); });
      });
    }, { passive: true });
  });

  safe('counters', function () {
    if (reduce) return;
    $$('[data-count]').forEach(function (el) {
      var end = parseInt(el.getAttribute('data-count'), 10);
      onView(el, function () {
        var t0 = performance.now(), dur = 900;
        el.textContent = '0';
        (function step(t) {
          var p = Math.max(0, Math.min(1, (t - t0) / dur));
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        })(t0);
        // Background tabs barely tick rAF: land on the real value regardless.
        setTimeout(function () { el.textContent = end; }, dur + 150);
      }, 0.6);
    });
  });

  /* ================= hero: reactive dot grid ================= */
  safe('hero-grid', function () {
    var c = $('[data-hero-grid]');
    var ctx = c.getContext('2d');
    var hero = c.parentNode;
    var mx = -999, my = -999, w = 0, h = 0, dpr = 1, raf = 0;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.offsetWidth; h = hero.offsetHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    function draw() {
      raf = 0;
      ctx.clearRect(0, 0, w, h);
      var gap = 26;
      for (var x = gap / 2; x < w; x += gap) {
        for (var y = gap / 2; y < h; y += gap) {
          var dx = x - mx, dy = y - my, d = Math.sqrt(dx * dx + dy * dy);
          var k = Math.max(0, 1 - d / 170);
          var ox = k ? -dx / d * k * 6 : 0, oy = k ? -dy / d * k * 6 : 0;
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, 1 + k * 1.6, 0, 6.283);
          ctx.fillStyle = k ? 'rgba(49,153,204,' + (0.18 + k * 0.7).toFixed(2) + ')' : 'rgba(5,10,20,.09)';
          ctx.fill();
        }
      }
    }
    if (!reduce && fine) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
        if (!raf) raf = requestAnimationFrame(draw);
      });
      hero.addEventListener('pointerleave', function () { mx = my = -999; if (!raf) raf = requestAnimationFrame(draw); });
    }
    window.addEventListener('resize', size);
    size();
  });

  /* ================= hero console: typed questions, answers, sparklines ================= */
  safe('console', function () {
    var root = $('[data-console]');
    var typed = $('[data-typed]', root);
    var text = $('[data-answer-text]', root);
    var chips = $$('.qchip', root);
    var Q = chips.map(function (b) { return b.textContent; });
    var A = [
      'Three hosts in cluster A are close to their memory limit. host-07 is the tightest. Suggested fix: move two workloads to cluster B.',
      'Latency on pool B rose after two write-heavy workloads landed on the same pool. Suggested fix: move one to pool C in the next change window.',
      'One change on segment B in the last 24 hours: a firewall rule edited by net.admin at 08:40. No related alerts since then.'
    ];
    var i = 0, timer = 0, paused = false;
    function show(n) {
      i = n;
      chips.forEach(function (b, k) { b.classList.toggle('is-on', k === n); b.setAttribute('aria-pressed', k === n ? 'true' : 'false'); });
      text.style.opacity = '0';
      setTimeout(function () { text.textContent = A[n]; text.style.opacity = '1'; }, 200);
    }
    function type(n) {
      var q = Q[n], k = 0;
      typed.textContent = '';
      clearTimeout(timer);
      (function step() {
        typed.textContent = q.slice(0, ++k);
        if (k < q.length) timer = setTimeout(step, 38);
        else { show(n); timer = setTimeout(function () { if (!paused) type((n + 1) % Q.length); }, 4200); }
      })();
    }
    chips.forEach(function (b, n) {
      b.addEventListener('click', function () {
        clearTimeout(timer);
        paused = true;
        typed.textContent = Q[n];
        show(n);
        timer = setTimeout(function () { paused = false; type((n + 1) % Q.length); }, 9000);
      });
    });
    typed.textContent = Q[0];
    if (!reduce) onView(root, function () { timer = setTimeout(function () { type(1); }, 2600); });

    var lines = $$('[data-spark]', root);
    var series = lines.map(function () { var a = [], v = 12; for (var k = 0; k < 24; k++) { v = Math.max(3, Math.min(21, v + (Math.random() - 0.5) * 6)); a.push(v); } return a; });
    function render() {
      lines.forEach(function (pl, n) {
        pl.setAttribute('points', series[n].map(function (v, k) { return (k * 100 / 23).toFixed(1) + ',' + v.toFixed(1); }).join(' '));
      });
    }
    render();
    if (!reduce) {
      var visible = true;
      if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(root);
      setInterval(function () {
        if (!visible || document.hidden) return;
        series.forEach(function (a, n) { var v = a[a.length - 1] + (Math.random() - 0.5) * (n === 2 ? 9 : 5); a.shift(); a.push(Math.max(3, Math.min(21, v))); });
        render();
      }, 1100);
    }
  });

  /* Types text into el; returns a function that cancels it. Instant with reduced motion. */
  function typer(el, text, speed, done) {
    var k = 0, t = 0;
    if (reduce) { el.textContent = text; if (done) done(); return function () {}; }
    el.classList.add('is-typing');
    (function step() {
      el.textContent = text.slice(0, ++k);
      if (k < text.length) t = setTimeout(step, speed);
      else { el.classList.remove('is-typing'); if (done) done(); }
    })();
    return function () { clearTimeout(t); el.classList.remove('is-typing'); };
  }

  /* ARIA tab pattern shared by solutions and the roadmap. */
  function tabs(root, tabSel, onChange) {
    var list = $$(tabSel, root);
    var panels = list.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function go(i, focus, auto) {
      list.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        panels[k].hidden = !on;
        panels[k].classList.toggle('is-on', on);
      });
      if (focus) list[i].focus();
      if (onChange) onChange(i, list[i], auto);
    }
    list.forEach(function (t, k) {
      t.addEventListener('click', function () { go(k); });
      t.addEventListener('keydown', function (e) {
        var n = list.length, to = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (k + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (k - 1 + n) % n;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); go(to, true); }
      });
    });
    return go;
  }

  /* ================= problem: one question, two ways ================= */
  safe('problem', function () {
    var root = $('[data-qa]');
    var chips = $$('[data-qa-q]', root);
    var tabsEl = $$('[data-qa-tab]', root);
    var without = $('[data-qa-without]', root);
    var half = $('[data-qa-half]', root);
    var cons = $('[data-qa-cons]', root);
    var steps = $('[data-qa-steps]', root);
    var steps2 = $('[data-qa-steps2]', root);
    var typed = $('[data-qa-typed]', root);
    var withEl = $('[data-qa-with]', root);
    var end = $('[data-qa-end]', root);
    var M = ['compute', 'network', 'storage', 'security'];
    var LABEL = { compute: 'Compute', network: 'Network', storage: 'Storage', security: 'Security' };
    // Illustrative data. Host names, pools and times are made up for the demo.
    var Q = [
      {
        q: 'Why is the payroll VM slow?',
        without: ['payroll-vm-02: CPU and memory look normal', 'Segment A: no packet loss', 'Pool B: write latency high. No VM mapping in this tool', 'No blocked traffic for this VM'],
        half: 'Storage looks busy, but nothing links it to the payroll VM. Next step: open a ticket with the storage team and wait.',
        withLines: [['compute', 'payroll-vm-02 runs on host-14. CPU and memory are normal.'], ['storage', 'Its disks sit on pool B, where write latency rose sharply after 09:10.'], ['network', 'No loss or saturation on its segment.'], ['security', 'No access or policy changes on this VM today.']],
        end: 'Likely cause: write contention on pool B. Suggested fix: move one write-heavy workload to pool C.'
      },
      {
        q: 'Which hosts are near capacity?',
        without: ['Export the host list, sort by memory by hand', 'Uplink use per rack: normal', 'Pool capacity is in a separate report, with different host names', 'Session expired. Sign in again'],
        half: 'You have a memory list and a storage report that name the same hosts differently. Matching them is a spreadsheet job.',
        withLines: [['compute', 'host-07 and host-09 are close to their memory limit.'], ['storage', 'Both use pool A, which still has room.'], ['network', 'Uplinks on their rack are fine.'], ['security', 'No placement policy stops VMs moving off them.']],
        end: 'Three VMs can move from host-07 to host-11 within policy. Suggested fix ready for approval.'
      },
      {
        q: 'What changed before the outage?',
        without: ['VM restarts at 08:52. Reason not logged here', 'Config change at 08:40. Author is in another tool', 'No storage events in the window', 'svc-deploy signed in at 07:39 UTC (different time zone here)'],
        half: 'Three events in three tools with two time formats. Probably related. Not proven.',
        withLines: [['security', 'svc-deploy signed in at 08:39.'], ['network', 'At 08:40 it edited firewall rule fw-22 outside any change window.'], ['compute', 'At 08:52 two VMs lost their connection and restarted.'], ['storage', 'No storage events in that window.']],
        end: 'Likely cause: the fw-22 change at 08:40. Suggested fix: revert it to the last approved rule.'
      }
    ];
    var run = 0, stopType = function () {};
    function later(id, ms, fn) { setTimeout(function () { if (id === run) fn(); }, reduce ? 0 : ms); }
    function play(n) {
      var id = ++run, d = Q[n], s = 0;
      stopType();
      chips.forEach(function (c, k) { c.setAttribute('aria-pressed', k === n ? 'true' : 'false'); });
      tabsEl.forEach(function (t) { t.classList.remove('is-open', 'is-cur'); });
      without.innerHTML = ''; withEl.innerHTML = '';
      half.hidden = true; end.hidden = true;
      cons.textContent = '0'; steps.textContent = '0'; steps2.textContent = '0'; typed.textContent = '';
      // Without: one console after another.
      d.without.forEach(function (line, i) {
        later(id, 300 + i * 1100, function () {
          tabsEl.forEach(function (t, k) { t.classList.toggle('is-cur', k === i); if (k <= i) t.classList.add('is-open'); });
          cons.textContent = i + 1;
          s += 2; steps.textContent = s;
        });
        later(id, 800 + i * 1100, function () {
          var li = document.createElement('li');
          li.style.setProperty('--m', 'var(--m-' + M[i] + ')');
          li.innerHTML = '<span class="mono">' + M[i] + '</span><span></span>';
          li.lastChild.textContent = line;
          without.appendChild(li);
          s += 1; steps.textContent = s;
        });
      });
      later(id, 300 + 4 * 1100, function () {
        half.innerHTML = '<strong>Half an answer</strong>';
        half.appendChild(document.createTextNode(d.half));
        half.hidden = false;
        steps.textContent = s + 1;
      });
      // With: one question, one connected answer.
      stopType = typer(typed, d.q, 32, function () {
        if (id !== run) return;
        steps2.textContent = '1';
        d.withLines.forEach(function (l, i) {
          later(id, 400 + i * 550, function () {
            var li = document.createElement('li');
            li.innerHTML = '<span class="mtag mtag--' + l[0] + '" style="--m:var(--m-' + l[0] + ')">' + LABEL[l[0]] + '</span><span></span>';
            li.lastChild.textContent = l[1];
            withEl.appendChild(li);
          });
        });
        later(id, 400 + 4 * 550, function () {
          end.textContent = d.end;
          var need = document.createElement('span');
          need.textContent = 'Waiting for operator approval';
          end.appendChild(need);
          end.hidden = false;
          steps2.textContent = '2';
        });
      });
    }
    chips.forEach(function (c, n) { c.addEventListener('click', function () { play(n); }); });
    onView(root, function () { play(0); }, 0.35);

    // Stat tiles: tap or Enter toggles the detail on touch and keyboard.
    $$('.tile').forEach(function (t) {
      function toggle() { t.classList.toggle('is-open'); }
      t.addEventListener('click', toggle);
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  });

  /* ================= hub: radial modules, packets, rich panel ================= */
  safe('hub', function () {
    var hub = $('[data-hub]');
    var stage = $('.hub__stage', hub);
    var svg = $('.hub__lines', hub);
    var gPaths = $('[data-hub-paths]', hub);
    var gPk = $('[data-hub-packets]', hub);
    var nodes = $$('.hnode', hub);
    var items = $$('[data-hub-item]', hub);
    var NS = 'http://www.w3.org/2000/svg';
    var paths = [], packets = [], cur = 0, hover = false, inView = false, stopType = function () {};
    nodes.forEach(function (n, i) {
      var x = parseFloat(n.style.getPropertyValue('--x')) * 6, y = parseFloat(n.style.getPropertyValue('--y')) * 6;
      var mx = (x + 300) / 2, my = (y + 300) / 2, dx = 300 - x, dy = 300 - y, len = Math.sqrt(dx * dx + dy * dy);
      var cx = mx + (-dy / len) * 46, cy = my + (dx / len) * 46;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' 300 300');
      p.setAttribute('class', 'wire');
      gPaths.appendChild(p);
      paths.push({ el: p, len: p.getTotalLength() });
      for (var k = 0; k < 2; k++) {
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('r', '4');
        c.setAttribute('class', 'packet');
        gPk.appendChild(c);
        packets.push({ el: c, path: i, t: k / 2 + Math.random() * 0.2 });
      }
    });
    function place() {
      packets.forEach(function (pk) {
        var pa = paths[pk.path], pt = pa.el.getPointAtLength(pa.len * pk.t);
        pk.el.setAttribute('cx', pt.x.toFixed(1));
        pk.el.setAttribute('cy', pt.y.toFixed(1));
      });
    }
    place();
    var last = 0;
    function loop(ts) {
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      if (inView && !document.hidden && getComputedStyle(svg).display !== 'none') {
        packets.forEach(function (pk) { pk.t = (pk.t + dt * (pk.path === cur ? 0.55 : 0.16)) % 1; });
        place();
      }
      requestAnimationFrame(loop);
    }
    if (!reduce) requestAnimationFrame(loop);

    // Mini sparklines on the nodes.
    var sparks = $$('[data-hub-spark]', hub);
    var series = sparks.map(function () { var a = [], v = 8; for (var k = 0; k < 16; k++) { v = Math.max(2, Math.min(14, v + (Math.random() - 0.5) * 5)); a.push(v); } return a; });
    function drawSparks() { sparks.forEach(function (pl, n) { pl.setAttribute('points', series[n].map(function (v, k) { return (k * 4).toFixed(1) + ',' + v.toFixed(1); }).join(' ')); }); }
    drawSparks();
    if (!reduce) setInterval(function () {
      if (!inView || document.hidden) return;
      series.forEach(function (a) { var v = a[a.length - 1] + (Math.random() - 0.5) * 5; a.shift(); a.push(Math.max(2, Math.min(14, v))); });
      drawSparks();
    }, 1200);

    function set(i, focus) {
      cur = (i + nodes.length) % nodes.length;
      hub.classList.add('has-active');
      nodes.forEach(function (n, k) {
        var on = k === cur;
        n.setAttribute('aria-pressed', on ? 'true' : 'false');
        n.setAttribute('tabindex', on ? '0' : '-1');
        paths[k].el.classList.toggle('is-on', on);
        items[k].hidden = !on;
        items[k].classList.toggle('is-on', on);
      });
      packets.forEach(function (pk) { pk.el.classList.toggle('is-on', pk.path === cur); pk.el.classList.toggle('is-dim', pk.path !== cur); });
      stopType();
      var a = $('[data-ask]', items[cur]);
      a.textContent = '';
      stopType = typer(a, a.getAttribute('data-ask'), 18);
      // Keep the active node in view in the mobile strip without moving the page.
      var strip = nodes[cur].parentNode;
      if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: nodes[cur].offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
      if (focus) nodes[cur].focus();
    }
    nodes.forEach(function (n, k) {
      n.addEventListener('mouseenter', function () { if (cur !== k) set(k); });
      n.addEventListener('click', function () { set(k); });
      n.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); set(cur + 1, true); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); set(cur - 1, true); }
        else if (e.key === 'Home') { e.preventDefault(); set(0, true); }
        else if (e.key === 'End') { e.preventDefault(); set(nodes.length - 1, true); }
      });
    });
    hub.addEventListener('mouseenter', function () { hover = true; });
    hub.addEventListener('mouseleave', function () { hover = false; });
    hub.addEventListener('focusin', function () { hover = true; });
    hub.addEventListener('focusout', function (e) { if (!hub.contains(e.relatedTarget)) hover = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }).observe(stage);
    else inView = true;
    set(0);
    if (!reduce) setInterval(function () { if (inView && !hover && !document.hidden) set(cur + 1); }, 4000);
  });

  /* ================= solutions: auto-advancing selectors, before/after, live visuals ================= */
  safe('solutions', function () {
    var sol = $('[data-sol]');
    var sels = $$('.selr', sol);
    var inView = false;
    var go = tabs(sol, '.selr', function (i, t) {
      sels.forEach(function (s) { s.classList.remove('is-running'); });
      if (!reduce) { void t.offsetWidth; t.classList.add('is-running'); }
      nudge($('[data-ba]', document.getElementById(t.getAttribute('aria-controls'))));
    });
    // The active bar fills over 6s; when it finishes, move to the next environment.
    sels.forEach(function (s, k) {
      $('.selr__bar i', s).addEventListener('animationend', function () { if (s.classList.contains('is-running')) go((k + 1) % sels.length, false, true); });
    });
    function pause(on) { sol.classList.toggle('is-paused', on || !inView); }
    sol.addEventListener('mouseenter', function () { pause(true); });
    sol.addEventListener('mouseleave', function () { pause(false); });
    sol.addEventListener('focusin', function () { pause(true); });
    sol.addEventListener('focusout', function (e) { if (!sol.contains(e.relatedTarget)) pause(false); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { inView = e[0].isIntersecting; pause(sol.matches(':hover') || sol.contains(document.activeElement)); }).observe(sol);

    // Before/after drag slider.
    function setPos(ba, v) {
      v = Math.max(0, Math.min(100, v));
      ba.style.setProperty('--pos', v + '%');
      $('.ba__handle', ba).setAttribute('aria-valuenow', Math.round(v));
      $('.ba__handle', ba).setAttribute('aria-valuetext', v > 50 ? 'Showing mostly what Synaptix does' : 'Showing mostly the challenge');
    }
    function nudge(ba) {
      if (!ba || ba.dataset.nudged) return;
      ba.dataset.nudged = '1';
      if (reduce) { setPos(ba, 55); return; }
      var t0 = performance.now();
      (function step(t) {
        // rAF timestamps can be slightly older than performance.now(), so clamp at 0.
        var p = Math.max(0, Math.min(1, (t - t0) / 900));
        setPos(ba, 10 + 45 * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
      setTimeout(function () { setPos(ba, 55); }, 1000);
    }
    $$('[data-ba]', sol).forEach(function (ba) {
      var handle = $('.ba__handle', ba);
      setPos(ba, 10);
      function fromEvent(e) { var r = ba.getBoundingClientRect(); setPos(ba, (e.clientX - r.left) / r.width * 100); }
      ba.addEventListener('pointerdown', function (e) {
        ba.dataset.nudged = '1';
        ba.classList.add('is-drag');
        ba.setPointerCapture(e.pointerId);
        fromEvent(e);
      });
      ba.addEventListener('pointermove', function (e) { if (ba.classList.contains('is-drag')) fromEvent(e); });
      ba.addEventListener('pointerup', function () { ba.classList.remove('is-drag'); });
      ba.addEventListener('pointercancel', function () { ba.classList.remove('is-drag'); });
      handle.addEventListener('keydown', function (e) {
        var v = parseFloat(handle.getAttribute('aria-valuenow'));
        var to = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? v + 5 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? v - 5 : e.key === 'Home' ? 0 : e.key === 'End' ? 100 : null;
        if (to === null) return;
        e.preventDefault();
        ba.dataset.nudged = '1';
        setPos(ba, to);
      });
    });
    onView(sol, function () {
      nudge($('.solp.is-on [data-ba]', sol));
      if (!reduce) sels[0].classList.add('is-running');
    }, 0.3);

    // Rack view: units with tooltips. Illustrative values.
    var racks = $('[data-racks]', sol), tip = $('[data-rack-tip]', sol), n = 0;
    for (var r = 0; r < 4; r++) {
      var rack = document.createElement('div');
      rack.className = 'rack';
      for (var u = 0; u < 10; u++) {
        n++;
        var hot = n === 7 || n === 29;
        var load = hot ? 88 + (n % 7) : 30 + ((n * 37) % 45);
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'unit' + (hot ? ' is-hot' : '');
        var name = 'host-' + (n < 10 ? '0' : '') + n;
        b.setAttribute('aria-label', name + ', load ' + load + '%, ' + (hot ? 'warning: memory near limit' : 'healthy'));
        b.dataset.tip = name + ' · load ' + load + '% · ' + (hot ? 'warning: memory near limit' : 'healthy');
        rack.appendChild(b);
      }
      racks.appendChild(rack);
    }
    function showTip(b) { $$('.unit', racks).forEach(function (x) { x.classList.toggle('is-sel', x === b); }); tip.textContent = b.dataset.tip; tip.classList.add('is-on'); }
    $$('.unit', racks).forEach(function (b) {
      b.addEventListener('mouseenter', function () { showTip(b); });
      b.addEventListener('focus', function () { showTip(b); });
      b.addEventListener('click', function () { showTip(b); });
    });

    // Ownership map: hovering a branch lights its path from the root.
    var org = $('[data-org]', sol), otip = $('[data-org-tip]', sol);
    var OWN = { infra: 'Infra team: owns hosts and storage at Site 1 and Site 2.', net: 'Network: owns segments and policies for every site.', apps: 'App owners: see their workloads across the hybrid estate.', site1: 'Site 1: managed by the infra team in the same console.', site2: 'Site 2: managed by the infra team in the same console.', hybrid: 'Hybrid: app workloads in private and public cloud.' };
    $$('.org__n[data-b]', org).forEach(function (g) {
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', OWN[g.dataset.b]);
      function lit(on) {
        var ids = on ? g.dataset.p.split(' ') : [];
        $$('[data-l]', org).forEach(function (p) { p.classList.toggle('is-lit', ids.indexOf(p.dataset.l) > -1); });
        $$('.org__n[data-b]', org).forEach(function (o) { o.classList.toggle('is-lit', on && ids.indexOf(o.dataset.b) > -1); });
        otip.textContent = on ? OWN[g.dataset.b] : 'Hover a branch to trace who owns what.';
        otip.classList.toggle('is-on', on);
      }
      g.addEventListener('mouseenter', function () { lit(true); });
      g.addEventListener('mouseleave', function () { lit(false); });
      g.addEventListener('focus', function () { lit(true); });
      g.addEventListener('blur', function () { lit(false); });
      g.addEventListener('click', function () { lit(true); });
    });

    // Audit log that streams new entries while visible.
    var alog = $('[data-alog]', sol);
    var LOG = ['ops.lead approved a workload move', 'AI recommended a fix for latency', 'Role "auditor" granted read access', 'Policy "change window" updated', 'net.admin edited rule fw-22', 'Backup job verified on pool C', 'ops.lead rejected a host restart', 'Access review exported for audit'];
    var li = 0;
    function addLog(fresh) {
      var item = document.createElement('li');
      var d = new Date(Date.now() - (fresh ? 0 : (4 - li) * 7 * 60000));
      item.innerHTML = '<span class="mono">' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + '</span><span></span><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-lock"/></svg>';
      item.children[1].textContent = LOG[li % LOG.length];
      li++;
      if (fresh) item.classList.add('is-new');
      alog.insertBefore(item, alog.firstChild);
      while (alog.children.length > 6) alog.removeChild(alog.lastChild);
    }
    for (var k = 0; k < 4; k++) addLog(false);
    if (!reduce) setInterval(function () {
      if (inView && !document.hidden && !document.getElementById('pan-reg').hidden && !sol.classList.contains('is-paused')) addLog(true);
    }, 2600);

    // Edge map: sites ping the core; hover or focus shows the site status.
    var edge = $('[data-edge]', sol), etip = $('[data-edge-tip]', sol);
    if (reduce && edge.pauseAnimations) edge.pauseAnimations();
    $$('[data-site]', edge).forEach(function (g) {
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', g.dataset.site);
      function show() { etip.textContent = g.dataset.site; etip.classList.add('is-on'); }
      g.addEventListener('mouseenter', show);
      g.addEventListener('focus', show);
      g.addEventListener('click', show);
    });
  });

  /* ================= roadmap: stage cards on a scroll-driven track ================= */
  safe('roadmap', function () {
    var rmap = $('[data-rmap]');
    var view = $('[data-rmap-view]', rmap);
    var track = $('[data-rmap-track]', rmap);
    var cards = $$('.rcard', rmap);
    var over = 0, on = false;
    tabs(rmap, '.rcard');
    function setup() {
      var want = window.innerWidth >= 1024 && window.innerHeight >= 720 && !reduce;
      rmap.classList.toggle('is-scroll', want);
      rmap.style.height = '';
      over = want ? Math.max(0, track.scrollWidth - view.clientWidth) : 0;
      on = want && over > 0;
      if (!on) { rmap.classList.remove('is-scroll'); track.style.removeProperty('--tx'); return; }
      rmap.style.height = (window.innerHeight + over) + 'px';
      frame();
    }
    function frame() {
      if (!on) return;
      var p = Math.max(0, Math.min(1, -rmap.getBoundingClientRect().top / over));
      track.style.setProperty('--tx', (p * over).toFixed(1));
    }
    // Keyboard focus on a card that sits off screen scrolls the page to it.
    cards.forEach(function (c) {
      c.addEventListener('focus', function () {
        if (!on) return;
        var tx = Math.max(0, Math.min(over, c.offsetLeft - (view.clientWidth - c.offsetWidth) / 2));
        window.scrollTo({ top: window.scrollY + rmap.getBoundingClientRect().top + tx, behavior: 'instant' });
      });
    });
    var raf = 0;
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; frame(); }); }, { passive: true });
    window.addEventListener('resize', setup);
    setup();
  });

  /* ================= CoS density visualizer (illustrative model) ================= */
  safe('density', function () {
    var root = $('[data-dens]');
    var range = $('[data-dens-range]', root);
    var outN = $('[data-dens-n]', root);
    var out = $('[data-dens-out]', root);
    var hostsEl = $('[data-dens-hosts]', root);
    var modes = $$('[data-mode]', root);
    var CELLS = 12, mode = 'vm';
    // [CONFIRM] Illustrative only: VM workload = 2 work + 1 overhead cell; CoS = 2 work cells + 1 shared overhead cell per host.
    function layout() {
      if (mode === 'vm') { var n = Math.floor(CELLS / 3), a = []; for (var i = 0; i < n; i++) a.push('w', 'w', 'o'); return { per: n, cells: a }; }
      var m = Math.floor((CELLS - 1) / 2), b = ['o']; for (var j = 0; j < m; j++) b.push('w', 'w'); return { per: m, cells: b };
    }
    function render() {
      var n = +range.value, L = layout();
      outN.textContent = n;
      hostsEl.style.setProperty('--n', n);
      range.style.setProperty('--fill', ((n - 2) / 10 * 100) + '%');
      while (hostsEl.children.length < n) {
        var h = document.createElement('div'); h.className = 'host';
        for (var c = 0; c < CELLS; c++) h.appendChild(document.createElement('i'));
        hostsEl.appendChild(h);
      }
      while (hostsEl.children.length > n) hostsEl.removeChild(hostsEl.lastChild);
      $$('.host', hostsEl).forEach(function (h, hi) {
        $$('i', h).forEach(function (cell, ci) {
          // Fill from the bottom of each host up.
          var t = L.cells[CELLS - 1 - ci];
          cell.className = t === 'w' ? 'c-work' : t === 'o' ? 'c-ovh' : '';
          cell.style.setProperty('--d', reduce ? '0s' : ((hi * 0.03) + ((CELLS - ci) * 0.015)).toFixed(3) + 's');
        });
      });
      out.textContent = n * L.per;
    }
    range.addEventListener('input', render);
    modes.forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-mode');
        modes.forEach(function (o) { o.setAttribute('aria-checked', o === b ? 'true' : 'false'); });
        render();
      });
      b.addEventListener('keydown', function (e) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
        e.preventDefault();
        var other = modes[0] === b ? modes[1] : modes[0];
        other.click(); other.focus();
      });
    });
    render();
  });

  /* ================= comparison switch ================= */
  safe('compare', function () {
    var btn = $('[data-switch-btn]');
    var cmp = $('[data-cmp]');
    $$('.cmp__row', cmp).forEach(function (r, i) { r.style.setProperty('--d', (i * 0.07) + 's'); });
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-checked') !== 'true';
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
      cmp.classList.toggle('is-on', on);
    });
  });

  /* ================= oversight: three scenarios, operator decides ================= */
  safe('oversight', function () {
    var root = $('[data-ov]');
    var tabsEl = $$('[data-ov-s]', root);
    var steps = $$('[data-ov-step]', root);
    var texts = $$('[data-ov-text]', root);
    var evid = $('[data-ov-evid]', root);
    var rail = $('[data-ov-rail]', root);
    var acts = $$('[data-ov-act]', root);
    var result = $('[data-ov-result]', root);
    var title = $('[data-ov-title]', root);
    var log = $('[data-ov-log]', root);
    var body = $('#ovc-body');
    // Illustrative scenarios. Names, pools and times are made up for the demo.
    var S = [
      { name: 'Storage latency on cluster B', title: 'Incident: storage latency rising on cluster B',
        steps: ['Reading storage metrics, recent changes and workload placement for cluster B.', 'Two write-heavy workloads share pool B. Moving one spreads the load without downtime.', 'Move db-reporting to pool C in the 14:00 change window.'],
        evid: ['Metrics read: pool B latency, IOPS', 'Changes checked: last 24 hours', 'Placement: 2 write-heavy VMs on pool B'],
        action: 'Move db-reporting to pool C', ok: 'Change applied in the 14:00 window. Latency on pool B is back to normal.' },
      { name: 'Host near memory limit', title: 'Incident: host-07 close to its memory limit',
        steps: ['Reading memory use on cluster A hosts and recent placements.', 'host-07 filled up after three new VMs landed this week. host-11 has room.', 'Live-migrate two VMs from host-07 to host-11.'],
        evid: ['Metrics read: memory per host', 'Changes checked: 3 new VMs this week', 'Headroom: host-11 has the most'],
        action: 'Migrate 2 VMs from host-07 to host-11', ok: 'Migration applied in the change window. host-07 is back under its limit.' },
      { name: 'Unplanned config change', title: 'Incident: firewall rule changed outside a change window',
        steps: ['Comparing the current network config with the last approved version.', 'Rule fw-22 was opened by a service account, with no ticket and outside any change window.', 'Revert fw-22 to the last approved version and flag the account for review.'],
        evid: ['Config diff: 1 rule changed', 'Changes checked: no matching ticket', 'Access log: svc-deploy'],
        action: 'Revert fw-22 and flag svc-deploy', ok: 'Rule reverted in the change window. svc-deploy is flagged for review.' }
    ];
    var cur = 0, run = 0, stop = function () {};
    function later(id, ms, fn) { setTimeout(function () { if (id === run) fn(); }, reduce ? 0 : ms); }
    function railTo(i) { rail.style.setProperty('--rail', (i / (steps.length - 1) * 100) + '%'); }
    function start() {
      var id = ++run, s = S[cur];
      stop();
      title.textContent = s.title;
      steps.forEach(function (li) { li.classList.remove('is-cur', 'is-done'); });
      texts.forEach(function (t) { t.textContent = ''; });
      evid.innerHTML = '';
      acts.forEach(function (b) { b.disabled = true; });
      result.hidden = true; result.className = 'ovc__result';
      railTo(0);
      function step(i) {
        if (id !== run) return;
        if (i > 0) { steps[i - 1].classList.remove('is-cur'); steps[i - 1].classList.add('is-done'); }
        steps[i].classList.add('is-cur');
        railTo(i);
        if (i === steps.length - 1) { acts.forEach(function (b) { b.disabled = false; }); return; }
        stop = typer(texts[i], s.steps[i], 18, function () {
          if (i === 0) {
            s.evid.forEach(function (e, k) {
              later(id, 250 * (k + 1), function () { var c = document.createElement('span'); c.textContent = e; evid.appendChild(c); });
            });
            later(id, 250 * (s.evid.length + 1) + 300, function () { step(1); });
          } else later(id, 500, function () { step(i + 1); });
        });
      }
      later(id, 300, function () { step(0); });
    }
    function decide(ok) {
      var s = S[cur];
      acts.forEach(function (b) { b.disabled = true; });
      var last = steps[steps.length - 1];
      last.classList.remove('is-cur'); last.classList.add('is-done');
      result.hidden = false;
      result.className = 'ovc__result' + (ok ? '' : ' is-no');
      $('p', result).textContent = ok ? s.ok : 'Kept for review. No change made, and the recommendation stays open.';
      if (ok) requestAnimationFrame(function () { requestAnimationFrame(function () { result.classList.add('is-applied'); }); });
      var empty = $('.ovc__empty', log);
      if (empty) empty.remove();
      var li = document.createElement('li');
      if (!ok) li.className = 'no';
      li.innerHTML = '<time>' + stamp() + '</time><span></span>';
      var b = document.createElement('b');
      b.textContent = ok ? 'APPROVED' : 'REJECTED';
      var span = li.lastChild;
      span.appendChild(b);
      span.appendChild(document.createTextNode(' · ops.operator · ' + s.action + ' · ' + s.name));
      log.insertBefore(li, log.firstChild);
    }
    acts.forEach(function (b) { b.addEventListener('click', function () { decide(b.getAttribute('data-ov-act') === 'approve'); }); });
    function pick(i, focus) {
      cur = i;
      tabsEl.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.setAttribute('tabindex', k === i ? '0' : '-1'); });
      body.setAttribute('aria-labelledby', tabsEl[i].id);
      if (focus) tabsEl[i].focus();
      start();
    }
    tabsEl.forEach(function (t, k) {
      t.addEventListener('click', function () { pick(k); });
      t.addEventListener('keydown', function (e) {
        var n = tabsEl.length, to = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (k + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (k - 1 + n) % n;
        if (to !== null) { e.preventDefault(); pick(to, true); }
      });
    });
    $('[data-ov-reset]').addEventListener('click', start);
    $('[data-ov-clear]', root).addEventListener('click', function () { log.innerHTML = '<li class="ovc__empty">No decisions yet. Make a call above.</li>'; });
    onView(root, start, 0.3);
  });

  /* ================= modernization readiness quiz ================= */
  safe('quiz', function () {
    var root = $('[data-quiz]');
    var qs = $$('.q', root);
    var ans = qs.map(function () { return null; });
    var ring = $('[data-quiz-ring]', root);
    var scoreEl = $('[data-quiz-score]', root);
    var prog = $('[data-quiz-progress]', root);
    var title = $('[data-quiz-title]', root);
    var text = $('[data-quiz-text]', root);
    var ctas = $('[data-quiz-ctas]', root);
    var talk = $('[data-quiz-primary]', root);
    var book = $('[data-quiz-secondary]', root);
    // A "pressure" is a yes to 1, 2, 3, 4 or 6, or a no to question 5 (no migration plan).
    function pressure(i, v) { return i === 4 ? v === 0 : v === 1; }
    function primary(el, other) {
      el.classList.add('btn--grad'); el.classList.remove('btn--line');
      other.classList.remove('btn--grad'); other.classList.add('btn--line');
      ctas.insertBefore(el, ctas.firstChild);
    }
    function update() {
      var done = ans.filter(function (v) { return v !== null; }).length;
      var score = ans.reduce(function (s, v, i) { return s + (v !== null && pressure(i, v) ? 1 : 0); }, 0);
      scoreEl.textContent = score;
      ring.style.strokeDashoffset = 100 - score / 6 * 100;
      prog.textContent = done + ' of 6 answered';
      if (done < 6) {
        title.textContent = 'Answer all six to see your result.';
        text.textContent = 'The score counts how many of these pressures apply to you right now.';
        ctas.hidden = true;
        return;
      }
      var plan = ans[4] === 1, multi = ans[2] === 1;
      if (plan) {
        title.textContent = 'You have a plan. Check how Synaptix™ fits it.';
        text.textContent = 'With a migration plan in place, the useful next step is a conversation about your environment and timing.';
        primary(talk, book);
      } else if (score >= 4) {
        title.textContent = 'Plenty of pressure, no plan yet.';
        text.textContent = 'Start with the playbook to frame a phased move, then talk to us about the first phase.';
        primary(book, talk);
      } else if (score <= 2) {
        title.textContent = 'Not much pressure right now.';
        text.textContent = 'Read the playbook so you are ready before the next renewal cycle.';
        primary(book, talk);
      } else {
        title.textContent = 'Worth planning before the pressure builds.';
        text.textContent = 'The playbook gives you a framework. Our team can help you test it against what you run.';
        primary(book, talk);
      }
      if (multi) text.textContent += ' Running several sites? Multi-Site Management is in development, so we will show you what works across sites today.';
      ctas.hidden = false;
    }
    qs.forEach(function (q, i) {
      var btns = $$('[role="radio"]', q);
      btns.forEach(function (b, k) { b.setAttribute('tabindex', k === 0 ? '0' : '-1'); });
      function pick(b) {
        ans[i] = +b.getAttribute('data-v');
        btns.forEach(function (o) { var on = o === b; o.setAttribute('aria-checked', on ? 'true' : 'false'); o.setAttribute('tabindex', on ? '0' : '-1'); });
        q.classList.add('is-done');
        update();
      }
      btns.forEach(function (b) {
        b.addEventListener('click', function () { pick(b); });
        b.addEventListener('keydown', function (e) {
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
          e.preventDefault();
          var o = btns[0] === b ? btns[1] : btns[0];
          pick(o); o.focus();
        });
      });
    });
    $('[data-quiz-reset]', root).addEventListener('click', function () {
      ans = ans.map(function () { return null; });
      qs.forEach(function (q) { q.classList.remove('is-done'); $$('[role="radio"]', q).forEach(function (b, k) { b.setAttribute('aria-checked', 'false'); b.setAttribute('tabindex', k === 0 ? '0' : '-1'); }); });
      update();
      $('[role="radio"]', qs[0]).focus();
    });
    update();
  });

  /* ================= two ways in: pick a path, it expands ================= */
  safe('ways', function () {
    var ways = $('[data-ways]');
    var items = $$('[data-way]', ways);
    var timers = [];
    function choose(i) {
      timers.forEach(clearTimeout); timers = [];
      ways.classList.add('has-choice');
      items.forEach(function (w, k) {
        var open = k === i;
        var btn = $('.way__toggle', w), body = $('.way__body', w);
        w.classList.toggle('is-open', open);
        w.classList.toggle('is-slim', !open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        body.hidden = !open;
        $$('.journey li', w).forEach(function (li, n) {
          li.classList.remove('is-lit');
          if (open) timers.push(setTimeout(function () { li.classList.add('is-lit'); }, reduce ? 0 : 300 + n * 380));
        });
      });
    }
    items.forEach(function (w, k) {
      $('.way__toggle', w).addEventListener('click', function () { if (!w.classList.contains('is-open')) choose(k); });
    });
  });

  /* ================= founders: tilt, reveal on hover, tap or Enter ================= */
  safe('founders', function () {
    $$('[data-fcard]').forEach(function (c) {
      function toggle(e) { if (e && e.target.closest('a')) return; c.classList.toggle('is-open'); }
      c.addEventListener('click', toggle);
      c.addEventListener('keydown', function (e) {
        if (e.target !== c) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        if (e.key === 'Escape') c.classList.remove('is-open');
      });
      if (!fine || reduce) return;
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = 'perspective(900px) rotateY(' + (x * 9).toFixed(2) + 'deg) rotateX(' + (-y * 9).toFixed(2) + 'deg)';
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
  });

  /* ================= insights: filters + floating preview ================= */
  safe('insights', function () {
    var posts = $$('.post');
    var btns = $$('[data-filters] button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-f');
        btns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        posts.forEach(function (p) {
          var show = f === 'all' || p.getAttribute('data-cat') === f;
          p.classList.toggle('is-out', !show);
          p.classList.remove('is-in-f');
          if (show) { void p.offsetWidth; p.classList.add('is-in-f'); }
        });
      });
    });
    if (!fine) return;
    var peek = $('[data-peek]');
    var pc = $('[data-peek-c]'), ps = $('[data-peek-s]');
    var x = 0, y = 0, raf = 0;
    function place() { raf = 0; var flip = x > window.innerWidth - 320; peek.style.transform = 'translate(' + (flip ? x - 298 : x + 18) + 'px,' + (y + 18) + 'px)'; }
    posts.forEach(function (p) {
      var a = $('a', p);
      a.addEventListener('mouseenter', function () { pc.textContent = p.getAttribute('data-cat'); ps.textContent = p.getAttribute('data-sum'); peek.classList.add('is-on'); });
      a.addEventListener('mouseleave', function () { peek.classList.remove('is-on'); });
      a.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(place); });
    });
  });

  /* ================= FAQ: live search + one-open accordion ================= */
  safe('faq', function () {
    var faqs = $$('.faq');
    var input = $('[data-faq-search]');
    var count = $('[data-faq-count]');
    var empty = $('[data-faq-empty]');
    function setOpen(item, open) {
      item.classList.toggle('is-open', open);
      $('button', item).setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    faqs.forEach(function (f) {
      $('button', f).addEventListener('click', function () {
        var open = !f.classList.contains('is-open');
        faqs.forEach(function (o) { setOpen(o, o === f ? open : false); });
      });
    });
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase(), n = 0;
      faqs.forEach(function (f) {
        var hit = !q || f.textContent.toLowerCase().indexOf(q) > -1;
        f.hidden = !hit;
        if (hit) n++;
      });
      count.textContent = n + (n === 1 ? ' question' : ' questions') + (q ? ' match' + (n === 1 ? 'es' : '') : '');
      empty.hidden = n > 0;
    });
  });

  /* ================= let's talk banner ================= */
  safe('talk', function () {
    var t = $('[data-talk]');
    onView(t, function () { t.classList.add('is-in'); }, 0.3);
  });

  /* ================= contact form =================
     data-mode="wp": validate, then post to admin-post.php.
     data-mode="mailto": validate, then open the visitor's email app. */
  safe('form', function () {
    var form = $('#contact-form');
    var done = $('#form-done');
    var mode = form.getAttribute('data-mode');
    var msg = $('#f-message');
    var counter = $('[data-count-msg]');
    var rules = {
      name: function (v) { return v.length >= 2 ? '' : 'Add your name so we know who to reply to.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'That email doesn\'t look right. Try something like name@company.com.'; },
      message: function (v) { return v.length >= 10 ? '' : 'A sentence about what you run is plenty, but we need at least that.'; }
    };
    function check(name) {
      var el = form.elements[name];
      var m = rules[name](el.value.trim());
      var wrap = el.closest('.fl');
      wrap.classList.toggle('is-bad', !!m);
      wrap.classList.toggle('is-ok', !m);
      el.setAttribute('aria-invalid', m ? 'true' : 'false');
      $('#e-' + name).textContent = m;
      return !m;
    }
    Object.keys(rules).forEach(function (n) {
      var el = form.elements[n];
      el.addEventListener('blur', function () { if (el.value.trim() || el.closest('.fl').classList.contains('is-bad')) check(n); });
      el.addEventListener('input', function () { if (el.closest('.fl').classList.contains('is-bad')) check(n); });
    });
    function countUp() {
      counter.textContent = msg.value.length + ' / ' + msg.maxLength;
      counter.classList.toggle('is-near', msg.value.length > msg.maxLength * 0.9);
    }
    msg.addEventListener('input', countUp);
    countUp();
    // CTAs that carry a topic preselect it in the form.
    $$('[data-topic]').forEach(function (a) {
      a.addEventListener('click', function () {
        var sel = $('#f-topic');
        $$('option', sel).forEach(function (o) { if (o.textContent === a.getAttribute('data-topic')) sel.value = o.value || o.textContent; });
      });
    });
    form.addEventListener('submit', function (e) {
      var bad = Object.keys(rules).filter(function (n) { return !check(n); });
      if (bad.length) { e.preventDefault(); form.elements[bad[0]].focus(); return; }
      if (form.elements.website.value) { e.preventDefault(); return; }
      var btn = $('[data-submit]', form);
      btn.classList.add('is-loading');
      btn.disabled = true;
      $('span', btn).textContent = 'Sending';
      if (mode === 'wp') return;
      e.preventDefault();
      var v = function (n) { return (form.elements[n].value || '').trim(); };
      var body = ['Name: ' + v('name'), 'Email: ' + v('email'), 'Company: ' + (v('company') || 'Not given'), 'Working on: ' + (v('topic') || 'Not given'), '', v('message')].join('\n');
      var to = (form.getAttribute('action') || '').replace(/^mailto:/, '');
      setTimeout(function () {
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent('Synaptix enquiry: ' + v('name') + (v('company') ? ', ' + v('company') : '')) + '&body=' + encodeURIComponent(body);
        $('#form-done-title').textContent = 'Thanks, ' + v('name').split(' ')[0] + '.';
        $('#form-done-text').textContent = 'Your email app should open with your message filled in. Press send there and our team will reply. If nothing opened, write to ' + to + '.';
        form.hidden = true;
        done.hidden = false;
        done.focus();
        btn.classList.remove('is-loading'); btn.disabled = false; $('span', btn).textContent = 'Send message';
      }, reduce ? 0 : 700);
    });
    $('[data-form-reset]').addEventListener('click', function () { done.hidden = true; form.hidden = false; $('#f-name').focus(); });
    if ($('#form-status').textContent.trim()) $('#contact').scrollIntoView();
  });

  /* ================= footer checker blocks drift with the cursor ================= */
  safe('footer', function () {
    if (!fine || reduce) return;
    var brand = $('.foot__brand');
    var blocks = $$('[data-checker]', brand);
    brand.addEventListener('pointermove', function (e) {
      var r = brand.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      blocks[0].style.transform = 'translate(' + (x * 16).toFixed(1) + 'px,' + (y * 12).toFixed(1) + 'px)';
      blocks[1].style.transform = 'translate(' + (-x * 16).toFixed(1) + 'px,' + (-y * 12).toFixed(1) + 'px)';
    });
    brand.addEventListener('pointerleave', function () { blocks.forEach(function (b) { b.style.transform = ''; }); });
  });
})();
