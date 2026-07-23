# -*- coding: utf-8 -*-
"""Expand demo/data/trait_feature_map.json from 15 -> the 60 core traits.

RULES (per spec):
 1. Link a visual feature ONLY when there is a clear, measurable metric.
 2. Every link carries: feature, direction, weight, confidence_source.
 3. Traits the photo cannot read clearly keep NO weak visual link -> they stay
    question-driven (the adaptive engine will ask about them).
 4. Directions are authored per-PHRASE (so "wide mouth" and "narrow mouth" map
    to the same metric with opposite directions) — reviewed one by one below.

Output: demo/data/trait_feature_map.json   (old 15-map backed up to *_15.bak.json)
        phase3_out/trait_map_60_build_report.md
"""
import io, json, os, collections, shutil

DEMO = "demo/data"
TR60 = json.load(io.open("phase3_out/traits_60.json", encoding="utf-8"))
META = json.load(io.open(os.path.join(DEMO, "traits_meta.json"), encoding="utf-8"))

# ---- name -> sabti id (matrix/questions are keyed by sabti id) ----
def norm(s): return s.strip().replace("ـ", "")
meta_by_name = {}
for t in META:
    meta_by_name.setdefault(norm(t.get("name", "")), t["id"])

# ============================================================
# AUTHORED PHRASE MAP  (phrase, alias_feature, direction, weight, conf_source)
#   direction: high = more metric -> more trait; low = inverse; mid = neutral/balanced
#   conf_source: direct (frontal geometry) | profile (needs side capture) |
#                proxy (approximate) ;  used for transparency + weight damping
# Only CLEAR, measurable phrases are listed. Anything about ears, eye colour,
# hair, eyelid crease, under-eye, moles, eye-depth(beyond brow proxy) is omitted
# on purpose -> those traits fall back to questions.
# ============================================================
PHRASE_MAP = [
 # --- mouth width ---
 ("فم عريض","mouth_width_ratio","high",2.0,"direct"),
 ("فم ضيق","mouth_width_ratio","low",2.0,"direct"),
 ("فم صغير","mouth_width_ratio","low",1.5,"direct"),
 ("فم متوسط","mouth_width_ratio","mid",1.0,"direct"),
 ("فم متزن","mouth_width_ratio","mid",1.0,"direct"),
 ("شفاه متزنة","mouth_width_ratio","mid",0.8,"direct"),
 ("شفاه متوازنة","mouth_width_ratio","mid",0.8,"direct"),
 # --- smile / corner tilt ---
 ("فم عريض مبتسم","mouth_corner_tilt","high",1.5,"direct"),
 ("فم مبتسم","mouth_corner_tilt","high",1.5,"direct"),
 # --- upper lip fullness ---
 ("شفة علوية ممتلئة","upper_lip_ratio","high",2.0,"direct"),
 ("شفة علوية أكبر","upper_lip_ratio","high",1.5,"direct"),
 ("شفاه ممتلئة","upper_lip_ratio","high",1.5,"direct"),
 ("فم نحيف","upper_lip_ratio","low",1.5,"direct"),
 ("شفاه نحيفة","upper_lip_ratio","low",2.0,"direct"),
 ("شفاه رقيقة","upper_lip_ratio","low",1.5,"direct"),
 ("فم رقيق","upper_lip_ratio","low",1.2,"direct"),
 # --- lower lip ---
 ("شفة سفلى ممتلئة","lower_lip_ratio","high",2.0,"direct"),
 ("شفة سفلى أكبر","lower_lip_ratio","high",2.0,"direct"),
 ("شفة سفلى لحمية","lower_lip_ratio","high",1.5,"direct"),
 # --- cheeks ---
 ("خدود ممتلئة","cheek_fullness","high",1.5,"direct"),
 # --- eye openness / size ---
 ("عيون واسعة","eye_open_ratio","high",2.0,"direct"),
 ("عيون كبيرة","eye_open_ratio","high",2.0,"direct"),
 ("عين واسعة","eye_open_ratio","high",1.5,"direct"),
 ("جاحظة","eye_open_ratio","high",1.5,"direct"),
 ("عيون صغيرة","eye_open_ratio","low",2.0,"direct"),
 ("عيون ضيقة","eye_open_ratio","low",2.0,"direct"),
 ("عين صغيرة","eye_open_ratio","low",1.5,"direct"),
 ("عين حادة","eye_open_ratio","low",1.2,"direct"),
 # --- eye spacing ---
 ("عيون متقاربة","eye_spacing_ratio","low",2.0,"direct"),
 ("عيون متباعدة","eye_spacing_ratio","high",2.0,"direct"),
 # --- eye tilt ---
 ("زوايا عين لأعلى","eye_tilt_ratio","high",2.0,"direct"),
 ("عيون تميل لأعلى","eye_tilt_ratio","high",1.5,"direct"),
 ("تميل لأعلى","eye_tilt_ratio","high",1.2,"direct"),
 ("زوايا عين لأسفل","eye_tilt_ratio","low",2.0,"direct"),
 ("زوايا عين مائلة لأسفل","eye_tilt_ratio","low",1.5,"direct"),
 ("مائلة لأسفل","eye_tilt_ratio","low",1.2,"direct"),
 ("تميل لأسفل","eye_tilt_ratio","low",1.2,"direct"),
 # --- brow arch (arched vs straight/angular) ---
 ("حاجب مقوس","brow_arch","high",1.8,"direct"),
 ("حاجب مستقيم","brow_arch","low",1.5,"direct"),
 ("حاجب زاوي","brow_arch","low",1.2,"direct"),
 # --- brow height (distance to eye) ---
 ("حاجب مرتفع","brow_eye_distance_ratio","high",1.8,"direct"),
 ("حاجب منخفض قريب","brow_eye_distance_ratio","low",1.5,"direct"),
 ("منخفض قريب من العين","brow_eye_distance_ratio","low",1.5,"direct"),
 ("قريب من العين","brow_eye_distance_ratio","low",1.2,"direct"),
 ("حاجب منخفض","brow_eye_distance_ratio","low",1.5,"direct"),
 # --- brow density ---
 ("حاجب كثيف","brow_density","high",1.8,"direct"),
 ("حاجب خفيف","brow_density","low",1.8,"direct"),
 # --- brow inner distance (connected brow) ---
 ("حاجب متصل","brow_inner_distance","low",1.8,"direct"),
 # --- nose length / size ---
 ("أنف طويل","nose_length_ratio","high",1.8,"direct"),
 ("أنف قصير","nose_length_ratio","low",1.8,"direct"),
 ("أنف كبير","nose_width_ratio","high",1.5,"direct"),
 # --- nostrils ---
 ("فتحات أنف كبيرة","nostril_width_ratio","high",1.5,"direct"),
 ("فتحات أنف واسعة","nostril_width_ratio","high",1.5,"direct"),
 ("فتحات أنف ظاهرة","nostril_width_ratio","high",1.2,"direct"),
 ("فتحات أنف صغيرة","nostril_width_ratio","low",1.5,"direct"),
 # --- nose tip up/down ---
 ("طرف أنف مرفوع","nose_tip_drop_ratio","low",1.8,"direct"),
 ("طرف أنف لأسفل","nose_tip_drop_ratio","high",1.8,"direct"),
 # --- jaw ---
 ("فك قوي","jaw_width_ratio","high",2.0,"direct"),
 ("فك عريض","jaw_width_ratio","high",1.8,"direct"),
 ("فك واضح","jaw_width_ratio","high",1.5,"direct"),
 # --- chin (frontal projection) ---
 ("ذقن قوي","chin_projection_ratio","high",1.8,"direct"),
 ("ذقن بارز","chin_projection_ratio","high",1.8,"direct"),
 ("ذقن واضح","chin_projection_ratio","high",1.5,"direct"),
 # --- forehead width ---
 ("جبهة عريضة","forehead_width_ratio","high",1.5,"direct"),
 ("جبهة ضيقة","forehead_width_ratio","low",1.5,"direct"),
 # --- forehead vertical lines ---
 ("خط عمودي في الجبهة","forehead_lines","high",1.2,"proxy"),
 ("خطان عموديان فوق الأنف","forehead_lines","high",1.2,"proxy"),
 # --- face shape (aspect) ---
 ("وجه مستطيل","face_aspect_ratio","high",1.5,"direct"),
 ("وجه مستطيل طويل","face_aspect_ratio","high",1.5,"direct"),
 ("وجه طويل","face_aspect_ratio","high",1.2,"direct"),
 ("وجه مستدير","face_aspect_ratio","low",1.5,"direct"),
 ("وجه مربع","face_squareness","high",1.5,"proxy"),

 # ===== PROFILE metrics unlocked by proposal 3 (side captures) =====
 ("أنف روماني","nose_bridge_straightness","high",2.0,"profile"),
 ("أنف محدب","nose_bridge_straightness","high",1.8,"profile"),
 ("أنف مقعر","nose_bridge_straightness","low",1.8,"profile"),
 ("أنف مستقيم","nose_bridge_straightness","mid",1.5,"profile"),
 ("أنف إغريقي مستقيم","nose_bridge_straightness","mid",1.5,"profile"),
 ("أنف حاد","nose_tip_sharpness","low",1.5,"profile"),
 ("أنف حاد يميل لأسفل","nose_tip_sharpness","low",1.2,"profile"),
 ("مستدق","nose_tip_sharpness","low",1.2,"profile"),
 ("ذقن بارز","chin_profile_projection","high",1.5,"profile"),
 ("ذقن قوي","chin_profile_projection","high",1.2,"profile"),
 # deep-set eyes -> prominent brow ridge in profile (PROXY)
 ("عيون غائرة","eye_depth","high",1.2,"proxy"),
 ("عين غائرة","eye_depth","high",1.0,"proxy"),
 ("غائرة","eye_depth","high",0.8,"proxy"),
 # sclera (sanpaku) — geometric from iris vs lids
 ("بياض عين ظاهر أسفل القزحية","lower_sclera","high",1.5,"profile"),
 ("بياض عين ظاهر أعلى القزحية","upper_sclera","high",1.5,"profile"),
]

