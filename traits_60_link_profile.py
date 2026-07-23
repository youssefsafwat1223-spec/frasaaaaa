# -*- coding: utf-8 -*-
"""Link the 60 traits to the FULL capture stack after proposal 3:
   frontal 32 metrics  +  5 new sagittal (profile) metrics from the
   left/right captures. Shows which traits get upgraded (questions-only/
   partial -> strong) because the side photos now read the nasal profile,
   chin projection and brow-ridge that a single front photo could not.

Output:
  phase3_out/traits_60_profile_link.json   (per-trait: frontal+profile+questions)
  phase3_out/traits_60_profile_link.md     (before/after table + upgrades)
"""
import io, json, collections

TRAITS = json.load(io.open("phase3_out/traits_60.json", encoding="utf-8"))

# ---- frontal 32 (same as traits_60_analyze.py) ----
MEAS = [
 ("فم عريض","mouth_width_ratio"),("فم ضيق","mouth_width_ratio"),("فم صغير","mouth_width_ratio"),
 ("فم متوسط","mouth_width_ratio"),("فم متزن","mouth_width_ratio"),("شفاه متزنة","mouth_width_ratio"),("شفاه متوازنة","mouth_width_ratio"),
 ("فم مبتسم","mouth_corner_tilt"),
 ("فم نحيف","upper_lip_ratio"),("شفاه نحيفة","upper_lip_ratio"),("شفاه رقيقة","upper_lip_ratio"),("فم رقيق","upper_lip_ratio"),
 ("شفاه ممتلئة","upper_lip_ratio"),("شفة علوية ممتلئة","upper_lip_ratio"),("شفة علوية أكبر","upper_lip_ratio"),
 ("شفة سفلى ممتلئة","lower_lip_ratio"),("شفة سفلى أكبر","lower_lip_ratio"),
 ("خدود ممتلئة","cheek_fullness"),
 ("عيون واسعة","eye_open_ratio"),("عيون كبيرة","eye_open_ratio"),("عين واسعة","eye_open_ratio"),
 ("جاحظة","eye_open_ratio"),("عيون صغيرة","eye_open_ratio"),("عيون ضيقة","eye_open_ratio"),
 ("عين صغيرة","eye_open_ratio"),("عين حادة","eye_open_ratio"),
 ("عيون متقاربة","eye_spacing_ratio"),("عيون متباعدة","eye_spacing_ratio"),
 ("زوايا عين لأعلى","eye_tilt_ratio"),("تميل لأعلى","eye_tilt_ratio"),
 ("زوايا عين لأسفل","eye_tilt_ratio"),("مائلة لأسفل","eye_tilt_ratio"),("تميل لأسفل","eye_tilt_ratio"),
 ("عيون ناعمة","eye_warmth_proxy"),("فم دافئ","eye_warmth_proxy"),("دافئ التعبير","eye_warmth_proxy"),
 ("حاجب مقوس","brow_arch"),
 ("حاجب زاوي","brow_tilt"),("حاجب مستقيم","brow_tilt"),("حاجب منخفض","brow_tilt"),
 ("حاجب مرتفع","brow_eye_distance_ratio"),("قريب من العين","brow_eye_distance_ratio"),("منخفض قريب","brow_eye_distance_ratio"),
 ("حاجب كثيف","brow_density"),("حاجب خفيف","brow_density"),
 ("حاجب متصل","brow_inner_distance"),
 ("أنف طويل","nose_length_ratio"),("أنف قصير","nose_length_ratio"),("أنف كبير","nose_width_ratio"),
 ("فتحات أنف","nostril_width_ratio"),
 ("طرف أنف مرفوع","nose_tip_drop_ratio"),("طرف أنف لأسفل","nose_tip_drop_ratio"),
 ("فك قوي","jaw_width_ratio"),("فك عريض","jaw_width_ratio"),("فك واضح","jaw_width_ratio"),
 ("ذقن قوي","chin_projection_ratio"),("ذقن بارز","chin_projection_ratio"),("ذقن واضح","chin_projection_ratio"),
 ("ذقن ثابت","chin_projection_ratio"),("ذقن غير مبالغ","chin_projection_ratio"),
 ("جبهة عريضة","forehead_width_ratio"),("جبهة ضيقة","forehead_width_ratio"),
 ("جبهة طويلة","forehead_shape"),("جبهة قصيرة","forehead_shape"),("جبهة تتسع لأعلى","forehead_shape"),
 ("جبهة مربعة","forehead_shape"),("جبهة مقببة","forehead_shape"),("جبهة بيضاوية","forehead_shape"),
 ("جبهة منظمة","forehead_shape"),("جبهة متزنة","forehead_shape"),
 ("خط عمودي في الجبهة","forehead_lines"),("خطان عموديان فوق الأنف","forehead_lines"),
 ("وجه مربع","face_squareness"),("وجه مستطيل","face_aspect_ratio"),("وجه طويل","face_aspect_ratio"),
 ("وجه مستدير","face_aspect_ratio"),("وجه بيضاوي","face_aspect_ratio"),
]

