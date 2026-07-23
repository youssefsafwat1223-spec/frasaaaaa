# رحلة المستخدم الكاملة في تطبيق تَوَافُق

> هذه الرحلة تربط كل **صفحة موجودة فعلياً** في [frasa/src/](frasa/src/) بدورها الوظيفي والـ engine اللي ورائها.

---

## نظرة عامة على الرحلة

```
┌─ 1) الوصول ─────────────────────────────────────────────┐
│  Landing → Register/Login → OTP → Phone+ID Verification │
└──────────────────────────┬───────────────────────────────┘
                            ▼
┌─ 2) Onboarding (إجباري) ─────────────────────────────────┐
│  Consent → Profile Setup → 73 سؤال → Face Capture       │
│  → Liveness → Self Prefs → Done                          │
│  (يبني الـ Matching Profile + 38 face metric)            │
└──────────────────────────┬───────────────────────────────┘
                            ▼
┌─ 3) Free State ──────────────────────────────────────────┐
│  • إشعار "في X توافقات لك" (بدون أسماء)                  │
│  • استقبال طلبات تعارف من المشتركين                      │
│  • رؤية ملف من بعت لي + قبول/رفض                         │
│  • شات 10 رسائل مجانية                                   │
└──────────────────────────┬───────────────────────────────┘
                            │ يفترق المسار
                            ▼
            ┌────────────────────────────┐
            │                            │
┌─ 4A) Matching ──┐         ┌─ 4B) Trait Analysis ──┐
│ اشتراك دائم     │         │ شراء مرة واحدة         │
│ شهري/سنوي       │         │ Basic/Advanced/Premium │
│                 │         │                         │
│ يفتح:           │         │ يفتح:                   │
│ • Matches list  │         │ • Paid quiz             │
│ • إرسال طلبات   │         │ • Report (155-317 سمة) │
│ • شات بلا حد    │         │ • تحليل من الصورة      │
└────────┬────────┘         └───────────┬────────────┘
         │                              │
         └────────── + الاثنين ─────────┘
                  أعلى تجربة:
                  Matching محسَّن بـ TA
                  (317 سمة فراسة كـ matching dim)
```

---

## المرحلة 1️⃣ — الوصول (Public)

ملف: [pages-public.jsx](frasa/src/pages-public.jsx)

| Page (id) | الدور | المُدخلات | المخرجات |
|---|---|---|---|
| `landing` | صفحة هبوط — تعريف بالتطبيق | — | CTA إلى register |
| `register` | إنشاء حساب جديد | بريد + كلمة سر + جنس مبدئي | حساب جديد → otp |
| `login` | تسجيل دخول | بيانات الدخول | يفتح dashboard أو يكمل onboarding |
| `otp` | تحقق برقم الجوال | OTP 6 خانات | يأكد الحساب |
| `forgot` / `reset` | استعادة كلمة السر | بريد | كلمة سر جديدة |

**القرار التجاري:** المستخدم يصل لـ landing من إعلان أو link. التسجيل **مجاني** — مفيش paywall في الدخول.

---

## المرحلة 2️⃣ — Onboarding (إجباري)

ملف: [pages-onboarding.jsx](frasa/src/pages-onboarding.jsx)

هذي المرحلة **هي اللي تبني الـ Matching Profile** بتاع المستخدم — بدونها مفيش matching.

### 2.1 — التمهيد والملف الأساسي
| Page (id) | الدور | البيانات المُجمَّعة |
|---|---|---|
| `consent` | موافقة على معالجة الصورة + سياسة الخصوصية | checkbox |
| `profile-setup` | اسم، صورة بروفايل، bio قصيرة | name, bio, avatar |

### 2.2 — الأسئلة (الـ 73 سؤال)
هذي خطوة **محورية للـ Matching**. الـ engine يحتاج إجابات الأسئلة الـ 73 من [data/matching_questions.json](demo/data/matching_questions.json) لبناء profile كامل.

| Page (id) | الدور |
|---|---|
| `q-overview` | شرح: 8 مراحل، ~15 دقيقة، يمكن الحفظ والإكمال لاحقاً |
| `q-question` | **يدور 73 مرة** — كل مرة يعرض سؤال واحد من المرحلة الحالية، يستخدم filtering بـ gender/religion |
| `q-category-done` | تنبيه بنهاية كل مرحلة (8 مراحل) + progress bar |
| `q-all-done` | "أكملت الـ Profile! نوصلك للصورة..." |