# confidence_source -> weight damping (mirrors how scoring treats proxies)
SRC_DAMP = {"direct":1.0, "profile":0.85, "proxy":0.6}

def split_features(raw):
    # features_raw is an Arabic comma (،) separated list, ends with .
    parts = []
    for chunk in raw.replace(".", "،").split("،"):
        c = chunk.strip()
        if c: parts.append(c)
    return parts

rows = []
unmatched_names = []
linked_counter = collections.Counter()
for t in TR60:
    name = norm(t["name"])
    sid = meta_by_name.get(name)
    feats = split_features(t["features_raw"])
    # gather signals, keyed by alias_feature (dedupe, keep strongest)
    chosen = {}
    for idx, phrase in enumerate(feats):
        pos_factor = 1.3 if idx < 3 else (1.1 if idx < 5 else 1.0)
        for ph, feat, direction, w, src in PHRASE_MAP:
            if ph in phrase:
                weight = round(w * pos_factor * SRC_DAMP[src], 2)
                prev = chosen.get(feat)
                if prev is None or weight > prev["weight"]:
                    chosen[feat] = {"feature": feat, "direction": direction,
                                    "weight": weight, "confidence_source": src,
                                    "hits": 1, "from_phrase": phrase}
    features = sorted(chosen.values(), key=lambda f: -f["weight"])
    for f in features:
        linked_counter[f["feature"]] += 1
    # static confidence hint (runtime recomputes precisely)
    nd = sum(1 for f in features if f["confidence_source"] == "direct")
    conf = "high" if nd >= 3 else "medium" if (len(features) >= 2) else "low" if features else "none"
    entry = {
        "id": f"hadi_{t['num']:02d}",   # keyed to the 60-system (own question bank)
        "name": t["name"],
        "matched_sabti": bool(sid),
        "confidence": conf,
        "n_visual_features": len(features),
        "features": [{k: f[k] for k in ("feature","direction","weight","confidence_source","hits")}
                     for f in features],
    }
    rows.append(entry)
    if not sid:
        unmatched_names.append(t["name"])

