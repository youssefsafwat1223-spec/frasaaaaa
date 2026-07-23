// ============================================================
// demo.js — تَوَافُق journey
//   welcome ▸ prep ▸ 3-angle capture ▸ short categorized questions
//   ▸ free glimpse + match teaser ▸ 3 paid services
// Depends on: window.Face (face.js), window.Scoring (scoring.js),
//             window.Segment (segment.js)
// ============================================================
import { FilesetResolver, FaceLandmarker }
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const VISION_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_CANDIDATES = [
  "./models/face_landmarker.task",
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
];

const el = id => document.getElementById(id);
const CAT_ORDER = [
  "العاطفة والمشاعر", "التواصل الاجتماعي", "الإرادة والطموح",
  "العقل والتفكير", "الانضباط والنظام", "الطبع والمزاج",
];

const state = {
  reg: { name: "", gender: "" },
  matchQ: [],            // raw 73 matching questions
  matchPages: [],        // [{stage, questions:[...]}] after gender/religion filter
  matchPageIdx: 0,
  matchAnswers: {},      // keyed by question num
  faceMetrics: null,     // flat merged metrics for scoring
  faceRich: null,        // full analyzeMultiAngle output (for display)
  adaptive: null,        // selectAdaptiveQuestions result
  pages: [],             // [{category, questions:[...]}]
  pageIdx: 0,
  answers: {},
  mode: "teaser",        // "teaser" (short) | "full" (all 180)
};

