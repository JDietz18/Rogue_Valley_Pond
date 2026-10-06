// Rogue Valley Ponds & Handyman: shared page behavior — phone links, photo slots,
// the footer year, and (on the landing page) the pond year marker.
(() => {
  const cfg = window.RVP_CONFIG || {};
  const phone = cfg.phone || "541-761-6681";
  const tz = cfg.timeZone || "America/Los_Angeles";

  // ── Phone number everywhere ────────────────────────────────────────────
  for (const el of document.querySelectorAll(".js-phone")) el.textContent = phone;
  for (const a of document.querySelectorAll(".js-phone-link")) a.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
  for (const el of document.querySelectorAll(".js-year")) el.textContent = new Date().getFullYear();

  // ── Photo slots: show a labeled placeholder until the file exists ──────
  for (const fig of document.querySelectorAll(".photo[data-slot]")) {
    const img = fig.querySelector("img");
    if (!img) continue;
    const miss = () => fig.classList.add("is-missing");
    if (img.complete && img.naturalWidth === 0) miss();
    img.addEventListener("error", miss, { once: true });
  }


  // ── Animated koi badge: plays muted when on screen, respects reduced motion,
  //    and falls back to the still poster on any failure ────────────────────
  for (const root of document.querySelectorAll("[data-anim-logo]")) {
    const video = root.querySelector("video");
    const toggle = root.querySelector("[data-anim-toggle]");
    if (!video || !toggle) continue;
    const calm = matchMedia("(prefers-reduced-motion: reduce)");
    let wants = !calm.matches, inView = true, failed = false;
    const label = () => {
      toggle.querySelector("span").textContent = wants ? "Pause animation" : "Play animation";
      toggle.querySelector(".ph").className = `ph ${wants ? "ph-pause" : "ph-play"}`;
      toggle.setAttribute("aria-pressed", String(wants));
    };
    const sync = async () => {
      label();
      if (failed || !wants || !inView || document.hidden) { video.pause(); return; }
      if (!video.getAttribute("src")) {
        const small = innerWidth <= 820 || navigator.connection?.saveData;
        const ext = video.canPlayType('video/mp4; codecs="avc1.42E01E"') ? "mp4" : "webm";
        video.src = `${(small && video.dataset.srcSmall) || video.dataset.src}.${ext}`;
      }
      try { await video.play(); root.classList.add("is-playing"); }
      catch (err) { if (err.name !== "AbortError") { wants = false; label(); } }
    };
    video.addEventListener("error", () => { failed = true; root.classList.remove("is-playing"); toggle.hidden = true; });
    toggle.addEventListener("click", () => { wants = !wants; sync(); });
    document.addEventListener("visibilitychange", sync);
    calm.addEventListener?.("change", () => { wants = !calm.matches; sync(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { threshold: 0.01 }).observe(root);
    }
    toggle.hidden = false;
    sync();
  }

  // ── Pond year: mark the current month and season (Grants Pass time) ────
  const bar = document.getElementById("year-bar");
  if (!bar) return;
  const SEASON_TEXT = {
    winter: "Keep a hole open in the ice on freezing nights",
    spring: "Spring cleanouts and pump restarts",
    plant: "Planting and balancing the water",
    summer: "Top-offs, algae control and aeration",
    leaf: "Leaf netting and skimmer cleanouts",
  };
  const part = (opt) => new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opt }).format(new Date());
  const month = Number(part({ month: "numeric" }));
  const day = Number(part({ day: "numeric" }));
  const monthName = part({ month: "long" });
  let seasonKey = "winter";
  for (const s of bar.querySelectorAll(".season")) {
    if (s.dataset.months.split(" ").map(Number).includes(month)) {
      s.classList.add("is-now");
      seasonKey = s.dataset.season;
    }
  }
  document.querySelector(`.season-notes [data-season="${seasonKey}"]`)?.classList.add("is-now");
  const marker = document.getElementById("now-marker");
  marker.style.setProperty("--at", `${((month - 1 + (day - 1) / 31) / 12) * 100}%`);
  marker.querySelector("span").textContent = `Now: ${monthName}`;
  if (month >= 10) marker.querySelector("span").style.cssText = "left:auto;right:6px";
  marker.hidden = false;
  for (const el of document.querySelectorAll(".js-pond-now")) el.textContent = SEASON_TEXT[seasonKey];
})();
