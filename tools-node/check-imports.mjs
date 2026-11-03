import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend', 'src');
const EXTS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.css', '.scss', '.svg'];

// returns {ok:true} or {ok:false, found:'actualNameOnDisk', wanted:'nameAsWritten'}
function matchEntry(dir, base, isFinal) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return { ok: false, wanted: base, found: null }; }
  const ci = entries.filter(e => e.name.toLowerCase() === base.toLowerCase());
  if (ci.length === 0) return { ok: false, wanted: base, found: null };
  // exact (or final with allowed extension) match check
  for (const e of ci) {
    if (e.name === base) return { ok: true };
    if (isFinal && EXTS.some(ext => e.name === base + ext)) return { ok: true };
  }
  return { ok: false, wanted: base, found: ci[0].name };
}

function resolveExactCase(fromDir, rel) {
  const target = path.resolve(fromDir, rel);
  let cur = target;
  const segs = [];
  while (path.dirname(cur) !== cur && cur.length > path.dirname(root).length) {
    segs.unshift(path.basename(cur));
    cur = path.dirname(cur);
  }
  const baseDir = cur; // inside root
  let dir = baseDir;
  for (let i = 0; i < segs.length; i++) {
    const isFinal = i === segs.length - 1;
    const m = matchEntry(dir, segs[i], isFinal);
    if (!m.ok) return { ...m, at: dir };
    dir = path.join(dir, ciMap(dir, segs[i]) || segs[i]);
  }
  return { ok: true };
}

function ciMap(dir, base) {
  try {
    const e = fs.readdirSync(dir, { withFileTypes: true })
      .find(e => e.name.toLowerCase() === base.toLowerCase());
    return e ? e.name : null;
  } catch { return null; }
}

let problems = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx|js)$/.test(e.name)) {
      const src = fs.readFileSync(p, 'utf8');
      const re = /(?:import|export)[^'"]*from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      let m;
      while ((m = re.exec(src))) {
        const spec = m[1] || m[2];
        if (!spec || !spec.startsWith('.')) continue;
        const r = resolveExactCase(path.dirname(p), spec);
        if (!r.ok) {
          problems++;
          const base = r.wanted;
          console.log(`CASE BUG: ${path.relative(root, p)} imports "${spec}" -> on disk looks like "${r.found ?? 'MISSING'}" in ${path.relative(root, r.at)}`);
        }
      }
    }
  }
}
walk(root);
console.log(problems === 0 ? 'OK: no case-mismatched imports' : `${problems} problem(s)`);