// ---------------------------------------------------------- navigation
function show(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  el(screenId).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------------------------------------------------------- boot
(async function boot() {
  el("boot-status").textContent = "جاري تحميل النموذج…";
  try {
    const info = await Scoring.init();
    try {
      state.matchQ = await (await fetch("./data/matching_questions.json")).json();
    } catch (e) { console.warn("matching_questions.json load failed", e); }
    el("boot-status").textContent =
      `جاهز — ${info.questionCount} سؤال، ${info.traitCount} صفة، ${state.matchQ.length} سؤال توافق.`;
  } catch (err) {
    el("boot-status").innerHTML = `<span class="error">فشل التحميل: ${err.message}</span>`;
    console.error(err);
  }
})();

// ---------------------------------------------------------- ① welcome
function checkReg() {
  state.reg.name = el("regName").value.trim();
  state.reg.gender = el("regGender").value;
  el("toPrep").disabled = !(state.reg.name && state.reg.gender);
}
el("regName").addEventListener("input", checkReg);
el("regGender").addEventListener("change", checkReg);
el("toPrep").addEventListener("click", () => { buildMatchQuestions(); show("screen-matchq"); });

// ---------------------------------------------------------- ②أ matching questions (73 / 8 stages)
function isMuslim()    { const a = state.matchAnswers[12]; return typeof a === "string" && a.startsWith("مسلم"); }
function isChristian() { const a = state.matchAnswers[12]; return typeof a === "string" && a.includes("مسيحي"); }
function genderOK(q) {
  const g = q.gender;
  if (!g) return true;
  const female = state.reg.gender === "female", male = state.reg.gender === "male";
  if (g.includes("إناث")   && !female)        return false;
  if (g.includes("الذكور") && !male)          return false;
  if (g.includes("المسلم") && !isMuslim())    return false;
  if (g.includes("المسيحي") && !isChristian()) return false;
  return true;
}
function buildMatchQuestions() {
  state.matchPageIdx = 0;
  // group by stage in encounter order
  const order = [], byStage = {};
  for (const q of state.matchQ) {
    const s = q.stage || "أسئلة";
    if (!byStage[s]) { byStage[s] = []; order.push(s); }
    byStage[s].push(q);
  }
  state.matchPages = order.map(s => ({ stage: s, questions: byStage[s] }));
  renderMatchPage();
}
function renderMatchPage() {
  const page = state.matchPages[state.matchPageIdx];
  if (!page) return;
  el("mqTitle").textContent = page.stage;
  el("mqProgress").innerHTML = state.matchPages
    .map((p, i) => `<span class="dot ${i < state.matchPageIdx ? "done" : i === state.matchPageIdx ? "cur" : ""}"></span>`)
    .join("") + ` <span class="muted small">${state.matchPageIdx + 1}/${state.matchPages.length}</span>`;
  const visible = page.questions.filter(genderOK);
  const box = el("mqList");
  box.innerHTML = "";
  visible.forEach((q, i) => box.appendChild(renderMatchQ(q, i + 1)));
  el("mqPrev").disabled = state.matchPageIdx === 0;
  el("mqNext").textContent = state.matchPageIdx === state.matchPages.length - 1 ? "تم — نكمّل للوجه" : "التالي";
  updateMatchCount();
}
const AGREE5 = ["لا أوافق إطلاقاً", "أعارض", "محايد", "أوافق", "أوافق تماماً"];
const FREQ5  = ["أبداً", "نادراً", "أحياناً", "غالباً", "دائماً"];
const SCALE_DEFAULTS = {
  likert: AGREE5, scenario: AGREE5, bipolar: AGREE5, sensitive: AGREE5,
  frequency: FREQ5, frequency_matrix: FREQ5,
};
function renderMatchQ(q, idx) {
  const div = document.createElement("div");
  div.className = "question";
  const cur = state.matchAnswers[q.num];
  const opts = (Array.isArray(q.options) && q.options.length)
    ? q.options : (SCALE_DEFAULTS[q.type] || []);
  let body = "";
  if (q.num === 3) {                       // age: structured numeric (used by the hard filter)
    const c = (cur && typeof cur === "object") ? cur : {};
    body = `<div class="mq-age">
      <label>عمرك<input type="number" class="mq-age-f" data-f="age" min="18" max="90" value="${c.age ?? ""}"></label>
      <label>تقبل من<input type="number" class="mq-age-f" data-f="min" min="18" max="90" value="${c.min ?? ""}"></label>
      <label>إلى<input type="number" class="mq-age-f" data-f="max" min="18" max="90" value="${c.max ?? ""}"></label>
    </div>`;
  } else if (q.type === "textinput") {
    body = `<input class="mq-text" type="text" data-num="${q.num}" value="${cur ?? ""}" placeholder="${opts[0] ?? "اكتب…"}">`;
  } else if (q.type === "number") {
    body = `<input class="mq-text" type="text" data-num="${q.num}" value="${cur ?? ""}" placeholder="${(opts[0] ?? "اكتب").slice(0, 40)}">`;
  } else if (q.type === "vas") {
    const v = typeof cur === "number" ? cur : 50;
    body = `<input class="mq-vas" type="range" min="0" max="100" value="${v}" data-num="${q.num}">
            <div class="vas-ends"><span>${opts[1] ?? "مرتفع جداً"}</span><span>${opts[0] ?? "منخفض جداً"}</span></div>`;
  } else if (opts.length) {
    const multi = q.type === "multi";
    body = `<div class="mq-opts" data-num="${q.num}" data-multi="${multi}">` +
      opts.map(o => {
        const sel = multi ? (Array.isArray(cur) && cur.includes(o)) : cur === o;
        return `<button class="mq-opt ${sel ? "sel" : ""}" data-val="${o.replace(/"/g, "&quot;")}">${o}</button>`;
      }).join("") + `</div>`;
  } else {
    body = `<input class="mq-text" type="text" data-num="${q.num}" value="${cur ?? ""}" placeholder="اكتب إجابتك…">`;
  }
  const tag = q.type === "hardfilter" ? ` <span class="conf low">فلتر صلب</span>` : "";
  div.innerHTML = `<p><b>${idx}.</b> ${q.text}${tag}</p>${body}`;
  return div;
}
function setMatchAnswer(num, val, isReligion) {
  state.matchAnswers[num] = val;
  if (isReligion) renderMatchPage();   // religion gates other questions on this page
  else updateMatchCount();
}
function updateMatchCount() {
  const visibleNums = new Set();
  state.matchPages.forEach(p => p.questions.filter(genderOK).forEach(q => visibleNums.add(q.num)));
  let answered = 0;
  visibleNums.forEach(n => { const a = state.matchAnswers[n]; if (a !== undefined && a !== "" && !(Array.isArray(a) && !a.length)) answered++; });
  el("mqCount").textContent = `${answered} / ${visibleNums.size}`;
}
el("mqList").addEventListener("click", e => {
  const btn = e.target.closest(".mq-opt");
  if (!btn) return;
  const wrap = btn.closest(".mq-opts");
  const num = +wrap.dataset.num, val = btn.dataset.val, multi = wrap.dataset.multi === "true";
  if (multi) {
    const arr = Array.isArray(state.matchAnswers[num]) ? state.matchAnswers[num].slice() : [];
    const i = arr.indexOf(val); i >= 0 ? arr.splice(i, 1) : arr.push(val);
    btn.classList.toggle("sel");
    setMatchAnswer(num, arr, false);
  } else {
    wrap.querySelectorAll(".mq-opt").forEach(b => b.classList.remove("sel"));
    btn.classList.add("sel");
    setMatchAnswer(num, val, num === 12);
  }
});
el("mqList").addEventListener("input", e => {
  const t = e.target;
  if (t.classList.contains("mq-age-f")) {
    const cur = (state.matchAnswers[3] && typeof state.matchAnswers[3] === "object") ? state.matchAnswers[3] : {};
    const v = t.value === "" ? undefined : +t.value;
    setMatchAnswer(3, { ...cur, [t.dataset.f]: v }, false);
  } else if (t.classList.contains("mq-text")) setMatchAnswer(+t.dataset.num, t.value, false);
  else if (t.classList.contains("mq-vas")) setMatchAnswer(+t.dataset.num, +t.value, false);
});
el("mqPrev").addEventListener("click", () => {
  if (state.matchPageIdx > 0) { state.matchPageIdx--; renderMatchPage(); }
});
el("mqNext").addEventListener("click", () => {
  if (state.matchPageIdx < state.matchPages.length - 1) { state.matchPageIdx++; renderMatchPage(); }
  else show("screen-prep");
});

// ---------------------------------------------------------- ② prep
el("toCapture").addEventListener("click", () => { show("screen-capture"); startCapture(); });

// ---------------------------------------------------------- ③ capture (3 angles)
const STEPS = ["front", "left", "right"];
const GATE = {
  front: { test: p => Math.abs(p.yaw) <= 8 && Math.abs(p.roll) <= 12,
           hint: "وجّه وجهك للأمام مباشرة" },
  left:  { test: p => p.yaw >= 40 && p.yaw <= 72 && Math.abs(p.roll) <= 16,
           hint: "لِف رأسك ناحية اليمين برِفق (~55°)" },
  right: { test: p => p.yaw <= -40 && p.yaw >= -72 && Math.abs(p.roll) <= 16,
           hint: "لِف رأسك ناحية اليسار برِفق (~55°)" },
};
const HOLD_MS = 600;

const vid = el("vid"), ring = el("ring"), hud = el("hud"), target = el("target");
const chips = [...document.querySelectorAll("#screen-capture .chip")];
const thumbs = Object.fromEntries(
  [...document.querySelectorAll("#screen-capture .thumb")].map(t => [t.dataset.t, t]));

let videoLandmarker = null, stream = null, running = false, stepIdx = 0;
const shots = { front: null, left: null, right: null };
let alignedSince = 0, lastVideoTs = -1;

async function initVideoLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM);
  let lastErr = null;
  for (const path of MODEL_CANDIDATES) {
    try {
      videoLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: path },
        runningMode: "VIDEO", numFaces: 1,
        minFaceDetectionConfidence: 0.3, minFacePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });
      return;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("VIDEO FaceLandmarker init failed");
}

