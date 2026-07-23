import {
  FilesetResolver,
  FaceLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const startCameraBtn = document.getElementById("startCameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const fileInput = document.getElementById("fileInput");
const statusEl = document.getElementById("status");
const faceInfoEl = document.getElementById("faceInfo");
const resultsEl = document.getElementById("results");
const metricsEl = document.getElementById("metrics");
const summaryEl = document.getElementById("summary");

let faceLandmarker = null;
let thresholds = [];
let theoryMap = new Map();
let cameraStream = null;
let runningCamera = false;
let lastVideoTime = -1;
let currentRunningMode = "VIDEO";
const MODEL_CANDIDATES = [
  "./models/face_landmarker.task",
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
];

async function init() {
  try {
    status("تحميل MediaPipe والبيانات...");
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

    faceLandmarker = await createLandmarkerWithFallback(vision);

    const thresholdData = await fetchJsonOrThrow("./thresholds_from_pdf.json");
    thresholds = thresholdData.comparisons || [];

    try {
      const masterData = await fetchJsonOrThrow("./firasa_master_dataset.json");
      buildTheoryMap(masterData.theory || {});
    } catch (error) {
      console.warn("Metadata file failed to load:", error);
    }

    status("جاهز. افتح الكاميرا أو ارفع صورة.");
  } catch (error) {
    console.error(error);
    status(`فشل التحميل: ${error.message || "تحقق من الاستضافة والملفات"}`);
  }
}

async function fetchJsonOrThrow(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`تعذر تحميل الملف: ${path} (${response.status})`);
  }
  return response.json();
}

async function createLandmarkerWithFallback(vision) {
  let lastError = null;
  for (const modelPath of MODEL_CANDIDATES) {
    try {
      return await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelPath,
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.25,
        minFacePresenceConfidence: 0.25,
        minTrackingConfidence: 0.25,
        outputFaceBlendshapes: false,
      });
    } catch (error) {
      console.warn("Model load failed:", modelPath, error);
      lastError = error;
    }
  }
  throw new Error(`تعذر تحميل نموذج MediaPipe. ${lastError?.message || ""}`.trim());
}

async function ensureRunningMode(mode) {
  if (!faceLandmarker || currentRunningMode === mode) return;
  await faceLandmarker.setOptions({ runningMode: mode });
  currentRunningMode = mode;
}

function buildTheoryMap(theory) {
  for (const dayPayload of Object.values(theory)) {
    for (const trait of dayPayload.traits || []) {
      theoryMap.set(trait.trait_en, trait);
    }
  }
}

function status(text) {
  statusEl.textContent = text;
}

function safeDiv(a, b) {
  return b ? a / b : null;
}

