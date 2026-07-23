// ============================================================
// face.js — MediaPipe FaceLandmarker wrapper for the demo.
// Reuses the metric computations from the project's test.js.
// Public API:
//    await Face.init()
//    await Face.analyzeImageElement(imgOrVideoEl)  ->  {metrics, faces}
//    Face.faceVectorFor(metrics)  -> small vector for matching
// ============================================================

import { FilesetResolver, FaceLandmarker }
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const MODEL_CANDIDATES = [
  "./models/face_landmarker.task",
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
];

let landmarker = null;

async function init() {
  if (landmarker) return;
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  let lastErr = null;
  for (const path of MODEL_CANDIDATES) {
    try {
      landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: path },
        runningMode: "IMAGE",
        numFaces: 1,
        minFaceDetectionConfidence: 0.25,
        minFacePresenceConfidence: 0.25,
        minTrackingConfidence: 0.25,
        outputFaceBlendshapes: false,
      });
      return;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("FaceLandmarker init failed");
}

// ---------- Geometry helpers (mirror test.js) ----------
const safeDiv = (a, b) => (b ? a / b : null);
const euclidean = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pt = (lm, i, w, h) => ({ x: lm[i].x * w, y: lm[i].y * h });

function angleAt(corner, a, b) {
  const v1x = a.x - corner.x, v1y = a.y - corner.y;
  const v2x = b.x - corner.x, v2y = b.y - corner.y;
  const dot = v1x*v2x + v1y*v2y;
  const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
  if (!m1 || !m2) return null;
  return Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * 180 / Math.PI;
}

function bboxOf(lm, w, h) {
  const xs = lm.map(p => p.x * w), ys = lm.map(p => p.y * h);
  return { x1: Math.min(...xs), x2: Math.max(...xs),
           y1: Math.min(...ys), y2: Math.max(...ys) };
}

function crop(img, bb, fullW, fullH) {
  const bw = bb.x2 - bb.x1, bh = bb.y2 - bb.y1;
  const c = {
    x1: Math.max(0, Math.round(bb.x1 - 0.15*bw)),
    x2: Math.min(fullW, Math.round(bb.x2 + 0.15*bw)),
    y1: Math.max(0, Math.round(bb.y1 - 0.50*bh)),
    y2: Math.min(fullH, Math.round(bb.y2 + 0.15*bh)),
  };
  const cw = c.x2 - c.x1, ch = c.y2 - c.y1;
  const cv = document.createElement("canvas");
  cv.width = cw; cv.height = ch;
  cv.getContext("2d").drawImage(img, c.x1, c.y1, cw, ch, 0, 0, cw, ch);
  return { canvas: cv, meta: c };
}

function rebase(lm, c, fullW, fullH, cw, ch) {
  return lm.map(p => ({
    x: (p.x*fullW - c.x1) / cw,
    y: (p.y*fullH - c.y1) / ch,
    z: p.z || 0,
  }));
}

// ---------- Pixel helpers ----------
function lum(d, idx) { return 0.299*d[idx] + 0.587*d[idx+1] + 0.114*d[idx+2]; }

function roi(imgData, w, h, x1, y1, x2, y2) {
  x1 = Math.max(0, Math.floor(x1)); y1 = Math.max(0, Math.floor(y1));
  x2 = Math.min(w-1, Math.ceil(x2)); y2 = Math.min(h-1, Math.ceil(y2));
  if (x2 <= x1 || y2 <= y1) return null;
  let sum=0, sumSq=0, dark=0, edge=0, n=0;
  const d = imgData.data;
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const idx = (y*w + x) * 4;
      const l = lum(d, idx);
      sum += l; sumSq += l*l;
      if (l < 80) dark += 1;
      if (y > y1 && y < y2) {
        const lup = lum(d, ((y-1)*w + x)*4);
        const ldn = lum(d, ((y+1)*w + x)*4);
        if (Math.abs(ldn - lup) > 30) edge += 1;
      }
      n += 1;
    }
  }
  const mean = sum / n;
  const variance = sumSq / n - mean*mean;
  return { mean, std: Math.sqrt(Math.max(0, variance)),
           dark_ratio: dark / n, edge_ratio: edge / n, count: n };
}

