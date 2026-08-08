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
        outputFacialTransformationMatrixes: true,
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

// opts.darkThr / opts.edgeThr let callers adapt thresholds to the face's own
// illumination (fixed constants made brow/forehead metrics lighting-dependent).
function roi(imgData, w, h, x1, y1, x2, y2, opts = {}) {
  const darkThr = opts.darkThr ?? 80, edgeThr = opts.edgeThr ?? 30;
  const brightThr = opts.brightThr ?? 245;
  x1 = Math.max(0, Math.floor(x1)); y1 = Math.max(0, Math.floor(y1));
  x2 = Math.min(w-1, Math.ceil(x2)); y2 = Math.min(h-1, Math.ceil(y2));
  if (x2 <= x1 || y2 <= y1) return null;
  let sum=0, sumSq=0, dark=0, bright=0, edge=0, n=0;
  const d = imgData.data;
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const idx = (y*w + x) * 4;
      const l = lum(d, idx);
      sum += l; sumSq += l*l;
      if (l < darkThr) dark += 1;
      if (l > brightThr) bright += 1;
      if (y > y1 && y < y2) {
        const lup = lum(d, ((y-1)*w + x)*4);
        const ldn = lum(d, ((y+1)*w + x)*4);
        if (Math.abs(ldn - lup) > edgeThr) edge += 1;
      }
      n += 1;
    }
  }
  const mean = sum / n;
  const variance = sumSq / n - mean*mean;
  return { mean, std: Math.sqrt(Math.max(0, variance)),
           dark_ratio: dark / n, bright_ratio: bright / n,
           edge_ratio: edge / n, count: n };
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

// ---------- Roll normalisation ----------
// Rotate the crop + landmarks so the eye line is horizontal. Small head tilt
// (the capture gate allows up to 12°) otherwise pollutes eye_tilt_ratio,
// mouth_corner_tilt and every width/height measurement.
function rotateFace(canvas, fracLm, rollDeg) {
  if (!isFinite(rollDeg) || Math.abs(rollDeg) < 1.5) return { canvas, lm: fracLm };
  const w = canvas.width, h = canvas.height;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d");
  const th = -rollDeg * Math.PI / 180;
  ctx.translate(w/2, h/2); ctx.rotate(th); ctx.drawImage(canvas, -w/2, -h/2);
  const cos = Math.cos(th), sin = Math.sin(th);
  const lm = fracLm.map(p => {
    const x = p.x*w - w/2, y = p.y*h - h/2;
    return { x: (x*cos - y*sin + w/2) / w, y: (x*sin + y*cos + h/2) / h, z: p.z || 0 };
  });
  return { canvas: cv, lm };
}

// ---------- Metrics (mirror of test.js) ----------
// hlOverride: hairline point from the ImageSegmenter (more robust than the
// single-column skin scan) — {point:{x,y}, ok:true} in crop pixels.
function computeMetrics(cropCanvas, lm, hlOverride) {
  const w = cropCanvas.width, h = cropCanvas.height;
  const ctx = cropCanvas.getContext("2d", { willReadFrequently: true });
  const id  = ctx.getImageData(0, 0, w, h);
  const hl  = (hlOverride && hlOverride.ok) ? hlOverride : detectHairline(id, w, h, lm);
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
    forehead_width_ratio: safeDiv(foreheadTopW, faceW),  // scale-free (raw px don't transfer)
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

  // pixel-based — thresholds adapt to this face's own skin luminance so the
  // metrics survive dim/bright lighting (fixed 80/30 did not).
  const p101=pt(lm,101,w,h), p330=pt(lm,330,w,h);
  const cheekL = roi(id, w, h, p101.x-12, p101.y-12, p101.x+12, p101.y+12);
  const cheekR = roi(id, w, h, p330.x-12, p330.y-12, p330.x+12, p330.y+12);
  const skinRef = (cheekL && cheekR) ? (cheekL.mean + cheekR.mean)/2
                : (cheekL ? cheekL.mean : (cheekR ? cheekR.mean : 128));
  const darkThr = Math.max(45, Math.min(120, skinRef * 0.62));
  const edgeThr = Math.max(16, skinRef * 0.11);
  const fhX1 = Math.min(p70.x, p300.x), fhX2 = Math.max(p70.x, p300.x);
  const fhY1 = Math.min(hair.y, p168.y), fhY2 = Math.max(hair.y, p168.y) - 4;
  const fhStats = roi(id, w, h, fhX1, fhY1, fhX2, fhY2, { edgeThr });
  const browLStats = roi(id, w, h, p70.x-6, p70.y-4, p70.x+30, p70.y+6, { darkThr });
  const browRStats = roi(id, w, h, p300.x-30, p300.y-4, p300.x+6, p300.y+6, { darkThr });
  const browDark = (browLStats && browRStats) ? (browLStats.dark_ratio + browRStats.dark_ratio)/2 : null;
  const cheekHL = (cheekL && cheekR) ? ((cheekL.std + cheekR.std)/2) / 64.0 : null;
  const pix = {
    forehead_lines_density: fhStats ? +fhStats.edge_ratio.toFixed(4) : null,
    forehead_smoothness:    fhStats ? +(1 - fhStats.edge_ratio).toFixed(4) : null,
    brow_density:           browDark != null ? +browDark.toFixed(4) : null,
    cheek_fullness:         cheekHL != null ? +cheekHL.toFixed(4) : null,
  };

  return { ...base, ...ext, ...pix, hairline_detected: hl.ok };
}