function euclidean(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pt(landmarks, index, width, height) {
  const lm = landmarks[index];
  return { x: lm.x * width, y: lm.y * height };
}

function sampleSkin(imageData, width, height, center) {
  const x = Math.max(0, Math.min(width - 1, Math.round(center.x)));
  const y = Math.max(0, Math.min(height - 1, Math.round(center.y)));
  let sum = [0, 0, 0];
  let count = 0;

  for (let yy = Math.max(0, y - 2); yy <= Math.min(height - 1, y + 2); yy++) {
    for (let xx = Math.max(0, x - 2); xx <= Math.min(width - 1, x + 2); xx++) {
      const idx = (yy * width + xx) * 4;
      sum[0] += imageData.data[idx];
      sum[1] += imageData.data[idx + 1];
      sum[2] += imageData.data[idx + 2];
      count += 1;
    }
  }

  return count ? sum.map((v) => v / count) : [0, 0, 0];
}

function detectHairline(imageData, width, height, landmarks) {
  const p10 = pt(landmarks, 10, width, height);
  const p168 = pt(landmarks, 168, width, height);
  const start = { x: (p10.x + p168.x) / 2, y: (p10.y + p168.y) / 2 };
  const skin = sampleSkin(imageData, width, height, start);
  const x = Math.max(0, Math.min(width - 1, Math.round(start.x)));
  const startY = Math.round(start.y);
  const limitY = Math.max(0, Math.round(p10.y - height * 0.25));
  let best = null;
  let consecutive = 0;

  for (let y = startY; y >= limitY; y--) {
    const idx = (y * width + x) * 4;
    const pixel = [
      imageData.data[idx],
      imageData.data[idx + 1],
      imageData.data[idx + 2],
    ];
    const dist = Math.hypot(
      pixel[0] - skin[0],
      pixel[1] - skin[1],
      pixel[2] - skin[2]
    );
    if (dist > 60) {
      consecutive += 1;
      if (best === null) best = y;
      if (consecutive >= 3) {
        return { point: { x, y: best }, usedHairline: true };
      }
    } else {
      best = null;
      consecutive = 0;
    }
  }

  return { point: p10, usedHairline: false };
}

function landmarkBBox(landmarks, width, height) {
  const xs = landmarks.map((lm) => Math.max(0, Math.min(width - 1, Math.round(lm.x * width))));
  const ys = landmarks.map((lm) => Math.max(0, Math.min(height - 1, Math.round(lm.y * height))));
  return {
    x1: Math.min(...xs),
    y1: Math.min(...ys),
    x2: Math.max(...xs),
    y2: Math.max(...ys),
  };
}

function cropMetaFromBbox(bbox, width, height) {
  const bw = bbox.x2 - bbox.x1;
  const bh = bbox.y2 - bbox.y1;
  return {
    x1: Math.max(0, Math.round(bbox.x1 - 0.15 * bw)),
    x2: Math.min(width, Math.round(bbox.x2 + 0.15 * bw)),
    y1: Math.max(0, Math.round(bbox.y1 - 0.5 * bh)),
    y2: Math.min(height, Math.round(bbox.y2 + 0.15 * bh)),
  };
}

function rebaseLandmarks(landmarks, cropMeta, fullWidth, fullHeight, cropWidth, cropHeight) {
  return landmarks.map((lm) => {
    const absX = lm.x * fullWidth;
    const absY = lm.y * fullHeight;
    return {
      x: (absX - cropMeta.x1) / cropWidth,
      y: (absY - cropMeta.y1) / cropHeight,
      z: lm.z || 0,
    };
  });
}

// ============================================================
// Extended metrics (Phase 2 reconciliation)
// ============================================================
//
// MediaPipe FaceMesh landmark reference (only points we use):
//   Brows  inner: 55 (L), 285 (R)   outer: 70 (L), 300 (R)
//          arch peak: 105 (L), 334 (R)
//   Nostrils outer wings: 49 (L), 279 (R)
//   Chin   sides: 176 (L), 400 (R)   bottom: 152
//   Jaw    corner: 172 (L), 397 (R)  mid-jaw: 150 (L), 379 (R)
//   Lips   corners: 61 (L), 291 (R)  top: 0  bottom-outer: 17
//   Nose   alar:   129 (L), 358 (R)  tip: 1
//
function angleAt(corner, a, b) {
  // angle ABC at vertex `corner`, returned in degrees
  const v1x = a.x - corner.x, v1y = a.y - corner.y;
  const v2x = b.x - corner.x, v2y = b.y - corner.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
  if (!m1 || !m2) return null;
  const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function computeExtendedLandmarkMetrics(landmarks, width, height, base) {
  const p55  = pt(landmarks, 55,  width, height);
  const p285 = pt(landmarks, 285, width, height);
  const p105 = pt(landmarks, 105, width, height);
  const p334 = pt(landmarks, 334, width, height);
  const p70  = pt(landmarks, 70,  width, height);
  const p300 = pt(landmarks, 300, width, height);
  const p49  = pt(landmarks, 49,  width, height);
  const p279 = pt(landmarks, 279, width, height);
  const p129 = pt(landmarks, 129, width, height);
  const p358 = pt(landmarks, 358, width, height);
  const p176 = pt(landmarks, 176, width, height);
  const p400 = pt(landmarks, 400, width, height);
  const p152 = pt(landmarks, 152, width, height);
  const p172 = pt(landmarks, 172, width, height);
  const p397 = pt(landmarks, 397, width, height);
  const p150 = pt(landmarks, 150, width, height);
  const p379 = pt(landmarks, 379, width, height);
  const p61  = pt(landmarks, 61,  width, height);
  const p291 = pt(landmarks, 291, width, height);
  const p0   = pt(landmarks, 0,   width, height);
  const p17  = pt(landmarks, 17,  width, height);

  const faceWidth  = base.face_width;
  const faceHeight = base.face_height;

  // Brow inner gap (smaller = closer brows)
  const browInner = euclidean(p55, p285);
  // Brow arch: vertical drop of peak (105/334) below the line p70–p55 (L) / p300–p285 (R)
  const archL = ((p70.y + p55.y) / 2) - p105.y;
  const archR = ((p300.y + p285.y) / 2) - p334.y;
  const browArch = (archL + archR) / 2;
  // Nose alar width and nostril width
  const noseAlar    = euclidean(p129, p358);
  const nostrilSpan = euclidean(p49,  p279);
  // Chin width (between p176 and p400)
  const chinWidth = euclidean(p176, p400);
  // Jaw angle: angle at p172 between p150 (down/back) and p61 (up/front)
  const jawAngleL = angleAt(p172, p150, p61);
  const jawAngleR = angleAt(p397, p379, p291);
  const jawAngle  = (jawAngleL != null && jawAngleR != null)
                    ? (jawAngleL + jawAngleR) / 2 : null;
  // Lower-lip protrusion: how far the lower-lip bottom (p17) sits relative
  //   to the line connecting chin bottom (p152) and lip-bottom-center (p14).
  //   Approximation: p17.y distance below midpoint of (p0, p152) projected on Y.
  const midNoseChin = (p0.y + p152.y) / 2;
  const lowerLipProtrusion = (p17.y - midNoseChin) / Math.max(1, faceHeight);
  // Mouth corner tilt: average vertical offset of mouth corners vs centre
  //   negative => corners up (smile), positive => down (frown)
  const mouthCorners = ((p61.y + p291.y) / 2) - ((p0.y + p17.y) / 2);
  const mouthCornerTilt = safeDiv(mouthCorners, faceHeight);

  return {
    brow_inner_distance:     safeDiv(browInner,  faceWidth),
    brow_arch:               safeDiv(browArch,   faceHeight),
    nose_width_ratio:        safeDiv(noseAlar,   faceWidth),
    nostril_width_ratio:     safeDiv(nostrilSpan, faceWidth),
    chin_width_ratio:        safeDiv(chinWidth,  faceWidth),
    jaw_angle_sharpness:     jawAngle != null ? Number((180 - jawAngle).toFixed(2)) : null,
    lower_lip_protrusion:    Number(lowerLipProtrusion.toFixed(4)),
    mouth_corner_tilt:       mouthCornerTilt,
  };
}

// ---------------- Pixel-based metrics (forehead lines, brow density, cheek highlight)
function pixelLuminance(imageData, idx) {
  // ITU-R BT.601 luma
  return 0.299 * imageData.data[idx]
       + 0.587 * imageData.data[idx + 1]
       + 0.114 * imageData.data[idx + 2];
}

function roiStats(imageData, width, height, x1, y1, x2, y2) {
  x1 = Math.max(0, Math.floor(x1));  y1 = Math.max(0, Math.floor(y1));
  x2 = Math.min(width - 1, Math.ceil(x2));  y2 = Math.min(height - 1, Math.ceil(y2));
  if (x2 <= x1 || y2 <= y1) return null;
  let sum = 0, sumSq = 0, dark = 0, edge = 0, count = 0;
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const idx = (y * width + x) * 4;
      const l = pixelLuminance(imageData, idx);
      sum += l;  sumSq += l * l;
      if (l < 80) dark += 1;
      // crude horizontal edge magnitude (Sobel-like, horizontal lines only)
      if (y > y1 && y < y2) {
        const lup = pixelLuminance(imageData, ((y - 1) * width + x) * 4);
        const ldn = pixelLuminance(imageData, ((y + 1) * width + x) * 4);
        if (Math.abs(ldn - lup) > 30) edge += 1;
      }
      count += 1;
    }
  }
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return {
    mean,
    std: Math.sqrt(Math.max(0, variance)),
    dark_ratio: dark / count,
    edge_ratio: edge / count,
    count,
  };
}

