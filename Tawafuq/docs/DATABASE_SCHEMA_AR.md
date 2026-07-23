# 🗄️ Database Schema — تَوَافُق

> الملف الكامل بـ SQL: [DATABASE_SCHEMA.sql](DATABASE_SCHEMA.sql)  
> الـ Stack: **PostgreSQL 15+** مع **pgvector** للـ face embeddings

---

## 📊 نظرة عامة على الـ Domains

النظام مقسم لـ **17 domain** كل واحد له مسؤولية واضحة:

```
┌─ 1.  Identity & Auth ─────┐  المستخدمين والجلسات والـ OTP
├─ 2.  Verification (KYC) ──┤  التحقق من الهوية
├─ 3.  Profile ─────────────┤  الملف الشخصي + تفضيلات الشريك
├─ 4.  Matching Answers ────┤  73 سؤال onboarding
├─ 5.  Face Engine ─────────┤  38 metric + face_vector للـ matching
├─ 6.  Matching Profile ────┤  Big Five, Attachment, Gottman... محسوبة
├─ 7.  Trait Analysis ──────┤  951 سؤال + 600 سمة محسوبة
├─ 8.  Subscriptions ───────┤  اشتراك Matching (3 خطط)
├─ 9.  Payments ────────────┤  المدفوعات
├─ 10. Matches ─────────────┤  المطابقات المحسوبة
├─ 11. Requests & Chat ─────┤  طلبات + شات + counter الـ 10 رسائل
├─ 12. Moderation ──────────┤  Reports + Blocks + Abuse signals
├─ 13. Notifications ───────┤  الإشعارات + push tokens
├─ 14. Settings ────────────┤  تفضيلات المستخدم
├─ 15. Admin & Audit ───────┤  لوحة الإدارة + سجل العمليات
├─ 16. Content Bank ────────┤  بنوك الأسئلة والسمات (server-side)
└─ 17. Analytics Events ────┤  تتبع الأحداث (lightweight)
```

---

## 🔗 العلاقات الأساسية (ER Diagram)

```
                    ┌──────────────────┐
                    │     users        │
                    │  (الجدول الأساسي)│
                    └────────┬─────────┘
                             │ 1:1 / 1:N
        ┌────────────────────┼─────────────────────┐
        ▼                    ▼                     ▼
┌───────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ user_profiles │  │ matching_answers│  │   face_scans     │
│ partner_prefs │  │ (73 سؤال)       │  │ (38 metric +     │
└───────────────┘  └────────┬────────┘  │  face_vector)    │
                            │           └────────┬─────────┘
                            │                    │
                            └──────────┬─────────┘
                                       ▼
                         ┌─────────────────────────────┐
                         │   matching_profiles         │
                         │ (Big Five, Attachment,      │
                         │  Gottman, Dark Triad...)    │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                          ┌─────────────────────────┐
                          │       matches           │
                          │ (user_a × user_b)       │
                          │ + 8 dimensions          │
                          │ + red_flags             │
                          └──────────┬──────────────┘
                                     │
                                     ▼
                          ┌─────────────────────────┐
                          │  contact_requests       │
                          │      ▼                  │
                          │  chat_rooms             │
                          │      ▼                  │
                          │  chat_messages          │
                          │  (مع free_messages      │
                          │   counter للريسيفر)     │
                          └─────────────────────────┘

  Trait Analysis (مسار مستقل):

        users ───┬──→ trait_analysis_purchases (Basic/Adv/Premium)
                 │
                 ├──→ trait_answers (30/80/100 إجابة)
                 │
                 └──→ trait_scores (600 سمة محسوبة)

  Commerce:

        users ──→ subscriptions ──→ payments
                                       ↑
        trait_analysis_purchases ──────┘
```

---

## 📋 الجداول حسب الـ Domain

### 1️⃣ Identity & Auth

| الجدول | الوظيفة |
|---|---|
| `users` | الحساب الأساسي (email, phone, password_hash, status, gender, DOB) |
| `auth_sessions` | الجلسات النشطة (لإدارة الـ logout من كل الأجهزة) |
| `otp_codes` | أكواد التحقق المؤقتة (register/login/recovery) |

### 2️⃣ Verification (KYC)

| الجدول | الوظيفة |
|---|---|
| `identity_verifications` | رفع الـ ID + selfie + match_score (مهم لتطبيق زواج) |

### 3️⃣ Profile

| الجدول | الوظيفة |
|---|---|
| `user_profiles` | اسم، bio، صور، بلد، تعليم، حالة اجتماعية، دين، طول/وزن |
| `partner_preferences` | تفضيلات الشريك: عمر، طول، بلد، deal_breakers (Q63) |

