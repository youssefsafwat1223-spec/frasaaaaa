// ============================================================
// app.js — Tawafuq app-style face flow (Cinematic UI)
//   intro ▸ readiness-check page (5 checks turn ✓) ▸ Face-ID-style
//   capture (tick ring, slow head turn, best-frame per zone)
//   ▸ AI processing ▸ results
// No voice. No hold-still stops — capture happens during motion.
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
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  el(id).classList.add("active");
}

// Arabic labels for the metrics (used in "بناءً على …")
const METRIC_AR = {
  face_aspect_ratio: "نسبة عرض الوجه لطوله", forehead_ratio: "ارتفاع الجبهة",
  forehead_width_ratio: "عرض الجبهة", widening_ratio: "اتساع الجبهة لأعلى",
  forehead_slant_ratio: "ميل الجبهة", forehead_lines_density: "خطوط الجبهة",
  forehead_smoothness: "نعومة الجبهة", lower_face_ratio: "الثلث السفلي للوجه",
  eye_open_ratio: "انفتاح العينين", eye_size_ratio: "حجم العينين",
  eye_spacing_ratio: "المسافة بين العينين", eye_tilt_ratio: "ميل زوايا العينين",
  brow_eye_distance_ratio: "ارتفاع الحاجب عن العين", brow_inner_distance: "تقارب الحاجبين",
  brow_arch: "تقوّس الحاجب", brow_density: "كثافة الحاجب",
  nose_length_ratio: "طول الأنف", nose_width_ratio: "عرض الأنف",
  nostril_width_ratio: "اتساع فتحات الأنف", nose_tip_drop_ratio: "اتجاه طرف الأنف",
  mouth_width_ratio: "عرض الفم", mouth_height_ratio: "فتحة الشفاه",
  upper_lip_ratio: "امتلاء الشفة العليا", lower_lip_ratio: "امتلاء الشفة السفلى",
  philtrum_ratio: "طول النثرة", mouth_corner_tilt: "ميل زوايا الفم",
  lower_lip_protrusion: "بروز الشفة السفلى",
  jaw_width_ratio: "عرض الفك", jaw_angle_sharpness: "حدّة زاوية الفك",
  chin_width_ratio: "عرض الذقن", cheek_fullness: "امتلاء الخدود",
  nose_bridge_convexity: "شكل جسر الأنف", nose_profile_angle: "زاوية الأنف الجانبية",
  chin_sagittal_projection: "بروز الذقن", brow_ridge_projection: "بروز عظمة الحاجب",
  forehead_slope_profile: "ميل الجبهة الجانبي",
};
const CAT_EMOJI = {
  "العاطفة والمشاعر": "💗", "التواصل الاجتماعي": "🗣️", "الإرادة والطموح": "🎯",
  "العقل والتفكير": "🧠", "الانضباط والنظام": "📏", "الطبع والمزاج": "🌤️",
};
const EM_BG = ["var(--peach)", "var(--gold)", "var(--pink)"];
const FRAME_AR = {
  square:  { name: "مربع",    em: "◼️", meaning: "حزم وعملية وقدرة على التحمّل — ملامح القيادة والثبات" },
  round:   { name: "مستدير",  em: "⚪", meaning: "اجتماعية وودّ وتكيّف — قرب من الناس وسهولة في التواصل" },
  oval:    { name: "بيضاوي",  em: "🥚", meaning: "توازن ودبلوماسية — مزيج مرن بين العقل والعاطفة" },
  heart:   { name: "قلب",     em: "♥️", meaning: "جبهة واسعة وذقن مدبب — فكر نشِط وطموح وحسم سريع" },
  oblong:  { name: "مستطيل",  em: "▭", meaning: "منهجية وصبر وتخطيط بعيد المدى — نفس طويل في الشغل" },
};

// the 15 focus traits — highest face-measurability in the 60-trait model
const FOCUS_15 = ["hadi_24", "hadi_02", "hadi_23", "hadi_47", "hadi_60",
                  "hadi_09", "hadi_10", "hadi_56", "hadi_03", "hadi_33",
                  "hadi_01", "hadi_19", "hadi_40", "hadi_42", "hadi_46"];