function computeExtendedPixelMetrics(imageData, width, height, landmarks, hairline) {
  const p168 = pt(landmarks, 168, width, height);
  const p10  = pt(landmarks, 10,  width, height);
  const p70  = pt(landmarks, 70,  width, height);
  const p300 = pt(landmarks, 300, width, height);
  const p234 = pt(landmarks, 234, width, height);
  const p454 = pt(landmarks, 454, width, height);
  const p101 = pt(landmarks, 101, width, height);
  const p330 = pt(landmarks, 330, width, height);
  // Forehead ROI: from hairline to brow line, narrow band horizontally
  const fhX1 = Math.min(p70.x, p300.x);
  const fhX2 = Math.max(p70.x, p300.x);
  const fhY1 = Math.min(hairline.y, p168.y);
  const fhY2 = Math.max(hairline.y, p168.y) - 4;
  const fh   = roiStats(imageData, width, height, fhX1, fhY1, fhX2, fhY2);
  // Brow ROIs (rough strips around p70-p55 and p285-p300)
  const browL = roiStats(imageData, width, height,
                          p70.x - 6, p70.y - 4, p70.x + 30, p70.y + 6);
  const browR = roiStats(imageData, width, height,
                          p300.x - 30, p300.y - 4, p300.x + 6, p300.y + 6);
  const browDarkAvg = browL && browR
    ? (browL.dark_ratio + browR.dark_ratio) / 2 : null;
  // Cheek ROI: small box around p101 (left cheekbone area) and p330 (right)
  const cheekL = roiStats(imageData, width, height,
                          p101.x - 12, p101.y - 12, p101.x + 12, p101.y + 12);
  const cheekR = roiStats(imageData, width, height,
                          p330.x - 12, p330.y - 12, p330.x + 12, p330.y + 12);
  const cheekHighlight = cheekL && cheekR
    ? (cheekL.std + cheekR.std) / 2 / 64.0  // normalised
    : null;

  return {
    forehead_lines_density: fh ? Number(fh.edge_ratio.toFixed(4)) : null,
    forehead_smoothness:    fh ? Number((1 - fh.edge_ratio).toFixed(4)) : null,
    brow_density:           browDarkAvg != null ? Number(browDarkAvg.toFixed(4)) : null,
    cheek_fullness:         cheekHighlight != null ? Number(cheekHighlight.toFixed(4)) : null,
  };
}

