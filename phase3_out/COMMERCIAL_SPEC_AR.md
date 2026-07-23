# Phase 3 — المواصفات التجارية لنظام تَوَافُق

## نظرة عامة

النظام له **ميزتان مدفوعتان مستقلتان** يمكن شراء أي منهما لوحدها:

| الميزة | نوع الدفع | المدخلات | المخرجات الأساسية |
|---|---|---|---|
| **Matching** | اشتراك دائم (49 ر/شهر · 399 ر/سنة) | 73 سؤال + صورة | قائمة مطابقات + إرسال طلبات + شات بلا حد |
| **Trait Analysis** | شراء مرة واحدة (79/149/249 ر) | 30/80/100 سؤال + صورة | قراءة شخصية تفصيلية لـ 155/287/317 سمة |

> **القاعدة الذهبية:** كل ميزة لها paywall منفصل. الـ Matching ما يحتاج TA ليشتغل، والـ TA يعمل بدون اشتراك Matching. **لكن** لو المستخدم اشترى الاثنين، الـ TA يحسّن الـ Matching تلقائياً.

> **التسعير موحَّد للجنسين** — نفس الأسعار للذكور والإناث.

---

## 1) ميزة Matching (اشتراك دائم)

### المدخلات الكاملة (من الـ Onboarding المجاني الإجباري)
- **73 سؤال** مدروسة من علم النفس الزواجي (Big Five, Gottman, Attachment, Dark Triad...)
- **38 metric** من الصورة عبر MediaPipe FaceLandmarker
- (اختياري) بيانات Trait Analysis لو المستخدم اشتراها → يضيف dimension تاسعة

### التسعير
- شهري: **49 ريال**
- سنوي: **399 ريال** (وفّر 189 ريال)

### الـ Tiers (مجاني vs مشترك)

| الفعل | مجاني | مشترك |
|---|---|---|
| Onboarding كاملاً | ✅ | ✅ |
| إشعار "في X توافقات" | ✅ | ✅ |
| رؤية قائمة المطابقات بالأسماء والصور | ❌ | ✅ |
| إرسال طلبات تعارف | ❌ | ✅ (5/أسبوع) |
| استقبال طلبات + رؤية ملف من بعت لي | ✅ | ✅ |
| قبول/رفض طلب | ✅ | ✅ |
| **شات بعد القبول** | ✅ 10 رسائل | ✅ بلا حد |
| رؤية تفاصيل الـ 8 محاور | ❌ | ✅ |

### Receiver Auto-Unlock
لما مشترك يبعت طلب لمستخدم مجاني، المجاني يفتح له تلقائياً: رؤية الملف + قبول/رفض + 10 رسائل شات مجانية. بعدها paywall.

### المخرجات (عند مقارنة شخصين)
```json
{
  "ok": true,
  "score": 0..100,
  "tag": "high" | "medium" | "low",
  "dimensions": {
    "religion": 0..100, "personality": 0..100,
    "attachment": 0..100, "conflict": 0..100,
    "values": 0..100, "intimacy": 0..100,
    "love_lang": 0..100, "dark_triad": 0..100,
    "firasa": 0..100  // فقط لو الاثنين عندهم TA
  },
  "red_flags": ["control_jealousy", ...],
  "explanation_ar": "..."
}
```

### Frontend Integration
- `matches`, `match-detail`, `req-received`, `chat-room` في [pages-main.jsx](frasa/src/pages-main.jsx)
- CTA من الـ paywall: "اشترك في Matching لرؤية المطابقات والتواصل"

---

## 2) ميزة Trait Analysis (شراء مرة واحدة)

ميزة **مستقلة تماماً عن Matching**. المستخدم يقدر يشتريها بدون اشتراك Matching، ويحصل على قراءة شخصية تفصيلية.

### الخطط الثلاث

