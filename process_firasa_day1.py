import json
import math
import re
from types import SimpleNamespace
from pathlib import Path

import cv2
import fitz
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import vision
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parent
PAGES_DIR = ROOT / "pages" / "day1"
MODEL_PATH = ROOT / "models" / "face_landmarker.task"
PDF_CANDIDATES = sorted(ROOT.glob("*.pdf"))


def _expand(page_numbers, payload):
    return {page: dict(payload) for page in page_numbers}


THEORY_DATA = {
    "day": 1,
    "section_ar": "الجبهة واللحية والأظافر",
    "source_hint": "دورة قراءة الوجه - اليوم الأول",
    "traits": [
        {
            "id": "forehead_01",
            "trait_ar": "المدى الفكري",
            "trait_en": "intellectual_range",
            "measurement_method": "يحدد من خلال النظر إلى ارتفاع الجبهة من بين العينين حتى منبت الشعر.",
            "metric_hint": "forehead_ratio",
            "states": [
                {
                    "state_ar": "جبهة عالية",
                    "code": "high",
                    "indicates": "مفكر وعقلاني",
                    "personality_traits": [
                        "واسع الثقافة ويعتمد على التفكير العقلي في نواحي الحياة المختلفة.",
                        "يحب الأفكار والنظريات المجردة والتحليلات العميقة.",
                        "ينزع للتضايق من النقاشات السطحية وقد يميل إلى العزلة.",
                    ],
                    "linked_trait": "cognitive_depth",
                },
                {
                    "state_ar": "جبهة قصيرة",
                    "code": "short",
                    "indicates": "عملي التفكير",
                    "personality_traits": [
                        "واقعي ويفضل المعلومات العامة والنقاشات المباشرة.",
                        "لا يحب الفرضيات المجردة ويركز على صغائر الأمور الأساسية.",
                        "لا يرتاح كثيرا للحوار الفكري العميق أو المجرد.",
                    ],
                    "linked_trait": "practical_thinking",
                },
            ],
        },
        {
            "id": "forehead_02",
            "trait_ar": "التجديد أو المحافظة",
            "trait_en": "renewal_vs_conservatism",
            "measurement_method": "يحدد من خلال النظر إلى الجبهة هل تأخذ شكل المربع أو نصف الدائرة من منبت الشعر.",
            "metric_hint": "widening_ratio",
            "states": [
                {
                    "state_ar": "جبهة مربعة",
                    "code": "square",
                    "indicates": "أكثر تجديدا وبناء",
                    "personality_traits": [
                        "يرحب بالتغيير والبدايات الجديدة ويكره الروتين.",
                        "يحب بدء المشاريع ويضع حماسا مرتفعا في بداياتها.",
                        "يميل للأعمال المهنية التي يعتبرها جزءا من هويته.",
                    ],
                    "linked_trait": "renewal_drive",
                },
                {
                    "state_ar": "جبهة بيضاوية",
                    "code": "oval",
                    "indicates": "أكثر محافظة",
                    "personality_traits": [
                        "يحافظ على العلاقات الأسرية والاجتماعية والمقتنيات.",
                        "يميل للأعمال الاجتماعية والمنتظمة.",
                        "يحب الصيانة وإعادة الاستخدام ومقاومة التغيير السريع.",
                    ],
                    "linked_trait": "conservatism",
                },
            ],
        },
        {
            "id": "forehead_03",
            "trait_ar": "الصبر أو طول البال",
            "trait_en": "patience_span",
            "measurement_method": "يحدد من خلال النظر هل تتسع الجبهة للأعلى أو تضيق.",
            "metric_hint": "widening_ratio",
            "states": [
                {
                    "state_ar": "الجبهة تتسع للأعلى",
                    "code": "widens_upward",
                    "indicates": "صبر وطول بال",
                    "personality_traits": [
                        "يركز لفترة طويلة ويحافظ على الانهماك الذهني.",
                        "يتحمل الانتظار ويحافظ على الفكرة دون تشتت سريع.",
                        "لا يحب المقاطعة أثناء التركيز.",
                    ],
                    "linked_trait": "sustained_attention",
                },
                {
                    "state_ar": "الجبهة تضيق إلى الأعلى",
                    "code": "narrows_upward",
                    "indicates": "قصر مدى الاهتمام",
                    "personality_traits": [
                        "قصير البال لحظيا ولا يحب الانتظار الطويل.",
                        "يريد الوصول للنتيجة بسرعة ويختصر الطريق.",
                        "مناسب للأعمال السريعة التي يحكمها عامل الوقت.",
                    ],
                    "linked_trait": "short_attention_span",
                },
            ],
        },
        {
            "id": "forehead_04",
            "trait_ar": "أسلوب التفكير",
            "trait_en": "thinking_style",
            "measurement_method": "يحدد من خلال النظر إلى الجبهة هل تنحدر للخلف أو ترتفع عموديا.",
            "metric_hint": "forehead_ratio",
            "states": [
                {
                    "state_ar": "جبهة مائلة للخلف",
                    "code": "sloped_back",
                    "indicates": "تفكير موضوعي سريع",
                    "personality_traits": [
                        "سريع التفكير والاستنتاج ورد الفعل اللحظي.",
                        "يستدعي الخبرة السابقة بسرعة وقت الأزمات.",
                        "قد يتعجل أحيانا قبل اكتمال المعلومات.",
                    ],
                    "linked_trait": "fast_objective_reasoning",
                },
                {
                    "state_ar": "جبهة عمودية للأعلى",
                    "code": "vertical",
                    "indicates": "تفكير متسلسل وتتابعي",
                    "personality_traits": [
                        "يفضل المعالجة خطوة بخطوة وبترتيب منطقي واضح.",
                        "يحتاج وقتا كافيا قبل اتخاذ القرار.",
                        "لا يحب التغييرات المفاجئة ويميل للتخطيط المسبق.",
                    ],
                    "linked_trait": "sequential_reasoning",
                },
            ],
        },
        {
            "id": "forehead_05",
            "trait_ar": "الأصالة في التفكير",
            "trait_en": "originality_in_thinking",
            "measurement_method": "يحدد من خلال انحناء الجبهة إلى الأعلى في منتصفها.",
            "metric_hint": "forehead_ratio",
            "states": [
                {
                    "state_ar": "جبهة ممتلئة ودائرية من أعلى المنتصف",
                    "code": "rounded_center",
                    "indicates": "تفكير إبداعي وأصيل",
                    "personality_traits": [
                        "يمتلك أصالة وإبداعا في طريقة التفكير.",
                        "قادر على توليد أفكار جديدة لم يسبق إليها.",
                        "قد ترتبط لدى النساء بحدس مرتفع بصورة استثنائية.",
                    ],
                    "linked_trait": "originality",
                }
            ],
        },
        {
            "id": "forehead_06",
            "trait_ar": "ملكة الخيال",
            "trait_en": "imagination_capacity",
            "measurement_method": "يحدد من خلال النظر إلى بروز العظم أعلى جانبي الجبهة من شعر الحواجب.",
            "metric_hint": "face_width",
            "states": [
                {
                    "state_ar": "بروزات أعلى جانبي الجبهة",
                    "code": "lateral_bossing",
                    "indicates": "ملكة الخيال",
                    "personality_traits": [
                        "قدرة عالية على التخيل وتكوين الصور الذهنية.",
                        "موهبة في توليد الأفكار الإبداعية والابتكار.",
                        "قد ينتج عن ارتفاع الخيال تصور سلبي أو متشائم أحيانا.",
                    ],
                    "linked_trait": "imagination",
                }
            ],
        },
        {
            "id": "forehead_07",
            "trait_ar": "المرونة الفكرية",
            "trait_en": "cognitive_flexibility",
            "measurement_method": "يحدد من خلال النظر إلى التقاء الجبهة بأعلى الرأس: هل هو انسيابي أم يصنع زاوية حادة.",
            "metric_hint": "forehead_ratio",
            "states": [
                {
                    "state_ar": "الجبهة تلتقي مع أعلى الرأس بانسيابية",
                    "code": "smooth_transition",
                    "indicates": "مرن الفكر",
                    "personality_traits": [
                        "منفتح العقل وسهل النقاش والتعامل.",
                        "قد يغير رأيه بسرعة مع المعطيات الجديدة.",
                        "قد يبدو أحيانا أقل تشبثا بمعتقداته.",
                    ],
                    "linked_trait": "flexibility",
                },
                {
                    "state_ar": "الجبهة تصنع زاوية حادة مع أعلى الرأس",
                    "code": "sharp_angle",
                    "indicates": "ثابت الفكر",
                    "personality_traits": [
                        "حازم وثابت الفكر وصعب النقاش نسبيا.",
                        "لا يحب التغيير ويبدو مخلصا لآرائه.",
                        "قد لا يتقبل توجيهات الآخرين بسهولة.",
                    ],
                    "linked_trait": "rigidity",
                },
            ],
        },
        {
            "id": "forehead_08",
            "trait_ar": "الاهتمامات الفكرية",
            "trait_en": "cognitive_interests",
            "measurement_method": "يحدد من خلال النظر إلى الجبهة أفقيا أو عموديا هل هي مسطحة أم دائرية.",
            "metric_hint": "forehead_ratio",
            "states": [
                {
                    "state_ar": "جبهة مسطحة",
                    "code": "flat",
                    "indicates": "الاهتمام بالأشياء والمشاريع والمعلومات",
                    "personality_traits": [
                        "يفضل العمل مع المعلومات والتفاصيل والحقائق العلمية.",
                        "يرتاح للعمل الفردي والمشاريع المحددة.",
                        "يلائم أعمالا ميدانية أو تشغيلية ذات تركيز على الأشياء.",
                    ],
                    "linked_trait": "thing_orientation",
                },
                {
                    "state_ar": "جبهة دائرية",
                    "code": "rounded",
                    "indicates": "الاهتمام بالأشخاص",
                    "personality_traits": [
                        "يفضل العمل مع الناس ويستأنس بوجودهم.",
                        "لا يحب التقييد بمهمة واحدة فقط لفترة طويلة.",
                        "يناسب أدوار خدمة العملاء والضيافة.",
                    ],
                    "linked_trait": "people_orientation",
                },
            ],
        },
        {
            "id": "forehead_09",
            "trait_ar": "اللباقة أو الصراحة المباشرة",
            "trait_en": "tact_vs_directness",
            "measurement_method": "يحدد من خلال النظر إلى جانب الجبهة: هل بها أخدود عند نهاية الحاجب أم هي ملساء مستديرة.",
            "metric_hint": "face_width",
            "states": [
                {
                    "state_ar": "أخدود بجانب الجبهة عند نهاية الحاجب",
                    "code": "groove",
                    "indicates": "أنيق ودبلوماسي",
                    "personality_traits": [
                        "لبق ويختار كلماته بعناية.",
                        "عميق التفكير ودبلوماسي وحذر.",
                        "متزن في تعامله مع المواقف المختلفة.",
                    ],
                    "linked_trait": "tact",
                },
                {
                    "state_ar": "جانب الجبهة مستدير وأملس بدون أخاديد جانبية",
                    "code": "smooth_side",
                    "indicates": "مباشر وصريح",
                    "personality_traits": [
                        "يتحدث بما يفكر مباشرة.",
                        "قد يبدو غير لبق أو مائلا للهجوم.",
                        "قد يحرج الآخرين بصراحته أحيانا.",
                    ],
                    "linked_trait": "directness",
                },
            ],
        },
        {
            "id": "beard_01",
            "trait_ar": "الطيبة",
            "trait_en": "benevolence",
            "measurement_method": "يحدد من خلال النظر إلى أسفل اللحية هل هي مقوسة أم لا.",
            "metric_hint": "face_height",
            "states": [
                {
                    "state_ar": "لحية منحنية",
                    "code": "curved_beard",
                    "indicates": "الطيبة",
                    "personality_traits": [
                        "يميل لحب الأعمال الخيرية.",
                        "يساعد الناس ويتفانى في ذلك.",
                        "أقل ميلا للسيطرة والتحكم.",
                    ],
                    "linked_trait": "kindness",
                }
            ],
        },
        {
            "id": "beard_02",
            "trait_ar": "الاستقلالية",
            "trait_en": "independence",
            "measurement_method": "يحدد من خلال النظر إلى أسفل اللحية هل هو مستقيم أم لا.",
            "metric_hint": "face_width",
            "states": [
                {
                    "state_ar": "اللحية المستقيمة",
                    "code": "straight_beard",
                    "indicates": "الاستقلالية",
                    "personality_traits": [
                        "يحب الاستقلال والابتعاد النسبي عن الناس.",
                        "يفضل الأعمال الفردية.",
                        "يبدع عندما يعمل منفردا.",
                    ],
                    "linked_trait": "independence",
                }
            ],
        },
        {
            "id": "beard_03",
            "trait_ar": "السيطرة",
            "trait_en": "control_orientation",
            "measurement_method": "يحدد من خلال النظر إلى جانبي اللحية هل هي مثلثة أم لا.",
            "metric_hint": "face_width",
            "states": [
                {
                    "state_ar": "اللحية المثلثة",
                    "code": "triangular_beard",
                    "indicates": "السيطرة",
                    "personality_traits": [
                        "يميل للتحكم والسيطرة.",
                        "يمتلك مهارات قيادية لضبط الأمور.",
                        "يفضل الأعمال القيادية والإدارية.",
                    ],
                    "linked_trait": "control",
                }
            ],
        },
        {
            "id": "nails_01",
            "trait_ar": "الحيوية / التحليلية",
            "trait_en": "vitality_vs_analytical_style",
            "measurement_method": "يحدد من خلال النظر إلى الظفر هل هو طويل عموديا أم عريض.",
            "states": [
                {
                    "state_ar": "الأظافر الطويلة عموديا",
                    "code": "long_vertical",
                    "indicates": "الحيوية",
                    "personality_traits": [
                        "شخصية حيوية واجتماعية ورومنسية ذات خيال خصب.",
                        "تميل للمثالية في كثير من الأمور.",
                        "تنتبه للتفاصيل الدقيقة.",
                    ],
                    "linked_trait": "vitality",
                },
                {
                    "state_ar": "الأظافر العريضة",
                    "code": "wide",
                    "indicates": "التحليلية",
                    "personality_traits": [
                        "يحلل كثيرا ويفكر مرتين قبل التصرف.",
                        "قد يكون سريع الغضب وصريحا بقوة.",
                    ],
                    "linked_trait": "analytical_style",
                },
            ],
        },
        {
            "id": "nails_02",
            "trait_ar": "المرح / الشجاعة",
            "trait_en": "playfulness_vs_courage",
            "measurement_method": "يحدد من خلال شكل الظفر: دائري/بيضاوي أم مربع.",
            "states": [
                {
                    "state_ar": "الأظافر الدائرية أو البيضاوية",
                    "code": "round_oval",
                    "indicates": "المرح",
                    "personality_traits": [
                        "يميل للاسترخاء والاستمتاع بالحياة بطريقته.",
                        "مستقل وعاطفي ويستثمر العاطفة في الإبداع.",
                    ],
                    "linked_trait": "playfulness",
                },
                {
                    "state_ar": "الأظافر المربعة",
                    "code": "square",
                    "indicates": "الشجاعة",
                    "personality_traits": [
                        "شخصية قوية ومتواضعة في الوقت نفسه.",
                        "تتمتع بالشجاعة والثبات وأحيانا المرونة.",
                    ],
                    "linked_trait": "courage",
                },
            ],
        },
        {
            "id": "nails_03",
            "trait_ar": "الذكاء والفطنة",
            "trait_en": "sharp_intelligence",
            "measurement_method": "يحدد من خلال زاوية المثلث في الظفر.",
            "states": [
                {
                    "state_ar": "الأظافر على شكل مثلث أو مثلث مقلوب",
                    "code": "triangular_nail",
                    "indicates": "الذكاء والحساسية",
                    "personality_traits": [
                        "يتطلع لأن يكون الأبرز في المجموعة.",
                        "يلاحظ التفاصيل الصغيرة التي لا يلاحظها الآخرون.",
                        "ذكاؤه حاد مع حساسية داخلية واضحة.",
                    ],
                    "linked_trait": "sharp_intelligence",
                }
            ],
        },
        {
            "id": "nails_04",
            "trait_ar": "المشاعر",
            "trait_en": "emotional_warmth",
            "measurement_method": "يحدد من خلال كون الظفر على شكل ثمرة اللوز.",
            "states": [
                {
                    "state_ar": "الأظافر على شكل ثمرة اللوز",
                    "code": "almond",
                    "indicates": "المشاعر",
                    "personality_traits": [
                        "محب ومخلص وصادق.",
                        "محبوب ويعرف كيف يواجه المواقف الصعبة.",
                        "قد يغضب بسهولة إذا لم تسر الأمور كما يريد.",
                    ],
                    "linked_trait": "emotional_warmth",
                }
            ],
        },
        {
            "id": "nails_05",
            "trait_ar": "الإصرار",
            "trait_en": "determination",
            "measurement_method": "يحدد من خلال كون الظفر على شكل سيف مدبب.",
            "states": [
                {
                    "state_ar": "الأظافر على شكل سيف",
                    "code": "sword",
                    "indicates": "الإصرار",
                    "personality_traits": [
                        "لديه هدف محدد يعمل من أجل تحقيقه.",
                        "لا يخشى المجهول.",
                        "لا يبرع كثيرا في العمل الجماعي إذا لم يواكب الآخرون إيقاعه.",
                    ],
                    "linked_trait": "determination",
                }
            ],
        },
    ],
}