function computeMetricsFromCrop(cropCanvas, landmarks) {
  const width = cropCanvas.width;
  const height = cropCanvas.height;
  const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });
  const imageData = cropCtx.getImageData(0, 0, width, height);
  const hairlineData = detectHairline(imageData, width, height, landmarks);
  const hairline = hairlineData.point;

  const p168 = pt(landmarks, 168, width, height);
  const p9 = pt(landmarks, 9, width, height);
  const p152 = pt(landmarks, 152, width, height);
  const p103 = pt(landmarks, 103, width, height);
  const p332 = pt(landmarks, 332, width, height);
  const p70 = pt(landmarks, 70, width, height);
  const p300 = pt(landmarks, 300, width, height);
  const p234 = pt(landmarks, 234, width, height);
  const p454 = pt(landmarks, 454, width, height);
  const p33 = pt(landmarks, 33, width, height);
  const p133 = pt(landmarks, 133, width, height);
  const p263 = pt(landmarks, 263, width, height);
  const p362 = pt(landmarks, 362, width, height);
  const p159 = pt(landmarks, 159, width, height);
  const p145 = pt(landmarks, 145, width, height);
  const p386 = pt(landmarks, 386, width, height);
  const p374 = pt(landmarks, 374, width, height);
  const p1 = pt(landmarks, 1, width, height);
  const p2 = pt(landmarks, 2, width, height);
  const p61 = pt(landmarks, 61, width, height);
  const p291 = pt(landmarks, 291, width, height);
  const p13 = pt(landmarks, 13, width, height);
  const p14 = pt(landmarks, 14, width, height);
  const p0 = pt(landmarks, 0, width, height);
  const p17 = pt(landmarks, 17, width, height);
  const p172 = pt(landmarks, 172, width, height);
  const p397 = pt(landmarks, 397, width, height);

  const foreheadHeight = euclidean(hairline, p168);
  const faceHeight = euclidean(hairline, p152);
  const foreheadTopWidth = euclidean(p103, p332);
  const browWidth = euclidean(p70, p300);
  const faceWidth = euclidean(p234, p454);
  const rightEyeWidth = euclidean(p33, p133);
  const leftEyeWidth = euclidean(p362, p263);
  const avgEyeWidth = (rightEyeWidth + leftEyeWidth) / 2;
  const rightEyeOpen = euclidean(p159, p145);
  const leftEyeOpen = euclidean(p386, p374);
  const avgEyeOpen = (rightEyeOpen + leftEyeOpen) / 2;
  const eyeSpacing = euclidean(p133, p362);
  const browEyeDistance = (euclidean(p70, p33) + euclidean(p300, p263)) / 2;
  const mouthWidth = euclidean(p61, p291);
  const mouthHeight = euclidean(p13, p14);
  const upperLip = euclidean(p0, p13);
  const lowerLip = euclidean(p14, p17);
  const philtrumLength = euclidean(p2, p13);
  const lowerFaceHeight = euclidean(p2, p152);
  const noseLength = euclidean(p168, p2);
  const noseTipProjection = Math.abs(p1.x - p168.x);
  const noseTipDrop = p2.y - p1.y;
  const foreheadSlant = Math.abs(hairline.x - p9.x);
  const foreheadVertical = Math.abs(hairline.y - p9.y);
  const jawWidth = euclidean(p172, p397);
  const chinProjection = Math.abs(p152.x - p13.x);

  const baseMetrics = {
    forehead_height: foreheadHeight,
    face_height: faceHeight,
    forehead_ratio: safeDiv(foreheadHeight, faceHeight),
    forehead_top_width: foreheadTopWidth,
    brow_width: browWidth,
    widening_ratio: safeDiv(foreheadTopWidth, browWidth),
    face_width: faceWidth,
    face_aspect_ratio: safeDiv(faceWidth, faceHeight),
    eye_spacing: eyeSpacing,
    eye_spacing_ratio: safeDiv(eyeSpacing, faceWidth),
    eye_size_ratio: safeDiv(avgEyeWidth, faceWidth),
    eye_open_ratio: safeDiv(avgEyeOpen, avgEyeWidth),
    eye_tilt_ratio: safeDiv(p263.y - p33.y, euclidean(p33, p263)),
    brow_eye_distance_ratio: safeDiv(browEyeDistance, faceHeight),
    mouth_width_ratio: safeDiv(mouthWidth, faceWidth),
    mouth_height_ratio: safeDiv(mouthHeight, faceHeight),
    upper_lip_ratio: safeDiv(upperLip, faceHeight),
    lower_lip_ratio: safeDiv(lowerLip, faceHeight),
    philtrum_ratio: safeDiv(philtrumLength, faceHeight),
    lower_face_ratio: safeDiv(lowerFaceHeight, faceHeight),
    nose_length_ratio: safeDiv(noseLength, faceHeight),
    nose_tip_projection_ratio: safeDiv(noseTipProjection, faceWidth),
    nose_tip_drop_ratio: safeDiv(noseTipDrop, faceHeight),
    forehead_slant_ratio: safeDiv(foreheadSlant, foreheadVertical),
    jaw_width_ratio: safeDiv(jawWidth, faceWidth),
    chin_projection_ratio: safeDiv(chinProjection, faceWidth),
    hairline_detected: hairlineData.usedHairline,
    hairline_point: [Number(hairline.x.toFixed(3)), Number(hairline.y.toFixed(3))],
  };

  // ---- Phase 2 extended metrics ----------------------------------------
  const ext  = computeExtendedLandmarkMetrics(landmarks, width, height, baseMetrics);
  const pix  = computeExtendedPixelMetrics(imageData, width, height, landmarks, hairline);
  return { ...baseMetrics, ...ext, ...pix };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildBeardMask(cropCanvas, landmarks) {
  const width = cropCanvas.width;
  const height = cropCanvas.height;
  const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });
  const imageData = cropCtx.getImageData(0, 0, width, height);

  const p61 = pt(landmarks, 61, width, height);
  const p291 = pt(landmarks, 291, width, height);
  const p17 = pt(landmarks, 17, width, height);
  const p152 = pt(landmarks, 152, width, height);
  const p172 = pt(landmarks, 172, width, height);
  const p397 = pt(landmarks, 397, width, height);

  const roi = {
    x1: clamp(Math.round(Math.min(p172.x, p61.x) - width * 0.08), 0, width - 1),
    x2: clamp(Math.round(Math.max(p397.x, p291.x) + width * 0.08), 1, width),
    y1: clamp(Math.round(Math.min(p61.y, p291.y, p17.y) - height * 0.02), 0, height - 1),
    y2: clamp(Math.round(Math.max(p152.y, p17.y) + height * 0.16), 1, height),
  };

  const mask = new Uint8Array(width * height);
  let graySum = 0;
  let count = 0;
  for (let y = roi.y1; y < roi.y2; y++) {
    for (let x = roi.x1; x < roi.x2; x++) {
      const idx = (y * width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      graySum += gray;
      count += 1;
    }
  }
  const meanGray = count ? graySum / count : 128;
  const darkThreshold = meanGray - 18;

  for (let y = roi.y1; y < roi.y2; y++) {
    for (let x = roi.x1; x < roi.x2; x++) {
      const idx = (y * width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const darkness = meanGray - gray;
      const pixelIndex = y * width + x;
      if (darkness > 16 && gray < darkThreshold) {
        mask[pixelIndex] = 1;
      }
    }
  }

  return { mask, roi, width, height };
}

function averageGrayInBox(imageData, width, box) {
  let sum = 0;
  let count = 0;
  const x1 = clamp(Math.round(box.x1), 0, width - 1);
  const x2 = Math.max(x1 + 1, clamp(Math.round(box.x2), 1, width));
  const y1 = clamp(Math.round(box.y1), 0, Math.floor(imageData.height) - 1);
  const y2 = Math.max(y1 + 1, clamp(Math.round(box.y2), 1, Math.floor(imageData.height)));
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const idx = (y * width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      sum += 0.299 * r + 0.587 * g + 0.114 * b;
      count += 1;
    }
  }
  return count ? sum / count : 255;
}

