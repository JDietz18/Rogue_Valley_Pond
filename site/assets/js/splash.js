// Rogue Valley Ponds & Handyman: landing intro (styles in splash.css). Runs only if the <head>
// script set html.splash-pending; builds its own overlay and plays ~2.9s, then the badge flies onto
// the hero .badge-stage as the colors wipe the overlay away, and <html> gets "is-ready" + window
// "rvp:intro-done". Skip: the button, any click or tap, Esc / Enter / Space (~250ms).
(() => {
  const root = document.documentElement, body = document.body;
  if (!root.classList.contains("splash-pending")) return;
  if (!body || !window.KeyframeEffect || matchMedia("(prefers-reduced-motion: reduce)").matches) return root.classList.remove("splash-pending");
  clearTimeout(window.rvpSplashFailsafe);
  try { sessionStorage.setItem("rvp-intro-seen", "1"); } catch (e) {}

  // cue sheet (ms)
  const BURST = 270, BADGE = 430, IMPACT = 661, STAMP = 890, SUB = 1430, GLINT = 1540, EXIT = 2240, FLY = 600, WIPE = 660, FADE = 90;
  const WAIT = 0, RUN = 1, SKIP = 2, LAND = 3, DONE = 4;
  const vw = () => root.clientWidth || innerWidth, vh = () => root.clientHeight || innerHeight; // layout viewport
  const IW = vw(), IH = vh(), P = IH > IW * 1.15; // portrait layout
  const DPR = Math.min(devicePixelRatio || 1, 2), FXS = Math.min(DPR, Math.sqrt(2.4e6 / (IW * IH))); // canvas scale, capped near 2.4 MP
  const me = document.currentScript, base = me && me.src ? new URL("../img/", me.src) : new URL("assets/img/", location.href);
  const SRC = new URL(`rvph-badge-${Math.min(IW * .8, IH * .56, 520) * DPR > 560 ? 1040 : 520}.webp`, base).href; // as the <head> preload
  const STAR = "M12 1.3 14.8 9.1 23 9.3 16.5 14.4 18.8 22.3 12 17.6 5.2 22.3 7.5 14.4 1 9.3 9.2 9.1Z";
  const star = `<svg viewBox="0 0 24 24"><path d="${STAR}"/></svg>`;
  const css = (n, o) => { for (const k in o) n.style[k] = typeof o[k] == "number" ? o[k] + "px" : o[k]; };
  const stage = document.querySelector(".hero-badge .badge-stage"), poster = stage && stage.querySelector("img");

  const el = document.createElement("div");
  el.className = P ? "rvs rvs-p" : "rvs";
  for (const [k, v] of [["role", "dialog"], ["aria-modal", "true"], ["aria-label", "Rogue Valley Ponds & Handyman, veteran owned and operated"]]) el.setAttribute(k, v);
  el.innerHTML =
    '<div class="rvs-win" aria-hidden="true"><div class="rvs-curtain"><div class="rvs-shake"><canvas class="rvs-field"></canvas><canvas class="rvs-fx"></canvas>' +
    `<svg class="rvs-flare" viewBox="0 0 24 24"><radialGradient id="rvs-fl"><stop offset=".15" stop-color="#fffaf0"/><stop offset=".6" stop-color="#f0d49a"/><stop offset="1" stop-color="#e2be7c"/></radialGradient><path fill="url(#rvs-fl)" d="${STAR}"/></svg>` +
    '<div class="rvs-banner"><div class="rvs-band rvs-r"></div><div class="rvs-band rvs-c"></div><div class="rvs-band rvs-b"><div class="rvs-ink">' +
    ["Veteran", "Owned &amp;", "Operated"].map((w) => `<span class="rvs-w"><span class="rvs-gh">${w}</span>${w}</span>`).join("") +
    '</div></div><div class="rvs-sub">' +
    (P ? `<span><b>Ponds · Koi · Home repairs</b></span><span>${star}Grants Pass, Oregon${star}</span>`
       : `<span>${star}<b>Ponds · Koi · Home repairs</b>—<span>Grants Pass, Oregon</span>${star}</span>`) +
    '</div></div><div class="rvs-flash"></div></div></div><div class="rvs-edge"><i></i><i></i><i></i></div></div>' +
    '<div class="rvs-badge" aria-hidden="true"><div class="rvs-bshake"><div class="rvs-punch"><img alt=""><div class="rvs-glint"><i></i></div></div></div></div>' +
    '<button type="button" class="rvs-skip">Skip intro<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l5 5-5 5M9 3l5 5-5 5"/></svg></button>';
  const $ = (s) => el.querySelector(s);
  const [win, curtain, shake, field, fx, flare, banner, ink, sub, flash, edge, badge, bshake, punch, img, glint, skipBtn] =
    ["win", "curtain", "shake", "field", "fx", "flare", "banner", "ink", "sub", "flash", "edge", "badge", "bshake", "punch", "punch img", "glint i", "skip"].map((c) => $(".rvs-" + c));
  const bands = el.querySelectorAll(".rvs-band"), words = [...el.querySelectorAll(".rvs-w")];
  img.src = SRC;
  el.style.setProperty("--badge", `url("${SRC}")`);
  el.style.setProperty("--ink", `url(${inkMask()})`);

  body.prepend(el); // first, so focus resumes at the page start afterwards; black until it runs
  root.classList.add("rvs-live");
  if (stage) stage.style.opacity = "0"; // the hero badge waits for the flying one to land on it
  const inerted = [...body.children].filter((n) => n !== el && n.tagName !== "SCRIPT" && !n.hasAttribute("inert"));
  inerted.forEach((n) => n.setAttribute("inert", ""));
  skipBtn.focus({ preventScroll: true });

  let state = WAIT, L, raf = 0, queue = [], stars, flight, master, shown, g;
  const clock = () => (master && master.currentTime) || 0; // an empty 100s animation on the overlay
  const at = (t, fn) => { queue.push([t, fn]); queue.sort((a, b) => a[0] - b[0]); };

  // input: skip; no scrolling underneath; start once the tab is seen, stop if it's hidden
  const ac = new AbortController(), on = (t, ev, f, o) => t.addEventListener(ev, f, Object.assign({ signal: ac.signal }, o));
  let ready = false;
  const go = () => { if (ready && !document.hidden && state === WAIT) try { start(); } catch (e) { finish(); } }; // never leave the cover up
  on(window, "keydown", (e) => { if (/^(Esc|Enter| |Spacebar|Arrow|Page|Home$|End$)/.test(e.key)) { e.preventDefault(); if (/^(Esc|Enter| |Spacebar)/.test(e.key)) skip(); } }, { capture: true });
  on(window, "resize", () => { if (Math.abs(vw() - IW) > 2 || Math.abs(vh() - IH) > 140) skip(); });
  on(document, "visibilitychange", () => (document.hidden ? state > WAIT && finish() : go()));
  on(el, "click", skip);
  for (const ev of ["wheel", "touchmove"]) on(el, ev, (e) => e.preventDefault(), { passive: false });
  // a font that turns up mid-intro: refit the lettering to the space it was given
  if (document.fonts) on(document.fonts, "loadingdone", () => { if (state === RUN && clock() < EXIT) refit(); });
  // wait at most 100ms (both are preloaded) for the badge and the stencil face; decode the hero poster too
  const fonts = document.fonts && document.fonts.load('900 100px "Big Shoulders Stencil Display"');
  if (poster && poster.decode) poster.decode().catch(() => {});
  Promise.race([Promise.all([fonts, img.decode && img.decode()]).catch(() => {}), new Promise((r) => setTimeout(r, 100))]).then(() => { ready = true; go(); });

  // layout: everything sized from the viewport
  function layout() {
    const { width: W, height: H } = el.getBoundingClientRect();
    const wd = (n) => n.getBoundingClientRect().width, m = words.map(wd), inkW = wd(ink), subW = wd(sub.firstElementChild); // at 100px / 16px
    const Wt = P ? Math.min(W * .8, 420) : Math.min(W * .84, 1240);
    const size = (k) => {
      const o = { B: k * (P ? Math.min(W * .74, H * .37, 420) : Math.min(H * .5, W * .4, 520)) };
      if (P) {
        o.fw = m.map((w) => k * Wt / w * 100); // each line set to the full width
        o.Hb = o.fw.reduce((s, f) => s + f * .86, 0) + o.fw[0] * .34;
        o.fs = k * Math.min(Wt * .92 / subW * 16, 17);
      } else {
        o.f = Math.min(k * Wt / inkW * 100, o.B * .3);
        o.Hb = o.f * 1.22;
        o.fs = Math.max(12, Math.min(o.f * .2, 26, W * .8 / subW * 16));
      }
      o.Hr = Math.max(8, o.Hb * (P ? .1 : .17));
      o.Hc = Math.max(4, o.Hr * .4);
      o.gap = Math.max(3, Math.round(o.Hr * .2));
      o.ov = o.Hr * .9 + o.gap; // the badge overlaps the red band
      o.comp = o.B - o.ov + o.Hr + o.Hc + o.Hb + 2 * o.gap + o.fs * (P ? 3.65 : 2.2);
      return o;
    };
    const padT = H * .04, avail = H - padT - (P ? 84 : Math.max(H * .06, 66)); // clear of the skip button
    let o = size(1);
    if (o.comp > avail) o = size(avail / o.comp);
    const top = padT + (avail - o.comp) / 2, cx = W / 2, cy = top + o.B / 2, bw = o.B, bh = o.B * 520 / 531, bW = W * (P ? 1.35 : 1.2);
    const R = Math.hypot(W, H) / 2, R0 = R + 2, S = Math.max(W, H) * .2;
    css(banner, { left: cx - bW / 2, top: top + o.B - o.ov, width: bW, transform: `rotate(${P ? -7 : -5}deg)` });
    css(bands[0], { height: o.Hr });
    css(bands[1], { height: o.Hc, marginTop: o.gap });
    css(bands[2], { height: o.Hb, marginTop: o.gap });
    css(sub, { fontSize: o.fs, marginTop: o.fs * .9 });
    if (P) words.forEach((w, i) => css(w, { fontSize: o.fw[i] }));
    else css(ink, { fontSize: o.f });
    css(badge, { width: bw, height: bh, transform: tf(cx, cy, 1, 1, 0, bw, bh) });
    const place = (n, s) => css(n, { width: s, height: s, left: cx - s / 2, top: cy - s / 2 });
    place(field, Math.min(R * 1.5, o.B * 3.4));
    place(flare, o.B * .9);
    place(flash, o.B * 1.6);
    // the wipe window (see splash.css)
    [.4, .18, .42].forEach((f, i) => css(edge.children[i], { width: S * f }));
    css(win, { left: W / 2, top: H / 2 - R0, width: 2 * R0 + S, height: 2 * R0 });
    css(curtain, { left: -W / 2, top: R0 - H / 2, width: W, height: H });
    [win.style.transform, curtain.style.transform] = wipe(-R0 - S);
    fx.width = Math.round(W * FXS);
    fx.height = Math.round(H * FXS);
    return Object.assign(o, { W, H, cx, cy, bw, bh, R, Wt, e0: -R0 - S, e1: R0 + 2 });
  }
  // the lettering keeps its measured width (and the bands their height) if the face swaps late
  function refit() {
    const w = (n) => n.offsetWidth;
    if (P) {
      const fw = words.map((n, i) => L.fw[i] * L.Wt / w(n)), k = Math.min(1, L.Hb / (fw.reduce((s, f) => s + f * .86, 0) + fw[0] * .34));
      words.forEach((n, i) => css(n, { fontSize: (L.fw[i] = fw[i] * k) }));
    } else css(ink, { fontSize: (L.f = Math.min(L.f * L.inkW / w(ink), L.Hb / 1.22)) });
    L.inkW = w(ink);
  }
  // landscape: sweep from the right (the hero copy side clears last); portrait: from the top
  function wipe(e) {
    const a = P ? 76 : 196;
    return [`rotate(${a}deg) translateX(${e}px)`, `translateX(${-e}px) rotate(${-a}deg)`];
  }
  function tf(x, y, sx, sy, r, bw = L.bw, bh = L.bh) {
    return `translate(${x - bw / 2}px, ${y - bh / 2}px) rotate(${r}deg) scale(${sx}, ${sy})`;
  }
  // the badge inside the hero poster spans [left .051, top .047, right .948, bottom .924] (fitted to its pixels)
  function target() {
    const r = stage && stage.getBoundingClientRect();
    if (!r || !r.width || r.bottom < 0 || r.top > L.H || r.right < 0 || r.left > L.W) return null;
    return { x: r.left + r.width * .051, y: r.top + r.height * .047, w: r.width * .897, h: r.height * .877 };
  }
  const landing = (T) => tf(T.x + T.w / 2, T.y + T.h / 2, T.w / L.bw, T.h / L.bh, 0);

  function start() {
    if (state !== WAIT) return;
    state = RUN;
    L = layout();
    L.inkW = ink.offsetWidth;
    el.classList.add("rvs-run"); // the curtain is up: the overlay's own black can go
    const B = L.B, out = "cubic-bezier(.16,1,.3,1)", a = (n, kf, o) => n.animate(kf, o);
    // one animation per element and property (stacked ones can't run on the compositor)
    const track = (n, first, segs) => {
      const end = Math.max(...segs.map(([t, d]) => t + d)), kf = [Object.assign({ offset: 0 }, first)];
      for (const [t, d, f] of segs) f.forEach((k, i) => kf.push(Object.assign({}, k, { offset: (t + d * (k.offset ?? i / (f.length - 1))) / end })));
      return n.animate(kf, end);
    };
    const jolt = (amp, t, d) => [t, d, [[0, 0], [.6, 1], [-.8, -.5], [.45, -.35], [-.2, .25], [0, 0]].map(([x, y]) => ({ translate: `${amp * x}px ${amp * y}px` }))];
    const jolts = [jolt(B * .008, 160, 160), jolt(B * .03, IMPACT, 320)].concat([0, 1, 2].map((i) => jolt(B * (i > 1 ? .014 : .009), STAMP + i * 160 + 150, 150)));
    drawField();
    master = el.animate(null, 1e5);

    // 1. the colors slash across: red, cream, Pond Blue; a thud as they land
    [[-1, 0, 340], [1, 50, 340], [-1, 95, 420]].forEach(([d, delay, duration], i) => a(bands[i], [
      { transform: `translateX(${d * 105}%) skewX(${d * 40}deg)` }, { transform: "none" },
    ], { duration, delay, easing: "cubic-bezier(.1,.85,.2,1)", fill: "backwards" }));
    [shake, bshake].forEach((n) => track(n, { translate: "0px 0px" }, jolts));
    // 2. a brass star flares and bursts into a field of stars (canvas)
    a(flare, [{ opacity: 1, transform: "scale(0) rotate(-120deg)" }, { opacity: 1, transform: "scale(.8) rotate(-20deg)", offset: .4 }, { opacity: 0, transform: "scale(1.5) rotate(0)" }],
      { duration: 460, delay: BURST - 30, easing: "cubic-bezier(.2,.8,.3,1)", fill: "backwards" });
    track(flash, { opacity: 0, transform: "scale(.1)" }, [
      [BURST - 20, 320, [{ opacity: 0, transform: "scale(.1)" }, { opacity: 1, transform: "scale(.45)", offset: .3 }, { opacity: 0, transform: "scale(.7)" }]],
      [IMPACT - 15, 460, [{ opacity: 0, transform: "scale(.5)" }, { opacity: 1, transform: "scale(1)", offset: .2 }, { opacity: 0, transform: "scale(1.6)" }]],
    ]);
    // 3. the badge punches in: overshoot, ripples (canvas), flash, shake; the pond lights up around it
    a(punch, [
      { opacity: 0, transform: "scale(2.7) rotate(-12deg)", easing: "cubic-bezier(.55,0,.85,.45)" },
      { opacity: 1, offset: .14 },
      { transform: "scale(.9) rotate(1.5deg)", offset: .55, easing: "cubic-bezier(.3,0,.3,1)" },
      { transform: "scale(1.035) rotate(-.4deg)", offset: .78, easing: "ease-in-out" },
      { opacity: 1, transform: "none" },
    ], { duration: 420, delay: BADGE, fill: "both" });
    // the glow, the lit water and the rays around it open out, then turn slowly
    a(field, [{ opacity: 0, transform: "rotate(-8deg) scale(.6)", easing: out }, { opacity: 1, transform: "none", offset: .3 }, { opacity: 1, transform: "rotate(16deg) scale(1.04)" }],
      { duration: EXIT + 700 - IMPACT, delay: IMPACT - 20, fill: "both" });
    // 4. VETERAN / OWNED & / OPERATED stamp down, each with an ink bloom and a thud
    words.forEach((w, i) => {
      const t = STAMP + i * 160;
      a(w, [
        { opacity: 0, transform: "scale(1.9)", easing: "cubic-bezier(.6,0,.9,.5)" },
        { opacity: 1, transform: "scale(.955)", offset: .5, easing: "cubic-bezier(.2,.6,.3,1)" },
        { opacity: 1, transform: "scale(1.012)", offset: .72 },
        { opacity: 1, transform: "none" },
      ], { duration: 300, delay: t, fill: "backwards" });
      a(w.firstChild, [{ opacity: .6, transform: "none" }, { opacity: 0, transform: "scale(1.14, 1.2)" }], { duration: 420, delay: t + 150, easing: "cubic-bezier(.2,.7,.3,1)" });
    });
    a(banner, [{ scale: "1" }, { scale: "1.03" }], { duration: EXIT - 700, delay: 700, fill: "both" }); // slow push-in
    // 5. the line under it
    [...sub.children].forEach((s, i) => a(s, [{ clipPath: "inset(-20% 100% -20% 0)", transform: "translateX(-.6em)" }, { clipPath: "inset(-20% -2% -20% 0)", transform: "none" }],
      { duration: 560, delay: SUB + i * 120, easing: "cubic-bezier(.65,0,.25,1)", fill: "backwards" }));
    sub.querySelectorAll("svg").forEach((s, i) => a(s, [{ transform: "rotate(-220deg) scale(0)" }, { transform: "none" }],
      { duration: 700, delay: SUB + 90 + i * 90, easing: out, fill: "backwards" }));
    // 6. light across the badge: once at rest, once in flight
    for (const [delay, duration] of [[GLINT, 750], [EXIT + 120, 520]])
      a(glint, [{ transform: "translateX(-140%) skewX(-16deg)" }, { transform: "translateX(300%) skewX(-16deg)" }], { duration, delay, easing: "cubic-bezier(.45,0,.25,1)" });

    stars = makeStars();
    g = fx.getContext("2d");
    at(EXIT, exit);
    setTimeout(finish, 5000); // backstop: whatever happens, the page comes back
    raf = requestAnimationFrame(frame);
  }

  function frame() {
    if (state === DONE) return;
    raf = requestAnimationFrame(frame);
    const t = clock();
    try {
      while (queue.length && t >= queue[0][0]) queue.shift()[1]();
      if (state === RUN && t < EXIT + 660) draw(t);
    } catch (e) { finish(); }
  }

  // 7. hand-off: the colors sweep back across, wiping the overlay away, as the badge flies home;
  //    the wipe clears the hero copy just as the flyer lands, so the headline rises right behind it
  function exit() {
    if (state !== RUN) return;
    const { cx, cy, B } = L, T = target(), w0 = wipe(L.e0), w1 = wipe(L.e1);
    const o = { duration: WIPE, easing: "cubic-bezier(.45,0,.7,.8)", fill: "forwards" };
    flight = badge.animate([
      { transform: tf(cx, cy, 1, 1, 0), easing: "cubic-bezier(.33,0,.5,1)" },
      { transform: tf(cx, cy - B * .015, 1.05, 1.05, -2.5), offset: .17, easing: "cubic-bezier(.6,0,.18,1)" },
      { transform: T ? landing(T) : tf(cx, -B, .5, .5, 0) },
    ], { duration: FLY, fill: "forwards" });
    if (!T) punch.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FLY, fill: "forwards" });
    const swept = win.animate([{ transform: w0[0] }, { transform: w1[0] }], o).finished;
    curtain.animate([{ transform: w0[1] }, { transform: w1[1] }], o);
    skipBtn.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
    Promise.all([swept, flight.finished.then(land)]).then(() => state === LAND && finish(), () => {});
  }

  // the flyer is exactly over the hero badge: show that under it, fade the flyer, hand over
  function land() {
    if (state !== RUN) return;
    state = LAND;
    const T = target();
    if (T) { // re-aim if the page moved under us (late fonts, say)
      const want = landing(T), now = new DOMMatrix(getComputedStyle(badge).transform), w = new DOMMatrix(want);
      if (Math.abs(now.e - w.e) > .5 || Math.abs(now.f - w.f) > .5 || Math.abs(now.a - w.a) > .002) { flight.cancel(); badge.style.transform = want; }
    }
    if (stage) stage.style.opacity = ""; // under the opaque flyer, so no cross-fade is needed
    return badge.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE, easing: "ease-out", fill: "forwards" }).finished;
  }
  // fade the hero badge in on the same timeline as the overlay's own animations
  function reveal(duration, delay = 0) {
    return (shown = stage && stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration, delay, fill: "both" }));
  }

  // skip: straight to the hand-off end state in ~250ms, however slow the frames are
  function skip() {
    if (state === WAIT) {
      state = SKIP;
      setTimeout(finish, 280);
      reveal(200);
      return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }).finished.then(finish);
    }
    if (state !== RUN) return;
    state = SKIP;
    setTimeout(finish, 280);
    queue = [];
    const ps = getComputedStyle(punch), pO = +ps.opacity, pT = ps.transform, bT = getComputedStyle(badge).transform;
    [...badge.getAnimations(), ...punch.getAnimations()].forEach((x) => x.cancel());
    Object.assign(punch.style, { opacity: pO, transform: pT });
    badge.style.transform = bT;
    const T = target(), D = 200, o = { duration: D, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" };
    skipBtn.animate([{ opacity: 1 }, { opacity: 0 }], o);
    if (T && pO > .1) { // straight into place, cross-fading into the hero badge
      badge.animate([{ transform: bT }, { transform: landing(T) }], o);
      punch.animate([{ opacity: pO, transform: pT }, { opacity: 1, transform: "none", offset: .6 }, { opacity: 0, transform: "none" }], o);
    } else punch.animate([{ opacity: pO }, { opacity: 0 }], o);
    const fade = win.animate([{ opacity: 1 }, { opacity: 0 }], o); // the rest plays on as it fades
    reveal(D * .6, D * .4);
    fade.finished.then(finish);
  }

  function finish() {
    if (state === DONE) return;
    state = DONE;
    cancelAnimationFrame(raf);
    ac.abort();
    el.remove();
    inerted.forEach((n) => n.removeAttribute("inert"));
    if (stage) stage.style.opacity = "";
    if (shown) shown.cancel(); // its end state is the page's own
    root.classList.remove("splash-pending", "rvs-live");
    // focus back to the page start (the next Tab reaches "Skip to content")
    body.tabIndex = -1;
    body.dataset.rvsFocus = "";
    body.focus({ preventScroll: true });
    body.addEventListener("blur", () => { body.removeAttribute("tabindex"); delete body.dataset.rvsFocus; }, { once: true });
    root.classList.add("is-ready");
    dispatchEvent(new Event("rvp:intro-done"));
  }

  // canvas: brass stars (closed-form paths: burst with drag, drift, the impact's shove) and ripples
  const K = 3.2, TI = (IMPACT - BURST) / 1000, COLORS = ["#e2be7c", "#eb8f08", "#f9eed5"], TAU = Math.PI * 2;
  const RINGS = [[0, .75, .4, 1.1, 9, .95], [.08, .95, .42, 1.25, 4.5, .8], [.16, 1.05, .45, 1.35, 2.5, .7]]; // delay, life (s), from (B), to (R), width, alpha
  const pos = (s, u) => {
    const e = 1 - Math.exp(-K * u), v = u - TI, ei = v > 0 ? 1 - Math.exp(-K * v) : 0;
    return [s.x + s.vx * e + s.dx * u + s.ix * ei, s.y + s.vy * e + s.dy * u + s.iy * ei];
  };
  function makeStars() {
    const { W, H, cx, cy, B, R } = L, out = [], rnd = Math.random;
    const spr = COLORS.map((c) => {
      const s = document.createElement("canvas"), x = s.getContext("2d");
      s.width = s.height = 64;
      x.shadowColor = x.fillStyle = c;
      x.shadowBlur = 9;
      x.setTransform(1.7, 0, 0, 1.7, 11.6, 11.6);
      x.fill(new Path2D(STAR));
      return s;
    });
    for (let i = 0, n = Math.round(Math.max(48, Math.min(110, W * H / 12000))); i < n; i++) {
      const an = rnd() * TAU, ux = Math.cos(an), uy = Math.sin(an), z = rnd(), r0 = B * .08 * rnd(), dist = R * (.1 + .95 * rnd() ** .75), drift = 6 + 10 * rnd();
      const c = rnd() < .14 ? 1 : rnd() < .16 ? 2 : 0;
      const s = { x: cx + ux * r0, y: cy + uy * r0, vx: ux * dist, vy: uy * dist, dx: ux * drift, dy: uy * drift, ix: 0, iy: 0, img: spr[c], col: COLORS[c],
        size: (5 + 18 * rnd() ** 2.3) * (P ? .85 : 1) * (.7 + .3 * z), al: .65 + .35 * z, rot: rnd() * 6.28, spin: (rnd() - .5) * 7, tw: 3 + 5 * rnd(), ph: rnd() * 6.28 };
      const [qx, qy] = pos(s, TI), d = Math.hypot(qx - cx, qy - cy) || 1, push = B * .4 * Math.max(0, 1 - d / R) / d; // nearer, harder
      s.ix = (qx - cx) * push;
      s.iy = (qy - cy) * push;
      out.push(s);
    }
    return out;
  }
  function draw(t) {
    const { W, H, cx, cy, B, R } = L, tb = (t - BURST) / 1000, ti = (t - IMPACT) / 1000, grow = 1 + .7 * Math.exp(-6 * tb), k = FXS;
    g.setTransform(k, 0, 0, k, 0, 0);
    g.clearRect(0, 0, W, H);
    if (tb <= 0) return;
    for (const s of stars) {
      const [x, y] = pos(s, tb), r = s.rot + s.spin * tb, c = Math.cos(r) * k, n = Math.sin(r) * k, h = s.size * grow * .784;
      const al = Math.min(1, tb * 14) * s.al * (.75 + .25 * Math.sin(s.tw * tb + s.ph));
      if (tb < .6) { // streaks while they fly out
        const [x0, y0] = pos(s, Math.max(0, tb - .05));
        g.setTransform(k, 0, 0, k, 0, 0);
        g.globalAlpha = al * (1 - tb / .6) * .7;
        g.strokeStyle = s.col;
        g.lineWidth = Math.max(1, s.size * .16);
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x, y);
        g.stroke();
      }
      g.globalAlpha = al;
      g.setTransform(c, n, -n, c, x * k, y * k);
      g.drawImage(s.img, -h, -h, h * 2, h * 2);
    }
    g.setTransform(k, 0, 0, k, 0, 0);
    // ripples off the impact: Ripple blue, brass on the lit (upper) side
    for (const [d, dur, r0, r1, w0, alpha] of RINGS) {
      const p = (ti - d) / dur;
      if (p <= 0 || p >= 1) continue;
      const a = (1 - p) ** 1.4 * alpha, w = w0 * (1 - .6 * p) + .75, r = B * r0 + (R * r1 - B * r0) * (1 - (1 - p) ** 3);
      for (const [rr, a0, a1, lw, col] of [[r, 0, TAU, w, `rgba(62,149,186,${a * .85})`], [r - w * .7, 1.04 * Math.PI, 1.96 * Math.PI, Math.max(1, w * .45), `rgba(226,190,124,${a})`]]) {
        g.lineWidth = lw;
        g.strokeStyle = col;
        g.beginPath();
        g.arc(cx, cy, Math.max(0, rr), a0, a1);
        g.stroke();
      }
    }
    g.globalAlpha = 1;
  }

  // drawn once and scaled up as one layer (cheap to turn on the compositor): a Pond Blue glow,
  // tileable water caustics around the badge (after Dave Hoskins) and the Ripple rays
  function drawField() {
    const n = field.width = field.height = 768, x = field.getContext("2d"), r = n / 2, k = n / parseFloat(field.style.width), pr = Math.round(Math.min(r, L.B * 1.3 * k));
    x.translate(r, r);
    const gl = x.createRadialGradient(0, 0, 0, 0, 0, L.B * .95 * k);
    [[0, "rgba(10,90,124,.9)"], [.52, "rgba(3,71,100,.5)"], [1, "rgba(3,71,100,0)"]].forEach(([o, c]) => gl.addColorStop(o, c));
    x.fillStyle = gl;
    x.fillRect(-r, -r, n, n);
    const T = 128, t = document.createElement("canvas"), tx = t.getContext("2d"), im = tx.createImageData(T, T), d = document.createElement("canvas"), dx = d.getContext("2d"), sc = L.B * .7 * k / T;
    t.width = t.height = T;
    for (let j = 0; j < T * T; j++) {
      const p0 = (j % T) / T * TAU - 250, p1 = ((j / T) | 0) / T * TAU - 250;
      let i0 = p0, i1 = p1, s = 1;
      for (let q = 0; q < 4; q++) {
        const tt = 7 * (1 - 3.5 / (q + 1)), a = i0;
        i0 = p0 + Math.cos(tt - a) + Math.sin(tt + i1);
        i1 = p1 + Math.sin(tt - i1) + Math.cos(tt + a);
        s += 1 / Math.hypot(p0 / (Math.sin(i0 + tt) / .005), p1 / (Math.cos(i1 + tt) / .005));
      }
      im.data.set([200, 236, 248, Math.min(1, Math.abs(1.17 - (s / 4) ** 1.4) ** 8) * 255], j * 4);
    }
    tx.putImageData(im, 0, 0);
    d.width = d.height = 2 * pr;
    dx.fillStyle = dx.createPattern(t, "repeat");
    dx.scale(sc, sc);
    dx.fillRect(0, 0, 2 * pr / sc, 2 * pr / sc);
    dx.setTransform(1, 0, 0, 1, pr, pr);
    fade(dx, pr, [[.32, 1], [.6, .55], [1, 0]]);
    x.globalAlpha = .6;
    x.drawImage(d, -pr, -pr);
    const rays = document.createElement("canvas"), rx = rays.getContext("2d");
    rays.width = rays.height = n;
    rx.translate(r, r);
    rx.fillStyle = "rgba(62,149,186,.15)";
    for (let i = 0; i < 30; i++) { rx.beginPath(); rx.moveTo(0, 0); rx.arc(0, 0, r, i * TAU / 30, (i + .31) * TAU / 30); rx.fill(); }
    fade(rx, r, [[.09, 1], [.46, .45], [.95, 0]]);
    x.globalAlpha = 1;
    x.drawImage(rays, -r, -r);
  }
  function fade(x, r, stops) {
    const gr = x.createRadialGradient(0, 0, 0, 0, 0, r);
    for (const [o, a] of stops) gr.addColorStop(o, `rgba(0,0,0,${a})`);
    x.globalCompositeOperation = "destination-in";
    x.fillStyle = gr;
    x.fillRect(-r, -r, 2 * r, 2 * r);
  }
  // a worn, speckled ink texture for the stamped lettering (used as a mask)
  function inkMask() {
    const s = 200, c = document.createElement("canvas"), x = c.getContext("2d"), rnd = Math.random;
    c.width = c.height = s * DPR;
    x.scale(DPR, DPR);
    x.fillRect(0, 0, s, s);
    x.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 752; i++) { // pits, then soft patches of thin ink; wrapped, so the tile is seamless
      const qx = rnd() * s, qy = rnd() * s, soft = i > 739, r = soft ? 12 + rnd() * 28 : .3 + rnd() ** 5 * 2.6;
      x.globalAlpha = soft ? .28 : .3 + rnd() * .7;
      if (soft) { const gr = x.createRadialGradient(qx, qy, 0, qx, qy, r); gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; }
      for (const ox of [0, -s]) for (const oy of [0, -s]) { x.beginPath(); x.arc(qx + ox, qy + oy, r, 0, 6.3); x.fill(); }
    }
    return c.toDataURL();
  }
})();
