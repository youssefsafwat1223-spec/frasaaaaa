# Matching Engine — مواصفات تقنية وعلمية

## ملخص

محرّك التوافق الزوجي مبني على **73 سؤال** مدروسة من علم النفس الزواجي، تقيس **8 محاور توافق** قابلة للقياس + **فلاتر صلبة** + **مؤشرات تحذيرية**.

> هذا المحرّك **مستقل تماماً** عن Trait Analysis (الـ Firasa).  
> Matching = مقارنة شخصين. Trait Analysis = قراءة شخصية الواحد.

---

## بنية الـ 73 سؤال

| المرحلة | عدد الأسئلة | الدور |
|---|---|---|
| 1️⃣ الهوية والفلاتر الصلبة | 11 (Q1-11) | Hard filters — تُستبعد المطابقات غير المتوافقة جذرياً |
| 2️⃣ الإطار الديني | 16 (Q12-27) | الدين، المذهب، الالتزام، السلوك العبادي، توقعات الشريك |
| 3️⃣ القرارات والصحة | 9 (Q28-36) | الأطفال، التعدد، الصحة، التقبّل |
| 4️⃣ الشخصية والتعلق | 8 (Q37-44) | Big Five + Attachment Theory |
| 5️⃣ التواصل والصراع | 4 (Q45-48) | Gottman's Four Horsemen |
| 6️⃣ القيم والعائلة | 7 (Q49-55) | المال، النظافة، الأهل |
| 7️⃣ الحميمية والإيقاع | 8 (Q56-63) | لغة الحب، الحميمية، الأدوار، الخطوط الحمراء |
| 8️⃣ الأخلاق والأنماط الخفية | 10 (Q64-73) | Dark Triad detectors (نرجسية، تسلّط، مكيافيلية) |

---

## المحاور الـ 8 للتوافق

### 1) Religion (وزن 1.5)
- Hard filter: `religion == religion` (إلا إذا اختار "منفتح" في Q8)
- Soft: نفس المذهب + فجوة الالتزام ≤ 15 نقطة على VAS

**الصيغة:**
```
if A.religion != B.religion: return 0
if A.sect != B.sect:           score = 40
else: score = 100 - abs(A.commitment - B.commitment)
```

### 2) Personality — Big Five (وزن 1.0)
أسئلة Q37-Q41 على Likert 7. Q37 و Q39 **معكوسان** (reverse-scored) لكشف الـ acquiescence bias.

**خمسة أبعاد:**
- O - Openness (Q37 معكوس)
- C - Conscientiousness (Q38)
- E - Extraversion (Q39 معكوس)
- A - Agreeableness (Q40)
- N - Emotional Stability (Q41)

**الصيغة:**
```
score = mean over dimensions of: 100 - 12 × |A.dim - B.dim|
```

> ملاحظة: لا يُشترَط التطابق التام — التشابه المتوسط مع تكامل بسيط هو الأمثل.

### 3) Attachment Style (وزن 1.2)
Q42-Q44 (سيناريوهات). كل ـ "أ/ب/ج/د" تربط بنمط:
- أ ← Secure
- ب ← Anxious
- ج ← Avoidant
- د ← Disorganized

**مصفوفة التوافق:**

| | Secure | Anxious | Avoidant | Disorganized |
|---|---|---|---|---|
| **Secure** | 95 | 80 | 78 | 65 |
| **Anxious** | 80 | 55 | **30** ⚠ | 40 |
| **Avoidant** | 78 | **30** ⚠ | 55 | 35 |
| **Disorganized** | 65 | 40 | 35 | 30 |

> Anxious × Avoidant = أسوأ ديناميكية (الـ "pursuer-distancer pattern" المعروف)

### 4) Conflict — Gottman Four Horsemen (وزن 1.5)
Q45 مصفوفة تكرار 5 عناصر:
- ✅ Problem solving (إيجابي)
- ❌ Criticism (نقد شخصي)
- ❌ Contempt (احتقار) ← **أقوى منبئ للطلاق علمياً**
- ❌ Defensiveness (دفاعية)
- ❌ Stonewalling (تجاهل)

**الصيغة:**
```
healthy = (problem_solving - mean(horsemen) + 5) × 10
if A.contempt ≥ 4 OR B.contempt ≥ 4: cap at 35
```