// Arabic labels for abstract (unmeasurable-from-photo) feature names
const FEATURE_AR = {
  eye_depth: "عمق العين", upper_lid_coverage: "الجفن العلوي", lash_density: "كثافة الرموش",
  nose_bridge_height: "ارتفاع جسر الأنف", nose_bridge_straightness: "استقامة جسر الأنف",
  nose_tip_sharpness: "حدّة طرف الأنف", nose_tip_size: "حجم طرف الأنف",
  cheekbone_prominence: "بروز عظام الوجنة", cheekbone_height: "ارتفاع عظام الوجنة",
  chin_roundness: "استدارة الذقن", chin_dimple: "غمّازة الذقن",
  brow_definition: "وضوح الحاجب", brow_symmetry: "تماثل الحاجبين", brow_tension: "شدّ الحاجب",
  mouth_stability: "ثبات الفم", chin_stability: "ثبات الذقن",
  feature_rigidity: "صلابة الملامح", feature_softness: "نعومة الملامح",
  mouth_tension_ratio: "شدّ الفم", lower_lip_tension: "شدّ الشفة السفلى",
  upper_lip_tension: "شدّ الشفة العليا", forehead_tension: "شدّ الجبهة",
  face_muscle_tension: "شدّ عضلات الوجه", lip_flexibility: "مرونة الشفاه",
};

// ---------------------------------------------------------- state
const state = { fronts: [], left: null, right: null, flat: null, z: null, rich: null,
                usedFrames: 0, gender: null };

document.querySelectorAll(".gbtn").forEach(b =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".gbtn").forEach(x => x.classList.remove("sel"));
    b.classList.add("sel");
    state.gender = b.dataset.g;
    el("btnStart").disabled = false;
  }));

// ---------------------------------------------------------- boot
(async function boot() {
  try {
    await Scoring.init();
    el("boot").textContent = "";
    if (window.Segment) window.Segment.init().catch(() => {});
  } catch (e) {
    el("boot").textContent = "فشل التحميل: " + (e.message || e);
  }
})();

// ---------------------------------------------------------- shared pose helpers
let mode = "check";                       // "check" (page 1) | "capture" (page 2)

function matrixPose(res) {
  const m = res && res.facialTransformationMatrixes && res.facialTransformationMatrixes[0];
  if (!m || !m.data || m.data.length < 12) return null;
  const d = m.data;
  const n = { x: d[8], y: d[9], z: d[10] };
  const u = { x: d[4], y: d[5] };
  return {
    yaw:   +(Math.atan2(n.x, n.z) * 180 / Math.PI).toFixed(1),
    pitch: +(Math.atan2(n.y, Math.hypot(n.x, n.z)) * 180 / Math.PI).toFixed(1),
    roll:  +(Math.atan2(u.x, u.y) * 180 / Math.PI).toFixed(1),
  };
}
const PITCH_LIMIT = 14;
function pitchIssue(pitch) {
  if (pitch > PITCH_LIMIT)  return "نزّل الموبايل لمستوى عينك";
  if (pitch < -PITCH_LIMIT) return "ارفع الموبايل لمستوى عينك";
  return null;
}
function checkOrientation() {
  const landscape = window.matchMedia("(orientation: landscape)").matches;
  el("rotateOverlay").classList.toggle("show", landscape && running && mode === "capture");
}
window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);

const still = { prev: null, val: 1 };
const STILL_THR = 0.006;
function motionOf(lm) {
  const pts = [];
  for (let i = 0; i < lm.length; i += 10) pts.push([lm[i].x, lm[i].y]);
  const scale = Math.hypot(lm[33].x - lm[263].x, lm[33].y - lm[263].y) || 1e-6;
  let m = 1;
  if (still.prev && still.prev.length === pts.length) {
    let s = 0;
    for (let i = 0; i < pts.length; i++)
      s += Math.hypot(pts[i][0] - still.prev[i][0], pts[i][1] - still.prev[i][1]);
    m = (s / pts.length) / scale;
  }
  still.prev = pts;
  still.val = m;
  return m;
}

// ---------------------------------------------------------- readiness checks (page 1)
const CHECK_DEFS = [
  { k: "light", ic: "💡", name: "الإضاءة" },
  { k: "dist",  ic: "📏", name: "المسافة" },
  { k: "glass", ic: "🕶", name: "بدون نضّارة" },
  { k: "level", ic: "📱", name: "الموبايل في مستوى العين" },
  { k: "expr",  ic: "😐", name: "تعبير محايد" },
];
const ready = { since: 0 };
function renderCheckList(issues, hairWarn) {
  el("checkList").innerHTML = CHECK_DEFS.map(d => {
    const issue = issues[d.k];
    return `<div class="chk ${issue ? "bad" : "ok"}">
      <span class="ic">${d.ic}</span>
      <span class="tx"><b>${d.name}</b><p>${issue || "تمام"}</p></span>
      <span class="st">${issue ? "✗" : "✓"}</span>
    </div>`;
  }).join("") + (hairWarn ? `<div class="chk">
      <span class="ic">💇</span>
      <span class="tx"><b>الشعر</b><p>يفضّل ترفع الشعر عن الجبهة</p></span>
      <span class="st">!</span></div>` : "");
}