# ---- NEW: 5 sagittal metrics unlocked by the left/right captures (proposal 3) ----
PROFILE = [
 ("أنف روماني","nose_bridge_convexity"),
 ("أنف محدب","nose_bridge_convexity"),
 ("أنف مقعر","nose_bridge_convexity"),
 ("أنف مستقيم","nose_bridge_convexity"),
 ("أنف إغريقي","nose_profile_angle"),
 ("أنف حاد","nose_profile_angle"),
 ("مستدق","nose_profile_angle"),
 ("ذقن بارز","chin_sagittal_projection"),
 ("ذقن قوي","chin_sagittal_projection"),
 ("ذقن واضح","chin_sagittal_projection"),
 ("غائر","brow_ridge_projection"),     # deep-set eyes proxy = heavy brow ridge in profile
 ("جبهة مقببة","forehead_slope_profile"),
 ("جبهة تتسع لأعلى","forehead_slope_profile"),
]

# ---- unmeasurable phrase -> reason (profile-unlocked phrases REMOVED here) ----
UNMEAS = [
 ("شحمة","شحمة الأذن"),("حافة أذن","الأذن"),("أذن","الأذن"),
 ("مؤخرة رأس","مؤخرة الرأس"),
 ("جفن","الجفن"),
 ("بياض عين","بياض العين"),("القزحية","بياض/قزحية العين"),
 ("أسفل العين","تحت العين"),("منطقة أسفل العين","تحت العين"),
 ("طرف أنف ممتلئ","حجم طرف الأنف"),("طرف أنف لحيم","حجم طرف الأنف"),
 ("طرف أنف صغير","حجم طرف الأنف"),("بكرة","حجم طرف الأنف"),
 ("عيون بنية","لون العين"),("عيون رمادية","لون العين"),("عيون زرقاء","لون العين"),
 ("عيون خضراء","لون العين"),("لون عين","لون العين"),("أخضر","لون العين"),
 ("شعر","الشعر / خط الشعر"),("خط شعر","خط الشعر"),("قمة أرملة","خط الشعر"),
 ("شامات","الشامات"),("علامة جمالية","الشامات"),
 ("حاجب طويل","طول الحاجب"),("حاجب قصير","طول الحاجب"),
]
DERIV = ["وجه مائي","وجه ناري","وجه خشبي","وجه معدني","وجه أرضي"]

def hits(feat, table):
    s = set()
    for ph, m in table:
        if ph in feat:
            s.add(m)
    return s

def verdict(n):
    if n >= 3: return "قوي"
    if n >= 1: return "جزئي"
    return "يعتمد على الأسئلة"

rows = []
before = collections.Counter()
after = collections.Counter()
upgrades = []
for t in TRAITS:
    feat = t["features_raw"]
    front = hits(feat, MEAS)
    prof = hits(feat, PROFILE)
    deriv = {p for p in DERIV if p in feat}
    un = set(r for ph, r in UNMEAS if ph in feat)
    vb = verdict(len(front))
    va = verdict(len(front) + len(prof))
    before[vb] += 1
    after[va] += 1
    if va != vb:
        upgrades.append((t["num"], t["name"], vb, va, sorted(prof)))
    rows.append({
        "num": t["num"], "name": t["name"],
        "frontal_metrics": sorted(front),
        "profile_metrics": sorted(prof),
        "derivable_element": sorted(deriv),
        "to_questions": sorted(un),
        "n_face": len(front) + len(prof),
        "verdict_before": vb, "verdict_after": va,
    })

json.dump(rows, io.open("phase3_out/traits_60_profile_link.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

L = ["# ربط الـ60 صفة بكامل التصوير (أمامي 32 + جانبي 5 من اقتراح 3)\n"]
L.append("## الحصيلة قبل/بعد إضافة الزوايا الجانبية\n")
L.append("| الحكم | قبل (أمامي فقط) | بعد (+ جانبي) |")
L.append("|--|--|--|")
for k in ["قوي", "جزئي", "يعتمد على الأسئلة"]:
    L.append(f"| {k} | {before[k]} | {after[k]} |")
L.append(f"\n**عدد الصفات التي ترقّت بفضل الزوايا الجانبية: {len(upgrades)}**\n")
L.append("## الصفات التي ترقّت")
L.append("| # | الصفة | قبل | بعد | القياس الجانبي الذي فكّها |")
L.append("|--|--|--|--|--|")
for n, nm, vb, va, pm in upgrades:
    L.append(f"| {n} | {nm} | {vb} | {va} | {', '.join(pm)} |")
L.append("\n## خريطة الربط لكل صفة (أمامي | جانبي | يتحوّل لأسئلة)")
L.append("| # | الصفة | قياسات أمامية | قياسات جانبية (جديد) | متعذّر → أسئلة |")
L.append("|--|--|--|--|--|")
for r in rows:
    fm = ", ".join(r["frontal_metrics"]) or "—"
    pm = ", ".join(r["profile_metrics"]) or "—"
    q = ", ".join(sorted(set(r["to_questions"]))) or "—"
    L.append(f"| {r['num']} | {r['name']} | {fm} | {pm} | {q} |")
io.open("phase3_out/traits_60_profile_link.md", "w", encoding="utf-8").write("\n".join(L))

print("=== BEFORE (front only) ===", dict(before))
print("=== AFTER  (front+profile) ===", dict(after))
print("upgraded traits:", len(upgrades))
for n, nm, vb, va, pm in upgrades:
    print(f"  #{n} {nm}: {vb} -> {va}  via {pm}")
print("\nwrote phase3_out/traits_60_profile_link.json + .md")
