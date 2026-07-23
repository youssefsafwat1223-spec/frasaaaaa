# 📘 تَوَافُق — Master Project Report

> **وثيقة مرجعية رسمية** — تغطّي المشروع 100٪ من منظور المنتج والتصميم والهندسة والذكاء الاصطناعي والأعمال.
> أُعِدّت بمحاكاة فريق Software House عالمي متكامل التخصصات.

**رقم النسخة:** 1.0 · **التاريخ:** 2026-06-07 · **حالة الوثيقة:** نهائية للموافقة

---

## 📑 الفهرس

1. الرؤية والرسالة
2. تحليل فكرة المنتج
3. تحليل السوق والمنافسين
4. النموذج التجاري والتسعير
5. Personas المستخدمين
6. User Journey كاملة
7. Information Architecture
8. UX Strategy
9. UI Strategy & Design System
10. خريطة الشاشات الكاملة
11. User Flows التفصيلية
12. أنواع المستخدمين والصلاحيات
13. الميزات (Features)
14. MVP Scope
15. Future Roadmap
16. System Architecture
17. Database Schema
18. API Structure
19. Authentication System
20. Subscription & Payment
21. Notification & Messaging
22. Matching Engine
23. Face Analysis Engine
24. AI Components
25. Privacy & Security
26. Admin Dashboard
27. Analytics & Monitoring
28. Hosting Infrastructure
29. Scalability Plan
30. Cost Estimates
31. Team Structure
32. Development Phases
33. Launch Strategy
34. Marketing Strategy
35. Risk Analysis
36. القرارات المعلّقة وأفضل الممارسات

---

# 1. الرؤية والرسالة

### الرؤية (Vision)
أن نصبح المنصة العربية الأولى الموثوقة في **التعارف بقصد الزواج** عبر دمج **علم الفِراسة الحديث** (قراءة الوجه ببنية هندسية) مع **التقييم النفسي السلوكي المحصّن**، لإنتاج توافق **علمي وأخلاقي** يقلّل الفشل الزوجي ويرفع جودة القرار.

### الرسالة (Mission)
نمنح كل باحث/ة عن شريك أداةً تجمع بين **ذكاء اصطناعي مسؤول** يقرأ ملامحه ومواقفه، وبين **خطوط حمراء واضحة** (دين، أطفال، عمر، صحة، تعدد)، فيظهر له فقط من يستحق فعلاً، دون استعراض قوائم لا نهائية ولا تلاعب بمشاعره.

### القيم المؤسسية (Core Values)
1. **الصدق العلمي:** الصورة تلميح احتمالي، لا حكم قاطع — نُعلن حدود الأداة بشفافية.
2. **خصوصية مطلقة:** الصور تُعالَج للقياس ثم تُحذف افتراضيًا (Edge processing أولًا).
3. **احترام القيم العربية:** الدين والعائلة في القلب، مع الحياد بين المذاهب.
4. **منع الإدمان والتلاعب:** لا Swipe لا نهائي، لا حيل سلوكية مخادعة.
5. **أخلاقيات المطابقة:** الكواشف الخطرة (تسلّط/عدوانية) تُكشف وتُحذَّر منها.

### KPIs المستهدفة على 18 شهر
| المؤشر | المستهدف |
|---|---|
| المستخدمون النشطون شهريًا (MAU) | 250,000 |
| معدّل تحويل مجاني→مدفوع | 6–9% |
| نسبة اكتمال الـ Onboarding | ≥ 75% |
| رضا المستخدم عن التوافق المعروض | NPS ≥ 45 |
| Crash-free sessions | ≥ 99.5% |
| متوسط وقت الاستجابة (P95) | ≤ 600ms |
| معدّل الشكاوى المتعلقة بالأمان/الخصوصية | < 0.05% |
| ROI من حملات النمو (Blended CAC:LTV) | 1:3.5 على الأقل |

---

# 2. تحليل فكرة المنتج

### المشكلة الجوهرية
تطبيقات التعارف الحالية (Tinder/Bumble/OkCupid، والعربية مثل Sila وWaado) **تُغرق** المستخدم بقوائم تعتمد على **الصورة والمسافة الجغرافية** فقط، أو تطرح **استبيانات مملة 100+ سؤال** سهلة التزييف. النتيجة:
- **معدلات تطابق وهمي مرتفعة** (تطابق على المظهر لا على القيم).
- **فشل زوجي بعد التواصل** (اكتشاف اختلاف ديني/قيمي بعد أسابيع).
- **انعدام الثقة** خاصة لدى الأسر العربية المحافظة.

### الحل المقترح
> **"وجه يقرأ، أسئلة تكشف، فلاتر تحمي، توافق يقرّر."**

ثلاث طبقات متكاملة:
1. **الفلاتر الصلبة (Hard Gates):** الديانة/الأطفال/العمر/التعدد/الصحة — لا تتفاوض.
2. **الفِراسة الهندسية:** قراءة ~32 قياس بنيوي (فك، حواجب، أنف، شفاه…) من 3 زوايا، تُعطي **تلميحًا** لـ ~16–18 صفة شخصية.
3. **مواقف ذكية محصّنة:** 28 موقفًا غير مباشر تكشف القيم والسلوك الفعلي (مقابل التقريرات الذاتية المباشرة).

### الفرضيات المركزية (Key Hypotheses)
| الفرضية | كيفية التحقق |
|---|---|
| المستخدم العربي يفضّل ضمان القيم على تنوع الاختيار | A/B test: واجهة 5 مرشحين عالي الجودة × 50 مرشح متوسط |
| الفِراسة المرسومة بصدق ترفع الثقة | NPS مقارن: مع شرح "تلميح احتمالي" × بدون |
| الكواشف الخطرة تخفض شكاوى ما بعد الزواج | متابعة 12 شهرًا للمتزوجين عبر التطبيق |
| السعر One-time للتقرير أعلى تحويلًا من الاشتراك | A/B price test |

### Differentiators (لماذا نفوز؟)
- **الوحيد** الذي يجمع Face Reading هندسي + مواقف نفسية محصّنة بالعربية.
- **3 خدمات منفصلة** بدل خطط متشابهة (Matching / Trait Analysis / جلسة بشرية).
- **Hadi Junaidi** كخبير معتمد ووجه للمشروع (Authority Brand).
- **شفافية أخلاقية** — نُعلن ما يمكن وما لا يمكن للصورة قراءته.

---

# 3. تحليل السوق والمنافسين

### حجم السوق المستهدف (TAM/SAM/SOM)
| مستوى | الوصف | الحجم التقديري |
|---|---|---|
| TAM | العالم العربي 18-45 سنة، أعزب/مطلق | ~120 مليون |
| SAM | يستخدم سمارت فون + منفتح على تطبيقات تعارف | ~28 مليون |
| SOM (سنة 1) | الخليج + مصر + الأردن + المغرب — شريحة محافظة-متعلمة | ~1.5 مليون |
| SOM واقعي (12 شهرًا) | تحويل 3–5% | 45–75 ألف مستخدم نشط |

### تحليل المنافسين

| المنافس | الجمهور | نموذج العمل | نقاط قوة | نقاط ضعف يمكن استغلالها |
|---|---|---|---|---|
| **Sila (الخليج)** | عرب محافظون | اشتراك + ولي أمر | علامة موثوقة، Verification | لا فِراسة، أسئلة قليلة، شات محدود |
| **Waado** | خليجي | اشتراك شهري | تركيز على الجدية | UX تقليدي، لا تحليل عميق |
| **NikahForever / Muzz** | مسلمون عالميًا | freemium | حجم مستخدمين | عام جداً، لا تخصيص عربي |
| **Bumble / Tinder** | شباب | freemium + boosts | UX ممتاز، AI | غير لائق ثقافيًا للجمهور المحافظ |
| **Hawaya (مصر)** | شباب مصري | freemium | علامة مرحة | غاب بعد إغلاقه فعليًا |
| **Mawada** | عربي عام | اشتراك | حضور قديم | UX قديم، سمعة مختلطة |

### ميزة تَوَافُق في المصفوفة (Positioning)
- **محور Y:** عمق التوافق (سطحي ↔ علمي)
- **محور X:** الالتزام الثقافي (منفتح ↔ محافظ)
- **موقعنا:** أعلى يمين — **علمي + محافظ-محترم**.