function snapshot() {
  const w = vid.videoWidth, h = vid.videoHeight;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  cv.getContext("2d").drawImage(vid, 0, 0, w, h);
  return cv;
}
function setChipState() {
  chips.forEach((c, i) => {
    c.classList.toggle("active", i === stepIdx && running);
    c.classList.toggle("done", !!shots[c.dataset.k]);
  });
}
function captureStep(stepKey) {
  shots[stepKey] = snapshot();
  if (thumbs[stepKey]) thumbs[stepKey].src = shots[stepKey].toDataURL("image/jpeg", 0.7);
  setChipState();
  const next = STEPS.findIndex(s => !shots[s]);
  stepIdx = next < 0 ? STEPS.length : next;
  alignedSince = 0;
  if (STEPS.every(s => shots[s])) {
    el("analyzeBtn").disabled = false;
    target.textContent = "تم التقاط الزوايا الثلاث ✓ — اضغط «تحليل ودمج»";
    ring.classList.remove("ok");
  }
}
function loop() {
  if (!running) return;
  const now = performance.now();
  if (vid.readyState >= 2 && vid.currentTime !== lastVideoTs) {
    lastVideoTs = vid.currentTime;
    let res = null;
    try { res = videoLandmarker.detectForVideo(vid, now); } catch (_) {}
    const lm = res && res.faceLandmarks && res.faceLandmarks[0];
    if (!lm) {
      hud.textContent = "لا يوجد وجه واضح…"; ring.classList.remove("ok"); alignedSince = 0;
    } else if (stepIdx < STEPS.length) {
      const pose = window.Face.poseFromLandmarks(lm);
      const q = window.Face.frameQuality(vid, lm);
      const gate = GATE[STEPS[stepIdx]];
      const poseOk = gate.test(pose), ok = poseOk && q.ok;
      hud.innerHTML = `yaw <b>${pose.yaw}</b>° · إضاءة <b>${q.metrics.brightness ?? "—"}</b> · حجم <b>${q.metrics.faceFill ?? "—"}</b>`;
      target.textContent = !q.ok ? q.issues[0] : !poseOk ? gate.hint : "ثبّت… يتم الالتقاط";
      ring.classList.toggle("ok", ok);
      if (ok) { if (!alignedSince) alignedSince = now; if (now - alignedSince >= HOLD_MS) captureStep(STEPS[stepIdx]); }
      else alignedSince = 0;
    }
  }
  requestAnimationFrame(loop);
}
async function startCapture() {
  if (running) return;
  hud.textContent = "جارٍ تشغيل الكاميرا…";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
    vid.srcObject = stream; await vid.play();
    await Promise.all([
      window.Face.init(), initVideoLandmarker(),
      window.Segment ? window.Segment.init().catch(() => {}) : Promise.resolve(),
    ]);
    running = true;
    el("manualBtn").disabled = false; el("resetBtn").disabled = false;
    setChipState(); requestAnimationFrame(loop);
  } catch (e) {
    hud.textContent = "تعذّر تشغيل الكاميرا: " + (e && e.message || e);
  }
}
function stopCamera() {
  running = false;
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}
el("manualBtn").addEventListener("click", () => {
  if (running && stepIdx < STEPS.length) captureStep(STEPS[stepIdx]);
});
el("resetBtn").addEventListener("click", () => {
  shots.front = shots.left = shots.right = null; stepIdx = 0; alignedSince = 0;
  el("analyzeBtn").disabled = true;
  Object.values(thumbs).forEach(t => { t.src = ""; });
  setChipState(); target.textContent = "—";
});
el("analyzeBtn").addEventListener("click", async () => {
  el("analyzeBtn").disabled = true;
  target.textContent = "جارٍ التحليل والدمج…";
  const merged = await window.Face.analyzeMultiAngle({
    front: shots.front, left: shots.left, right: shots.right });
  state.faceRich = merged;
  // flat metrics for scoring (frontal + profile; scoring ignores unmeasurable aliases)
  state.faceMetrics = { ...(merged.metrics || {}), ...(merged.profile || {}) };
  stopCamera();
  buildAdaptive();
  show("screen-questions");
});

