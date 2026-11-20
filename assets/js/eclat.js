/* GlowIA : effets du site (poussière de nacre, signature en particules, curseur, défilement doux).
   Tout est coupé si la personne a demandé moins d'animations, ou sur un appareil peu puissant. */
(function () {
  'use strict';
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = navigator;
  var faible = (nav.hardwareConcurrency || 8) <= 2 || (nav.deviceMemory || 8) <= 2 || (nav.connection && nav.connection.saveData === true);
  var souris = window.matchMedia('(pointer: fine)').matches && window.innerWidth > 900;
  var petit = window.innerWidth < 600;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var COULEURS = ['#E8C4C0', '#B88A72', '#5B2A3C', '#F3DEDA', '#D9A9A3'];

  if (reduit || faible) { document.documentElement.classList.add('sans-eclat'); return; }
  document.documentElement.classList.add('avec-eclat');

  /* Petites lueurs pré-dessinées : une par couleur, réutilisées pour chaque grain */
  var lueurs = {};
  function lueur(c) {
    if (lueurs[c]) return lueurs[c];
    var t = 64, cv = document.createElement('canvas'); cv.width = cv.height = t;
    var x = cv.getContext('2d'), g = x.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2);
    g.addColorStop(0, c); g.addColorStop(0.28, c); g.addColorStop(0.32, hexA(c, 0.35)); g.addColorStop(1, hexA(c, 0));
    x.fillStyle = g; x.fillRect(0, 0, t, t);
    return (lueurs[c] = cv);
  }
  function hexA(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  /* Position de la souris, partagée */
  var pointeur = { x: -9999, y: -9999, actif: false };
  window.addEventListener('pointermove', function (e) { pointeur.x = e.clientX; pointeur.y = e.clientY; pointeur.actif = true; }, { passive: true });
  document.addEventListener('pointerleave', function () { pointeur.actif = false; pointeur.x = pointeur.y = -9999; });

  function preparer(cv) {
    var ctx = cv.getContext('2d');
    var o = { cv: cv, ctx: ctx, l: 0, h: 0, visible: false };
    function taille() { var r = cv.getBoundingClientRect(); o.l = r.width; o.h = r.height; cv.width = Math.round(r.width * DPR); cv.height = Math.round(r.height * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); if (o.surTaille) o.surTaille(); }
    taille();
    var t0; window.addEventListener('resize', function () { clearTimeout(t0); t0 = setTimeout(taille, 150); });
    new IntersectionObserver(function (es) { o.visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(cv);
    return o;
  }

  /* 1. Poussière de nacre derrière le haut de page : elle flotte et s'écarte de la souris */
  var cvHero = document.getElementById('poussiere');
  if (cvHero) {
    var H = preparer(cvHero), grains = [];
    var N = petit ? 34 : 90;
    for (var i = 0; i < N; i++) grains.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7, r: 0.8 + Math.random() * 2.2, c: COULEURS[i % 4], ph: Math.random() * 6.28, dx: 0, dy: 0 });
    var tH = 0;
    (function boucle() {
      requestAnimationFrame(boucle);
      if (!H.visible) return;
      tH += 0.006;
      var ctx = H.ctx, r = cvHero.getBoundingClientRect();
      ctx.clearRect(0, 0, H.l, H.h);
      var fuite = Math.max(0, Math.min(1, -r.top / (r.height * 0.8)));
      for (var k = 0; k < grains.length; k++) {
        var g = grains[k];
        g.y -= 0.00022 * g.z; if (g.y < -0.05) { g.y = 1.05; g.x = Math.random(); }
        var x = (g.x + Math.sin(tH + g.ph) * 0.012) * H.l, y = (g.y + Math.cos(tH * 0.8 + g.ph) * 0.01) * H.h - fuite * 120 * g.z;
        var mx = pointeur.x - r.left, my = pointeur.y - r.top, ex = x - mx, ey = y - my, d2 = ex * ex + ey * ey;
        if (d2 < 14000) { var f = (1 - d2 / 14000) * 3.2; g.dx += ex / Math.sqrt(d2 + 1) * f; g.dy += ey / Math.sqrt(d2 + 1) * f; }
        g.dx *= 0.92; g.dy *= 0.92;
        var s = g.r * 5 * g.z;
        ctx.globalAlpha = (0.35 + 0.45 * g.z) * (0.75 + 0.25 * Math.sin(tH * 3 + g.ph)) * (1 - fuite);
        ctx.drawImage(lueur(g.c), x + g.dx - s / 2, y + g.dy - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    })();
  }

  /* 2. Signature : des grains dispersés se rassemblent en « GlowIA » quand on arrive en bas de page */
  var cvSig = document.getElementById('signatureToile');
  if (cvSig) {
    var S = preparer(cvSig), pts = [], prog = 0, cible = 0;
    function cibles() {
      var l = S.l, h = S.h, off = document.createElement('canvas'), ox = off.getContext('2d');
      off.width = Math.round(l); off.height = Math.round(h);
      var fs = Math.min(l * (petit ? 0.29 : 0.2), h * 0.66);
      ox.fillStyle = '#000'; ox.textAlign = 'center'; ox.textBaseline = 'middle';
      ox.font = '600 ' + fs + 'px Lora, Georgia, serif';
      ox.fillText('GlowIA', l / 2, h / 2);
      var pas = petit ? 5 : Math.max(5, Math.round(fs / 34)), d = ox.getImageData(0, 0, off.width, off.height).data, res = [];
      for (var y = 0; y < off.height; y += pas) for (var x = 0; x < off.width; x += pas) if (d[(y * off.width + x) * 4 + 3] > 140) res.push([x, y]);
      return res;
    }
    S.surTaille = function () {
      var c = cibles();
      pts = c.map(function (p, n) {
        var a = Math.random() * 6.28, rr = Math.max(S.l, S.h) * (0.35 + Math.random() * 0.5);
        var dansIA = p[0] > S.l / 2 + S.l * 0.09;
        return { tx: p[0], ty: p[1], hx: S.l / 2 + Math.cos(a) * rr, hy: S.h / 2 + Math.sin(a) * rr * 0.6, d: Math.random(), r: 1 + Math.random() * 1.4, c: dansIA ? (n % 3 ? '#B88A72' : '#E8C4C0') : (n % 4 ? '#5B2A3C' : '#B88A72'), ph: Math.random() * 6.28, dx: 0, dy: 0 };
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { S.surTaille(); });
    S.surTaille();
    var lisse = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); };
    function avancement() { var r = cvSig.getBoundingClientRect(), vh = window.innerHeight; cible = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.75 + r.height * 0.25))); }
    window.addEventListener('scroll', avancement, { passive: true }); avancement();
    var tS = 0;
    (function boucle() {
      requestAnimationFrame(boucle);
      if (!S.visible) return;
      tS += 0.01; prog += (cible - prog) * 0.08;
      var ctx = S.ctx, r = cvSig.getBoundingClientRect();
      ctx.clearRect(0, 0, S.l, S.h);
      var mx = pointeur.x - r.left, my = pointeur.y - r.top;
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k], q = lisse((prog - p.d * 0.35) / 0.65);
        var x = p.hx + (p.tx - p.hx) * q + Math.sin(tS + p.ph) * (1 - q * 0.85) * 6;
        var y = p.hy + (p.ty - p.hy) * q + Math.cos(tS * 1.3 + p.ph) * (1 - q * 0.85) * 6;
        var ex = x - mx, ey = y - my, d2 = ex * ex + ey * ey;
        if (d2 < 6400) { var f = (1 - d2 / 6400) * 2.4; p.dx += ex / Math.sqrt(d2 + 1) * f; p.dy += ey / Math.sqrt(d2 + 1) * f; }
        p.dx *= 0.9; p.dy *= 0.9;
        var s = p.r * (4 + q * 1.5);
        ctx.globalAlpha = 0.25 + 0.75 * q;
        ctx.drawImage(lueur(p.c), x + p.dx - s / 2, y + p.dy - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      cvSig.parentNode.classList.toggle('forme', prog > 0.92);
    })();
  }

  /* 3. Curseur (ordinateur uniquement) : un point et un anneau nacré qui grossit sur ce qui se clique ; boutons aimantés */
  if (souris) {
    var point = document.createElement('div'), anneau = document.createElement('div');
    point.className = 'curseur-point'; anneau.className = 'curseur-anneau';
    point.setAttribute('aria-hidden', 'true'); anneau.setAttribute('aria-hidden', 'true');
    document.body.appendChild(anneau); document.body.appendChild(point);
    document.documentElement.classList.add('curseur-perso');
    var ax = -100, ay = -100;
    (function suivre() {
      requestAnimationFrame(suivre);
      ax += (pointeur.x - ax) * 0.18; ay += (pointeur.y - ay) * 0.18;
      point.style.transform = 'translate(' + pointeur.x + 'px,' + pointeur.y + 'px)';
      anneau.style.transform = 'translate(' + ax + 'px,' + ay + 'px)';
    })();
    var cliquable = 'a,button,summary,label,input[type=range],.carte-canal,[role=tab]';
    document.addEventListener('pointerover', function (e) {
      var c = e.target.closest && e.target.closest(cliquable);
      var texte = e.target.closest && e.target.closest('input:not([type=range]),textarea');
      document.documentElement.classList.toggle('curseur-survol', !!c && !texte);
      document.documentElement.classList.toggle('curseur-texte', !!texte);
    });
    document.addEventListener('pointerdown', function () { document.documentElement.classList.add('curseur-appui'); });
    document.addEventListener('pointerup', function () { document.documentElement.classList.remove('curseur-appui'); });
    document.querySelectorAll('.btn-prune,.btn-ligne').forEach(function (b) {
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28) + 'px)'; });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* 4. Défilement doux sur ordinateur, accordé aux animations au défilement */
  if (souris && window.Lenis) {
    var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, anchors: { offset: -72 } });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    }
    window.glowLenis = lenis;
  }
})();
