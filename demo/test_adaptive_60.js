// Node harness: load the 60-trait data set + the 60-trait visual map, run
// scoring.js's selectAdaptiveQuestions end-to-end and report the REAL final
// question count after greedy set-cover, with and without a clean photo.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DATA = path.join(__dirname, "data");
const J = f => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));

// --- fetch shim mapping the live filenames to the *_60 variants ---
const REMAP = {
  "question_bank.json": "question_bank_60.json",
  "trait_question_matrix.json": "trait_question_matrix_60.json",
  "plans.json": "plans_60.json",
  "feature_alias.json": "feature_alias.json",
  "trait_feature_map.json": "trait_feature_map_60.json",
  "traits_meta.json": "traits_meta_60.json",
};
global.fetch = async (p) => {
  const base = p.replace("./data/", "");
  const real = REMAP[base] || base;
  const body = fs.readFileSync(path.join(DATA, real), "utf8");
  return { ok: true, status: 200, json: async () => JSON.parse(body) };
};
global.window = {};

// load scoring.js (IIFE assigns window.Scoring)
const src = fs.readFileSync(path.join(__dirname, "scoring.js"), "utf8");
vm.runInThisContext(src);
const Scoring = global.window.Scoring;

// simulate a face. `raw` is the pre-zscore metric value. zScore centres on
// 0.3/0.2, so raw=0.48 -> z=+0.9 (decisive, distinctive face = BEST case);
// raw=0.40 -> z=+0.5 (moderate, a more typical face).
function faceMetrics(raw) {
  const alias = J("feature_alias.json");
  const map = J("trait_feature_map_60.json");
  const fm = {};
  for (const t of map) for (const f of t.features) {
    const rec = alias[f.feature];
    if (!rec || rec.status !== "available") continue;
    fm[rec.js_metric] = raw;
  }
  return fm;
}

(async () => {
  const info = await Scoring.init();
  console.log("init:", JSON.stringify(info));

  const plan = "advanced"; // all 180 questions available
  const planSize = 180;

  const noPhoto   = Scoring.selectAdaptiveQuestions(null, plan, { threshold: 0.55 });
  const moderate  = Scoring.selectAdaptiveQuestions(faceMetrics(0.40), plan, { threshold: 0.55 });
  const bestCase  = Scoring.selectAdaptiveQuestions(faceMetrics(0.48), plan, { threshold: 0.55 });

  const row = (label, r) =>
    console.log(
      `${label.padEnd(22)} | confident ${String(r.traits_confident).padStart(2)}` +
      ` | uncertain ${String(r.traits_uncertain).padStart(2)}` +
      ` | covered ${String(r.traits_covered_by_questions).padStart(2)}` +
      ` | uncovered ${String(r.traits_still_uncovered).padStart(2)}` +
      ` | QUESTIONS ${String(r.questions.length).padStart(3)}`);

  console.log("\n=== ADAPTIVE SET-COVER on the 60-trait data (plan=advanced) ===");
  console.log(`full fixed plan (no adaptivity): ${planSize} questions`);
  row("no photo (baseline 60)", noPhoto);
  row("moderate face (z~0.5)", moderate);
  row("distinctive face (z~0.9)", bestCase);

  const pctVs = (a, r) => Math.round(100 * (a - r.questions.length) / a);
  console.log(`\nvs no-photo adaptive baseline (${noPhoto.questions.length}):`);
  console.log(`  moderate face    -> ${moderate.questions.length}  (-${pctVs(noPhoto.questions.length, moderate)}%)`);
  console.log(`  distinctive face -> ${bestCase.questions.length}  (-${pctVs(noPhoto.questions.length, bestCase)}%)`);
})().catch(e => { console.error("ERR", e); process.exit(1); });
