"""
Phase 2 — Image-only Structural Filter.

Reads   : phase1_out/indicators_clean.json
Writes  : phase2_out/
  - indicators_classified.json   every indicator -> category + matched features
  - traits_kept.json             traits we can score from a static photo
  - traits_dropped.json          traits removed, with reason
  - trait_feature_map.json       per kept trait: feature mapping + confidence
  - summary.md                   human-readable report
"""

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC  = ROOT / "phase1_out" / "indicators_clean.json"
OUT  = ROOT / "phase2_out"
OUT.mkdir(exist_ok=True)

# =====================================================================
# 1) CATEGORY CLASSIFIER  (priority order: verbal > posture > behavioral
#                          > structural > ambiguous)
# =====================================================================

VERBAL_MARKERS = [
    "يقول", "تقول", "ينطق", "تنطق", "يكرر", "يكرّر", "يهمس", "تهمس",
    "يسأل", "تسأل", "يتكلم", "تتكلم", "يردد", "تردد", "كلمات",
    "يصرح", "يعترف", "ينادي",
    # voice properties are audio, not image
    "صوت رتيب", "صوت ناعم", "صوت", "نبرة", "نبرته",
]
# quotation marks indicate verbatim speech
QUOTE_CHARS = ["“", "”", "\"", "«", "»", "ʼ"]

POSTURE_MARKERS = [
    "جسد", "كتف", "كتفين", "ظهر", "رقبة", "عنق",
    "يميل", "تميل", "ينحني", "تنحني", "وقفة", "يديه", "يداه",
    "اليدين", "اليد", "أصابع",
]

# Dynamic / time-varying verbs that need video to observe
BEHAVIORAL_MARKERS = [
    # gaze dynamics
    "تستقر", "لا تستقر", "تهدأ", "لا تهدأ", "تتبع", "تتابع",
    "تراقب", "تُراقب", "تتجنّب", "تتجنب", "تنسحب", "تومض",
    "تلمع", "تبحث", "تهرب", "ترفض", "تطلب", "تستدير",
    "تتحرك", "ينظر", "تنظر", "نظرة جانبية", "يلمع", "تومض",
    "متردد", "يتردد", "حذرة الحركة", "سريع", "سريعة", "بطيء", "بطيئة",
    # micro-expressions / momentary changes
    "تغيّر", "تغير", "يتغير", "ينقبض", "تنقبض", "ترتجف", "متغيرة",
    "تتقلص", "تتسع", "تنفرج", "ابتسامة سريعة", "لحظية", "لحظة",
    "مفاجئ", "مفاجئة", "حركة حاجب", "حركة شفة", "حركة وجه", "حركة رأس",
    # mouth/face dynamics
    "يتهرب", "يكتم", "يبتلع", "يحجم", "يتراجع",
    "يبتسم", "يضحك", "يصمت", "ابتسامة", "تبسم",
    # breathing
    "تنفس", "تنفّس", "تنفسه",
    # general behavioral context (temporal conditions)
    "يتأذى", "يحتاج", "يبحث", "يهتم", "يلتفت", "يميل إلى",
    "عند الحديث", "أثناء الحديث", "عند المدح", "عند النقد",
    "عند الذكر", "عند المقارنة", "عند الحرج", "عند بدء",
    "قبل الإجابة", "بعد الإجابة", "في التفاعل", "في لحظات",
    "في الإجابة", "أثناء", "حين", "حينما", "حال",
    "رغم", "دائمًا", "دائم", "دائما", "بسرعة", "بسهولة", "تكرار",
    "ارتباك", "قلق", "متناقض", "متناقضة", "خضوع",
    # gaze quality with movement context
    "النظر المباشر", "تواصل بصري", "تواصل العين",
]

# =====================================================================
# 2) STRUCTURAL FEATURE LEXICON
#    phrase pattern  ->  (feature_name, direction, region)
#    direction is just for the human-readable mapping
# =====================================================================

