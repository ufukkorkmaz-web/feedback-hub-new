/* ============ SETTINGS ============ */
// Where submissions are sent (see README). Google Apps Script web-app URL or Formspree URL.
const FORM_ENDPOINT = "https://formspree.io/f/xbglqzql";

// Only school emails from this domain can open the questions
const ALLOWED_EMAIL_DOMAIN = "bilfen.k12.tr";
const EMAIL_WARNING = "Please enter with your Bilfen credentials. Your school email must end with @" + ALLOWED_EMAIL_DOMAIN + ".";
const EMAIL_RE = new RegExp("^[^\\s@]+@" + ALLOWED_EMAIL_DOMAIN.replace(/\./g, "\\.") + "$", "i");

const YEARS = {
  year6: {
    label: "Year 6", logo: "assets/logo-year6.png", logoAlt: "Year 7 IPT school badge logo", kicker: "YEAR 6 IPT",
    title: "Teaching feedback, brightly collected.",
    intro: "Dear colleagues, please complete this form after teaching Year 6 IPT. Your reflections, ideas, and suggestions help us improve together.",
    emailHelp: "Your designated school email will be included with this Year 6 response. Please enter your email to proceed.",
    workedHelp: "Celebrate the strongest topic, strategy, or classroom moment from Year 6.",
    workedQ: "What was the best topic for you and your Year 6 classes? *",
    planHelp: "Your ideas can make future Year 6 weeks clearer, smoother, and more impactful.",
    planQ: "What would you change in this Year 6 plan? How would you change it? *",
    pulseHelp: "Choose the score that best represents your Year 6 teaching experience.",
    slider: "Move the bright slider from very unclear to very clear.",
    note: "* Indicates a required response. Thank you for sharing your expertise.",
    backBtn: "background:#fff;color:#075782;", submitBtn: "background:linear-gradient(135deg,#fff15d,#35c9f4);color:#073d67;",
    submitTxt: "#073d67", boxCls: "border-white/30 bg-white/15", outCls: "bg-white/60", accent: "accent-sky-600"
  },
  year7: {
    label: "Year 7", logo: "assets/logo-year7.png", logoAlt: "Year 7 IPT school badge logo", kicker: "YEAR 7 IPT",
    title: "Teaching feedback, thoughtfully collected.",
    intro: "Dear colleagues, please complete this form after teaching. Your reflections, ideas, and suggestions help us improve together.",
    emailHelp: "Your designated school email will be included with this response. Please enter your email to proceed with the feedback form.",
    workedHelp: "Celebrate the strongest topic, strategy, or classroom moment from this year.",
    workedQ: "What was the best topic for you and your classes? *",
    planHelp: "Your ideas can make future weeks clearer, smoother, and more impactful.",
    planQ: "What would you change in this year's plan? How would you change it? *",
    pulseHelp: "Choose the score that best represents your Week 01 teaching experience.",
    slider: "Move the glass slider from very unclear to very clear.",
    note: "* Indicates a required response. Thank you for taking the time to share your expertise.",
    backBtn: "background:#173f78;color:#f4f9ff;", submitBtn: "background:linear-gradient(135deg,#52d9ca,#658ff1);color:#06214e;",
    submitTxt: "#06214e", boxCls: "border-white/15 bg-slate-950/20", outCls: "bg-teal-200/15", accent: "accent-teal-300"
  }
};

const SCORES = {
  overall: ["Needs significant improvement", "Needs improvement", "Satisfactory", "Very good", "Excellent"],
  resources: ["Not effective", "Slightly effective", "Moderately effective", "Effective", "Highly effective"],
  engagement: ["Very low engagement", "Low engagement", "Moderate engagement", "High engagement", "Very high engagement"]
};

/* ============ RENDERING ============ */
const card = (y, id, icon, title, help, q) => `
  <section class="question-section reflection-card glass-panel rounded-[24px] p-5 sm:p-7">
    <div class="mb-5 flex gap-4"><div class="icon-bubble"><i data-lucide="${icon}"></i></div>
      <div><h2 class="t-title" style="font-size:24px;">${title}</h2><p class="t-help mt-1">${help}</p></div></div>
    <div class="mb-2 flex items-start justify-between gap-3">
      <label for="${y}-${id}" class="t-label block text-sm">${q}</label>
      <span class="dictate-wrap"><button type="button" class="dictate-btn" data-dictate-for="${y}-${id}" aria-label="Start dictation" aria-pressed="false"><i data-lucide="mic" aria-hidden="true"></i><span>Speak</span></button><span class="dictate-glow" aria-hidden="true"></span></span>
    </div>
    <textarea id="${y}-${id}" class="field" required></textarea>
    <span class="dictation-feedback t-help" role="status" aria-live="polite"></span>
  </section>`;

