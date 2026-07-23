import json
import re
from types import SimpleNamespace
from pathlib import Path

import cv2
import fitz
import numpy as np
from pypdf import PdfReader

from process_firasa_day1 import (
    PDF_LABELS_COMPLETE as DAY1_LABELS,
    SINGLE_FACE_PAGES_COMPLETE as DAY1_SINGLES,
    PAGES_TO_IGNORE as DAY1_IGNORE,
    ROOT,
    build_inventory as build_day1_inventory,
    clean_text,
    compute_metrics,
    crop_with_padding,
    detect_faces_retry,
    find_day1_pdf,
    load_existing_dataset,
    make_landmarker,
    merge_dataset,
    page_face_entries,
    best_face_from_crop,
    rebase_landmarks,
)


def pair_pages(start, sample_count=2):
    return list(range(start, start + sample_count))


DAYS = {
    "day2": {
        "pdf": "   .pdf",
        "page_limit": 91,
        "section_ar": "الحاجبان والعينان",
        "traits": [
            {"id": "eyebrow_01", "trait_ar": "الاندماج الاجتماعي", "trait_en": "social_integration", "summary_page": 5, "pages": [6, 7, 8], "view": "frontal", "states": [{"state_ar": "الحاجب قريب ومنخفض عن العين", "code": "close_low"}, {"state_ar": "الحاجب بعيد ومرتفع عن العين", "code": "far_high"}], "interp_pages": [9]},
            {"id": "eyebrow_02", "trait_ar": "تقدير النواحي الجمالية", "trait_en": "aesthetic_appreciation", "summary_page": 5, "pages": [10, 11, 12], "view": "frontal", "states": [{"state_ar": "الحد السفلي للحاجب مستقيم", "code": "straight_lower_edge"}], "interp_pages": [13]},
            {"id": "eyebrow_03", "trait_ar": "الاهتمام بالتركيبات الميكانيكية", "trait_en": "mechanical_interest", "summary_page": 5, "pages": [14, 15, 16], "view": "frontal", "states": [{"state_ar": "الحاجب دائري الشكل", "code": "rounded_shape"}], "interp_pages": [17]},
            {"id": "eyebrow_04", "trait_ar": "التعبير الدرامي", "trait_en": "dramatic_expression", "summary_page": 5, "pages": [18, 19, 20], "view": "frontal", "states": [{"state_ar": "الحاجب يميل للأعلى", "code": "upward_slant"}], "interp_pages": [21]},
            {"id": "eyebrow_05", "trait_ar": "الاهتمام بطريقة تصميم الأشياء", "trait_en": "design_interest", "summary_page": 5, "pages": [22, 23, 24], "view": "frontal", "states": [{"state_ar": "يوجد زاوية حادة أعلى الحاجب", "code": "sharp_peak"}], "interp_pages": [25]},
            {"id": "eyebrow_06", "trait_ar": "الاهتمام بالدقة", "trait_en": "precision_interest", "summary_page": 5, "pages": [26, 27, 28], "view": "frontal", "states": [{"state_ar": "وجود خطين راسين بين الحاجبين", "code": "double_vertical_lines"}], "interp_pages": [29]},
            {"id": "eyebrow_07", "trait_ar": "الاهتمام بالتفاصيل", "trait_en": "detail_focus", "summary_page": 5, "pages": [30, 31, 32], "view": "frontal", "states": [{"state_ar": "وجود بروزات أعلى الجزء الداخلي للحاجبين", "code": "inner_brow_protrusions"}], "interp_pages": [33]},
            {"id": "eyebrow_08", "trait_ar": "منهجي ونظامي", "trait_en": "systematic_order", "summary_page": 5, "pages": [34, 35, 36], "view": "frontal", "states": [{"state_ar": "بروز الحد العظمي للحاجبين", "code": "brow_bone_prominence"}], "interp_pages": [37]},
            {"id": "eyebrow_09", "trait_ar": "التفصيل والإجمال", "trait_en": "detail_vs_overview", "summary_page": 5, "pages": [38, 39, 40], "view": "frontal", "states": [{"state_ar": "حاجب سميك", "code": "thick"}, {"state_ar": "حاجب نحيف", "code": "thin"}], "interp_pages": [41]},
            {"id": "eyebrow_10", "trait_ar": "الاجتماعية والاستقلالية", "trait_en": "sociability_vs_independence", "summary_page": 5, "pages": [42, 43, 44], "view": "frontal", "states": [{"state_ar": "حاجب طويل", "code": "long"}, {"state_ar": "حاجب قصير", "code": "short"}], "interp_pages": [45]},
            {"id": "eyebrow_11", "trait_ar": "التفكير", "trait_en": "continuous_thinking", "summary_page": 5, "pages": [46, 47, 48], "view": "frontal", "states": [{"state_ar": "حاجب متصل", "code": "connected"}], "interp_pages": [49]},
            {"id": "eyes_01", "trait_ar": "السماحة والتركيز", "trait_en": "tolerance_vs_focus", "summary_page": 53, "pages": [54, 55, 56], "view": "frontal", "states": [{"state_ar": "مسافة كبيرة بين العينين", "code": "wide_spacing"}, {"state_ar": "مسافة صغيرة بين العينين", "code": "narrow_spacing"}], "interp_pages": [57]},
            {"id": "eyes_02", "trait_ar": "الجدية والحماسة", "trait_en": "seriousness_vs_enthusiasm", "summary_page": 53, "pages": [58, 59, 60], "view": "frontal", "states": [{"state_ar": "عيون غائرة في الوجه", "code": "deep_set"}, {"state_ar": "عيون بارزة في الوجه", "code": "protruding"}], "interp_pages": [61]},
            {"id": "eyes_03", "trait_ar": "الميل إلى النقد", "trait_en": "critical_tendency", "summary_page": 53, "pages": [62, 63, 64], "view": "frontal", "states": [{"state_ar": "الزاوية الخارجية للعين منخفضة عن الداخلية", "code": "outer_lower"}, {"state_ar": "الزاوية الخارجية للعين مرتفعة عن الداخلية", "code": "outer_higher"}], "interp_pages": [65]},
            {"id": "eyes_04", "trait_ar": "الميل إلى التحليل", "trait_en": "analytical_tendency", "summary_page": 53, "pages": [66, 67, 68], "view": "frontal", "states": [{"state_ar": "الجفن العلوي غير ظاهر أو مغطى", "code": "covered_upper_lid"}, {"state_ar": "الجفن العلوي ظاهر تماما", "code": "visible_upper_lid"}], "interp_pages": [69]},
            {"id": "eyes_05", "trait_ar": "الإبداع وعدم التقليدية", "trait_en": "nonconformity_creativity", "summary_page": 53, "pages": [70, 71, 72], "view": "frontal", "states": [{"state_ar": "العينان ليستا على مستوى واحد", "code": "eye_level_asymmetry"}], "interp_pages": [73]},
            {"id": "eyes_06", "trait_ar": "الضغط النفسي", "trait_en": "psychological_stress", "summary_page": 53, "pages": [74, 75, 76], "view": "frontal", "states": [{"state_ar": "يظهر البياض تحت حدقة العين", "code": "sclera_below_iris"}], "interp_pages": [77]},
            {"id": "eyes_07", "trait_ar": "جاذبية العين", "trait_en": "eye_charisma", "summary_page": 53, "pages": [78, 79, 80], "view": "frontal", "states": [{"state_ar": "العين لها بريق", "code": "sparkling"}, {"state_ar": "العين باهتة اللون", "code": "dull"}], "interp_pages": [81]},
            {"id": "eyes_08", "trait_ar": "التعبير عن العاطفة", "trait_en": "emotional_expression", "summary_page": 53, "pages": [82, 83, 84], "view": "frontal", "states": [{"state_ar": "حدقة العين كبيرة", "code": "large_pupil"}, {"state_ar": "حدقة العين صغيرة", "code": "small_pupil"}], "interp_pages": [85]},
            {"id": "eyes_09", "trait_ar": "العاطفة والحذر", "trait_en": "emotion_vs_caution", "summary_page": 53, "pages": [86, 87, 88], "view": "frontal", "states": [{"state_ar": "عيون واسعة وكبيرة", "code": "large_wide"}, {"state_ar": "عيون ضيقة وصغيرة", "code": "small_narrow"}], "interp_pages": [89]},
        ],
    },
    "day3": {
        "pdf": "    (4 files merged).pdf",
        "page_limit": 38,
        "section_ar": "الأنف والأذنان",
        "traits": [
            {"id": "nose_01", "trait_ar": "الاعتماد على النفس", "trait_en": "self_reliance", "summary_page": 2, "pages": [3], "view": "frontal", "states": [{"state_ar": "فتحات الأنف عريضة وبعيدة عن القصبة", "code": "wide_detached"}, {"state_ar": "فتحات الأنف ضيقة وملتحمة مع القصبة", "code": "narrow_attached"}], "interp_pages": [4]},
            {"id": "nose_02", "trait_ar": "الإدارة والمساعدة", "trait_en": "management_vs_support", "summary_page": 2, "pages": [5], "view": "profile", "states": [{"state_ar": "الأنف المحدب", "code": "convex"}, {"state_ar": "الأنف المقعر", "code": "concave"}], "interp_pages": [6]},
            {"id": "nose_03", "trait_ar": "الشك والثقة", "trait_en": "skepticism_vs_trust", "summary_page": 2, "pages": [7], "view": "profile", "states": [{"state_ar": "طرف الأنف يميل للأسفل", "code": "tip_down"}, {"state_ar": "طرف الأنف يميل للأعلى", "code": "tip_up"}], "interp_pages": [8]},
            {"id": "nose_04", "trait_ar": "الرغبة لمعرفة الأخبار", "trait_en": "curiosity_for_news", "summary_page": 2, "pages": [9], "view": "frontal", "states": [{"state_ar": "امتلاء طرف الأنف الدائري", "code": "full_round_tip"}], "interp_pages": [10]},
            {"id": "nose_05", "trait_ar": "المشاعر المنقسمة", "trait_en": "divided_emotions", "summary_page": 2, "pages": [11, 12], "view": "frontal", "states": [{"state_ar": "الأنف المقسوم", "code": "split_tip"}], "interp_pages": [13]},
            {"id": "nose_06", "trait_ar": "الطموح والمرح", "trait_en": "ambition_vs_playfulness", "summary_page": 2, "pages": [14], "view": "profile", "states": [{"state_ar": "الأنف الطويل", "code": "long"}, {"state_ar": "الأنف القصير", "code": "short"}], "interp_pages": [15]},
            {"id": "nose_07", "trait_ar": "الأنف المحقق", "trait_en": "investigative_nose", "summary_page": 2, "pages": [16], "view": "frontal", "states": [{"state_ar": "الأنف المستوي", "code": "straight_nose"}], "interp_pages": [17]},
            {"id": "ear_01", "trait_ar": "المثالية أو العملية", "trait_en": "idealism_vs_practicality", "summary_page": 20, "pages": [21], "view": "profile", "states": [{"state_ar": "الأذن مرتفعة عن مستوى الأنف", "code": "high_set"}, {"state_ar": "الأذن منخفضة عن مستوى الأنف", "code": "low_set"}], "interp_pages": [22]},
            {"id": "ear_02", "trait_ar": "العيش في الماضي والمستقبل", "trait_en": "past_vs_future_orientation", "summary_page": 20, "pages": [23], "view": "profile", "states": [{"state_ar": "زيادة كتلة الرأس خلف الأذن", "code": "mass_behind_ear"}, {"state_ar": "معظم كتلة الرأس أمام الأذن", "code": "mass_in_front_ear"}], "interp_pages": [24]},
            {"id": "ear_03", "trait_ar": "النفعية والاكتساب", "trait_en": "acquisitiveness", "summary_page": 20, "pages": [25], "view": "profile", "states": [{"state_ar": "الأذن موازية وملاصقة للرأس", "code": "close_to_head"}, {"state_ar": "الأذن بعيدة عن الرأس", "code": "far_from_head"}], "interp_pages": [26]},
            {"id": "ear_04", "trait_ar": "الحيرة والتردد", "trait_en": "indecision", "summary_page": 20, "pages": [27], "view": "profile", "states": [{"state_ar": "موضع إحدى الأذنين يبدو متقدما", "code": "asymmetrical_position"}], "interp_pages": [28]},
            {"id": "ear_05", "trait_ar": "تقدير الموسيقى", "trait_en": "musical_appreciation", "summary_page": 20, "pages": [29], "view": "profile", "states": [{"state_ar": "الإطار الخارجي للأذن دائري", "code": "rounded_outer_ear"}], "interp_pages": [30]},
            {"id": "ear_06", "trait_ar": "حب الريادة", "trait_en": "leadership_innovation", "summary_page": 20, "pages": [31], "view": "profile", "states": [{"state_ar": "الإطار الخارجي للأذن مستقيم", "code": "straight_outer_ear"}], "interp_pages": [32]},
            {"id": "ear_07", "trait_ar": "حب التنمية", "trait_en": "growth_orientation", "summary_page": 20, "pages": [33], "view": "profile", "states": [{"state_ar": "شحمة الأذن كبيرة", "code": "large_earlobe"}], "interp_pages": [34]},
            {"id": "ear_08", "trait_ar": "حجم تشرب المعلومات", "trait_en": "information_capacity", "summary_page": 20, "pages": [35], "view": "frontal", "states": [{"state_ar": "الأذن الكبيرة", "code": "large"}, {"state_ar": "الأذن الصغيرة", "code": "small"}], "interp_pages": [36]},
        ],
    },
    "day4": {
        "pdf": "     .pdf",
        "page_limit": 77,
        "section_ar": "الوجنات والشفاه والخطوط والأسنان والفك والذقن",
        "traits": [
            {"id": "cheek_01", "trait_ar": "حب المغامرة", "trait_en": "adventure_drive", "summary_page": 4, "pages": [6, 7], "view": "frontal", "states": [{"state_ar": "الوجنات بارزة وممتلئة", "code": "prominent_full"}, {"state_ar": "الوجنات مسطحة وغير ممتلئة", "code": "flat"}], "interp_pages": [8]},
            {"id": "cheek_02", "trait_ar": "الإغراء", "trait_en": "seductiveness", "summary_page": 4, "pages": [9, 10], "view": "frontal", "states": [{"state_ar": "الغمازات", "code": "dimples"}], "interp_pages": [11]},
            {"id": "lip_01", "trait_ar": "العطاء التلقائي أو الانتقائي", "trait_en": "spontaneous_vs_selective_giving", "summary_page": 13, "pages": [14, 15], "view": "frontal", "states": [{"state_ar": "الشفة السفلى ممتلئة وغليظة", "code": "full_lower_lip"}, {"state_ar": "الشفة السفلى نحيفة ورقيقة", "code": "thin_lower_lip"}], "interp_pages": [16]},
            {"id": "lip_02", "trait_ar": "أسلوب التعبير اللفظي", "trait_en": "verbal_expression_style", "summary_page": 13, "pages": [17, 18], "view": "frontal", "states": [{"state_ar": "الشفة العليا ممتلئة وغليظة", "code": "full_upper_lip"}, {"state_ar": "الشفة العليا نحيفة ورقيقة", "code": "thin_upper_lip"}], "interp_pages": [19]},
            {"id": "lip_03", "trait_ar": "الاندفاع والتهور", "trait_en": "impulsiveness_vs_caution", "summary_page": 13, "pages": [20, 21], "view": "profile", "states": [{"state_ar": "بروز الشفتين إلى الخارج", "code": "protruding"}, {"state_ar": "انحسار الشفتين للداخل", "code": "receding"}], "interp_pages": [22]},
            {"id": "lip_04", "trait_ar": "التفاؤل والتشاؤم", "trait_en": "optimism_vs_pessimism", "summary_page": 13, "pages": [23, 24], "view": "frontal", "states": [{"state_ar": "زوايا الشفاه تميل إلى الأعلى", "code": "corners_up"}, {"state_ar": "زوايا الشفاه تميل للأسفل", "code": "corners_down"}], "interp_pages": [25]},
            {"id": "lip_05", "trait_ar": "النشاط البدني أو الذهني", "trait_en": "physical_vs_mental_inclination", "summary_page": 13, "pages": [26, 27], "view": "frontal", "states": [{"state_ar": "مسافة صغيرة من أسفل الأنف والشفة العليا", "code": "short_philtrum"}, {"state_ar": "مسافة كبيرة من أسفل الأنف إلى الشفة العليا", "code": "long_philtrum"}], "interp_pages": [28]},
            {"id": "lip_06", "trait_ar": "كتمان الأسرار أو البوح بها", "trait_en": "disclosure_vs_secrecy", "summary_page": 13, "pages": [29, 30], "view": "frontal", "states": [{"state_ar": "شفة ممتلئة", "code": "full_lips"}, {"state_ar": "شفة نحيفة", "code": "thin_lips"}], "interp_pages": [31]},
            {"id": "lines_01", "trait_ar": "استخدام التعبيرات الوجهية", "trait_en": "facial_expression_usage", "summary_page": 35, "pages": [36, 37], "view": "frontal", "states": [{"state_ar": "توجد خطوط عميقة من جانب الأنف وحتى جانب الفم", "code": "deep_nasolabial"}, {"state_ar": "لا توجد خطوط بجانب الفم", "code": "no_nasolabial"}], "interp_pages": [38]},
            {"id": "lines_02", "trait_ar": "البلاغة والفصاحة", "trait_en": "eloquence", "summary_page": 35, "pages": [39, 40], "view": "frontal", "states": [{"state_ar": "خطين أفقيين تحت الجفن السفلي للعين", "code": "lower_eyelid_lines"}], "interp_pages": [41]},
            {"id": "lines_03", "trait_ar": "الفكاهة والدعابة", "trait_en": "humor", "summary_page": 35, "pages": [42, 43], "view": "frontal", "states": [{"state_ar": "خطوط إشعاعية من طرف العين", "code": "crows_feet"}], "interp_pages": [44]},
            {"id": "lines_04", "trait_ar": "الأمانة والروحانية", "trait_en": "honesty_vs_spirituality", "summary_page": 35, "pages": [45, 46], "view": "frontal", "states": [{"state_ar": "الخطوط الأفقية المستقيمة غير مقسمة", "code": "continuous_lines"}, {"state_ar": "الخطوط الأفقية المستقيمة مقسمة", "code": "broken_lines"}], "interp_pages": [47]},
            {"id": "teeth_01", "trait_ar": "الثرثرة والحرص على الكلام", "trait_en": "talkativeness_vs_reserve", "summary_page": 49, "pages": [50, 51], "view": "frontal", "states": [{"state_ar": "الأسنان تميل إلى الخارج", "code": "outward_teeth"}, {"state_ar": "الأسنان تميل إلى الداخل", "code": "inward_teeth"}], "interp_pages": [52]},
            {"id": "chin_01", "trait_ar": "المثابرة والتماسك", "trait_en": "perseverance", "summary_page": 54, "pages": [55, 56], "view": "profile", "states": [{"state_ar": "امتداد الذقن للخارج", "code": "protruding_chin"}, {"state_ar": "انحسار الذقن للداخل", "code": "receding_chin"}], "interp_pages": [57]},
            {"id": "chin_02", "trait_ar": "المعارضة التلقائية", "trait_en": "automatic_opposition", "summary_page": 54, "pages": [58, 59], "view": "frontal", "states": [{"state_ar": "الذقن دائري", "code": "rounded_chin"}, {"state_ar": "الذقن مثلث", "code": "triangular_chin"}], "interp_pages": [60]},
            {"id": "chin_03", "trait_ar": "الجدل والمشاكسة", "trait_en": "argumentativeness", "summary_page": 54, "pages": [61, 62], "view": "frontal", "states": [{"state_ar": "ذقن مربع عريض", "code": "wide_square_chin"}, {"state_ar": "ذقن ضيق طويل", "code": "narrow_long_chin"}], "interp_pages": [63]},
            {"id": "chin_04", "trait_ar": "الجدية والحاجة للإطراء", "trait_en": "seriousness_and_need_for_praise", "summary_page": 54, "pages": [64, 65], "view": "frontal", "states": [{"state_ar": "الذقن المقسوم", "code": "cleft_chin"}], "interp_pages": [66]},
            {"id": "chin_05", "trait_ar": "الهدوء", "trait_en": "calmness", "summary_page": 54, "pages": [67, 68], "view": "profile", "states": [{"state_ar": "الذقن المزدوج", "code": "double_chin"}], "interp_pages": [69]},
            {"id": "chin_06", "trait_ar": "الأنشطة البدنية أو الذهنية", "trait_en": "physical_vs_mental_bias", "summary_page": 54, "pages": [70, 71], "view": "profile", "states": [{"state_ar": "مسافة كبيرة من أسفل الأنف إلى أسفل الذقن", "code": "long_lower_face"}, {"state_ar": "مسافة صغيرة من أسفل الأنف إلى أسفل الذقن", "code": "short_lower_face"}], "interp_pages": [72]},
            {"id": "jaw_01", "trait_ar": "الميول السلطوية", "trait_en": "authority_drive", "summary_page": 54, "pages": [73, 74], "view": "frontal", "states": [{"state_ar": "فك عريض", "code": "wide_jaw"}, {"state_ar": "فك ضيق", "code": "narrow_jaw"}], "interp_pages": [75]},
        ],
    },
    "day5": {
        "pdf": "      .pdf",
        "page_limit": 77,
        "section_ar": "الشعر والوجه والرأس والفم",
        "traits": [
            {"id": "hair_01", "trait_ar": "الصلابة أو الحساسية", "trait_en": "resilience_vs_sensitivity", "summary_page": 5, "pages": [6, 7], "view": "frontal", "states": [{"state_ar": "شعر سميك ومجعد", "code": "coarse_curly"}, {"state_ar": "شعر ناعم ورقيق", "code": "soft_fine"}], "interp_pages": [8]},
            {"id": "hair_02", "trait_ar": "الأفكار", "trait_en": "idea_flow", "summary_page": 5, "pages": [9, 10], "view": "frontal", "states": [{"state_ar": "الشعر الأصلع", "code": "bald"}], "interp_pages": [11]},
            {"id": "hair_03", "trait_ar": "الرزانة والحسم", "trait_en": "composure_vs_decisiveness", "summary_page": 5, "pages": [12, 13], "view": "frontal", "states": [{"state_ar": "شعر طويل", "code": "long_hair"}, {"state_ar": "شعر قصير", "code": "short_hair"}], "interp_pages": [14]},
            {"id": "face_01", "trait_ar": "الثقة بالنفس الطبيعية", "trait_en": "natural_self_confidence", "summary_page": 16, "pages": [17, 18], "view": "frontal", "states": [{"state_ar": "وجه عريض", "code": "wide_face"}, {"state_ar": "وجه نحيل", "code": "thin_face"}], "interp_pages": [19]},
            {"id": "face_02", "trait_ar": "التقلبات المزاجية النفسية", "trait_en": "mood_volatility", "summary_page": 16, "pages": [20, 21], "view": "frontal", "states": [{"state_ar": "نصفي الوجه غير متماثلين", "code": "facial_asymmetry"}], "interp_pages": [22]},
            {"id": "face_03", "trait_ar": "الفظاظة أو الحدة", "trait_en": "bluntness_vs_precision", "summary_page": 16, "pages": [23, 24], "view": "frontal", "states": [{"state_ar": "ملامح ممتلئة وثقيلة والجلد مرتخى", "code": "heavy_soft_features"}, {"state_ar": "ملامح حادة ودقيقة والجلد مشدود", "code": "sharp_taut_features"}], "interp_pages": [25]},
            {"id": "head_01", "trait_ar": "الميول التنافسية", "trait_en": "competitive_tendency", "summary_page": 27, "pages": [28, 29], "view": "top", "states": [{"state_ar": "الرأس يتسع من الجبهة إلى أعلى الأذنين", "code": "widens_above_ears"}, {"state_ar": "الرأس يضيق من الجبهة إلى أعلى الأذنين", "code": "narrows_above_ears"}], "interp_pages": [30]},
            {"id": "head_02", "trait_ar": "الميول التقدمية", "trait_en": "progressive_drive", "summary_page": 27, "pages": [31, 32], "view": "top", "states": [{"state_ar": "الرأس يتسع إلى مؤخرة الرأس", "code": "expands_to_back"}, {"state_ar": "الرأس يضيق إلى مؤخرة الرأس", "code": "narrows_to_back"}], "interp_pages": [33]},
            {"id": "head_03", "trait_ar": "الفاعلية", "trait_en": "effectiveness", "summary_page": 27, "pages": [34, 35], "view": "profile", "states": [{"state_ar": "تاج الرأس أعلى من الجبهة", "code": "crown_higher"}, {"state_ar": "الجبهة أعلى من تاج الرأس", "code": "forehead_higher"}], "interp_pages": [36]},
            {"id": "mouth_01", "trait_ar": "تحكم القلب والعقل", "trait_en": "heart_vs_mind_control", "summary_page": 72, "pages": [73, 74], "view": "frontal", "states": [{"state_ar": "الفم الكبير", "code": "large_mouth"}, {"state_ar": "الفم الصغير", "code": "small_mouth"}], "interp_pages": [75]},
        ],
    },
}