// ---------------------------------------------------------- ④ adaptive + categorized questions
function groupByCategory(questions) {
  const byCat = {};
  for (const q of questions) (byCat[q.category] ||= []).push(q);
  return CAT_ORDER.filter(c => byCat[c]).map(c => ({ category: c, questions: byCat[c] }));
}
function buildAdaptive() {
  state.mode = "teaser";
  state.answers = {};
  state.adaptive = Scoring.selectAdaptiveQuestions(state.faceMetrics, "advanced", { threshold: 0.55 });
  state.pages = groupByCategory(state.adaptive.questions);
  state.pageIdx = 0;
  const pool = Scoring.getQuestionsForPlan("advanced").length;
  const n = state.adaptive.questions.length;
  el("adaptiveBanner").innerHTML =
    `الصورة كانت واثقة من <b>${state.adaptive.traits_confident}</b> صفة فاتخطّيناها — ` +
    `بنسألك <b>${n}</b> سؤال بس بدل <b>${pool}</b> ` +
    `(توفير ${pool ? Math.round(100 * (pool - n) / pool) : 0}%)، مقسّمين على ${state.pages.length} مجموعات.`;
  renderPage();
}
function buildFull() {
  state.mode = "full";
  state.answers = {};
  state.pages = groupByCategory(Scoring.getQuestionsForPlan("advanced"));
  state.pageIdx = 0;
  el("adaptiveBanner").innerHTML =
    `<b>تحليل كامل:</b> بنسألك كل الـ180 سؤال عشان أدق نتيجة ممكنة — مقسّمين على ${state.pages.length} مجموعات.`;
  renderPage();
  show("screen-questions");
}
function renderPage() {
  const page = state.pages[state.pageIdx];
  if (!page) return finishQuestions();
  el("catTitle").textContent = page.category;
  el("catProgress").innerHTML = state.pages
    .map((p, i) => `<span class="dot ${i < state.pageIdx ? "done" : i === state.pageIdx ? "cur" : ""}"></span>`)
    .join("") + ` <span class="muted small">${state.pageIdx + 1}/${state.pages.length}</span>`;
  const container = el("questionList");
  container.innerHTML = "";
  page.questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `
      <p><b>${i + 1}.</b> ${q.text_ar}</p>
      <div class="likert" data-qid="${q.id}">
        ${[1,2,3,4,5].map(v => `
          <label class="${state.answers[q.id] === v ? "sel" : ""}">
            <input type="radio" name="${q.id}" value="${v}" ${state.answers[q.id] === v ? "checked" : ""}>
            <span>${q.scale_anchors[v]}</span>
          </label>`).join("")}
      </div>`;
    container.appendChild(div);
  });
  container.onchange = e => {
    if (e.target.name && e.target.value) {
      state.answers[e.target.name] = +e.target.value;
      e.target.closest(".likert").querySelectorAll("label")
        .forEach(l => l.classList.toggle("sel", l.querySelector("input").checked));
      updateProgress();
    }
  };
  el("prevCat").disabled = state.pageIdx === 0;
  el("nextCat").textContent = state.pageIdx === state.pages.length - 1 ? "خلّص وشوف النتيجة" : "التالي";
  updateProgress();
}
function totalQuestions() { return state.pages.reduce((n, p) => n + p.questions.length, 0); }
function updateProgress() {
  const total = totalQuestions();
  const done = Object.keys(state.answers).length;
  el("qProgress").textContent = `${done} / ${total}`;
}
el("prevCat").addEventListener("click", () => { if (state.pageIdx > 0) { state.pageIdx--; renderPage(); } });
el("nextCat").addEventListener("click", () => {
  if (state.pageIdx < state.pages.length - 1) { state.pageIdx++; renderPage(); }
  else finishQuestions();
});
function finishQuestions() {
  if (Object.keys(state.answers).length === 0) { alert("جاوب على سؤال واحد على الأقل."); return; }
  if (state.mode === "full") renderFullReport();
  else { renderGlimpse(); renderMatchTeaser(); show("screen-glimpse"); }
}