PDF_LABELS_COMPLETE = {}
PDF_LABELS_COMPLETE.update(
    _expand(
        [12, 13, 14],
        {
            "trait": "intellectual_range",
            "trait_ar": "المدى الفكري",
            "right_label": "high",
            "left_label": "short",
            "view": "frontal",
            "mode": "pair",
        },
    )
)
PDF_LABELS_COMPLETE.update(
    _expand(
        [16, 17, 18],
        {
            "trait": "renewal_vs_conservatism",
            "trait_ar": "التجديد أو المحافظة",
            "right_label": "square",
            "left_label": "oval",
            "view": "frontal",
            "mode": "pair",
        },
    )
)
PDF_LABELS_COMPLETE.update(
    _expand(
        [20, 21, 22],
        {
            "trait": "patience_span",
            "trait_ar": "الصبر أو طول البال",
            "right_label": "widens_upward",
            "left_label": "narrows_upward",
            "view": "frontal",
            "mode": "pair",
        },
    )
)
PDF_LABELS_COMPLETE.update(
    _expand(
        [24, 25, 26, 27],
        {
            "trait": "thinking_style",
            "trait_ar": "أسلوب التفكير",
            "right_label": "sloped_back",
            "left_label": "vertical",
            "view": "profile",
            "mode": "pair",
        },
    )
)
PDF_LABELS_COMPLETE.update(
    _expand(
        [29, 30, 31],
        {
            "trait": "originality_in_thinking",
            "trait_ar": "الأصالة في التفكير",
            "label": "rounded_center",
            "view": "profile",
            "mode": "single",
        },
    )
)
PDF_LABELS_COMPLETE.update(
    _expand(
        [33, 34, 35],
        {
            "trait": "imagination_capacity",
            "trait_ar": "ملكة الخيال",
            "label": "lateral_bossing",
            "view": "profile",
            "mode": "single",
        },
    )
)
PDF_LABELS_COMPLETE.update(
    _expand(
        [37, 38, 39],
        {
            "trait": "cognitive_flexibility",
            "trait_ar": "المرونة الفكرية",
            "right_label": "smooth_transition",
            "left_label": "sharp_angle",
            "view": "profile",
            "mode": "pair",
        },
    )
)
PDF_LABELS_COMPLETE.update(
    _expand(
        [41, 42, 43],
        {
            "trait": "cognitive_interests",
            "trait_ar": "الاهتمامات الفكرية",
            "right_label": "flat",
            "left_label": "rounded",
            "view": "frontal",
            "mode": "pair",
        },
    )
)
PDF_LABELS_COMPLETE.update(
    _expand(
        [45, 46, 47],
        {
            "trait": "tact_vs_directness",
            "trait_ar": "اللباقة أو الصراحة المباشرة",
            "right_label": "groove",
            "left_label": "smooth_side",
            "view": "frontal",
            "mode": "pair",
        },
    )
)
PDF_LABELS_COMPLETE.update(
    _expand(
        [53],
        {
            "trait": "benevolence",
            "trait_ar": "الطيبة",
            "label": "curved_beard",
            "view": "frontal",
            "mode": "single",
        },
    )
)
PDF_LABELS_COMPLETE.update(
    _expand(
        [54],
        {
            "trait": "independence",
            "trait_ar": "الاستقلالية",
            "label": "straight_beard",
            "view": "frontal",
            "mode": "single",
        },
    )
)
PDF_LABELS_COMPLETE.update(
    _expand(
        [55],
        {
            "trait": "control_orientation",
            "trait_ar": "السيطرة",
            "label": "triangular_beard",
            "view": "profile",
            "mode": "single",
        },
    )
)