NUMERIC_METRICS = [
    "forehead_height",
    "face_height",
    "forehead_ratio",
    "forehead_top_width",
    "brow_width",
    "widening_ratio",
    "face_width",
]


PREFERRED_METRICS = {
    "intellectual_range": "forehead_ratio",
    "renewal_vs_conservatism": "widening_ratio",
    "patience_span": "widening_ratio",
    "thinking_style": "forehead_slant_ratio",
    "cognitive_flexibility": "forehead_slant_ratio",
    "cognitive_interests": "face_aspect_ratio",
    "self_reliance": "nose_tip_projection_ratio",
    "skepticism_vs_trust": "nose_tip_drop_ratio",
    "ambition_vs_playfulness": "nose_length_ratio",
    "social_integration": "brow_eye_distance_ratio",
    "tolerance_vs_focus": "eye_spacing_ratio",
    "critical_tendency": "eye_tilt_ratio",
    "analytical_tendency": "eye_open_ratio",
    "emotional_expression": "eye_open_ratio",
    "emotion_vs_caution": "eye_size_ratio",
    "spontaneous_vs_selective_giving": "lower_lip_ratio",
    "verbal_expression_style": "upper_lip_ratio",
    "physical_vs_mental_inclination": "philtrum_ratio",
    "disclosure_vs_secrecy": "mouth_height_ratio",
    "perseverance": "chin_projection_ratio",
    "argumentativeness": "jaw_width_ratio",
    "physical_vs_mental_bias": "lower_face_ratio",
    "authority_drive": "jaw_width_ratio",
    "natural_self_confidence": "face_aspect_ratio",
    "bluntness_vs_precision": "face_aspect_ratio",
    "composure_vs_decisiveness": "face_aspect_ratio",
    "heart_vs_mind_control": "mouth_width_ratio",
    "competitive_tendency": "ear_zone_expansion_ratio",
    "progressive_drive": "back_fullness_ratio",
    "effectiveness": "profile_height_width_ratio",
}