# ---- write the new 60-trait map as a SEPARATE artifact (live 15-map untouched
#      because the question matrix is keyed to a different taxonomy — sabti) ----
out_path = os.path.join(DEMO, "trait_feature_map_60.json")
json.dump(rows, io.open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---- report ----
no_visual = [r for r in rows if r["n_visual_features"] == 0]
L = ["# بناء خريطة الـ60 صفة (وش + اتجاه + وزن + مصدر ثقة)\n"]
L.append(f"- صفات اتبنت: **{len(rows)}**")
L.append(f"- متطابقة مع sabti id (قابلة للأسئلة من المصفوفة): **{sum(1 for r in rows if r['matched_sabti'])}**")
L.append(f"- صفات بدون أي ربط بصري (هتفضل أسئلة بالكامل): **{len(no_visual)}**")
L.append(f"- أسماء مش متطابقة مع traits_meta: {len(unmatched_names)} -> {', '.join(unmatched_names) or '—'}\n")
L.append("## كام صفة بتستخدم كل قياس")
for feat, n in linked_counter.most_common():
    L.append(f"- `{feat}`: {n} صفة")
L.append("\n## الصفات اللي هتفضل أسئلة (مفيش ربط بصري واضح)")
for r in no_visual:
    L.append(f"- {r['name']}")
L.append("\n## عينة: أول 12 صفة وروابطها")
for r in rows[:12]:
    L.append(f"\n### {r['name']}  (ثقة:{r['confidence']}, ملامح:{r['n_visual_features']})")
    for f in r["features"]:
        L.append(f"  - {f['feature']} | {f['direction']} | w={f['weight']} | {f['confidence_source']}")
io.open("phase3_out/trait_map_60_build_report.md", "w", encoding="utf-8").write("\n".join(L))

# ============================================================
# BEFORE / AFTER — photo-driven question reduction on the 60 traits.
# Self-contained (does NOT use the sabti question matrix, which is a different
# taxonomy).  Model: each trait needs K=3 evidence points to be "confident".
#
# CRITICAL: a facial measurement is NOT the same as evidence about a PERSONALITY
# trait. In فِراسة the face gives a weak probabilistic *hint*, not a reading.
# So each visual feature contributes:
#       evidence = measurement_quality(src) * INFER
#   measurement_quality:  direct=1.0  profile=0.85  proxy=0.6   (can we measure it)
#   INFER:                how strongly the feature constrains the *trait* itself.
# INFER is deliberately LOW for personality inference. We sweep it so the user
# can see how sensitive the "questions saved" figure is to that assumption — and
# so nobody mistakes "I measured your jaw" for "I know you're a leader".
#
#   BEFORE photo: evidence=0  -> trait needs K questions
#   AFTER  photo: questions   = ceil(K - photo_evidence), min 0
# ============================================================
import math
K = 3
MQ = {"direct": 1.0, "profile": 0.85, "proxy": 0.6}
tr60_by_name = {norm(t["name"]): t for t in TR60}

def evidence(features, infer):
    return sum(MQ[f["confidence_source"]] * infer for f in features)

def run_model(infer):
    tb = ta = 0
    skipped = partial = qonly = 0
    det = []
    for r in rows:
        nf = len(split_features(tr60_by_name[norm(r["name"])]["features_raw"])) or 1
        k = min(K, nf)
        ev = min(k, evidence(r["features"], infer))
        qb, qa = k, max(0, math.ceil(k - ev))
        tb += qb; ta += qa
        if qa == 0 and r["features"]: skipped += 1
        elif not r["features"]:       qonly += 1
        else:                         partial += 1
        det.append((r["name"], qb, qa, round(ev, 2), r["n_visual_features"]))
    return tb, ta, skipped, partial, qonly, det

# INFER sweep: 1.0 = naive (measurement == trait-reading, the misleading view);
#              0.35 = realistic physiognomy hint; 0.20 = conservative.
SWEEP = [("ساذج (قياس = قراءة)", 1.00),
         ("واقعي (فِراسة = تلميح)", 0.35),
         ("متحفّظ", 0.20)]

R = ["# قبل/بعد — تأثير الصورة على عدد الأسئلة (الـ60 صفة)\n"]
R.append("> نموذج مستقل عن مصفوفة sabti (تصنيف مختلف). كل صفة محتاجة K=3 نقاط إثبات.")
R.append(">")
R.append("> **مهم:** قياس ملمح في الوجه ≠ دليل على صفة شخصية. في الفِراسة الوجه يدّي")
R.append("> *تلميح احتمالي ضعيف* مش قراءة مؤكدة. عشان كده كل ملمح = جودة_القياس × INFER،")
R.append("> و INFER (قوة استدلال الملمح على الصفة) منخفضة عمداً. بنجرّب 3 قيم عشان تبان")
R.append("> حساسية النتيجة للافتراض — وعشان محدش يخلط بين \"قِست فكك\" و\"عرفت إنك قيادي\".\n")
R.append("## جدول الحساسية (إجمالي الأسئلة عبر الـ60 صفة)\n")
R.append("| الافتراض | INFER | أسئلة قبل | أسئلة بعد | تقليل | اتسكّرت كلياً | جزئية | بأسئلة كاملة |")
R.append("|--|--|--|--|--|--|--|--|")
realistic_det = None
for label, infer in SWEEP:
    tb, ta, sk, pa, qo, det = run_model(infer)
    R.append(f"| {label} | {infer:.2f} | {tb} | {ta} | {round(100*(tb-ta)/tb)}% | {sk} | {pa} | {qo} |")
    if abs(infer - 0.35) < 1e-9:
        realistic_det = (tb, ta, sk, pa, qo, det)

tb, ta, sk, pa, qo, det = realistic_det
R.append(f"\n## تفصيل السيناريو الواقعي (INFER=0.35)\n")
R.append(f"- إجمالي الأسئلة: **{tb} → {ta}**  (تقليل **{round(100*(tb-ta)/tb)}%**)")
R.append(f"- صفات اتسكّرت بالكامل من الصورة: **{sk}**")
R.append(f"- صفات قلّت أسئلتها (جزئي): **{pa}**")
R.append(f"- صفات الصورة مش شايفاها (أسئلة كاملة): **{qo}**\n")
R.append("| الصفة | أسئلة قبل | أسئلة بعد | إثبات بصري | ملامح بصرية |")
R.append("|--|--|--|--|--|")
for nm, qb, qa, ev, nvf in det:
    R.append(f"| {nm} | {qb} | {qa} | {ev} | {nvf} |")
io.open("phase3_out/trait_60_before_after.md", "w", encoding="utf-8").write("\n".join(R))

print("traits built:", len(rows))
print("matched sabti (exact):", sum(1 for r in rows if r['matched_sabti']))
print("wrote", out_path)
print("wrote phase3_out/trait_map_60_build_report.md")
print("wrote phase3_out/trait_60_before_after.md")
print("\n=== BEFORE/AFTER sweep (60 traits, K=3) ===")
for label, infer in SWEEP:
    tb, ta, sk, pa, qo, _ = run_model(infer)
    print(f"INFER={infer:.2f} [{label}]: {tb} -> {ta}  (-{round(100*(tb-ta)/tb)}%) | "
          f"skip={sk} partial={pa} blind={qo}")