// ---------------------------------------------------------- ⑤ glimpse + teaser
function renderGlimpse() {
  const res = Scoring.analyzeTraits(state.answers, state.faceMetrics, "advanced");
  const top = res.traits.filter(t => t.confidence !== "low").slice(0, 6);
  el("glimpsePanel").innerHTML = `
    <p class="muted small">دي لمحة سريعة من اللي قدرنا نقرأه دلوقتي. التحليل الكامل بيغطّي الـ60 صفة بدقة أعلى.</p>
    <div class="traits-list">
      ${top.map(t => `
        <div class="trait-row">
          <span class="nm">${t.name}${t.structural_used ? " 👁" : ""}</span>
          <span>
            <span class="sc" style="color:${t.score >= 60 ? 'var(--green)' : t.score < 40 ? 'var(--rose)' : 'var(--ink-2)'}">${t.score}</span>
            <span class="conf ${t.confidence}">${t.confidence}</span>
          </span>
        </div>`).join("")}
    </div>
    <p class="muted small" style="margin-top:12px">👁 = استُخدمت قياسات من الصورة مع الأسئلة.</p>`;
}
function simulatedPartner() {
  // demo: a candidate who PASSES the hard filters (same religion/kids/…) with
  // light noise on face, personality, and the soft 73-answers.
  const pf = {};
  for (const [k, v] of Object.entries(state.faceMetrics || {}))
    if (typeof v === "number") pf[k] = v + (Math.random() - 0.5) * 0.05;
  const pa = {};
  for (const [k, v] of Object.entries(state.answers))
    pa[k] = Math.max(1, Math.min(5, v + (Math.random() > 0.5 ? 1 : -1)));
  // partner's 73 answers: copy hard-filter inputs exactly, perturb some soft options
  const HARD = new Set([3, 12, 28, 29, 30, 31, 33, 34, 36]);
  const optMap = {};
  state.matchQ.forEach(q => { optMap[q.num] = (q.options && q.options.length) ? q.options : null; });
  const pm = {};
  for (const [numStr, val] of Object.entries(state.matchAnswers)) {
    const num = +numStr, opts = optMap[num];
    if (HARD.has(num) || typeof val !== "string" || !opts || Math.random() >= 0.4) { pm[num] = val; continue; }
    const i = opts.indexOf(val);
    pm[num] = i < 0 ? val : opts[Math.min(opts.length - 1, Math.max(0, i + (Math.random() > 0.5 ? 1 : -1)))];
  }
  return {
    face_vector: Face.faceVectorFor(pf),
    onboarding: pa,
    matchAnswers: pm,
    gender: state.reg.gender === "male" ? "female" : "male",
  };
}
function myProfile() {
  return {
    face_vector: Face.faceVectorFor(state.faceMetrics || {}),
    onboarding: state.answers,
    matchAnswers: state.matchAnswers,
    gender: state.reg.gender,
  };
}
function renderMatchTeaser() {
  const partner = simulatedPartner();
  state._lastMatch = Scoring.matchingScore(myProfile(), partner);
  const r = state._lastMatch;
  const t = el("matchTeaser");
  if (r.match_score >= 55) {
    t.classList.remove("hidden");
    t.innerHTML = `
      <div class="teaser-badge">🔔 لقينا ليك توافق ${r.compatibility === "high" ? "قوي" : "جيد"}!</div>
      <div class="match-big">${r.match_score}%</div>
      <p>${r.explanation_ar}</p>
      <p class="muted small">الهوية والتفاصيل والمحادثة تظهر بعد الاشتراك في خدمة <b>Matching</b>.</p>
      <button class="primary" data-svc="matching">اشترك عشان تشوفه 💞</button>`;
    t.querySelector("button").addEventListener("click", () => openService("matching"));
  } else {
    t.classList.remove("hidden");
    t.innerHTML = `
      <div class="teaser-badge muted">لسه مفيش توافق قوي</div>
      <p class="muted small">هنبلّغك أول ما يظهر حد متوافق معاك. سجّل اهتمامك بخدمة Matching.</p>`;
  }
}

