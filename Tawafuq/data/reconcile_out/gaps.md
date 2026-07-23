# Feature-alias reconciliation

- test.js metrics      : **38**  (real, working)
- threshold metrics    : **24**  (calibrated values)
- phase2 features used : **28**  (abstract)

## Feature status (only Phase-2 features shown)
- ✅ available in test.js (direct or proxy): **21**
- 🟡 calibrated_only (in thresholds, NOT in test.js): **0**
- ❌ missing entirely (need new code): **0**
- ⛔ intentionally dropped (impossible from still photo): **7**

## Available now (Phase 2 features mapped to a real JS metric)
- `brow_arch`  →  test.js: `brow_arch`
- `brow_density`  →  test.js: `brow_density`
- `brow_eye_distance_ratio`  →  test.js: `brow_eye_distance_ratio`
- `brow_inner_distance`  →  test.js: `brow_inner_distance`
- `brow_tilt`  →  test.js: `eye_tilt_ratio`  ⚠ PROXY/approximation
- `cheek_fullness`  →  test.js: `cheek_fullness`
- `chin_projection_ratio`  →  test.js: `chin_projection_ratio`
- `chin_width_ratio`  →  test.js: `chin_width_ratio`
- `eye_warmth_proxy`  →  test.js: `eye_open_ratio`  ⚠ PROXY/approximation
- `forehead_lines`  →  test.js: `forehead_lines_density`  ⚠ PROXY/approximation
- `forehead_shape`  →  test.js: `forehead_slant_ratio`  ⚠ PROXY/approximation
- `forehead_smoothness`  →  test.js: `forehead_smoothness`
- `forehead_width_ratio`  →  test.js: `forehead_top_width`  ⚠ PROXY/approximation
- `jaw_angle_sharpness`  →  test.js: `jaw_angle_sharpness`
- `jaw_width_ratio`  →  test.js: `jaw_width_ratio`
- `lower_lip_protrusion`  →  test.js: `lower_lip_protrusion`
- `lower_lip_ratio`  →  test.js: `lower_lip_ratio`
- `mouth_height_ratio`  →  test.js: `mouth_height_ratio`
- `mouth_open_ratio`  →  test.js: `mouth_height_ratio`  ⚠ PROXY/approximation
- `nostril_width_ratio`  →  test.js: `nostril_width_ratio`
- `upper_lip_ratio`  →  test.js: `upper_lip_ratio`

## Missing — need to be added to test.js

## How the 15 Phase-2 traits look after reconciliation

| Trait | orig | real | lost |
|---|---|---|---|
| sabti_001 الكرم | 3 | **3** | — |
| sabti_002 الطيبة | 4 | **4** | — |
| sabti_003 الص .ي | 5 | **3** | mouth_stability, chin_stability |
| sabti_004 الأنانية | 3 | **2** | mouth_tension_ratio |
| sabti_005 الحزم | 4 | **3** | forehead_tension |
| sabti_006 الاندفاع | 2 | **2** | — |
| sabti_007 الهدوء | 2 | **1** | face_muscle_tension |
| sabti_010 القيادة | 2 | **2** | — |
| sabti_011 التواضع | 3 | **1** | face_muscle_tension, mouth_stability |
| sabti_012 الكتمان | 2 | **1** | lower_lip_tension |
| sabti_013 التسلّط | 2 | **2** | — |
| sabti_018 الطموح | 2 | **2** | — |
| sabti_021 الوفاء | 2 | **2** | — |
| sabti_022 الطموح المفرط | 4 | **2** | mouth_tension_ratio, forehead_tension |
| sabti_222 قمع المشاعر حفاظًا عل الصورة | 2 | **1** | feature_rigidity |