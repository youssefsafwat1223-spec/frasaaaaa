"""
Reconcile feature names across:
  (A) test.js  -- 22 real MediaPipe-derived metrics
  (B) thresholds_from_pdf.json  -- 24 metric names used in calibrated thresholds
  (C) phase2_out/trait_feature_map.json -- abstract names I introduced

Outputs reconcile_out/
  - feature_alias.json     canonical_name -> {js_name?, threshold_name?, phase2_name?, status}
  - gaps.md                features used in Phase 2 but NOT in test.js (need to be added)
  - coverage_after_merge.md  how many Phase 2 traits get a real measurement
"""
import json, re, sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent
OUT  = ROOT / "reconcile_out"; OUT.mkdir(exist_ok=True)
sys.stdout.reconfigure(encoding="utf-8")

# --------- (A) Pull metric names from test.js
js_text = (ROOT / "test.js").read_text(encoding="utf-8")
# Three sources of metrics now exist:
#   baseMetrics (inside computeMetricsFromCrop)
#   computeExtendedLandmarkMetrics return
#   computeExtendedPixelMetrics return
JS_METRICS = []
for pat in [
    r"const\s+baseMetrics\s*=\s*\{([^}]+hairline_point[^}]*)\}",
    r"computeExtendedLandmarkMetrics[^{]+\{[\s\S]*?return\s*\{([^}]+mouth_corner_tilt[^}]*)\}",
    r"computeExtendedPixelMetrics[^{]+\{[\s\S]*?return\s*\{([^}]+cheek_fullness[^}]*)\}",
]:
    m = re.search(pat, js_text)
    if not m: continue
    for line in m.group(1).splitlines():
        mm = re.match(r"\s*([a-z_]+)\s*:", line)
        if mm: JS_METRICS.append(mm.group(1))
# de-dupe + drop bookkeeping fields
JS_METRICS = sorted(set(m for m in JS_METRICS
                        if m not in {"hairline_detected","hairline_point"}))

# --------- (B) thresholds metric names
TH = json.loads((ROOT/"thresholds_from_pdf.json").read_text(encoding="utf-8"))
TH_METRICS = sorted({c["metric"] for c in TH["comparisons"] if c.get("metric")})

# --------- (C) phase2 feature names
P2 = json.loads((ROOT/"phase2_out"/"trait_feature_map.json").read_text(encoding="utf-8"))
P2_FEATURES = sorted({f["feature"] for t in P2 for f in t["features"]})

# --------- canonical alias table
# key = canonical name (chosen = js name if it exists, else threshold name, else phase2 name)
# Direct matches: same string in multiple sources.
all_names = set(JS_METRICS) | set(TH_METRICS) | set(P2_FEATURES)

# Features intentionally dropped — cannot be measured from a single still photo.
DROPPED = {
    "mouth_stability":   "requires video to observe over time",
    "chin_stability":    "requires video to observe over time",
    "feature_rigidity":  "composite — derive from constituent signals if needed",
    "mouth_tension_ratio":  "pixel-level muscle tension not reliable from photo",
    "lower_lip_tension":    "too subtle for static photo",
    "upper_lip_tension":    "too subtle for static photo",
    "forehead_tension":     "rolled into forehead_lines_density (use that instead)",
    "face_muscle_tension":  "composite — use forehead_lines_density + brow_density",
    "lip_flexibility":      "requires video",
    "eye_depth":            "requires 3D / depth — not reliable from 2D",
    "lash_density":         "not feasible from landmarks",
    "upper_lid_coverage":   "needs precise lid landmarks beyond MediaPipe defaults",
    "nose_bridge_height":   "requires profile view",
    "nose_bridge_straightness": "requires profile view",
    "nose_tip_sharpness":   "requires profile view",
    "nose_tip_size":        "requires precise tip landmarks",
    "cheekbone_prominence": "requires 3D",
    "cheekbone_height":     "requires 3D",
    "feature_softness":     "composite — currently use proxy via edges",
    "chin_roundness":       "requires fine chin contour landmarks",
    "chin_dimple":          "pixel detection unreliable",
    "brow_definition":      "edge analysis too noisy",
    "brow_symmetry":        "composite — derive if needed",
    "brow_tension":         "pixel detection unreliable",
}