| الخطة | السعر | عدد الأسئلة | high confidence | medium | low | المغطاة |
|---|---|---|---|---|---|---|
| **Basic** | **79 ر** | 30 | 0 | 12 | 143 | 155/600 (26%) |
| **Advanced** | **149 ر** | 80 | 7 | 58 | 222 | 287/600 (48%) |
| **Premium** | **249 ر** | 100 | **16** | **70** | 231 | **317/600 (53%)** |

> **شراء مرة واحدة** (مش اشتراك). الخطط متداخلة — Premium يحتوي Advanced، الـ Advanced يحتوي Basic.

> الأرقام تعكس السمات التي يصلها سؤال واحد على الأقل. مع زيادة الأسئلة، السمة الواحدة تتلقى مزيد من signals → confidence يصعد.

### قاعدة Confidence
```
high     : ≥3 أسئلة  أو  ≥2 سؤال + مؤشر بنيوي من الصورة
medium   : ≥2 أسئلة  أو  ≥1 سؤال + مؤشر بنيوي
low      : سؤال واحد  أو  مؤشر بنيوي فقط
none     : لا توجد بيانات → السمة لا تظهر للمستخدم
```

### معمارية الحساب
كل سمة تأخذ Sub-score من مصدرين (إن وُجدا)، ثم تُدمج:

```
trait_score = 0.6 × question_subscore + 0.4 × structural_subscore
            (أو ما هو متاح فقط)
question_subscore   = Σ (Likert_signed × weight) / Σ weight
structural_subscore = من mapping الصور لـ 15 سمة مؤكدة في Phase 2
display_score       = (raw + 1) / 2 × 100   →   0..100
```

### المخرجات
```json
{
  "summary": {
    "plan": "advanced",
    "answered_questions": 78,
    "plan_size": 80,
    "traits_returned": 287,
    "traits_total": 566
  },
  "traits": [
    {
      "trait_id": "sabti_001",
      "score": 67.3,
      "confidence": "high",
      "questions_used": 4,
      "structural_used": true
    },
    ...
  ]
}
```

### بنية بنك الأسئلة
بنك واحد بـ 951 سؤال (في [question_bank.json](question_bank.json)). الخطط Subsets *متداخلة*:
```
matching (7)  ⊂  basic (30)  ⊂  basic_plus (45)  ⊂  advanced (80)  ⊂  premium (100)
```
ترتيب الأسئلة بـ score = `traits_covered × log(1 + Σ weights)`. السؤال الأعلى تأثيراً في الـ scoring يأتي في الـ matching tier المجاني.

---

## 3) مكوّنات النظام

### الصورة (Image — Structural فقط)
الـ pipeline الموجود في [process_firasa_*.py](process_firasa_day1.py) يُوسَّع ليُخرج ~30 metric (شفاه، فك، ذقن، حاجب، عين، أنف، خد، جبهة، شكل الوجه، تماثل). تستخدمها 15 سمة بشكل مباشر وتدعم الـ scoring لـ كل السمات بشكل ثانوي عبر confidence boost.

### الأسئلة (Self-report — Behavioral)
951 سؤال مجمَّعون من 1705 مؤشر سلوكي/كلامي/جسدي بعد clustering بـ Jaccard على Arabic tokens. كل سؤال:
- مرتبط بسمة أو أكثر بأوزان (`trait_question_matrix.json`)
- نص عربي بصيغة "ينطبق عليّ: ..." أو "أكرر مقولات مثل: ..."
- Likert 5 نقاط

> **ملاحظة:** النصوص النهائية للأسئلة تحتاج مراجعة تحريرية بشرية قبل الإطلاق — التحويل الميكانيكي يُنتج صياغة وظيفية لكن غير مصقولة.

### المحرك (Engine)
ملف واحد: [scoring_engine.py](scoring_engine.py)

```python
from scoring_engine import analyze_traits, matching_score

# تحليل سمات للمستخدم المشترك
result = analyze_traits(
    answers      = {"q_0168": 4, "q_0487": 2, ...},
    face_metrics = {"jaw_width_ratio": 0.7, ...},
    plan         = "advanced"
)

# توافق سريع للمستخدم المجاني
match = matching_score(profile_a, profile_b)
```