// ---------------------------------------------------------- the 3 services
document.querySelectorAll(".service").forEach(b =>
  b.addEventListener("click", () => openService(b.dataset.svc)));

function openService(svc) {
  const panel = el("servicePanel");
  panel.classList.remove("hidden");
  if (svc === "matching") {
    const r = state._lastMatch || Scoring.matchingScore(myProfile(), simulatedPartner());
    const BLAB = { values: "القيم والدين", attach: "التعلّق والتواصل", personality: "الشخصية", intimacy: "الحميمية والإيقاع", logistics: "الجنسية والانتقال", face: "تناغم الوجه" };
    const rows = r.breakdown ? Object.entries(r.breakdown)
      .filter(([k]) => BLAB[k])
      .map(([k, v]) => `<div class="trait-row"><span class="nm">${BLAB[k]} <span class="muted small">(${Math.round(v.weight * 100)}%)</span></span><span class="sc">${v.score}</span></div>`)
      .join("") : "";
    const danger = r.breakdown && r.breakdown.danger_penalty
      ? `<p class="error">⚠ خصم ${Math.abs(r.breakdown.danger_penalty)} نقطة بسبب مؤشرات في كواشف الأنماط الخفية.</p>` : "";
    panel.innerHTML = `
      <h2>Matching 💞 <span class="muted small">(خدمة مدفوعة)</span></h2>
      ${r.blocked
        ? `<div class="error">${r.explanation_ar}</div>`
        : `<div class="match-card">
        <div class="score">${r.match_score}%</div>
        <div class="tag ${r.compatibility}">${r.compatibility === "high" ? "توافق قوي" : r.compatibility === "medium" ? "توافق متوسط" : "توافق منخفض"}</div>
        <p>${r.explanation_ar}</p>
      </div>
      <p class="muted small" style="margin:14px 0 6px">على إيه اتحسب التوافق:</p>
      <div class="traits-list">${rows}</div>
      ${danger}
      <p class="muted small" style="margin-top:12px">في المنتج الحقيقي: هنا تظهر صورة الطرف، نبذة، وزر بدء محادثة بعد الدفع.</p>`}`;
  } else if (svc === "full") {
    panel.innerHTML = `
      <h2>تحليل شخصية كامل 🧠 <span class="muted small">(خدمة مدفوعة)</span></h2>
      <p class="muted small">بنسألك كل الـ180 سؤال (من غير اختصار) عشان نطلّع تقرير دقيق للـ60 صفة.</p>
      <button class="primary" id="startFull">ابدأ التحليل الكامل</button>`;
    el("startFull").addEventListener("click", buildFull);
  } else if (svc === "session") {
    panel.innerHTML = `
      <h2>جلسة مع أ. هادي 🎙️ <span class="muted small">(خدمة مدفوعة)</span></h2>
      <p class="muted small">احجز ميتنج مباشر لقراءة شخصية متعمّقة وجهًا لوجه.</p>
      <div class="form">
        <label>اليوم المفضّل<input type="date" id="sessDate"></label>
        <label>ملاحظة<input type="text" id="sessNote" placeholder="أي تفاصيل تحب تضيفها"></label>
      </div>
      <button class="primary" id="bookSess">تأكيد الحجز</button>
      <div id="bookMsg" class="muted small"></div>`;
    el("bookSess").addEventListener("click", () => {
      const d = el("sessDate").value;
      el("bookMsg").innerHTML = d
        ? `<span style="color:var(--green)">✓ تم استلام طلب الحجز ليوم ${d} — هنتواصل معاك للتأكيد.</span>`
        : `<span class="error">اختر يوم الأول.</span>`;
    });
  }
  panel.scrollIntoView({ behavior: "smooth" });
}

