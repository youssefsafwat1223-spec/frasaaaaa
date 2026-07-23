"""
Phase 3 — Question Bank + Plan Tiers + Scoring Matrix.

Pipeline:
  1. Collect every non-structural indicator across the 600 traits.
  2. Cluster similar indicators (Jaccard on normalised Arabic tokens).
  3. Each cluster -> one Likert-5 question.
  4. Build trait_id -> [question_id, weight] matrix.
  5. Rank questions, carve plan tiers (30 / 45 / 80 / 100).
  6. Coverage report per plan.

Outputs in phase3_out/
"""

import json
import re
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
P1   = ROOT / "phase1_out" / "indicators_clean.json"
P2C  = ROOT / "phase2_out" / "indicators_classified.json"
P2K  = ROOT / "phase2_out" / "traits_kept.json"
MAS  = ROOT / "free_host_package" / "firasa_master_dataset.json"
OUT  = ROOT / "phase3_out"
OUT.mkdir(exist_ok=True)

# =====================================================================
# 1) Token normaliser
# =====================================================================

STOPWORDS = {
    "في","من","على","إلى","عند","أن","عن","مع","لا","لم","لن","قد","كل",
    "رغم","أكثر","دون","بعد","قبل","حتى","حين","أو","ثم","ولا","ولكن",
    "هذا","هذه","ذلك","تلك","هو","هي","انا","أنا","نحن","هم","ها","يا",
    "كما","لكن","بل","إذا","لو","الذي","التي","ال","فى","الى","على",
    "بـ","لـ","فـ","و","ل","ب","ف","ك","الـ",
    # high-frequency body-part lead words that don't help disambiguate
    # (we keep them for now — uncomment to drop)
    # "فم","عين","وجه","حاجب","شفة","ذقن","ملامح","نظرة",
}

TASHKEEL = re.compile(r"[ً-ْٰـ]")
QUOTE_RX = re.compile(r"[“”\"«»]")

def norm_token(t: str) -> str:
    t = TASHKEEL.sub("", t)
    t = (t.replace("أ","ا").replace("إ","ا").replace("آ","ا")
          .replace("ى","ي").replace("ة","ه"))
    return t

def tokenize(s: str) -> set[str]:
    s = QUOTE_RX.sub(" ", s)
    s = re.sub(r"[^؀-ۿ\s]", " ", s)
    toks = [norm_token(t) for t in s.split() if len(t) >= 2]
    return {t for t in toks if t not in STOPWORDS and len(t) >= 2}

def jaccard(a, b):
    if not a or not b: return 0.0
    return len(a & b) / len(a | b)

# =====================================================================
# 2) Collect non-structural indicators
# =====================================================================

def load_inputs():
    classified = json.loads(P2C.read_text(encoding="utf-8"))
    kept       = {t["id"] for t in json.loads(P2K.read_text(encoding="utf-8"))}
    master     = {t["id"]: t for t in json.loads(MAS.read_text(encoding="utf-8"))["sabti_traits"]}
    return classified, kept, master

def collect_indicator_pool(classified):
    """Return list of (trait_id, clean_text, category, tokens). Exclude structural_image."""
    pool = []
    for e in classified:
        if e["category"] == "structural_image":
            continue          # already covered by Phase-2 image features
        toks = tokenize(e["clean"])
        if len(toks) < 2:
            continue          # too short to cluster reliably
        pool.append({
            "trait_id": e["trait_id"],
            "text":     e["clean"],
            "category": e["category"],
            "tokens":   toks,
        })
    return pool

# =====================================================================
# 3) Greedy clustering
# =====================================================================

SIM_THRESHOLD = 0.28   # aggressive — we *want* tight grouping