const select = (y, id, label) => `
  <div><label for="${y}-${id}" class="t-label mb-2 block text-sm">${label} *</label>
    <select id="${y}-${id}" class="field" required><option value="" selected disabled>Select a score</option>
    ${SCORES[id].map((t, i) => `<option value="${i + 1}">${i + 1} — ${t}</option>`).join("")}</select></div>`;

function renderYear(y, c) {
  document.getElementById(y + "-view").innerHTML = `
  <div class="w-full px-4 pt-7 sm:px-7 sm:pt-10">
    <header class="year-header glass-panel mx-auto max-w-5xl rounded-[28px] px-6 py-7 sm:px-10 sm:py-9">
      <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button id="back-${y}" type="button" class="mb-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 font-bold" style="${c.backBtn}"><i data-lucide="arrow-left" aria-hidden="true"></i><span>Back to menu</span></button>
          <p class="t-kicker mb-2 uppercase">${c.kicker}</p>
          <h1 class="t-title" style="font-size:32px;">${c.title}</h1>
          <p class="t-intro mt-3 max-w-2xl">${c.intro}</p>
        </div>
        <img class="h-28 w-28 self-start object-contain sm:self-auto" src="${c.logo}" alt="${c.logoAlt}">
      </div>
    </header>
  </div>
  <div class="w-full px-4 pb-10 pt-5 sm:px-7 sm:pb-14">
    <form id="${y}-form" class="form-shell mx-auto max-w-5xl space-y-5" novalidate>
      <section class="glass-panel rounded-[24px] p-5 sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div class="min-w-0 flex-1"><label for="${y}-email" class="t-label mb-2 block">Email</label>
            <input id="${y}-email" class="field" type="email" required autocomplete="email" placeholder="Enter your school email address"></div>
          <div class="min-w-0 flex-1"><label for="${y}-week" class="t-label mb-2 block">Week</label>
            <input id="${y}-week" class="field" type="text" required autocomplete="off" placeholder="Enter week"></div>
          <p class="t-help max-w-xs text-sm leading-relaxed">${c.emailHelp}</p>
        </div>
        <p id="${y}-email-warn" class="email-warn" role="alert" hidden></p>
      </section>
      ${card(y, "worked", "thumbs-up", "What worked well?", c.workedHelp, c.workedQ)}
      ${card(y, "challenge", "frown", "What didn't work?", "Share the challenge, why it happened, and how you responded or improved it.", "What didn't work? Why? How did you handle the problem? *")}
      ${card(y, "plan", "lightbulb", "Shape the next plan", c.planHelp, c.planQ)}
      <section class="question-section glass-panel rounded-[24px] p-5 sm:p-7">
        <div class="mb-6 flex gap-4"><div class="icon-bubble"><i data-lucide="bar-chart-3"></i></div>
          <div><h2 class="t-title" style="font-size:24px;">Quick pulse check</h2><p class="t-help mt-1">${c.pulseHelp}</p></div></div>
        <div class="grid gap-5 md:grid-cols-2">
          ${select(y, "overall", "Overall rating of the week")}
          ${select(y, "resources", "Effectiveness of teaching resources")}
          ${select(y, "engagement", "Student engagement with content and activities")}
          <div class="rounded-2xl border ${c.boxCls} p-4">
            <div class="flex items-start justify-between gap-4">
              <div><label for="${y}-clarity" class="t-label block text-sm">Learning objectives: clarity and ease of understanding</label>
                <p class="t-help mt-1" style="font-size:13px;">${c.slider}</p></div>
              <output id="${y}-output" class="rounded-xl ${c.outCls} px-3 py-1 text-sm font-bold">3 / 5</output>
            </div>
            <input id="${y}-clarity" class="mt-4 w-full ${c.accent}" type="range" min="1" max="5" value="3">
            <div class="flex justify-between text-xs"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
          </div>
        </div>
      </section>
      ${card(y, "notes", "sparkles", "One more thought", "Recommendations, ideas, and observations are always welcome.", "Any other notes or recommendations? *")}
      <section class="question-section glass-panel rounded-[24px] p-5 sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="t-note">${c.note}</p>
          <button class="inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-bold shadow-lg" type="submit" style="${c.submitBtn}"><i data-lucide="send"></i><span style="color:${c.submitTxt};">Submit feedback</span></button>
        </div>
        <p id="${y}-status" class="mt-4 min-h-6 text-sm font-medium" aria-live="polite"></p>
      </section>
    </form>
  </div>`;
}

