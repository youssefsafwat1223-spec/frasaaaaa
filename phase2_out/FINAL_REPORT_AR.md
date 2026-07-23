# تقرير Phase 2 — فلتر الصورة الثابتة فقط

## الخلاصة الرقمية

| البيان | القيمة |
|---|---|
| إجمالي السمات (sabti_traits) | **600** |
| السمات القابلة للقياس من صورة وجه ثابتة | **15** |
| السمات المحذوفة | **585** |
| ثقة عالية (high) | 7 |
| ثقة متوسطة (medium) | 8 |
| ثقة منخفضة (low) | 0 |

## توزيع المؤشرات (1794 سطر إجمالي)

| التصنيف | العدد | النسبة |
|---|---|---|
| `non_image_behavioral` (سلوكي / حركي زمني) | 1019 | 56.8% |
| `ambiguous` (وصف ثابت لكن غامض، غير قابل للقياس بمتر محدد) | 370 | 20.6% |
| `verbal` (كلام / صوت / نبرة) | 231 | 12.9% |
| **`structural_image`** (قابل للقياس من الصورة) | **89** | **5.0%** |
| `posture_body` (جسم / يد / كتف) | 85 | 4.7% |

## السمات الـ 15 المحفوظة

| ID | السمة | الثقة | الـ features |
|---|---|---|---|
| sabti_001 | الكرم | high | mouth_height_ratio↑, chin_width_ratio=mid, eye_warmth_proxy↑ |
| sabti_002 | الطيبة | high | cheek_fullness↑, upper_lip_ratio↓, forehead_smoothness↑, forehead_lines↓ |
| sabti_003 | الصبر | high | forehead_width_ratio↑, brow_tilt=down, mouth_stability↑, chin_width_ratio=mid |
| sabti_004 | الأنانية | high | mouth_tension_ratio↑, chin_width_ratio↓, brow_inner_distance↓ |
| sabti_005 | الحزم | high | jaw_width_ratio↑, brow_tilt=flat, forehead_tension↑, mouth_open_ratio↓ |
| sabti_011 | التواضع | high | eye_warmth_proxy↑, face_muscle_tension↓, mouth_stability↑ |
| sabti_022 | الطموح المفرط | high | chin_projection_ratio↑, mouth_tension_ratio↑, brow_eye_distance_ratio↑, forehead_tension↑ |
| sabti_006 | الاندفاع | medium | nostril_width_ratio↑, lower_lip_protrusion↑ |
| sabti_007 | الهدوء | medium | forehead_smoothness↑, face_muscle_tension↓ |
| sabti_010 | القيادة | medium | chin_projection_ratio↑, forehead_shape=flat |
| sabti_012 | الكتمان | medium | mouth_open_ratio↓, lower_lip_tension↑ |
| sabti_013 | التسلّط | medium | jaw_angle_sharpness↑, brow_density↑ |
| sabti_018 | الطموح | medium | brow_arch↑, chin_projection_ratio↑ |
| sabti_021 | الوفاء | medium | lower_lip_ratio↑, brow_tilt=flat |
| sabti_222 | قمع المشاعر | medium | forehead_smoothness↑, feature_rigidity↑ |

## أسباب الحذف (top buckets)

| العدد | السبب |
|---|---|
| 503 | لا يحتوي على أي مؤشر بنيوي (structural) — مؤشراته كلها سلوكية/كلامية/جسدية |
| 50 | فيه مؤشر بنيوي واحد فقط (إشارة ضعيفة) |
| 32 | لا توجد مؤشرات أصلاً (parsing failure أو سمة فارغة) |

## مكوّنات النظام بعد التصفية

عدد الـ **features** الفريدة المطلوبة برمجياً: **حوالي 30 metric** (موزّعة على المناطق):
- **lips/mouth**: mouth_height_ratio, upper_lip_ratio, lower_lip_ratio, lower_lip_protrusion, mouth_width_ratio, mouth_corner_tilt, mouth_tension_ratio, mouth_open_ratio, mouth_stability, lower_lip_tension, upper_lip_tension, lip_flexibility
- **chin**: chin_width_ratio, chin_projection_ratio, chin_roundness, chin_stability
- **jaw**: jaw_width_ratio, jaw_angle_sharpness
- **forehead**: forehead_width_ratio, forehead_ratio, forehead_smoothness, forehead_tension, forehead_lines, forehead_shape
- **brow**: brow_eye_distance_ratio, brow_inner_distance, brow_density, brow_tilt, brow_arch, brow_tension, brow_definition, brow_symmetry
- **eye**: eye_open_ratio, eye_roundness, eye_spacing_ratio, eye_tilt_ratio, eye_depth, upper_lid_coverage, eye_warmth_proxy
- **nose**: nose_length_ratio, nose_width_ratio, nostril_width_ratio, nose_tip_drop_ratio
- **cheek**: cheekbone_prominence, cheek_fullness
- **face**: face_aspect_ratio, face_symmetry, face_muscle_tension, feature_rigidity, feature_softness

من هذه الـ 30 metric، **في عندك 38 threshold موجود فعلياً** في `thresholds_from_pdf.json` — لكن أغلبهم بأسماء مختلفة (مثلاً `face_height` بدل `forehead_ratio`). محتاج mapping بسيط بين الأسماء.

## الخطوة التالية المقترحة (Phase 3)

1. **توحيد أسماء الـ metrics** بين `phase2_out/trait_feature_map.json` و `thresholds_from_pdf.json`
2. **توسيع** `process_firasa_*.py` ليُخرج كل الـ 30 metric من الـ MediaPipe landmarks
3. كتابة `score_trait(metrics) → score (0..1)` تأخذ المخرجات وتُرجع 15 score
4. تكامل مع الـ frontend في صفحة `face-traits`