def cluster_indicators(pool):
    """Two-pass clustering:
       pass 1 — greedy by token Jaccard
       pass 2 — merge clusters whose CENTROID tokens overlap above threshold"""
    clusters = []
    # pass 1
    for i, p in enumerate(pool):
        best, best_sim = -1, 0.0
        for ci, c in enumerate(clusters):
            sim = jaccard(p["tokens"], c["tokens"])
            if sim > best_sim:
                best, best_sim = ci, sim
        if best_sim >= SIM_THRESHOLD:
            clusters[best]["members"].append(i)
            clusters[best]["tokens"] |= p["tokens"]
        else:
            clusters.append({"tokens": set(p["tokens"]), "members": [i]})

    # pass 2 — agglomerative merge until no pair >= threshold
    changed = True
    while changed:
        changed = False
        for i in range(len(clusters)):
            if clusters[i] is None: continue
            for j in range(i+1, len(clusters)):
                if clusters[j] is None: continue
                if jaccard(clusters[i]["tokens"], clusters[j]["tokens"]) >= SIM_THRESHOLD:
                    clusters[i]["members"].extend(clusters[j]["members"])
                    clusters[i]["tokens"] |= clusters[j]["tokens"]
                    clusters[j] = None
                    changed = True
        clusters = [c for c in clusters if c is not None]

    # pick representative = member with highest avg Jaccard to the rest
    for c in clusters:
        members = c["members"]
        if len(members) == 1:
            c["rep_idx"] = members[0]
            continue
        best_idx, best_score = members[0], -1.0
        for i in members:
            s = sum(jaccard(pool[i]["tokens"], pool[j]["tokens"]) for j in members if j != i)
            if s > best_score:
                best_score, best_idx = s, i
        c["rep_idx"] = best_idx
    return clusters

# =====================================================================
# 4) Question text generation (template-based, light rewrite)
# =====================================================================

# Light, *safe* rewrite — only swap subject leads we are confident about.
# We do NOT try to conjugate verbs (Arabic verb conjugation is too fragile here).
# Result is a Likert prompt phrased as a self-description.
LEAD_REWRITES = [
    # quoted self-talk: "فم يقول: «X»"  -> "أكرر مقولات مثل «X»"
    (re.compile(r"^(فم|وجه|ملامح)\s+يقول[:\s]*"),  "أكرر مقولات مثل: "),
    (re.compile(r"^(فم|وجه|ملامح)\s+ينطق[:\s]*"),  "أكرر مقولات مثل: "),
    (re.compile(r"^(فم|وجه|ملامح)\s+يكرر[:\s]*"),   "أكرر مقولات مثل: "),
    # bodily-feature subjects → "أصف نفسي بـ" (keep verb intact)
    (re.compile(r"^(فم|عين|عينان|وجه|ملامح|نظرة|حاجب|حواجب|حاجبان|شفة|شفاه|شفتان|جبهة|جبين|فك|ذقن|تعابير|نظرات)\b\s*"),
                                                    "ينطبق عليّ: "),
]

def to_question(text: str) -> str:
    """Produce a Likert prompt from a third-person indicator.
    Strategy: leave wording mostly intact, only normalise the subject lead.
    The product team is expected to do an editorial pass before launch."""
    t = text.strip().strip("•●-* ")
    # strip trailing OCR scraps if any
    t = re.sub(r"\s+", " ", t)
    for rx, rep in LEAD_REWRITES:
        if rx.match(t):
            t = rx.sub(rep, t, count=1)
            break
    else:
        t = "ينطبق عليّ: " + t
    return t

# =====================================================================
# 5) Build matrix + tier the questions
# =====================================================================

def build_questions(pool, clusters):
    questions = []
    # trait -> [(qid, weight)]
    matrix = defaultdict(list)
    # per-question coverage: trait_id -> hit count (used for weighting)
    for ci, c in enumerate(clusters):
        rep = pool[c["rep_idx"]]
        qid = f"q_{ci+1:04d}"
        source_phrases = list({pool[i]["text"] for i in c["members"]})
        # traits this cluster touches, with frequency
        trait_hits = Counter(pool[i]["trait_id"] for i in c["members"])
        # primary category of cluster
        cats = Counter(pool[i]["category"] for i in c["members"])
        primary_cat = cats.most_common(1)[0][0]
        q = {
            "id": qid,
            "text_ar": to_question(rep["text"]),
            "type": "likert_5",
            "scale_anchors": {"1":"لا أبداً","2":"نادراً","3":"أحياناً","4":"غالباً","5":"دائماً"},
            "source_indicators": source_phrases[:8],   # cap for readability
            "source_count": len(c["members"]),
            "category_origin": primary_cat,
            "traits_covered": len(trait_hits),
        }
        questions.append(q)
        # weight per trait: hits / member_count  (0..1, normalised within question)
        total_hits = sum(trait_hits.values())
        for tid, hits in trait_hits.items():
            w = round(hits / total_hits, 3)
            matrix[tid].append({"question_id": qid, "weight": w})
    return questions, matrix