MANUAL_PAGE_BOXES = {
    ("day2", 36): [{"x1": 0.08, "y1": 0.15, "x2": 0.92, "y2": 0.86}],
    ("day3", 7): [
        {"x1": 0.12, "y1": 0.18, "x2": 0.49, "y2": 0.76},
        {"x1": 0.67, "y1": 0.18, "x2": 0.95, "y2": 0.76},
    ],
    ("day4", 55): [
        {"x1": 0.09, "y1": 0.24, "x2": 0.41, "y2": 0.77},
        {"x1": 0.54, "y1": 0.15, "x2": 0.98, "y2": 0.82},
    ],
    ("day4", 64): [{"x1": 0.05, "y1": 0.16, "x2": 0.46, "y2": 0.78}],
    ("day4", 68): [{"x1": 0.16, "y1": 0.14, "x2": 0.86, "y2": 0.82}],
    ("day5", 28): [
        {"x1": 0.06, "y1": 0.15, "x2": 0.45, "y2": 0.73},
        {"x1": 0.54, "y1": 0.15, "x2": 0.92, "y2": 0.73},
    ],
    ("day5", 31): [
        {"x1": 0.08, "y1": 0.14, "x2": 0.46, "y2": 0.76},
        {"x1": 0.54, "y1": 0.14, "x2": 0.93, "y2": 0.76},
    ],
    ("day5", 35): [
        {"x1": 0.08, "y1": 0.16, "x2": 0.43, "y2": 0.77},
        {"x1": 0.54, "y1": 0.16, "x2": 0.95, "y2": 0.80},
    ],
}


