# -*- coding: utf-8 -*-
"""Question-quality analysis: scores information content of the 951 bank
and the 73 matching questions, then outputs cut/core/merge/innovate lists.

Information principle: a question's value = how much it discriminates
(traits it covers) x signal strength (weights) x provenance (source_count).
Fewer high-information items beat many low-information ones."""
import io, json, math, collections, os

BANK   = "phase3_out/question_bank.json"
MATRIX = "phase3_out/trait_question_matrix.json"
MATCH  = "demo/data/matching_questions.json"
OUT_J  = "phase3_out/question_quality_report.json"
OUT_M  = "phase3_out/question_quality_report.md"

bank   = json.load(io.open(BANK, encoding="utf-8"))
matrix = json.load(io.open(MATRIX, encoding="utf-8"))
match  = json.load(io.open(MATCH, encoding="utf-8"))
match  = match if isinstance(match, list) else match.get("questions", match)

bank_by_id = {q["id"]: q for q in bank}

# ---- invert matrix: question_id -> {trait: weight} ----
q_traits = collections.defaultdict(dict)
for trait, rows in matrix.items():
    for r in rows:
        q_traits[r["question_id"]][trait] = r.get("weight", 1.0)

# ============================================================
# PART A — score the 951 bank
# ============================================================
scored = []
for q in bank:
    qid = q["id"]
    tw = q_traits.get(qid, {})
    n_traits = len(tw) if tw else q.get("traits_covered", 0)
    weight_sum = sum(tw.values()) if tw else 0.0
    src = q.get("source_count", 1)
    # information score: breadth x signal x provenance (log-damped)
    info = weight_sum * (1 + math.log(1 + n_traits)) * (1 + 0.15 * math.log(src))
    scored.append({
        "id": qid,
        "text_ar": q.get("text_ar", ""),
        "n_traits": n_traits,
        "weight_sum": round(weight_sum, 3),
        "source_count": src,
        "category_origin": q.get("category_origin"),
        "info": round(info, 3),
    })

scored.sort(key=lambda x: x["info"], reverse=True)

# --- classify ---
WEAK = [s for s in scored if s["n_traits"] <= 1 and s["source_count"] == 1]
weak_ids = {s["id"] for s in WEAK}

# --- greedy SET-COVER: minimal questions covering every trait that has any Q ---
all_traits = set(matrix.keys())
covered_targets = {t for t in all_traits if matrix[t]}  # traits with >=1 question
# build question -> traits map (only meaningful ones)
qmap = {qid: set(tw.keys()) for qid, tw in q_traits.items()}
uncovered = set(covered_targets)
core = []
# rank candidates by (traits it would newly cover) then info
info_by_id = {s["id"]: s["info"] for s in scored}
while uncovered:
    best, best_gain, best_info = None, 0, -1
    for qid, ts in qmap.items():
        gain = len(ts & uncovered)
        if gain > best_gain or (gain == best_gain and gain > 0 and info_by_id.get(qid, 0) > best_info):
            best, best_gain, best_info = qid, gain, info_by_id.get(qid, 0)
    if not best or best_gain == 0:
        break
    core.append(best)
    uncovered -= qmap[best]

core_set = set(core)

# --- MERGE candidates: same category + overlapping source_indicators ---
# group by category_origin, find near-duplicate texts (share >=2 source indicators)
def src_set(qid):
    return set(bank_by_id[qid].get("source_indicators", []))
merge_groups = []
by_cat = collections.defaultdict(list)
for q in bank:
    by_cat[q.get("category_origin")].append(q["id"])
seen = set()
for cat, ids in by_cat.items():
    for i in range(len(ids)):
        a = ids[i]
        if a in seen:
            continue
        grp = [a]
        sa = src_set(a)
        for j in range(i + 1, len(ids)):
            b = ids[j]
            if b in seen:
                continue
            if sa and len(sa & src_set(b)) >= 2:
                grp.append(b); seen.add(b)
        if len(grp) > 1:
            seen.add(a)
            merge_groups.append(grp)

# ============================================================
# PART B — the 73 matching questions
# ============================================================
by_dim = collections.defaultdict(list)
for q in match:
    by_dim[q.get("dimension")].append(q)