def rank_questions(questions, matrix):
    """Score each question by (# distinct traits covered) × log(1 + Σ weights)."""
    # build reverse: question_id -> Σ weights across all traits
    weight_sum = defaultdict(float)
    for tid, qs in matrix.items():
        for q in qs:
            weight_sum[q["question_id"]] += q["weight"]
    scored = []
    for q in questions:
        traits_n = q["traits_covered"]
        s = traits_n * math.log1p(weight_sum[q["id"]])
        scored.append((s, q))
    scored.sort(key=lambda x: -x[0])
    ordered = [q for _, q in scored]
    return ordered

PLAN_SIZES = {
    "matching":   7,    # tiny, paired with face for free matching
    "basic":      30,
    "basic_plus": 45,
    "advanced":   80,
    "premium":    100,
}

def make_plans(ordered_questions):
    plans = {}
    qids = [q["id"] for q in ordered_questions]
    for name, n in PLAN_SIZES.items():
        plans[name] = qids[:min(n, len(qids))]
    return plans

# =====================================================================
# 6) Coverage report
# =====================================================================

def coverage_for_plan(plan_qids, matrix, kept_structural, master):
    """For a plan, return per-trait confidence and aggregate buckets."""
    plan_set = set(plan_qids)
    out = []
    for tid in master.keys():
        trait_qs = matrix.get(tid, [])
        present  = [q for q in trait_qs if q["question_id"] in plan_set]
        weight_present = sum(q["weight"] for q in present)
        has_struct = tid in kept_structural
        # confidence rule
        if len(present) >= 3 or (len(present) >= 2 and has_struct):
            conf = "high"
        elif len(present) >= 2 or (len(present) >= 1 and has_struct):
            conf = "medium"
        elif len(present) == 1:
            conf = "low"
        else:
            conf = "none"
        out.append({
            "trait_id": tid,
            "name": master[tid]["name"],
            "questions_in_plan": len(present),
            "structural_backup": has_struct,
            "weight_sum": round(weight_present, 3),
            "confidence": conf,
        })
    return out

# =====================================================================
# 7) MAIN
# =====================================================================

def main():
    print("Loading inputs ...")
    classified, kept_structural, master = load_inputs()
    pool = collect_indicator_pool(classified)
    print(f"  pool size (non-structural indicators): {len(pool)}")

    print("Clustering ...")
    clusters = cluster_indicators(pool)
    print(f"  clusters (= candidate questions): {len(clusters)}")

    questions, matrix = build_questions(pool, clusters)
    ordered = rank_questions(questions, matrix)
    plans = make_plans(ordered)

    # ---------- write artefacts ----------
    (OUT/"question_bank.json").write_text(
        json.dumps(ordered, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT/"trait_question_matrix.json").write_text(
        json.dumps({tid: qs for tid, qs in matrix.items()},
                   ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT/"plans.json").write_text(
        json.dumps(plans, ensure_ascii=False, indent=2), encoding="utf-8")

    # ---------- coverage reports ----------
    coverage_all = {}
    for name in plans:
        coverage_all[name] = coverage_for_plan(plans[name], matrix, kept_structural, master)
    (OUT/"coverage_per_plan.json").write_text(
        json.dumps(coverage_all, ensure_ascii=False, indent=2), encoding="utf-8")

    # human-readable summary
    lines = ["# Phase 3 — Coverage report per plan\n"]
    lines.append(f"- Total traits           : {len(master)}")
    lines.append(f"- Structural backup avail: {len(kept_structural)} traits")
    lines.append(f"- Question bank size     : {len(ordered)}\n")
    lines.append("| Plan | Qs | high | medium | low | unavailable |")
    lines.append("|---|---|---|---|---|---|")
    for name, qids in plans.items():
        cov = coverage_all[name]
        c = Counter(t["confidence"] for t in cov)
        lines.append(f"| **{name}** | {len(qids)} | "
                     f"{c.get('high',0)} | {c.get('medium',0)} | "
                     f"{c.get('low',0)} | {c.get('none',0)} |")
    lines.append("\n## Top 25 questions (ranked)\n")
    for i, q in enumerate(ordered[:25], 1):
        lines.append(f"{i:3d}. **{q['id']}**  ({q['traits_covered']} traits)  "
                     f"— {q['text_ar']}")
    (OUT/"coverage_summary.md").write_text("\n".join(lines), encoding="utf-8")

    print("\nDone. Outputs in", OUT)
    for f in sorted(OUT.iterdir()):
        print("  ", f.name, f"({f.stat().st_size:,} bytes)")

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