### تحليل SWOT
**Strengths:** فكرة فريدة، خبير معروف، تقنية متاحة (MediaPipe)، تحصين أكاديمي للأسئلة.
**Weaknesses:** نشاط جديد، يحتاج Critical Mass (طرفين)، تكلفة الفِراسة في إعتماد المستخدم.
**Opportunities:** السوق العربي المحافظ ينمو رقميًا 22% سنويًا، شُح المنافس الجاد.
**Threats:** منافس كبير يقلّد، مخاوف خصوصية، نزاع شرعي/فقهي حول الفِراسة.

---

# 4. النموذج التجاري والتسعير

### النموذج
**Freemium + 3 خدمات مدفوعة منفصلة** (لا اشتراكات متعددة الطبقات).

| الطبقة | المحتوى | السعر المقترح (USD) |
|---|---|---|
| **Free Tier (التيزر)** | تسجيل + الـ28 موقف + الوجه + لمحة + إشعار "ماتش بنسبة X%" بدون هوية | مجاني |
| **💞 Matching** | كشف هوية الماتش + شات + 5 طلبات/أسبوع | 14.99/شهر أو 99/سنة |
| **🧠 Full Trait Analysis** | كامل الـ120 موقف + تقرير مفصّل للـ60 صفة + PDF | 29.99 مرة واحدة |
| **🎙️ جلسة مع أ. هادي** | حجز 45 دقيقة فيديو + تقرير شخصي | 199 لكل جلسة |

### Revenue Streams
1. **Matching Subscriptions** (الأكبر — Recurring): مستهدف 60% من الإيراد.
2. **Trait Analysis** (One-time, High Margin): 25%.
3. **Hadi Sessions** (Premium, Limited Capacity): 10%.
4. **B2B Licensing** (مستقبلًا — مكاتب زواج، مستشاري أسري): 5%.

### Unit Economics المستهدفة
- **ARPU (Free→Paid):** ~$22 (مزيج الخدمات الثلاث).
- **CAC مستهدف:** ≤ $7 (organic + influencer-led).
- **LTV (24 شهر):** ~$78.
- **Payback Period:** ≤ 4 أشهر.
- **Gross Margin:** ≥ 78% بعد تكلفة Cloud + Payment fees.

### Monetization Levers الإضافية
- **Boost / Visibility** (متاح للمشتركين فقط — يُعرض في رأس قائمة المرشحين 24 ساعة).
- **Gift Service** (دفع تقرير لشخص آخر — قوي للأهل).
- **مجموعات استشارية مغلقة** بإدارة هادي (Cohort-based).

---

# 5. Personas المستخدمين

### Persona 1 — "نورة، 27، السعودية" (الجمهور الأساسي)
- **خلفية:** خريجة جامعية، تعمل في مجال مالي، عائلة متدينة معتدلة.
- **الهدف:** زوج جاد متوافق دينيًا وفكريًا، لا تريد جلسات تعارف عائلية عشوائية.
- **آلامها:** تطبيقات التعارف يُنظر لها بسلبية اجتماعيًا، الخوف من الفضيحة، تجارب سابقة فاشلة.
- **سلوكها الرقمي:** Instagram يومي، Snapchat، تشتري Online بثقة.
- **اعتراضها المتوقع:** "صورتي خصوصية" → نطمئنها بالـ Edge processing وحذف الصور.
- **تكلفة جذبها:** $5–8 عبر Instagram + ميكرو-إنفلونسرز نسائيات.

### Persona 2 — "خالد، 32، الإمارات"
- **خلفية:** مهندس، مطلّق منذ سنة، أب لطفل.
- **الهدف:** زواج ثانٍ مدروس، خوف من تكرار الفشل.
- **آلامه:** القلق من التطابق العاطفي السطحي، يريد دليلًا عقلانيًا.
- **القناة:** LinkedIn + Google Search → "تطبيق زواج علمي".
- **اعتراضه:** "هل الفِراسة علمية؟" → نقدّم له الـ Whitepaper والشرح الأخلاقي.
- **يقدّر:** خدمة جلسة هادي ($199) — هو شريحة Premium.

### Persona 3 — "أم محمد، 52، مصر" (وَلِيَّة الأمر)
- **خلفية:** والدة، تُساعد ابنتها/ابنها في البحث.
- **الهدف:** التحقّق من الطرف الآخر قبل اللقاء.
- **آلامها:** الخوف من الكذب، عدم الثقة في الأسئلة المباشرة.
- **القناة:** فيسبوك + WhatsApp.
- **القيمة لها:** ميزة "Gift Trait Analysis" — تشتري تقريرًا تشاركه مع ابنتها.

### Persona 4 — "محمد، 24، الأردن" (Power-skeptic)
- **خلفية:** طالب دراسات عليا، يقرأ علم نفس.
- **اعتراضه:** "الأسئلة سهل تزييفها" → نطمئنه بالـ Forced-choice والوجه كـ Anchor.
- **يقدّر:** الشفافية والمرونة الفكرية — Brand Ambassador محتمل.

### Persona 5 (سلبي) — "Casual user"
- يبحث عن دردشة عابرة. النظام يمنعه عبر: التحقق من الهوية، الفلاتر الصلبة، السعر.

### Persona Admin — "Operations Manager"
- يتابع الشكاوى والشاشات. يحتاج لوحة بحث سريعة، Audit logs، أدوات بَن مؤقت.

---

# 6. User Journey كاملة

### المراحل (5 Stages)

#### المرحلة 1 — Awareness
- **القناة:** إعلان Instagram يعرض هادي + جملة "ماتش مبني على وجهك وقيمك"
- **النية:** فضول علمي
- **الـ Touchpoint:** Landing Page بلغة عربية واضحة + شهادات + Hadi Reel

#### المرحلة 2 — Sign-up & Onboarding (Free)
1. **Splash + Welcome** (3 ثواني)
2. **Phone Sign-up + OTP** (60 ثانية)
3. **Profile in 4 categorized pages** (5–6 دقائق):
   - معلومات أساسية (اسم، نوع، عمر)
   - مكانك وخلفيتك (بلد، تعليم)
   - المظهر والعادات (بنية، تدخين)
   - القيم والبوابات (دين، أطفال، تعدد، صحة)
4. **Matching Questions (28 موقف)** (10–12 دقيقة)
5. **Face Capture Prep + 3 angles** (90 ثانية)
6. **Free Glimpse + Match Teaser** (نقطة الذروة العاطفية)

#### المرحلة 3 — Conversion (Free → Paid)
- **Trigger:** إشعار "🔔 ماتش 87% مستنّيك" + لمحة الشخصية الجذابة.
- **3 خيارات شراء:** Matching / Full Analysis / Hadi Session.
- **Resistance:** قلق سعر → نعرض "ضمان استرداد 7 أيام".

#### المرحلة 4 — Active Use (Matching subscriber)
- يومي: شيك على المرشحين الجدد، الرد على الرسائل.
- أسبوعي: 5 طلبات تعارف جديدة.
- شهري: مراجعة الإحصاءات (مستهدف retention 65% بعد 3 شهور).

#### المرحلة 5 — Outcome
- **النجاح:** تواصل → لقاء → خطبة → زواج (Goal Event نتتبعه عبر استبيان طوعي).
- **Off-boarding أخلاقي:** زر "وجدت شريكي" يوقف الاشتراك ويعرض هدية رمزية.

### Emotional Curve
```
الفرح ──▲   ╭── (Match Teaser!)
        │   │      ╲ ───── Steady (active use)
الحياد ─┼───╯       ╲
        │            ╲___ (شك/قلق)
الإحباط ▼              ───▲ (تجربة لقاء سيئة؟ → دعم)
```

---

# 7. Information Architecture

### الهيكل العام (Sitemap)
```
Tawafuq App
├── Public
│   ├── Landing
│   ├── About / Hadi
│   ├── Pricing
│   ├── FAQ
│   ├── Terms / Privacy
│   └── Blog (SEO)
├── Auth
│   ├── Sign-up
│   ├── Sign-in
│   ├── OTP
│   └── Forgot Password
├── Onboarding (Free Tier)
│   ├── Profile (4 categories)
│   ├── Matching Questions (28 situations)
│   ├── Face Prep
│   ├── Face Capture (3 angles)
│   ├── Free Glimpse
│   └── Match Teaser
├── Main App (post-paywall)
│   ├── Dashboard / Home
│   ├── Matches (list + filters)
│   ├── Match Detail
│   ├── Requests (sent/received)
│   ├── Chat List
│   ├── Chat Room
│   ├── Notifications
│   ├── Trait Report (paid)
│   ├── Hadi Session (booking + history)
│   └── Settings
│       ├── Profile Edit
│       ├── Privacy
│       ├── Subscription
│       └── Account Deletion
├── Support
│   ├── Help Center
│   ├── Contact
│   └── Report User
└── Admin (separate web app)
    ├── Dashboard
    ├── Users
    ├── Reports / Flags
    ├── Content (questions)
    ├── Hadi Sessions
    ├── Subscriptions
    ├── Analytics
    └── Logs
```

