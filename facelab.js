// ============================================================
// facelab.js — Face Lab: client-facing test of the face engine.
//   start ▸ 3-angle capture (or photo upload) ▸ multi-frame median
//   ▸ face-only trait reading + detailed metrics + repeatability
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
const $$ = sel => [...document.querySelectorAll(sel)];

function show(id) {
  $$(".screen").forEach(s => s.classList.remove("active"));
  el(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------------------------------------------------------- labels
const METRIC_GROUPS = [
  ["الوجه والجبهة", [
    ["face_aspect_ratio", "عرض الوجه إلى طوله"],
    ["forehead_ratio", "ارتفاع الجبهة"],
    ["forehead_width_ratio", "عرض الجبهة"],
    ["widening_ratio", "اتساع الجبهة لأعلى"],
    ["forehead_slant_ratio", "ميل الجبهة"],
    ["forehead_lines_density", "خطوط الجبهة"],
    ["lower_face_ratio", "الثلث السفلي للوجه"],
  ]],
  ["العين والحاجب", [
    ["eye_open_ratio", "انفتاح العين"],
    ["eye_size_ratio", "حجم العين"],
    ["eye_spacing_ratio", "تباعد العينين"],
    ["eye_tilt_ratio", "ميل زوايا العين"],
    ["brow_eye_distance_ratio", "ارتفاع الحاجب عن العين"],
    ["brow_inner_distance", "تقارب الحاجبين"],
    ["brow_arch", "تقوّس الحاجب"],
    ["brow_density", "كثافة الحاجب"],
  ]],
  ["الأنف", [
    ["nose_length_ratio", "طول الأنف"],
    ["nose_width_ratio", "عرض الأنف"],
    ["nostril_width_ratio", "اتساع فتحات الأنف"],
    ["nose_tip_drop_ratio", "اتجاه طرف الأنف لأسفل"],
  ]],
  ["الفم", [
    ["mouth_width_ratio", "عرض الفم"],
    ["upper_lip_ratio", "امتلاء الشفة العليا"],
    ["lower_lip_ratio", "امتلاء الشفة السفلى"],
    ["philtrum_ratio", "طول النثرة"],
    ["mouth_corner_tilt", "ميل زوايا الفم"],
  ]],
  ["الفك والذقن والخد", [
    ["jaw_width_ratio", "عرض الفك"],
    ["jaw_angle_sharpness", "حدّة زاوية الفك"],
    ["chin_width_ratio", "عرض الذقن"],
    ["cheek_fullness", "امتلاء الخد"],
  ]],
  ["البروفايل (من الزوايا الجانبية)", [
    ["nose_bridge_convexity", "تحدّب جسر الأنف"],
    ["nose_profile_angle", "زاوية الأنف الجانبية"],
    ["chin_sagittal_projection", "بروز الذقن"],
    ["brow_ridge_projection", "بروز عظمة الحاجب"],
    ["forehead_slope_profile", "ميل الجبهة الجانبي"],
  ]],
];

// ---------------------------------------------------------- state
const state = {
  fronts: [], left: null, right: null,   // captured canvases / images
  flat: null, z: null, rich: null,       // analysis outputs
  usedFrames: 0,
};

// ---------------------------------------------------------- boot
(async function boot() {
  try {
    const info = await Scoring.init();
    el("boot").textContent =
      `جاهز — ${info.traitCount} صفة · ${Object.keys(Scoring.getBaselines() || {}).length} قياس مُعايَر`;
    if (window.Segment) window.Segment.init().catch(() => {});
    const img = new URLSearchParams(location.search).get("img");
    if (img) devRunFromUrl(img);
  } catch (e) {
    el("boot").innerHTML = `<span class="error">فشل التحميل: ${e.message}</span>`;
  }
})();

// ---------------------------------------------------------- uploads
function fileToImage(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}
["upFront", "upLeft", "upRight"].forEach(id =>
  el(id).addEventListener("change", () => {
    el("btnUpload").disabled = !el("upFront").files.length;
  }));
el("btnUpload").addEventListener("click", async () => {
  try {
    const front = await fileToImage(el("upFront").files[0]);
    const left  = el("upLeft").files.length  ? await fileToImage(el("upLeft").files[0])  : null;
    const right = el("upRight").files.length ? await fileToImage(el("upRight").files[0]) : null;
    state.fronts = [front]; state.left = left; state.right = right;
    runAnalysis();
  } catch (e) { alert("تعذّر قراءة الصورة: " + (e.message || e)); }
});

async function devRunFromUrl(url) {
  const img = new Image();
  img.onload = () => { state.fronts = [img]; state.left = state.right = null; runAnalysis(); };
  img.onerror = () => { el("boot").innerHTML = `<span class="error">تعذّر تحميل صورة الاختبار</span>`; };
  img.src = url;
}

// ---------------------------------------------------------- capture (3 angles)
const STEPS = ["front", "left", "right"];
const GATE = {
  front: { test: p => Math.abs(p.yaw) <= 8 && Math.abs(p.roll) <= 12,
           hint: "وجّه وجهك للأمام مباشرة" },
  left:  { test: p => p.yaw >= 40 && p.yaw <= 72 && Math.abs(p.roll) <= 16,
           hint: "لِف رأسك ناحية اليمين برِفق (~55°)" },
  right: { test: p => p.yaw <= -40 && p.yaw >= -72 && Math.abs(p.roll) <= 16,
           hint: "لِف رأسك ناحية اليسار برِفق (~55°)" },
};
const HOLD_MS = 600, BURST_N = 3, BURST_GAP = 120;

let vidLm = null, stream = null, running = false, stepIdx = 0;
let alignedSince = 0, lastTs = -1, capturing = false;
const shots = { front: null, left: null, right: null };

// live pre-capture checks (hair check is async + throttled — segmenter is heavy)
const pre = { hair: null, hairBusy: false, hairLast: 0 };
let _hairCv = null;
function scheduleHairCheck(v, lm) {
  const now = performance.now();
  if (pre.hairBusy || now - pre.hairLast < 700 || !window.Segment) return;
  pre.hairBusy = true; pre.hairLast = now;
  if (!_hairCv) _hairCv = document.createElement("canvas");
  const w = 192, h = Math.max(1, Math.round(v.videoHeight * 192 / (v.videoWidth || 192)));
  _hairCv.width = w; _hairCv.height = h;
  _hairCv.getContext("2d").drawImage(v, 0, 0, w, h);
  window.Segment.hairOverForehead(_hairCv, lm)
    .then(r => { pre.hair = r; })
    .catch(() => {})
    .finally(() => { pre.hairBusy = false; });
}

function renderChecklist(q, exprIssue, isFront) {
  const items = [];
  const lightBad = q.issues.some(s => s.includes("الإضاءة") || s.includes("الضوء") || s.includes("ظل"));
  items.push(["💡 الإضاءة", lightBad ? "bad" : "ok"]);
  if (isFront) {
    const g = q.glasses;
    items.push(["🕶 بدون نضّارة", g ? (g.glasses ? "bad" : "ok") : ""]);
    items.push(["💇 الجبهة مكشوفة", pre.hair ? (pre.hair.covered ? "warn" : "ok") : ""]);
    items.push(["😐 تعبير محايد", exprIssue ? "bad" : "ok"]);
  }
  el("checklist").innerHTML = items
    .map(([t, c]) => `<span class="ck ${c}">${c === "ok" ? "✓" : c === "bad" ? "✗" : c === "warn" ? "!" : "…"} ${t}</span>`)
    .join("");
}

async function initVideoLandmarker() {
  if (vidLm) return;
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM);
  let lastErr = null;
  for (const path of MODEL_CANDIDATES) {
    try {
      vidLm = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: path },
        runningMode: "VIDEO", numFaces: 1,
        outputFaceBlendshapes: true,          // expression gate (neutral face)
        minFaceDetectionConfidence: 0.3, minFacePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });
      return;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("VIDEO landmarker init failed");
}