/* ============ BEHAVIOUR ============ */
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupForm(y) {
  const form = document.getElementById(y + "-form"), email = document.getElementById(y + "-email");
  const sections = form.querySelectorAll(".question-section"), slider = document.getElementById(y + "-clarity");
  const output = document.getElementById(y + "-output"), status = document.getElementById(y + "-status");
  const button = form.querySelector('button[type="submit"]'), val = id => document.getElementById(`${y}-${id}`).value.trim();
  const say = (msg, ok) => { status.textContent = msg; status.className = "mt-4 min-h-6 text-sm font-medium " + (ok ? "status-success" : "status-error"); };
  const emailOk = () => email.checkValidity() && EMAIL_RE.test(email.value.trim());     // must be a valid @bilfen.k12.tr address
  const gate = () => sections.forEach(s => s.classList.toggle("revealed", emailOk()));
  const warn = document.getElementById(y + "-email-warn");
  let warnTimer = 0;
  const showWarn = () => {
    const bad = email.value.trim() !== "" && !emailOk();
    warn.hidden = !bad; warn.textContent = bad ? EMAIL_WARNING : ""; email.classList.toggle("is-warn", bad);
  };
  const clarity = () => { output.textContent = slider.value + " / 5"; slider.setAttribute("aria-valuenow", slider.value); };
  email.addEventListener("input", () => {
    gate(); clearTimeout(warnTimer);
    if (emailOk() || email.value.trim() === "") showWarn(); else warnTimer = setTimeout(showWarn, 900);   // wait until they stop typing
  });
  email.addEventListener("change", () => { gate(); clearTimeout(warnTimer); showWarn(); });
  slider.addEventListener("input", clarity); clarity();

  form.addEventListener("submit", async e => {
    e.preventDefault(); status.textContent = "";
    if (!emailOk()) { showWarn(); email.focus(); return; }
    if (!form.checkValidity()) { form.reportValidity(); return say("Please complete every required field before submitting your feedback."); }
    button.disabled = true;
    const pretty = {
      _subject: `New ${YEARS[y].label} IPT feedback (Week ${val("week")})`, email: val("email"),
      "Year level": YEARS[y].label, "Week": val("week"),
      "What worked well?": val("worked"), "What didn't work?": val("challenge"), "Shape the next plan": val("plan"),
      "Overall rating of the week (1-5)": val("overall"), "Effectiveness of teaching resources (1-5)": val("resources"),
      "Student engagement (1-5)": val("engagement"), "Learning objectives clarity (1-5)": slider.value,
      "One more thought": val("notes")
    };
    try {
      const res = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(pretty) });
      if (!res.ok) throw new Error("save");
      form.reset(); slider.value = "3"; clarity(); gate(); showWarn();
      say("Thank you — your feedback has been saved successfully.", true);
      try { celebrate(y); } catch (err) { console.error("Celebration failed:", err); }   // never affects the saved result
    } catch (err) { say("We could not confirm your submission. Please refresh before trying again."); }
    finally { button.disabled = false; }
  });
}

