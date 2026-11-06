#!/usr/bin/env node
// WCAG 2.2 Level AA automated check for the Shybird docs site.
//
// Builds the site (unless --site is given), serves the output on a local port,
// and runs axe-core against every HTML page at desktop (1280px) and reflow (320px) widths.
// Exits 1 if any WCAG 2.0/2.1/2.2 A or AA violation is found.
//
// Usage (from the repo root):
//   node scripts/a11y/check.mjs                 # jekyll build into a temp dir, then check
//   node scripts/a11y/check.mjs --site _site    # check an existing build (CI)
//   node scripts/a11y/check.mjs --only /trust/security   # check one page (still builds)
//
// Writes a JSON report to <site>/../a11y-report.json (or --report PATH) and, when run
// inside the repo, records the result in .claude/state/a11y-last.json for the Stop hook.
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { join, extname, resolve, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const WIDTHS = [1280, 320]; // 320 CSS px = WCAG 1.4.10 Reflow
const SKIP = [/^\/404\.html$/, /^\/assets\//, /^\/feed\.xml$/];

const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
let site = opt('--site');
const only = opt('--only');

if (!site) {
  site = join(mkdtempSync(join(tmpdir(), 'shybird-a11y-')), 'site');
  console.log(`building site -> ${site}`);
  try {
    // Sass deprecation noise from the theme goes to stderr - only show it if the build fails.
    execFileSync('bundle', ['exec', 'jekyll', 'build', '-q', '-d', site], { cwd: REPO, stdio: 'pipe' });
  } catch (e) { process.stderr.write(e.stderr?.toString() || ''); console.error('jekyll build failed'); process.exit(2); }
}
site = resolve(site);
const reportPath = resolve(opt('--report') || join(dirname(site), 'a11y-report.json'));

// --- tiny static server that mimics GitHub Pages (extensionless -> .html, dir -> index.html)
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };
function resolveFile(urlPath) {
  const p = join(site, decodeURIComponent(urlPath));
  for (const c of [p, p + '.html', join(p, 'index.html')]) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
}
const server = createServer((req, res) => {
  const f = resolveFile(req.url.split('?')[0]);
  if (!f) { res.writeHead(404); return res.end(readFileSync(join(site, '404.html'))); }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// --- page list: every .html in the build
function walk(dir) {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}
let pages = walk(site).map(f => '/' + relative(site, f).replace(/index\.html$/, '').replace(/\.html$/, ''))
  .map(p => p === '/' ? '/' : p).filter(p => !SKIP.some(r => r.test(p))).sort();
if (only) pages = pages.filter(p => p === only || p === only.replace(/\/$/, ''));
if (!pages.length) { console.error(`no pages to check${only ? ` matching ${only}` : ''}`); process.exit(2); }

// --- run axe
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const results = [];
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    for (const v of r.violations) results.push({ page: p, width, id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl,
      wcag: v.tags.filter(t => /^wcag\d{3,}$/.test(t)), nodes: v.nodes.map(n => ({ target: n.target.join(' '), summary: n.failureSummary })) });
  }
  await ctx.close();
}
await browser.close();
server.close();

// --- report
const byRule = {};
for (const v of results) (byRule[v.id] ||= { ...v, pages: new Set(), count: 0 }).pages.add(`${v.page} @${v.width}px`), byRule[v.id].count += v.nodes.length;
console.log(`checked ${pages.length} pages x ${WIDTHS.length} widths against ${TAGS.join(', ')}`);
if (!results.length) console.log('PASS: no WCAG 2.2 A/AA violations detected by axe-core');
else {
  console.log(`FAIL: ${Object.keys(byRule).length} rule(s) violated, ${results.reduce((n, v) => n + v.nodes.length, 0)} element(s)`);
  for (const r of Object.values(byRule)) {
    console.log(`\n[${r.impact}] ${r.id} (${r.wcag.join(', ') || 'best-practice'}): ${r.help}\n  ${r.helpUrl}`);
    console.log(`  pages: ${[...r.pages].slice(0, 6).join(', ')}${r.pages.size > 6 ? ` (+${r.pages.size - 6} more)` : ''}`);
    const ex = results.find(v => v.id === r.id).nodes[0];
    console.log(`  e.g. ${ex.target}\n    ${ex.summary.split('\n').join('\n    ')}`);
  }
}
writeFileSync(reportPath, JSON.stringify({ time: new Date().toISOString(), tags: TAGS, widths: WIDTHS, pages, violations: results }, null, 2));
console.log(`\nreport: ${reportPath}`);

// record for the Claude Code Stop hook (only when running inside the repo, never in CI)
if (!process.env.CI && existsSync(join(REPO, '.claude'))) {
  mkdirSync(join(REPO, '.claude/state'), { recursive: true });
  writeFileSync(join(REPO, '.claude/state/a11y-last.json'),
    JSON.stringify({ time: Date.now(), pass: results.length === 0, full: !only, violations: results.length }) + '\n');
}
process.exit(results.length ? 1 : 0);