// blendshape-based neutrality (much more robust than the lip-gap heuristic)
function expressionIssue(blend) {
  if (!blend || !blend.categories) return null;
  const get = n => blend.categories.find(c => c.categoryName === n)?.score ?? 0;
  if (get("jawOpen") > 0.25) return "اقفل بُقّك (تعبير محايد)";
  if ((get("mouthSmileLeft") + get("mouthSmileRight")) / 2 > 0.4) return "من غير ابتسامة — تعبير محايد";
  if ((get("eyeBlinkLeft") + get("eyeBlinkRight")) / 2 > 0.5) return "افتح عينيك طبيعي";
  return null;
}

const vid = () => el("vid");
function snapshot() {
  const v = vid(), w = v.videoWidth, h = v.videoHeight;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  cv.getContext("2d").drawImage(v, 0, 0, w, h);
  return cv;
}
function setChips() {
  $$("#s-capture .chip").forEach((c, i) => {
    c.classList.toggle("active", i === stepIdx && running);
    c.classList.toggle("done", !!shots[c.dataset.k]);
  });
}
async function captureStep(key) {
  capturing = true;
  if (key === "front") {                       // burst → median kills frame noise
    const frames = [snapshot()];
    for (let i = 1; i < BURST_N; i++) {
      await new Promise(r => setTimeout(r, BURST_GAP));
      frames.push(snapshot());
    }
    shots.front = frames;
  } else shots[key] = [snapshot()];
  capturing = false;
  const next = STEPS.findIndex(s => !shots[s]);
  stepIdx = next < 0 ? STEPS.length : next;
  alignedSince = 0;
  setChips();
  if (STEPS.every(s => shots[s])) {
    stopCamera();
    state.fronts = shots.front;
    state.left = shots.left[0]; state.right = shots.right[0];
    runAnalysis();
  }
}
function loop() {
  if (!running) return;
  const now = performance.now();
  const v = vid();
  if (!capturing && v.readyState >= 2 && v.currentTime !== lastTs) {
    lastTs = v.currentTime;
    let res = null;
    try { res = vidLm.detectForVideo(v, now); } catch (_) {}
    const lm = res && res.faceLandmarks && res.faceLandmarks[0];
    const blend = res && res.faceBlendshapes && res.faceBlendshapes[0];
    if (!lm) {
      el("hud").textContent = "لا يوجد وجه واضح…";
      el("ring").classList.remove("ok"); alignedSince = 0;
    } else if (stepIdx < STEPS.length) {
      const isFront = STEPS[stepIdx] === "front";
      const pose = window.Face.poseFromLandmarks(lm);
      const q = window.Face.frameQuality(v, lm, { checkGlasses: isFront });
      const gate = GATE[STEPS[stepIdx]];
      const exprIssue = isFront ? expressionIssue(blend) : null;
      if (isFront) scheduleHairCheck(v, lm);
      renderChecklist(q, exprIssue, isFront);
      const hairHint = (isFront && pre.hair && pre.hair.covered)
        ? "ارفع الشعر عن الجبهة — عشان قياساتها تبقى دقيقة" : null;
      // glasses blocks auto-capture (corrupts eye metrics); hair is a warning only
      const poseOk = gate.test(pose), ok = poseOk && q.ok && !exprIssue;
      el("hud").innerHTML =
        `yaw <b>${pose.yaw}</b>° · light <b>${q.metrics.brightness ?? "—"}</b>`;
      el("target").textContent =
        exprIssue || (!q.ok ? q.issues[0] : !poseOk ? gate.hint : (hairHint || "ثبّت… يتم الالتقاط"));
      el("ring").classList.toggle("ok", ok);
      if (ok) {
        if (!alignedSince) alignedSince = now;
        if (now - alignedSince >= HOLD_MS) captureStep(STEPS[stepIdx]);
      } else alignedSince = 0;
    }
  }
  requestAnimationFrame(loop);
}
async function startCapture() {
  show("s-capture");
  el("target").textContent = "—";
  shots.front = shots.left = shots.right = null; stepIdx = 0; alignedSince = 0;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
    vid().srcObject = stream; await vid().play();
    el("hud").textContent = "جارٍ تحميل النموذج…";
    await Promise.all([window.Face.init(), initVideoLandmarker()]);
    running = true;
    el("btnManual").disabled = false; el("btnRedo").disabled = false;
    setChips(); requestAnimationFrame(loop);
  } catch (e) {
    el("hud").textContent = "تعذّر تشغيل الكاميرا: " + (e && e.message || e);
  }
}
function stopCamera() {
  running = false;
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}
el("btnCam").addEventListener("click", startCapture);
el("btnManual").addEventListener("click", () => {
  if (running && stepIdx < STEPS.length && !capturing) captureStep(STEPS[stepIdx]);
});
el("btnRedo").addEventListener("click", () => {
  shots.front = shots.left = shots.right = null; stepIdx = 0; alignedSince = 0; setChips();
});

