"""
Phase 1 — Indicator inventory builder.

Input : free_host_package/firasa_master_dataset.json  (600 sabti_traits, raw OCR)
Output:
  - indicators_clean.json    full per-trait cleaned indicators
  - indicators_unique.json   unique cleaned phrase -> {count, trait_ids[], region}
  - indicators_unique.txt    human-readable, sorted by count desc
  - indicators_by_region.txt summary per facial region
"""

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC  = ROOT / "free_host_package" / "firasa_master_dataset.json"
OUT  = ROOT / "phase1_out"
OUT.mkdir(exist_ok=True)

# ---------------------------------------------------------------- OCR fixes
# Order matters: specific multi-char artifacts first, then per-token, then char level.
HARD_FIXES = [
    # ---- OCR splits with " . " or " · " inside words (very common) ----------
    # ". في" leftover meaning "في" mid-phrase  ->  "في"
    (r"\s*\.\s*في(?=\s|$)", " في"),
    # ---- common OCR remnants observed in Phase 3 ---------------------------
    (r"تُعينّ|تعينّ|يُعينّ|يعينّ", "يعبّر"),
    (r"يُغ\s*يّ|يُغ\s*ي|يغ\s*يّ|يغ\s*ي", "يغيّر"),
    (r"تغ\s*يّ|تغ\s*ي", "تغيّر"),
    (r"تنط\s*[.·]?\s*ئف|تنط\s+ئف", "تنطفئ"),
    (r"ين\s*[.·]?\s*في(?=\s|$)", "ينفي"),
    (r"\bبخ\s+ي(?=\s|$)", "بخير"),
    (r"مبا\s*رس?رة|مبا\s*رشرة|مبا\s*رس?ر", "مباشرة"),
    (r"\bح\s*:\s*ت(?=\s|$)", "حتى"),
    (r"\bلا\s+ير\s*[.·]\s*ض\b", "لا يرضى"),
    (r"\bير\s*[.·]\s*ض\b", "يرضى"),
    (r"\bتر\s*[.·]\s*ض\b", "ترضى"),
    (r"\bإيش|ر\s+يش\b", "إيش"),
    (r"\bمف[ا]?\s*[.·]\s*ئج\b|\bمفا\s+ئج\b", "مفاجئ"),
    (r"\bت\s*:\s*يقب\b", "تترقب"),
    (r"\bم\s*:\s*يقب\b", "مترقب"),
    (r"\bالغ\s+تة\b", "الغيرة"),
    (r"\bال\s*[.·]?\s*تجسية\b", "الحساسية"),
    (r"\bالغموض\s+الإيجا\s*[.·]\s*ين\b", "الغموض الإيجابي"),
    (r"\bالعُمق\s+العاط\s*[.·]?\s*يف\b", "العمق العاطفي"),
    (r"\bالميل\s+للوم\s+الذا\s*:?\s*ين\b", "الميل للوم الذاتي"),
    (r"\bالنُبل\s+الداخ\s*يل\b|\bالداخ\s*يل\b", "الداخلي"),
    (r"\bالاجتما\s*يع\b", "الاجتماعي"),
    (r"\bالشيــــع\b|\bالشي\s*ع\b", "الشيعي"),
    (r"\bالذا\s*:?\s*ين\b", "الذاتي"),
    (r"\bالصبر\s+ال\s*[.·]?\s*ي\b|\bالص\s*[.·]?\s*ي(?=\s|$)", "الصبر"),
    (r"\b[ء-ي]?\s*رش?ح(?=\s)", "يلمح"),    # "ي رشح" → "يلمح" (rough)
    # "X : Y"  where ':' splits a word, e.g. "م :يدد"->"متردد", "ي :يدد"->"يتردد",
    # "ف :ية"->"فترة"  (best-effort)
    (r"م\s*:\s*يدد", "متردد"),
    (r"ي\s*:\s*يدد", "يتردد"),
    (r"ف\s*:\s*ية", "فترة"),
    (r"ل\s*:\s*ية", "لفترة"),
    # "بشعة" appears as OCR for "بشكل" in many places
    (r"\bبشعة\b", "بشكل"),
    # "قلي الا" -> "قليلاً"
    (r"قلي\s+الا", "قليلاً"),
    (r"قلي\s+ل\s*", "قليل "),
    # "تعب ي" -> "تعابير" (very common: "تعب ي العين"="تعابير العين")
    (r"تعب\s+ي(?=\s)", "تعابير"),
    (r"تعب\s+يية", "تعبيرية"),
    # "متغ ية" -> "متغيرة"
    (r"متغ\s+ية", "متغيرة"),
    (r"غ\s+ية(?=\s|$)", "غيرة"),
    # broken "عين" / "عيون" forms
    (r"ع\s*[.·]\s*ي(?=\s|$|[^ا-ي])", "عين"),
    (r"ع\s*[.·]\s*يون", "عيون"),
    # "أكثر" written as "أك $ي" or "أك ثي"
    (r"أك\s*[\$#]?\s*[ث]?\s*ي(?=\s|$)", "أكثر"),
    (r"أك\s*\$\s*ي", "أكثر"),
    # "غير"  ->  "غ ي"
    (r"غ\s+ي(?=\s|$)", "غير"),
    # "كثير" -> "كث ي" / "كث يًا"
    (r"كث\s+ي(ًا|ا)?", lambda m: "كثير" + (m.group(1) or "")),
    # "كيف" -> "كا . يف"
    (r"كا\s*[.·]\s*يف", "كيف"),
    # "يلتفت" -> "يُل. ت" / "يل. ت"
    (r"ي[ُ]?\s*ل\s*[.·]\s*ت(?=\s|$)", "يلتفت"),
    # ending "يف" alone => "في"
    (r"(?<=\s)يف(?=\s|$)", "في"),
    (r"^يف(?=\s|$)", "في"),
    # "علي" / "علىَ"  -> "ع يلى"
    (r"ع\s+يلى", "علي"),
    # trailing/leading dots inside Arabic word "X . يY" -> "XيY"
    (r"([ا-ي])\s*[.·]\s*ي([ا-ي])", r"\1ي\2"),
    # "X .ي" at word end -> "Xي"
    (r"([ا-ي])\s*[.·]\s*ي(?=\s|$)", r"\1ي"),
    # repeated punctuation noise "سري••••ع" -> "سريع"
    (r"([ا-ي])[•·\.]{2,}([ا-ي])", r"\1\2"),
    # stray $ # ~ inside words
    (r"[\$#~]", ""),
    # stray standalone middle dot
    (r"\s[·]\s", " "),
    # parenthesised English notes inside Arabic: drop
    (r"\([A-Za-z\-]+\)", ""),
    # extra spaces
    (r"\s+", " "),
]