// ---------------------------------------------------------- landmarker
let vidLm = null, stream = null, running = false;
let lastTs = -1, capturing = false;
const pre = { hair: null, hairBusy: false, hairLast: 0 };
let _hairCv = null;

async function initVideoLandmarker() {
  if (vidLm) return;
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM);
  let lastErr = null;
  for (const path of MODEL_CANDIDATES) {
    try {
      vidLm = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: path },
        runningMode: "VIDEO", numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        minFaceDetectionConfidence: 0.3, minFacePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });
      return;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("landmarker init failed");
}
function expressionIssue(blend) {
  if (!blend || !blend.categories) return null;
  const get = n => blend.categories.find(c => c.categoryName === n)?.score ?? 0;
  if (get("jawOpen") > 0.25) return "اقفل بُقّك — تعبير محايد";
  if ((get("mouthSmileLeft") + get("mouthSmileRight")) / 2 > 0.4) return "من غير ابتسامة";
  if ((get("eyeBlinkLeft") + get("eyeBlinkRight")) / 2 > 0.5) return "افتح عينيك طبيعي";
  return null;
}
function scheduleHairCheck(v, lm) {
  const now = performance.now();
  if (pre.hairBusy || now - pre.hairLast < 700 || !window.Segment) return;
  pre.hairBusy = true; pre.hairLast = now;
  if (!_hairCv) _hairCv = document.createElement("canvas");
  const w = 192, h = Math.max(1, Math.round(v.videoHeight * 192 / (v.videoWidth || 192)));
  _hairCv.width = w; _hairCv.height = h;
  _hairCv.getContext("2d").drawImage(v, 0, 0, w, h);
  window.Segment.hairOverForehead(_hairCv, lm)
    .then(r => { pre.hair = r; }).catch(() => {})
    .finally(() => { pre.hairBusy = false; });
}

// ---------------------------------------------------------- AR canvas (mesh + tick ring)
const ar = { cv: null, ctx: null };
const AR_ANCHORS = [33,133,362,263, 70,300,105,334, 1,2,168, 61,291,13,14,0,17, 152,10,234,454,172,397];
function arSetup() {
  if (!ar.cv) { ar.cv = el("arCanvas"); ar.ctx = ar.cv.getContext("2d"); }
  const r = el("s-scan").getBoundingClientRect();
  const w = Math.round(r.width), h = Math.round(r.height);
  if (w && h && (ar.cv.width !== w || ar.cv.height !== h)) { ar.cv.width = w; ar.cv.height = h; }
}
function mapPts(lm, v) {
  const cw = ar.cv.width, ch = ar.cv.height;
  const vw = v.videoWidth, vh = v.videoHeight;
  if (!vw || !vh) return null;
  const s = Math.max(cw / vw, ch / vh);
  const ox = (cw - vw * s) / 2, oy = (ch - vh * s) / 2;
  return lm.map(p => [cw - (p.x * vw * s + ox), p.y * vh * s + oy]); // mirrored
}
// circle geometry — must match .circle-mask CSS (width:min(78vw,330px), top:42%)
function ringGeom() {
  const cw = ar.cv.width, ch = ar.cv.height;
  return { cx: cw / 2, cy: ch * 0.42, R: Math.min(cw * 0.39, 165) };
}
// ---- Face-ID exact tick ring ----
// iOS enrollment behaviour: light-gray thin ticks; the fan of ticks in the
// direction the head currently points ELONGATES live (before capture); once a
// direction is registered its ticks settle LONG and iOS-GREEN and stay.
const IOS_GREEN = "#34C759", TICK_GRAY = "#D1D1D6", TICK_POINT = "#8E8E93";
function drawTicks(ctx) {
  const { cx, cy, R } = ringGeom();
  const r0 = R + 6;
  for (let i = 0; i < TICKS; i++) {
    // live "pointing" boost: gaussian falloff around the current head yaw
    const dYaw = fid.lastYaw - tickYaw(i);
    const point = fid.faceSeen ? Math.exp(-(dYaw * dYaw) / (2 * 8 * 8)) : 0;
    // covered ticks spring to full length and stay
    const target = fid.covered[i] ? 1 : 0;
    fid.anim[i] += (target - fid.anim[i]) * 0.16;
    const t = fid.anim[i];
    const grow = Math.max(t, point * 0.8);
    const len = 10 + 16 * grow;                     // 10px → 26px
    const a = i * (2 * Math.PI / TICKS);
    ctx.strokeStyle = t > 0.5 ? IOS_GREEN
                    : point > 0.25 ? TICK_POINT : TICK_GRAY;
    ctx.lineWidth = 2 + 0.8 * grow;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a));
    ctx.lineTo(cx + (r0 + len) * Math.cos(a), cy + (r0 + len) * Math.sin(a));
    ctx.stroke();
  }
}
// Face-ID look: tick ring only — clean face, no overlays inside the circle.
function drawAR(lm, v) {
  if (!ar.ctx) return;
  const ctx = ar.ctx;
  ctx.clearRect(0, 0, ar.cv.width, ar.cv.height);
  drawTicks(ctx);
}

