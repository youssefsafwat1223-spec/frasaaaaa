// ============================================================
// matching.js — Compatibility engine for the 73-question set.
// Loads matching_questions.json, builds a profile from answers,
// then compares two profiles -> compatibility score per dimension.
//
// Public API:
//   await Matching.init()
//   Matching.getQuestions(gender, religion)
//   Matching.buildProfile(answers)
//   Matching.compareProfiles(profileA, profileB)
// ============================================================

const Matching = (() => {
  const state = { questions: null };

  async function init() {
    const r = await fetch("./data/matching_questions.json");
    state.questions = await r.json();
    return { count: state.questions.length };
  }

  // ---------- question filtering (gender / religion gating) ----------
  function getQuestions(gender, religion) {
    return state.questions.filter(q => {
      if (!q.gender) return true;
      if (q.gender.includes("الإناث") || q.gender.includes("إناث"))
        return gender === "أنثى";
      if (q.gender.includes("الذكور") || q.gender.includes("ذكور"))
        return gender === "ذكر";
      if (q.gender.includes("المسلمون") || q.gender.includes("المسلم"))
        return religion?.startsWith("مسلم");
      if (q.gender.includes("المسيحيون") || q.gender.includes("المسيحي"))
        return religion?.startsWith("مسيحي");
      return true;
    });
  }

  // ---------- profile builder ----------
  // Converts raw answers (qid -> value) into 8 dimension scores plus flags.
  function buildProfile(answers) {
    const p = {
      // identity (hard filters / matching constraints)
      gender:        answers[2] || null,
      country:       answers[4] || null,
      city:          answers[5] || null,
      education:     answers[6] || null,
      maritalStatus: answers[7] || null,
      religion:      answers[12] || null,
      sect:          answers[14] || null,
      wantsChildren: answers[28] || null,
      // continuous / scored dimensions
      religiousCommitment:   answers[13]  ?? null,   // 0..100
      religiousExpectation:  answers[15]  ?? null,   // partner match
      prayerScore:           answers[20]  ?? null,   // 1..5
      fajrScore:             answers[23]  ?? null,
      bigFive: {
        openness:           reverseIf(answers[37], 7, true),
        conscientiousness:  answers[38] ?? null,
        extraversion:       reverseIf(answers[39], 7, true),
        agreeableness:      answers[40] ?? null,
        emotional_stability:answers[41] ?? null,
      },
      attachment: attachmentClassify([answers[42], answers[43], answers[44]]),
      gottman: gottmanScore(answers[45]),
      loveLanguages: answers[56] || null,   // ranking
      values: {
        money_style:    answers[49] ?? null,
        generosity:     answers[50] ?? null,
        cleanliness:    answers[52] ?? null,
        family_proximity: answers[53] ?? null,
        family_interference: answers[54] ?? null,
      },
      intimacy: {
        expected_level: answers[57] ?? null,
        public_affection: answers[58] ?? null,
        parenting_style: answers[59] ?? null,
        work_attitude:   answers[60] ?? null,
      },
      dealBreakers: answers[63] || [],
      health: {
        own_chronic: answers[33] || [],
        own_disability: answers[34] || null,
        own_mental: answers[35] || [],
        acceptance: answers[36] ?? null,  // 1..7
        smoking: filterSmoking(answers[32]),
      },
      darkTriad: darkTriadScore(answers),
      redFlags: collectRedFlags(answers),
    };
    return p;
  }

  function reverseIf(v, max, isReverse) {
    if (v == null) return null;
    return isReverse ? (max + 1 - v) : v;
  }

  function attachmentClassify(scenarioAnswers) {
    // Each answer is letter ا/ب/ج/د mapping to secure/anxious/avoidant/disorganized
    const map = { "أ":"secure", "ب":"anxious", "ج":"avoidant", "د":"disorganized" };
    const tally = { secure:0, anxious:0, avoidant:0, disorganized:0 };
    for (const a of scenarioAnswers) {
      const t = map[a];
      if (t) tally[t]++;
    }
    let best = null, bestN = 0;
    for (const [k, n] of Object.entries(tally)) if (n > bestN) { bestN = n; best = k; }
    return { primary: best, breakdown: tally };
  }

  function gottmanScore(matrix) {
    // matrix is expected as { problem_solving:1..5, criticism, contempt, defensiveness, stonewalling }
    if (!matrix || typeof matrix !== "object") return null;
    const ok       = matrix.problem_solving ?? 3;
    const horsemen = ["criticism","contempt","defensiveness","stonewalling"]
                      .map(k => matrix[k] ?? 3);
    const horsemenAvg = horsemen.reduce((a,b)=>a+b,0) / horsemen.length;
    // Healthy = high problem_solving, low horsemen
    const healthy = (ok - horsemenAvg + 5) * 10;   // approx 0..100
    return { healthy: Math.max(0, Math.min(100, healthy)),
             contempt: matrix.contempt ?? null };
  }

  function darkTriadScore(answers) {
    // sum of darkScore on Q64-72 (scenario items) + Q73 likert
    const letterMap = { "أ":0, "ب":1, "ج":2, "د":3, "هـ":4 };
    let total = 0, n = 0;
    for (let q = 64; q <= 72; q++) {
      const a = answers[q];
      const def = state.questions.find(x => x.num === q);
      if (!def || !a || !def.scenario) continue;
      const branch = def.scenario.branches[letterMap[a]];
      if (branch && typeof branch.darkScore === "number") {
        total += branch.darkScore;
        n++;
      }
    }
    // Q73 likert: 1..7, reverse so 7 = high mach
    if (answers[73] != null) {
      total += (answers[73] - 4);   // -3..+3
      n++;
    }
    // normalised: 0=clean, 100=very dark
    const raw = n ? (total / n) : 0;
    const score = Math.max(0, Math.min(100, (raw + 2) / 4 * 100));
    return { score: Math.round(score), n };
  }

  function collectRedFlags(answers) {
    const flags = [];
    const letterDark = (qNum) => {
      const a = answers[qNum];
      const def = state.questions.find(x => x.num === qNum);
      const letterMap = { "أ":0, "ب":1, "ج":2, "د":3 };
      if (!a || !def?.scenario) return 0;
      return def.scenario.branches[letterMap[a]]?.darkScore ?? 0;
    };
    if (letterDark(66) >= 1) flags.push("control_jealousy");
    if (letterDark(70) >= 1) flags.push("aggression");
    if (letterDark(72) >= 1) flags.push("controlling_decisions");
    if ((answers[73] ?? 0) >= 6) flags.push("machiavellian_endorsement");
    return flags;
  }

  function filterSmoking(arr) {
    if (!Array.isArray(arr)) return "unknown";
    if (arr.some(x => x.includes("غير مدخن"))) return "non_smoker";
    if (arr.some(x => x.includes("سابق"))) return "former_smoker";
    if (arr.some(x => x.includes("إلكتروني") || x.includes("شيشة"))) return "vape_shisha";
    if (arr.some(x => x.includes("مدخن"))) return "smoker";
    return "unknown";
  }

  // ---------- compatibility scoring ----------
  function compareProfiles(A, B) {
    // 1) Hard filters — any failure terminates with a clear reason.
    const hardFail = checkHardFilters(A, B);
    if (hardFail) return { ok:false, reason: hardFail, score: 0 };

    // 2) Dimension scores (each 0..100; higher = more compatible)
    const dims = {
      religion:    scoreReligion(A, B),
      personality: scoreBigFive(A.bigFive, B.bigFive),
      attachment:  scoreAttachment(A.attachment, B.attachment),
      conflict:    scoreGottman(A.gottman, B.gottman),
      values:      scoreValues(A.values, B.values),
      intimacy:    scoreIntimacy(A.intimacy, B.intimacy),
      love_lang:   scoreLoveLanguages(A.loveLanguages, B.loveLanguages),
      dark_triad:  scoreDarkTriad(A.darkTriad, B.darkTriad),
    };
    // 3) Weighted overall (religion + dark_triad have heavy weight)
    const weights = { religion:1.5, personality:1.0, attachment:1.2, conflict:1.5,
                      values:1.0, intimacy:0.8, love_lang:0.7, dark_triad:1.3 };
    let num = 0, den = 0;
    for (const [k, v] of Object.entries(dims)) {
      if (v == null) continue;
      num += v * weights[k];
      den += weights[k];
    }
    const overall = den ? Math.round(num / den) : 0;
    // Red flags from either party can cap the score
    const allFlags = [...(A.redFlags||[]), ...(B.redFlags||[])];
    let capped = overall;
    if (allFlags.length >= 2) capped = Math.min(capped, 55);
    if (allFlags.length >= 4) capped = Math.min(capped, 35);
    const tag = capped >= 75 ? "high" : capped >= 55 ? "medium" : "low";
    return { ok:true, score: capped, raw_overall: overall,
             dimensions: dims, red_flags: allFlags, tag,
             explanation: explain(tag, dims, allFlags) };
  }

  // ---------- hard filters ----------
  function checkHardFilters(A, B) {
    // gender opposite required (matching-app convention; adjust per product)
    if (A.gender && B.gender && A.gender === B.gender)
      return "نفس الجنس — لا توافق وفق سياسة التطبيق";
    // religion exact match unless explicitly opted-in (Q8 not encoded here)
    if (A.religion && B.religion && A.religion !== B.religion)
      return "اختلاف الدين";
    // wantsChildren mismatch
    const hardNo = v => v === "لا";
    const hardYes = v => v?.startsWith("نعم") || v === "نعم — قطعاً";
    if (hardNo(A.wantsChildren) && hardYes(B.wantsChildren)) return "اختلاف موقف الأطفال";
    if (hardNo(B.wantsChildren) && hardYes(A.wantsChildren)) return "اختلاف موقف الأطفال";
    return null;
  }

  // ---------- dimension scorers (all -> 0..100) ----------
  function scoreReligion(A, B) {
    if (A.religion !== B.religion) return 0;
    if (A.sect && B.sect && A.sect !== B.sect) return 40;
    if (A.religiousCommitment != null && B.religiousCommitment != null) {
      const gap = Math.abs(A.religiousCommitment - B.religiousCommitment);
      return Math.max(0, 100 - gap);
    }
    return 70;
  }

  function scoreBigFive(a, b) {
    if (!a || !b) return null;
    const keys = ["openness","conscientiousness","extraversion","agreeableness","emotional_stability"];
    let total = 0, n = 0;
    for (const k of keys) {
      if (a[k] == null || b[k] == null) continue;
      // Complementary traits OK; we just look at *closeness* with mild tolerance.
      const gap = Math.abs(a[k] - b[k]); // 0..6
      total += Math.max(0, 100 - gap * 12);
      n++;
    }
    return n ? Math.round(total/n) : null;
  }

  function scoreAttachment(a, b) {
    if (!a?.primary || !b?.primary) return null;
    // Secure + anything = great. Anxious+Avoidant = problematic. Others = neutral-ish.
    const M = {
      "secure:secure":          95,
      "secure:anxious":         80, "anxious:secure":80,
      "secure:avoidant":        78, "avoidant:secure":78,
      "secure:disorganized":    65, "disorganized:secure":65,
      "anxious:anxious":        55,
      "avoidant:avoidant":      55,
      "anxious:avoidant":       30, "avoidant:anxious":30,
      "anxious:disorganized":   40, "disorganized:anxious":40,
      "avoidant:disorganized":  35, "disorganized:avoidant":35,
      "disorganized:disorganized": 30,
    };
    return M[`${a.primary}:${b.primary}`] ?? 50;
  }

  function scoreGottman(a, b) {
    if (!a || !b) return null;
    // both should have decent "healthy" + low contempt
    const healthAvg = (a.healthy + b.healthy) / 2;
    let s = healthAvg;
    if (a.contempt >= 4 || b.contempt >= 4) s = Math.min(s, 35);   // contempt = predictor of divorce
    return Math.round(s);
  }

  function scoreValues(a, b) {
    if (!a || !b) return null;
    const keys = ["money_style","generosity","cleanliness","family_proximity","family_interference"];
    let total = 0, n = 0;
    for (const k of keys) {
      if (a[k] == null || b[k] == null) continue;
      const gap = Math.abs(a[k] - b[k]);
      total += Math.max(0, 100 - gap * 12);
      n++;
    }
    return n ? Math.round(total/n) : null;
  }

  function scoreIntimacy(a, b) {
    if (!a || !b) return null;
    let total = 0, n = 0;
    if (a.expected_level != null && b.expected_level != null) {
      total += Math.max(0, 100 - Math.abs(a.expected_level - b.expected_level));
      n++;
    }
    ["public_affection","parenting_style","work_attitude"].forEach(k => {
      if (a[k] != null && b[k] != null) {
        total += Math.max(0, 100 - Math.abs(a[k] - b[k]) * 12);
        n++;
      }
    });
    return n ? Math.round(total/n) : null;
  }

  function scoreLoveLanguages(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return null;
    // top language overlap: if A's top-2 includes B's top-1, that's a good signal
    const ranked = arr => arr.map((rank, i) => ({i, rank: +rank}))
                            .filter(x => x.rank > 0)
                            .sort((x,y) => x.rank - y.rank)
                            .map(x => x.i);
    const rA = ranked(a), rB = ranked(b);
    if (!rA.length || !rB.length) return 50;
    const score = rA.slice(0,2).includes(rB[0]) ? 85 : 55;
    return score;
  }

  function scoreDarkTriad(a, b) {
    if (!a || !b) return null;
    const avg = (a.score + b.score) / 2;
    // 0 = both clean → 100; 100 = both very dark → 0
    return Math.round(Math.max(0, Math.min(100, 100 - avg)));
  }

  function explain(tag, dims, redFlags) {
    const out = [];
    if (tag === "high") out.push("توافق قوي على عدة محاور رئيسية.");
    else if (tag === "medium") out.push("توافق متوسط — هناك نقاط التقاء جيدة وبعض الفجوات.");
    else out.push("توافق محدود — قد لا تكون هذه أفضل مطابقة.");
    const top = Object.entries(dims).filter(([_,v])=>v!=null).sort((a,b)=>b[1]-a[1]);
    if (top.length) {
      const best = top[0];
      out.push(`أقوى محور: **${dimNameAr(best[0])}** (${best[1]}/100).`);
      const worst = top[top.length-1];
      if (worst[1] < 55) out.push(`الانتباه إلى: **${dimNameAr(worst[0])}** (${worst[1]}/100).`);
    }
    if (redFlags.length) out.push(`⚠ مؤشرات تحذيرية: ${redFlags.length} علامة — يُنصح بالحذر.`);
    return out.join(" ");
  }
  function dimNameAr(k) {
    return ({
      religion:"التوافق الديني", personality:"الشخصية",
      attachment:"نمط التعلق", conflict:"إدارة الخلاف",
      values:"القيم والعائلة", intimacy:"الحميمية والإيقاع",
      love_lang:"لغة الحب", dark_triad:"السلامة النفسية"
    })[k] || k;
  }

  return { init, getQuestions, buildProfile, compareProfiles, dimNameAr };
})();

window.Matching = Matching;