# remove tashkeel (diacritics) for matching, keep originals for display
TASHKEEL = re.compile(r"[ً-ْٰـ]")

def clean_phrase(s: str) -> str:
    s = s.strip()
    # strip leading bullet residue
    s = re.sub(r"^[•●\-\*\s]+", "", s)
    for pat, rep in HARD_FIXES:
        s = re.sub(pat, rep, s)
    return s.strip()

def normalize_for_match(s: str) -> str:
    s = TASHKEEL.sub("", s)
    s = s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ى", "ي").replace("ة", "ه")
    s = re.sub(r"\s+", " ", s).strip()
    return s

# ---------------------------------------------------------------- region tagging
REGION_KEYWORDS = {
    "eye":      ["عين", "عيون", "عينان", "نظرة", "حدقة", "بؤبؤ", "جفن", "رمش"],
    "brow":     ["حاجب", "حواجب"],
    "forehead": ["جبهة", "جبين", "تجاعيد"],
    "mouth":    ["فم", "ابتسامة", "تبسم", "ضحكة"],
    "lips":     ["شفة", "شفاه", "شفتان"],
    "chin":     ["ذقن", "ذقَن"],
    "jaw":      ["فك", "فكّ", "الفك"],
    "cheek":    ["خد", "خدود", "خدّ", "وجنة", "وجنتان"],
    "nose":     ["أنف", "منخار", "فتحة الأنف"],
    "ear":      ["أذن", "أذنان"],
    "hair":     ["شعر", "منبت", "خصلة"],
    "face":     ["وجه", "ملامح", "محيا", "تعابير"],
    "head":     ["رأس", "رقبة", "عنق"],
    "gaze_behavior": ["تراقب", "تتبع", "تنسحب", "تتجنّب", "تتجنب", "تبحث", "تلمع", "تومض", "ترفض", "تطلب"],
    "verbal":   ["يقول", "ينطق", "يكرر", "يكرّر", "يهمس", "يسأل", "يتكلم"],
    "posture":  ["جسد", "كتف", "ظهر", "وقفة", "حركة", "يميل", "ينحني"],
}