STRUCTURAL_RULES = [
    # ---- LIPS / MOUTH SHAPE -------------------------------------------------
    (r"شفاه?\s*ممتلئ|شفت[اي]ن?\s*ممتلئ|شفاه?\s*كبير|شفت[اي]ن?\s*كبير",
                                                              "mouth_height_ratio",      "high", "lips"),
    (r"شفاه?\s*رفيع|شفاه?\s*رقيق|شفاه?\s*ضيق|شفاه?\s*صغير",     "mouth_height_ratio",      "low",  "lips"),
    (r"شفة\s*علوية\s*ممتلئ|شفة\s*علوية\s*كبير",                "upper_lip_ratio",         "high", "lips"),
    (r"شفة\s*علوية\s*رفيع|شفة\s*علوية\s*رقيق|شفة\s*علوية\s*قص", "upper_lip_ratio",         "low",  "lips"),
    (r"شفة\s*سفلية\s*ممتلئ|شفة\s*سفلية\s*كبير",                "lower_lip_ratio",         "high", "lips"),
    (r"شفة\s*سفلية\s*رفيع|شفة\s*سفلية\s*رقيق|شفة\s*سفلية\s*قص", "lower_lip_ratio",         "low",  "lips"),
    (r"شفاه?\s*مشدود|فم\s*مشدود|شفاه?\s*متوتر",                "mouth_tension_ratio",     "high", "mouth"),
    (r"فم\s*مغلق(?!\s*بسهولة)",                                "mouth_open_ratio",        "low",  "mouth"),
    (r"فم\s*عريض|فم\s*واسع|فم\s*كبير",                         "mouth_width_ratio",       "high", "mouth"),
    (r"فم\s*ضيق|فم\s*صغير",                                    "mouth_width_ratio",       "low",  "mouth"),
    (r"(زوايا|أطراف)\s*الفم\s*(لأعلى|للأعلى|مرتفع|صاعد)",        "mouth_corner_tilt",       "up",   "mouth"),
    (r"(زوايا|أطراف)\s*الفم\s*(لأسفل|للأسفل|منخفض|هابط|نازل)|فم\s*مائل\s*للأسفل|شفاه?\s*مائلة\s*للأسفل",
                                                              "mouth_corner_tilt",       "down", "mouth"),

    # ---- CHIN ---------------------------------------------------------------
    (r"ذقن\s*مدبب|ذقن\s*مستدق|ذقن\s*ضيق",                       "chin_width_ratio",        "low",  "chin"),
    (r"ذقن\s*مربع|ذقن\s*عريض",                                  "chin_width_ratio",        "high", "chin"),
    (r"ذقن\s*مستدير|ذقن\s*دائري",                               "chin_roundness",          "high", "chin"),
    (r"ذقن\s*بارز|ذقن\s*مت\s*قدم|ذقن\s*متقدم|ذقن\s*مشدود",      "chin_projection_ratio",   "high", "chin"),
    (r"ذقن\s*غائر|ذقن\s*مرتد|ذقن\s*للداخل|ذقن\s*راجع",          "chin_projection_ratio",   "low",  "chin"),
    (r"ذقن\s*ناعم|ذقن\s*ثابت|ذقن\s*هادئ",                        "chin_width_ratio",        "mid",  "chin"),
    (r"ذقن\s*مشقوق|دمل\s*الذقن",                                 "chin_dimple",             "yes",  "chin"),

    # ---- JAW ----------------------------------------------------------------
    (r"فك\s*عريض|فكّ\s*عريض|فك\s*قوي|فك\s*مربع",                 "jaw_width_ratio",         "high", "jaw"),
    (r"فك\s*ضيق|فكّ\s*ضيق|فك\s*ناعم|فك\s*صغير",                  "jaw_width_ratio",         "low",  "jaw"),
    (r"فك\s*بارز|زاوية\s*الفك\s*حادة",                            "jaw_angle_sharpness",     "high", "jaw"),

    # ---- FOREHEAD -----------------------------------------------------------
    (r"جبهة\s*عريض|جبين\s*عريض",                                 "forehead_width_ratio",    "high", "forehead"),
    (r"جبهة\s*ضيق|جبين\s*ضيق",                                   "forehead_width_ratio",    "low",  "forehead"),
    (r"جبهة\s*عالي|جبهة\s*مرتفع|جبين\s*مرتفع",                    "forehead_ratio",          "high", "forehead"),
    (r"جبهة\s*قص|جبهة\s*منخفض|جبين\s*منخفض",                     "forehead_ratio",          "low",  "forehead"),
    (r"جبهة\s*خالية\s*من\s*التجاعيد|جبهة\s*ناعم|جبهة\s*هادئ",     "forehead_smoothness",     "high", "forehead"),

    # ---- BROW ---------------------------------------------------------------
    (r"حواجب?\s*متقارب|حواجب?\s*مت\s*قارب",                       "brow_inner_distance",     "low",  "brow"),
    (r"حواجب?\s*متباعد",                                          "brow_inner_distance",     "high", "brow"),
    (r"حواجب?\s*مرتفع|حواجب?\s*عالي",                              "brow_eye_distance_ratio", "high", "brow"),
    (r"حواجب?\s*منخفض|حواجب?\s*قريب\s*من\s*الع|حاجبان?\s*قريب",   "brow_eye_distance_ratio", "low",  "brow"),
    (r"حواجب?\s*كثيف|حاجبان?\s*كثيف",                              "brow_density",            "high", "brow"),
    (r"حواجب?\s*رقيق|حواجب?\s*خفيف",                               "brow_density",            "low",  "brow"),
    (r"حواجب?\s*مستقيم",                                          "brow_tilt",               "flat", "brow"),
    (r"حواجب?\s*مائلة?\s*(للأعلى|لأعلى|نحو\s*الأعلى)",             "brow_tilt",               "up",   "brow"),
    (r"حواجب?\s*مائلة?\s*(للأسفل|لأسفل|نحو\s*الأسفل|نحو\s*الداخل)","brow_tilt",               "down", "brow"),
    (r"حواجب?\s*مشدود|حاجبان?\s*مشدود|حواجب?\s*مقطب",              "brow_tension",            "high", "brow"),

    # ---- EYE SHAPE (static structural only, NOT gaze) -----------------------
    (r"عيون?\s*كبير|عينان?\s*كبيرت|عين\s*واسع|عيون?\s*واسع",       "eye_open_ratio",          "high", "eye"),
    (r"عيون?\s*صغير|عينان?\s*صغير|عين\s*ضيق",                      "eye_open_ratio",          "low",  "eye"),
    (r"عيون?\s*مستدير|عين\s*دائري",                                "eye_roundness",           "high", "eye"),
    (r"عيون?\s*لوزي|عين\s*لوزي",                                   "eye_roundness",           "low",  "eye"),
    (r"عينان?\s*متقاربت|عين\s*متقارب",                              "eye_spacing_ratio",       "low",  "eye"),
    (r"عينان?\s*متباعدت|عين\s*متباعد",                              "eye_spacing_ratio",       "high", "eye"),
    (r"زاوية\s*العين\s*(للأعلى|لأعلى|مرتفع)|عين\s*مائلة\s*للأعلى",  "eye_tilt_ratio",          "up",   "eye"),
    (r"زاوية\s*العين\s*(للأسفل|لأسفل|منخفض)|عين\s*مائلة\s*للأسفل",  "eye_tilt_ratio",          "down", "eye"),
    (r"جفون?\s*ثقيل|جفن\s*متدلي|جفون?\s*منسدل",                     "upper_lid_coverage",      "high", "eye"),
    (r"جفون?\s*مفتوح|جفون?\s*مرتفع",                                "upper_lid_coverage",      "low",  "eye"),

    # ---- NOSE ---------------------------------------------------------------
    (r"أنف\s*طويل|أنف\s*مستطيل",                                   "nose_length_ratio",       "high", "nose"),
    (r"أنف\s*قصير",                                                "nose_length_ratio",       "low",  "nose"),
    (r"أنف\s*عريض|أنف\s*كبير",                                     "nose_width_ratio",        "high", "nose"),
    (r"أنف\s*ضيق|أنف\s*رفيع|أنف\s*دقيق|أنف\s*صغير",                "nose_width_ratio",        "low",  "nose"),
    (r"أنف\s*مدبب|طرف\s*الأنف\s*مدبب",                              "nose_tip_sharpness",      "high", "nose"),
    (r"أنف\s*مستقيم",                                              "nose_bridge_straightness","high", "nose"),
    (r"أنف\s*أفطس|طرف\s*الأنف\s*(لأعلى|للأعلى|مرتفع)",              "nose_tip_drop_ratio",     "up",   "nose"),
    (r"طرف\s*الأنف\s*(لأسفل|للأسفل|منخفض|نازل)",                    "nose_tip_drop_ratio",     "down", "nose"),

    # ---- CHEEK --------------------------------------------------------------
    (r"خد(ود|ّ)?\s*بارز|عظمة\s*الخد\s*بارز|وجنتان?\s*بارز|عظام\s*الخد\s*بارز",
                                                                  "cheekbone_prominence",    "high", "cheek"),
    (r"خد(ود|ّ)?\s*غائر|وجنتان?\s*غائر|خد(ود|ّ)?\s*منخفض",          "cheekbone_prominence",    "low",  "cheek"),
    (r"خد(ود|ّ)?\s*ممتلئ|وجنتان?\s*ممتلئ|وجنتان?\s*ناعم",           "cheek_fullness",          "high", "cheek"),

    # ---- FACE SHAPE ---------------------------------------------------------
    (r"وجه\s*مستدير|وجه\s*دائري",                                  "face_aspect_ratio",       "high", "face"),
    (r"وجه\s*طويل|وجه\s*مستطيل",                                    "face_aspect_ratio",       "low",  "face"),
    (r"وجه\s*مربع",                                                "face_squareness",         "high", "face"),
    (r"وجه\s*مثلث|وجه\s*هرمي",                                      "face_triangularity",      "high", "face"),
    (r"وجه\s*بيضاوي",                                              "face_aspect_ratio",       "mid",  "face"),
    (r"ملامح\s*ناعم|وجه\s*ناعم",                                    "feature_softness",        "high", "face"),
    (r"ملامح\s*حاد|وجه\s*حاد|ملامح\s*قوي",                          "feature_softness",        "low",  "face"),
    (r"وجه\s*متماثل|وجه\s*متناسق|تماثل\s*ملامح",                   "face_symmetry",           "high", "face"),
    (r"وجه\s*غير\s*متماثل|عدم\s*تماثل",                            "face_symmetry",           "low",  "face"),

    # ---- STATIC GAZE QUALITY visible in a single photo ----------------------
    # (warm vs sharp gaze can be approximated by eye_open + brow_tilt;
    #  classify as structural but with LOW confidence)
    (r"نظرة\s*دافئ|عين\s*دافئة\s*النظرة|عين\s*هادئ",               "eye_warmth_proxy",        "high", "eye"),
    (r"نظرة\s*حاد|نظرة\s*صارم|نظرة\s*قوي",                          "eye_warmth_proxy",        "low",  "eye"),

    # =====================================================================
    # EXTENSION SET  — added in the lexicon-expansion pass
    # =====================================================================

    # ---- BROW additions (dual form + arch + tension) -----------------------
    (r"حاجبان?\s*مستقيم|حاجبين?\s*مستقيم",                          "brow_tilt",               "flat", "brow"),
    (r"حاجبان?\s*مقوس|حاجبين?\s*مقوس|حواجب?\s*مقوس",                "brow_arch",               "high", "brow"),
    (r"حاجبان?\s*متقارب|حاجبين?\s*متقارب|تقارب\s*(مفرط\s*)?ب[يـ]?ن\s*الحاجب", "brow_inner_distance", "low", "brow"),
    (r"حاجبان?\s*متباعد|حاجبين?\s*متباعد",                          "brow_inner_distance",     "high", "brow"),
    (r"حاجبان?\s*مرتفع|حاجبين?\s*مرتفع",                            "brow_eye_distance_ratio", "high", "brow"),
    (r"حاجبان?\s*كثيف|حاجبين?\s*كثيف",                              "brow_density",            "high", "brow"),
    (r"حاجبان?\s*رقيق|حاجبين?\s*رقيق|حاجبان?\s*خفيف",               "brow_density",            "low",  "brow"),
    (r"حاجبان?\s*مشدود|حاجبين?\s*مشدود|شدّ\s*(بسيط)?\s*(في)?\s*الحاجب", "brow_tension",        "high", "brow"),
    (r"حاجبان?\s*واضح(ة|ا)?\s*الحدود",                              "brow_definition",         "high", "brow"),

    # ---- EYE additions (dual + lids + lashes) ------------------------------
    (r"عينان?\s*كبير|عينين?\s*كبير",                                "eye_open_ratio",          "high", "eye"),
    (r"عينان?\s*صغير|عينين?\s*صغير",                                "eye_open_ratio",          "low",  "eye"),
    (r"عينان?\s*مستدير",                                            "eye_roundness",           "high", "eye"),
    (r"عينان?\s*لوزي",                                              "eye_roundness",           "low",  "eye"),
    (r"عينان?\s*ضيقت|عينين?\s*ضيق",                                 "eye_open_ratio",          "low",  "eye"),
    (r"عينان?\s*واسعت|عينين?\s*واسع",                               "eye_open_ratio",          "high", "eye"),
    (r"عينان?\s*غائر|عيون?\s*غائر",                                 "eye_depth",               "high", "eye"),
    (r"عينان?\s*بارز|عيون?\s*بارز|عيون?\s*جاحظ",                    "eye_depth",               "low",  "eye"),
    (r"جفن\s*علوي\s*منخفض|جفن\s*منسدل|جفون?\s*ثقيل|جفن\s*متدلي",   "upper_lid_coverage",      "high", "eye"),
    (r"جفن\s*علوي\s*مرتفع|جفون?\s*مفتوح|جفون?\s*مرتفع",             "upper_lid_coverage",      "low",  "eye"),
    (r"رموش\s*كثيف|رموش\s*طويل",                                    "lash_density",            "high", "eye"),

    # ---- LIPS / MOUTH additions --------------------------------------------
    (r"شفة\s*سفلية\s*بارز",                                          "lower_lip_protrusion",    "high", "lips"),
    (r"شفة\s*علوية\s*مشدود|شفة\s*عليا\s*مشدود",                      "upper_lip_tension",       "high", "lips"),
    (r"شفة\s*سفلية\s*مضموم",                                         "lower_lip_tension",       "high", "lips"),
    (r"خط\s*الفم\s*مستقر|فم\s*مستقر",                                "mouth_stability",         "high", "mouth"),
    (r"توتر\s*(دائم)?\s*حول\s*الفم|توتر\s*(في)?\s*عضلات\s*الفم",     "mouth_tension_ratio",     "high", "mouth"),
    (r"فم\s*يُغلق\s*بشكل|فم\s*مطبق",                                 "mouth_open_ratio",        "low",  "mouth"),
    (r"فم\s*مائل\s*للأسفل|شفاه?\s*مائلة?\s*للأسفل",                  "mouth_corner_tilt",       "down", "mouth"),

    # ---- FOREHEAD additions ------------------------------------------------
    (r"جبهة\s*مشدود|جبهة\s*مقطب|جبهة\s*متوتر",                       "forehead_tension",        "high", "forehead"),
    (r"جبهة\s*ملس|جبهة\s*ناعم|جبهة\s*هادئ|جبهة\s*مرتاح",             "forehead_smoothness",     "high", "forehead"),
    (r"جبهة\s*واسع",                                                  "forehead_width_ratio",    "high", "forehead"),
    (r"جبهة\s*ضيق",                                                   "forehead_width_ratio",    "low",  "forehead"),
    (r"خطوط\s*(عميقة|محفورة)?\s*(في)?\s*الجبهة|تجاعيد\s*الجبهة\s*عميق", "forehead_lines",        "high", "forehead"),
    (r"خالية?\s*من\s*التجاعيد",                                       "forehead_lines",          "low",  "forehead"),
    (r"جبهة\s*مستقيم",                                                "forehead_shape",          "flat", "forehead"),

    # ---- JAW additions -----------------------------------------------------
    (r"زاوية\s*الفك\s*حاد",                                           "jaw_angle_sharpness",     "high", "jaw"),
    (r"زاوية\s*الفك\s*ناعم|زاوية\s*الفك\s*مستدير",                    "jaw_angle_sharpness",     "low",  "jaw"),

    # ---- CHIN additions ----------------------------------------------------
    (r"ذقن\s*مائل\s*للأمام",                                          "chin_projection_ratio",   "high", "chin"),
    (r"ذقن\s*ثابت|ذقن\s*هادئ",                                        "chin_stability",          "high", "chin"),

    # ---- NOSE additions ----------------------------------------------------
    (r"فتحات?\s*أنف\s*(متوسع|مفتوح|عريض|كبير)",                       "nostril_width_ratio",     "high", "nose"),
    (r"فتحات?\s*أنف\s*(ضيق|صغير)",                                    "nostril_width_ratio",     "low",  "nose"),
    (r"أرنبة\s*الأنف\s*كبير|أرنبة\s*الأنف\s*بارز",                    "nose_tip_size",           "high", "nose"),
    (r"أرنبة\s*الأنف\s*صغير",                                         "nose_tip_size",           "low",  "nose"),
    (r"جسر\s*الأنف\s*عالي|قنطرة\s*الأنف\s*عالي",                      "nose_bridge_height",      "high", "nose"),
    (r"جسر\s*الأنف\s*منخفض",                                          "nose_bridge_height",      "low",  "nose"),

    # ---- CHEEK additions ---------------------------------------------------
    (r"عظام?\s*الخد\s*عالي|عظمة\s*الخد\s*عالي",                       "cheekbone_height",        "high", "cheek"),
    (r"وجنتان?\s*ممتلئت?|خد(ود|ّ)?\s*طفولي",                          "cheek_fullness",          "high", "cheek"),

    # ---- GLOBAL FACE TONE / MUSCLE TENSION (visible in still photo) --------
    (r"عضلات?\s*وجه\s*(غير\s*مشدود|مرتخي|مرن|هادئ)",                   "face_muscle_tension",     "low",  "face"),
    (r"عضلات?\s*وجه\s*مشدود|توتر\s*(في)?\s*عضلات\s*الوجه",            "face_muscle_tension",     "high", "face"),
    (r"ملامح\s*ثابت|وجه\s*ثابت\s*التعب",                              "feature_rigidity",        "high", "face"),
    (r"ملامح\s*متماسك",                                                "feature_rigidity",        "high", "face"),

    # ---- final stragglers caught in v3 review ------------------------------
    (r"عينان?\s*ناعس|عيون?\s*ناعس",                                    "upper_lid_coverage",      "high", "eye"),
    (r"حواجب?\s*غير\s*حاد|حاجبان?\s*غير\s*حاد",                        "brow_definition",         "low",  "brow"),
    (r"حاجب\s*واحد\s*مائل|عدم\s*تماثل\s*الحاجب",                       "brow_symmetry",           "low",  "brow"),
    (r"حواجب?\s*حاد|حاجبان?\s*حاد",                                    "brow_definition",         "high", "brow"),
    (r"شفاه?\s*مرن|شفة\s*مرن",                                         "lip_flexibility",         "high", "lips"),
    (r"شفة\s*مشدود\s*للخارج",                                          "mouth_tension_ratio",     "high", "mouth"),
]