function beardWidths(maskObj, fractions) {
  const { mask, roi, width, height } = maskObj;
  const rows = [];
  for (let y = roi.y1; y < roi.y2; y++) {
    let left = null;
    let right = null;
    for (let x = roi.x1; x < roi.x2; x++) {
      if (mask[y * width + x]) {
        if (left === null) left = x;
        right = x;
      }
    }
    rows.push({ y, left, right, width: left !== null ? right - left : 0 });
  }

  const activeRows = rows.filter((row) => row.width > 0);
  if (!activeRows.length) return null;

  const topY = activeRows[0].y;
  const bottomY = activeRows[activeRows.length - 1].y;
  const byFrac = {};
  for (const frac of fractions) {
    const targetY = Math.round(topY + frac * (bottomY - topY));
    let found = null;
    for (let radius = 0; radius <= 8 && !found; radius++) {
      for (const yy of [targetY - radius, targetY + radius]) {
        const row = rows.find((item) => item.y === yy && item.width > 0);
        if (row) {
          found = row;
          break;
        }
      }
    }
    byFrac[frac] = found;
  }

  return { rows, activeRows, topY, bottomY, byFrac };
}

function detectBeardTraits(cropCanvas, landmarks) {
  const maskObj = buildBeardMask(cropCanvas, landmarks);
  const widths = beardWidths(maskObj, [0.15, 0.35, 0.55, 0.75, 0.9]);
  if (!widths) {
    return { metrics: {}, results: [] };
  }

  const { roi } = maskObj;
  const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });
  const imageData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
  const { activeRows, topY, bottomY, byFrac } = widths;
  const p13 = pt(landmarks, 13, cropCanvas.width, cropCanvas.height);
  const p14 = pt(landmarks, 14, cropCanvas.width, cropCanvas.height);
  const p17 = pt(landmarks, 17, cropCanvas.width, cropCanvas.height);
  const p152 = pt(landmarks, 152, cropCanvas.width, cropCanvas.height);
  const p61 = pt(landmarks, 61, cropCanvas.width, cropCanvas.height);
  const p291 = pt(landmarks, 291, cropCanvas.width, cropCanvas.height);
  const p172 = pt(landmarks, 172, cropCanvas.width, cropCanvas.height);
  const p397 = pt(landmarks, 397, cropCanvas.width, cropCanvas.height);
  const roiArea = Math.max(1, (roi.x2 - roi.x1) * (roi.y2 - roi.y1));
  const maskArea = activeRows.reduce((sum, row) => sum + row.width, 0);
  const areaRatio = maskArea / roiArea;
  const beardHeightRatio = (bottomY - topY) / Math.max(1, roi.y2 - roi.y1);
  const mouthY = (p13.y + p14.y + p17.y) / 3;
  const mouthWidth = Math.max(1, p291.x - p61.x);
  const underMouthRows = activeRows.filter(
    (row) => row.y >= mouthY + 4 && row.y <= mouthY + Math.max(18, cropCanvas.height * 0.12)
  );
  const underMouthCoverage = underMouthRows.length
    ? underMouthRows.reduce((sum, row) => sum + Math.min(1, row.width / mouthWidth), 0) / underMouthRows.length
    : 0;
  const jawWidth = Math.max(1, p397.x - p172.x);
  const sideRows = activeRows.filter(
    (row) => row.y >= mouthY + 8 && row.y <= mouthY + Math.max(30, cropCanvas.height * 0.22)
  );
  const sideCoverage = sideRows.length
    ? sideRows.reduce((sum, row) => sum + Math.min(1, row.width / jawWidth), 0) / sideRows.length
    : 0;
  const chinToBottom = Math.max(0, bottomY - p152.y);
  const chinToBottomRatio = chinToBottom / Math.max(1, cropCanvas.height);
  const belowChinRows = activeRows.filter((row) => row.y >= p152.y + 4);
  const belowChinCoverage = belowChinRows.length
    ? belowChinRows.reduce((sum, row) => sum + Math.min(1, row.width / jawWidth), 0) / belowChinRows.length
    : 0;
  const centerX = p152.x;
  const centralBandHalf = Math.max(10, mouthWidth * 0.22);
  const centralBelowRows = belowChinRows.filter((row) => {
    const bandLeft = centerX - centralBandHalf;
    const bandRight = centerX + centralBandHalf;
    return row.left !== null && row.left <= bandRight && row.right >= bandLeft;
  });
  const centralBelowCoverage = centralBelowRows.length / Math.max(1, belowChinRows.length);
  const chinPatchGray = averageGrayInBox(imageData, cropCanvas.width, {
    x1: centerX - mouthWidth * 0.18,
    x2: centerX + mouthWidth * 0.18,
    y1: p17.y - 4,
    y2: p17.y + 8,
  });
  const belowChinPatchGray = averageGrayInBox(imageData, cropCanvas.width, {
    x1: centerX - mouthWidth * 0.22,
    x2: centerX + mouthWidth * 0.22,
    y1: p152.y + 6,
    y2: p152.y + Math.max(14, cropCanvas.height * 0.08),
  });
  const belowChinDarkness = chinPatchGray - belowChinPatchGray;

  if (
    areaRatio < 0.1 ||
    beardHeightRatio < 0.18 ||
    underMouthCoverage < 0.42 ||
    sideCoverage < 0.4 ||
    chinToBottomRatio < 0.08 ||
    belowChinCoverage < 0.34 ||
    centralBelowCoverage < 0.55 ||
    belowChinDarkness < 12
  ) {
    return {
      metrics: {
        beard_area_ratio: areaRatio,
        beard_height_ratio: beardHeightRatio,
        beard_under_mouth_coverage: underMouthCoverage,
        beard_side_coverage: sideCoverage,
        beard_chin_to_bottom_ratio: chinToBottomRatio,
        beard_below_chin_coverage: belowChinCoverage,
        beard_central_below_chin_coverage: centralBelowCoverage,
        beard_below_chin_darkness: belowChinDarkness,
      },
      results: [],
    };
  }

  const topRow = byFrac[0.15];
  const upperMidRow = byFrac[0.35];
  const midRow = byFrac[0.55];
  const bottomRow = byFrac[0.9] || byFrac[0.75];
  if (!topRow || !upperMidRow || !midRow || !bottomRow) {
    return {
      metrics: {
        beard_area_ratio: areaRatio,
      },
      results: [],
    };
  }

  const upperWidth = upperMidRow.width || 1;
  const lowerWidth = bottomRow.width || 1;
  const taperRatio = lowerWidth / upperWidth;
  const bottomByX = [];
  for (let x = roi.x1; x < roi.x2; x++) {
    let foundY = null;
    for (let y = roi.y2 - 1; y >= roi.y1; y--) {
      if (maskObj.mask[y * maskObj.width + x]) {
        foundY = y;
        break;
      }
    }
    if (foundY !== null) bottomByX.push({ x, y: foundY });
  }
  const takeAverageY = (startFrac, endFrac) => {
    if (!bottomByX.length) return bottomY;
    const start = Math.floor(bottomByX.length * startFrac);
    const end = Math.max(start + 1, Math.floor(bottomByX.length * endFrac));
    const slice = bottomByX.slice(start, end);
    return slice.reduce((sum, item) => sum + item.y, 0) / slice.length;
  };
  const leftEdgeY = takeAverageY(0.05, 0.2);
  const centerY = takeAverageY(0.4, 0.6);
  const rightEdgeY = takeAverageY(0.8, 0.95);
  const edgeYMean = (leftEdgeY + rightEdgeY) / 2;
  const curveDepthRatio = (centerY - edgeYMean) / Math.max(1, bottomY - topY);
  const bottomFlatnessRatio = Math.abs(bottomRow.width - midRow.width) / Math.max(1, upperWidth);

  const metrics = {
    beard_area_ratio: areaRatio,
    beard_height_ratio: beardHeightRatio,
    beard_under_mouth_coverage: underMouthCoverage,
    beard_side_coverage: sideCoverage,
    beard_chin_to_bottom_ratio: chinToBottomRatio,
    beard_below_chin_coverage: belowChinCoverage,
    beard_central_below_chin_coverage: centralBelowCoverage,
    beard_below_chin_darkness: belowChinDarkness,
    beard_taper_ratio: taperRatio,
    beard_curve_depth_ratio: curveDepthRatio,
    beard_bottom_flatness_ratio: bottomFlatnessRatio,
    beard_upper_width: upperWidth,
    beard_lower_width: lowerWidth,
    beard_height: bottomY - topY,
    beard_edge_center_delta: centerY - edgeYMean,
    beard_edge_y_mean: edgeYMean,
  };

  const results = [];
  if (taperRatio < 0.72) {
    results.push({
      trait: "beard_control",
      trait_ar: "السيطرة",
      metric: "beard_taper_ratio",
      label_code: "triangular_beard",
      label_ar: "اللحية المثلثة",
      summary_label: "السيطرة",
      summary_text: "يوجد مؤشر على السيطرة من شكل اللحية المثلثة.",
      value: taperRatio,
      threshold: 0.72,
      distance: Math.abs(0.72 - taperRatio),
      confidence: taperRatio < 0.62 ? "high" : "medium",
      effective: true,
      source: "beard_shape",
    });
    return { metrics, results };
  }

  if (curveDepthRatio > 0.08) {
    results.push({
      trait: "beard_kindness",
      trait_ar: "الطيبة",
      metric: "beard_curve_depth_ratio",
      label_code: "curved_beard",
      label_ar: "اللحية المنحنية",
      summary_label: "الطيبة",
      summary_text: "يوجد مؤشر على الطيبة من انحناء أسفل اللحية.",
      value: curveDepthRatio,
      threshold: 0.08,
      distance: Math.abs(curveDepthRatio - 0.08),
      confidence: curveDepthRatio > 0.12 ? "high" : "medium",
      effective: true,
      source: "beard_shape",
    });
  } else {
    results.push({
      trait: "beard_independence",
      trait_ar: "الاستقلالية",
      metric: "beard_curve_depth_ratio",
      label_code: "straight_beard",
      label_ar: "اللحية المستقيمة",
      summary_label: "الاستقلالية",
      summary_text: "يوجد مؤشر على الاستقلالية من استقامة أسفل اللحية.",
      value: curveDepthRatio,
      threshold: 0.08,
      distance: Math.abs(curveDepthRatio - 0.08),
      confidence: curveDepthRatio < 0.04 ? "high" : "medium",
      effective: true,
      source: "beard_shape",
    });
  }

  return { metrics, results };
}