// ---------- Head pose (yaw/pitch/roll) ----------
// Geometric estimate from normalized landmarks (x,y in [0,1]). Robust enough
// to GATE multi-angle capture. yaw>0 = head turned to subject's left.
function poseFromLandmarks(lm) {
  const nose = lm[1], left = lm[234], right = lm[454];
  const eyeR = lm[33], eyeL = lm[263], chin = lm[152], brow = lm[9];
  const cx = (left.x + right.x) / 2;
  const half = (right.x - left.x) / 2 || 1e-6;
  let r = (nose.x - cx) / half;            // ~ sin(yaw)
  r = Math.max(-1, Math.min(1, r));
  const yaw = Math.asin(r) * 180 / Math.PI;
  // pitch: nose vertical position between eyes and chin
  const eyeMidY = (eyeR.y + eyeL.y) / 2;
  const span = (chin.y - eyeMidY) || 1e-6;
  const pr = (nose.y - eyeMidY) / span;    // ~0.33 neutral
  const pitch = (pr - 0.33) * 120;         // rough degrees
  // roll: tilt of the eye line
  const roll = Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x) * 180 / Math.PI;
  return { yaw: +yaw.toFixed(1), pitch: +pitch.toFixed(1), roll: +roll.toFixed(1) };
}

// ---------- Profile-derived metrics (sagittal) ----------
// Only meaningful at yaw ~ 45-70deg. Uses the visible silhouette. NOTE: face
// mesh has NO ear landmarks, so ears are still NOT captured — these add the
// nasal profile, chin projection (sagittal) and forehead slope only.
function computeProfileMetrics(fracLm, w, h, side /* "left"|"right" */) {
  const P = i => pt(fracLm, i, w, h);
  // nose bridge chain: nasion(168) -> tip(1); deviation of mid points from the
  // straight nasion->tip line tells convex(Roman,+) vs concave(snub,-).
  const nasion = P(168), tip = P(1), subnasale = P(2);
  const bridge = [6, 197, 195, 5, 4].map(P);
  const dx = tip.x - nasion.x, dy = tip.y - nasion.y;
  const len = Math.hypot(dx, dy) || 1e-6;
  let dev = 0;
  for (const b of bridge) {
    // signed perpendicular distance from nasion->tip line, normalized
    const cross = ((b.x - nasion.x) * dy - (b.y - nasion.y) * dx) / len;
    dev += cross;
  }
  dev /= bridge.length;
  const faceH = euclidean(P(10), P(152)) || euclidean(nasion, P(152)) || 1e-6;
  const sign = side === "left" ? 1 : -1;   // mirror so convex is + on both sides
  const bridgeConvexity = +((sign * dev) / faceH).toFixed(4);
  // nose profile angle at the tip (nasion-tip-subnasale)
  const noseProfileAngle = angleAt(tip, nasion, subnasale);
  // chin sagittal projection: how far chin(152) sits forward of lower lip(17)
  const chinSag = +(((sign * (P(152).x - P(17).x))) / faceH).toFixed(4);
  // brow ridge projection: glabella(9) forward of eye(side)
  const eye = side === "left" ? P(263) : P(33);
  const browRidge = +(((sign * (P(9).x - eye.x))) / faceH).toFixed(4);
  // forehead slope: horizontal run of top(10)->glabella(9) over vertical
  const fhRun = Math.abs(P(10).x - P(9).x), fhRise = Math.abs(P(10).y - P(9).y) || 1e-6;
  const foreheadSlope = +(fhRun / fhRise).toFixed(4);
  return {
    nose_bridge_convexity: bridgeConvexity,     // + Roman/convex, - concave/snub
    nose_profile_angle: noseProfileAngle != null ? +noseProfileAngle.toFixed(1) : null,
    chin_sagittal_projection: chinSag,
    brow_ridge_projection: browRidge,
    forehead_slope_profile: foreheadSlope,
  };
}

