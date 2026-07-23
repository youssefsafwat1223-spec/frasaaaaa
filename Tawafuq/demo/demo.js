// demo.js — orchestrates plan → face → questions → results
//
// Depends on:  window.Face (face.js), window.Scoring (scoring.js)

const el = id => document.getElementById(id);
const state = {
  plan: null,
  faceMetrics: null,
  answers: {},
  questions: [],
};

// -------------------------------------------------------- boot
async function boot() {
  el("boot-status").textContent = "جاري تحميل البيانات والنموذج...";
  try {
    const info = await Scoring.init();
    await Face.init();
    el("boot-status").textContent =
      `جاهز — ${info.questionCount} سؤال، ${info.traitCount} سمة، ${info.structuralTraits} سمات بصرية.`;
  } catch (err) {
    el("boot-status").innerHTML =
      `<span class="error">فشل التحميل: ${err.message}</span>`;
    console.error(err);
  }
}
boot();

// -------------------------------------------------------- step 1 — plan
document.querySelectorAll(".plan").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".plan").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.plan = btn.dataset.plan;
    state.questions = Scoring.getQuestionsForPlan(state.plan);
    el("step-face").classList.remove("hidden");
    el("step-face").scrollIntoView({ behavior: "smooth" });
  });
});

// -------------------------------------------------------- step 2 — face
const dropzone = el("dropzone"), preview = el("preview"), fileInput = el("fileInput");

function handleFile(file) {
  const img = new Image();
  img.onload = async () => {
    dropzone.classList.add("has-image");
    preview.src = img.src;
    el("faceStats").innerHTML = `<div class="muted">جاري التحليل...</div>`;
    el("goQuestions").disabled = true;
    try {
      const res = await Face.analyzeImageElement(img);
      if (!res) {
        el("faceStats").innerHTML = `<div class="error">لم يتم رصد أي وجه — جرّب صورة أوضح.</div>`;
        return;
      }
      state.faceMetrics = res.metrics;
      renderFaceStats(res.metrics);
      el("goQuestions").disabled = false;
    } catch (err) {
      console.error(err);
      el("faceStats").innerHTML = `<div class="error">خطأ في التحليل: ${err.message}</div>`;
    }
  };
  img.src = URL.createObjectURL(file);
}

fileInput.addEventListener("change", e => { if (e.target.files[0]) handleFile(e.target.files[0]); });
dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.style.background = "#fdf9f0"; });
dropzone.addEventListener("dragleave", () => { dropzone.style.background = ""; });
dropzone.addEventListener("drop", e => {
  e.preventDefault(); dropzone.style.background = "";
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

function renderFaceStats(m) {
  const interesting = [
    ["نسبة الجبهة",          "forehead_ratio"],
    ["نسبة عرض/ارتفاع الوجه", "face_aspect_ratio"],
    ["انفتاح العين",          "eye_open_ratio"],
    ["نسبة عرض الفم",         "mouth_width_ratio"],
    ["نسبة سُمك الفم",         "mouth_height_ratio"],
    ["شفة عليا",              "upper_lip_ratio"],
    ["شفة سفلى",              "lower_lip_ratio"],
    ["عرض الفك",              "jaw_width_ratio"],
    ["بروز الذقن",            "chin_projection_ratio"],
    ["تباعد داخل الحاجبين",    "brow_inner_distance"],
    ["تقوس الحاجب",           "brow_arch"],
    ["زاوية الفك",            "jaw_angle_sharpness"],
    ["كثافة الحاجب",          "brow_density"],
    ["نعومة الجبهة",          "forehead_smoothness"],
    ["امتلاء الخد",           "cheek_fullness"],
  ];
  el("faceStats").innerHTML = interesting
    .map(([label, key]) => {
      const v = m[key];
      const s = (v == null) ? "—" : (typeof v === "number" ? v.toFixed(3) : String(v));
      return `<div><span>${label}</span><b>${s}</b></div>`;
    }).join("");
}

el("goQuestions").addEventListener("click", () => {
  renderQuestions();
  el("step-questions").classList.remove("hidden");
  el("step-questions").scrollIntoView({ behavior: "smooth" });
});

// -------------------------------------------------------- step 3 — questions
function renderQuestions() {
  const container = el("questionList");
  container.innerHTML = "";
  state.questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `
      <p><b>${i+1}.</b> ${q.text_ar}</p>
      <div class="likert" data-qid="${q.id}">
        ${[1,2,3,4,5].map(v => `
          <label>
            <input type="radio" name="${q.id}" value="${v}">
            <span>${q.scale_anchors[v]}</span>
          </label>`).join("")}
      </div>`;
    container.appendChild(div);
  });
  updateProgress();
  container.addEventListener("change", e => {
    if (e.target.name && e.target.value) {
      state.answers[e.target.name] = +e.target.value;
      updateProgress();
    }
  });
}
function updateProgress() {
  const total = state.questions.length;
  const done = state.questions.filter(q => state.answers[q.id] != null).length;
  el("qProgress").textContent = `${done} / ${total}`;
}