### 4️⃣ Matching Answers (الـ 73 سؤال)

| الجدول | الوظيفة |
|---|---|
| `matching_answers` | إجابات الـ 73 سؤال (`answer_value` بـ JSONB عشان الشكل يختلف من سؤال لسؤال) |

### 5️⃣ Face Engine

| الجدول | الوظيفة |
|---|---|
| `face_scans` | 38 metric + **face_vector(13)** للـ similarity search + liveness_passed + quality_score |

> ⚠️ **الصورة نفسها مش متخزنة** — بس الـ metrics والـ embedding. حماية خصوصية كاملة.

### 6️⃣ Matching Profile (المحسوب)

| الجدول | الوظيفة |
|---|---|
| `matching_profiles` | Big Five، Attachment Style، Gottman، Love Languages، Dark Triad، Red Flags — كله محسوب من الـ 73 سؤال |

### 7️⃣ Trait Analysis (المدفوع)

| الجدول | الوظيفة |
|---|---|
| `trait_analysis_purchases` | شراء Basic/Advanced/Premium (مرة واحدة) |
| `trait_answers` | إجابات أسئلة الـ Trait (30/80/100 حسب الخطة) |
| `trait_scores` | الـ 600 سمة المحسوبة لكل مستخدم مع confidence |

### 8️⃣ Subscriptions

| الجدول | الوظيفة |
|---|---|
| `subscriptions` | اشتراك Matching الدائم (monthly/annual) + revenue_cat_id للـ IAP |

### 9️⃣ Payments

| الجدول | الوظيفة |
|---|---|
| `payments` | كل المدفوعات (matching subscription + TA purchases) عبر providers مختلفة |

### 🔟 Matches

| الجدول | الوظيفة |
|---|---|
| `matches` | المطابقات المحسوبة بين كل زوج (user_a, user_b) + score + 8 dimensions + red_flags |

> الـ `CHECK (user_a_id < user_b_id)` بيمنع تكرار الصفوف (A↔B = B↔A).

### 1️⃣1️⃣ Requests & Chat

| الجدول | الوظيفة |
|---|---|
| `contact_requests` | طلبات التعارف (pending/accepted/rejected) |
| `chat_rooms` | الغرف المفتوحة + `free_messages_a/b` counter للأوتو-أنلوك |
| `chat_messages` | الرسائل نفسها |

### 1️⃣2️⃣ Moderation

| الجدول | الوظيفة |
|---|---|
| `user_reports` | بلاغات المستخدمين |
| `blocks` | الحظر بين المستخدمين |
| `abuse_signals` | إشارات سلوك مشبوه (duplicate messages, too many requests) |

### 1️⃣3️⃣ Notifications

| الجدول | الوظيفة |
|---|---|
| `notifications` | إشعارات داخل التطبيق |
| `push_tokens` | tokens للـ iOS/Android push |

### 1️⃣4️⃣ Settings

| الجدول | الوظيفة |
|---|---|
| `user_settings` | تفضيلات الإشعارات، الخصوصية، الـ theme |

### 1️⃣5️⃣ Admin & Audit

| الجدول | الوظيفة |
|---|---|
| `admin_users` | تعيين أدوار الإدارة (super_admin / moderator / support / finance) |
| `audit_logs` | سجل كل عملية حساسة (تعليق حساب، تعديل سؤال) — مهم قانونياً |

### 1️⃣6️⃣ Content Bank

| الجدول | الوظيفة |
|---|---|
| `matching_question_bank` | الـ 73 سؤال (server-side، يمكن تحديثهم بدون تحديث التطبيق) |
| `trait_question_bank` | الـ 951 سؤال |
| `trait_dictionary` | الـ 600 سمة |
| `trait_question_weights` | matrix العلاقة بين السمة والسؤال + الوزن |

### 1️⃣7️⃣ Analytics Events

| الجدول | الوظيفة |
|---|---|
| `events` | تتبع سلوك المستخدم (paywall.viewed, onboarding.completed) — للتحليل |

---

## 🔑 قرارات تصميم مهمة

### 1. UUIDs بدل auto-increment
- ✅ آمن (مش قابل للتخمين)
- ✅ يقدر يُجنرَى client-side قبل الـ save
- ✅ مفيد للـ distributed systems لاحقاً

### 2. JSONB للبيانات المتغيرة الشكل
- `matching_answers.answer_value` يختلف من سؤال لسؤال (int, string, array)
- `face_scans.metrics` تحتوي 38 metric بأسماء مختلفة
- `matches.dimensions` تحتوي 8 محاور
- يخلي الـ schema مرن بدون 100 جدول