// ---------- Eye color from iris pixels (468-477) ----------
function rgb2hsv(r, g, b) {
  r/=255; g/=255; b/=255;
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx-mn;
  let h = 0;
  if (d) {
    if (mx===r) h = ((g-b)/d) % 6;
    else if (mx===g) h = (b-r)/d + 2;
    else h = (r-g)/d + 4;
    h *= 60; if (h<0) h += 360;
  }
  return { h, s: mx ? d/mx : 0, v: mx*255 };
}

function irisRadius(lm, center, ring, w, h) {
  const c = pt(lm, center, w, h);
  const r = ring.map(i => euclidean(c, pt(lm, i, w, h)));
  return r.reduce((a,b)=>a+b,0) / r.length;
}

function sampleIris(id, w, h, cx, cy, rad) {
  const d = id.data; let s=[0,0,0], n=0;
  const rr = Math.max(1, rad*0.6);
  for (let y=Math.round(cy-rr); y<=cy+rr; y++)
    for (let x=Math.round(cx-rr); x<=cx+rr; x++) {
      if (x<0||y<0||x>=w||y>=h) continue;
      if ((x-cx)**2 + (y-cy)**2 > rr*rr) continue;
      const idx=(y*w+x)*4, l=lum(d, idx);
      if (l<35 || l>230) continue;            // skip pupil + specular highlight
      s[0]+=d[idx]; s[1]+=d[idx+1]; s[2]+=d[idx+2]; n++;
    }
  return n ? { rgb: s.map(v=>v/n), n } : null;
}

function classifyEyeColor(rgb) {
  const [r,g,b] = rgb, { h, s, v } = rgb2hsv(r,g,b);
  if (s < 0.16) return v < 90 ? "بني غامق/أسود" : "رمادي";
  if (h >= 50 && h < 160) return "أخضر";
  if (h >= 160 && h < 265) return "أزرق";
  // warm range: brown vs honey/amber by brightness
  return v < 110 ? "بني" : "عسلي/فاتح";
}

function eyeColorFromIris(cropCanvas, lm) {
  if (lm.length < 478) return null;           // iris not present
  const w = cropCanvas.width, h = cropCanvas.height;
  const id = cropCanvas.getContext("2d", { willReadFrequently:true }).getImageData(0,0,w,h);
  const out = [];
  for (const [ctr, ring] of [[468,[469,470,471,472]], [473,[474,475,476,477]]]) {
    const c = pt(lm, ctr, w, h);
    const rad = irisRadius(lm, ctr, ring, w, h);
    const s = sampleIris(id, w, h, c.x, c.y, rad);
    if (s) out.push(s);
  }
  if (!out.length) return null;
  const total = out.reduce((a,b)=>a+b.n, 0);
  const rgb = [0,1,2].map(k => out.reduce((a,b)=>a + b.rgb[k]*b.n, 0) / total);
  return {
    rgb: rgb.map(v => +v.toFixed(0)),
    classification: classifyEyeColor(rgb),
    confidence: total > 60 ? "متوسطة" : "منخفضة",   // webcam color is approximate
  };
}

// ---------- Sclera visibility (sanpaku) from iris vs eyelids ----------
function scleraVisibility(lm, w, h) {
  if (lm.length < 478) return null;
  const eyes = [
    { top:159, bot:145, ctr:468, ring:[469,470,471,472] },  // right
    { top:386, bot:374, ctr:473, ring:[474,475,476,477] },  // left
  ];
  let up=0, lo=0, nn=0;
  for (const e of eyes) {
    const top=pt(lm,e.top,w,h).y, bot=pt(lm,e.bot,w,h).y;
    const cy=pt(lm,e.ctr,w,h).y, rad=irisRadius(lm,e.ctr,e.ring,w,h);
    const eh = (bot-top) || 1e-6;
    up += ((cy-rad) - top) / eh;   // sclera above iris
    lo += (bot - (cy+rad)) / eh;   // sclera below iris (lower sanpaku)
    nn++;
  }
  return {
    upper_sclera_ratio: +(up/nn).toFixed(3),
    lower_sclera_ratio: +(lo/nn).toFixed(3),
    sanpaku: (lo/nn) > 0.12 ? "سفلي (ثلاثي أبيض سفلي)"
           : (up/nn) > 0.12 ? "علوي" : "لا",
  };
}

