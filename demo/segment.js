// ============================================================
// segment.js — MediaPipe ImageSegmenter (selfie multiclass) wrapper.
// Unlocks hair / hairline / widow's-peak that face landmarks cannot read.
// Categories: 0 bg, 1 hair, 2 body-skin, 3 face-skin, 4 clothes, 5 others.
// Public API:  await Segment.init();  Segment.hairMetrics(canvas, fracLm)
// ============================================================

import { FilesetResolver, ImageSegmenter }
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const VISION_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_CANDIDATES = [
  "./models/selfie_multiclass_256x256.tflite",
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite",
];
const HAIR = 1;

let segmenter = null;

async function init() {
  if (segmenter) return;
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM);
  let lastErr = null;
  for (const path of MODEL_CANDIDATES) {
    try {
      segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: path },
        runningMode: "IMAGE",
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      });
      return;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("ImageSegmenter init failed");
}

// scan a column (in mask space) top->down, return y of first hair->non-hair edge
function hairlineAtColumn(mask, mw, mh, mx, limitY) {
  mx = Math.max(0, Math.min(mw - 1, Math.round(mx)));
  let sawHair = false;
  for (let y = 0; y <= limitY; y++) {
    const isHair = mask[y * mw + mx] === HAIR;
    if (isHair) sawHair = true;
    else if (sawHair) return y;          // top hair band ended here
  }
  return sawHair ? limitY : 0;           // all hair -> limit; no hair -> exposed (0)
}

// canvas: the cropped front face; fracLm: landmarks normalized [0,1] to that crop
async function hairMetrics(canvas, fracLm) {
  if (!segmenter) await init();
  const res = segmenter.segment(canvas);
  const mask = res.categoryMask;
  if (!mask) return null;
  const mw = mask.width, mh = mask.height;
  const data = mask.getAsUint8Array().slice();   // copy before close
  mask.close();

  let hairPx = 0;
  for (let i = 0; i < data.length; i++) if (data[i] === HAIR) hairPx++;
  const hair_coverage = +(hairPx / data.length).toFixed(3);

  // forehead columns from landmark x-range (103/332 = upper face corners)
  const fx = i => fracLm[i].x;
  const fy = i => fracLm[i].y;
  const leftX = fx(103) * mw, rightX = fx(332) * mw, midX = fx(10) * mw;
  const faceTopY = fy(10), chinY = fy(152);
  const faceH = ((chinY - faceTopY) || 0.5) * mh;
  const limitY = Math.min(mh - 1, Math.round(fy(9) * mh)); // stop at glabella

  const colAt = frac => hairlineAtColumn(data, mw, mh,
    leftX + (rightX - leftX) * frac, limitY);
  const center = (colAt(0.45) + colAt(0.5) + colAt(0.55)) / 3;
  const sides  = (colAt(0.05) + colAt(0.15) + colAt(0.85) + colAt(0.95)) / 4;

  const drop = (center - sides) / (faceH || 1);          // + => center dips lower
  const hairline_y_ratio = +(center / (faceH || 1)).toFixed(3);

  return {
    hair_present: hairPx > data.length * 0.02,
    hair_coverage,
    hairline_y_ratio,                                     // lower = higher forehead
    widow_peak_drop: +drop.toFixed(3),
    widow_peak: drop > 0.04 ? "نعم (قمة أرملة)" : "لا",
  };
}

window.Segment = { init, hairMetrics };
export { init, hairMetrics };