**التفعيل التقني:**
```javascript
// في PageQuestion
const allQs = Matching.getQuestions(userGender, userReligion);
const currentQ = allQs[state.idx];
// عند الانتهاء:
const profile = Matching.buildProfile(answers);
saveToBackend(profile);
```

### 2.3 — الصورة (Face Capture)
| Page (id) | الدور |
|---|---|
| `face-intro` | شرح: إضاءة جيدة، وجه واضح، صورة محلية فقط |
| `face-liveness` | تحقق إن الصورة لشخص حقيقي (anti-spoofing بسيط) |
| `face-capture` | الكاميرا أو رفع — يستخدم `Face.analyzeImageElement()` |
| `face-processing` | "جاري قراءة ملامح وجهك..." + progress |
| `face-traits` | عرض ملخص بسيط (مش كامل!): "وجهك يميل إلى..." — للمستخدم المجاني |

**المخرجات التقنية:** 38 metric من [face.js](demo/face.js) → يُخزَّن في الـ profile.

### 2.4 — تفضيلات إضافية
| Page (id) | الدور |
|---|---|
| `self-physical` | طول/وزن/بنية (Q10-Q11) |
| `self-prefs` | تفضيلات الشريك (عمر، طول، جنسية) |
| `onboard-done` | "اكتمل ملفك. ابدأ استكشاف المطابقات!" |

> **القاعدة:** المستخدم ما يقدر يستخدم Matches قبل ما يكمل Onboarding كاملاً.

---

## المرحلة 3️⃣ — Free State (بعد الـ Onboarding)

ملف: [pages-main.jsx](frasa/src/pages-main.jsx)

المستخدم المجاني عنده **خبرة كافية تخلّيه يحس بالـ value**، بس مش كاملة. الـ Auto-Unlock يخلّيه يجرّب الشات قبل ما يدفع.

### 3.1 — Dashboard (مجاني)
**Page id:** `dashboard`

- يعرض شارة إشعار: "🎉 في 3 توافقات قوية لك!"
- يعرض الطلبات الواردة (لو مشترك بعت له طلب)
- زر "اكتشف المطابقات" → matches (لكن مقفول)
- CTA: **"اشترك لرؤية مطابقاتك والتواصل معها"**

### 3.2 — قائمة المطابقات (مجاني — مقفول)
**Page id:** `matches`, `subscribed=false`

```
┌─────────────────────────────┐
│  🔒 3 مطابقات مخفية         │
│                              │
│  ━━━━━━━━━━━━━━━━━━━━       │
│  ل. ر. — توافق 87%          │
│  🔒 الاسم والصورة مخفيان    │
│                              │
│  س. أ. — توافق 81%          │
│  🔒                          │
│                              │
│  [ اشترك لفتح المطابقات ]   │
└─────────────────────────────┘
```

> المستخدم يشوف إن في توافقات (يخلق فضول) لكن مش يقدر يفتحهم.

### 3.3 — استقبال طلب تعارف (مجاني — مفتوح!)
**Page id:** `req-received`, `req-detail`

هذي اللحظة المحورية للـ Auto-Unlock. لو مشترك بعتله طلب:

- ✅ يوصله إشعار push: "أحمد يرغب بالتعارف عليك"
- ✅ يقدر يفتح ملف أحمد **كامل** (اسم، صورة، عمر، بلد، تعليم) — مجاناً
- ✅ يقدر **يقبل أو يرفض** الطلب — مجاناً
- ✅ لو قبل، يدخل الشات

### 3.4 — الشات المجاني (10 رسائل)
**Page id:** `chat-room`

- ✅ يكتب ويستقبل رسائل بحرية
- ⚠️ Counter ظاهر في أعلى الشاشة: "5 رسائل متبقية من 10 مجانية"
- ✅ بعد الـ 10:
  - شاشة paywall: "اشترك لمواصلة الحوار"
  - أو: "خلاص رسائلك المجانية. الشات سيُجمَّد ما لم تشترك"
- 📨 الطرف الثاني (المشترك) يرى: "في انتظار اشتراك الطرف الآخر لمواصلة الحوار"

### 3.5 — الطلبات والإشعارات (مجاني)
| Page (id) | الدور (مجاني) |
|---|---|
| `req-sent` | فاضي — ما يقدر يبادر |
| `req-received` | كل الطلبات الواردة + قبول/رفض مجاني |
| `chats` | قائمة المحادثات المفعّلة (محدودة بـ 10 رسائل) |
| `notifs` | إشعارات (في توافق، طلب جديد، رسالة جديدة) |