---

## 4) ما لا يستخدمه النظام (مستبعد بقرار تصميمي)

- ❌ الفيديو
- ❌ تتبع الحركة (gaze tracking)
- ❌ التحليل الصوتي / النبرة
- ❌ تحليل لغة الجسد
- ❌ الـ liveness كأداة قياس (يبقى فقط للتحقق من إن الوجه حقيقي)

أي مؤشرات سلوكية ديناميكية تم تحويلها لأسئلة self-report. أي مؤشرات صوتية أو جسدية تم حذفها من الـ scoring.

---

## 5) Frontend Integration Plan

### الصفحات الموجودة وعلاقتها بالنظام

| صفحة (في [pages-onboarding.jsx](frasa/src/pages-onboarding.jsx)) | الدور الجديد |
|---|---|
| `face-capture`, `face-processing` | استخراج structural metrics (يبقى كما هو) |
| `q-question` (× 7) | onboarding questions = matching tier |
| `face-traits` | شاشة Matching فقط للمستخدم المجاني |

### الصفحات المطلوب إضافتها/تعديلها
| صفحة | الوظيفة |
|---|---|
| `paid-quiz` (جديدة) | حسب خطة المستخدم، تعرض 30/45/80/100 سؤال من البنك |
| `report` ([pages-main.jsx](frasa/src/pages-main.jsx)) | تعرض سمات بـ confidence ≥ medium للخطة المدفوعة |
| `pricing` ([pages-subscription.jsx](frasa/src/pages-subscription.jsx)) | تربط plan name بـ engine's plan key |

---

## 6) ملفات Phase 3

| الملف | الوصف | الحجم |
|---|---|---|
| `question_bank.json` | 951 سؤال مع metadata | ~500 KB |
| `trait_question_matrix.json` | 566 سمة → أسئلتها + أوزان | ~130 KB |
| `plans.json` | الخطط → قائمة question IDs | 4 KB |
| `coverage_per_plan.json` | تفصيل coverage لكل سمة في كل خطة | ~720 KB |
| `coverage_summary.md` | تقرير مختصر | 3 KB |
| `scoring_engine.py` | المحرك الكامل | ~7 KB |
| `COMMERCIAL_SPEC_AR.md` | هذا الملف | — |

---

## 7) المخاطر والاعتبارات

1. **الـ 283 سمة غير المغطاة في Premium**: إما تُحذف من الـ master dataset، أو تُظهَر للمستخدم بـ tag "غير قابل للقياس بدون بيانات إضافية" مع شرح شفاف. أنصح بالخيار الثاني لأنه يحافظ على ثراء النموذج النظري ويفتح باب تطوير مستقبلي.
2. **جودة نص الأسئلة**: التوليد الميكانيكي يحتاج editorial pass. خطة عملية: اشتغل على top 100 سؤال يدوياً (تغطي premium tier) قبل الإطلاق.
3. **معايرة الأوزان**: الأوزان الحالية مُشتقة من تكرار المؤشر داخل العنقود. لو حصلت على بيانات real users لاحقاً، عمل re-calibration بـ logistic regression سيرفع الدقة.
4. **التحقق العلمي**: مع 282 face sample موجود في `samples`، يمكن إجراء validation study أولية لـ 15 trait المؤكدة structurally قبل الإطلاق.

## 8) خطوات الإطلاق المقترحة

1. **Editorial pass على أول 100 سؤال** (3-5 أيام عمل)
2. **توسيع `process_firasa_*.py`** ليُخرج الـ 30 structural metric (5-7 أيام)
3. **Frontend integration**: ربط `paid-quiz` بالـ engine، عرض النتائج (1-2 أسبوع)
4. **بيتا داخلية** على 20-30 مستخدم لمعايرة العتبات (1-2 أسبوع)
5. **إطلاق Basic فقط أول**، ثم Advanced بعد شهر، ثم Premium بعد شهر من Advanced — يدي وقت لتحسين المحتوى بناءً على feedback