### Content Hierarchy Principles
- **3 clicks rule:** أي ميزة في 3 لمسات.
- **Persistent navigation:** Tab bar للموبايل (Home, Matches, Chat, Report, Profile).
- **Contextual back:** زر رجوع يحفظ الحالة (ما يفقد إجابات).

---

# 8. UX Strategy

### المبادئ السبعة (Design Principles)
1. **Honesty over Hype:** نُعلن حدود الذكاء الاصطناعي — يبني الثقة.
2. **Progressive Disclosure:** نعرض القليل أولًا (التسجيل المقسّم).
3. **Reduce, then Refine:** قلّل عدد الحقول، حسّن جودة الفهم.
4. **Anchored choices:** الأسئلة بمواقف، لا تجريد.
5. **Cultural respect:** خصوصية الجنسين، ألفاظ محترمة، RTL أول.
6. **Defensible pacing:** لا "Just one more swipe" — نمنع الإدمان.
7. **Recovery first:** كل error له fallback (الكاميرا فشلت → محاكاة + إعادة محاولة).

### Onboarding Strategy
- **Aha moment ≤ 8 دقائق** (Match Teaser).
- **Drop-off tolerance:** نقبل drop-off 25% في الـ Profile لتقليل أحجام لاحقة.
- **Save & Resume:** كل خطوة محفوظة سيرفر-سايد.
- **Conditional questions:** بعد اختيار المسلم → تظهر أسئلة الصلاة (مش للمسيحي).

### Error & Empty States
- كل state مرسومة: لا ماتش → "هنبلّغك"، لا انترنت → cached, لا كاميرا → simulation, خطأ دفع → retry واضح.

### Accessibility (WCAG 2.1 AA)
- تباين ≥ 4.5:1.
- Text scaling لـ 200% بدون كسر.
- VoiceOver/TalkBack labels.
- Focus indicators.

### Internationalization
- RTL-first.
- اللغة: العربية الفصحى المبسّطة في الـ UI، اللهجة في الأمثلة.
- توطين لاحق: إنجليزي (للمغتربين)، فرنسي (مغرب).

---

# 9. UI Strategy & Design System

### Brand Identity
- **الاسم:** تَوَافُق · شعار خط عربي حديث + رمز يدين تتقاربان كنقاط.
- **الشخصية:** ذكي، أخلاقي، دافئ، عصري.
- **الـ Tone of Voice:** محترم، علمي بلغة بسيطة، يستخدم "إنت/إنتي" مش "حضرتك" (قريب، مش متكلّف).

### Color Palette (Cinematic — مطبّق فعلًا)
| Token | Hex | الاستخدام |
|---|---|---|
| --peach | #FFEACE | خلفية دافئة |
| --pink | #FEDEFB | لمسات / تدرّجات |
| --gold | #FECA83 | أزرار رئيسية / تأكيد |
| --green | #2B4C41 | نص + لوجو + شاشة كاميرا |
| --white | #FFFEFF | كروت |
| --success | #2e7d4f | علامة 👁 من الصورة |
| --danger | #c2410c | علامة بوابة صلبة |

### Typography
- **Display:** Readex Pro 700 (عناوين).
- **Body:** Tajawal 400/500/700 (نصوص).
- **حجم الجسم الأساسي:** 16px / line-height 1.7.

### Spacing Scale (8pt grid)
4 · 8 · 12 · 16 · 22 · 28 · 40 · 56 px

### Component Library (مطبّق في `styles.css`)
- **Button:** primary (gold-pink gradient + glow), ghost (frosted glass).
- **Card / Glass panel:** rgba white + backdrop-filter blur.
- **Topbar:** icon button + progress bar + step label.
- **Trait row:** icon circle + name + 👁 marker + mini bar.
- **Service card:** icon block + meta + price chip.
- **Option (choice):** rounded, selected = gold border + glow.
- **Form field:** label + input/select rounded 16px.
- **Scanner:** oval frame + scanline + 3-step chips + HUD.
- **Teaser banner:** green gradient with big % number.
- **Locked / chip:** opacity 0.6 + 🔒 prefix.

### Motion / Micro-interactions
- Button tap: scale(0.97).
- Screen transition: 250ms ease-out.
- Capture oval: borders shift gold→green with glow on alignment.
- Score bar fill: 600ms ease-out from 0.

### Imagery & Iconography
- إيموجي وظيفية في الأيقونات (سرعة + خفّة).
- صور وجوه مرسومة (مش حقيقية) في الـ marketing لتقليل التهديد.

---

# 10. خريطة الشاشات الكاملة (Detailed Screens)

> **عدد الشاشات الإجمالي:** 47 (24 موبايل + 23 admin).
> ما تم تنفيذه في التجربة التجريبية: 7 شاشات Cinematic مباشرة (مشار لها بـ ✅).

### Section A — Public (5)
| # | الشاشة | المكونات الأساسية | الحالة |
|---|---|---|---|
| P01 | Landing | Hero, Hadi quote, How it works (3 steps), Pricing teaser, Testimonials, CTA | متبقّي |
| P02 | About / Hadi | Bio, certifications, sample reading | متبقّي |
| P03 | Pricing | 3 service cards + comparison + FAQ inline | متبقّي |
| P04 | FAQ | Accordion (16 سؤال) | متبقّي |
| P05 | Privacy / Terms | نص قانوني | متبقّي |

### Section B — Auth (5)
| # | الشاشة | المكونات |
|---|---|---|
| A01 | Sign-up (phone) | Phone field + country code picker + Terms checkbox + CTA |
| A02 | OTP | 6 boxes + resend timer + back |
| A03 | Sign-in | Phone + Password OR OTP |
| A04 | Forgot Password | Phone + send code |
| A05 | Reset Password | New password + confirm + strength meter |

### Section C — Onboarding (تجربة العميل ✅ بالفعل)
| # | الشاشة | المكونات |
|---|---|---|
| O01 | Welcome ✅ | Hero + 3 chips + CTA |
| O02 | Profile p1: Basic ✅ | name/gender/age/age range |
| O03 | Profile p2: Location ✅ | country/city/edu/marital/origin |
| O04 | Profile p3: Appearance ✅ | body/dress/smoking |
| O05 | Profile p4: Values & Gates ✅ | religion/kids/poly/health (gate marks) |
| O06 | Matching Questions ✅ | 28 situations, 4/page (7 pages) |
| O07 | Face Prep ✅ | 3 instructions + start button |
| O08 | Face Scanner ✅ | live video + oval + scanline + 3 step chips + HUD + quality gate |
| O09 | Face Processing | Spinner + "تحليل 478 نقطة" |
| O10 | Free Glimpse + Teaser ✅ | Face traits, locked traits, match % teaser, 3 services |

### Section D — Main App (10)
| # | الشاشة | المكونات |
|---|---|---|
| M01 | Home / Dashboard | Greeting + Active matches count + Daily tip from Hadi + Quick actions |
| M02 | Matches list | Filters bar + cards (photo blurred for non-paid, % compatibility, key trait chips) |
| M03 | Match detail | Photos + bio + 8-dimension compatibility breakdown + Request button |
| M04 | Requests received | Tabs (pending/accepted/declined) + cards with Accept/Decline |
| M05 | Requests sent | List with status |
| M06 | Chat list | Recent conversations + unread badges |
| M07 | Chat room | Bubbles + media + report button + safety tips banner |
| M08 | Notifications | Grouped (matches/messages/system) |
| M09 | Trait Report | Tabs: Strengths / Areas / Hidden / Hadi Notes + share PDF |
| M10 | Hadi Booking | Calendar + slot picker + notes + confirmation |

### Section E — Settings (5)
| # | الشاشة | المكونات |
|---|---|---|
| S01 | Settings main | Sections list (profile/privacy/notifs/subscription/help/legal/logout) |
| S02 | Profile edit | Photo, bio, preferences, retake face |
| S03 | Privacy | Who can see me, blocked users, data download, delete account |
| S04 | Subscription manage | Current plan, billing history, cancel |
| S05 | Notifications prefs | Toggles per category + Quiet hours |