dim_counts = {d: len(v) for d, v in by_dim.items()}
# dimensions with redundancy (>=3 questions) = merge candidates
match_merge = {d: c for d, c in dim_counts.items() if c >= 3}

# ============================================================
# PART C — innovation spots: traits served ONLY by weak single-trait items
# ============================================================
# for each trait, how many of its questions are weak?
innovate = []
for trait, rows in matrix.items():
    ids = [r["question_id"] for r in rows]
    if not ids:
        continue
    weak_here = [i for i in ids if i in weak_ids]
    if len(ids) >= 3 and len(weak_here) / len(ids) >= 0.6:
        nm = ""
        innovate.append({
            "trait": trait,
            "total_q": len(ids),
            "weak_q": len(weak_here),
            "suggestion": "replace weak Likert cluster with 1 forced-choice or situational item",
        })

# ============================================================
# OUTPUT
# ============================================================
report = {
    "summary": {
        "bank_total": len(bank),
        "weak_cut_candidates": len(WEAK),
        "core_setcover_size": len(core),
        "traits_to_cover": len(covered_targets),
        "merge_groups": len(merge_groups),
        "merge_questions_collapsible": sum(len(g) - 1 for g in merge_groups),
        "match_total": len(match),
        "match_dims": len(by_dim),
        "innovate_spots": len(innovate),
    },
    "core_setcover_ids": core,
    "top20_information": scored[:20],
    "weak_sample": WEAK[:30],
    "merge_groups_sample": merge_groups[:15],
    "match_dim_counts": dim_counts,
    "match_merge_candidates": match_merge,
    "innovate_spots": innovate,
}
json.dump(report, io.open(OUT_J, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# markdown
L = []
s = report["summary"]
L.append("# تقرير جودة الأسئلة\n")
L.append("## الملخص\n")
L.append(f"- بنك الأسئلة: **{s['bank_total']}** سؤال")
L.append(f"- مرشّحين للحذف (صفة واحدة + مصدر واحد): **{s['weak_cut_candidates']}**")
L.append(f"- النواة (Set-Cover تغطّي كل الصفات): **{s['core_setcover_size']}** سؤال تغطّي **{s['traits_to_cover']}** صفة")
L.append(f"- عناقيد دمج: **{s['merge_groups']}** عنقود → ينفع نطوّي **{s['merge_questions_collapsible']}** سؤال")
L.append(f"- أسئلة التوافق: **{s['match_total']}** في **{s['match_dims']}** بُعد")
L.append(f"- أماكن ابتكار (عنقود ضعيف يتحوّل لسؤال واحد ذكي): **{s['innovate_spots']}**\n")
L.append("## النتيجة المقترحة")
keep_after_cut = s['bank_total'] - s['weak_cut_candidates'] - s['merge_questions_collapsible']
L.append(f"- بنك بعد الحذف والدمج: ~**{max(keep_after_cut,0)}** سؤال (بدل {s['bank_total']})")
L.append(f"- النواة الفعّالة للماتشينج: **{s['core_setcover_size']}** سؤال\n")
L.append("## أعلى 20 سؤال بكمية المعلومة")
for x in report["top20_information"]:
    L.append(f"- `{x['id']}` info={x['info']} | صفات={x['n_traits']} | مصادر={x['source_count']} | {x['text_ar'][:60]}")
L.append("\n## أبعاد التوافق (أماكن الدمج)")
for d, c in sorted(dim_counts.items(), key=lambda kv: -kv[1]):
    flag = " ← مرشّح دمج" if c >= 3 else ""
    L.append(f"- {d}: {c} سؤال{flag}")
L.append("\n## أماكن الابتكار (عنقود ضعيف → سؤال اختيار-إجباري/موقف واحد)")
for x in innovate:
    L.append(f"- {x['trait']}: {x['weak_q']}/{x['total_q']} ضعيفة → {x['suggestion']}")
io.open(OUT_M, "w", encoding="utf-8").write("\n".join(L))

print("=== DONE ===")
print(json.dumps(report["summary"], ensure_ascii=False, indent=1))
print("\nwrote:", OUT_J)
print("wrote:", OUT_M)