// ---------- Public ----------
async function analyzeImageElement(el, opts = {}) {
  if (!landmarker) await init();
  const w = el.naturalWidth || el.videoWidth || el.width;
  const h = el.naturalHeight || el.videoHeight || el.height;
  const res = landmarker.detect(el);
  if (!res.faceLandmarks || !res.faceLandmarks.length) return null;
  const lm = res.faceLandmarks[0];
  const pose = poseFromLandmarks(lm);
  const bb = bboxOf(lm, w, h);
  const { canvas: rawCanvas, meta } = crop(el, bb, w, h);
  const rebased = rebase(lm, meta, w, h, rawCanvas.width, rawCanvas.height)
                    .map(p => ({ x: p.x, y: p.y, z: p.z })); // pt() expects .x in [0,1]
  // undo head tilt so tilt/width/height metrics measure the face, not the pose
  const { canvas, lm: fracLm } = rotateFace(rawCanvas, rebased, pose.roll);
  // hairline via ImageSegmenter when available (robust to bangs/lighting);
  // falls back to the skin-colour column scan inside computeMetrics.
  let hairSeg = null, hlOverride = null;
  if (opts.segHairline && window.Segment) {
    try {
      hairSeg = await window.Segment.hairMetrics(canvas, fracLm);
      if (hairSeg && hairSeg.hair_present && typeof hairSeg.hairline_center_y === "number") {
        const nasionY = fracLm[168].y * canvas.height;
        const y = hairSeg.hairline_center_y;
        if (y > 1 && y < nasionY - 0.05 * canvas.height)
          hlOverride = { point: { x: fracLm[10].x * canvas.width, y }, ok: true };
      }
    } catch (_) { /* segmentation optional */ }
  }
  const metrics = computeMetrics(canvas, fracLm, hlOverride);
  metrics.hairline_source = hlOverride ? "segmenter" : (metrics.hairline_detected ? "skin_scan" : "fallback");
  const eyeColor = eyeColorFromIris(canvas, fracLm);
  const sclera = scleraVisibility(fracLm, canvas.width, canvas.height);
  return { metrics, faces: res.faceLandmarks.length, bbox: bb, pose,
           eyeColor, sclera, canvas, hairSeg,
           lm: fracLm, cropW: canvas.width, cropH: canvas.height };
}

