# Tawafuq — Web Demo

نسخة ويب تجريبية تشغّل النظام كاملاً محلياً (بدون أي سيرفر بعيد).

## التشغيل (ويندوز)

دبل كليك على `start.bat`. هيفتح المتصفح تلقائياً على `http://localhost:8765/`.

## التشغيل (أي نظام)

```bash
cd demo
python -m http.server 8765
# ثم افتح http://localhost:8765/
```

> **مهم**: لازم يُفتح من خلال HTTP server وليس بـ double-click على `index.html` (المتصفحات بترفض fetch لـ JSON من `file://`).

## ازاي تستخدمه

1. **اختر خطة** (Matching مجاني / Basic / Advanced / Premium)
2. **ارفع صورة وجه** — التحليل بيتم في المتصفح، الصورة ما تطلعش لأي سيرفر
3. **جاوب الأسئلة** بمقياس Likert من 5
4. **شوف النتائج** — نسبة توافق للمجاني، أو تحليل سمات للمدفوع

## بنية الملفات

```
demo/
├── index.html      الواجهة
├── demo.css        التنسيق
├── demo.js         التحكم في خطوات الاستخدام
├── face.js         MediaPipe + استخراج 38 metric
├── scoring.js      محرّك التحليل (JS port)
├── data/           البيانات (questions, traits, alias)
├── models/         نموذج MediaPipe
└── start.bat       launcher للويندوز
```

## ملاحظات للمراجعة

- الـ `matching` tier بيقارن المستخدم بشريك افتراضي (نسخة من نفسه مع noise بسيط) — للعرض فقط
- الأسئلة الحالية مولّدة آلياً، بعضها فيه صياغة عربية تحتاج مراجعة تحريرية
- الـ z-score baseline في scoring.js مؤقت (mean=0.3, std=0.2) — يحتاج معايرة من بيانات real users

## التعديل السريع

- لتغيير لون أو خط: `demo.css`
- لتغيير الأسئلة المعروضة: عدّل `data/plans.json`
- لإضافة metric جديد: عدّل `face.js` + alias في `data/feature_alias.json`