def render_day_pages(day_key, pdf_path, page_limit):
    out_dir = ROOT / "pages" / day_key
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    image_paths = {}
    for idx in range(1, page_limit + 1):
        out_path = out_dir / f"page_{idx:03d}.jpg"
        pix = doc[idx - 1].get_pixmap(dpi=100, alpha=False)
        pix.save(str(out_path))
        image_paths[idx] = out_path
    return image_paths


def make_page_label_cfg(trait):
    if len(trait["states"]) == 1:
        return {
            "trait": trait["trait_en"],
            "trait_ar": trait["trait_ar"],
            "label": trait["states"][0]["code"],
            "view": trait["view"],
            "mode": "single",
        }
    return {
        "trait": trait["trait_en"],
        "trait_ar": trait["trait_ar"],
        "right_label": trait["states"][0]["code"],
        "left_label": trait["states"][1]["code"],
        "view": trait["view"],
        "mode": "pair",
    }


def build_label_maps():
    labels = {}
    singles = {}
    for day_key, day in DAYS.items():
        labels[day_key] = {}
        singles[day_key] = {}
        for trait in day["traits"]:
            page_cfg = make_page_label_cfg(trait)
            for page in trait["pages"]:
                labels[day_key][page] = dict(page_cfg)
                if page_cfg["mode"] == "single":
                    singles[day_key][page] = {"trait": trait["trait_en"], "label": trait["states"][0]["code"]}
    return labels, singles