function sampleSkin(imgData, w, h, c) {
  const x = Math.max(0, Math.min(w-1, Math.round(c.x)));
  const y = Math.max(0, Math.min(h-1, Math.round(c.y)));
  let s=[0,0,0], n=0;
  for (let yy = Math.max(0, y-2); yy <= Math.min(h-1, y+2); yy++)
    for (let xx = Math.max(0, x-2); xx <= Math.min(w-1, x+2); xx++) {
      const idx = (yy*w + xx)*4;
      s[0]+=imgData.data[idx]; s[1]+=imgData.data[idx+1]; s[2]+=imgData.data[idx+2];
      n++;
    }
  return n ? s.map(v => v/n) : [0,0,0];
}

function detectHairline(imgData, w, h, lm) {
  const p10 = pt(lm, 10, w, h), p168 = pt(lm, 168, w, h);
  const start = { x: (p10.x+p168.x)/2, y: (p10.y+p168.y)/2 };
  const skin = sampleSkin(imgData, w, h, start);
  const x = Math.max(0, Math.min(w-1, Math.round(start.x)));
  const startY = Math.round(start.y);
  const limitY = Math.max(0, Math.round(p10.y - h * 0.25));
  let best = null, consec = 0;
  for (let y = startY; y >= limitY; y--) {
    const idx = (y*w + x) * 4;
    const px = [imgData.data[idx], imgData.data[idx+1], imgData.data[idx+2]];
    const d = Math.hypot(px[0]-skin[0], px[1]-skin[1], px[2]-skin[2]);
    if (d > 60) { consec++; if (best == null) best = y;
                  if (consec >= 3) return { point: { x, y: best }, ok: true }; }
    else { best = null; consec = 0; }
  }
  return { point: p10, ok: false };
}