# manual aliasing — group features that are conceptually identical
# After Phase 2 reconciliation, test.js now produces:
#   base   : forehead_height/face_height/forehead_ratio/forehead_top_width/brow_width/
#            widening_ratio/face_width/face_aspect_ratio/eye_spacing/eye_spacing_ratio/
#            eye_size_ratio/eye_open_ratio/eye_tilt_ratio/brow_eye_distance_ratio/
#            mouth_width_ratio/mouth_height_ratio/upper_lip_ratio/lower_lip_ratio/
#            philtrum_ratio/lower_face_ratio/nose_length_ratio/nose_tip_projection_ratio/
#            nose_tip_drop_ratio/forehead_slant_ratio/jaw_width_ratio/chin_projection_ratio
#   ext    : brow_inner_distance/brow_arch/nose_width_ratio/nostril_width_ratio/
#            chin_width_ratio/jaw_angle_sharpness/lower_lip_protrusion/mouth_corner_tilt
#   pixel  : forehead_lines_density/forehead_smoothness/brow_density/cheek_fullness
ALIAS_GROUPS = {
    # ----------- direct -----------
    "face_aspect_ratio":       ["face_aspect_ratio"],
    "jaw_width_ratio":         ["jaw_width_ratio"],
    "brow_eye_distance_ratio": ["brow_eye_distance_ratio"],
    "mouth_height_ratio":      ["mouth_height_ratio"],
    "upper_lip_ratio":         ["upper_lip_ratio"],
    "lower_lip_ratio":         ["lower_lip_ratio"],
    "mouth_width_ratio":       ["mouth_width_ratio"],
    "eye_open_ratio":          ["eye_open_ratio"],
    "eye_spacing_ratio":       ["eye_spacing_ratio"],
    "eye_tilt_ratio":          ["eye_tilt_ratio"],
    "chin_projection_ratio":   ["chin_projection_ratio"],
    "nose_length_ratio":       ["nose_length_ratio"],
    "nose_tip_drop_ratio":     ["nose_tip_drop_ratio"],
    # ----------- newly added (extended landmark) -----------
    "brow_inner_distance":     ["brow_inner_distance"],
    "brow_arch":               ["brow_arch"],
    "chin_width_ratio":        ["chin_width_ratio"],
    "jaw_angle_sharpness":     ["jaw_angle_sharpness"],
    "nostril_width_ratio":     ["nostril_width_ratio"],
    "nose_width_ratio":        ["nose_width_ratio"],
    "lower_lip_protrusion":    ["lower_lip_protrusion"],
    "mouth_corner_tilt":       ["mouth_corner_tilt"],
    # ----------- pixel-derived -----------
    "forehead_lines":          ["forehead_lines_density"],
    "forehead_smoothness":     ["forehead_smoothness"],
    "brow_density":            ["brow_density"],
    "cheek_fullness":          ["cheek_fullness"],
    # ----------- proxies (reasonable approximations) -----------
    "forehead_width_ratio":    ["forehead_top_width", "widening_ratio"],
    "forehead_shape":          ["forehead_slant_ratio"],
    "brow_tilt":               ["eye_tilt_ratio"],           # PROXY
    "eye_warmth_proxy":        ["eye_open_ratio"],           # PROXY
    "eye_roundness":           ["eye_open_ratio"],           # PROXY
    "mouth_open_ratio":        ["mouth_height_ratio"],       # PROXY
    "face_squareness":         ["face_aspect_ratio"],        # PROXY
}

ALIAS_TABLE = {}
# canonical = Phase2-style abstract feature name
for canonical, aliases in ALIAS_GROUPS.items():
    direct_js = canonical if canonical in JS_METRICS else None
    js_alias  = next((a for a in aliases if a in JS_METRICS), None) if not direct_js else direct_js
    th_alias  = canonical if canonical in TH_METRICS else next((a for a in aliases if a in TH_METRICS), None)
    if js_alias:
        status = "available"
    elif th_alias:
        status = "calibrated_only"
    else:
        status = "missing"
    ALIAS_TABLE[canonical] = {
        "js_metric":        js_alias,
        "threshold_metric": th_alias,
        "phase2_uses":      canonical in P2_FEATURES,
        "status":           status,
        "note":             "PROXY/approximation" if (js_alias and js_alias != canonical) else "",
    }