el("goResults").addEventListener("click", () => {
  if (Object.keys(state.answers).length === 0) {
    alert("جاوب على سؤال واحد على الأقل."); return;
  }
  renderResults();
  el("step-results").classList.remove("hidden");
  el("step-results").scrollIntoView({ behavior: "smooth" });
});

// -------------------------------------------------------- step 4 — results
function renderResults() {
  const panel = el("resultPanel");
  if (state.plan === "matching") {
    // simulate a partner profile by mirroring the user with slight noise
    const partnerFace = {};
    for (const [k, v] of Object.entries(state.faceMetrics || {})) {
      if (typeof v === "number") partnerFace[k] = v + (Math.random() - 0.5) * 0.04;
    }
    const partnerAnswers = {};
    for (const [k, v] of Object.entries(state.answers)) {
      partnerAnswers[k] = Math.max(1, Math.min(5, v + (Math.random() > 0.5 ? 1 : -1)));
    }
    const me      = { face_vector: Face.faceVectorFor(state.faceMetrics || {}),
                      onboarding:  state.answers };
    const partner = { face_vector: Face.faceVectorFor(partnerFace),
                      onboarding:  partnerAnswers };
    const r = Scoring.matchingScore(me, partner);
    panel.innerHTML = `
      <div class="match-card">
        <div class="muted small">نسبة التوافق مع شريك افتراضي للعرض</div>
        <div class="score">${r.match_score}%</div>
        <div class="tag ${r.compatibility}">${r.compatibility === "high" ? "توافق قوي" :
          r.compatibility === "medium" ? "توافق متوسط" : "توافق منخفض"}</div>
        <p>${r.explanation_ar}</p>
        <p class="muted small">لقراءة شخصيتك الكاملة وشخصية شريكك، اشترك في إحدى الخطط المدفوعة.</p>
      </div>`;
    return;
  }
  // paid plans
  const result = Scoring.analyzeTraits(state.answers, state.faceMetrics, state.plan);
  const conf = { high: 0, medium: 0, low: 0 };
  result.traits.forEach(t => { conf[t.confidence] = (conf[t.confidence] || 0) + 1; });
  const top = result.traits.filter(t => t.confidence !== "low").slice(0, 60);
  panel.innerHTML = `
    <div class="summary-bar">
      <div>الخطة: <b>${state.plan}</b></div>
      <div>أسئلة مُجابة: <b>${result.summary.answered_questions}/${result.summary.plan_size}</b></div>
      <div>سمات ظهرت: <b>${result.summary.traits_returned}</b></div>
      <div>ثقة عالية: <b>${conf.high}</b></div>
      <div>ثقة متوسطة: <b>${conf.medium}</b></div>
      <div>ثقة منخفضة: <b>${conf.low}</b></div>
    </div>
    <h3>أبرز السمات (high/medium confidence)</h3>
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
    <p class="muted small" style="margin-top:16px">👁 = السمة استخدمت قياسات من الصورة بالإضافة للأسئلة.</p>`;
}

el("restart").addEventListener("click", () => location.reload());