/* ============ DICTATION PUNCTUATION ============ */
// 1) Spoken punctuation: saying "comma", "full stop", "question mark", "new line" ... types the symbol.
//    ("period" is left alone on purpose, because teachers also say "first period" for lessons.)
// 2) Automatic clean-up: every finished phrase gets a full stop (or a question mark when it is phrased like
//    a question), every sentence starts with a capital letter, and spacing around punctuation is tidied.
const SPOKEN_PUNCTUATION = [
  ["full stop", ". "], ["question mark", "? "], ["exclamation mark", "! "], ["exclamation point", "! "],
  ["semicolon", "; "], ["semi colon", "; "], ["colon", ": "], ["comma", ", "],
  ["new paragraph", "\n\n"], ["newline", "\n"], ["new line", "\n"]
];
const AUX_VERBS = "do|does|did|can|could|would|should|will|shall|is|are|was|were|have|has|had|may|might";
// "why did ...", "how long does ...", "what was ..."  (but not "what worked well ...")
const WH_QUESTION = new RegExp("^(?:who|whom|whose|what|when|where|which|why|how)(?:\\s+(?:much|long|often|far|well|old|many\\s+\\w+))?\\s+(?:" + AUX_VERBS + ")\\b", "i");
// "can we ...", "did the students ...", "is there ..."
const AUX_QUESTION = /^(?:do|does|did|can|could|would|should|will|is|are|was|were)\s+(?:you|we|they|i|he|she|it|there|this|that|these|those|the|any|anyone|everyone|someone|my|our|your|their|a|an)\b/i;

function applySpokenPunctuation(text) {
  let out = text;
  SPOKEN_PUNCTUATION.forEach(([word, symbol]) => {
    out = out.replace(new RegExp("\\s*\\b" + word + "\\b\\s*", "gi"), symbol);
  });
  return out;
}

function looksLikeQuestion(text) {
  const parts = text.split(/[.!?\n]+\s*/).filter(part => part.trim());
  const last = (parts.length ? parts[parts.length - 1] : text).trim();
  return WH_QUESTION.test(last) || AUX_QUESTION.test(last);
}

// Joins two pieces of text: no space before punctuation or around line breaks, and a symbol you say
// replaces the full stop that was added automatically (so "full stop" never makes "..").
function joinText(base, add) {
  if (!base) return add;
  if (!add) return base;
  if (/^[,.;:?!]/.test(add)) return base.replace(/[,.;:?!]$/, "") + add;
  if (/\n$/.test(base) || /^\n/.test(add)) return base + add;
  return base + " " + add;
}

function startsSentence(text) {
  return text === "" || /[.!?]["')\]]?\s*$/.test(text) || /\n\s*$/.test(text);
}

function capitalise(text, atStart) {
  return text.replace(/(^|[.!?]["')\]]?\s+|\n\s*)([a-z])/g, (match, before, letter) =>
    before === "" && !atStart ? match : before + letter.toUpperCase());
}

// segments: [{ text, final }]  (a "segment" is one phrase between pauses). Unfinished phrases get no full stop yet.
function formatDictation(segments, startsNewSentence) {
  let out = "";
  segments.forEach(seg => {
    let t = applySpokenPunctuation(seg.text).replace(/^[ \t]+|[ \t]+$/g, "");
    if (!t) return;
    if (seg.final && !/[.!?,;:]["')\]]?$/.test(t) && !/\n$/.test(t)) t += looksLikeQuestion(t) ? "?" : ".";
    out = joinText(out, t);
  });
  return capitalise(out, startsNewSentence);
}

function setupDictation() {
  const buttons = document.querySelectorAll("[data-dictate-for]");
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    buttons.forEach(b => { b.disabled = true; b.querySelector("span").textContent = "Unavailable"; });
    return;
  }
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  let activeButton = null, activeTextarea = null, activeFeedback = null, recognition = null, wantListening = false, session = 0;

  function resetButton() {
    if (!activeButton) return;
    if (activeFeedback && activeFeedback.textContent.startsWith("Listening")) activeFeedback.textContent = "";
    activeButton.classList.remove("is-listening");
    activeButton.setAttribute("aria-pressed", "false");
    activeButton.setAttribute("aria-label", activeButton.dataset.defaultLabel);
    activeButton.querySelector("span").textContent = "Speak";
    activeButton = activeTextarea = activeFeedback = recognition = null;
    wantListening = false;
  }
  function stopDictation() {
    const rec = recognition;
    resetButton();                                   // the button turns off right away
    if (rec) { try { rec.stop(); } catch (err) {} }  // the last spoken words can still arrive
  }

  buttons.forEach(button => {
    button.dataset.defaultLabel = button.getAttribute("aria-label");
    button.addEventListener("click", () => {
      if (activeButton === button) return stopDictation();
      if (activeButton) stopDictation();             // another Speak button was on: switch it off first

      const textarea = document.getElementById(button.dataset.dictateFor);
      const feedback = textarea.parentElement.querySelector(".dictation-feedback");
      const mySession = ++session;
      let committed = textarea.value.trim();
      const write = extra => {
        textarea.value = joinText(committed, extra);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      };

      activeButton = button; activeTextarea = textarea; activeFeedback = feedback; wantListening = true;
      button.classList.add("is-listening");
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", "Stop dictation");
      button.querySelector("span").textContent = "Stop";
      feedback.textContent = "Listening… speak naturally, then press Stop. Say \"comma\", \"full stop\" or \"question mark\" to add punctuation.";
      textarea.focus();

      const begin = () => {
        const rec = new Recognition();
        recognition = rec;
        rec.lang = "en-US";
        rec.continuous = !isMobile;
        rec.interimResults = !isMobile;
        rec.onresult = event => {
          if (mySession !== session && activeTextarea === textarea) return;   // a newer session owns this box
          if (isMobile) {
            let added = false;
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (!event.results[i].isFinal) continue;
              const piece = formatDictation([{ text: event.results[i][0].transcript, final: true }], startsSentence(committed));
              if (piece) { committed = joinText(committed, piece); added = true; }
            }
            if (added) write("");
          } else {
            write(formatDictation(Array.from(event.results).map(r => ({ text: r[0].transcript, final: r.isFinal })), startsSentence(committed)));
          }
        };
        rec.onerror = event => {
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            wantListening = false;
            feedback.textContent = "Microphone access was blocked.";
          } else if (event.error !== "aborted" && event.error !== "no-speech") {
            feedback.textContent = "Voice input is unavailable.";
          }
        };
        rec.onend = () => {
          if (recognition !== rec) return;
          if (wantListening && isMobile && activeTextarea === textarea) {
            try { begin(); return; } catch (err) {}
          }
          resetButton();
        };
        rec.start();
      };
      try { begin(); } catch (err) { resetButton(); }
    });
  });

  // Clicking any other button (Back, Submit, ...) also switches dictation off
  document.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (activeButton && b && b !== activeButton && !b.hasAttribute("data-dictate-for")) stopDictation();
  });
}