# add the intentionally dropped features so callers see explicit status
for k, reason in DROPPED.items():
    if k in ALIAS_TABLE: continue
    ALIAS_TABLE[k] = {
        "js_metric": None, "threshold_metric": None,
        "phase2_uses": k in P2_FEATURES, "status": "dropped",
        "note": reason,
    }

# --------- write artefacts
(OUT/"feature_alias.json").write_text(
    json.dumps(ALIAS_TABLE, ensure_ascii=False, indent=2), encoding="utf-8")

# Gaps report
gaps   = [k for k,v in ALIAS_TABLE.items() if v["status"]=="missing"        and v["phase2_uses"]]
calib  = [k for k,v in ALIAS_TABLE.items() if v["status"]=="calibrated_only" and v["phase2_uses"]]
avail  = [k for k,v in ALIAS_TABLE.items() if v["status"]=="available"      and v["phase2_uses"]]
dropped= [k for k,v in ALIAS_TABLE.items() if v["status"]=="dropped"        and v["phase2_uses"]]

# How many Phase 2 traits keep at least one feature after merge?
trait_after = []
for t in P2:
    real_feats = [f for f in t["features"]
                  if ALIAS_TABLE.get(f["feature"], {}).get("status") == "available"]
    proxied    = [f for f in t["features"]
                  if ALIAS_TABLE.get(f["feature"], {}).get("status") == "available"
                  and ALIAS_TABLE[f["feature"]]["note"] == "PROXY/approximation"]
    trait_after.append({
        "id": t["id"], "name": t["name"], "orig_features": len(t["features"]),
        "real_features": len(real_feats),
        "proxy_features": len(proxied),
        "lost": [f["feature"] for f in t["features"] if f not in real_feats],
        "kept": [f["feature"] for f in real_feats],
    })

lines = [
"# Feature-alias reconciliation\n",
f"- test.js metrics      : **{len(JS_METRICS)}**  (real, working)",
f"- threshold metrics    : **{len(TH_METRICS)}**  (calibrated values)",
f"- phase2 features used : **{len(P2_FEATURES)}**  (abstract)",
"",
f"## Feature status (only Phase-2 features shown)",
f"- ✅ available in test.js (direct or proxy): **{len(avail)}**",
f"- 🟡 calibrated_only (in thresholds, NOT in test.js): **{len(calib)}**",
f"- ❌ missing entirely (need new code): **{len(gaps)}**",
f"- ⛔ intentionally dropped (impossible from still photo): **{len(dropped)}**",
"",
"## Available now (Phase 2 features mapped to a real JS metric)",
]
for k in sorted(avail):
    v = ALIAS_TABLE[k]
    note = f"  ⚠ {v['note']}" if v["note"] else ""
    lines.append(f"- `{k}`  →  test.js: `{v['js_metric']}`{note}")
lines.append("\n## Missing — need to be added to test.js")
for k in sorted(gaps):
    lines.append(f"- `{k}`")
lines.append("\n## How the 15 Phase-2 traits look after reconciliation\n")
lines.append("| Trait | orig | real | lost |")
lines.append("|---|---|---|---|")
for t in trait_after:
    lost = ", ".join(t["lost"]) or "—"
    lines.append(f"| {t['id']} {t['name']} | {t['orig_features']} | **{t['real_features']}** | {lost} |")
(OUT/"gaps.md").write_text("\n".join(lines), encoding="utf-8")

# Coverage after merge — how many traits still have ≥1 real measurement
ok = sum(1 for t in trait_after if t["real_features"] >= 1)
ok2 = sum(1 for t in trait_after if t["real_features"] >= 2)
print("=== Reconciliation ===")
print(f"test.js metrics       : {len(JS_METRICS)}")
print(f"threshold metrics     : {len(TH_METRICS)}")
print(f"phase2 abstract feats : {len(P2_FEATURES)}")
print(f"\nPhase2 features available now    : {len(avail)}")
print(f"Phase2 features missing entirely : {len(gaps)}")
print(f"\nOf 15 kept traits:")
print(f"  with ≥1 real feature: {ok}")
print(f"  with ≥2 real features: {ok2}")
print(f"\nOutputs in {OUT}")