// ---------------------------------------------------------- full report (paid)
function renderFullReport() {
  const res = Scoring.analyzeTraits(state.answers, state.faceMetrics, "advanced");
  const conf = { high: 0, medium: 0, low: 0 };
  res.traits.forEach(t => { conf[t.confidence] = (conf[t.confidence] || 0) + 1; });
  const panel = el("servicePanel");
  panel.classList.remove("hidden");
  panel.innerHTML = `
    <h2>تقريرك الكامل 🧠</h2>
    <div class="summary-bar">
      <div>أسئلة مُجابة: <b>${res.summary.answered_questions}</b></div>
      <div>صفات ظهرت: <b>${res.summary.traits_returned}</b></div>
      <div>ثقة عالية: <b>${conf.high}</b></div>
      <div>متوسطة: <b>${conf.medium}</b></div>
      <div>منخفضة: <b>${conf.low}</b></div>
    </div>
    <div class="traits-list">
      ${res.traits.map(t => `
        <div class="trait-row">
          <span class="nm">${t.name}${t.structural_used ? " 👁" : ""}</span>
          <span>
            <span class="sc" style="color:${t.score >= 60 ? 'var(--green)' : t.score < 40 ? 'var(--rose)' : 'var(--ink-2)'}">${t.score}</span>
            <span class="conf ${t.confidence}">${t.confidence}</span>
          </span>
        </div>`).join("")}
    </div>`;
  show("screen-glimpse");
  panel.scrollIntoView({ behavior: "smooth" });
}

// ---------------------------------------------------------- restart
el("restart").addEventListener("click", () => location.reload());