/* ============ SPEAK BUTTON GLOW ============ */
// The glow only animates while it is on screen, which keeps phones smooth.
function setupDictationGlow() {
  const wraps = document.querySelectorAll(".dictate-wrap");
  if (!("IntersectionObserver" in window)) { wraps.forEach(w => w.classList.add("in-view")); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => en.target.classList.toggle("in-view", en.isIntersecting));
  }, { rootMargin: "80px" });
  wraps.forEach(w => io.observe(w));
}

/* ============ AFTER SUBMIT: CONFETTI + THANK-YOU BOX ============ */
const CONFETTI_COLORS = {
  year6: ["#fff37b", "#67e8f9", "#ffffff", "#35c9f4", "#9decE5"],
  year7: ["#52d9ca", "#658ff1", "#9decE5", "#ffffff", "#bfe3ff"]
};

// One short, light shot from both bottom corners. Skipped for people who prefer reduced motion.
function fireConfetti(colors) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas"; canvas.setAttribute("aria-hidden", "true");
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  document.body.appendChild(canvas);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const rand = (a, b) => a + Math.random() * (b - a);
  const g = H * 1.7;                                         // gravity, px per second squared
  const perSide = W < 640 ? 26 : 36;                         // fewer pieces on phones
  const pieces = [];
  [1, -1].forEach(dir => {                                   // 1 = left corner (flies right), -1 = right corner (flies left)
    for (let i = 0; i < perSide; i++) {
      const peak = rand(0.28, 0.6) * H;                      // how high this piece flies
      const vy = -Math.sqrt(2 * g * peak), airtime = (2 * -vy) / g;
      const reach = rand(0.18, 0.68) * Math.min(W * 0.8, H); // how far it travels sideways
      pieces.push({
        x: dir > 0 ? 6 : W - 6, y: H - 6, vx: dir * reach / airtime, vy,
        w: rand(6, 11), h: rand(3.5, 6.5), dot: Math.random() < 0.25,
        rot: rand(0, Math.PI * 2), vr: rand(-9, 9), flip: rand(6, 12), sway: rand(3, 7),
        color: colors[Math.floor(Math.random() * colors.length)],
        life: rand(1.9, 2.6), delay: rand(0, 0.12)
      });
    }
  });

  let last = null, t = 0;
  function frame(now) {
    if (last === null) last = now;
    const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of pieces) {
      const age = t - p.delay;
      if (age < 0) { alive = true; continue; }
      if (age > p.life) continue;
      alive = true;
      p.vy += g * dt; p.vx *= Math.exp(-0.6 * dt);
      p.x += (p.vx + Math.sin(age * p.sway) * 14) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const fadeFrom = p.life * 0.6;
      ctx.globalAlpha = age > fadeFrom ? Math.max(0, 1 - (age - fadeFrom) / (p.life - fadeFrom)) : 1;
      ctx.fillStyle = p.color;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if (p.dot) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2.6, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.scale(1, Math.cos(age * p.flip)); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      ctx.restore();
    }
    if (alive && t < 3.2) requestAnimationFrame(frame); else canvas.remove();
  }
  requestAnimationFrame(frame);
  setTimeout(() => canvas.remove(), 5000);                   // safety net
}