function chooseLargestFace(faces, width, height) {
  let best = null;
  let bestArea = -1;
  for (const landmarks of faces) {
    const bbox = landmarkBBox(landmarks, width, height);
    const area = (bbox.x2 - bbox.x1) * (bbox.y2 - bbox.y1);
    if (area > bestArea) {
      bestArea = area;
      best = { landmarks, bbox };
    }
  }
  return best;
}

function classifyTraits(metrics) {
  const results = [];
  for (const item of thresholds) {
    const value = metrics[item.metric];
    if (value == null || Number.isNaN(value)) continue;

    const highGoesUp = item.high_avg >= item.low_avg;
    const assignedHigh = highGoesUp ? value >= item.threshold : value <= item.threshold;
    const labelCode = assignedHigh ? item.high_label : item.low_label;
    const theory = theoryMap.get(item.trait);
    const state = theory?.states?.find((s) => s.code === labelCode);
    const distance = Math.abs(value - item.threshold);

    results.push({
      trait: item.trait,
      trait_ar: item.trait_ar,
      metric: item.metric,
      label_code: labelCode,
      label_ar: state?.state_ar || labelCode,
      value,
      threshold: item.threshold,
      distance,
      confidence: item.confidence,
      effective: item.effective,
    });
  }

  results.sort((a, b) => Number(b.effective) - Number(a.effective) || b.distance - a.distance);
  return results;
}