STRUCTURAL_RULES = [(re.compile(p), feat, d, r) for p, feat, d, r in STRUCTURAL_RULES]

# =====================================================================
# 3) HELPERS
# =====================================================================

def has_any(text, markers):
    return any(m in text for m in markers)

# Arabic words that LOOK like verbs (ي-/ت- prefix) but are actually nouns
# we use in structural descriptions — exclude them from the verb heuristic.
NOUN_EXCEPTIONS = {
    "تعابير", "تعبير", "توتر", "تماسك", "تماثل", "تجاعيد", "تباعد", "تقارب",
    "تجنّب", "تأمل", "تركيز", "تأثر", "ترهل", "تورّم", "تورم",
    "يد", "يدين", "يداه", "يوم",
}
VERB_PATTERN = re.compile(r"\b[يت][ء-ي]{3,}\b")

def looks_like_verb_phrase(clean: str) -> bool:
    """True if phrase contains a present-tense verb (ي/ت + 3+ Arabic letters)
    that is not in the noun-exception list."""
    for m in VERB_PATTERN.finditer(clean):
        if m.group() not in NOUN_EXCEPTIONS:
            return True
    return False

def classify_indicator(clean: str, norm: str):
    """Return (category, matched_features)."""
    # 1. verbal first  (quoted speech or speech verbs)
    if any(q in clean for q in QUOTE_CHARS):
        return "verbal", []
    if has_any(clean, VERBAL_MARKERS):
        return "verbal", []
    # 2. posture / body
    if has_any(clean, POSTURE_MARKERS):
        return "posture_body", []
    # 3. behavioral verbs (dynamic)
    if has_any(clean, BEHAVIORAL_MARKERS):
        return "non_image_behavioral", []
    # 4. structural lexicon match
    feats = []
    for rx, feat, direction, region in STRUCTURAL_RULES:
        if rx.search(clean):
            feats.append({"feature": feat, "direction": direction, "region": region})
    if feats:
        return "structural_image", feats
    # 5. implicit-verb fallback: any unrecognised phrase with a present-tense verb
    #    is treated as behavioural (a static photo cannot capture an action).
    if looks_like_verb_phrase(clean):
        return "non_image_behavioral", []
    # 6. true fallback — short static state we couldn't map
    return "ambiguous", []

