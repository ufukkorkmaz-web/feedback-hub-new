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
      <button type="button" class="dictate-btn" data-dictate-for="${y}-${id}" aria-label="Start dictation" aria-pressed="false"><i data-lucide="mic" aria-hidden="true"></i><span>Speak</span></button>
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
    } catch (err) { say("We could not confirm your submission. Please refresh before trying again."); }
    finally { button.disabled = false; }
  });
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
        textarea.value = [committed, extra].filter(Boolean).join(" ");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      };

      activeButton = button; activeTextarea = textarea; activeFeedback = feedback; wantListening = true;
      button.classList.add("is-listening");
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", "Stop dictation");
      button.querySelector("span").textContent = "Stop";
      feedback.textContent = "Listening… speak naturally, then press Stop.";
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
            let chunk = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) chunk += event.results[i][0].transcript + " ";
            }
            chunk = chunk.trim();
            if (chunk) { committed = [committed, chunk].filter(Boolean).join(" "); write(""); }
          } else {
            write(Array.from(event.results).map(r => r[0].transcript).join(" ").trim());
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

document.addEventListener("DOMContentLoaded", () => {
  // Menu first, so it always works
  document.getElementById("open-year6").addEventListener("click", () => showView("year6-view"));
  document.getElementById("open-year7").addEventListener("click", () => showView("year7-view"));

  try {
    Object.entries(YEARS).forEach(([y, c]) => { renderYear(y, c); setupForm(y); });
    ["year6", "year7"].forEach(y => document.getElementById("back-" + y).addEventListener("click", () => showView("menu-view")));
  } catch (err) { console.error("Form setup failed:", err); }

  try { setupDictation(); } catch (err) { console.error("Dictation setup failed:", err); }
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