// ---------------------------------------------------------- Face-ID-style capture
// The user slowly turns the head right then left. Ticks around the ring light
// up per covered yaw. The engine opportunistically keeps the SHARPEST frame
// per side zone — no hold-still stops. Front is a quick 3-frame burst first.
const TICKS = 72, YAW_MAX = 75;
const SIDE_MIN = 40, SIDE_BEST = 56, SIDE_DONE = 48;
const BURST_N = 3, BURST_GAP = 120;
const fid = {};
function fidReset() {
  fid.covered = new Array(TICKS).fill(false);
  fid.anim = new Array(TICKS).fill(0);
  fid.front = null; fid.frontSince = 0; fid.lastYaw = 0;
  fid.faceSeen = false; fid.completing = false;
  fid.prevYaw = null; fid.tooFast = false;
  fid.zones = {
    left:  { best: null, done: false },   // user turns RIGHT (yaw +40..72)
    right: { best: null, done: false },   // user turns LEFT  (yaw -40..-72)
  };
}
fidReset();
const tickYaw = i => YAW_MAX * Math.cos(i * (2 * Math.PI / TICKS));
// Like iOS: coverage only registers while the head moves SLOWLY.
// A fast turn lights nothing and triggers the "slow down" hint.
const MAX_YAW_STEP = 2.4;   // deg per frame (~70°/s at 30fps)
function markCovered(yaw) {
  const step = fid.prevYaw == null ? 0 : Math.abs(yaw - fid.prevYaw);
  fid.prevYaw = yaw;
  fid.tooFast = step > MAX_YAW_STEP;
  if (fid.tooFast) return;
  for (let i = 0; i < TICKS; i++)
    if (Math.abs(yaw - tickYaw(i)) <= 7) fid.covered[i] = true;
}
// a side is complete only when its WHOLE arc (28°..62°) has been swept slowly
function arcCovered(sign) {
  for (let i = 0; i < TICKS; i++) {
    const ty = tickYaw(i) * sign;
    if (ty >= 28 && ty <= 62 && !fid.covered[i]) return false;
  }
  return true;
}
function centerCheck(lm, v) {
  if (!ar.cv || !ar.cv.width) return { ok: true, hint: "" };
  const pts = mapPts(lm, v);
  if (!pts) return { ok: true, hint: "" };
  let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
  for (const [x, y] of pts) { if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; }
  const fw = x2 - x1, fcx = (x1 + x2) / 2, fcy = (y1 + y2) / 2;
  const { cx, cy, R } = ringGeom();
  if (fw < R * 0.9)  return { ok: false, hint: "قرّب شوية — املا الدايرة بوشك" };
  if (fw > R * 2.4)  return { ok: false, hint: "ابعد شوية عن الكاميرا" };
  if (Math.hypot(fcx - cx, fcy - cy) > R * 0.55)
    return { ok: false, hint: "حط وشك في نص الدايرة" };
  return { ok: true, hint: "" };
}
function snapshot() {
  const v = el("vid");
  const cv = document.createElement("canvas");
  cv.width = v.videoWidth; cv.height = v.videoHeight;
  cv.getContext("2d").drawImage(v, 0, 0);
  return cv;
}
function flash() {
  const f = el("flash");
  f.classList.add("show");
  setTimeout(() => f.classList.remove("show"), 120);
}
async function captureFrontBurst() {
  capturing = true;
  flash();
  const frames = [snapshot()];
  for (let i = 1; i < BURST_N; i++) {
    await new Promise(r => setTimeout(r, BURST_GAP));
    frames.push(snapshot());
  }
  fid.front = frames;
  capturing = false;
  setDotsFid();
}
function setDotsFid() {
  const states = [!!fid.front, fid.zones.left.done, fid.zones.right.done];
  const labels = ["١", "٢", "٣"];
  document.querySelectorAll(".adot").forEach((d, i) => {
    d.classList.toggle("done", states[i]);
    d.classList.toggle("cur", !states[i] && states.slice(0, i).every(Boolean));
    d.textContent = states[i] ? "✓" : labels[i];
  });
}
function setTurn(arrow) {
  const b = el("turnBubble");
  b.classList.toggle("show", !!arrow);
  if (arrow) b.textContent = arrow;
}
// the animated head guideline under the circle: pg-front | pg-right | pg-left
function setGuide(cls) {
  const g = el("poseGuide");
  if (g && !g.classList.contains(cls)) g.className = "pose-guide " + cls;
}
function finishFid() {
  stopCamera();
  state.fronts = fid.front;
  state.left = fid.zones.left.best.canvas;
  state.right = fid.zones.right.best.canvas;
  runAnalysis();
}