### Section F — Errors / Misc (4)
| # | الشاشة | المكونات |
|---|---|---|
| E01 | Offline | Cached content + "اتصل بالإنترنت" |
| E02 | Server error 500 | شعار + إعادة محاولة |
| E03 | Session expired | إعادة تسجيل |
| E04 | Account suspended | شرح السبب + تواصل دعم |

### Section G — Admin Web (23)
| # | الشاشة | المكونات |
|---|---|---|
| AD01 | Login (admin) | Email + 2FA |
| AD02 | Dashboard | KPI cards (DAU, signups, revenue, complaints) + charts |
| AD03 | Users list | Search/filter/export, status column |
| AD04 | User detail | Profile, devices, sessions, actions (suspend, verify, refund) |
| AD05 | Flags/Reports queue | Priority, reporter, target, action |
| AD06 | Verifications | Identity docs review |
| AD07 | Questions content | CRUD on situations, preview, A/B test setup |
| AD08 | Traits CMS | 60 traits + face mapping |
| AD09 | Weights tuner | Sliders for matching weights + sim test |
| AD10 | Sessions calendar (Hadi) | Bookings + reschedule |
| AD11 | Subscriptions | List, churn, MRR |
| AD12 | Refunds | Pending requests + approve |
| AD13 | Payments log | Transactions + Stripe IDs |
| AD14 | Notifications composer | Segment + draft + send |
| AD15 | Push templates | i18n texts |
| AD16 | Analytics | Funnels (signup→pay) + cohorts |
| AD17 | Experiments (A/B) | Active tests + results |
| AD18 | Content moderation | Auto-flagged chats |
| AD19 | Hadi insights | Aggregated face stats |
| AD20 | Audit log | Admin actions trail |
| AD21 | Roles & permissions | RBAC management |
| AD22 | Settings (app config) | Feature flags |
| AD23 | Help / Docs | Internal SOPs |

---

# 11. User Flows التفصيلية

### Flow 1 — Onboarding to First Teaser (Critical Path)
```
Splash → Welcome → Phone → OTP → Profile(4 pages, save-resume)
   ↓
Matching Questions(7 pages × 4 q) — adaptive religion gating
   ↓
Face Prep → Camera Permission
   ├─ Granted → Scanner (3 angles auto) → Processing → Glimpse
   └─ Denied → Skip with simulated metrics → Glimpse (marked "تجريبي")
   ↓
Teaser ≥ 55% match?
   ├─ Yes → "🔔 لقينا ليك توافق" + Services CTA
   └─ No → "هنبلّغك أول ما يظهر" + Browse free-tier list (blurred)
```

### Flow 2 — Subscribe to Matching
```
Teaser → "اشترك Matching" → Plan selection (monthly/yearly) →
Apple/STC/MasterCard → 3DS challenge → Success → Onboarding video →
Matches list (unlocked) → First conversation tutorial
```

### Flow 3 — Send/Accept Request
```
Browse Matches → Open Match Detail → Read traits → "إرسال طلب" →
Optional intro note (≤120 char) → Confirm →
Receiver gets notification → Opens Request →
Accept → Chat room opens
Decline → Sender notified discreetly ("الطرف لم يكن متاحًا")
```

### Flow 4 — Book Hadi Session
```
Services → "جلسة مع أ. هادي" → Read about → Pick date → Slot →
Add notes → Pay $199 → Calendar invite + WhatsApp confirmation →
Day-of: Join via Zoom link → Post-session report emailed
```

### Flow 5 — Report Bad Actor (Safety)
```
Chat → Long-press message OR profile menu → "إبلاغ" →
Select reason (5 categories) → Optional screenshot →
Submit → Auto-mute that user for reporter →
Admin queue (SLA 4 hours) → Action taken → Reporter notified
```

### Flow 6 — Account Deletion (GDPR-style)
```
Settings → Privacy → "حذف الحساب" → Reason (optional) →
Confirm (type "حذف") → 30-day grace period (recoverable) →
Permanent purge of: profile, photos, chats, face metrics
Retain (anonymized): aggregated stats, payment records (legal)
```

---

# 12. أنواع المستخدمين والصلاحيات (RBAC)

| الدور | الصلاحيات | الإنشاء |
|---|---|---|
| **Guest** | يتصفّح Landing/FAQ/Pricing فقط | تلقائي |
| **Free User** | Onboarding كامل + Glimpse + Teaser + يستقبل الطلبات (لا يبعت) | تلقائي بعد التسجيل |
| **Matching Subscriber** | + كشف الهوية + 5 طلبات/أسبوع + Chat unlimited | بعد الدفع |
| **Trait-Analysis Buyer** | + Full report (60 صفة) + PDF + Compare with self over time | شراء مرة واحدة |
| **Hadi Client** | + جلسة فيديو + Personal report | شراء حسب الجلسة |
| **Verified User** | كل ما سبق + شارة موثّق + أولوية في القوائم | بعد التحقق من الهوية |
| **Suspended** | قراءة فقط + إشعار تعليق | إجراء أدمن |
| **Banned** | لا وصول | نهائي |
| **Admin (L1) Support** | عرض المستخدمين + التعامل مع الشكاوى + إغلاق تذاكر | تعيين |
| **Admin (L2) Moderator** | L1 + بَن/تعليق + الموافقة على الموثّقين + استرداد جزئي | تعيين |
| **Admin (L3) Manager** | L2 + تعديل المحتوى (أسئلة) + تشغيل A/B + سياسة | تعيين |
| **Admin (L4) Super-admin** | الكل + إدارة الأدوار + audit logs + feature flags | فريق التأسيس فقط |
| **Hadi** | عرض جلساته + كتابة تقارير + Aggregated insights | حساب خاص |

### Permission Matrix (مختصرة)
| الفعل | Free | Subscriber | L1 | L2 | L3 | L4 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| إرسال طلب | ❌ | ✅ | — | — | — | — |
| كشف هوية ماتش | ❌ | ✅ | ✅R | ✅R | ✅R | ✅ |
| بَن مستخدم | — | — | ❌ | ✅ | ✅ | ✅ |
| تعديل سؤال | — | — | ❌ | ❌ | ✅ | ✅ |
| feature flag | — | — | ❌ | ❌ | ❌ | ✅ |

(R = Read-only with audit)

---

# 13. الميزات (Features) — حالية ومستقبلية

### Core Features (MVP — Phase 1)
1. تسجيل بهاتف + OTP.
2. Profile categorized (4 pages, 18 fields).
3. Matching questions (28 scenarios) — gated by gender/religion.
4. **Multi-angle face capture** (3 angles, MediaPipe).
5. **Quality gate** (lighting + sharpness + face fill).
6. **Adaptive personality questions** (Phase 1.5 optional).
7. Trait inference engine (60 traits, 16 face-derived).
8. **Two-stage matching** (hard gates + weighted score).
9. Free Glimpse + Match Teaser.
10. 3 paid services.
11. Real-time chat (text + image + voice note).
12. Report user + safety center.
13. Notifications (push + email).
14. Settings.
15. Admin dashboard (L1-L4).

### Phase 2 Features (شهر 4-7)
16. **Verification badge** (selfie liveness + ID match).
17. **Guardian/Wali optional access** (read-only invite link).
18. **Voice notes** in chat with auto-transcription.
19. **Video intro** (15-second short, optional).
20. **Saved candidates** / Wishlist.
21. **Boost** (one-time visibility burst).
22. **Trait evolution** (re-test after 6 months).
23. **Marriage outcome tracking** (opt-in success stories).
24. **Wallet** (refund credits + Hadi session prepay).
25. **Multi-language** (English UI).

### Phase 3 Features (شهر 8-12)
26. **B2B portal** (مكاتب زواج).
27. **Group counseling cohorts** (paid, Hadi-led).
28. **Compatibility forecast** (يفترض زواج، نتنبأ بأبرز نقاط الاحتكاك).
29. **Family tree integration** (للجمهور الخليجي).
30. **AI-coached chat suggestions** (icebreakers مبنية على ملف الطرفين).

### Phase 4 (سنة 2+) — Vision
31. AR mirror (try-on conversations).
32. Web3 verification (decentralized identity, optional).
33. Native iOS/Android (الـ MVP هيكون PWA).
34. Marriage planning suite (post-engagement tools).
35. Localized expansions (الفرنسي للمغرب، التركي).

---

