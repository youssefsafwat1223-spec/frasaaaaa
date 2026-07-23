// ============================================================
// multi_capture.js — guided multi-angle face capture (proposal 3).
// Live VIDEO-mode pose readout + auto-capture front/left/right,
// then merge via Face.analyzeMultiAngle().
// ============================================================

import { FilesetResolver, FaceLandmarker }
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const VISION_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_CANDIDATES = [
  "./models/face_landmarker.task",
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
];

// ---- capture targets (yaw in degrees; >0 = head turned to subject's left) ----
const STEPS = ["front", "left", "right"];
const GATE = {
  front: { test: p => Math.abs(p.yaw) <= 8  && Math.abs(p.roll) <= 12,
           hint: "وجّه وجهك للأمام مباشرة" },
  left:  { test: p => p.yaw >= 40 && p.yaw <= 72 && Math.abs(p.roll) <= 16,
           hint: "لِف رأسك ناحية اليمين برِفق (~55°)" },
  right: { test: p => p.yaw <= -40 && p.yaw >= -72 && Math.abs(p.roll) <= 16,
           hint: "لِف رأسك ناحية اليسار برِفق (~55°)" },
};
const HOLD_MS = 600; // must stay aligned this long before auto-capture

// ---- DOM ----
const vid       = document.getElementById("vid");
const ring      = document.getElementById("ring");
const hud       = document.getElementById("hud");
const target    = document.getElementById("target");
const startBtn  = document.getElementById("startBtn");
const manualBtn = document.getElementById("manualBtn");
const resetBtn  = document.getElementById("resetBtn");
const analyzeBtn= document.getElementById("analyzeBtn");
const results   = document.getElementById("results");
const anglesOut = document.getElementById("anglesOut");
const frontOut  = document.getElementById("frontOut");
const profileOut= document.getElementById("profileOut");
const pixelOut  = document.getElementById("pixelOut");
const limitNote = document.getElementById("limitNote");
const prep      = document.getElementById("prep");
const prepStart = document.getElementById("prepStart");
const chips     = [...document.querySelectorAll(".chip")];
const thumbs    = Object.fromEntries(
  [...document.querySelectorAll(".thumb")].map(t => [t.dataset.t, t]));

// ---- state ----
let videoLandmarker = null;
let stream = null;
let running = false;
let stepIdx = 0;                       // which STEP we are trying to capture
const shots = { front: null, left: null, right: null }; // canvases
let alignedSince = 0;
let lastVideoTs = -1;

// ---- live landmarker (VIDEO mode, separate from Face's IMAGE-mode one) ----
async function initVideoLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM);
  let lastErr = null;
  for (const path of MODEL_CANDIDATES) {
    try {
      videoLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: path },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.3,
        minFacePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });
      return;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("VIDEO FaceLandmarker init failed");
}

// ---- snapshot current video frame to an off-screen canvas (un-mirrored) ----
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
  const cv = snapshot();
  shots[stepKey] = cv;
  if (thumbs[stepKey]) thumbs[stepKey].src = cv.toDataURL("image/jpeg", 0.7);
  setChipState();
  // advance to next uncaptured step
  const next = STEPS.findIndex(s => !shots[s]);
  stepIdx = next < 0 ? STEPS.length : next;
  alignedSince = 0;
  if (STEPS.every(s => shots[s])) {
    analyzeBtn.disabled = false;
    target.textContent = "تم التقاط الزوايا الثلاث ✓ — اضغط «تحليل ودمج»";
    ring.classList.remove("ok");
  }
}

// ---- main RAF loop ----
function loop() {
  if (!running) return;
  const now = performance.now();
  if (vid.readyState >= 2 && vid.currentTime !== lastVideoTs) {
    lastVideoTs = vid.currentTime;
    let res = null;
    try { res = videoLandmarker.detectForVideo(vid, now); } catch (_) {}
    const lm = res && res.faceLandmarks && res.faceLandmarks[0];
    if (!lm) {
      hud.textContent = "لا يوجد وجه واضح…";
      ring.classList.remove("ok");
      alignedSince = 0;
    } else if (stepIdx < STEPS.length) {
      const pose = window.Face.poseFromLandmarks(lm);
      const q = window.Face.frameQuality(vid, lm);
      const stepKey = STEPS[stepIdx];
      const gate = GATE[stepKey];
      const poseOk = gate.test(pose);
      const ok = poseOk && q.ok;
      hud.innerHTML =
        `yaw <b>${pose.yaw}</b>° · إضاءة <b>${q.metrics.brightness ?? "—"}</b> · حجم <b>${q.metrics.faceFill ?? "—"}</b>`;
      // quality problems take priority over angle hint
      target.textContent = !q.ok ? q.issues[0]
                         : !poseOk ? gate.hint
                         : "ثبّت… يتم الالتقاط";
      ring.classList.toggle("ok", ok);
      if (ok) {
        if (!alignedSince) alignedSince = now;
        if (now - alignedSince >= HOLD_MS) captureStep(stepKey);
      } else {
        alignedSince = 0;
      }
    }
  }
  requestAnimationFrame(loop);
}