---

## المرحلة 4️⃣ — Conversion (مفترق الطرق)

ملف: [pages-subscription.jsx](frasa/src/pages-subscription.jsx)

عند الـ paywall، المستخدم يلاقي **مفترق طرق واضح** بين الميزتين المستقلتين:

### 4.1 — صفحة الأسعار
**Page id:** `pricing`

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│         🔓 افتح تجربة تَوَافُق الكاملة                  │
│                                                       │
│  ┌──────────────────┐    ┌──────────────────┐       │
│  │  💑 Matching     │    │  🧠 Trait        │       │
│  │  اشتراك دائم      │    │  Analysis        │       │
│  │                  │    │  شراء مرة واحدة   │       │
│  │  ٤٩ ر شهري      │    │                  │       │
│  │  ٣٩٩ ر سنوي     │    │  Basic   ٧٩ ر    │       │
│  │  (وفّر ١٨٩ ر)    │    │  Advanced ١٤٩ ر  │       │
│  │                  │    │  Premium  ٢٤٩ ر  │       │
│  │  افتح:           │    │                  │       │
│  │  • المطابقات     │    │  افتح:           │       │
│  │  • إرسال طلبات   │    │  • قراءة شخصية  │       │
│  │  • شات بلا حد    │    │  • 155-317 سمة  │       │
│  └──────────────────┘    └──────────────────┘       │
│                                                       │
│      [ اشتر الاثنين معاً ٦٤٨ ر — وفّر إضافي ]        │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### 4.2 — صفحات الدفع والنجاح
| Page (id) | الدور |
|---|---|
| `payment` | بطاقة + Apple Pay + STC Pay (السعودية) |
| `sub-success` | "اشتركت بنجاح! ..." (مختلف النص حسب الميزة المُشتراة) |
| `sub-expired` | شاشة تجديد اشتراك الـ Matching فقط (TA شراء واحد ما ينتهي) |
| `settings-sub` | إدارة الاشتراك من الإعدادات |

### CTAs اللي تودي للـ pricing:
- **في `req-received` / `chat-room`** بعد الـ 10 رسائل ⇒ pricing فيه toggle مبدئي على Matching
- **في `matches`** (مقفولة) ⇒ pricing على Matching
- **في `face-traits`** "لقراءة كاملة لشخصيتك..." ⇒ pricing فيه toggle على Trait Analysis
- **في `dashboard`** banner عام ⇒ pricing بدون tilt

---

## المرحلة 5️⃣ — Post-Purchase Experiences

### مسار A: المستخدم اشترك في Matching
يفتحله:
- `matches` ⇒ قائمة كاملة بالأسماء والصور
- `req-sent` ⇒ يقدر يبادر بطلبات (5/أسبوع)
- `chat-room` ⇒ بلا حد رسائل
- `match-detail` يعرض: نسبة + الـ 8 محاور + معلومات الطرف الآخر الكاملة

### مسار B: المستخدم اشترى Trait Analysis
**Page id:** `paid-quiz` (صفحة جديدة)

بعد الشراء، يدخل في **استبيان السمات** من [question_bank.json](demo/data/question_bank.json):

| الخطة | عدد الأسئلة | الزمن المتوقع |
|---|---|---|
| Basic | 30 | ~10 دقيقة |
| Advanced | 80 | ~25 دقيقة |
| Premium | 100 | ~30 دقيقة |

الأسئلة Likert 5 نقاط. يقدر يحفظ ويكمل لاحقاً.

**التفعيل:**
```javascript
const plan = user.purchase.trait_analysis_tier; // "basic"|"advanced"|"premium"
const questions = Scoring.getQuestionsForPlan(plan);
// بعد الانتهاء:
const result = Scoring.analyzeTraits(answers, faceMetrics, plan);
saveToBackend(user.id, "trait_analysis", result);
```

### مسار C: المستخدم اشترى الاثنين
- كل ما هو في A
- زائد: كل ما هو في B
- **زائد bonus:** الـ Matching algorithm يستخدم بيانات TA لتحسين الدقة. الـ matches تتعاد ترتيبها بناءً على 317 سمة فراسة إضافية

### 5.2 — Report
**Page id:** `report`

يعرض الـ trait_analysis_result:
- **رأس التقرير:** ملخص الـ profile الكلي
- **السمات بـ confidence ≥ medium:** ~80-170 سمة حسب الخطة
- **تنظيم:** أبرز 10 (high) في الأعلى، ثم باقي السمات مجمّعة بـ category
- **علامة 👁** للسمات اللي اعتمدت على الصورة + الأسئلة
- **سمات بـ low confidence:** مخفية افتراضياً، يقدر يظهرها