# 14. MVP Scope (لانش 12 أسبوع)

### IN scope
- Auth (phone + OTP).
- Profile 4 categories.
- Matching 28 questions.
- Face capture (3 angles) + quality gate.
- Trait inference (16 face-derived + 44 question-derived if user buys Full).
- 2-stage matching engine.
- Free Glimpse + Teaser.
- Matching subscription (Stripe + STC Pay + Apple Pay).
- Trait Analysis (one-time).
- Hadi Session (Calendly integration + Zoom).
- Chat (text + image).
- Push (FCM/APNs).
- Admin minimal (users, flags, refunds).
- PWA (responsive, installable).

### OUT of scope (مؤجَّل)
- Native apps.
- Voice/video chat.
- Verification badge (Phase 2).
- Wali access.
- Boost / Wishlist.
- Multi-language (Arabic only).
- B2B portal.
- Marriage outcome tracking.

### Success criteria (Launch Gate)
- p95 latency ≤ 600ms.
- Crash-free ≥ 99%.
- Onboarding completion ≥ 60%.
- Payment success rate ≥ 90%.
- Zero critical security findings.

---

# 15. Future Roadmap

### Q1 (شهر 1-3) — **MVP Launch**
Auth, profile, questions, face, matching, payments, chat, basic admin.

### Q2 (شهر 4-6) — **Trust & Safety**
Verification, Wali, advanced moderation (auto-flag), App Store native (iOS).

### Q3 (شهر 7-9) — **Engagement**
Boost, wishlist, voice notes, trait evolution, Android native.

### Q4 (شهر 10-12) — **Growth & B2B**
Group cohorts, B2B portal, multi-language (EN), referral program.

### Year 2
AR experiences, AI-coached chat, marriage planning suite, expansion.

---

# 16. System Architecture

### High-level (نصي)
```
┌─────────────────────────────────────────────────────────────────┐
│                       Client (PWA + native)                      │
│  React (Vite) + Tailwind + MediaPipe (in-browser face analysis)  │
└──────────────┬───────────────────────────────┬──────────────────┘
               │ HTTPS/WSS                     │ Edge ML (face)
               ▼                               ▼ (no upload of raw)
┌──────────────────────────┐         ┌────────────────────────────┐
│  API Gateway (Kong/NGINX) │◄────────│   CDN (Cloudflare)         │
│  Rate limit, JWT verify   │         │   Static + cached responses │
└──────┬────────────────────┘         └────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Application Services (Node/TS)                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│ │ Auth Svc │ │ User Svc │ │ Match Svc│ │ Chat Svc │ │ Pay Svc │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │ Notif Svc│ │ Admin API│ │ Trait Svc│ │ Hadi Svc │              │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└────────┬─────────────────┬────────────────┬─────────────────────┘
         │                 │                │
         ▼                 ▼                ▼
┌─────────────┐    ┌────────────────┐  ┌────────────────┐
│ PostgreSQL  │    │  Redis (cache, │  │  Object Store  │
│ (primary)   │    │  rate-limit)   │  │  (S3-compat)   │
└─────────────┘    └────────────────┘  └────────────────┘
         │                 │                │
         ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────┐
│        Async Queue (RabbitMQ/SQS) — emails, push,        │
│        report PDFs, video transcoding                    │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│        Observability (Datadog / Sentry / Grafana)        │
└─────────────────────────────────────────────────────────┘
```

### Service Boundaries (Microservices Lite)
- **Auth**: signup/login/OTP/session/JWT.
- **User**: profile CRUD, verification, settings.
- **Match**: matching engine + filters + recommendations.
- **Trait**: face metrics ingestion + scoring + reports.
- **Chat**: WebSocket + history persistence.
- **Pay**: Stripe/STC/Apple integration + webhooks.
- **Notif**: push (FCM/APNs) + email (SES) + WhatsApp via Twilio.
- **Hadi**: bookings + Zoom + post-session reports.
- **Admin API**: RBAC-protected operations.

### Tech Stack Choice
| Layer | Tech | Why |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind | Fast, ecosystem, PWA |
| Mobile (post-MVP) | React Native | Reuse code |
| Backend | Node.js 20 + Fastify + TypeScript | High throughput, types |
| Realtime | Socket.IO على Node | mature, fallback |
| DB | PostgreSQL 16 + pgvector | structured + vector search |
| Cache | Redis 7 | sessions, rate limit |
| Queue | RabbitMQ (or SQS in AWS) | reliable async |
| Object | S3 / Cloudflare R2 | cheap, CDN-edge |
| Face ML | MediaPipe in-browser | privacy + zero server cost |
| Search | Postgres FTS first, ElasticSearch إذا تعدّى 1M | YAGNI |
| CI/CD | GitHub Actions + Docker | standard |
| IaC | Terraform | reproducible |
| Cloud | AWS (eu-west-1 or me-south-1) | regional latency for Gulf |
| CDN | Cloudflare | DDoS + edge |
| Monitoring | Datadog + Sentry | full-stack |

---

# 17. Database Schema (PostgreSQL — مختصرة)

### Core Tables

#### `users`
```sql
id UUID PK, phone VARCHAR UNIQUE, email VARCHAR, password_hash, 
status ENUM('active','suspended','banned','deleted'), verified BOOLEAN,
created_at, last_login_at, locale, country
```

#### `profiles`
```sql
user_id UUID PK FK, display_name, gender, birth_date,
age_pref_min, age_pref_max, city, country, relocate BOOLEAN,
education, marital_status, open_to_nat, origin, body_type, dress_style,
smoking, religion, sect, kids_stance, polygamy, health_status,
bio TEXT, updated_at
```

#### `face_metrics`
```sql
user_id UUID PK, captured_at, quality_score NUMERIC,
metrics_jsonb JSONB,        -- 32 frontal metric values
profile_metrics JSONB,       -- 5 sagittal
pixel_metrics JSONB,         -- eye color, hair, sclera
face_vector vector(64),      -- for cosine similarity (pgvector)
is_active BOOLEAN
```
(Raw images NOT stored; only metrics.)

#### `match_answers` / `personality_answers`
```sql
user_id UUID, trait_id SMALLINT, sit_index SMALLINT,
choice SMALLINT, answered_at, PK(user_id, trait_id, sit_index)
```

#### `trait_scores`
```sql
user_id, trait_id, score NUMERIC, confidence NUMERIC,
source ENUM('face','question','both'), computed_at
```

#### `matches` (precomputed shortlist)
```sql
user_a UUID, user_b UUID, score NUMERIC, breakdown JSONB,
blocked BOOLEAN, blockers TEXT[], computed_at,
INDEX (user_a, score DESC) WHERE blocked=false
```

#### `requests`
```sql
id UUID, from_user, to_user, status ENUM, note VARCHAR(120),
created_at, responded_at
```

#### `conversations`, `messages`
```sql
conversations: id UUID, participants UUID[], last_msg_at
messages: id, conv_id, sender_id, type, body (encrypted),
media_url, created_at, read_at
```

#### `subscriptions`, `purchases`, `hadi_bookings`
```sql
subscriptions: id, user_id, plan, status, provider, provider_ref,
period_start, period_end, auto_renew
purchases: id, user_id, product, amount, currency, status
hadi_bookings: id, user_id, slot_at, duration_min, zoom_url,
notes_pre, notes_post, status
```

#### `reports`, `notifications`, `audit_log`, `feature_flags`, `experiments`
(تفصيل تفعيلي يُكتب في Phase 0.)

### Vector Search Note
`pgvector` على `face_vector` (64-dim) لاسترجاع المرشحين المقاربين بصريًا بسرعة.

---

# 18. API Structure (REST + WebSocket)

### Conventions
- Base: `/api/v1`
- Auth: `Bearer <JWT>` في Header
- Errors: `{ error: { code, message, details? } }`
- Pagination: cursor-based
- Rate limit: 100 req/min/user, 10 req/min for auth
- Idempotency-Key header للـ POST الحسّاسة

### Endpoints (selected)

#### Auth
```
POST /auth/signup, /auth/otp/request, /auth/otp/verify
POST /auth/login, /auth/refresh, /auth/logout
POST /auth/password/forgot, /auth/password/reset
```

#### Profile / Onboarding
```
GET /me, PATCH /me/profile
POST /me/profile/page    { page, data }
POST /me/match-answers   { trait_id, sit_index, choice }
POST /me/personality-answers
DELETE /me                (30d grace)
```