function describeConfidence(item) {
  if (!item.effective) return "مؤشر ضعيف";
  if (item.confidence === "high") return "مؤشر قوي";
  if (item.confidence === "medium") return "مؤشر متوسط";
  return "مؤشر أولي";
}

function buildHumanSummary(results) {
  const strong = results.filter((item) => item.effective).slice(0, 6);
  const provisional = results.filter((item) => !item.effective).slice(0, 3);

  if (!strong.length && !provisional.length) {
    return {
      lead: "لا توجد مؤشرات كافية لتكوين وصف مبدئي من هذه الصورة.",
      bullets: [],
      tags: [],
    };
  }

  const leadParts = [];
  const bullets = [];
  const tags = [];

  if (strong.length) {
    const topTraits = strong.slice(0, 3).map((item) => item.summary_label || item.label_ar);
    leadParts.push(`الصورة الحالية تشير مبدئيًا إلى أن الشخص يميل إلى ${topTraits.join("، ")}.`);
  }

  for (const item of strong.slice(0, 5)) {
    bullets.push(item.summary_text || `يوجد ${describeConfidence(item)} على ${item.trait_ar}: ${item.label_ar}.`);
    tags.push(item.summary_label || item.label_ar);
  }

  if (provisional.length) {
    const weakNames = provisional.map((item) => item.trait_ar).join("، ");
    leadParts.push(`كما توجد مؤشرات أضعف تحتاج صورة أوضح أو زاوية أنسب في: ${weakNames}.`);
  }

  return {
    lead: leadParts.join(" "),
    bullets,
    tags: [...new Set(tags)].slice(0, 8),
  };
}

function renderSummary(results) {
  const summary = buildHumanSummary(results);
  const bulletsHtml = summary.bullets.length
    ? `<div class="resultMeta">${summary.bullets.map((text) => `<div>${text}</div>`).join("")}</div>`
    : `<div class="muted">لا توجد مؤشرات كافية بعد.</div>`;
  const tagsHtml = summary.tags.length
    ? `<div class="summaryTags">${summary.tags.map((tag) => `<span class="summaryTag">${tag}</span>`).join("")}</div>`
    : "";

  summaryEl.innerHTML = `
    <div class="summaryLead">${summary.lead}</div>
    ${tagsHtml}
    ${bulletsHtml}
  `;
}

function renderResults(results) {
  if (!results.length) {
    resultsEl.innerHTML = `<div class="muted">لا توجد نتائج بعد.</div>`;
    summaryEl.innerHTML = `<div class="muted">لا توجد خلاصة بعد.</div>`;
    return;
  }

  resultsEl.innerHTML = results.map((item) => `
    <div class="resultItem">
      <h3>${item.trait_ar}</h3>
      <div><strong>${item.label_ar}</strong> <span class="muted">(${item.label_code})</span></div>
      ${item.summary_text ? `<div class="muted">${item.summary_text}</div>` : ``}
      <div class="resultMeta">
        <span>metric: ${item.metric}</span>
        <span>value: ${formatNum(item.value)}</span>
        <span>threshold: ${formatNum(item.threshold)}</span>
        <span>distance: ${formatNum(item.distance)}</span>
        <span class="badge ${item.effective ? "good" : "warn"}">${item.effective ? "effective" : "weak"}</span>
      </div>
    </div>
  `).join("");
}

function renderMetrics(metrics) {
  const entries = Object.entries(metrics)
    .filter(([, value]) => typeof value === "number")
    .sort((a, b) => a[0].localeCompare(b[0]));

  metricsEl.innerHTML = entries.map(([key, value]) => `
    <div class="metricItem">
      <strong>${key}</strong>
      <div>${formatNum(value)}</div>
    </div>
  `).join("");
}

function formatNum(value) {
  return Number(value).toFixed(4);
}