// ---------------------------------------------------------- analysis
function median(arr) {
  const v = arr.slice().sort((a, b) => a - b);
  const n = v.length;
  return n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
}
async function runAnalysis() {
  show("s-busy");
  el("busyMsg").textContent = "جارٍ التحليل…";
  try {
    const runs = [];
    for (let i = 0; i < state.fronts.length; i++) {
      el("busyMsg").textContent = `جارٍ التحليل… (${i + 1}/${state.fronts.length})`;
      const r = await window.Face.analyzeMultiAngle({
        front: state.fronts[i], left: state.left, right: state.right });
      if (r && r.metrics && Object.keys(r.metrics).length) runs.push(r);
    }
    if (!runs.length) throw new Error("لم يتم العثور على وجه واضح في الصورة");
    // median-combine the flat metrics across burst frames
    const flats = runs.map(r => ({ ...(r.metrics || {}), ...(r.profile || {}) }));
    const keys = new Set(flats.flatMap(f => Object.keys(f)));
    const flat = {};
    for (const k of keys) {
      const vals = flats.map(f => f[k]).filter(v => typeof v === "number" && isFinite(v));
      if (vals.length) flat[k] = median(vals);
      else if (flats[0][k] != null) flat[k] = flats[0][k];   // non-numeric (labels)
    }
    state.flat = flat;
    state.rich = runs[0];
    state.usedFrames = runs.length;
    state.z = Scoring.zScoreMetrics(flat);
    renderResults();
    show("s-results");
  } catch (e) {
    alert("فشل التحليل: " + (e.message || e));
    show("s-start");
  }
}

