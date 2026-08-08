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
    matchMeta: null,        // num -> {stage,type,options} for the 73 matching qs
    baselines: null,        // metric -> {mean, std, n, source} (population stats)
  };

  async function loadJSON(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`Failed to load ${path}: ${r.status}`);
    return r.json();
  }

  async function init() {
    // 60-trait data set (own question bank, keyed hadi_##). The legacy 15-trait
    // sabti files are kept on disk but no longer loaded by the demo.
    const [qb, tm, pl, fa, sm, meta, mq, bl, ff] = await Promise.all([
      loadJSON("./data/question_bank_60.json"),
      loadJSON("./data/trait_question_matrix_60.json"),
      loadJSON("./data/plans_60.json"),
      loadJSON("./data/feature_alias.json"),
      loadJSON("./data/trait_feature_map_60.json"),
      loadJSON("./data/traits_meta_60.json"),
      loadJSON("./data/matching_questions.json").catch(() => []),
      loadJSON("./data/metric_baselines.json").catch(() => null),
      loadJSON("./data/face_frames.json").catch(() => null),
    ]);
    state.questions  = Object.fromEntries(qb.map(q => [q.id, q]));
    state.matrix     = tm;
    state.plans      = pl;
    state.alias      = fa;
    state.structMap  = Object.fromEntries(sm.map(t => [t.id, t]));
    state.traitsMeta = Object.fromEntries(meta.map(t => [t.id, t]));
    state.matchMeta  = Object.fromEntries(mq.map(q => [q.num, { stage: q.stage, type: q.type, options: q.options || [] }]));
    // baselines file: either flat {metric:{...}} or per-gender {all,male,female}
    state.baselines  = bl ? (bl.all ? bl : { all: bl }) : null;
    state.faceFrames = ff;   // learned frame centroids (z-space) or null
    return {
      plansAvailable: Object.keys(pl),
      questionCount: qb.length,
      traitCount: Object.keys(tm).length,
      structuralTraits: sm.length,
      matchingQuestions: mq.length,
    };
  }

  // ---- helpers ----
  const likertToSigned = v => (Math.max(1, Math.min(5, v)) - 3) / 2;

  function resolveMetric(abstractName) {
    const rec = state.alias[abstractName];
    if (!rec || rec.status !== "available") return [null, false];
    return [rec.js_metric, rec.note === "PROXY/approximation"];
  }

  // z-score a face_metrics object using PER-METRIC population baselines
  // (data/metric_baselines.json — 21 metrics from the 282 labelled samples,
  // the rest provisional until real user data is collected).
  // The z is squashed with tanh so one extreme measurement saturates smoothly
  // instead of hard-clipping: z=1σ→0.51, 2σ→0.81, 3σ→0.93.
  // Metrics WITHOUT a baseline are DROPPED (an un-normalised value is noise,
  // not signal — previously a raw-pixel metric here always clipped to ±1).
  // gender: "male" | "female" | undefined — picks the matching population
  // section, falling back per-metric to the pooled "all" section.
  function zScoreMetrics(raw, gender) {
    const out = {};
    const bl = state.baselines;
    const g = bl && gender && bl[gender] ? bl[gender] : null;
    const all = bl ? bl.all : null;
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v !== "number" || !isFinite(v)) continue;
      if (bl) {
        const b = (g && g[k]) || (all && all[k]);
        if (!b || !(b.std > 0)) continue;         // no baseline -> not scoreable
        out[k] = Math.tanh(((v - b.mean) / b.std) / 1.8);
      } else {
        // legacy fallback if baselines file failed to load
        out[k] = (v - 0.3) / 0.2;
      }
    }
    return out;
  }
  function getBaselines(gender) {
    const bl = state.baselines;
    if (!bl) return null;
    const g = gender && bl[gender] ? bl[gender] : null;
    return g ? { ...bl.all, ...g } : bl.all;
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

  // ---- per-trait FACE confidence (drives adaptive questioning) ----
  // A facial measurement is NOT a reading of a personality trait. In فِراسة the
  // face is a weak probabilistic *hint*. So confidence is built from ACCUMULATED
  // evidence (not a naive average that lets one feature "confirm" a trait), and
  // every feature is damped by:
  //   measurement quality  : direct 1.0 / profile 0.85 / proxy 0.6  (can we see it)
  //   decisiveness         : |signed score|, 0..1                   (is it strong)
  //   INFER_STRENGTH       : face->personality is a hint, not proof (global cap)
  // A trait only becomes "confident enough to skip its questions" when several
  // decisive, well-measured features CONVERGE — never from a single feature.
  const INFER_STRENGTH = 0.5;          // weak-hint cap on face->trait inference
  const EVIDENCE_FOR_CONFIDENT = 2.0;  // damped evidence needed for full confidence
  function mqOf(f, isProxy) {
    if (isProxy) return 0.6;
    return f.confidence_source === "profile" ? 0.85 : 1.0;
  }
  function faceTraitAssessment(traitId, faceMetrics) {
    const rec = state.structMap[traitId];
    if (!rec || !faceMetrics)
      return { score: null, coverage: 0, decisiveness: 0, confidence: 0,
               proxy: false, measured: 0, total: rec ? rec.features.length : 0 };
    let measured = 0, num = 0, den = 0, anyProxy = false, evidence = 0;
    const total = rec.features.length;
    for (const f of rec.features) {
      const [real, isProxy] = resolveMetric(f.feature);
      if (!real) continue;                 // feature not measurable at all
      const m = faceMetrics[real];
      if (m == null) continue;
      measured++;
      if (isProxy) anyProxy = true;
      let s;
      if (f.direction === "high" || f.direction === "up")        s = Math.max(-1, Math.min(1,  m));
      else if (f.direction === "low" || f.direction === "down")  s = Math.max(-1, Math.min(1, -m));
      else                                                       s = Math.max(-1, Math.min(1, 1 - Math.abs(m)));
      const mq = mqOf(f, isProxy);
      const w = f.hits * mq;
      num += s * w; den += w;
      // accumulate damped evidence toward "confident enough to skip questions"
      evidence += mq * Math.min(1, Math.abs(s)) * INFER_STRENGTH;
    }
    const score = den > 0 ? num / den : null;
    const coverage = total ? measured / total : 0;
    const decisiveness = score != null ? Math.min(1, Math.abs(score)) : 0;
    let conf = Math.min(1, evidence / EVIDENCE_FOR_CONFIDENT);
    if (anyProxy) conf *= 0.85;
    return { score, coverage: +coverage.toFixed(3), decisiveness: +decisiveness.toFixed(3),
             confidence: +conf.toFixed(3), evidence: +evidence.toFixed(3),
             proxy: anyProxy, measured, total };
  }

  // ---- ADAPTIVE: ask questions ONLY for traits the face is unsure about ----
  // Confident-from-photo traits are skipped; uncertain ones get the minimal
  // set of questions (greedy set-cover) that covers the most of them.
  function selectAdaptiveQuestions(rawFaceMetrics, plan, opts = {}) {
    const threshold = opts.threshold ?? 0.55;
    const maxQuestions = opts.maxQuestions ?? Infinity;
    const faceMetrics = rawFaceMetrics ? zScoreMetrics(rawFaceMetrics, opts.gender) : null;
    const planSet = plan && state.plans[plan] ? new Set(state.plans[plan]) : null;

    const assessments = {};
    const uncertain = new Set();
    let confidentCount = 0;
    for (const tid of Object.keys(state.matrix)) {
      const a = faceTraitAssessment(tid, faceMetrics);
      assessments[tid] = a;
      if (a.confidence >= threshold) confidentCount++;
      else uncertain.add(tid);
    }

    // question -> [{tid, weight}] limited to uncertain traits (and plan budget)
    const qCov = {};
    for (const tid of uncertain) {
      for (const qref of state.matrix[tid] || []) {
        if (planSet && !planSet.has(qref.question_id)) continue;
        (qCov[qref.question_id] ||= []).push({ tid, weight: qref.weight });
      }
    }

    const chosen = [];
    const covered = new Set();
    while (covered.size < uncertain.size && chosen.length < maxQuestions) {
      let best = null, bestGain = 0, bestW = 0;
      for (const qid of Object.keys(qCov)) {
        if (chosen.includes(qid)) continue;
        const cov = qCov[qid];
        const gain = cov.reduce((n, c) => n + (covered.has(c.tid) ? 0 : 1), 0);
        const wsum = cov.reduce((a, c) => a + c.weight, 0);
        if (gain > bestGain || (gain === bestGain && gain > 0 && wsum > bestW)) {
          best = qid; bestGain = gain; bestW = wsum;
        }
      }
      if (!best || bestGain === 0) break;
      chosen.push(best);
      for (const c of qCov[best]) covered.add(c.tid);
    }

    return {
      threshold,
      traits_total: Object.keys(state.matrix).length,
      traits_confident: confidentCount,        // skipped — photo is sure
      traits_uncertain: uncertain.size,        // need a question
      traits_covered_by_questions: covered.size,
      traits_still_uncovered: uncertain.size - covered.size, // no question exists
      questions: chosen.map(qid => state.questions[qid]).filter(Boolean),
      assessments,
    };
  }

  function confidence(nAns, hasStructural) {
    if (nAns >= 3 || (nAns >= 2 && hasStructural)) return "high";
    if (nAns >= 2 || (nAns >= 1 && hasStructural)) return "medium";
    if (nAns >= 1 || hasStructural)                return "low";
    return "none";
  }

  // ---- public: analyze traits (paid tier) ----
  function analyzeTraits(answers, rawFaceMetrics, plan, gender) {
    if (!state.plans[plan]) throw new Error(`unknown plan: ${plan}`);
    const planSet = new Set(state.plans[plan]);
    const faceMetrics = rawFaceMetrics ? zScoreMetrics(rawFaceMetrics, gender) : null;

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
  // ---- matching: two-stage (hard filters gate → weighted soft compatibility) ----
  const MQ_AGREE5 = ["لا أوافق إطلاقاً", "أعارض", "محايد", "أوافق", "أوافق تماماً"];
  const MQ_FREQ5  = ["أبداً", "نادراً", "أحياناً", "غالباً", "دائماً"];
  const MQ_SCALE_DEFAULTS = {
    likert: MQ_AGREE5, scenario: MQ_AGREE5, bipolar: MQ_AGREE5, sensitive: MQ_AGREE5,
    frequency: MQ_FREQ5, frequency_matrix: MQ_FREQ5,
  };
  // which 73-stage feeds which weighted bucket
  const STAGE_BUCKET = {
    "الإطار الديني": "values", "القيم والعائلة": "values", "القرارات والصحة": "values",
    "الشخصية والتعلق": "attach", "التواصل والصراع": "attach",
    "الحميمية والإيقاع": "intimacy",
    "الأخلاق والأنماط الخفية": "danger",
    "الهوية والفلاتر الصلبة": "identity",
  };
  const BUCKET_WEIGHTS = { values: 0.33, attach: 0.24, personality: 0.20, intimacy: 0.12, logistics: 0.05, face: 0.06 };
  const LOGISTICS_NUMS = [8]; // nationality openness (Q8); relocation/city not clean enough yet

  // religion key — muslim/druze as one family each, christians matched per denomination
  function religionKey(v) {
    if (typeof v !== "string" || !v.trim()) return null;
    if (v.startsWith("مسلم")) return "muslim";
    if (v.includes("درزي")) return "druze";
    if (v.includes("مسيحي")) return v.trim(); // exact denomination (قبطي ≠ كاثوليكي …)
    return v.trim();
  }
  function kidsStance(v) {
    if (typeof v !== "string" || !v.trim()) return null;
    if (v === "لا") return "no";
    if (v.startsWith("نعم")) return "yes";
    return "open"; // منفتح للنقاش / لدي أطفال من زواج سابق
  }
  // health: does this person currently have a chronic condition / disability?
  function hasHealthCondition(m) {
    const c = m[33], dis = m[34];
    const cond  = typeof c === "string"   && c !== "صحة عامة جيدة";
    const disab = typeof dis === "string" && dis !== "لا";
    return cond || disab;
  }
  function refusesHealth(m) { return m[36] === "لا أوافق إطلاقاً"; }
  // map a 73-answer to an ordinal 0..1 (or null if not orderable)
  function mqOrdinal(num, ans) {
    const m = state.matchMeta && state.matchMeta[num];
    if (!m) return null;
    if (typeof ans === "number") return m.type === "vas" ? Math.max(0, Math.min(1, ans / 100)) : null;
    if (Array.isArray(ans)) return null; // handled via jaccard
    const opts = (m.options && m.options.length) ? m.options : (MQ_SCALE_DEFAULTS[m.type] || []);
    if (opts.length < 2) return null;
    const i = opts.indexOf(ans);
    return i < 0 ? null : i / (opts.length - 1);
  }
  function jaccard(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || (!a.length && !b.length)) return null;
    const sa = new Set(a), sb = new Set(b);
    let inter = 0; sa.forEach(x => { if (sb.has(x)) inter++; });
    const uni = new Set([...a, ...b]).size;
    return uni ? inter / uni : null;
  }
  // similarity within a set of 73-answers (by bucket)
  function bucketSim(maA, maB, bucket) {
    let sum = 0, n = 0;
    for (const num in (state.matchMeta || {})) {
      if (STAGE_BUCKET[state.matchMeta[num].stage] !== bucket) continue;
      const a = maA[num], b = maB[num];
      if (a == null || b == null) continue;
      let s = null;
      if (Array.isArray(a) || Array.isArray(b)) s = jaccard(a, b);
      else { const oa = mqOrdinal(+num, a), ob = mqOrdinal(+num, b); if (oa != null && ob != null) s = 1 - Math.abs(oa - ob); }
      if (s != null) { sum += s; n++; }
    }
    return n ? { sim: sum / n, n } : null;
  }
  // similarity over an explicit set of question numbers (for logistics)
  function bucketSimByNums(maA, maB, nums) {
    let sum = 0, n = 0;
    for (const num of nums) {
      const a = maA[num], b = maB[num];
      if (a == null || b == null) continue;
      let s = null;
      if (Array.isArray(a) || Array.isArray(b)) s = jaccard(a, b);
      else { const oa = mqOrdinal(num, a), ob = mqOrdinal(num, b); if (oa != null && ob != null) s = 1 - Math.abs(oa - ob); }
      if (s != null) { sum += s; n++; }
    }
    return n ? { sim: sum / n, n } : null;
  }
  // danger flags: high self-agreement on dark-trait detectors lowers the pair score
  function dangerMean(ma) {
    let sum = 0, n = 0;
    for (const num in (state.matchMeta || {})) {
      if (state.matchMeta[num].stage !== "الأخلاق والأنماط الخفية") continue;
      const o = mqOrdinal(+num, ma[num]);
      if (o != null) { sum += o; n++; }
    }
    return n ? sum / n : null;
  }

  const isNum = x => typeof x === "number" && isFinite(x);
  function hardFilters(pA, pB) {
    const a = pA.matchAnswers || {}, b = pB.matchAnswers || {}, reasons = [];
    // (1) religion — required; missing = precautionary block; christians per denomination
    const ra = religionKey(a[12]), rb = religionKey(b[12]);
    if (!ra || !rb) reasons.push("بيانات الديانة ناقصة");
    else if (ra !== rb) reasons.push("اختلاف الديانة");
    // (1) children — required; hard yes vs hard no blocks
    const ka = kidsStance(a[28]), kb = kidsStance(b[28]);
    if (!ka || !kb) reasons.push("بيانات الرغبة بالأطفال ناقصة");
    else if ((ka === "yes" && kb === "no") || (ka === "no" && kb === "yes")) reasons.push("تعارض في الرغبة بالأطفال");
    // (2) age — required numeric; each must fall in the other's accepted range
    const agA = a[3] || {}, agB = b[3] || {};
    const okA = isNum(agA.age) && isNum(agB.min) && isNum(agB.max);
    const okB = isNum(agB.age) && isNum(agA.min) && isNum(agA.max);
    if (!okA || !okB) reasons.push("بيانات العمر ناقصة");
    else if (agA.age < agB.min || agA.age > agB.max || agB.age < agA.min || agB.age > agA.max)
      reasons.push("خارج المدى العمري المقبول");
    // (4) polygamy — conditional (male intends/seeks × female refuses)
    const male = pA.gender === "male" ? a : pB.gender === "male" ? b : null;
    const female = pA.gender === "female" ? a : pB.gender === "female" ? b : null;
    if (male && female) {
      const mSeeks = male[30] === "أنوي التعدد" || male[30] === "متزوج وأبحث عن زوجة ثانية";
      const fRefuses = female[31] === "لا أبداً" || female[31] === "لا أقبل في زواج جديد";
      if (mSeeks && fRefuses) reasons.push("تعارض في موقف تعدد الزوجات");
    }
    // (4) health — conditional (one has a condition × the other explicitly refuses)
    if ((hasHealthCondition(a) && refusesHealth(b)) || (hasHealthCondition(b) && refusesHealth(a)))
      reasons.push("عدم تقبّل حالة صحية قائمة");
    return [...new Set(reasons)];
  }

  function matchingScore(pA, pB) {
    // STAGE 1 — hard filters (deal-breakers gate the match entirely)
    const blockers = hardFilters(pA, pB);
    if (blockers.length) {
      return {
        match_score: 0, compatibility: "low", blocked: true, blockers,
        explanation_ar: "غير متوافق — " + blockers.join("، ") + ". الفلاتر الصلبة لا يمكن تجاوزها.",
        breakdown: {},
      };
    }
    // STAGE 2 — weighted soft compatibility for gate-passers
    const maA = pA.matchAnswers || {}, maB = pB.matchAnswers || {};
    const faceSim = cosine(pA.face_vector || {}, pB.face_vector || {});
    const faceNorm = Math.max(0, (faceSim + 1) / 2);
    const persSim = answerSim(pA.onboarding || {}, pB.onboarding || {}); // 60-trait short answers

    const parts = [];
    const addBucket = (bucket, weight, val, n) => { if (val != null) parts.push({ bucket, weight, val, n }); };
    const bv = bucketSim(maA, maB, "values");    addBucket("values", BUCKET_WEIGHTS.values, bv && bv.sim, bv && bv.n);
    const ba = bucketSim(maA, maB, "attach");    addBucket("attach", BUCKET_WEIGHTS.attach, ba && ba.sim, ba && ba.n);
    const bi = bucketSim(maA, maB, "intimacy");  addBucket("intimacy", BUCKET_WEIGHTS.intimacy, bi && bi.sim, bi && bi.n);
    const bl = bucketSimByNums(maA, maB, LOGISTICS_NUMS); addBucket("logistics", BUCKET_WEIGHTS.logistics, bl && bl.sim, bl && bl.n);
    addBucket("personality", BUCKET_WEIGHTS.personality, Object.keys(pA.onboarding || {}).length ? persSim : null);
    addBucket("face", BUCKET_WEIGHTS.face, Object.keys(pA.face_vector || {}).length ? faceNorm : null);

    const wSum = parts.reduce((s, p) => s + p.weight, 0) || 1;
    let soft = parts.reduce((s, p) => s + p.weight * p.val, 0) / wSum;

    // danger penalty (worst of the two on dark-trait detectors)
    const dA = dangerMean(maA), dB = dangerMean(maB);
    const danger = Math.max(dA ?? 0, dB ?? 0);
    const penalty = danger > 0.6 ? (danger - 0.6) * 0.5 : 0; // up to -0.2
    soft = Math.max(0, soft - penalty);

    const score = Math.round(soft * 100 * 10) / 10;
    let tag, msg;
    if (score >= 75)      { tag = "high";   msg = "توافق قوي — تقارب واضح في القيم والشخصية بعد اجتياز الفلاتر الأساسية."; }
    else if (score >= 55) { tag = "medium"; msg = "توافق جيد — نقاط التقاء حقيقية مع بعض الاختلافات تستحق النقاش."; }
    else                  { tag = "low";    msg = "توافق محدود — اجتاز الفلاتر لكن التقارب في القيم/الشخصية ضعيف."; }
    const breakdown = {};
    parts.forEach(p => breakdown[p.bucket] = { weight: p.weight, score: Math.round(p.val * 100), items: p.n });
    if (penalty > 0) breakdown.danger_penalty = -Math.round(penalty * 100);
    return { match_score: score, compatibility: tag, blocked: false, blockers: [], explanation_ar: msg, breakdown };
  }

  function getQuestionsForPlan(plan) {
    return state.plans[plan].map(qid => state.questions[qid]);
  }
  function getTraitMeta(tid) { return state.traitsMeta[tid]; }
  // ---- face frame (إطار الوجه) — nearest centroid in z-space against
  // signatures learned from 1,265 labeled faces (kaggle face-shape dataset,
  // z-scored on our FairFace population). Soft output: single frame when the
  // margin is clear, otherwise the two closest frames.
  function classifyFaceFrame(zMetrics) {
    const ff = state.faceFrames;
    if (!ff || !zMetrics) return null;
    const scored = [];
    for (const [cls, cent] of Object.entries(ff.classes)) {
      let d2 = 0, used = 0;
      ff.features.forEach((k, i) => {
        const v = zMetrics[k];
        if (typeof v === "number") { d2 += (v - cent[i]) ** 2; used++; }
      });
      if (used >= 4) scored.push({ frame: cls, dist: Math.sqrt(d2) });
    }
    if (scored.length < 2) return null;
    scored.sort((a, b) => a.dist - b.dist);
    // closeness 0..100 per frame (inverse-distance, normalised)
    const inv = scored.map(s => 1 / (0.2 + s.dist));
    const sum = inv.reduce((a, b) => a + b, 0);
    scored.forEach((s, i) => s.closeness = Math.round(100 * inv[i] / sum));
    const margin = scored[1].dist - scored[0].dist;
    return {
      primary: scored[0].frame,
      secondary: margin < 0.25 ? scored[1].frame : null,  // too close to call
      decisive: margin >= 0.25,
      scored,
      holdout_top1_pct: ff.holdout_top1_pct, holdout_top2_pct: ff.holdout_top2_pct,
    };
  }

  // structural features of a trait with their resolved js metric (for UI
  // explanations like "بناءً على اتساع العينين")
  function getTraitFeatures(tid) {
    const rec = state.structMap[tid];
    if (!rec) return [];
    return rec.features.map(f => {
      const [js, proxy] = resolveMetric(f.feature);
      return { feature: f.feature, js, proxy, hits: f.hits, direction: f.direction,
               source: f.confidence_source || "frontal" };
    });
  }

  return { init, analyzeTraits, matchingScore, getQuestionsForPlan, getTraitMeta,
           getTraitFeatures, faceTraitAssessment, selectAdaptiveQuestions,
           zScoreMetrics, getBaselines, classifyFaceFrame };
})();

window.Scoring = Scoring;