def tag_regions(phrase_norm: str) -> list[str]:
    tags = []
    for region, kws in REGION_KEYWORDS.items():
        for kw in kws:
            if kw in phrase_norm:
                tags.append(region)
                break
    return tags or ["unknown"]

# ---------------------------------------------------------------- main
def main():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    traits = data["sabti_traits"]

    cleaned_per_trait = []
    unique = {}  # key: normalized -> {display, count, traits, regions}

    for t in traits:
        new_inds = []
        for raw in t["facial_indicators"]:
            cleaned = clean_phrase(raw)
            if not cleaned:
                continue
            norm = normalize_for_match(cleaned)
            new_inds.append({"raw": raw, "clean": cleaned, "norm": norm})
            rec = unique.setdefault(norm, {
                "display": cleaned,
                "count": 0,
                "traits": [],
                "regions": tag_regions(norm),
            })
            rec["count"] += 1
            rec["traits"].append(t["id"])
        cleaned_per_trait.append({
            "id": t["id"],
            "name": t["name"],
            "indicators": new_inds,
        })

    # outputs
    (OUT / "indicators_clean.json").write_text(
        json.dumps(cleaned_per_trait, ensure_ascii=False, indent=2), encoding="utf-8")

    sorted_unique = sorted(unique.items(), key=lambda kv: -kv[1]["count"])
    (OUT / "indicators_unique.json").write_text(
        json.dumps([{"norm": k, **v} for k, v in sorted_unique],
                   ensure_ascii=False, indent=2), encoding="utf-8")

    # text report
    lines = [f"# Unique cleaned indicators: {len(unique)}",
             f"# Total occurrences      : {sum(v['count'] for v in unique.values())}",
             ""]
    for k, v in sorted_unique:
        lines.append(f"{v['count']:4d}  [{','.join(v['regions'])}]  {v['display']}")
    (OUT / "indicators_unique.txt").write_text("\n".join(lines), encoding="utf-8")

    # by-region report
    region_count = Counter()
    region_phrases = defaultdict(list)
    for k, v in unique.items():
        for r in v["regions"]:
            region_count[r] += v["count"]
            region_phrases[r].append((v["count"], v["display"]))
    lines = [f"# Region distribution (by total occurrences)\n"]
    for r, c in region_count.most_common():
        lines.append(f"{c:5d}  {r}  ({len(region_phrases[r])} unique phrases)")
    lines.append("\n# Top 15 per region\n")
    for r, _ in region_count.most_common():
        lines.append(f"\n## {r}")
        for cnt, ph in sorted(region_phrases[r], reverse=True)[:15]:
            lines.append(f"  {cnt:4d}  {ph}")
    (OUT / "indicators_by_region.txt").write_text("\n".join(lines), encoding="utf-8")

    print(f"traits         : {len(traits)}")
    print(f"unique indicators: {len(unique)}")
    print(f"outputs in       : {OUT}")

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
