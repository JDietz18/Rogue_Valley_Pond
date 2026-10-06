// Rogue Valley Ponds & Handyman: phone links, the pond ripples, the pond year, and the quote form.
(() => {
  const cfg = window.RVP_CONFIG || {};
  const phone = cfg.phone || "541-761-6681";
  const $ = (id) => document.getElementById(id);
  const calm = matchMedia("(prefers-reduced-motion: reduce)");

  // ── Phone number everywhere ────────────────────────────────────────────
  for (const el of document.querySelectorAll(".js-phone")) el.textContent = phone;
  for (const a of document.querySelectorAll(".js-phone-link")) a.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
  $("year-now").textContent = new Date().getFullYear();

  // ── Pond year: mark the current month and season (in Grants Pass time) ──
  const SEASON_TEXT = {
    winter: "Keep a hole open in the ice on freezing nights",
    spring: "Spring cleanouts and pump restarts",
    plant: "Planting and balancing the water",
    summer: "Top-offs, algae control and aeration",
    leaf: "Leaf netting and skimmer cleanouts",
  };
  const now = new Date();
  const month = Number(new Intl.DateTimeFormat("en-US", { timeZone: cfg.timeZone || "America/Los_Angeles", month: "numeric" }).format(now));
  const day = Number(new Intl.DateTimeFormat("en-US", { timeZone: cfg.timeZone || "America/Los_Angeles", day: "numeric" }).format(now));
  const monthName = new Intl.DateTimeFormat("en-US", { timeZone: cfg.timeZone || "America/Los_Angeles", month: "long" }).format(now);
  let seasonKey = "winter";
  for (const s of document.querySelectorAll(".season")) {
    if (s.dataset.months.split(" ").map(Number).includes(month)) {
      s.classList.add("is-now");
      seasonKey = [...s.classList].find((c) => c.startsWith("s-")).slice(2).replace(/-[ab]$/, "");
    }
  }
  document.querySelector(`.season-notes [data-season="${seasonKey}"]`)?.classList.add("is-now");
  const marker = $("now-marker");
  marker.style.setProperty("--at", `${((month - 1 + (day - 1) / 31) / 12) * 100}%`);
  $("now-label").textContent = `Now: ${monthName}`;
  marker.hidden = false;
  if (month >= 11 || month <= 1) marker.querySelector("span").style.cssText = "left:auto;right:6px";
  $("pond-now").textContent = SEASON_TEXT[seasonKey];

  // ── Ripples on the hero pond ───────────────────────────────────────────
  const canvas = document.querySelector(".pond-canvas");
  const ctx = canvas.getContext("2d");
  let rings = [], running = false, last = 0, nextDrop = 0;
  const colorOf = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#7fd0c8";

  function size() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    if (!running) drawStill();
  }
  function drop(x, y) {
    const W = canvas.width;
    rings.push({ x: x ?? W * (0.2 + Math.random() * 0.6), y: y ?? canvas.height * (0.18 + Math.random() * 0.5), age: 0, life: 3200 + Math.random() * 1600, max: W * (0.22 + Math.random() * 0.18) });
  }
  // Three koi on slow figure-eight paths. Each: [x radius, y radius, speed, phase, colors].
  const KOI = [
    [0.30, 0.20, 0.00011, 0.0, ["#e8743b", "#f4efe6"]],
    [0.24, 0.26, 0.00009, 2.1, ["#f4efe6", "#d9472b"]],
    [0.34, 0.16, 0.00013, 4.2, ["#e9a93a", "#f6e7c4"]],
  ];
  function koiAt(k, t) {
    const [ax, ay, w, ph] = k, W = canvas.width, H = canvas.height;
    const a = w * t + ph;
    const x = W * (0.5 + ax * Math.sin(a)), y = H * (0.42 + ay * Math.sin(2 * a) * 0.9);
    const dx = ax * W * Math.cos(a), dy = ay * H * 1.8 * Math.cos(2 * a);
    return { x, y, heading: Math.atan2(dy, dx) };
  }
  function drawKoi(k, t) {
    const { x, y, heading } = koiAt(k, t), L = canvas.width * 0.11, [body, patch] = k[4];
    const wag = Math.sin(t * 0.006 + k[3]) * 0.35;
    ctx.save();
    ctx.translate(x, y + L * 0.18);                       // soft shadow on the pond floor
    ctx.rotate(heading); ctx.globalAlpha = 0.25; ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(0, 0, L * 0.5, L * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(x, y); ctx.rotate(heading); ctx.globalAlpha = 0.92;
    ctx.fillStyle = body;                                  // tail fin, wagging
    ctx.beginPath(); ctx.moveTo(-L * 0.42, 0);
    ctx.quadraticCurveTo(-L * 0.62, -L * 0.2 + wag * L * 0.2, -L * 0.72, -L * 0.18 + wag * L * 0.25);
    ctx.quadraticCurveTo(-L * 0.6, wag * L * 0.1, -L * 0.72, L * 0.18 + wag * L * 0.25);
    ctx.quadraticCurveTo(-L * 0.62, L * 0.2 + wag * L * 0.2, -L * 0.42, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, L * 0.46, L * 0.15, 0, 0, Math.PI * 2); ctx.fill();   // body
    ctx.fillStyle = patch;                                 // markings
    ctx.beginPath(); ctx.ellipse(L * 0.18, -L * 0.02, L * 0.14, L * 0.09, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-L * 0.15, L * 0.03, L * 0.1, L * 0.07, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = body;                                  // pectoral fins
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.ellipse(L * 0.16, -L * 0.17, L * 0.09, L * 0.04, -0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(L * 0.16, L * 0.17, L * 0.09, L * 0.04, 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  let clock = 0;
  function paint(dt) {
    const W = canvas.width, H = canvas.height, color = colorOf("--pond-ripple");
    ctx.clearRect(0, 0, W, H);
    clock += dt;
    for (const k of KOI) drawKoi(k, clock + 40000);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color; ctx.lineCap = "round";
    rings = rings.filter((r) => (r.age += dt) < r.life);
    for (const r of rings) {
      const t = r.age / r.life;
      for (let k = 0; k < 3; k++) {                // each drop sends out three rings
        const tk = t - k * 0.12;
        if (tk <= 0) continue;
        const rad = r.max * (1 - Math.pow(1 - tk, 2.2));
        ctx.globalAlpha = Math.max(0, (1 - tk) * (0.55 - k * 0.14));
        ctx.lineWidth = Math.max(1, (W / 300) * (1 - tk * 0.6));
        ctx.beginPath(); ctx.ellipse(r.x, r.y, rad, rad * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  function drawStill() {                           // reduced motion: a few resting rings
    rings = [];
    [[0.36, 0.34, 0.35], [0.66, 0.5, 0.5]].forEach(([fx, fy, t]) => { drop(canvas.width * fx, canvas.height * fy); rings.at(-1).age = rings.at(-1).life * t; });
    paint(0);
  }
  function frame(t) {
    if (!running) return;
    const dt = Math.min(t - (last || t), 50); last = t;
    if (t >= nextDrop) { drop(); nextDrop = t + 900 + Math.random() * 1400; }
    paint(dt);
    requestAnimationFrame(frame);
  }
  function start() { if (running || calm.matches || document.hidden) return; running = true; last = 0; requestAnimationFrame(frame); }
  function stop() { running = false; }
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(canvas);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  calm.addEventListener?.("change", () => (calm.matches ? (stop(), drawStill()) : start()));
  canvas.parentElement.addEventListener("pointerdown", (e) => {   // tap the pond to make a ripple
    if (calm.matches) return;
    const r = canvas.getBoundingClientRect(), s = canvas.width / r.width;
    drop((e.clientX - r.left) * s, (e.clientY - r.top) * s);
  });

  // ── Quote form ─────────────────────────────────────────────────────────
  const form = $("quote-form");
  const JOB_LABELS = { pond: "New pond or remodel", "water-feature": "Waterfall or fountain", "pond-care": "Pond cleaning or repair", koi: "Koi or fish care", handyman: "Handyman work", "not-sure": "Not sure" };

  function showError(msg) { $("form-error").textContent = msg; $("form-error").hidden = false; }
  function values() {
    const f = form.elements;
    return { job: f.job.value, details: f.details.value.trim(), name: f.name.value.trim(), phone: f.phone.value.trim(),
             town: f.town.value.trim(), best: f.best.value, email: f.email.value.trim() };
  }
  function validate(v) {
    let first = null;
    const mark = (el, bad) => { el.setAttribute("aria-invalid", String(bad)); if (bad && !first) first = el; };
    mark(form.querySelector(".job-types"), !v.job);
    for (const id of ["q-details", "q-name", "q-phone", "q-email"]) { const el = $(id); el.value = el.value.trim(); mark(el, !el.checkValidity()); }
    if (first) {
      (first.matches("fieldset") ? first.querySelector("input") : first).focus();
      showError(!v.job ? "Pick the kind of job." : "Please fill in the job, your name and a phone number.");
    }
    return !first;
  }
  function requestText(v) {
    return [`Quote request for Rogue Valley Ponds & Handyman`, `Job: ${JOB_LABELS[v.job] || v.job}`, v.details,
      `Name: ${v.name}`, `Phone: ${v.phone}`, v.town && `Town: ${v.town}`, v.best && `Best time: ${v.best}`, v.email && `Email: ${v.email}`]
      .filter(Boolean).join("\n");
  }
  async function send(v) {
    const res = await fetch(`${cfg.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/submit_quote_request`, {
      method: "POST",
      headers: { apikey: cfg.supabaseKey, "Content-Type": "application/json",
        ...(cfg.supabaseKey.startsWith("eyJ") ? { Authorization: `Bearer ${cfg.supabaseKey}` } : {}) },
      body: JSON.stringify({ p_name: v.name, p_phone: v.phone, p_job_type: v.job, p_details: v.details,
        p_email: v.email || null, p_town: v.town || null, p_best_time: v.best || null }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) { const err = new Error((data && data.message) || "send failed"); err.hint = data && data.hint; err.http = res.status; throw err; }
    return data;
  }

  form.addEventListener("input", () => { $("form-error").hidden = true; });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = values();
    if (!validate(v)) return;
    const btn = $("q-submit");
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      if (!cfg.supabaseUrl || !cfg.supabaseKey) throw new Error("not configured");
      await send(v);
      $("done-title").textContent = `Thanks, ${v.name.split(" ")[0]}. Robert will call ${v.phone}.`;
      form.hidden = true; $("quote-done").hidden = false; $("quote-done").focus();
    } catch (err) {
      if (err.hint === "rate_limited" || (err.http && err.http < 500 && err.http !== 401 && err.http !== 404)) {
        showError(err.hint === "rate_limited" ? `That’s a lot of requests from one number. Please call or text Robert at ${phone}.` : `${err.message}. Please check the form, or call or text ${phone}.`);
      } else {
        form.hidden = true; $("quote-fallback").hidden = false; $("quote-fallback").focus?.();
      }
    } finally {
      btn.disabled = false; btn.textContent = "Send request";
    }
  });
  $("quote-again").addEventListener("click", () => {
    form.reset(); form.hidden = false; $("quote-done").hidden = true;
    for (const el of form.querySelectorAll("[aria-invalid]")) el.removeAttribute("aria-invalid");
    form.querySelector('input[name="job"]').focus();
  });
  $("fallback-back").addEventListener("click", () => { $("quote-fallback").hidden = true; form.hidden = false; });
  $("copy-request").addEventListener("click", async () => {
    const text = requestText(values());
    try {
      await navigator.clipboard.writeText(text);
      $("copy-status").textContent = "Copied. Paste it into a text to Robert.";
    } catch {
      const pre = document.createElement("textarea");
      pre.value = text; pre.readOnly = true; pre.rows = 6; pre.style.width = "100%";
      $("copy-status").replaceChildren("Select and copy this:", pre);
      pre.focus(); pre.select();
    }
  });
})();
