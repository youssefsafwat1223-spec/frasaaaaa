# بناء خريطة الـ60 صفة (وش + اتجاه + وزن + مصدر ثقة)

- صفات اتبنت: **60**
- متطابقة مع sabti id (قابلة للأسئلة من المصفوفة): **7**
- صفات بدون أي ربط بصري (هتفضل أسئلة بالكامل): **0**
- أسماء مش متطابقة مع traits_meta: 53 -> الثقة في الآخرين, الصراحة والتعبير المباشر, التعاطف, الحنان العاطفي, الرومانسية, الاستقرار الأسري, تحمل المسؤولية, الجرأة, الاستقلالية, الحكمة, التركيز العالي, التحليل والدقة, التخطيط بعيد المدى, الانضباط, العملية, الإصرار, المرونة, التسامح, الاجتماعية, الانفتاح على التجارب, الإبداع, الخيال, الحس الفني, المثالية, النظام, الحذر, التحفظ والخصوصية, السرية وحفظ الأسرار, العناد, العصبية وسرعة الاستثارة, حب المخاطرة, الحرص المالي, الإنفاق والتبذير, حب الرفاهية والمتعة, الفضول وحب المعرفة, القدرة على الإقناع, الاهتمام بالتفاصيل, رؤية الصورة الكبيرة, التكيف, التفاؤل, النقد ورؤية السلبيات, الحساسية, الحاجة للأمان, حب الحرية, حب السيطرة, اللباقة, القدرة على الاستماع, الدعم وخدمة الآخرين, الاستمتاع بالعائلة, القدرة على إنجاز الأهداف, تحمل الضغط, التوازن بين العقل والعاطفة, الصدق العملي

## كام صفة بتستخدم كل قياس
- `mouth_width_ratio`: 32 صفة
- `brow_arch`: 26 صفة
- `eye_open_ratio`: 25 صفة
- `upper_lip_ratio`: 20 صفة
- `nose_bridge_straightness`: 18 صفة
- `nose_tip_drop_ratio`: 15 صفة
- `brow_eye_distance_ratio`: 13 صفة
- `eye_tilt_ratio`: 11 صفة
- `forehead_width_ratio`: 11 صفة
- `eye_spacing_ratio`: 11 صفة
- `chin_projection_ratio`: 10 صفة
- `chin_profile_projection`: 9 صفة
- `face_aspect_ratio`: 8 صفة
- `brow_density`: 7 صفة
- `jaw_width_ratio`: 7 صفة
- `nostril_width_ratio`: 6 صفة
- `nose_length_ratio`: 6 صفة
- `eye_depth`: 6 صفة
- `face_squareness`: 5 صفة
- `brow_inner_distance`: 4 صفة
- `nose_width_ratio`: 3 صفة
- `forehead_lines`: 3 صفة
- `nose_tip_sharpness`: 3 صفة
- `lower_lip_ratio`: 2 صفة
- `lower_sclera`: 1 صفة
- `cheek_fullness`: 1 صفة
- `mouth_corner_tilt`: 1 صفة
- `upper_sclera`: 1 صفة

## الصفات اللي هتفضل أسئلة (مفيش ربط بصري واضح)

## عينة: أول 12 صفة وروابطها

### الكرم  (ثقة:high, ملامح:5)
  - mouth_width_ratio | high | w=2.6 | direct
  - upper_lip_ratio | high | w=2.6 | direct
  - eye_open_ratio | high | w=2.0 | direct
  - nose_tip_drop_ratio | low | w=1.98 | direct
  - nostril_width_ratio | high | w=1.32 | direct

### الثقة في الآخرين  (ثقة:high, ملامح:6)
  - eye_open_ratio | high | w=2.6 | direct
  - nose_tip_drop_ratio | low | w=2.34 | direct
  - mouth_width_ratio | high | w=2.2 | direct
  - brow_arch | high | w=1.8 | direct
  - upper_lip_ratio | high | w=1.65 | direct
  - face_aspect_ratio | low | w=1.5 | direct

### الصراحة والتعبير المباشر  (ثقة:high, ملامح:5)
  - eye_open_ratio | high | w=2.6 | direct
  - mouth_width_ratio | high | w=2.6 | direct
  - nose_tip_drop_ratio | low | w=1.98 | direct
  - upper_lip_ratio | high | w=1.95 | direct
  - brow_eye_distance_ratio | low | w=1.5 | direct

### التعاطف  (ثقة:high, ملامح:4)
  - eye_open_ratio | high | w=2.6 | direct
  - brow_arch | high | w=1.98 | direct
  - eye_tilt_ratio | low | w=1.95 | direct
  - upper_lip_ratio | high | w=1.5 | direct

### الحنان العاطفي  (ثقة:high, ملامح:4)
  - upper_lip_ratio | high | w=2.6 | direct
  - mouth_width_ratio | high | w=2.6 | direct
  - brow_arch | high | w=1.8 | direct
  - face_aspect_ratio | low | w=1.5 | direct

### الرومانسية  (ثقة:medium, ملامح:2)
  - upper_lip_ratio | high | w=1.95 | direct
  - brow_arch | high | w=1.8 | direct

### الوفاء  (ثقة:medium, ملامح:3)
  - brow_eye_distance_ratio | high | w=2.34 | direct
  - nose_bridge_straightness | mid | w=1.66 | profile
  - mouth_width_ratio | mid | w=1.1 | direct

### الاستقرار الأسري  (ثقة:low, ملامح:1)
  - mouth_width_ratio | high | w=2.6 | direct

### تحمل المسؤولية  (ثقة:high, ملامح:7)
  - nose_length_ratio | high | w=2.34 | direct
  - brow_density | high | w=2.34 | direct
  - jaw_width_ratio | high | w=2.2 | direct
  - chin_projection_ratio | high | w=1.98 | direct
  - forehead_width_ratio | high | w=1.5 | direct
  - chin_profile_projection | high | w=1.12 | profile
  - face_squareness | high | w=0.9 | proxy

### الطموح  (ثقة:high, ملامح:6)
  - nose_length_ratio | high | w=2.34 | direct
  - eye_tilt_ratio | high | w=2.0 | direct
  - forehead_width_ratio | high | w=1.95 | direct
  - brow_arch | low | w=1.95 | direct
  - brow_eye_distance_ratio | low | w=1.65 | direct
  - chin_projection_ratio | high | w=1.5 | direct

### القيادة  (ثقة:high, ملامح:5)
  - jaw_width_ratio | high | w=2.2 | direct
  - forehead_width_ratio | high | w=1.95 | direct
  - nose_width_ratio | high | w=1.95 | direct
  - brow_arch | low | w=1.56 | direct
  - face_squareness | high | w=0.9 | proxy

### الجرأة  (ثقة:high, ملامح:6)
  - brow_density | high | w=2.34 | direct
  - nose_bridge_straightness | high | w=2.21 | profile
  - eye_tilt_ratio | high | w=2.2 | direct
  - chin_projection_ratio | high | w=1.8 | direct
  - forehead_width_ratio | high | w=1.65 | direct
  - chin_profile_projection | high | w=1.02 | profile