function fidFrame(v, lm, res, blend, now) {
  if (fid.completing) { drawAR(lm, v); return; }
  if (!lm) {
    fid.faceSeen = false;
    el("scanP").textContent = "لا يوجد وجه واضح…";
    drawAR(null, v);
    return;
  }
  fid.faceSeen = true;
  const pose = window.Face.poseFromLandmarks(lm);
  const q = window.Face.frameQuality(v, lm);
  const sharpOk = (q.metrics.sharp ?? 0) >= 0.015;
  const c = centerCheck(lm, v);
  fid.lastYaw = pose.yaw;
  if (c.ok && sharpOk) markCovered(pose.yaw);
  let hint = "";

  if (!fid.front) {
    // step 1: quick frontal burst (needs neutral face, brief settle only)
    el("scanH").textContent = "ضع وجهك داخل الدائرة";
    setGuide("pg-front");
    setTurn(null);
    const expr = expressionIssue(blend);
    const moving = motionOf(lm) > STILL_THR * 2;
    if (Math.abs(pose.yaw) > 10)      { hint = "بص للكاميرا في النص الأول"; fid.frontSince = 0; }
    else if (!c.ok)                   { hint = c.hint; fid.frontSince = 0; }
    else if (expr)                    { hint = expr; fid.frontSince = 0; }
    else if (!sharpOk || moving)      { hint = "ثانية واحدة…"; fid.frontSince = 0; }
    else {
      if (!fid.frontSince) fid.frontSince = now;
      hint = "تمام…";
      if (now - fid.frontSince > 250 && !capturing) captureFrontBurst();
    }
  } else {
    // step 2: slow turn right then left — best frame per zone, no stopping
    motionOf(lm);   // keep the motion tracker warm
    const L = fid.zones.left, R2 = fid.zones.right;
    const zone = pose.yaw >= SIDE_MIN ? L : pose.yaw <= -SIDE_MIN ? R2 : null;
    if (zone && !zone.done && !capturing && sharpOk && c.ok) {
      const score = (q.metrics.sharp ?? 0) * 100 - Math.abs(Math.abs(pose.yaw) - SIDE_BEST) * 0.4;
      if (!zone.best || score > zone.best.score + 0.3)
        zone.best = { canvas: snapshot(), score };
    }
    // completion = the whole arc swept slowly + a good side frame in hand
    if (!L.done && L.best && arcCovered(1))   { L.done = true; flash(); }
    if (L.done && !R2.done && R2.best && arcCovered(-1)) { R2.done = true; flash(); }
    el("scanH").textContent = "حرّك رأسك ببطء لإكمال الدائرة";
    if (!L.done) {
      setGuide("pg-right");
      hint = fid.tooFast ? "بشويش… حرّك رأسك أبطأ" : c.ok ? "لِف ناحية اليمين…" : c.hint;
    } else if (!R2.done) {
      setGuide("pg-left");
      hint = fid.tooFast ? "بشويش… حرّك رأسك أبطأ" : c.ok ? "ممتاز — دلوقتي ناحية الشمال…" : c.hint;
    }
    if (L.done && R2.done) {
      // iOS-style completion moment: whole ring settles green, then continue
      fid.completing = true;
      fid.covered.fill(true);
      el("scanH").textContent = "اكتمل المسح ✓";
      el("scanP").textContent = "";
      setGuide("pg-front");
      setTurn(null);
      setTimeout(finishFid, 900);
      drawAR(lm, v);
      return;
    }
  }
  el("scanP").textContent = hint;
  drawAR(lm, v);
}

