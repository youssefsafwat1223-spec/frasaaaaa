"""
Trait Analysis Scoring Engine
==============================

Two public entry points:

    analyze_traits(answers, face_metrics, plan="basic")
        Returns the full trait analysis for a paid user, filtered by plan tier.

    matching_score(profile_a, profile_b)
        Lightweight matching score for the free/teaser tier.
        Does NOT expose individual trait analysis — only a compatibility tag
        plus a short Arabic explanation.

The engine is decoupled from how the frontend renders things.

Inputs
------
* answers       — dict[question_id -> int 1..5]   Likert response from user
* face_metrics  — dict[feature_name -> float]     output of MediaPipe pipeline
* plan          — "basic" | "basic_plus" | "advanced" | "premium"
* profile_a/b   — dict with keys:
                    "face_vector":  dict[feature -> float]   (z-scored is fine)
                    "onboarding":   dict[q_id -> int 1..5]   (7 fixed questions)

Artefacts loaded
----------------
* question_bank.json
* trait_question_matrix.json
* plans.json
* ../phase2_out/trait_feature_map.json         (15 structural traits)
* ../phase2_out/traits_kept.json               (full kept records)
"""

from __future__ import annotations
import json, math
from pathlib import Path
from collections import defaultdict

HERE   = Path(__file__).resolve().parent
PHASE2 = HERE.parent / "phase2_out"
RECON  = HERE.parent / "reconcile_out"

# ------------------------------------------------------------------ loaders
def _load_json(p): return json.loads(Path(p).read_text(encoding="utf-8"))

QUESTION_BANK = {q["id"]: q for q in _load_json(HERE/"question_bank.json")}
TRAIT_MATRIX  = _load_json(HERE/"trait_question_matrix.json")        # tid -> [{question_id, weight}]
PLANS         = _load_json(HERE/"plans.json")                        # plan_name -> [qid]
STRUCT_MAP    = {t["id"]: t for t in _load_json(PHASE2/"trait_feature_map.json")}
TRAITS_KEPT   = {t["id"]: t for t in _load_json(PHASE2/"traits_kept.json")}
# Phase 2 abstract feature  ->  real test.js metric (or "dropped"/"missing")
ALIAS_TABLE   = _load_json(RECON/"feature_alias.json")

# ------------------------------------------------------------------ helpers
def _likert_to_signed(val: int) -> float:
    """1..5 Likert  ->  -1..+1   (3 = neutral)."""
    return (max(1, min(5, val)) - 3) / 2.0

def _confidence(n_answers: int, has_structural: bool) -> str:
    if n_answers >= 3 or (n_answers >= 2 and has_structural):
        return "high"
    if n_answers >= 2 or (n_answers >= 1 and has_structural):
        return "medium"
    if n_answers >= 1 or has_structural:
        return "low"
    return "none"

# ------------------------------------------------------------------ structural sub-score
def _resolve_metric_name(abstract_feature: str) -> tuple[str | None, bool]:
    """Translate a Phase-2 abstract feature name to the real test.js metric.
    Returns (real_metric_name, is_proxy). (None, False) means unavailable."""
    rec = ALIAS_TABLE.get(abstract_feature)
    if not rec or rec["status"] not in ("available",):
        return None, False
    js = rec["js_metric"]
    is_proxy = bool(rec.get("note") == "PROXY/approximation")
    return js, is_proxy

def _structural_subscore(trait_id: str, face_metrics: dict[str, float]) -> float | None:
    """If the trait has a structural mapping, derive an image-based sub-score
    in [-1, +1]. Uses ALIAS_TABLE to look up real metric names produced by test.js.
    Proxy mappings are down-weighted (×0.6) to reflect lower confidence.
    Returns None if no usable feature is found."""
    rec = STRUCT_MAP.get(trait_id)
    if not rec or not face_metrics:
        return None
    scores, weights = [], []
    for f in rec["features"]:
        real_name, is_proxy = _resolve_metric_name(f["feature"])
        if real_name is None:
            continue
        m = face_metrics.get(real_name)
        if m is None:
            continue
        # face_metrics expected to be z-scored. Convert to direction-match.
        d = f["direction"]
        if d in ("high", "up"):
            s = max(-1.0, min(1.0, m))
        elif d in ("low", "down"):
            s = max(-1.0, min(1.0, -m))
        else:  # "flat", "mid", "yes"
            s = max(-1.0, min(1.0, 1.0 - abs(m)))
        w = f["hits"] * (0.6 if is_proxy else 1.0)
        scores.append(s * w)
        weights.append(w)
    if not scores:
        return None
    return sum(scores) / sum(weights)

