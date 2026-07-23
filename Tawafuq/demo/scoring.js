// ============================================================
// scoring.js — JS port of scoring_engine.py
// Loads all phase3 + reconcile data, exposes:
//   await Scoring.init()
//   Scoring.analyzeTraits(answers, faceMetrics, planName)
//   Scoring.matchingScore(profileA, profileB)
// ============================================================

const Scoring = (() => {
  const state = {
    questions: null,        // qid -> question
    matrix: null,           // tid -> [{question_id, weight}]
    plans: null,            // plan -> [qid]
    alias: null,            // abstract feature -> {js_metric, status, note}
    structMap: null,        // tid -> {features:[{feature,direction,hits}]}
    traitsMeta: null,       // tid -> {id,name}
  };

  async function loadJSON(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`Failed to load ${path}: ${r.status}`);
    return r.json();
  }

  async function init() {
    const [qb, tm, pl, fa, sm, meta] = await Promise.all([
      loadJSON("./data/question_bank.json"),
      loadJSON("./data/trait_question_matrix.json"),
      loadJSON("./data/plans.json"),
      loadJSON("./data/feature_alias.json"),
      loadJSON("./data/trait_feature_map.json"),
      loadJSON("./data/traits_meta.json"),
    ]);
    state.questions  = Object.fromEntries(qb.map(q => [q.id, q]));
    state.matrix     = tm;
    state.plans      = pl;
    state.alias      = fa;
    state.structMap  = Object.fromEntries(sm.map(t => [t.id, t]));
    state.traitsMeta = Object.fromEntries(meta.map(t => [t.id, t]));
    return {
      plansAvailable: Object.keys(pl),
      questionCount: qb.length,
      traitCount: Object.keys(tm).length,
      structuralTraits: sm.length,
    };
  }

  // ---- helpers ----
  const likertToSigned = v => (Math.max(1, Math.min(5, v)) - 3) / 2;

  function resolveMetric(abstractName) {
    const rec = state.alias[abstractName];
    if (!rec || rec.status !== "available") return [null, false];
    return [rec.js_metric, rec.note === "PROXY/approximation"];
  }

  // z-score a single face_metrics object using a fixed neutral baseline.
  // For demo: we approximate z-score by centring around expected mean=0.3
  //   and scale=0.2 — works for the demo but should be replaced with real
  //   population statistics in production.
  function zScoreMetrics(raw) {
    const POP_MEAN = 0.3, POP_STD = 0.2;
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v !== "number" || !isFinite(v)) continue;
      out[k] = (v - POP_MEAN) / POP_STD;
    }
    return out;
  }

  function structuralSubscore(traitId, faceMetrics) {
    const rec = state.structMap[traitId];
    if (!rec || !faceMetrics) return null;
    let num = 0, den = 0;
    for (const f of rec.features) {
      const [real, isProxy] = resolveMetric(f.feature);
      if (!real) continue;
      const m = faceMetrics[real];
      if (m == null) continue;
      let s;
      if (f.direction === "high" || f.direction === "up")        s = Math.max(-1, Math.min(1,  m));
      else if (f.direction === "low" || f.direction === "down")   s = Math.max(-1, Math.min(1, -m));
      else                                                        s = Math.max(-1, Math.min(1, 1 - Math.abs(m)));
      const w = f.hits * (isProxy ? 0.6 : 1.0);
      num += s * w;
      den += w;
    }
    return den > 0 ? num / den : null;
  }

  function confidence(nAns, hasStructural) {
    if (nAns >= 3 || (nAns >= 2 && hasStructural)) return "high";
    if (nAns >= 2 || (nAns >= 1 && hasStructural)) return "medium";
    if (nAns >= 1 || hasStructural)                return "low";
    return "none";
  }

  // ---- public: analyze traits (paid tier) ----
  function analyzeTraits(answers, rawFaceMetrics, plan) {
    if (!state.plans[plan]) throw new Error(`unknown plan: ${plan}`);
    const planSet = new Set(state.plans[plan]);
    const faceMetrics = rawFaceMetrics ? zScoreMetrics(rawFaceMetrics) : null;

    const results = [];
    for (const [tid, qrefs] of Object.entries(state.matrix)) {
      const used = qrefs.filter(q => planSet.has(q.question_id) && answers[q.question_id] != null);
      let qSub = null;
      if (used.length) {
        let num = 0, den = 0;
        for (const u of used) {
          num += likertToSigned(answers[u.question_id]) * u.weight;
          den += u.weight;
        }
        qSub = num / (den || 1);
      }
      const sSub = structuralSubscore(tid, faceMetrics);
      const hasS = sSub != null;
      let raw;
      if (qSub != null && sSub != null) raw = 0.6 * qSub + 0.4 * sSub;
      else if (qSub != null)            raw = qSub;
      else if (sSub != null)            raw = sSub;
      else continue;
      const display = Math.round(((raw + 1) / 2 * 100) * 10) / 10;
      results.push({
        trait_id: tid,
        name: state.traitsMeta[tid]?.name || tid,
        score: display,
        confidence: confidence(used.length, hasS),
        questions_used: used.length,
        structural_used: hasS,
      });
    }
    return {
      summary: {
        plan,
        answered_questions: state.plans[plan].filter(q => answers[q] != null).length,
        plan_size: state.plans[plan].length,
        traits_returned: results.length,
        traits_total: Object.keys(state.matrix).length,
      },
      traits: results.sort((a, b) => b.score - a.score),
    };
  }

  // ---- public: matching (free tier) ----
  function cosine(a, b) {
    const keys = Object.keys(a).filter(k => k in b);
    if (!keys.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (const k of keys) { dot += a[k]*b[k]; na += a[k]**2; nb += b[k]**2; }
    return dot / (Math.sqrt(na || 1) * Math.sqrt(nb || 1));
  }
  function answerSim(qa, qb) {
    const keys = Object.keys(qa).filter(k => k in qb);
    if (!keys.length) return 0;
    let dist = 0;
    for (const k of keys) dist += Math.abs(qa[k] - qb[k]);
    return 1 - dist / (4 * keys.length);
  }
  function matchingScore(pA, pB) {
    const faceSim = cosine(pA.face_vector || {}, pB.face_vector || {});
    const ansSim  = answerSim(pA.onboarding || {}, pB.onboarding || {});
    const faceNorm = Math.max(0, (faceSim + 1) / 2);
    const score = Math.round((0.5 * faceNorm + 0.5 * ansSim) * 100 * 10) / 10;
    let tag, msg;
    if (score >= 75)       { tag = "high";   msg = "توافق قوي على المستويين البصري والشخصي."; }
    else if (score >= 55)  { tag = "medium"; msg = "توافق جيد — هناك نقاط التقاء واضحة وبعض الاختلافات."; }
    else                   { tag = "low";    msg = "توافق محدود في هذه المرحلة — قد يكشف التحليل المعمّق المزيد."; }
    return { match_score: score, compatibility: tag, explanation_ar: msg };
  }

  function getQuestionsForPlan(plan) {
    return state.plans[plan].map(qid => state.questions[qid]);
  }
  function getTraitMeta(tid) { return state.traitsMeta[tid]; }

  return { init, analyzeTraits, matchingScore, getQuestionsForPlan, getTraitMeta };
})();

window.Scoring = Scoring;