### 5.3 — Match Detail (مدفوع — كامل)
**Page id:** `match-detail`, `subscribed=true`

نفس الصفحة لكن دلوقتي تعرض:
- **المحاور الـ 8 كاملة** مع bars ملوّنة
- **أبرز السمات المشتركة** بين الاثنين (من Firasa)
- **التحذيرات** (red flags لو وُجدت)
- **نقاط الالتقاء والاختلاف** بشكل تفصيلي
- **توصيات للحوار:** "اسأل عن X لأنكما تختلفان فيه" (ميزة مستقبلية)

---

## مرحلة الـ Admin (إضافي)

ملف: [pages-admin.jsx](frasa/src/pages-admin.jsx)

للـ admins فقط — لإدارة المستخدمين والمحتوى:

| Page (id) | الدور |
|---|---|
| `admin-dashboard` | احصائيات عامة |
| `admin-users` | إدارة الحسابات |
| `admin-questions` | تحرير بنك الأسئلة (للأخصائيين) |
| `admin-weights` | معايرة أوزان المحاور |
| `admin-traits` | إدارة قاموس السمات الـ 600 |
| `admin-flags` | مراجعة الـ red flags |
| `admin-reports` | بلاغات المستخدمين |
| `admin-ml` | معايرة الـ thresholds من بيانات real users |
| `admin-stats` | معدلات الاستخدام، Conversion، LTV |
| `admin-plans`, `admin-subs`, `admin-revenue` | إدارة الاشتراكات والإيرادات |

---

## ربط الـ Engines بالصفحات

| Engine | المكان في الرحلة | الصفحات |
|---|---|---|
| **Face.js** (MediaPipe + 38 metric) | onboarding 2.3 | `face-capture`, `face-processing` |
| **Matching.js** (73Q + 8 dims) | onboarding 2.2 + matching 3.x | `q-question`, `matches`, `match-detail` |
| **Scoring.js** (951Q + 600 traits) | trait analysis 5.x | `paid-quiz`, `report`, `match-detail` (مدفوع) |

---

## النقاط الذكية في الرحلة (Conversion Funnel)

| النقطة | التكتيك |
|---|---|
| `face-traits` | يعرض **glimpse** من شخصيته (2-3 سمات) ويقول "هناك المزيد..." → يخلقه fed up |
| `match-detail` (مجاني) | يرى نسبة 87% لشخص يبدو مناسب — لكن لا يقدر يعرف **ليش** → فضول |
| `req-sent` | "وصلت لحد الطلب المجاني — اشترك للمزيد" → urgency |
| `report` (لو حاول يفتحه) | "هذي الميزة في خطة Basic+" → upgrade |
| `match-detail` (Premium) | يرى الـ red flags → يحس إن الاشتراك حماه من خيار غلط |

---

## ملاحظات إنتاجية

1. **الـ profile يتبني تدريجياً** — كل سؤال يُحفظ فور الإجابة. لو خرج من الـ app يكمل من نفس النقطة.
2. **حماية الصورة:** [face.js](demo/face.js) شغّال client-side، الصورة ما تطلعش لـ server بدون موافقة صريحة.
3. **الـ matching يحسب lazy:** لما المستخدم يفتح `matches` يحسب top 50 candidates من DB — مش كل العملية تحدث في كل request.
4. **الـ trait_analysis يحدّث:** كل ما المستخدم يجاوب أسئلة جديدة (مثلاً يترقّى من basic لـ advanced)، الـ engine يعيد الحساب مع البيانات الإضافية.
5. **Caching:** نتائج الـ analysis تُخزَّن في DB، ما تتحسبش كل مرة المستخدم يفتح صفحة.

---

## ملخص "وين كل engine يلعب دور"

```
صفحة                  →   Engine                  →   النتيجة
─────────────────────────────────────────────────────────────────
q-question (× 73)     →   Matching.buildProfile   →   profile vector
face-capture          →   Face.analyzeImage       →   38 metrics
matches               →   Matching.compareProfiles →   list of matches
match-detail (مجاني)  →   Matching.compareProfiles →   score + tag (limited view)
paid-quiz             →   (collect answers)        →   trait answers
report                →   Scoring.analyzeTraits   →   600 trait scores
match-detail (مدفوع)  →   Both engines             →   full breakdown
```