SINGLE_FACE_PAGES_COMPLETE = {
    page: {"trait": payload["trait"], "label": payload["label"]}
    for page, payload in PDF_LABELS_COMPLETE.items()
    if payload["mode"] == "single"
}


PAGES_TO_IGNORE = {
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    15,
    19,
    23,
    28,
    32,
    36,
    40,
    44,
    48,
    49,
    50,
    51,
    52,
    56,
    57,
    58,
    59,
    60,
    61,
    62,
    63,
    64,
    65,
    66,
    67,
    68,
    69,
    70,
}


COMPARISONS = [
    {
        "trait": "intellectual_range",
        "trait_ar": "المدى الفكري",
        "metric": "forehead_ratio",
        "high_label": "high",
        "high_meaning": "جبهة عالية",
        "low_label": "short",
        "low_meaning": "جبهة قصيرة",
    },
    {
        "trait": "renewal_vs_conservatism",
        "trait_ar": "التجديد أو المحافظة",
        "metric": "widening_ratio",
        "high_label": "square",
        "high_meaning": "جبهة مربعة",
        "low_label": "oval",
        "low_meaning": "جبهة بيضاوية",
    },
    {
        "trait": "patience_span",
        "trait_ar": "الصبر أو طول البال",
        "metric": "widening_ratio",
        "high_label": "widens_upward",
        "high_meaning": "الجبهة تتسع للأعلى",
        "low_label": "narrows_upward",
        "low_meaning": "الجبهة تضيق إلى الأعلى",
    },
    {
        "trait": "thinking_style",
        "trait_ar": "أسلوب التفكير",
        "metric": "forehead_ratio",
        "high_label": "sloped_back",
        "high_meaning": "جبهة مائلة للخلف",
        "low_label": "vertical",
        "low_meaning": "جبهة عمودية للأعلى",
    },
    {
        "trait": "cognitive_flexibility",
        "trait_ar": "المرونة الفكرية",
        "metric": "forehead_ratio",
        "high_label": "smooth_transition",
        "high_meaning": "التقاء انسيابي",
        "low_label": "sharp_angle",
        "low_meaning": "زاوية حادة",
    },
    {
        "trait": "cognitive_interests",
        "trait_ar": "الاهتمامات الفكرية",
        "metric": "forehead_ratio",
        "high_label": "flat",
        "high_meaning": "جبهة مسطحة",
        "low_label": "rounded",
        "low_meaning": "جبهة دائرية",
    },
    {
        "trait": "tact_vs_directness",
        "trait_ar": "اللباقة أو الصراحة المباشرة",
        "metric": "face_width",
        "high_label": "groove",
        "high_meaning": "أخدود جانبي",
        "low_label": "smooth_side",
        "low_meaning": "جانب أملس",
    },
]