// Glass thank-you box. The page behind is blurred slightly until the box is closed.
function showThanks(y, returnTo) {
  if (document.querySelector(".thanks-overlay")) return;
  const c = YEARS[y];
  const overlay = document.createElement("div");
  overlay.className = "thanks-overlay";
  overlay.innerHTML = `
    <div class="thanks-card" role="dialog" aria-modal="true" aria-labelledby="thanks-title" aria-describedby="thanks-text">
      <div class="thanks-badge" style="${c.submitBtn}"><svg viewBox="0 0 24 24" fill="none" stroke="${c.submitTxt}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="thanks-check" pathLength="1" d="M5.5 12.5l4.2 4.2L18.5 7.5"/></svg></div>
      <p class="t-kicker mb-2 uppercase" style="font-size:14px;">${c.kicker}</p>
      <h2 id="thanks-title" class="t-title" style="font-size:28px;line-height:1.2;">Thank you for your feedback</h2>
      <p id="thanks-text" class="t-intro mt-3" style="font-size:16px;">Your ${c.label} reflections have been saved. They help us improve together.</p>
      <button type="button" class="thanks-close mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-3 font-bold shadow-lg" style="${c.submitBtn}"><span style="color:${c.submitTxt};">Close</span></button>
    </div>`;
  const closeBtn = overlay.querySelector(".thanks-close");
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    document.removeEventListener("keydown", onKey, true);
    overlay.classList.remove("show");                        // box and blur fade away together
    setTimeout(() => overlay.remove(), 320);
    if (returnTo && returnTo.focus) { try { returnTo.focus({ preventScroll: true }); } catch (err) {} }
  };
  const onKey = e => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") { e.preventDefault(); closeBtn.focus(); }   // only one control: keep focus inside the box
  };
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", onKey, true);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => { overlay.classList.add("show"); closeBtn.focus({ preventScroll: true }); }));
}

function celebrate(y) {
  const submit = document.querySelector(`#${y}-form button[type="submit"]`);
  try { showThanks(y, submit); } catch (err) { console.error("Thank-you box failed:", err); }
  try { fireConfetti(CONFETTI_COLORS[y]); } catch (err) { console.error("Confetti failed:", err); }
}

document.addEventListener("DOMContentLoaded", () => {
  // Menu first, so it always works
  document.getElementById("open-year6").addEventListener("click", () => showView("year6-view"));
  document.getElementById("open-year7").addEventListener("click", () => showView("year7-view"));

  try {
    Object.entries(YEARS).forEach(([y, c]) => { renderYear(y, c); setupForm(y); });
    ["year6", "year7"].forEach(y => document.getElementById("back-" + y).addEventListener("click", () => showView("menu-view")));
  } catch (err) { console.error("Form setup failed:", err); }

  try { setupDictation(); } catch (err) { console.error("Dictation setup failed:", err); }
  try { setupDictationGlow(); } catch (err) { console.error("Dictation glow failed:", err); }
  try { lucide.createIcons(); } catch (err) { console.error("Icons failed:", err); }

  try {
    const glow = document.getElementById("cursor-glow"); let frame = 0;
    document.addEventListener("pointermove", e => {
      if (e.pointerType === "touch") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate3d(-50%, -50%, 0)`; glow.classList.add("visible"); });
    });
    document.addEventListener("pointerout", e => { if (!e.relatedTarget) glow.classList.remove("visible"); });
  } catch (err) { console.error("Glow failed:", err); }
});