// ---------------------------------------------------------- page 1 frame
function checkFrame(v, lm, res, blend, now) {
  if (!lm) {
    renderCheckList({ light: "—", dist: "حط وشك قدّام الكاميرا", glass: "—", level: "—", expr: "—" }, false);
    ready.since = 0;
    el("btnToCapture").disabled = true;
    return;
  }
  const q = window.Face.frameQuality(v, lm, { checkGlasses: true });
  const mPose = matrixPose(res);
  const pose = window.Face.poseFromLandmarks(lm);
  scheduleHairCheck(v, lm);
  const pick = (...w) => q.issues.find(s => w.some(x => s.includes(x))) || null;
  const issues = {
    light: pick("الإضاءة", "الضوء", "ظل", "نور"),
    dist:  pick("اقترب", "ابعد"),
    glass: (q.glasses && q.glasses.glasses) ? "شيل النضّارة" : null,
    level: pitchIssue(mPose ? mPose.pitch : pose.pitch),
    expr:  expressionIssue(blend) || pick("بُق"),
  };
  const hairWarn = pre.hair && pre.hair.covered;
  renderCheckList(issues, hairWarn);
  const allOk = Object.values(issues).every(x => !x);
  if (allOk) { if (!ready.since) ready.since = now; }
  else ready.since = 0;
  const rdy = !!ready.since && (now - ready.since > 700);
  el("btnToCapture").disabled = !rdy;
  el("btnToCapture").textContent = rdy ? "التالي — التصوير ✓" : "التالي — التصوير";
}

// ---------------------------------------------------------- main loop + transitions
function loop() {
  if (!running) return;
  const now = performance.now();
  const v = mode === "check" ? el("vidCheck") : el("vid");
  if (!capturing && v.readyState >= 2 && v.currentTime !== lastTs) {
    lastTs = v.currentTime;
    let res = null;
    try { res = vidLm.detectForVideo(v, now); } catch (_) {}
    const lm = res && res.faceLandmarks && res.faceLandmarks[0];
    const blend = res && res.faceBlendshapes && res.faceBlendshapes[0];
    if (mode === "check") checkFrame(v, lm, res, blend, now);
    else fidFrame(v, lm, res, blend, now);
  }
  requestAnimationFrame(loop);
}
async function startCheck() {
  show("s-check"); mode = "check"; ready.since = 0;
  renderCheckList({ light: "…", dist: "…", glass: "…", level: "…", expr: "…" }, false);
  try {
    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
    }
    el("vidCheck").srcObject = stream; await el("vidCheck").play();
    await Promise.all([window.Face.init(), initVideoLandmarker()]);
    running = true; lastTs = -1;
    requestAnimationFrame(loop);
  } catch (e) {
    alert("تعذّر تشغيل الكاميرا: " + (e && e.message || e));
    show("s-intro");
  }
}
function beginCapture() {
  mode = "capture";
  fidReset(); lastTs = -1;
  show("s-scan");
  el("vid").srcObject = stream; el("vid").play();
  arSetup();
  if (!ar._resizeHooked) { window.addEventListener("resize", arSetup); ar._resizeHooked = true; }
  checkOrientation(); setDotsFid();
  el("scanH").textContent = "حط وشك جوّه الدايرة";
  el("scanP").textContent = "هنلف الراس ببطء — من غير وقفات";
  setTurn(null);
}
function stopCamera() {
  running = false; mode = "check";
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}

el("btnStart").addEventListener("click", startCheck);
el("btnToCapture").addEventListener("click", beginCapture);
el("btnCheckBack").addEventListener("click", () => { stopCamera(); show("s-intro"); });
el("btnClose").addEventListener("click", () => { stopCamera(); show("s-intro"); });
el("btnManual").addEventListener("click", () => {
  if (!running || mode !== "capture" || capturing) return;
  if (!fid.front) { captureFrontBurst(); return; }
  const y = fid.lastYaw;
  const zone = y >= 15 ? fid.zones.left : y <= -15 ? fid.zones.right : null;
  if (zone && !zone.done) {
    zone.best = { canvas: snapshot(), score: 999 };
    zone.done = true;
    flash(); setDotsFid();
    if (fid.zones.left.done && fid.zones.right.done) finishFid();
  }
});