#### Face
```
POST /me/face/metrics   { metrics, profile, pixel, vector }
GET  /me/face/trait-scores
```

#### Matching / Requests
```
GET  /matches?cursor=&limit=20
GET  /matches/:id
POST /matches/:id/request   { note }
POST /requests/:id/respond  { accept }
GET  /requests?type=sent|received
```

#### Chat
```
GET  /conversations
GET  /conversations/:id/messages?cursor=
POST /conversations/:id/messages
WS   /ws  events: msg:new, msg:send, typing, read, presence,
                  match:new, request:new
```

#### Payments
```
POST /pay/subscription/checkout
POST /pay/onetime/checkout
POST /webhooks/{stripe|stc|apple}
GET  /me/subscription
POST /me/subscription/cancel
```

#### Hadi / Safety / Notifications
```
GET  /hadi/slots, POST /hadi/book, GET /me/bookings
POST /reports, POST /me/block, DELETE /me/block/:id
GET  /me/notifications, POST /me/notifications/read
POST /me/devices, DELETE /me/devices/:id
```

#### Admin (`/admin/v1`)
```
GET /admin/users, /admin/users/:id
POST /admin/users/:id/{suspend|verify}
GET /admin/reports, POST /admin/reports/:id/action
GET /admin/subscriptions, POST /admin/refunds
GET /admin/analytics/funnel
PATCH /admin/feature-flags/:key
```

---

# 19. Authentication System

### Method
- **Phone + OTP** (primary). Password optional. 2FA للأدمن (TOTP).

### Token Strategy
- **Access JWT** HS256, 15 دقيقة.
- **Refresh token** opaque, 30 يوم، rotation on use، stored hashed.
- **Device fingerprint** مع كل refresh.
- إلغاء فوري عبر Redis blacklist.

### Sessions
- 3 أجهزة (free) / 5 (paid). Sign-out-other-devices متاح.

### OTP
- Twilio (الخليج) / Vonage (مصر) / MessageBird (احتياط).
- 6 digits, expiry 5 min, 5 attempts max.
- Anti-brute: incremental cooldown (5s, 15s, 60s، lock 1h).

### Password Policy
- ≥ 8 chars, ≥ 1 رقم, ≥ 1 حرف. Argon2id. Have I Been Pwned check.

### Account Recovery
- Phone reset → OTP. Email reset. Recovery codes (3, generated post-signup).

---

# 20. Subscription & Payment

### Providers
| Provider | Coverage |
|---|---|
| Stripe | كل البطاقات الدولية |
| Apple Pay / Google Pay | إجباري Mobile |
| STC Pay / mada | السعودية |
| Fawry | مصر |
| Tap Payments | الخليج |

### Lifecycle
Active → cancel-at-period-end → Expired
Active → payment fail → Past-due (3 retries) → Canceled
Active → refund → Refunded

### Webhooks (idempotent + signed)
Verify signature → dedup by event_id → update DB → push.

### Tax (VAT)
15% KSA, 14% EG, 5% UAE. Inclusive. Stripe Tax.

### Refund Policy
- Matching: 7 أيام، أول دورة فقط، استرداد جزئي.
- Trait Analysis: قبل بدء الأسئلة فقط.
- Hadi Session: قبل 24 ساعة من الموعد.

### Anti-abuse
Card velocity (5 cards/yr max), country mismatch flag, manual review > $50.

---

# 21. Notification & Messaging

### Channels
| Channel | Use | Provider |
|---|---|---|
| Push | فوري | FCM + APNs |
| Email | معاملات | SES |
| WhatsApp | تأكيد هادي | Twilio |
| In-app | مركزي | own |
| SMS | OTP فقط | Twilio/Vonage |

### Push Categories
ماتش جديد · طلب جديد · رسالة جديدة · تذكير هادي · تقريرك جاهز · تنبيه أمان.

### Quiet Hours
الافتراضي 22:00–08:00 توقيت المستخدم. الـ critical يتجاوز.

### Templates
محفوظة في DB مع i18n keys — يحرّرها Admin بدون deploy.

### Chat Architecture
- WebSocket (Socket.IO) + fallback long-polling.
- Encryption at rest (AES-GCM column-level).
- Optional E2EE في Phase 2 (Signal Protocol).
- Auto-moderation: profanity + NSFW image classifier.

### Messages Lifecycle
- Sent → Delivered (WS ack) → Read.
- Retention: غير محدود للمشتركين، 10 رسائل للـ free.
- Right to be forgotten: حذف الحساب يحذف الصادر فقط.

---

# 22. Matching Engine

### Two-stage Model (مطبّق في الديمو)

#### Stage 1 — Hard Filters (Gates)
1. Religion family mismatch (or sect for Christians).
2. Kids: `yes_def` × `no` → block.
3. Age: خارج المدى.
4. Polygamy: male seeking × female rejecting.
5. Health: condition × explicit refusal.
6. Missing critical data → احترازي.

#### Stage 2 — Weighted Soft Score
| Bucket | Weight |
|---|:---:|
| Values & religion | 33% |
| Attachment & communication | 24% |
| Personality (60 traits) | 20% |
| Intimacy & rhythm | 12% |
| Logistics | 5% |
| Face harmony | 6% |
| Danger penalty (dark triad) | up to −20 |

### Recommendation Algorithm
```
candidates = SELECT * WHERE gender=opposite AND status=active
                          AND NOT in_block_list
filtered = run_hard_gates(me, candidates)
scored = run_weighted_score(me, filtered)
ranked = scored.sort_desc().limit(50)
diversified = enforce_diversity(max_same_city=10)
```

### Refresh
- Precompute top-200 nightly.
- Recompute on-demand بعد تعديل profile.
- Realtime update عند تسجيل توافق جديد قريب.

### Cold Start
- Scoring even with partial side (penalty).
- Show top global matches في أول 24h لـ seed engagement.

### Bias Audit
- ربعي: توزيع التوصيات across age/city.
- Disparate impact ratio target: > 0.8.

---

# 23. Face Analysis Engine

### Pipeline (Client-side)
```
getUserMedia() → MediaPipe FaceLandmarker (VIDEO, 478 points)
→ poseFromLandmarks() → yaw/pitch/roll
→ frameQuality() → brightness, sharpness, balance, faceFill
→ [angle + quality OK 600ms] → snapshot
→ Repeat for front, left (~+50°), right (~-50°)
→ analyzeMultiAngle({front, left, right})
   ├─ Frontal metrics (32 ratios)
   ├─ Profile metrics (5 sagittal)
   └─ Pixel metrics (eye color, sclera, hair)
→ faceVector = embed(metrics) → 64-dim
→ POST /me/face/metrics  (NO images uploaded)
```

### Server-side
- يخزّن metrics + vector في `face_metrics`.
- يحسب `trait_scores` بربط القياسات بـ trait_feature_map.
- يستخدم vector في similarity للماتش.

### Privacy by Design
- الصور لا تُرفع أصلاً. المتر يكفي.
- لو احتجنا التحقّق البصري لاحقًا: صورة واحدة مشفّرة، تُحذف ≤ 24h.

### Calibration
- POP_MEAN/STD: نحدّثهم شهريًا من العينة الفعلية (anonymized).
- INFER_STRENGTH = 0.5 (الوجه تلميح).
- Evidence threshold = 2.0 لاعتبار صفة "محسومة من الوجه".

### Limitations المُعلنة
- لا يقرأ: الأذن، عمق العين الحقيقي، اللون بدقة.
- يقرأ بثقة: نسب الفك/الفم/الجبهة/الحواجب/الأنف الجانبي/الذقن.

### Accessibility
- لو رفض الكاميرا: نستمر بأسئلة فقط (مع إشارة لعدم تأكيد بصري).

---

# 24. AI Components

### Models Used
| Component | Model | Run location |
|---|---|---|
| Face landmarks | MediaPipe FaceLandmarker | Client (WASM) |
| Image segmentation (hair) | MediaPipe SelfieMulticlass | Client |
| NSFW filter (chat images) | NSFW.js أو AWS Rekognition | Server |
| Profanity (text) | OpenAI Moderation أو local list | Server |
| Recommendation re-ranker | LightGBM (لاحقًا) | Server batch |
| Icebreaker suggestions | LLM (GPT-4o-mini) prompt | Server on-demand |
| PDF report generation | Headless Chrome + template | Worker |

### Why no big LLM in core matching?
- التوافق محتاج Explainability — قواعد + أوزان أفضل من Black-box.
- LLM فقط للـ explanations الجاهزة: "ليه نسبة 87% — الاتنين عاليين في القيم العائلية…"