def build_ignore_pages(day):
    active = set()
    for trait in day["traits"]:
        active.update(trait["pages"])
    return {page for page in range(1, day["page_limit"] + 1) if page not in active}


def split_bullets(text):
    cleaned = clean_text(text)
    if not cleaned:
        return []
    parts = re.split(r"\s+\d+\-\s*", cleaned)
    if len(parts) == 1:
        parts = re.split(r"\s+\d+\s*", cleaned)
    parts = [part.strip(" -") for part in parts if part.strip(" -")]
    return parts[:8]


def extract_measurement_method(text):
    cleaned = clean_text(text)
    match = re.search(r"(يحدد[^.]{0,220})", cleaned)
    if match:
        return match.group(1).strip()
    return cleaned[:220]


def split_interpretation_by_states(text, states):
    cleaned = clean_text(text)
    if len(states) == 1:
        return {states[0]["code"]: cleaned}
    first = states[0]["state_ar"]
    second = states[1]["state_ar"]
    idx_first = cleaned.find(first)
    idx_second = cleaned.find(second)
    if idx_second != -1:
        block_one = cleaned[idx_first:idx_second] if idx_first != -1 and idx_first < idx_second else cleaned[:idx_second]
        block_two = cleaned[idx_second:]
        return {states[0]["code"]: block_one, states[1]["code"]: block_two}
    return {state["code"]: cleaned for state in states}


def build_theory_json(day_key, day, reader):
    traits = []
    for trait in day["traits"]:
        anchor_page = trait["pages"][0]
        anchor_text = clean_text(reader.pages[anchor_page - 1].extract_text() or "")
        interp_text = " ".join(clean_text(reader.pages[p - 1].extract_text() or "") for p in trait["interp_pages"])
        state_blocks = split_interpretation_by_states(interp_text, trait["states"])
        trait_json = {
            "id": trait["id"],
            "trait_ar": trait["trait_ar"],
            "trait_en": trait["trait_en"],
            "measurement_method": extract_measurement_method(anchor_text),
            "states": [],
        }
        for state in trait["states"]:
            trait_json["states"].append(
                {
                    "state_ar": state["state_ar"],
                    "code": state["code"],
                    "indicates": clean_text(anchor_text),
                    "personality_traits": split_bullets(state_blocks.get(state["code"], "")),
                    "linked_trait": trait["trait_en"],
                }
            )
        traits.append(trait_json)
    return {
        "day": day_key,
        "section_ar": day["section_ar"],
        "traits": traits,
    }