# ------------------------------------------------------------------ trait analysis
def analyze_traits(answers: dict[str, int],
                   face_metrics: dict[str, float] | None = None,
                   plan: str = "basic") -> dict:
    """Compute scores for every trait, filtered by plan."""
    if plan not in PLANS:
        raise ValueError(f"unknown plan: {plan}")
    plan_questions = set(PLANS[plan])
    face_metrics   = face_metrics or {}

    results = []
    for trait_id, qrefs in TRAIT_MATRIX.items():
        # restrict to questions in plan AND actually answered
        used = [(q["question_id"], q["weight"])
                for q in qrefs
                if q["question_id"] in plan_questions
                and q["question_id"] in answers]
        # question-based sub-score
        if used:
            num = sum(_likert_to_signed(answers[qid]) * w for qid, w in used)
            den = sum(w for _, w in used) or 1.0
            q_sub = num / den              # -1..+1
        else:
            q_sub = None

        s_sub = _structural_subscore(trait_id, face_metrics)
        has_s = s_sub is not None

        # combine: 0.6 questions + 0.4 structural if both available
        if q_sub is not None and s_sub is not None:
            raw = 0.6 * q_sub + 0.4 * s_sub
        elif q_sub is not None:
            raw = q_sub
        elif s_sub is not None:
            raw = s_sub
        else:
            continue   # skip — no data for this trait

        # 0..100 display score
        display = round((raw + 1) / 2 * 100, 1)
        conf = _confidence(len(used), has_s)

        results.append({
            "trait_id": trait_id,
            "score": display,
            "confidence": conf,
            "questions_used": len(used),
            "structural_used": has_s,
        })

    # plan-level summary
    summary = {
        "plan": plan,
        "answered_questions": sum(1 for q in PLANS[plan] if q in answers),
        "plan_size": len(PLANS[plan]),
        "traits_returned": len(results),
        "traits_total": len(TRAIT_MATRIX),
    }
    return {"summary": summary, "traits": results}

# ------------------------------------------------------------------ matching
MATCHING_QUESTIONS = PLANS["matching"]   # 7 fixed Qs shared free + paid

def _cosine(a: dict[str, float], b: dict[str, float]) -> float:
    keys = set(a) & set(b)
    if not keys: return 0.0
    dot = sum(a[k]*b[k] for k in keys)
    na  = math.sqrt(sum(a[k]**2 for k in keys)) or 1.0
    nb  = math.sqrt(sum(b[k]**2 for k in keys)) or 1.0
    return dot / (na * nb)

def _answer_similarity(qa: dict, qb: dict) -> float:
    """1 - normalised L1 distance over Likert answers."""
    keys = set(qa) & set(qb)
    if not keys: return 0.0
    dist = sum(abs(qa[k] - qb[k]) for k in keys) / (4 * len(keys))   # 0..1
    return 1.0 - dist

def matching_score(profile_a: dict, profile_b: dict) -> dict:
    """Lightweight match — NEVER returns trait-level breakdown."""
    face_sim   = _cosine(profile_a.get("face_vector", {}),
                         profile_b.get("face_vector", {}))           # -1..+1
    answer_sim = _answer_similarity(profile_a.get("onboarding", {}),
                                    profile_b.get("onboarding", {})) # 0..1
    # rescale face_sim to 0..1
    face_norm  = max(0.0, (face_sim + 1) / 2)
    score = round((0.5 * face_norm + 0.5 * answer_sim) * 100, 1)

    if score >= 75:
        tag, msg = "high", "توافق قوي على المستويين البصري والشخصي."
    elif score >= 55:
        tag, msg = "medium", "توافق جيد — هناك نقاط التقاء واضحة وبعض الاختلافات."
    else:
        tag, msg = "low", "توافق محدود في هذه المرحلة — قد يكشف التحليل المعمّق المزيد."
    return {
        "match_score": score,
        "compatibility": tag,
        "explanation_ar": msg,
        # explicitly do NOT include per-trait analysis here
    }

# ------------------------------------------------------------------ demo
if __name__ == "__main__":
    import sys; sys.stdout.reconfigure(encoding="utf-8")
    print("== Engine smoke test ==")
    print("plans available  :", list(PLANS.keys()))
    print("trait matrix size:", len(TRAIT_MATRIX))
    print("alias status mix :", {k: sum(1 for v in ALIAS_TABLE.values() if v['status']==k)
                                  for k in ('available','dropped','calibrated_only','missing')})
    # ---- fake user, premium plan, with realistic z-scored face metrics ----
    fake_answers = {qid: 4 for qid in PLANS["premium"]}
    fake_face = {
        "jaw_width_ratio":          0.8,
        "chin_projection_ratio":   -0.2,
        "mouth_height_ratio":       0.5,
        "upper_lip_ratio":          0.3,
        "lower_lip_ratio":          0.6,
        "brow_eye_distance_ratio":  0.7,
        "brow_inner_distance":     -0.5,
        "brow_arch":                0.4,
        "chin_width_ratio":        -0.3,
        "jaw_angle_sharpness":      0.9,
        "nostril_width_ratio":      0.1,
        "forehead_lines_density":   0.2,
        "forehead_smoothness":      0.6,
        "brow_density":             0.4,
        "cheek_fullness":           0.5,
        "eye_open_ratio":           0.3,
        "eye_tilt_ratio":           0.0,
        "face_aspect_ratio":        0.2,
        "forehead_slant_ratio":     0.1,
        "forehead_top_width":       0.4,
    }
    res = analyze_traits(fake_answers, face_metrics=fake_face, plan="premium")
    print("\npremium result summary :", res["summary"])
    print("structural-backed traits (top 5):")
    for t in res["traits"]:
        if t["structural_used"]:
            print(f"  {t['trait_id']}  score={t['score']:5.1f}  "
                  f"conf={t['confidence']}  Q={t['questions_used']}")
    # matching tier
    pa = {"face_vector": {"jaw_width_ratio": 0.4, "mouth_height_ratio": 0.1},
          "onboarding":  {qid: 4 for qid in MATCHING_QUESTIONS}}
    pb = {"face_vector": {"jaw_width_ratio": 0.5, "mouth_height_ratio": 0.0},
          "onboarding":  {qid: 3 for qid in MATCHING_QUESTIONS}}
    print("\nmatching:", matching_score(pa, pb))