### 5) Values (وزن 1.0)
المال (Q49), الكرم (Q50), النظافة (Q52), قُرب الأهل (Q53), التدخّل (Q54). Bipolar/Likert 7.

### 6) Intimacy (وزن 0.8)
المستوى المتوقع (Q57 VAS), التعبير العلني (Q58), التربية (Q59), العمل (Q60).

### 7) Love Languages (وزن 0.7)
Q56 ترتيب 5 لغات حب. النتيجة عالية لو أحد الـ top-2 عند A يطابق top-1 عند B.

### 8) Dark Triad — Safety (وزن 1.3)
Q64-Q73 — 9 سيناريو + Q73 Likert. كل خيار له `darkScore` من -2 إلى +2.

**Red Flags (تقطع الـ score):**
- 2 red flags → cap at 55
- 4+ red flags → cap at 35

**علامات حمراء محددة:**
- `control_jealousy` (Q66 = ج/د)
- `aggression` (Q70 = ج/د)
- `controlling_decisions` (Q72 = ج/د)
- `machiavellian_endorsement` (Q73 ≥ 6)

---

## الـ Hard Filters

تطبق قبل أي scoring. أي failure يطلع `{ok: false, reason}`:

1. **Gender**: نفس الجنس → استبعاد (سياسة التطبيق)
2. **Religion**: مختلف وما اختار "منفتح" → استبعاد
3. **Children**: `لا` × `نعم قطعاً` → استبعاد
4. **Age range**: A خارج المدى المقبول عند B أو العكس
5. **Country/Region**: لو A اختار "من بلدي فقط"
6. **Deal-breakers (Q63)**: لو B عنده صفة في قائمة A

---

## الـ Scoring الكامل

```
overall_raw = Σ (dim_score × weight) / Σ weight

apply red-flag caps:
  flags >= 2  →  min(overall, 55)
  flags >= 4  →  min(overall, 35)

tag:
  ≥ 75  →  high     "توافق قوي"
  ≥ 55  →  medium   "توافق متوسط"
  <  55  →  low      "توافق محدود"
```

---

## الـ Gender / Religion Gating

أسئلة تظهر فقط لجمهور معيّن:
- Q16 (لباس) → الإناث فقط
- Q17 (تفضيل اللباس) → الذكور فقط
- Q20-23 (الصلاة، الفجر) → المسلمون
- Q24 (حفظ القرآن) → المسلمون
- Q25 (الكتاب المقدس) → المسيحيون
- Q30 (تعدد) → الذكور المسلمون
- Q31 (قبول التعدد) → الإناث المسلمات
- Q21 (صلاة الجماعة) → الذكور المسلمون

التطبيق يستخدم `Matching.getQuestions(gender, religion)` ليرجع subset مناسب.

---

## Receiver Auto-Unlock — حل مشكلة Two-Sided Marketplace

### المشكلة
لو المشترك أحمد بعت طلب للمستخدمة المجانية لمياء، إيش يحصل؟ لو لمياء ما تقدرش ترد، أحمد دفع في الفراغ. لو تقدر ترد مجاناً بلا حد، ليش الناس تدفع أصلاً؟

### الحل: Auto-Unlock محدود

```
المشترك ──→ يبعت طلب تعارف ──→ المستقبل (مجاني)
                                       │
                                       ▼
المستقبل تلقائياً (بدون اشتراك):
  ✅ يشوف ملف المُرسِل كاملاً
  ✅ يقبل أو يرفض
  ✅ لو قبل → يدخل الشات
       │
       ▼
  📨 10 رسائل مجانية للمستقبل
       │
       ▼ بعد الـ 10:
  المستقبل: paywall أو يتوقف الشات
  المُرسِل: إشعار "في انتظار اشتراك الطرف الآخر"
```

### القواعد التقنية:
- العد ينعمل **per-chat** مش global. لو الراسل بعت رسالة ١١، تنخفض للجمد، بس لو دخل في شات تاني مع شخص جديد، عداد جديد.
- **الراسل المشترك بلا حد** — العد فقط للريسيفر المجاني.
- لو الريسيفر اشترك أثناء الشات، الـ counter ينمسح والشات يبقى مفتوح.
- **حد 5 طلبات/أسبوع** للمشترك المرسل (anti-spam).