def build_inventory(day_key, pdf_path, image_paths, labels_for_day, ignore_pages):
    reader = PdfReader(str(pdf_path))
    inventory = []
    with make_landmarker() as landmarker:
        for page_number, image_path in image_paths.items():
            image_bgr = cv2.imread(str(image_path))
            result = detect_faces_retry(landmarker, image_bgr)
            count = len(result.face_landmarks) if result.face_landmarks else 0
            if not count and (day_key, page_number) in MANUAL_PAGE_BOXES:
                count = len(MANUAL_PAGE_BOXES[(day_key, page_number)])
            text = clean_text(reader.pages[page_number - 1].extract_text() or "")
            inventory.append(
                {
                    "day": day_key,
                    "page": page_number,
                    "image": str(image_path),
                    "face_count": count,
                    "text_length": len(text),
                    "text_sample": text[:220],
                    "is_labeled_page": page_number in labels_for_day,
                    "ignored": page_number in ignore_pages,
                }
            )
    return inventory


def normalized_box_to_entry(box, page_w, page_h):
    x1 = int(box["x1"] * page_w)
    y1 = int(box["y1"] * page_h)
    x2 = int(box["x2"] * page_w)
    y2 = int(box["y2"] * page_h)
    return {
        "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
        "center_x": (x1 + x2) / 2.0,
        "landmarks": None,
        "source": "manual_box",
    }


def manual_entries(day_key, page_number, page_w, page_h):
    boxes = MANUAL_PAGE_BOXES.get((day_key, page_number), [])
    return [normalized_box_to_entry(box, page_w, page_h) for box in boxes]


def crop_exact(image_bgr, bbox):
    crop = image_bgr[bbox["y1"]:bbox["y2"], bbox["x1"]:bbox["x2"]].copy()
    return crop, dict(bbox)


def equalize_bgr(image_bgr):
    ycrcb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2YCrCb)
    ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
    return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)


def sharpen_bgr(image_bgr):
    blurred = cv2.GaussianBlur(image_bgr, (0, 0), 1.2)
    return cv2.addWeighted(image_bgr, 1.6, blurred, -0.6, 0)


def mirror_landmarks(landmarks):
    mirrored = []
    for lm in landmarks:
        mirrored.append(SimpleNamespace(x=1.0 - lm.x, y=lm.y, z=getattr(lm, "z", 0.0)))
    return mirrored


def crop_variants(crop_bgr):
    return [
        ("orig", crop_bgr, False),
        ("eq", equalize_bgr(crop_bgr), False),
        ("blur", cv2.GaussianBlur(crop_bgr, (5, 5), 0), False),
        ("sharp", sharpen_bgr(crop_bgr), False),
        ("up2", cv2.resize(crop_bgr, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC), False),
        ("flip", cv2.flip(crop_bgr, 1), True),
        ("eq_flip", cv2.flip(equalize_bgr(crop_bgr), 1), True),
        ("sharp_flip", cv2.flip(sharpen_bgr(crop_bgr), 1), True),
    ]


def recover_face_from_crop(landmarker, crop_bgr):
    for variant_name, variant_bgr, is_flipped in crop_variants(crop_bgr):
        refined = best_face_from_crop(landmarker, variant_bgr)
        if refined is not None:
            if is_flipped:
                refined = mirror_landmarks(refined)
            return refined, variant_name
    return None, None


def recover_face_for_entry(landmarker, image_bgr, entry):
    attempts = []
    if entry.get("source") == "manual_box":
        attempts.append(("manual_raw",) + crop_exact(image_bgr, entry["bbox"]))
    attempts.append(("padded",) + crop_with_padding(image_bgr, entry["bbox"]))
    for crop_kind, crop_bgr, crop_meta in attempts:
        refined, variant_name = recover_face_from_crop(landmarker, crop_bgr)
        if refined is not None:
            return crop_bgr, crop_meta, refined, f"{crop_kind}:{variant_name}"
    crop_bgr, crop_meta = attempts[-1][1], attempts[-1][2]
    return crop_bgr, crop_meta, None, attempts[-1][0]


def contour_metrics(crop_bgr):
    gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)
    mask = (gray < 245).astype("uint8") * 255
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        h, w = crop_bgr.shape[:2]
        return {
            "crop_width": float(w),
            "crop_height": float(h),
            "crop_aspect_ratio": float(w / h) if h else None,
        }
    contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(contour)
    row_positions = {
        "top": y + int(0.2 * h),
        "mid": y + int(0.5 * h),
        "bottom": y + int(0.8 * h),
    }
    widths = {}
    for key, row in row_positions.items():
        row = max(0, min(mask.shape[0] - 1, row))
        xs = np.where(mask[row] > 0)[0]
        widths[key] = float(xs[-1] - xs[0]) if xs.size >= 2 else 0.0
    return {
        "crop_width": float(w),
        "crop_height": float(h),
        "crop_aspect_ratio": float(w / h) if h else None,
        "mask_width_top": widths["top"],
        "mask_width_mid": widths["mid"],
        "mask_width_bottom": widths["bottom"],
        "top_width_bottom_width_ratio": float(widths["top"] / widths["bottom"]) if widths["bottom"] else None,
        "mid_width_bottom_width_ratio": float(widths["mid"] / widths["bottom"]) if widths["bottom"] else None,
        "head_height_width_ratio": float(h / w) if w else None,
        "profile_height_width_ratio": float(h / w) if w else None,
    }