// ---------- Metrics (mirror of test.js) ----------
function computeMetrics(cropCanvas, lm) {
  const w = cropCanvas.width, h = cropCanvas.height;
  const ctx = cropCanvas.getContext("2d", { willReadFrequently: true });
  const id  = ctx.getImageData(0, 0, w, h);
  const hl  = detectHairline(id, w, h, lm);
  const hair = hl.point;

  // base landmarks
  const p168=pt(lm,168,w,h), p9=pt(lm,9,w,h), p152=pt(lm,152,w,h),
        p103=pt(lm,103,w,h), p332=pt(lm,332,w,h),
        p70=pt(lm,70,w,h), p300=pt(lm,300,w,h),
        p234=pt(lm,234,w,h), p454=pt(lm,454,w,h),
        p33=pt(lm,33,w,h), p133=pt(lm,133,w,h),
        p263=pt(lm,263,w,h), p362=pt(lm,362,w,h),
        p159=pt(lm,159,w,h), p145=pt(lm,145,w,h),
        p386=pt(lm,386,w,h), p374=pt(lm,374,w,h),
        p1=pt(lm,1,w,h), p2=pt(lm,2,w,h),
        p61=pt(lm,61,w,h), p291=pt(lm,291,w,h),
        p13=pt(lm,13,w,h), p14=pt(lm,14,w,h),
        p0=pt(lm,0,w,h), p17=pt(lm,17,w,h),
        p172=pt(lm,172,w,h), p397=pt(lm,397,w,h);

  const foreheadHeight = euclidean(hair, p168);
  const faceHeight     = euclidean(hair, p152);
  const foreheadTopW   = euclidean(p103, p332);
  const browW          = euclidean(p70, p300);
  const faceW          = euclidean(p234, p454);
  const rEyeW = euclidean(p33, p133), lEyeW = euclidean(p362, p263);
  const avgEyeW = (rEyeW + lEyeW)/2;
  const rEyeOpen = euclidean(p159, p145), lEyeOpen = euclidean(p386, p374);
  const avgEyeOpen = (rEyeOpen + lEyeOpen)/2;
  const eyeSpacing = euclidean(p133, p362);
  const browEyeD = (euclidean(p70, p33) + euclidean(p300, p263))/2;
  const mouthW = euclidean(p61, p291), mouthH = euclidean(p13, p14);
  const upperLip = euclidean(p0, p13), lowerLip = euclidean(p14, p17);
  const philtrum = euclidean(p2, p13);
  const lowerFaceH = euclidean(p2, p152);
  const noseLen = euclidean(p168, p2);
  const noseProj = Math.abs(p1.x - p168.x);
  const noseDrop = p2.y - p1.y;
  const fhSlant = Math.abs(hair.x - p9.x);
  const fhVert  = Math.abs(hair.y - p9.y);
  const jawW = euclidean(p172, p397);
  const chinProj = Math.abs(p152.x - p13.x);

  const base = {
    forehead_height: foreheadHeight, face_height: faceHeight,
    forehead_ratio: safeDiv(foreheadHeight, faceHeight),
    forehead_top_width: foreheadTopW, brow_width: browW,
    widening_ratio: safeDiv(foreheadTopW, browW),
    face_width: faceW,
    face_aspect_ratio: safeDiv(faceW, faceHeight),
    eye_spacing: eyeSpacing,
    eye_spacing_ratio: safeDiv(eyeSpacing, faceW),
    eye_size_ratio: safeDiv(avgEyeW, faceW),
    eye_open_ratio: safeDiv(avgEyeOpen, avgEyeW),
    eye_tilt_ratio: safeDiv(p263.y - p33.y, euclidean(p33, p263)),
    brow_eye_distance_ratio: safeDiv(browEyeD, faceHeight),
    mouth_width_ratio: safeDiv(mouthW, faceW),
    mouth_height_ratio: safeDiv(mouthH, faceHeight),
    upper_lip_ratio: safeDiv(upperLip, faceHeight),
    lower_lip_ratio: safeDiv(lowerLip, faceHeight),
    philtrum_ratio: safeDiv(philtrum, faceHeight),
    lower_face_ratio: safeDiv(lowerFaceH, faceHeight),
    nose_length_ratio: safeDiv(noseLen, faceHeight),
    nose_tip_projection_ratio: safeDiv(noseProj, faceW),
    nose_tip_drop_ratio: safeDiv(noseDrop, faceHeight),
    forehead_slant_ratio: safeDiv(fhSlant, fhVert),
    jaw_width_ratio: safeDiv(jawW, faceW),
    chin_projection_ratio: safeDiv(chinProj, faceW),
  };

  // extended landmarks
  const p55=pt(lm,55,w,h), p285=pt(lm,285,w,h),
        p105=pt(lm,105,w,h), p334=pt(lm,334,w,h),
        p49=pt(lm,49,w,h), p279=pt(lm,279,w,h),
        p129=pt(lm,129,w,h), p358=pt(lm,358,w,h),
        p176=pt(lm,176,w,h), p400=pt(lm,400,w,h),
        p150=pt(lm,150,w,h), p379=pt(lm,379,w,h);
  const browInner = euclidean(p55, p285);
  const browArch  = (((p70.y+p55.y)/2 - p105.y) + ((p300.y+p285.y)/2 - p334.y))/2;
  const noseAlar  = euclidean(p129, p358);
  const nostrilSpan = euclidean(p49, p279);
  const chinW = euclidean(p176, p400);
  const jawAngleL = angleAt(p172, p150, p61);
  const jawAngleR = angleAt(p397, p379, p291);
  const jawAngle  = (jawAngleL!=null && jawAngleR!=null) ? (jawAngleL+jawAngleR)/2 : null;
  const lowerLipProtr = (p17.y - (p0.y + p152.y)/2) / Math.max(1, faceHeight);
  const mouthCornerOffset = ((p61.y+p291.y)/2) - ((p0.y+p17.y)/2);
  const ext = {
    brow_inner_distance: safeDiv(browInner, faceW),
    brow_arch: safeDiv(browArch, faceHeight),
    nose_width_ratio: safeDiv(noseAlar, faceW),
    nostril_width_ratio: safeDiv(nostrilSpan, faceW),
    chin_width_ratio: safeDiv(chinW, faceW),
    jaw_angle_sharpness: jawAngle != null ? +(180 - jawAngle).toFixed(2) : null,
    lower_lip_protrusion: +lowerLipProtr.toFixed(4),
    mouth_corner_tilt: safeDiv(mouthCornerOffset, faceHeight),
  };

  // pixel-based
  const fhX1 = Math.min(p70.x, p300.x), fhX2 = Math.max(p70.x, p300.x);
  const fhY1 = Math.min(hair.y, p168.y), fhY2 = Math.max(hair.y, p168.y) - 4;
  const fhStats = roi(id, w, h, fhX1, fhY1, fhX2, fhY2);
  const browLStats = roi(id, w, h, p70.x-6, p70.y-4, p70.x+30, p70.y+6);
  const browRStats = roi(id, w, h, p300.x-30, p300.y-4, p300.x+6, p300.y+6);
  const browDark = (browLStats && browRStats) ? (browLStats.dark_ratio + browRStats.dark_ratio)/2 : null;
  const p101=pt(lm,101,w,h), p330=pt(lm,330,w,h);
  const cheekL = roi(id, w, h, p101.x-12, p101.y-12, p101.x+12, p101.y+12);
  const cheekR = roi(id, w, h, p330.x-12, p330.y-12, p330.x+12, p330.y+12);
  const cheekHL = (cheekL && cheekR) ? ((cheekL.std + cheekR.std)/2) / 64.0 : null;
  const pix = {
    forehead_lines_density: fhStats ? +fhStats.edge_ratio.toFixed(4) : null,
    forehead_smoothness:    fhStats ? +(1 - fhStats.edge_ratio).toFixed(4) : null,
    brow_density:           browDark != null ? +browDark.toFixed(4) : null,
    cheek_fullness:         cheekHL != null ? +cheekHL.toFixed(4) : null,
  };

  return { ...base, ...ext, ...pix, hairline_detected: hl.ok };
}