function drawLandmarks(landmarks, width, height, cropMeta, hairlinePoint) {
  ctx.strokeStyle = "#11d19d";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#11d19d";

  for (const lm of landmarks) {
    const x = cropMeta.x1 + lm.x * (cropMeta.x2 - cropMeta.x1);
    const y = cropMeta.y1 + lm.y * (cropMeta.y2 - cropMeta.y1);
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (hairlinePoint) {
    ctx.fillStyle = "#ff564a";
    ctx.beginPath();
    ctx.arc(cropMeta.x1 + hairlinePoint[0], cropMeta.y1 + hairlinePoint[1], 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function processFaceLandmarks(faceLandmarks, sourceWidth, sourceHeight, sourceDrawer) {
  const chosen = chooseLargestFace(faceLandmarks, sourceWidth, sourceHeight);
  if (!chosen) {
    faceInfoEl.textContent = "عدد الوجوه: 0";
    resultsEl.innerHTML = `<div class="muted">لم يتم اكتشاف وجه.</div>`;
    metricsEl.innerHTML = "";
    summaryEl.innerHTML = `<div class="muted">لم يتم تكوين خلاصة.</div>`;
    return;
  }

  faceInfoEl.textContent = `عدد الوجوه: ${faceLandmarks.length}`;
  const cropMeta = cropMetaFromBbox(chosen.bbox, sourceWidth, sourceHeight);
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropMeta.x2 - cropMeta.x1;
  cropCanvas.height = cropMeta.y2 - cropMeta.y1;
  cropCanvas.getContext("2d").drawImage(
    sourceDrawer,
    cropMeta.x1, cropMeta.y1, cropCanvas.width, cropCanvas.height,
    0, 0, cropCanvas.width, cropCanvas.height
  );

  const rebasedLandmarks = rebaseLandmarks(
    chosen.landmarks,
    cropMeta,
    sourceWidth,
    sourceHeight,
    cropCanvas.width,
    cropCanvas.height
  );

  const metrics = computeMetricsFromCrop(cropCanvas, rebasedLandmarks);
  const beardData = detectBeardTraits(cropCanvas, rebasedLandmarks);
  const mergedMetrics = { ...metrics, ...beardData.metrics };
  const results = [...beardData.results, ...classifyTraits(mergedMetrics)];

  renderSummary(results);
  renderResults(results);
  renderMetrics(mergedMetrics);
  drawLandmarks(rebasedLandmarks, sourceWidth, sourceHeight, cropMeta, metrics.hairline_point);
}

async function analyzeCurrentVideoFrame() {
  if (!runningCamera || !faceLandmarker) return;
  await ensureRunningMode("VIDEO");
  if (video.readyState < 2) {
    requestAnimationFrame(analyzeCurrentVideoFrame);
    return;
  }

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const result = faceLandmarker.detectForVideo(video, performance.now());
    if (result.faceLandmarks?.length) {
      processFaceLandmarks(result.faceLandmarks, canvas.width, canvas.height, video);
    } else {
      faceInfoEl.textContent = "عدد الوجوه: 0";
      resultsEl.innerHTML = `<div class="muted">لم يتم اكتشاف وجه في الإطار الحالي.</div>`;
      metricsEl.innerHTML = "";
      summaryEl.innerHTML = `<div class="muted">ضع وجهًا واحدًا واضحًا أمام الكاميرا لتظهر الخلاصة.</div>`;
    }
  }

  requestAnimationFrame(analyzeCurrentVideoFrame);
}

async function startCamera() {
  if (!faceLandmarker) return;
  try {
    await ensureRunningMode("VIDEO");
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = cameraStream;
    await video.play();
    video.style.display = "block";
    runningCamera = true;
    status("الكاميرا تعمل. حافظ على وجه واحد واضح أمام الكاميرا.");
    analyzeCurrentVideoFrame();
  } catch (error) {
    console.error(error);
    status("تعذر فتح الكاميرا.");
  }
}

function stopCamera() {
  runningCamera = false;
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  video.srcObject = null;
  video.style.display = "none";
}

async function handleUpload(file) {
  if (!file || !faceLandmarker) return;
  try {
    stopCamera();
    await ensureRunningMode("IMAGE");
    status("جاري تحليل الصورة...");

    const bitmap = await createImageBitmap(file);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);

    const result = faceLandmarker.detect(canvas);
    if (result.faceLandmarks?.length) {
      processFaceLandmarks(result.faceLandmarks, bitmap.width, bitmap.height, canvas);
      status("تم تحليل الصورة.");
    } else {
      faceInfoEl.textContent = "عدد الوجوه: 0";
      resultsEl.innerHTML = `<div class="muted">لم يتم اكتشاف وجه في الصورة.</div>`;
      metricsEl.innerHTML = "";
      summaryEl.innerHTML = `<div class="muted">لم يتم استخراج خلاصة لأن الوجه غير واضح أو غير موجود.</div>`;
      status("لم يتم اكتشاف وجه في الصورة.");
    }
    bitmap.close?.();
  } catch (error) {
    console.error(error);
    faceInfoEl.textContent = "عدد الوجوه: 0";
    resultsEl.innerHTML = `<div class="muted">حدث خطأ أثناء قراءة الصورة أو تحليلها.</div>`;
    metricsEl.innerHTML = "";
    summaryEl.innerHTML = `<div class="muted">تعذر تكوين خلاصة من الصورة الحالية.</div>`;
    status("فشل تحليل الصورة. جرّب صورة JPG/PNG واضحة بوجه واحد.");
  } finally {
    fileInput.value = "";
  }
}

startCameraBtn.addEventListener("click", startCamera);
stopCameraBtn.addEventListener("click", () => {
  stopCamera();
  status("تم إيقاف الكاميرا.");
});
fileInput.addEventListener("change", (event) => handleUpload(event.target.files?.[0]));

init();
