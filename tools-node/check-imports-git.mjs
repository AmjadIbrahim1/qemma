import { execSync } from 'node:child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const monorepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(monorepo, 'frontend', 'src');
const relPrefix = 'frontend' + path.sep + 'src';

// Set of repo-tracked file paths under frontend/src, exact case (what GitHub/Vercel has)
const tracked = execSync('git ls-files "frontend/src"', { cwd: monorepo, encoding: 'utf8' })
  .split('\n').filter(Boolean);

const EXTS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.css', '.scss'];
const relTracked = tracked.map(t => t.replace(/^frontend\/src\//, ''));
const PAGES = new Set(relTracked);

function candidates(spec, fromFile) {
  const target = path.resolve(path.dirname(fromFile), spec.split('?')[0]);
  const t = path.relative(srcDir, target).replace(/\\/g, '/');
  const out = [t];
  // direct extensions
  for (const e of EXTS) out.push(t + e);
  // file and dir/index fallback
  for (const e of EXTS) out.push(t + '/index' + e);
  return out;
}

function findExactCase(spec, fromFile) {
  const cands = candidates(spec, fromFile);
  // exact case hit?
  for (const c of cands) if (PAGES.has(c)) return { ok: true };
  // case-insensitive match on the tracked list; classify identical-vs-different case
  for (const c of cands) {
    const key = c.toLowerCase();
    for (const t of relTracked) {
      if (t.toLowerCase() === key) {
        if (t === c) return { ok: true };
        return { ok: false, found: t, wanted: c };
      }
    }
  }
  return { ok: false, found: null }; // truly missing
}

let problems = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx|js)$/.test(e.name)) {
      const src = fs.readFileSync(p, 'utf8');
      const re = /(?:import|export)[^'"`]*from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      let m;
      while ((m = re.exec(src))) {
        const spec = m[1] || m[2];
        if (!spec || !spec.startsWith('.')) continue;
        const r = findExactCase(spec, p);
        if (!r.ok) {
          problems++;
          const file = path.relative(srcDir, p).replaceAll('\\', '/');
          if (r.found === null) console.log(`MISSING: ${file} imports "${spec}" -> no tracked file matches`);
          else console.log(`CASE-MISMATCH: ${file} imports "${r.wanted}" -> tracked as "${r.found}"`);
        }
      }
    }
  }
}
walk(srcDir);
console.log(problems === 0 ? 'OK: imports all resolve in the tracked (exact-case) file list' : `${problems} problem(s)`);
