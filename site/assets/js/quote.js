// Rogue Valley Ponds & Handyman: the quote request form.
// Sends to the Supabase RPC `submit_quote_request`; if that fails, offers to copy the
// request so it can be texted to Robert instead.
(() => {
  const cfg = window.RVP_CONFIG || {};
  const phone = cfg.phone || "541-761-6681";
  const $ = (id) => document.getElementById(id);
  const form = $("quote-form");
  if (!form) return;

  const JOB_LABELS = { pond: "New pond or remodel", "water-feature": "Waterfall or fountain", "pond-care": "Pond cleaning or repair",
    koi: "Koi or fish care", handyman: "Handyman work", "not-sure": "Not sure" };

  // Preselect the job type from a landing-page link, e.g. quote.html?job=koi
  const preset = new URLSearchParams(location.search).get("job");
  if (preset && JOB_LABELS[preset]) form.querySelector(`input[name="job"][value="${preset}"]`).checked = true;

  function showError(msg) { $("form-error").textContent = msg; $("form-error").hidden = false; }
  function values() {
    const f = form.elements;
    return { job: f.job.value, details: f.details.value.trim(), name: f.name.value.trim(), phone: f.phone.value.trim(),
             town: f.town.value.trim(), best: f.best.value, email: f.email.value.trim() };
  }
  function validate(v) {
    let first = null;
    const mark = (el, bad) => { el.setAttribute("aria-invalid", String(bad)); if (bad && !first) first = el; };
    mark(form.querySelector(".chips"), !v.job);
    for (const id of ["q-details", "q-name", "q-phone", "q-email"]) { const el = $(id); el.value = el.value.trim(); mark(el, !el.checkValidity()); }
    if (first) {
      (first.matches(".chips") ? first.querySelector("input") : first).focus();
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
  function show(id) {
    for (const el of [form, $("quote-done"), $("quote-fallback")]) el.hidden = el.id !== id;
    const el = $(id); el.focus?.();
  }

  form.addEventListener("input", (e) => {
    $("form-error").hidden = true;
    e.target.closest("[aria-invalid]")?.removeAttribute("aria-invalid");
  });
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
      show("quote-done");
    } catch (err) {
      if (err.hint === "rate_limited" || (err.http && err.http < 500 && err.http !== 401 && err.http !== 404)) {
        showError(err.hint === "rate_limited" ? `That’s a lot of requests from one number. Please call or text Robert at ${phone}.` : `${err.message}. Please check the form, or call or text ${phone}.`);
      } else {
        show("quote-fallback");
      }
    } finally {
      btn.disabled = false; btn.textContent = "Send request";
    }
  });
  $("quote-again").addEventListener("click", () => {
    form.reset(); show("quote-form");
    for (const el of form.querySelectorAll("[aria-invalid]")) el.removeAttribute("aria-invalid");
    form.querySelector('input[name="job"]').focus();
  });
  $("fallback-back").addEventListener("click", () => show("quote-form"));
  $("copy-request").addEventListener("click", async () => {
    const text = requestText(values());
    try {
      await navigator.clipboard.writeText(text);
      $("copy-status").textContent = "Copied. Paste it into a text to Robert.";
    } catch {
      const pre = document.createElement("textarea");
      pre.className = "input"; pre.value = text; pre.readOnly = true; pre.rows = 6;
      $("copy-status").replaceChildren("Select and copy this:", pre);
      pre.focus(); pre.select();
    }
  });
})();