// ---------- Public ----------
async function analyzeImageElement(el) {
  if (!landmarker) await init();
  const w = el.naturalWidth || el.videoWidth || el.width;
  const h = el.naturalHeight || el.videoHeight || el.height;
  const res = landmarker.detect(el);
  if (!res.faceLandmarks || !res.faceLandmarks.length) return null;
  const lm = res.faceLandmarks[0];
  const bb = bboxOf(lm, w, h);
  const { canvas, meta } = crop(el, bb, w, h);
  const rebased = rebase(lm, meta, w, h, canvas.width, canvas.height)
                    .map(p => ({ x: p.x, y: p.y, z: p.z })); // pt() expects .x in [0,1]
  // pt() multiplies by w/h again, so convert rebased into "fraction of crop"
  const fracLm = rebased.map(p => ({ x: p.x, y: p.y, z: p.z }));
  // Our `pt()` here computes p.x * width — but rebased already gives x in [0,1]?
  // The original test.js calls pt(landmarks, idx, cropW, cropH) and landmarks are
  // mediapipe-style (x in [0,1]). After rebase we keep the same shape so OK.
  const metrics = computeMetrics(canvas, fracLm);
  return { metrics, faces: res.faceLandmarks.length, bbox: bb };
}

// small face vector for matching (use a subset of stable ratios)
function faceVectorFor(metrics) {
  const keys = [
    "forehead_ratio", "face_aspect_ratio", "eye_open_ratio",
    "mouth_width_ratio", "mouth_height_ratio",
    "upper_lip_ratio", "lower_lip_ratio",
    "jaw_width_ratio", "chin_projection_ratio",
    "brow_eye_distance_ratio", "brow_inner_distance",
    "nose_width_ratio", "nose_length_ratio",
  ];
  const v = {};
  for (const k of keys) if (typeof metrics[k] === "number") v[k] = metrics[k];
  return v;
}

window.Face = { init, analyzeImageElement, faceVectorFor };