### MLOps
- Re-train re-ranker شهريًا على matches الناجحة.
- Feature store: Postgres views. Experiment tracking: MLflow.

### Data Strategy
- All learning data anonymized + aggregated.
- No model trained directly on face images.
- User can opt-out of "improve our models" toggle.

---

# 25. Privacy & Security

### Data Classification
| Class | أمثلة | الحماية |
|---|---|---|
| Public | الاسم الأول، المدينة | بدون |
| Private | phone، DOB | TLS + access control |
| Sensitive | الدين، الصحة | encrypted at rest |
| Highly sensitive | face metrics, chats | column-level AES-GCM |

### Encryption
- In transit: TLS 1.3 everywhere.
- At rest: Postgres encryption + S3 SSE-KMS.
- Field-level: chats, phone, health using `pgcrypto`.

### GDPR / KSA PDPL Compliance
- Right to access (data export JSON).
- Right to erasure (30d grace + permanent purge).
- Consent log (audit_log).
- DPO appointed.
- Data residency: KSA + EU regions.

### Authentication Security
- Rate limit signup/login (5/15min per IP).
- ReCAPTCHA v3 on signup.
- Suspicious login detection (impossible travel).

### Application Security
- OWASP Top-10 checklist.
- Dependency scanning (Snyk), SAST (SonarQube), DAST (OWASP ZAP) في CI weekly.
- Pen test سنوي.
- Bug bounty في Phase 2.

### Operational Security
- Secrets في AWS Secrets Manager.
- IAM least privilege.
- VPC private subnets للـ DB.
- WAF (Cloudflare) + DDoS protection.

### Incident Response
- On-call rota (PagerDuty).
- Severity matrix P0–P4 + SLAs (P0: 15 min).
- Postmortem mandatory للـ P0/P1.
- Customer notification within 72h عن أي data breach (GDPR).

### Trust & Safety
- Reverse image search للبروفايلات (catfish — Phase 2).
- Manual ID verification (Phase 2).
- ML scam pattern detection (phones/links في الشات).

---

# 26. Admin Dashboard

### Stack
React + Tailwind + React Query + RHF + Recharts. SSO via Cognito/Auth0.

### Modules
فُصّلت في القسم 10 (AD01..AD23).

### Key Workflows
1. Reports queue: priority + age. Inline actions.
2. User detail: kitchen sink — sessions, payments, matches, chats preview, audit.
3. Bulk: export CSV, send notification to segment.
4. Feature flags: rollout incremental بدون deploy.

### Audit & Compliance
- كل action → audit_log مع admin id.
- Read-only mode للـ L1.
- Quarterly access review.

---

# 27. Analytics & Monitoring

### Product Analytics
- Tool: PostHog (self-hosted) أو Mixpanel.
- Events: signup_started/completed, profile_page_completed, match_question_answered,
  face_capture_started/completed/failed, teaser_shown, service_clicked,
  payment_started/succeeded/failed, match_request_sent/responded,
  chat_first_message, report_filed.
- Funnels: Sign-up → Teaser → Paid.
- Cohorts: weekly retention.

### App Monitoring
- Sentry: errors + performance.
- Datadog: APM + infra + logs.
- Grafana: dashboards مخصصة.
- PagerDuty: alerts on SLO violations.

### SLOs
| SLI | SLO |
|---|---|
| API availability | 99.9% |
| p95 latency | ≤ 600ms |
| Push delivery | ≥ 95% |
| Payment success | ≥ 90% |
| Crash-free sessions | ≥ 99.5% |

### Business Dashboard
DAU/WAU/MAU · Sign-ups/day · Onboarding completion · Free→Paid conversion (per service) · MRR/ARR · Churn · ARPU · Revenue/country · Hadi utilization.

---

# 28. Hosting Infrastructure

### Cloud
- Primary: AWS me-south-1 (Bahrain).
- Secondary: AWS eu-west-1 (Ireland) for DR.

### Services
ECS Fargate (API) · RDS Postgres Multi-AZ · ElastiCache Redis · S3 ·
CloudFront/Cloudflare · SQS + Lambda · SES · Secrets Manager · CloudWatch · WAF + Shield · Route 53.

### Network
VPC 3-AZ · Private subnets للـ DB + workers · Public للـ ALB · NAT للـ egress.

### Backup
- RDS automated snapshots (35 يوم).
- Manual snapshot قبل migrations.
- S3 versioning + lifecycle (90 يوم → Glacier).
- Cross-region replication للـ critical.

### DR
- RTO: 4 hours. RPO: 5 minutes.
- DR drill كل 6 شهور.

### Environments
Dev / Staging (UAT) / Production / Sandbox (شركاء).

### CI/CD
GitHub Actions → build → test → deploy. Blue/green للـ API. Canary 5%→25%→100% للـ migrations. Feature flags بدل long-lived branches.

---

# 29. Scalability Plan

### Capacity Targets
| Phase | Users | Reqs/s | DB |
|---|---|---|---|
| MVP (شهر 3) | 50K | 100 | 50 GB |
| شهر 6 | 250K | 500 | 250 GB |
| سنة 1 | 1M | 2000 | 1 TB |
| سنة 2 | 5M | 10K | 5 TB |

### Bottlenecks وحلولها
1. Match recomputation → partition users + parallel workers.
2. WebSocket connections → ALB sticky + Redis pub/sub.
3. Image processing → SQS + Lambda concurrent.
4. DB writes → read replicas + logical partitioning للجداول الكبيرة.
5. Search → switch to ElasticSearch عند > 1M.
6. Vector search → upgrade pgvector → Pinecone عند > 10M.

### Sharding Strategy (سنة 2+)
Shard by `user_id` hash. 16 shards initial.

### Cost Controls
Reserved instances للـ DB · Savings Plans للـ Fargate · Spot للـ workers · S3 Intelligent-Tiering.

---

# 30. Cost Estimates

### Initial Build (MVP — 12 أسبوع)
| البند | تقدير USD |
|---|---:|
| فريق تطوير | 95,000 |
| تصميم UI/UX | 18,000 |
| استشارة قانونية + ToS/Privacy | 6,000 |
| Pen test أولي | 5,000 |
| Branding + assets | 8,000 |
| Cloud + tools (3 شهور) | 4,500 |
| Marketing (soft launch) | 12,000 |
| Buffer 15% | 22,000 |
| **الإجمالي** | **~170,500** |

### Monthly Operating Cost (50K users)
| البند | USD/شهر |
|---|---:|
| AWS infrastructure | 2,800 |
| Cloudflare + WAF | 200 |
| Datadog + Sentry | 600 |
| SES + Twilio (SMS) | 900 |
| Domain + misc | 100 |
| Hadi platform share | 15% من جلساته |
| **الإجمالي ثابت** | **~4,600** |

### الإيراد المستهدف (نهاية شهر 12)
- 30K Free + 5K Matching ($14.99) + 1K Trait + 100 Hadi
- شهري: ~$77,000
- **Margin بعد التشغيل و Stripe:** ~$60,000/شهر.

### Break-even
متوقّع شهر 9-12 لو CAC ≤ $7 ومعدل التحويل 5%.

---

# 31. Team Structure

### Core Team (MVP)
| الدور | عدد | USD/شهر |
|---|:---:|---:|
| Product Manager | 1 | 5,500 |
| Tech Lead / Architect | 1 | 7,000 |
| Senior Backend (Node/TS) | 2 | 5,500 × 2 |
| Frontend (React PWA) | 2 | 5,000 × 2 |
| UI/UX Designer | 1 | 4,500 |
| QA Engineer | 1 | 3,500 |
| DevOps (نصف-تفرّغ) | 0.5 | 3,000 |
| Hadi (advisor) | — | revenue share |
| **Total** | 8.5 | **~44,500/شهر** |

### Scaling Team (Phase 2)
+ Mobile Engineer (React Native) · ML Engineer · T&S Specialist · Content/Community Manager · Customer Support (2).

### Working Methodology
- Scrum: 2-week sprints, retro + planning + demo.
- Kanban for support/ops.
- Code review mandatory (≥ 2 approvals BE, 1 FE).
- PR template: change summary, screenshots, test plan, rollback.

---

# 32. Development Phases

### Phase 0 — Pre-launch (4 weeks)
Brand finalize, legal entity, Terms/Privacy, accounts (AWS/Stripe/Twilio).
Hire team, repos, CI/CD. Design System v1 in Figma.