// ---------------------------------------------------------- render
const dirTag = z => z >= 0.25 ? ["مرتفعة", "hi"] : z <= -0.25 ? ["منخفضة", "lo"] : ["متوسطة", "mid"];

function renderQuality() {
  const r = state.rich;
  const a = r.angles || {};
  const hlSrc = { segmenter: "تقطيع الشعر (دقيق)", skin_scan: "مسح لون الجلد", fallback: "تقديري ⚠" }
    [state.flat.hairline_source] || "—";
  const sides = (a.left ? 1 : 0) + (a.right ? 1 : 0);
  el("qualityCard").innerHTML = `
    <h2>جودة القياس</h2>
    <div class="qgrid">
      <div class="qitem">إطارات مدموجة<b>${state.usedFrames}</b></div>
      <div class="qitem">زوايا جانبية<b>${sides} / 2</b></div>
      <div class="qitem">ميل الرأس (مُصحَّح)<b dir="ltr">${a.front ? a.front.roll + "°" : "—"}</b></div>
      <div class="qitem">خط الشعر<b>${hlSrc}</b></div>
    </div>`;
}

function renderTraits() {
  const sel = Scoring.selectAdaptiveQuestions(state.flat, "advanced", { threshold: 0.55 });
  const rows = [];
  for (const [tid, a] of Object.entries(sel.assessments)) {
    if (a.score == null || !a.measured) continue;
    const meta = Scoring.getTraitMeta(tid) || { name: tid };
    rows.push({ tid, name: meta.name, category: meta.category || "أخرى",
                score: a.score, conf: a.confidence, measured: a.measured, total: a.total });
  }
  rows.sort((x, y) => y.conf - x.conf);
  const confident = rows.filter(r => r.conf >= 0.55);
  const row = r => {
    const [txt, cls] = dirTag(r.score);
    return `<div class="t-row">
      <span class="t-name">${r.name}</span>
      <span class="t-dir ${cls}">${txt}</span>
      <span class="t-conf"><span>ثقة ${Math.round(r.conf * 100)}%</span>
        <span class="bar"><i style="width:${Math.round(r.conf * 100)}%"></i></span>
        <span>${r.measured}/${r.total} قياس</span></span>
    </div>`;
  };
  const top = rows.slice(0, 12), rest = rows.slice(12);
  el("traitsPanel").innerHTML = `
    <div class="big-score">
      <span class="n">${confident.length}</span>
      <span class="cap">صفة قدر الوجه يقرأها بثقة عالية<br>(من أصل ${sel.traits_total} صفة في النموذج)</span>
    </div>
    <div class="trait-group"><h3>أوضح القراءات</h3>${top.map(row).join("")}</div>
    ${rest.length ? `<details class="more"><summary>عرض باقي الصفات (${rest.length})</summary>
      ${rest.map(row).join("")}</details>` : ""}`;
}