def find_day1_pdf():
    for pdf_path in PDF_CANDIDATES:
        text = (PdfReader(str(pdf_path)).pages[0].extract_text() or "")
        if "اليوم الأول" in text:
            return pdf_path
    raise FileNotFoundError("Could not locate the day 1 PDF.")


def ensure_dirs():
    PAGES_DIR.mkdir(parents=True, exist_ok=True)


def render_pages(pdf_path):
    doc = fitz.open(pdf_path)
    image_paths = {}
    for idx, page in enumerate(doc, start=1):
        out_path = PAGES_DIR / f"page_{idx:03d}.jpg"
        pix = page.get_pixmap(dpi=100, alpha=False)
        pix.save(str(out_path))
        image_paths[idx] = out_path
    return image_paths


def make_landmarker():
    options = vision.FaceLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(MODEL_PATH)),
        running_mode=vision.RunningMode.IMAGE,
        num_faces=8,
        min_face_detection_confidence=0.25,
        min_face_presence_confidence=0.25,
        min_tracking_confidence=0.25,
    )
    return vision.FaceLandmarker.create_from_options(options)


def detect_faces(landmarker, image_bgr):
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    return landmarker.detect(mp_image)


def detect_faces_retry(landmarker, image_bgr, scales=(1.0, 0.85, 0.7, 0.55)):
    best_result = None
    best_count = -1
    for scale in scales:
        if scale == 1.0:
            candidate = image_bgr
        else:
            candidate = cv2.resize(image_bgr, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        result = detect_faces(landmarker, candidate)
        count = len(result.face_landmarks) if result.face_landmarks else 0
        if count > best_count:
            best_result = result
            best_count = count
        if count:
            return result
    return best_result


def landmark_bbox(landmarks, width, height):
    xs = [max(0, min(width - 1, int(lm.x * width))) for lm in landmarks]
    ys = [max(0, min(height - 1, int(lm.y * height))) for lm in landmarks]
    return {
        "x1": min(xs),
        "y1": min(ys),
        "x2": max(xs),
        "y2": max(ys),
    }


def sort_faces_right_to_left(face_entries):
    return sorted(face_entries, key=lambda item: item["center_x"], reverse=True)


def crop_with_padding(image_bgr, bbox):
    height, width = image_bgr.shape[:2]
    bw = bbox["x2"] - bbox["x1"]
    bh = bbox["y2"] - bbox["y1"]
    x1 = max(0, int(bbox["x1"] - 0.15 * bw))
    x2 = min(width, int(bbox["x2"] + 0.15 * bw))
    y1 = max(0, int(bbox["y1"] - 0.50 * bh))
    y2 = min(height, int(bbox["y2"] + 0.15 * bh))
    crop = image_bgr[y1:y2, x1:x2].copy()
    return crop, {"x1": x1, "y1": y1, "x2": x2, "y2": y2}


def best_face_from_crop(landmarker, crop_bgr):
    result = detect_faces_retry(landmarker, crop_bgr)
    if not result.face_landmarks:
        return None
    height, width = crop_bgr.shape[:2]
    candidates = []
    for landmarks in result.face_landmarks:
        bbox = landmark_bbox(landmarks, width, height)
        area = (bbox["x2"] - bbox["x1"]) * (bbox["y2"] - bbox["y1"])
        candidates.append((area, landmarks))
    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[0][1]


def pt(landmarks, idx, width, height):
    lm = landmarks[idx]
    return np.array([lm.x * width, lm.y * height], dtype=float)


def euclidean(a, b):
    return float(np.linalg.norm(a - b))


def safe_div(num, den):
    if not den:
        return None
    return float(num / den)


def sample_skin(image_bgr, center):
    x = int(round(center[0]))
    y = int(round(center[1]))
    h, w = image_bgr.shape[:2]
    x1 = max(0, x - 2)
    x2 = min(w, x + 3)
    y1 = max(0, y - 2)
    y2 = min(h, y + 3)
    patch = image_bgr[y1:y2, x1:x2]
    if patch.size == 0:
        return np.array([0.0, 0.0, 0.0])
    return patch.reshape(-1, 3).mean(axis=0)


def detect_hairline(image_bgr, landmarks):
    height, width = image_bgr.shape[:2]
    p10 = pt(landmarks, 10, width, height)
    p168 = pt(landmarks, 168, width, height)
    start = (p10 + p168) / 2.0
    skin = sample_skin(image_bgr, start)
    x = int(round(start[0]))
    x = max(0, min(width - 1, x))
    start_y = int(round(start[1]))
    limit_y = max(0, int(round(p10[1] - height * 0.25)))
    best = None
    consecutive = 0
    for y in range(start_y, limit_y - 1, -1):
        pixel = image_bgr[y, x].astype(float)
        dist = float(np.linalg.norm(pixel - skin))
        if dist > 60.0:
            consecutive += 1
            if best is None:
                best = y
            if consecutive >= 3:
                return np.array([x, best], dtype=float), True
        else:
            best = None
            consecutive = 0
    return p10, False


def compute_metrics(crop_bgr, landmarks):
    height, width = crop_bgr.shape[:2]
    hairline, used_hairline = detect_hairline(crop_bgr, landmarks)
    p168 = pt(landmarks, 168, width, height)
    p9 = pt(landmarks, 9, width, height)
    p152 = pt(landmarks, 152, width, height)
    p103 = pt(landmarks, 103, width, height)
    p332 = pt(landmarks, 332, width, height)
    p70 = pt(landmarks, 70, width, height)
    p300 = pt(landmarks, 300, width, height)
    p234 = pt(landmarks, 234, width, height)
    p454 = pt(landmarks, 454, width, height)
    p33 = pt(landmarks, 33, width, height)
    p133 = pt(landmarks, 133, width, height)
    p263 = pt(landmarks, 263, width, height)
    p362 = pt(landmarks, 362, width, height)
    p159 = pt(landmarks, 159, width, height)
    p145 = pt(landmarks, 145, width, height)
    p386 = pt(landmarks, 386, width, height)
    p374 = pt(landmarks, 374, width, height)
    p1 = pt(landmarks, 1, width, height)
    p2 = pt(landmarks, 2, width, height)
    p61 = pt(landmarks, 61, width, height)
    p291 = pt(landmarks, 291, width, height)
    p13 = pt(landmarks, 13, width, height)
    p14 = pt(landmarks, 14, width, height)
    p0 = pt(landmarks, 0, width, height)
    p17 = pt(landmarks, 17, width, height)
    p172 = pt(landmarks, 172, width, height)
    p397 = pt(landmarks, 397, width, height)
    forehead_height = euclidean(hairline, p168)
    face_height = euclidean(hairline, p152)
    forehead_top_width = euclidean(p103, p332)
    brow_width = euclidean(p70, p300)
    face_width = euclidean(p234, p454)
    right_eye_width = euclidean(p33, p133)
    left_eye_width = euclidean(p362, p263)
    avg_eye_width = (right_eye_width + left_eye_width) / 2.0
    right_eye_open = euclidean(p159, p145)
    left_eye_open = euclidean(p386, p374)
    avg_eye_open = (right_eye_open + left_eye_open) / 2.0
    eye_spacing = euclidean(p133, p362)
    brow_eye_distance = (euclidean(p70, p33) + euclidean(p300, p263)) / 2.0
    mouth_width = euclidean(p61, p291)
    mouth_height = euclidean(p13, p14)
    upper_lip = euclidean(p0, p13)
    lower_lip = euclidean(p14, p17)
    philtrum_length = euclidean(p2, p13)
    lower_face_height = euclidean(p2, p152)
    nose_length = euclidean(p168, p2)
    nose_tip_projection = abs(p1[0] - p168[0])
    nose_tip_drop = p2[1] - p1[1]
    forehead_slant = abs(hairline[0] - p9[0])
    forehead_vertical = abs(hairline[1] - p9[1])
    jaw_width = euclidean(p172, p397)
    chin_projection = abs(p152[0] - p13[0])
    face_aspect_ratio = safe_div(face_width, face_height)
    metrics = {
        "forehead_height": forehead_height,
        "face_height": face_height,
        "forehead_ratio": safe_div(forehead_height, face_height),
        "forehead_top_width": forehead_top_width,
        "brow_width": brow_width,
        "widening_ratio": safe_div(forehead_top_width, brow_width),
        "face_width": face_width,
        "face_aspect_ratio": face_aspect_ratio,
        "eye_spacing": eye_spacing,
        "eye_spacing_ratio": safe_div(eye_spacing, face_width),
        "eye_size_ratio": safe_div(avg_eye_width, face_width),
        "eye_open_ratio": safe_div(avg_eye_open, avg_eye_width),
        "eye_tilt_ratio": safe_div((p263[1] - p33[1]), euclidean(p33, p263)),
        "brow_eye_distance_ratio": safe_div(brow_eye_distance, face_height),
        "mouth_width_ratio": safe_div(mouth_width, face_width),
        "mouth_height_ratio": safe_div(mouth_height, face_height),
        "upper_lip_ratio": safe_div(upper_lip, face_height),
        "lower_lip_ratio": safe_div(lower_lip, face_height),
        "philtrum_ratio": safe_div(philtrum_length, face_height),
        "lower_face_ratio": safe_div(lower_face_height, face_height),
        "nose_length_ratio": safe_div(nose_length, face_height),
        "nose_tip_projection_ratio": safe_div(nose_tip_projection, face_width),
        "nose_tip_drop_ratio": safe_div(nose_tip_drop, face_height),
        "forehead_slant_ratio": safe_div(forehead_slant, forehead_vertical),
        "jaw_width_ratio": safe_div(jaw_width, face_width),
        "chin_projection_ratio": safe_div(chin_projection, face_width),
        "hairline_detected": used_hairline,
        "hairline_point": [round(float(hairline[0]), 3), round(float(hairline[1]), 3)],
    }
    return metrics


def rebase_landmarks(landmarks, crop_meta, page_width, page_height, crop_width, crop_height):
    rebased = []
    for lm in landmarks:
        abs_x = lm.x * page_width
        abs_y = lm.y * page_height
        rel_x = (abs_x - crop_meta["x1"]) / crop_width
        rel_y = (abs_y - crop_meta["y1"]) / crop_height
        rebased.append(SimpleNamespace(x=rel_x, y=rel_y))
    return rebased


def page_face_entries(result, width, height):
    entries = []
    for landmarks in result.face_landmarks:
        bbox = landmark_bbox(landmarks, width, height)
        entries.append(
            {
                "bbox": bbox,
                "center_x": (bbox["x1"] + bbox["x2"]) / 2.0,
                "landmarks": landmarks,
            }
        )
    return entries


def half_page_entries(landmarker, image_bgr):
    height, width = image_bgr.shape[:2]
    halves = [
        ("left", 0, width // 2),
        ("right", width // 2, width),
    ]
    entries = []
    for side, x1, x2 in halves:
        crop = image_bgr[:, x1:x2].copy()
        result = detect_faces_retry(landmarker, crop)
        if not result.face_landmarks:
            continue
        best = None
        best_area = -1
        for landmarks in result.face_landmarks:
            bbox = landmark_bbox(landmarks, crop.shape[1], crop.shape[0])
            area = (bbox["x2"] - bbox["x1"]) * (bbox["y2"] - bbox["y1"])
            if area > best_area:
                best_area = area
                best = landmarks
        if best is None:
            continue
        rebased = []
        for lm in best:
            abs_x = (lm.x * crop.shape[1] + x1) / width
            abs_y = (lm.y * crop.shape[0]) / height
            rebased.append(SimpleNamespace(x=abs_x, y=abs_y))
        bbox = landmark_bbox(rebased, width, height)
        entries.append(
            {
                "bbox": bbox,
                "center_x": (bbox["x1"] + bbox["x2"]) / 2.0,
                "landmarks": rebased,
                "source": f"half_{side}",
            }
        )
    return entries


def assign_labels_for_page(entries, page_number, cfg, width):
    labels = []
    if cfg["mode"] == "single":
        for entry in entries:
            labels.append((entry, cfg["label"], "single"))
        return labels

    if len(entries) <= 2:
        ordered = sort_faces_right_to_left(entries)
        if len(ordered) >= 1:
            labels.append((ordered[0], cfg["right_label"], "right"))
        if len(ordered) >= 2:
            labels.append((ordered[1], cfg["left_label"], "left"))
        return labels

    mid_x = width / 2.0
    right_side = [entry for entry in entries if entry["center_x"] >= mid_x]
    left_side = [entry for entry in entries if entry["center_x"] < mid_x]
    for entry in sort_faces_right_to_left(right_side):
        labels.append((entry, cfg["right_label"], "right"))
    for entry in sort_faces_right_to_left(left_side):
        labels.append((entry, cfg["left_label"], "left"))
    return labels


def clean_text(text):
    text = re.sub(r"\s+", " ", text or "").strip()
    return text


def build_inventory(pdf_path, image_paths):
    reader = PdfReader(str(pdf_path))
    inventory = []
    with make_landmarker() as landmarker:
        for page_number, image_path in image_paths.items():
            image_bgr = cv2.imread(str(image_path))
            height, width = image_bgr.shape[:2]
            result = detect_faces_retry(landmarker, image_bgr)
            face_count = len(result.face_landmarks) if result.face_landmarks else 0
            page_text = clean_text(reader.pages[page_number - 1].extract_text() or "")
            inventory.append(
                {
                    "page": page_number,
                    "image": str(image_path),
                    "width": width,
                    "height": height,
                    "face_count": face_count,
                    "text_length": len(page_text),
                    "text_sample": page_text[:220],
                    "is_labeled_page": page_number in PDF_LABELS_COMPLETE,
                    "ignored": page_number in PAGES_TO_IGNORE,
                }
            )
    return inventory


def load_existing_dataset():
    dataset_path = ROOT / "dataset_complete.json"
    if not dataset_path.exists():
        return []
    return json.loads(dataset_path.read_text(encoding="utf-8"))


def merge_dataset(existing, current):
    seen = {
        (item.get("pdf_day"), item["page"], item["label"], item["position"], item.get("sample_index", 0))
        for item in existing
    }
    merged = list(existing)
    for item in current:
        key = (item.get("pdf_day"), item["page"], item["label"], item["position"], item.get("sample_index", 0))
        if key not in seen:
            merged.append(item)
            seen.add(key)
    return merged


def build_dataset(image_paths):
    dataset = []
    errors = []
    with make_landmarker() as landmarker:
        for page_number, cfg in sorted(PDF_LABELS_COMPLETE.items()):
            image_bgr = cv2.imread(str(image_paths[page_number]))
            height, width = image_bgr.shape[:2]
            result = detect_faces_retry(landmarker, image_bgr)
            entries = page_face_entries(result, width, height) if result.face_landmarks else []
            if cfg["mode"] == "pair" and len(entries) < 2:
                half_entries = half_page_entries(landmarker, image_bgr)
                if len(half_entries) >= len(entries):
                    entries = half_entries
            if not entries:
                errors.append({"page": page_number, "error": "no_faces_detected"})
                continue
            assignments = assign_labels_for_page(entries, page_number, cfg, width)
            if not assignments:
                errors.append({"page": page_number, "error": "no_assignments_created"})
                continue
            for sample_index, (entry, label, position) in enumerate(assignments, start=1):
                crop_bgr, crop_meta = crop_with_padding(image_bgr, entry["bbox"])
                refined_landmarks = best_face_from_crop(landmarker, crop_bgr)
                if refined_landmarks is None:
                    crop_h, crop_w = crop_bgr.shape[:2]
                    refined_landmarks = rebase_landmarks(entry["landmarks"], crop_meta, width, height, crop_w, crop_h)
                    error_note = "crop_landmark_fallback_fullpage"
                else:
                    error_note = None
                metrics = compute_metrics(crop_bgr, refined_landmarks)
                if error_note:
                    errors.append({"page": page_number, "error": error_note, "label": label})
                dataset.append(
                    {
                        "pdf_day": "day1",
                        "page": page_number,
                        "trait": cfg["trait"],
                        "trait_ar": cfg["trait_ar"],
                        "label": label,
                        "position": position,
                        "view": cfg["view"],
                        "sample_index": sample_index,
                        "crop_bbox": crop_meta,
                        "metrics": {k: (round(v, 6) if isinstance(v, float) else v) for k, v in metrics.items()},
                    }
                )
    return dataset, errors


def derive_thresholds(dataset):
    thresholds = []
    for comparison in COMPARISONS:
        trait = comparison["trait"]
        metric = comparison["metric"]
        high_values = [
            item["metrics"][metric]
            for item in dataset
            if item["trait"] == trait and item["label"] == comparison["high_label"] and item["metrics"].get(metric) is not None
        ]
        low_values = [
            item["metrics"][metric]
            for item in dataset
            if item["trait"] == trait and item["label"] == comparison["low_label"] and item["metrics"].get(metric) is not None
        ]
        if not high_values or not low_values:
            thresholds.append(
                {
                    **comparison,
                    "high_avg": None,
                    "low_avg": None,
                    "difference": None,
                    "threshold": None,
                    "effective": False,
                    "confidence": "missing_data",
                }
            )
            continue
        high_avg = sum(high_values) / len(high_values)
        low_avg = sum(low_values) / len(low_values)
        difference = abs(high_avg - low_avg)
        threshold = (high_avg + low_avg) / 2.0
        if difference > 0.05:
            confidence = "high"
        elif difference > 0.02:
            confidence = "medium"
        elif difference > 0.01:
            confidence = "low"
        else:
            confidence = "insufficient"
        thresholds.append(
            {
                **comparison,
                "high_avg": round(high_avg, 6),
                "low_avg": round(low_avg, 6),
                "difference": round(difference, 6),
                "threshold": round(threshold, 6),
                "effective": difference > 0.01,
                "confidence": confidence,
                "high_n": len(high_values),
                "low_n": len(low_values),
            }
        )
    return thresholds


def build_summary(inventory, dataset, thresholds, dataset_errors):
    total_faces = sum(item["face_count"] for item in inventory)
    labeled_samples = len(dataset)
    effective_count = sum(1 for item in thresholds if item["effective"])
    pages_processed = len(inventory)

    by_label = {}
    for item in dataset:
        trait_key = (item["trait_ar"], item["trait"], item["label"])
        by_label.setdefault(trait_key, []).append(item)

    lines = [
        "📊 Summary:",
        f"- Total pages processed: {pages_processed}",
        f"- Total faces detected: {total_faces}",
        f"- Total labeled samples: {labeled_samples}",
        f"- Effective thresholds found: {effective_count}",
        "",
        "📈 Label aggregates:",
    ]

    for (trait_ar, trait_en, label), items in sorted(by_label.items()):
        ratios = [x["metrics"]["forehead_ratio"] for x in items if x["metrics"].get("forehead_ratio") is not None]
        widening = [x["metrics"]["widening_ratio"] for x in items if x["metrics"].get("widening_ratio") is not None]
        lines.append(
            f"- {trait_ar} / {trait_en} / {label}: n={len(items)}, "
            f"forehead_ratio={round(sum(ratios) / len(ratios), 4) if ratios else 'n/a'}, "
            f"widening_ratio={round(sum(widening) / len(widening), 4) if widening else 'n/a'}"
        )

    lines.append("")
    lines.append("📏 Thresholds:")
    for item in thresholds:
        status = "✅ Effective" if item["effective"] else "⚠ Needs more data"
        if item["threshold"] is None:
            lines.append(f"- {item['trait_ar']} ({item['metric']}): {status} - missing data")
            continue
        lines.append(
            f"- {item['trait_ar']} ({item['metric']}): "
            f"{item['high_label']} avg={item['high_avg']:.4f} (n={item['high_n']}), "
            f"{item['low_label']} avg={item['low_avg']:.4f} (n={item['low_n']}), "
            f"diff={item['difference']:.4f}, threshold={item['threshold']:.4f}, {status}, confidence={item['confidence']}"
        )

    if dataset_errors:
        lines.append("")
        lines.append("⚠ Page-level errors:")
        for error in dataset_errors:
            lines.append(f"- page {error['page']}: {error['error']}")

    return "\n".join(lines) + "\n"


def write_outputs(inventory, dataset, thresholds, summary, dataset_errors):
    (ROOT / "day1_data.json").write_text(
        json.dumps(THEORY_DATA, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (ROOT / "all_pages_inventory.json").write_text(
        json.dumps(
            {
                "pdf_day": "day1",
                "pages_dir": str(PAGES_DIR),
                "inventory": inventory,
                "dataset_errors": dataset_errors,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    labels_py = "\n".join(
        [
            "PDF_LABELS_COMPLETE = " + json.dumps({"day1": PDF_LABELS_COMPLETE}, ensure_ascii=False, indent=2),
            "",
            "SINGLE_FACE_PAGES_COMPLETE = " + json.dumps({"day1": SINGLE_FACE_PAGES_COMPLETE}, ensure_ascii=False, indent=2),
            "",
            "PAGES_TO_IGNORE = " + repr(PAGES_TO_IGNORE),
            "",
        ]
    )
    (ROOT / "pdf_labels_complete.py").write_text(labels_py, encoding="utf-8")
    existing = load_existing_dataset()
    merged = merge_dataset(existing, dataset)
    (ROOT / "dataset_complete.json").write_text(
        json.dumps(merged, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (ROOT / "thresholds_from_pdf.json").write_text(
        json.dumps({"pdf_day": "day1", "comparisons": thresholds}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (ROOT / "summary_report.md").write_text(summary, encoding="utf-8")


def main():
    ensure_dirs()
    pdf_path = find_day1_pdf()
    image_paths = render_pages(pdf_path)
    inventory = build_inventory(pdf_path, image_paths)
    dataset, dataset_errors = build_dataset(image_paths)
    thresholds = derive_thresholds(dataset)
    summary = build_summary(inventory, dataset, thresholds, dataset_errors)
    write_outputs(inventory, dataset, thresholds, summary, dataset_errors)
    safe_summary = summary.encode("cp1256", errors="ignore").decode("cp1256", errors="ignore")
    print(safe_summary)


if __name__ == "__main__":
    main()