### Phase 1 — MVP build (12 weeks)
- Weeks 1-2: Auth + DB schema + IaC.
- Weeks 3-4: Profile + Matching questions (gated).
- Weeks 5-6: Face capture + trait engine.
- Weeks 7-8: Matching engine + Glimpse + Teaser.
- Weeks 9-10: Payments + chat + push.
- Week 11: Admin basic + analytics events.
- Week 12: Hardening, pen test fixes, performance.

### Phase 2 — Soft launch (4 weeks)
Invite-only beta (200 users). Daily standups. Iterate by funnel.

### Phase 3 — Public launch
KSA + UAE first. Performance + scale validate.

### Phase 4 — Growth (month 4-9)
Verification, Wali, native iOS. Expand: Egypt, Jordan, Morocco.

### Phase 5 — Maturity (month 10-18)
Native Android, B2B portal, multi-language, cohorts.

---

# 33. Launch Strategy

### Soft Launch (Closed Beta)
- Audience: 200 مستخدم مختار (1:1 جنس)، عبر Hadi network.
- Duration: 3 أسابيع.
- Criteria: استبيان قبل/بعد، استخدام 5 أيام، دفع بـ rebate.
- Outputs: funnel data, NPS, bug list.

### Public Launch
- Timing: بعد إغلاق Show-stoppers.
- Regions: KSA + UAE في الأسبوع 1.
- PR: بيان صحفي + مقابلة هادي في برامج صباحية.
- Influencers: 5-7 micro influencers.
- Launch offer: أول شهر Matching بـ 50%.

### Pre-launch List
Landing مع waitlist (email + WhatsApp). مستهدف 10K قبل اللانش. Drip campaign: 3 رسائل تعليمية + تعريف بهادي.

---

# 34. Marketing Strategy

### Positioning Statement
> "تَوَافُق — حيث الوجه يحكي والقيم تطمئن. أول منصة تعارف بقصد الزواج تجمع علم الفِراسة الحديث مع تحليل سلوكي محترم لقيمك."

### Channels & Budget Mix (شهور 1-6)
| القناة | حصة | KPI |
|---|:---:|---|
| Instagram Ads (reels + stories) | 35% | CAC ≤ $6 |
| TikTok (educational + Hadi) | 20% | reach |
| Influencer marketing | 20% | followers→signup |
| SEO + Blog (Hadi insights) | 10% | organic |
| Google Ads (brand + intent) | 10% | conv |
| WhatsApp community | 5% | retention |

### Content Pillars
1. علم الفِراسة المبسّط (أسبوعي من هادي).
2. قصص نجاح زواج (برضا المتزوجين).
3. علم نفس العلاقات (Gottman + attachment).
4. خلف الكواليس (كيف يعمل الذكاء الاصطناعي بصدق).

### Referral Program
شارك مع صديق → كلاكما 30 يوم Matching مجاناً (cap 5).

### Community
WhatsApp groups مغلقة (نساء فقط / رجال فقط) بإدارة Community Manager.
جلسات شهرية مفتوحة مع هادي (Live IG).

### Partnerships
مكاتب زواج (Phase 2) · مستشاري أسري · جهات دينية معتدلة.

### Anti-Marketing
لا نستخدم: الإغراء الجسدي، صور غير محتشمة، حملات FOMO عدوانية.

---

# 35. Risk Analysis

| المخاطرة | الاحتمال | الأثر | التخفيف |
|---|:---:|:---:|---|
| فقهي/شرعي حول الفِراسة | متوسط | كبير | فتاوى داعمة مسبقة + إخلاء مسؤولية + تأطيرها كـ "تلميح" |
| مخاوف خصوصية الصور | عالي | كبير | Edge processing + شفافية + شارة "صورتك لا تغادر جهازك" |
| منافس كبير ينسخ | متوسط | متوسط | Brand هادي + كاتالوج مواقف فريد + سرعة execution |
| بطء النمو (chicken-egg) | عالي | كبير | seed cities + تجارب مدفوعة للنساء + Influencer push |
| Catfishing/fake profiles | عالي | كبير | Verification + ML detection + community report |
| Payment compliance (PCI) | منخفض | كبير | Stripe-hosted forms (لا نلمس بطاقات) |
| تعطّل الكاميرا للمستخدم | متوسط | متوسط | fallback to questions only + indicator |
| سوء استخدام (تحرّش في الشات) | متوسط | كبير | report + ML moderation + bans + safety center |
| نزاع قانوني (مستخدم متضرر) | منخفض | متوسط | ToS واضح + insurance |
| عدم تحقيق break-even | متوسط | كبير | unit-economics check شهري + قابلية تخفيض cost |
| تسرّب بيانات | منخفض | كارثي | Sec hardening + insurance + IR plan |

---

# 36. القرارات المعلّقة وأفضل الممارسات

### قرارات لم تُحسم سابقًا + توصيتنا

| القرار | التوصية | السبب |
|---|---|---|
| Native vs PWA لـ MVP | **PWA** | سرعة، توفير، iOS Safari يدعم الكاميرا |
| Payment provider primary | **Stripe + STC + Apple** | Stripe للدولي، STC للسعودية، Apple إجباري |
| E2EE في الشات | **مؤجَّل لـ Phase 2** | server-side moderation أهم الآن |
| التحقق من الهوية | **Phase 2** | يبطئ الـ onboarding في MVP |
| Wali access | **Phase 2 — اختياري** | قيمة مضافة بدل عقبة |
| السعر Matching | **$14.99/شهر، $99/سنة** | نسبة طبيعية + خصم سنوي 45% |
| Hadi compensation | **40% من إيراد جلساته + flat $3000/شهر advisor** | يحفّز ويلزم |
| Free tier limits | **يستقبل لا يبعت، شات بعد القبول 10 رسائل** | يخلق ضغط تحويل |
| OTP cost optimization | **Twilio Verify** | يجمع الأرخص حسب البلد |
| Hosting region | **AWS me-south-1 + eu-west-1 DR** | أقرب + امتثال GDPR |
| Search | **Postgres FTS أولاً** | YAGNI، تبديل لاحقًا |
| Bot detection | **reCAPTCHA v3 + behavioral signals** | يقلّل احتكاك |
| API style | **REST + WebSocket** | بسيط ومألوف، GraphQL مبالغة |
| Data residency | **KSA region للسعوديين** | امتثال PDPL |
| Backup retention | **35 يوم + monthly Glacier** | توازن تكلفة/أمان |
| Testing | **Vitest (unit) + Playwright (E2E) + manual QA** | TDD للـ engine الـ business-critical |

### نقاط تستحق ورشة قرار قبل البدء
1. **اسم العلامة النهائي** + علامة تجارية مسجّلة.
2. **هوية بصرية نهائية** (Logo lockup) — توصية: وكالة عربية متخصصة.
3. **سعر Hadi Session** ($199 مقترح، يستحق test) ومدتها (45 vs 60 min).
4. **سياسة "المتزوجين سابقًا"** — هل ندعم الباحثين عن الزوجة الثانية بصراحة؟
5. **اللهجة في الـ Voice** — مصرية/خليجية/فصحى محايدة؟

---

# 📌 خلاصة تنفيذية

تَوَافُق منتج يحلّ مشكلة حقيقية في سوق ينمو بسرعة، بميزة تنافسية فريدة (الفِراسة الهندسية + المواقف المحصّنة + Brand هادي).

**الأركان الأربعة للنجاح:**
1. **Trust** — شفافية أخلاقية، خصوصية معلنة، Brand authority.
2. **Quality of Match** — bookend شفاف (gates + weighted)، not engagement-driven.
3. **Speed to Aha** — 8-10 دقائق للوصول للـ Teaser.
4. **Sustainable Economics** — One-time + subscription + premium hybrid.

**الفرصة:** سوق 28M، تنفيذ سريع 12 أسبوع، break-even متوقع شهر 9-12.

**المخاطر الأهم:** القبول الفقهي، حرب الخصوصية، النمو الأولي.

**التوصية النهائية:** ابدأ MVP بفريق 8-9 أشخاص، ميزانية ~$170K، 12 أسبوع، إطلاق KSA+UAE، ثم توسّع.

---

**نهاية الوثيقة — v1.0**

> هذه الوثيقة مرجع حيّ — تُحدَّث ربعيًا أو عند أي قرار جوهري.
> **المسؤول عن التحديث:** Product Manager.
> **آخر تحديث:** 2026-06-07.
