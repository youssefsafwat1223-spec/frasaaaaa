import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "تجربة_العميل");
const OUT = path.join(HERE, "customer_demo_deploy_check_report.json");

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, base, out);
    else out.push({ path: path.relative(base, p).replaceAll("\\", "/"), bytes: fs.statSync(p).size });
  }
  return out;
}

function extractRefs(html) {
  const refs = [];
  const re = /\b(src|href)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = re.exec(html))) refs.push({ attr: match[1].toLowerCase(), ref: match[2] });
  return refs;
}

function localTarget(ref) {
  if (/^(#|mailto:|tel:|https?:\/\/|data:)/i.test(ref)) return null;
  const clean = ref.startsWith("./") ? ref.slice(2) : ref;
  return path.resolve(ROOT, clean);
}

function scan() {
  const report = {
    root: ROOT,
    exists: fs.existsSync(ROOT),
    files: [],
    missing_refs: [],
    warnings: [],
    errors: [],
  };
  if (!report.exists) {
    report.errors.push("Folder does not exist");
    return report;
  }

  report.files = walk(ROOT);

  for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort()) {
    const html = readText(path.join(ROOT, file));
    if (!html.includes('dir="rtl"')) report.warnings.push(`${file}: missing dir=rtl`);
    if (!html.includes('<meta name="viewport"')) report.warnings.push(`${file}: missing viewport meta`);
    for (const { attr, ref } of extractRefs(html)) {
      const target = localTarget(ref);
      if (target && !fs.existsSync(target)) {
        report.missing_refs.push({ file, attr, ref, expected: target });
      }
    }
  }

  const jsText = fs.readdirSync(ROOT)
    .filter((f) => f.endsWith(".js"))
    .sort()
    .map((f) => readText(path.join(ROOT, f)))
    .join("\n");

  const risky = {
    absolute_windows_path: /[A-Za-z]:\\/,
    file_url: /file:\/\//i,
    localhost: /localhost|127\.0\.0\.1/i,
    todo_fixme: /\bTODO\b|\bFIXME\b/i,
  };
  for (const [name, re] of Object.entries(risky)) {
    if (re.test(jsText)) report.warnings.push(`Found risky pattern: ${name}`);
  }

  const required = [
    "index.html",
    "full.html",
    "face.html",
    "styles.css",
    "face.js",
    "capture.js",
    "full-app.js",
    "data_core.js",
    "data_personality.js",
    "models/face_landmarker.task",
  ];
  for (const rel of required) {
    if (!fs.existsSync(path.join(ROOT, rel))) report.errors.push(`Missing required file: ${rel}`);
  }

  return report;
}

const result = scan();
fs.writeFileSync(OUT, JSON.stringify(result, null, 2), "utf8");
console.log(JSON.stringify({
  exists: result.exists,
  files: result.files.length,
  errors: result.errors.length,
  warnings: result.warnings.length,
  missing_refs: result.missing_refs.length,
  report: OUT,
}, null, 2));