def grabcut_primary_mask(crop_bgr):
    h, w = crop_bgr.shape[:2]
    if h < 40 or w < 40:
        return None
    mask = np.zeros((h, w), np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    rect = (10, 10, max(1, w - 20), max(1, h - 20))
    cv2.grabCut(crop_bgr, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
    binary = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype("uint8")
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    primary = max(contours, key=cv2.contourArea)
    clean = np.zeros_like(binary)
    cv2.drawContours(clean, [primary], -1, 255, thickness=cv2.FILLED)
    return clean


def mask_width_at_fraction(mask, frac, search_radius=12):
    ys, _ = np.where(mask > 0)
    if ys.size == 0:
        return None
    y1 = int(ys.min())
    y2 = int(ys.max())
    target = int(round(y1 + frac * (y2 - y1)))
    for radius in range(search_radius + 1):
        for row in (target - radius, target + radius):
            if row < 0 or row >= mask.shape[0]:
                continue
            xs = np.where(mask[row] > 0)[0]
            if xs.size >= 2:
                return float(xs[-1] - xs[0])
    return None


def top_view_head_metrics(crop_bgr):
    mask = grabcut_primary_mask(crop_bgr)
    if mask is None:
        return {}
    ys, xs = np.where(mask > 0)
    if ys.size == 0 or xs.size == 0:
        return {}
    y1 = int(ys.min())
    y2 = int(ys.max())
    x1 = int(xs.min())
    x2 = int(xs.max())
    bbox_h = float(y2 - y1 + 1)
    bbox_w = float(x2 - x1 + 1)
    w15 = mask_width_at_fraction(mask, 0.15)
    w35 = mask_width_at_fraction(mask, 0.35)
    w45 = mask_width_at_fraction(mask, 0.45)
    w55 = mask_width_at_fraction(mask, 0.55)
    w75 = mask_width_at_fraction(mask, 0.75)
    back_mean = None
    if None not in (w35, w45, w55):
        back_mean = (w35 + w45 + w55) / 3.0
    return {
        "top_view_mask_width": bbox_w,
        "top_view_mask_height": bbox_h,
        "top_view_width_15": w15,
        "top_view_width_35": w35,
        "top_view_width_45": w45,
        "top_view_width_55": w55,
        "top_view_width_75": w75,
        "ear_zone_expansion_ratio": float(w35 / w15) if w15 and w35 else None,
        "back_fullness_ratio": float(back_mean / w15) if w15 and back_mean else None,
        "top_width_bottom_width_ratio": float(w35 / w75) if w35 and w75 else None,
        "mid_width_bottom_width_ratio": float(w55 / w75) if w55 and w75 else None,
        "head_height_width_ratio": float(bbox_h / bbox_w) if bbox_w else None,
        "profile_height_width_ratio": float(bbox_h / bbox_w) if bbox_w else None,
    }


def metric_union(primary, secondary):
    merged = dict(primary)
    for key, value in secondary.items():
        if key not in merged or merged[key] is None:
            merged[key] = value
    return merged


def assign_entries(entries, cfg, width):
    if cfg["mode"] == "single":
        return [(entry, cfg["label"], "single") for entry in entries]
    ordered = sorted(entries, key=lambda item: item["center_x"], reverse=True)
    assigned = []
    if ordered:
        assigned.append((ordered[0], cfg["right_label"], "right"))
    if len(ordered) > 1:
        assigned.append((ordered[1], cfg["left_label"], "left"))
    return assigned


def build_day_dataset(day_key, image_paths, labels_for_day):
    dataset = []
    errors = []
    with make_landmarker() as landmarker:
        for page_number, cfg in sorted(labels_for_day.items()):
            image_bgr = cv2.imread(str(image_paths[page_number]))
            page_h, page_w = image_bgr.shape[:2]
            result = detect_faces_retry(landmarker, image_bgr)
            entries = page_face_entries(result, page_w, page_h) if result.face_landmarks else []
            if not entries:
                entries = manual_entries(day_key, page_number, page_w, page_h)
            if not entries:
                errors.append({"day": day_key, "page": page_number, "error": "no_faces_detected"})
                continue
            assignments = assign_entries(entries, cfg, page_w)
            for sample_index, (entry, label, position) in enumerate(assignments, start=1):
                crop_bgr, crop_meta, refined, recovery_source = recover_face_for_entry(landmarker, image_bgr, entry)
                contour = contour_metrics(crop_bgr)
                metrics_source = "landmarks"
                landmark_source = recovery_source if refined is not None else entry.get("source", "page_detection")
                if refined is None:
                    if entry["landmarks"] is not None:
                        crop_h, crop_w = crop_bgr.shape[:2]
                        refined = rebase_landmarks(entry["landmarks"], crop_meta, page_w, page_h, crop_w, crop_h)
                        landmark_source = "page_detection_rebased"
                        errors.append({"day": day_key, "page": page_number, "error": "crop_landmark_fallback", "label": label})
                if refined is not None:
                    metrics = metric_union(compute_metrics(crop_bgr, refined), contour)
                else:
                    top_view_metrics = {}
                    if cfg["view"] == "top" and entry.get("source") == "manual_box":
                        raw_crop, _ = crop_exact(image_bgr, entry["bbox"])
                        top_view_metrics = top_view_head_metrics(raw_crop)
                    if top_view_metrics:
                        metrics = metric_union(top_view_metrics, contour)
                        metrics_source = "top_view_contour"
                        landmark_source = "top_view_grabcut"
                    else:
                        metrics = contour
                        metrics_source = "manual_contour"
                        landmark_source = f"contour_only:{entry.get('source', 'manual_box')}"
                        errors.append({"day": day_key, "page": page_number, "error": "manual_contour_metrics", "label": label})
                dataset.append(
                    {
                        "pdf_day": day_key,
                        "page": page_number,
                        "trait": cfg["trait"],
                        "trait_ar": cfg["trait_ar"],
                        "label": label,
                        "position": position,
                        "view": cfg["view"],
                        "sample_index": sample_index,
                        "metrics_source": metrics_source,
                        "landmark_source": landmark_source,
                        "metrics": {k: (round(v, 6) if isinstance(v, float) else v) for k, v in metrics.items()},
                    }
                )
    return dataset, errors


def build_combined_thresholds(dataset):
    by_trait = {}
    for item in dataset:
        by_trait.setdefault(item["trait"], {"trait_ar": item["trait_ar"], "labels": {}})
        by_trait[item["trait"]]["labels"].setdefault(item["label"], []).append(item)

    thresholds = []
    for trait_en, payload in by_trait.items():
        labels = sorted(payload["labels"].keys())
        if len(labels) != 2:
            continue
        a, b = labels
        preferred_metric = PREFERRED_METRICS.get(trait_en)
        metric_candidates = [preferred_metric] if preferred_metric else []
        metric_candidates += [metric for metric in NUMERIC_METRICS if metric not in metric_candidates]
        metric_candidates += [
            "face_aspect_ratio",
            "eye_spacing_ratio",
            "eye_open_ratio",
            "eye_tilt_ratio",
            "brow_eye_distance_ratio",
            "mouth_width_ratio",
            "mouth_height_ratio",
            "upper_lip_ratio",
            "lower_lip_ratio",
            "philtrum_ratio",
            "lower_face_ratio",
            "nose_length_ratio",
            "nose_tip_projection_ratio",
            "nose_tip_drop_ratio",
            "forehead_slant_ratio",
            "jaw_width_ratio",
            "chin_projection_ratio",
            "top_width_bottom_width_ratio",
            "mid_width_bottom_width_ratio",
            "head_height_width_ratio",
            "profile_height_width_ratio",
            "ear_zone_expansion_ratio",
            "back_fullness_ratio",
        ]
        best = None
        for metric in metric_candidates:
            if not metric:
                continue
            av = [x["metrics"].get(metric) for x in payload["labels"][a] if x["metrics"].get(metric) is not None]
            bv = [x["metrics"].get(metric) for x in payload["labels"][b] if x["metrics"].get(metric) is not None]
            if not av or not bv:
                continue
            am = sum(av) / len(av)
            bm = sum(bv) / len(bv)
            diff = abs(am - bm)
            if preferred_metric == metric:
                best = {
                    "trait": trait_en,
                    "trait_ar": payload["trait_ar"],
                    "metric": metric,
                    "high_label": a,
                    "low_label": b,
                    "high_avg": round(am, 6),
                    "low_avg": round(bm, 6),
                    "difference": round(diff, 6),
                    "threshold": round((am + bm) / 2.0, 6),
                    "high_n": len(av),
                    "low_n": len(bv),
                }
                break
            if not best or diff > best["difference"]:
                best = {
                    "trait": trait_en,
                    "trait_ar": payload["trait_ar"],
                    "metric": metric,
                    "high_label": a,
                    "low_label": b,
                    "high_avg": round(am, 6),
                    "low_avg": round(bm, 6),
                    "difference": round(diff, 6),
                    "threshold": round((am + bm) / 2.0, 6),
                    "high_n": len(av),
                    "low_n": len(bv),
                }
        if best:
            best["effective"] = best["difference"] > 0.01
            if best["difference"] > 0.05:
                best["confidence"] = "high"
            elif best["difference"] > 0.02:
                best["confidence"] = "medium"
            elif best["difference"] > 0.01:
                best["confidence"] = "low"
            else:
                best["confidence"] = "insufficient"
            thresholds.append(best)
    thresholds.sort(key=lambda item: (item["trait_ar"], item["metric"]))
    return thresholds


def build_summary(all_inventory, all_dataset, thresholds, errors):
    total_pages = sum(len(items) for items in all_inventory.values())
    total_faces = sum(item["face_count"] for items in all_inventory.values() for item in items)
    total_samples = len(all_dataset)
    effective = sum(1 for item in thresholds if item["effective"])
    lines = [
        "📊 Summary:",
        f"- Total pages processed: {total_pages}",
        f"- Total faces detected: {total_faces}",
        f"- Total labeled samples: {total_samples}",
        f"- Effective thresholds found: {effective}",
        "",
        "📈 Thresholds:",
    ]
    for item in thresholds:
        status = "✅ Effective" if item["effective"] else "⚠ Needs more data"
        lines.append(
            f"- {item['trait_ar']} ({item['metric']}): "
            f"{item['high_label']} avg={item['high_avg']:.4f} (n={item['high_n']}), "
            f"{item['low_label']} avg={item['low_avg']:.4f} (n={item['low_n']}), "
            f"diff={item['difference']:.4f}, threshold={item['threshold']:.4f}, {status}, confidence={item['confidence']}"
        )
    if errors:
        lines.append("")
        lines.append("⚠ Errors:")
        for err in errors:
            lines.append(f"- {err['day']} page {err['page']}: {err['error']}")
    return "\n".join(lines) + "\n"


def build_master_schema(theory_outputs, labels_payload, singles_payload, ignore_all_days, all_inventory, dataset, thresholds, summary):
    return {
        "meta": {
            "project": "firasa_pdf_threshold_extraction",
            "pdf_days": sorted(theory_outputs.keys()),
            "total_days": len(theory_outputs),
            "total_samples": len(dataset),
            "total_thresholds": len(thresholds),
        },
        "theory": theory_outputs,
        "labels": {
            "pdf_labels_complete": labels_payload,
            "single_face_pages_complete": singles_payload,
            "pages_to_ignore": {k: sorted(v) for k, v in ignore_all_days.items()},
        },
        "inventory": all_inventory,
        "samples": dataset,
        "thresholds": thresholds,
        "summary_markdown": summary,
    }


def main():
    labels_all_days, singles_all_days = build_label_maps()
    ignore_all_days = {day_key: build_ignore_pages(day) for day_key, day in DAYS.items()}
    all_inventory = {}
    all_dataset = []
    all_errors = []
    theory_outputs = {}

    for day_key, day in DAYS.items():
        pdf_path = ROOT / day["pdf"]
        reader = PdfReader(str(pdf_path))
        theory_outputs[day_key] = build_theory_json(day_key, day, reader)
        image_paths = render_day_pages(day_key, pdf_path, day["page_limit"])
        all_inventory[day_key] = build_inventory(day_key, pdf_path, image_paths, labels_all_days[day_key], ignore_all_days[day_key])
        day_dataset, day_errors = build_day_dataset(day_key, image_paths, labels_all_days[day_key])
        all_dataset.extend(day_dataset)
        all_errors.extend(day_errors)
        (ROOT / f"{day_key}_data.json").write_text(json.dumps(theory_outputs[day_key], ensure_ascii=False, indent=2), encoding="utf-8")

    # Merge previously processed day 1 metadata so the combined outputs stay complete.
    day1_path = ROOT / "day1_data.json"
    if day1_path.exists():
        theory_outputs["day1"] = json.loads(day1_path.read_text(encoding="utf-8"))
        labels_all_days["day1"] = DAY1_LABELS
        singles_all_days["day1"] = DAY1_SINGLES
        ignore_all_days["day1"] = set(DAY1_IGNORE)
        day1_pdf = find_day1_pdf()
        day1_image_paths = {i: ROOT / "pages" / "day1" / f"page_{i:03d}.jpg" for i in range(1, 71)}
        all_inventory["day1"] = build_day1_inventory(day1_pdf, day1_image_paths)

    existing = [item for item in load_existing_dataset() if item.get("pdf_day") == "day1"]
    merged_dataset = merge_dataset(existing, all_dataset)
    thresholds = build_combined_thresholds(merged_dataset)
    summary = build_summary(all_inventory, merged_dataset, thresholds, all_errors)

    labels_payload = {}
    singles_payload = {}
    for day_key, day_labels in labels_all_days.items():
        labels_payload[day_key] = day_labels
        singles_payload[day_key] = singles_all_days[day_key]

    (ROOT / "dataset_complete.json").write_text(json.dumps(merged_dataset, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "thresholds_from_pdf.json").write_text(json.dumps({"comparisons": thresholds}, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "all_pages_inventory.json").write_text(
        json.dumps({"days": all_inventory, "errors": all_errors}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (ROOT / "pdf_labels_complete.py").write_text(
        "\n".join(
            [
                "PDF_LABELS_COMPLETE = " + json.dumps(labels_payload, ensure_ascii=False, indent=2),
                "",
                "SINGLE_FACE_PAGES_COMPLETE = " + json.dumps(singles_payload, ensure_ascii=False, indent=2),
                "",
                "PAGES_TO_IGNORE = " + json.dumps({k: sorted(v) for k, v in ignore_all_days.items()}, ensure_ascii=False, indent=2),
                "",
            ]
        ),
        encoding="utf-8",
    )
    (ROOT / "summary_report.md").write_text(summary, encoding="utf-8")
    master = build_master_schema(theory_outputs, labels_payload, singles_payload, ignore_all_days, all_inventory, merged_dataset, thresholds, summary)
    (ROOT / "firasa_master_dataset.json").write_text(json.dumps(master, ensure_ascii=False, indent=2), encoding="utf-8")
    safe = summary.encode("cp1256", errors="ignore").decode("cp1256", errors="ignore")
    print(safe)


if __name__ == "__main__":
    main()