// Merge front + side captures into one profile. Front supplies the 32 frontal
// metrics; each side supplies sagittal metrics (averaged when both present).
async function analyzeMultiAngle({ front, left, right }) {
  const out = { metrics: {}, angles: {}, profile: {}, pixel: {}, notes: [] };
  if (front) {
    const f = await analyzeImageElement(front, { segHairline: !!window.Segment });
    if (f) {
      out.metrics = { ...f.metrics };
      out.angles.front = f.pose;
      if (f.eyeColor) out.pixel.eye_color = f.eyeColor;
      if (f.sclera)   out.pixel.sclera = f.sclera;
      // hair / hairline / widow's peak (already computed during analysis)
      if (f.hairSeg) out.pixel.hair = f.hairSeg;
      else if (window.Segment) out.notes.push("hair segmentation unavailable");
    }
  }
  const sides = [];
  if (left)  { const r = await analyzeImageElement(left);
               if (r) { out.angles.left  = r.pose;
                        sides.push(computeProfileMetrics(r.lm, r.cropW, r.cropH, "left")); } }
  if (right) { const r = await analyzeImageElement(right);
               if (r) { out.angles.right = r.pose;
                        sides.push(computeProfileMetrics(r.lm, r.cropW, r.cropH, "right")); } }
  if (sides.length) {
    const keys = Object.keys(sides[0]);
    for (const k of keys) {
      const vals = sides.map(s => s[k]).filter(v => typeof v === "number");
      out.profile[k] = vals.length ? +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(4) : null;
    }
  }
  out.notes.push("الأذن وعمق العين 3D لسه متعذّرين (مفيش معالم لهم). لون العين والبياض والشعر اتحلّوا ببكسل/تقطيع.");
  return out;
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

// ---------- Glasses heuristic ----------
// Skin at the nasion + under-eye zones is normally smooth; eyeglasses put a
// bridge edge across the nasion and rim edges under both eyes. Heuristic —
// thresholds are conservative; manual capture always overrides a false alarm.
function glassesCheck(id, w, h, lm) {
  const nx = lm[168].x * w, ny = lm[168].y * h;
  const eyeSpan = Math.abs(lm[263].x - lm[33].x) * w || 1;
  const bandW = eyeSpan * 0.35, bandH = Math.max(3, eyeSpan * 0.10);
  const bridge = roi(id, w, h, nx - bandW/2, ny - bandH/2, nx + bandW/2, ny + bandH/2, { edgeThr: 22 });
  const eh = Math.max(2, Math.abs(lm[145].y - lm[159].y) * h);   // eye opening px
  const rimL = roi(id, w, h, lm[33].x*w - 2,  lm[145].y*h + eh*1.2, lm[133].x*w + 2, lm[145].y*h + eh*2.6, { edgeThr: 22 });
  const rimR = roi(id, w, h, lm[362].x*w - 2, lm[374].y*h + eh*1.2, lm[263].x*w + 2, lm[374].y*h + eh*2.6, { edgeThr: 22 });
  const bridgeE = bridge ? bridge.edge_ratio : 0;
  const rimE = ((rimL ? rimL.edge_ratio : 0) + (rimR ? rimR.edge_ratio : 0)) / 2;
  return {
    glasses: bridgeE > 0.16 && rimE > 0.10,
    bridge_edges: +bridgeE.toFixed(3),
    rim_edges: +rimE.toFixed(3),
  };
}

// ---------- Pre-capture frame quality gate ----------
// Runs on the live VIDEO frame + its landmarks; returns issues to fix BEFORE
// the shot is taken (lighting, side-shadow, blur, distance, neutral face).
let _qCv = null, _qCtx = null;
function frameQuality(videoEl, lm, opts = {}) {
  const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
  if (!vw || !vh || !lm) return { ok: false, issues: ["جارٍ التحميل…"], metrics: {} };
  const w = 240, h = Math.max(1, Math.round(vh * 240 / vw));
  if (!_qCv) { _qCv = document.createElement("canvas");
               _qCtx = _qCv.getContext("2d", { willReadFrequently: true }); }
  _qCv.width = w; _qCv.height = h;
  _qCtx.drawImage(videoEl, 0, 0, w, h);
  const id = _qCtx.getImageData(0, 0, w, h);

  const xs = lm.map(p => p.x), ys = lm.map(p => p.y);
  const x1 = Math.min(...xs) * w, x2 = Math.max(...xs) * w;
  const y1 = Math.min(...ys) * h, y2 = Math.max(...ys) * h;
  const cx = (x1 + x2) / 2;
  const full  = roi(id, w, h, x1, y1, x2, y2);
  const left  = roi(id, w, h, x1, y1, cx, y2);
  const right = roi(id, w, h, cx, y1, x2, y2);
  if (!full || !left || !right) return { ok:false, issues:["ظبّط وشّك في الكادر"], metrics:{} };

  const brightness = +full.mean.toFixed(1);
  const balance = +(Math.abs(left.mean - right.mean) / (((left.mean + right.mean) / 2) || 1)).toFixed(3);
  const sharp = +full.edge_ratio.toFixed(3);
  const faceFill = +((x2 - x1) / w).toFixed(3);
  // neutral expression: inner-lip gap over mouth width
  const md = euclidean(lm[13], lm[14]) / (euclidean(lm[61], lm[291]) || 1e-6);

  const issues = [];
  if (brightness < 70) issues.push("الإضاءة خافتة — قرّب من مصدر ضوء");
  else if (brightness > 215) issues.push("الضوء قوي/محروق — قلّل الإضاءة");
  if (balance > 0.28) issues.push("في ظل على جنب — خلّي الضوء قدّامك");
  if (full.bright_ratio > 0.06) issues.push("نور قوي/انعكاس على وشك — ابعد عن الضوء المباشر");
  if (sharp < 0.02) issues.push("الصورة مش واضحة — ثبّت وركّز");
  if (faceFill < 0.30) issues.push("اقترب أكتر للكاميرا");
  else if (faceFill > 0.88) issues.push("ابعد شوية");
  if (md > 0.20) issues.push("اقفل بُقّك (تعبير محايد)");

  let glasses = null;
  if (opts.checkGlasses) {
    glasses = glassesCheck(id, w, h, lm);
    if (glasses.glasses) issues.push("شيل النضّارة — بتخفي شكل العين");
  }

  return { ok: issues.length === 0, issues, glasses,
           metrics: { brightness, balance, sharp, faceFill, mouth_open: +md.toFixed(3) } };
}

window.Face = { init, analyzeImageElement, analyzeMultiAngle,
                poseFromLandmarks, computeProfileMetrics, faceVectorFor,
                frameQuality };