### مكان الـ Matching في النظام الكامل

```
┌─────────── الـ Onboarding (مجاني، إجباري) ─────────────┐
│  73 سؤال + صورة وجه (38 metric)                         │
│  ▼                                                       │
│  Matching Engine builds profile                          │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Free State           │
              │  • إشعار بالتوافقات   │
              │  • استقبال طلبات      │
              │  • شات 10 مجاني       │
              └───────────┬───────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
   ┌─ Matching Sub ─┐    ┌─ Trait Analysis ─┐
   │ 49 ر/شهر       │    │ 79-249 ر مرة      │
   │ 399 ر/سنة      │    │  واحدة            │
   │                │    │                   │
   │ Matching       │    │ Trait Engine      │
   │ Engine يعمل    │    │ Firasa يقرأ       │
   │ full unlock    │    │ 155-317 سمة       │
   └────────┬───────┘    └────────┬──────────┘
            │                     │
            └───── + الاثنين ─────┘
                    ↓
        Matching + TA Layer (317 سمة فراسة
                              كـ 9th dimension)
```

---

## API الفعلي (JavaScript)

```javascript
// init
await Matching.init();

// get questions filtered for this user
const myQs = Matching.getQuestions("ذكر", "مسلم/ة");

// after the user answers, build profile
const myProfile = Matching.buildProfile({
  2: "ذكر",
  12: "مسلم/ة",
  13: 75,           // VAS commitment
  37: 4, 38: 6, 39: 3, 40: 5, 41: 4,  // Big Five
  42: "أ", 43: "أ", 44: "أ",           // Attachment secure
  45: { problem_solving: 5, criticism: 1, contempt: 1, defensiveness: 2, stonewalling: 1 },
  // ... etc
});

// compare with another profile from DB
const result = Matching.compareProfiles(myProfile, theirProfile);
// {
//   ok: true,
//   score: 78,
//   tag: "high",
//   dimensions: { religion: 92, personality: 71, attachment: 95, conflict: 80, ... },
//   red_flags: [],
//   explanation: "توافق قوي على عدة محاور..."
// }
```

---

## التسعير والمنطق التجاري

| الميزة | نوع الدفع | السعر | تجديد |
|---|---|---|---|
| Matching | اشتراك | 49 ر/شهر · 399 ر/سنة | نعم — لو انتهى، يقفل كل الـ Matching features |
| Trait Analysis Basic | شراء واحد | 79 ر | لا — يبقى مدى الحياة |
| Trait Analysis Advanced | شراء واحد | 149 ر | لا — يبقى مدى الحياة |
| Trait Analysis Premium | شراء واحد | 249 ر | لا — يبقى مدى الحياة |

**نفس السعر للجنسين.** التسعير الموحد يبني ثقة ويتفادى أي شكاوى عدالة.

## ضوابط Anti-Abuse

| الخطر | الإجراء |
|---|---|
| Spam من المرسلين | حد 5 طلبات تعارف/أسبوع/مشترك |
| رسائل مكررة على ناس مختلفين | detection على hash النص + warning ثم suspension |
| Fake profiles مجانية للاستفادة من Auto-Unlock | verification إجباري: رقم جوال + selfie matching مع face_landmarks |
| فتح حسابات متعددة برقم/وجه واحد | binding: phone+ID+face = primary key |
| المستقبل ياخد الـ 10 رسائل ويختفي | بعد 10: paywall واضح، نُعلم المرسل، نسجل "no-conversion" stat للتحليل |

## ملاحظات للإطلاق

1. **معايرة الأوزان**: الأوزان الحالية (religion 1.5, conflict 1.5...) تقديرية — تحتاج تعديل بعد ~1000 مستخدم فعلي.
2. **القيم القياسية**: الـ Big Five نستخدم 100-12×gap. الـ multiplier `12` تجريبي — مع بيانات حقيقية نضبطه ليعطي توزيع طبيعي.
3. **Q22 (سهر الفجر) كاشف ذكي**: لا يدخل في الـ scoring مباشرة، لكن يُستخدم كـ "تقاطع" مع Q20-Q23 لكشف الـ social-desirability bias.
4. **حماية الخصوصية**: Q33, Q35 (صحة، نفسية) لا تظهر في الـ profile العام. تُكشف فقط للمطابقات بعد القبول المتبادل.