async function start() {
  startBtn.disabled = true;
  hud.textContent = "جارٍ تشغيل الكاميرا…";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
    vid.srcObject = stream;
    await vid.play();
    await Promise.all([
      window.Face.init(),
      initVideoLandmarker(),
      window.Segment ? window.Segment.init().catch(() => {}) : Promise.resolve(),
    ]);
    running = true;
    manualBtn.disabled = false;
    resetBtn.disabled = false;
    setChipState();
    requestAnimationFrame(loop);
  } catch (e) {
    hud.textContent = "تعذّر تشغيل الكاميرا: " + (e && e.message || e);
    startBtn.disabled = false;
  }
}

function manualCapture() {
  if (!running || stepIdx >= STEPS.length) return;
  captureStep(STEPS[stepIdx]);
}

function reset() {
  shots.front = shots.left = shots.right = null;
  stepIdx = 0;
  alignedSince = 0;
  analyzeBtn.disabled = true;
  results.classList.add("hidden");
  anglesOut.innerHTML = frontOut.innerHTML = profileOut.innerHTML = pixelOut.innerHTML = "";
  Object.values(thumbs).forEach(t => { t.src = ""; });
  setChipState();
  target.textContent = "—";
}

function metricCard(label, val) {
  const v = (typeof val === "number") ? (Math.abs(val) < 100 ? val.toFixed(3) : val.toFixed(1))
          : (val == null ? "—" : val);
  const d = document.createElement("div");
  d.className = "metric";
  d.innerHTML = `${label}<br><b>${v}</b>`;
  return d;
}

async function analyze() {
  analyzeBtn.disabled = true;
  target.textContent = "جارٍ التحليل والدمج…";
  const merged = await window.Face.analyzeMultiAngle({
    front: shots.front, left: shots.left, right: shots.right,
  });

  anglesOut.innerHTML = "";
  for (const k of ["front", "left", "right"]) {
    const p = merged.angles[k];
    anglesOut.appendChild(metricCard(
      k === "front" ? "أمامية" : k === "left" ? "يمين" : "يسار",
      p ? `yaw ${p.yaw}° / pitch ${p.pitch}° / roll ${p.roll}°` : "—"));
  }

  frontOut.innerHTML = "";
  const fm = merged.metrics || {};
  Object.keys(fm).sort().forEach(k => frontOut.appendChild(metricCard(k, fm[k])));

  profileOut.innerHTML = "";
  const pm = merged.profile || {};
  const pk = Object.keys(pm);
  if (pk.length) pk.forEach(k => profileOut.appendChild(metricCard(k, pm[k])));
  else profileOut.appendChild(metricCard("لا قياسات جانبية", "—"));

  pixelOut.innerHTML = "";
  const px = merged.pixel || {};
  if (px.eye_color)
    pixelOut.appendChild(metricCard(
      `لون العين (${px.eye_color.confidence})`,
      `${px.eye_color.classification} · rgb(${px.eye_color.rgb.join(",")})`));
  if (px.sclera) {
    pixelOut.appendChild(metricCard("بياض أسفل القزحية", px.sclera.lower_sclera_ratio));
    pixelOut.appendChild(metricCard("ثلاثي الأبيض (سانباكو)", px.sclera.sanpaku));
  }
  if (px.hair) {
    pixelOut.appendChild(metricCard("الشعر موجود", px.hair.hair_present ? "نعم" : "لا"));
    pixelOut.appendChild(metricCard("تغطية الشعر", px.hair.hair_coverage));
    pixelOut.appendChild(metricCard("ارتفاع خط الشعر", px.hair.hairline_y_ratio));
    pixelOut.appendChild(metricCard("قمة أرملة", px.hair.widow_peak));
  }
  if (!Object.keys(px).length)
    pixelOut.appendChild(metricCard("لا قياسات بكسل", "—"));

  limitNote.textContent = (merged.notes || []).join(" ") ||
    "الأذن، لون العين، الشعر، وعمق العين لا تُلتقط (غير موجودة في شبكة الوجه).";
  results.classList.remove("hidden");
  target.textContent = "اكتمل التحليل ✓";
}

prepStart.addEventListener("click", () => { prep.classList.add("hidden"); start(); });
startBtn.addEventListener("click", () => { prep.classList.add("hidden"); start(); });
manualBtn.addEventListener("click", manualCapture);
resetBtn.addEventListener("click", reset);
analyzeBtn.addEventListener("click", analyze);