function renderMetrics() {
  const bl = Scoring.getBaselines() || {};
  const html = METRIC_GROUPS.map(([title, items]) => {
    const rows = items.map(([k, label]) => {
      const v = state.flat[k], z = state.z[k];
      if (typeof v !== "number") return "";
      const prov = bl[k] && bl[k].source !== "dataset_282"
        ? ` <span class="prov-mark">تقريبي</span>` : "";
      if (typeof z !== "number") {
        return `<div class="m-row"><span class="m-name">${label}${prov}</span>
          <span class="m-val" style="grid-column:2/4">${+v.toFixed(3)}</span></div>`;
      }
      const [txt, cls] = dirTag(z);
      const pos = (1 - (z + 1) / 2) * 100;   // z=+1 → start edge
      return `<div class="m-row">
        <span class="m-name">${label}${prov}</span>
        <span class="m-scale"><span class="m-dot" style="right:${pos.toFixed(1)}%"></span></span>
        <span class="m-val">${+v.toFixed(3)}<br><span class="m-tag ${cls}">${txt}</span></span>
      </div>`;
    }).filter(Boolean).join("");
    return rows ? `<div class="m-group"><h3>${title}</h3>${rows}</div>` : "";
  }).join("");
  el("metricsPanel").innerHTML = html;
}

function renderExtras() {
  const px = state.rich.pixel || {};
  const items = [];
  if (px.eye_color)
    items.push(`<div class="x-item">لون العين<b>${px.eye_color.classification}</b>ثقة ${px.eye_color.confidence}</div>`);
  if (px.sclera)
    items.push(`<div class="x-item">بياض العين (sanpaku)<b>${px.sclera.sanpaku}</b></div>`);
  if (px.hair) {
    items.push(`<div class="x-item">قمة الأرملة<b>${px.hair.widow_peak}</b></div>`);
    items.push(`<div class="x-item">تغطية الشعر<b>${Math.round((px.hair.hair_coverage || 0) * 100)}%</b></div>`);
  }
  el("extrasCard").innerHTML = items.length
    ? `<h2>قراءات إضافية</h2><div class="x-grid">${items.join("")}</div>`
    : "";
}

// repeatability across sessions (localStorage)
function renderRepeat() {
  const KEY = "facelab_sessions";
  let sessions = [];
  try { sessions = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (_) {}
  sessions.push({ ts: Date.now(), z: state.z });
  while (sessions.length > 10) sessions.shift();
  try { localStorage.setItem(KEY, JSON.stringify(sessions)); } catch (_) {}
  const card = el("repeatCard");
  if (sessions.length < 2) {
    card.innerHTML = `<h2>اختبار الثبات</h2>
      <p class="muted small">اضغط «قيس تاني» بعد النتيجة — لو القراءة اتكررت متقاربة، فده دليل إن القياس حقيقي مش صدفة.</p>`;
    return;
  }
  const prev = sessions[sessions.length - 2].z, cur = state.z;
  const common = Object.keys(cur).filter(k => typeof prev[k] === "number");
  if (!common.length) { card.innerHTML = ""; return; }
  const meanAbs = common.reduce((s, k) => s + Math.abs(cur[k] - prev[k]), 0) / common.length;
  const agree = Math.max(0, Math.round(100 - meanAbs * 50));
  const cls = agree >= 85 ? "repeat-good" : "repeat-mid";
  const verdict = agree >= 85 ? "ثبات ممتاز ✓" : agree >= 70 ? "ثبات جيد" : "ثبات ضعيف — أعد التصوير بإضاءة أفضل وثبات أكثر";
  card.innerHTML = `<h2>اختبار الثبات</h2>
    <div class="big-score"><span class="n ${cls}">${agree}%</span>
    <span class="cap">تطابق القياس بين آخر جلستين (${common.length} قياس مشترك)<br><span class="${cls}">${verdict}</span></span></div>`;
}

function renderResults() {
  renderQuality();
  renderRepeat();
  renderTraits();
  renderMetrics();
  renderExtras();
}

// ---------------------------------------------------------- actions
el("btnAgain").addEventListener("click", startCapture);
el("btnRestart").addEventListener("click", () => location.reload());
el("btnExport").addEventListener("click", () => {
  const data = {
    exported_at: new Date().toISOString(),
    engine: "tawafuq-facelab-v1",
    frames_used: state.usedFrames,
    metrics: state.flat,
    z_scores: state.z,
    angles: state.rich && state.rich.angles,
    pixel: state.rich && state.rich.pixel,
  };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `facelab_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});