### 3. Face Vector في DB
- `face_scans.face_vector VECTOR(13)` بيسمح بـ similarity search مباشر:
  ```sql
  SELECT user_id, face_vector <=> (SELECT face_vector FROM face_scans WHERE user_id = $1) AS distance
  FROM face_scans ORDER BY distance LIMIT 20;
  ```

### 4. Canonical Pair Ordering في matches/chat_rooms
- `user_a_id < user_b_id` يضمن إن (A,B) و (B,A) صف واحد فقط
- يبسط الـ queries والـ unique constraints

### 5. Soft Delete
- `users.deleted_at` بدل DELETE — للـ GDPR compliance والاسترجاع

### 6. Server-side Content Bank
- الأسئلة والسمات مش hardcoded في التطبيق
- الـ admin يقدر يعدّل بدون deploy
- versioning ممكن مستقبلاً

---

## 📈 الـ Views المساعدة

### `v_active_subscriptions`
كل المشتركين النشطين دلوقتي — للـ analytics والـ billing.

### `v_user_full_profile`
ملف كامل لمستخدم (لـ admin panel أو cache):
- بيانات أساسية + profile + matching_profile
- عدد إجابات الـ matching والـ trait
- هل عنده اشتراك نشط

---

## 🚀 Sample Queries

### إيجاد المطابقات لمستخدم
```sql
SELECT m.*, 
       CASE WHEN m.user_a_id = $1 THEN m.user_b_id ELSE m.user_a_id END AS partner_id
FROM matches m
WHERE (m.user_a_id = $1 OR m.user_b_id = $1)
  AND m.tag IN ('high', 'medium')
ORDER BY m.score DESC
LIMIT 20;
```

### حساب رسوم اشتراك مستحقة الشهر القادم
```sql
SELECT plan, count(*) AS subs_count, sum(
    CASE plan
        WHEN 'basic'    THEN 79
        WHEN 'advanced' THEN 149
        WHEN 'premium'  THEN 249
    END
) AS expected_revenue_egp
FROM subscriptions
WHERE status = 'active'
  AND current_period_end BETWEEN now() AND now() + interval '30 days'
GROUP BY plan;
```

### التحقق هل المستخدم استنفد رسائله المجانية
```sql
SELECT free_messages_a, free_messages_b
FROM chat_rooms
WHERE id = $1;
-- في الكود: لو counter للريسيفر >= 10 → block sending
```

### المستخدمين اللي بيستحقوا "Red Flag" review
```sql
SELECT u.id, u.email, mp.red_flags, mp.dark_triad_score
FROM users u
JOIN matching_profiles mp ON mp.user_id = u.id
WHERE array_length(mp.red_flags, 1) >= 2
   OR mp.dark_triad_score >= 70;
```

---

## ⚠️ ملاحظات مهمة قبل الإطلاق

1. **Encryption at rest** للبيانات الحساسة:
   - `users.password_hash` ← bcrypt (built-in)
   - `identity_verifications.id_document_url` ← KMS-encrypted bucket
   - الـ messages الحساسة ← AES-256

2. **GDPR / حماية البيانات:**
   - `user_settings.privacy` يخلي المستخدم يحدد الـ visibility
   - DELETE cascade على كل جدول مرتبط بـ users
   - export بيانات endpoint جاهز

3. **Audit للحساس:**
   - أي تعديل على ID verification → سجل في `audit_logs`
   - أي تعليق حساب → سجل
   - أي سحب لبيانات صحية → سجل

4. **Backup strategy:**
   - Point-in-time recovery (PITR)
   - Daily snapshots
   - Cross-region replication لو الـ traffic يستحق

5. **Indexes:**
   - كل الـ FKs مفهرسة
   - composite indexes للـ queries الشائعة (user + time)
   - GIN indexes على JSONB لو احتجت بحث داخل الـ answers

---

## 📦 الملفات

- [DATABASE_SCHEMA.sql](DATABASE_SCHEMA.sql) — الكود الكامل، جاهز للتشغيل على PostgreSQL 15+
- ده الملف الـ MD (للقراءة)

---

## 🎯 الخطوة التالية

1. **شغّل الـ schema** على PostgreSQL محلي:
   ```bash
   createdb tawafuq
   psql tawafuq < DATABASE_SCHEMA.sql
   ```
2. **حمّل البيانات الموجودة** (matching questions, trait dictionary) من JSONs:
   ```sql
   -- مثال
   COPY trait_dictionary FROM 'firasa_master_dataset.json' WITH (FORMAT json);
   ```
3. **اربط الـ backend** — أي ORM مناسب (Prisma, TypeORM, SQLAlchemy)