// ---------------------------------------------------------- analysis
function median(arr) {
  const v = arr.slice().sort((a, b) => a - b), n = v.length;
  return n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
}
async function runAnalysis() {
  show("s-busy");
  const bar = el("busyBar");
  bar.style.width = "8%";
  try {
    const runs = [];
    for (let i = 0; i < state.fronts.length; i++) {
      const r = await window.Face.analyzeMultiAngle({
        front: state.fronts[i], left: state.left, right: state.right });
      if (r && r.metrics && Object.keys(r.metrics).length) runs.push(r);
      bar.style.width = `${15 + 70 * (i + 1) / state.fronts.length}%`;
    }
    if (!runs.length) throw new Error("لم يتم العثور على وجه واضح");
    const flats = runs.map(r => ({ ...(r.metrics || {}), ...(r.profile || {}) }));
    const keys = new Set(flats.flatMap(f => Object.keys(f)));
    const flat = {};
    for (const k of keys) {
      const vals = flats.map(f => f[k]).filter(v => typeof v === "number" && isFinite(v));
      if (vals.length) flat[k] = median(vals);
      else if (flats[0][k] != null) flat[k] = flats[0][k];
    }
    state.flat = flat; state.rich = runs[0]; state.usedFrames = runs.length;
    state.z = Scoring.zScoreMetrics(flat, state.gender);
    bar.style.width = "100%";
    await new Promise(r => setTimeout(r, 450));
    renderResults();
    show("s-done");
  } catch (e) {
    alert("فشل التحليل: " + (e.message || e));
    show("s-intro");
  }
}