# =====================================================================
# 4) MAIN
# =====================================================================

def main():
    traits = json.loads(SRC.read_text(encoding="utf-8"))

    # Load original trait metadata (name etc.) from master
    master = json.loads((ROOT/"free_host_package"/"firasa_master_dataset.json").read_text(encoding="utf-8"))
    meta_by_id = {t["id"]: t for t in master["sabti_traits"]}

    classified_indicators = []   # flat list of per-indicator classification
    per_trait = {}               # trait_id -> {cats Counter, feats list, indicators[]}

    for t in traits:
        per_trait[t["id"]] = {
            "id": t["id"],
            "name": t["name"],
            "indicators": [],
            "category_counts": Counter(),
            "feature_hits": [],
        }
        for ind in t["indicators"]:
            cat, feats = classify_indicator(ind["clean"], ind["norm"])
            entry = {
                "trait_id": t["id"],
                "raw": ind["raw"],
                "clean": ind["clean"],
                "category": cat,
                "features": feats,
            }
            classified_indicators.append(entry)
            per_trait[t["id"]]["indicators"].append(entry)
            per_trait[t["id"]]["category_counts"][cat] += 1
            per_trait[t["id"]]["feature_hits"].extend(feats)

    # ---------- decide keep / drop ----------
    KEEP_MIN_STRUCTURAL = 2        # at least this many structural indicators
    KEEP_MIN_RATIO      = 0.50     # structural / total >= this

    kept, dropped = [], []
    for tid, info in per_trait.items():
        cc = info["category_counts"]
        total = sum(cc.values())
        struct = cc.get("structural_image", 0)
        ratio  = struct / total if total else 0
        # confidence
        if struct >= 3 and ratio >= 0.75:
            conf = "high"
        elif struct >= 2 and ratio >= 0.50:
            conf = "medium"
        elif struct >= 1:
            conf = "low"
        else:
            conf = "none"

        record = {
            "id": tid,
            "name": info["name"],
            "total_indicators": total,
            "structural_image": struct,
            "non_image_behavioral": cc.get("non_image_behavioral", 0),
            "verbal":               cc.get("verbal", 0),
            "posture_body":         cc.get("posture_body", 0),
            "ambiguous":            cc.get("ambiguous", 0),
            "structural_ratio": round(ratio, 2),
            "confidence": conf,
        }

        if struct >= KEEP_MIN_STRUCTURAL and ratio >= KEEP_MIN_RATIO:
            # feature mapping (deduped, aggregated by feature+direction)
            agg = defaultdict(int)
            regions = Counter()
            for f in info["feature_hits"]:
                agg[(f["feature"], f["direction"])] += 1
                regions[f["region"]] += 1
            record["features"] = [
                {"feature": fname, "direction": d, "hits": n}
                for (fname, d), n in sorted(agg.items(), key=lambda kv: -kv[1])
            ]
            record["regions"] = regions.most_common()
            record["structural_indicators"] = [
                e["clean"] for e in info["indicators"] if e["category"] == "structural_image"
            ]
            kept.append(record)
        else:
            # reason
            if total == 0:
                reason = "no indicators"
            elif struct == 0:
                reason = "0 structural indicators"
            elif struct < KEEP_MIN_STRUCTURAL:
                reason = f"only {struct} structural indicator(s)"
            else:
                reason = f"structural ratio {ratio:.0%} < {int(KEEP_MIN_RATIO*100)}%"
            # dominant non-structural category
            non_struct = {k:v for k,v in cc.items() if k != "structural_image"}
            if non_struct:
                dom = max(non_struct.items(), key=lambda kv: kv[1])
                reason += f"; dominated by {dom[0]} ({dom[1]})"
            record["drop_reason"] = reason
            dropped.append(record)

    # ---------- write outputs ----------
    (OUT/"indicators_classified.json").write_text(
        json.dumps(classified_indicators, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT/"traits_kept.json").write_text(
        json.dumps(kept, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT/"traits_dropped.json").write_text(
        json.dumps(dropped, ensure_ascii=False, indent=2), encoding="utf-8")

    # trait_feature_map.json — slim version for engine consumption
    feat_map = []
    for k in kept:
        feat_map.append({
            "id": k["id"], "name": k["name"], "confidence": k["confidence"],
            "features": k["features"], "regions": k["regions"],
        })
    (OUT/"trait_feature_map.json").write_text(
        json.dumps(feat_map, ensure_ascii=False, indent=2), encoding="utf-8")

    # ---------- summary.md ----------
    cat_total = Counter()
    for e in classified_indicators:
        cat_total[e["category"]] += 1

    conf_count = Counter(k["confidence"] for k in kept)
    lines = []
    lines.append("# Phase 2 — Image-only Structural Filter\n")
    lines.append(f"- Total traits        : {len(per_trait)}")
    lines.append(f"- **KEPT** (image-only): **{len(kept)}**")
    lines.append(f"- DROPPED              : {len(dropped)}")
    lines.append("")
    lines.append("## Indicator category breakdown (occurrences)")
    for c, n in cat_total.most_common():
        lines.append(f"- {c}: {n}")
    lines.append("")
    lines.append("## Kept traits — confidence")
    for c in ("high", "medium", "low"):
        lines.append(f"- {c}: {conf_count.get(c,0)}")
    lines.append("")
    lines.append("## Drop reasons (top)")
    rc = Counter(d["drop_reason"].split(";")[0] for d in dropped)
    for r, n in rc.most_common(10):
        lines.append(f"- {n:4d}  {r}")
    lines.append("")
    lines.append("## Top kept traits (by # structural indicators)")
    for k in sorted(kept, key=lambda x: -x["structural_image"])[:25]:
        feats = ", ".join(f"{f['feature']}({f['direction']})" for f in k["features"][:4])
        lines.append(f"- {k['id']}  **{k['name']}**  [{k['confidence']}]  → {feats}")
    (OUT/"summary.md").write_text("\n".join(lines), encoding="utf-8")

    # console
    print(f"traits total : {len(per_trait)}")
    print(f"  kept       : {len(kept)}")
    print(f"  dropped    : {len(dropped)}")
    print(f"confidence   : {dict(conf_count)}")
    print(f"categories   : {dict(cat_total)}")
    print(f"outputs in   : {OUT}")

if __name__ == "__main__":
    import sys; sys.stdout.reconfigure(encoding="utf-8")
    main()