// ---------------------------------------------------------- results
const dirInfo = s => s >= 0.25 ? ["مرتفعة", "dir-hi"] : s <= -0.25 ? ["منخفضة", "dir-lo"] : ["متوسطة", "dir-mid"];
function lvlText(z) {
  if (z >= 0.55) return "أعلى من المتوسط بوضوح";
  if (z >= 0.25) return "أعلى من المتوسط قليلاً";
  if (z <= -0.55) return "أقل من المتوسط بوضوح";
  if (z <= -0.25) return "أقل من المتوسط قليلاً";
  return "قريب من المتوسط";
}
function whyRows(tid) {
  const rows = [];
  for (const f of Scoring.getTraitFeatures(tid)) {
    const label = (f.js && METRIC_AR[f.js]) || FEATURE_AR[f.feature] || f.feature;
    const z = f.js != null ? state.z[f.js] : undefined;
    if (typeof z !== "number") {
      rows.push(`<div class="why-row na"><span class="why-dot">○</span>
        <span><b>${label}</b> — لا يُقاس من الصورة، يُستكمل بالأسئلة</span></div>`);
      continue;
    }
    let s;
    if (f.direction === "high" || f.direction === "up") s = z;
    else if (f.direction === "low" || f.direction === "down") s = -z;
    else s = 1 - Math.abs(z);
    const support = s > 0.15 ? ["يدعم ارتفاع الصفة", "up"]
                  : s < -0.15 ? ["يدعم انخفاض الصفة", "down"]
                  : ["تأثير محايد", "flat"];
    const tags = [];
    if (f.hits > 1) tags.push(`قوة ×${f.hits}`);
    if (f.source === "profile") tags.push("قياس جانبي");
    if (f.proxy) tags.push("تقريبي");
    rows.push(`<div class="why-row ${support[1]}">
      <span class="why-dot">${support[1] === "up" ? "▲" : support[1] === "down" ? "▼" : "•"}</span>
      <span><b>${label}</b>: ${lvlText(z)} ← ${support[0]}${tags.length ? ` <i>(${tags.join(" · ")})</i>` : ""}</span>
    </div>`);
  }
  return rows.join("");
}
function traitCard(r, i, open) {
  const [dTxt, dCls] = dirInfo(r.score);
  return `<details class="glass tcard-x" ${open ? "open" : ""}>
    <summary>
      <div class="em" style="background:${EM_BG[i % EM_BG.length]}">${CAT_EMOJI[r.category] || "✨"}</div>
      <div class="tx-main">
        <h4>${r.name}</h4>
        <p>${r.measured} قياس من ملامحك · ثقة ${Math.round(r.conf * 100)}%</p>
      </div>
      <span class="dirpill ${dCls}">${dTxt}</span>
      <span class="chev">▾</span>
    </summary>
    <div class="why">
      <div class="why-head">ليه طلعت النتيجة دي؟</div>
      ${whyRows(r.tid)}
      <div class="why-note">الصورة تلميح احتمالي — الأسئلة في التطبيق الكامل بترفع الدقة والثقة.</div>
    </div>
  </details>`;
}
function renderResults() {
  const sel = Scoring.selectAdaptiveQuestions(state.flat, "advanced",
                                              { threshold: 0.55, gender: state.gender });
  const all = {};
  for (const [tid, a] of Object.entries(sel.assessments)) {
    if (a.score == null || !a.measured) continue;
    const meta = Scoring.getTraitMeta(tid) || { name: tid };
    all[tid] = { tid, name: meta.name, category: meta.category || "",
                 score: a.score, conf: a.confidence, measured: a.measured };
  }
  const focus = FOCUS_15.map(tid => all[tid]).filter(Boolean)
                        .sort((x, y) => y.conf - x.conf);
  const rest = Object.values(all).filter(r => !FOCUS_15.includes(r.tid))
                     .sort((x, y) => y.conf - x.conf);

  const fr = Scoring.classifyFaceFrame(state.z);
  let frameCard = "";
  if (fr) {
    const p = FRAME_AR[fr.primary] || { name: fr.primary, em: "✨", meaning: "" };
    const s = fr.secondary ? FRAME_AR[fr.secondary] : null;
    const title = s ? `بين ${p.name} و${s.name}` : p.name;
    const bars = fr.scored.slice(0, 3).map(x => {
      const f = FRAME_AR[x.frame] || { name: x.frame };
      return `<div class="why-row flat"><span class="why-dot">${(FRAME_AR[x.frame] || {}).em || "•"}</span>
        <span><b>${f.name}</b>: قرب ${x.closeness}%</span></div>`;
    }).join("");
    frameCard = `<details class="glass tcard-x" open>
      <summary>
        <div class="em" style="background:var(--gold)">${p.em}</div>
        <div class="tx-main"><h4>إطار وجهك: ${title}</h4>
          <p>${p.meaning}</p></div>
        <span class="chev">▾</span>
      </summary>
      <div class="why">
        <div class="why-head">أقرب الإطارات لقياساتك</div>
        ${bars}
        <div class="why-note">تصنيف تجريبي متعلّم من 1,265 وجه مرجعي — بيتحسّن مع الداتا. ${s ? "وجهك بين إطارين فذكرناهما معًا بأمانة." : ""}</div>
      </div>
    </details>`;
  }

  el("doneP").textContent = "الـ15 صفة الأساسية اللي بنركّز عليها — افتح أي صفة تشوف ليه طلعت كده:";
  el("tcards").innerHTML =
    frameCard +
    focus.map((r, i) => traitCard(r, i, i === 0)).join("") +
    (rest.length ? `<details class="rest-wrap"><summary>باقي الصفات (${rest.length}) — تجريبية، دقتها أقل</summary>
      ${rest.map((r, i) => traitCard(r, i, false)).join("")}</details>` : "");

  const sides = ((state.rich.angles || {}).left ? 1 : 0) + ((state.rich.angles || {}).right ? 1 : 0);
  el("miniStats").innerHTML = `
    <div class="glass mini"><b>${sel.traits_confident}</b><span>صفة واثقة من الصورة</span></div>
    <div class="glass mini"><b>${Object.keys(state.z).length}</b><span>قياس مُعايَر</span></div>
    <div class="glass mini"><b>${state.usedFrames}×${1 + sides}</b><span>إطارات × زوايا</span></div>`;

  renderRepeat();
}
function renderRepeat() {
  const KEY = "tawafuq_app_sessions";
  let sessions = [];
  try { sessions = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (_) {}
  sessions.push({ ts: Date.now(), z: state.z });
  while (sessions.length > 10) sessions.shift();
  try { localStorage.setItem(KEY, JSON.stringify(sessions)); } catch (_) {}
  const note = el("repeatNote");
  if (sessions.length < 2) { note.textContent = ""; return; }
  const prev = sessions[sessions.length - 2].z, cur = state.z;
  const common = Object.keys(cur).filter(k => typeof prev[k] === "number");
  if (!common.length) { note.textContent = ""; return; }
  const meanAbs = common.reduce((s, k) => s + Math.abs(cur[k] - prev[k]), 0) / common.length;
  const agree = Math.max(0, Math.round(100 - meanAbs * 50));
  note.innerHTML = agree >= 85
    ? `<span class="good">✓ ثبات القراءة بين آخر قياسين: ${agree}%</span>`
    : agree >= 70
    ? `<span class="mid">ثبات القراءة: ${agree}% — جيد</span>`
    : `<span class="mid">ثبات القراءة: ${agree}% — أعد بإضاءة أفضل</span>`;
}

el("btnAgain").addEventListener("click", startCheck);
el("btnDetails").addEventListener("click", () => { location.href = "./lab.html"; });
