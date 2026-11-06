#!/usr/bin/env node
// SEO + GEO audit for the Shybird docs site. No dependencies.
//
//   node .claude/skills/seo/audit.mjs               # production build into a temp dir, then audit
//   node .claude/skills/seo/audit.mjs --site _site  # audit an existing build
//
// It checks the built HTML, sitemap.xml, robots.txt and llms.txt, plus page front matter.
// Exit code: 0 = no errors (warnings allowed), 1 = errors, 2 = build failed.
import { readFileSync, readdirSync, existsSync, mkdtempSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const REPO = process.cwd();
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const SITE_URL = 'https://docs.shybird.ai';

let site = opt('--site');
if (!site) {
  site = mkdtempSync(join(tmpdir(), 'shybird-seo-'));
  try {
    execFileSync('bundle', ['exec', 'jekyll', 'build', '-q', '-d', site],
      { cwd: REPO, stdio: 'pipe', env: { ...process.env, JEKYLL_ENV: 'production' } });
  } catch (e) { process.stderr.write(e.stderr?.toString() || ''); console.error('jekyll build failed'); process.exit(2); }
}

const errors = [], warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

// ---- Front matter (source) ----------------------------------------------------------
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const permalinks = new Map();
for (const f of walk(join(REPO, '_pages')).filter(f => /\.(md|html)$/.test(f))) {
  const fm = (readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
  const get = k => (fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1]?.trim().replace(/^["']|["']$/g, '');
  const rel = relative(REPO, f);
  const pl = get('permalink');
  if (pl) (permalinks.get(pl) || permalinks.set(pl, []).get(pl)).push(rel);
  if (pl === '/404.html') continue;
  const desc = get('description');
  if (!desc) warn(rel, 'no `description:` in front matter (falls back to the site description)');
  else if (desc.length < 50 || desc.length > 160) warn(rel, `description is ${desc.length} chars (aim for 50-160)`);
}
for (const [pl, files] of permalinks) if (files.length > 1) err(pl, `permalink used by ${files.join(' and ')} - only one is published`);

// ---- Built HTML ----------------------------------------------------------------------
const meta = (html, attr, name) =>
  (html.match(new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`, 'i')) ||
   html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${name}"`, 'i')) || [])[1];
const titles = new Map(), descs = new Map();
const htmlFiles = walk(site).filter(f => f.endsWith('.html') && !relative(site, f).startsWith('assets/'));
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const where = '/' + relative(site, f).replace(/(index)?\.html$/, '');
  if (/<meta name="robots" content="[^"]*noindex/.test(html) || where === '/404') continue;
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = meta(html, 'name', 'description');
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  const lang = (html.match(/<html[^>]*lang="([^"]*)"/) || [])[1];

  if (!title) err(where, 'no <title>');
  else { (titles.get(title) || titles.set(title, []).get(title)).push(where); if (title.length > 60) warn(where, `title is ${title.length} chars: "${title}"`); }
  if (!desc) err(where, 'no meta description');
  else {
    (descs.get(desc) || descs.set(desc, []).get(desc)).push(where);
    if (/awesome description|edit this\s+line/i.test(desc)) err(where, 'meta description is the Jekyll placeholder text');
  }
  if (!canon) err(where, 'no canonical link');
  else if (!canon.startsWith(SITE_URL)) err(where, `canonical is ${canon} (build with JEKYLL_ENV=production)`);
  if (h1s !== 1) err(where, `${h1s} <h1> elements (want exactly 1)`);
  if (lang && lang !== 'en-GB') warn(where, `<html lang="${lang}"> but the content is British English (en-GB)`);
  if (!meta(html, 'property', 'og:image')) warn(where, 'no og:image (link previews have no image)');
  if (!html.includes('application/ld+json')) warn(where, 'no JSON-LD structured data');
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) err(where, `image without alt: ${m[0].slice(0, 80)}`);
}
for (const [t, ps] of titles) if (ps.length > 1) err(ps.join(', '), `duplicate <title> "${t}"`);
for (const [d, ps] of descs) if (ps.length > 1) warn(`${ps.length} pages`, `share the description "${d.slice(0, 60)}..."`);

// ---- Crawler files -------------------------------------------------------------------
const read = p => existsSync(join(site, p)) ? readFileSync(join(site, p), 'utf8') : null;
const robots = read('robots.txt');
if (!robots) err('robots.txt', 'missing');
else if (!/Sitemap:\s*https:\/\/docs\.shybird\.ai\/sitemap\.xml/i.test(robots)) err('robots.txt', 'does not point to the sitemap');

const sitemap = read('sitemap.xml');
if (!sitemap) err('sitemap.xml', 'missing');
else {
  const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1].trim());
  const dupes = locs.filter((l, i) => locs.indexOf(l) !== i);
  if (dupes.length) err('sitemap.xml', `duplicate URLs: ${[...new Set(dupes)].join(', ')}`);
  for (const l of locs) {
    if (!l.startsWith(SITE_URL)) err('sitemap.xml', `non-production URL ${l}`);
    if (/404|\.txt$|\.xml$/.test(l)) err('sitemap.xml', `should not list ${l}`);
  }
  if (!/<lastmod>/.test(sitemap)) warn('sitemap.xml', 'no <lastmod> dates');
}

const llms = read('llms.txt');
if (!llms) err('llms.txt', 'missing');
else {
  if (!/^# /m.test(llms)) err('llms.txt', 'no "# Title" heading');
  if (!/^> /m.test(llms)) warn('llms.txt', 'no "> summary" line under the title');
  const links = [...llms.matchAll(/\]\(([^)]*)\)/g)].map(m => m[1]);
  if (links.some(l => !l.startsWith('http'))) err('llms.txt', 'contains relative links (use absolute URLs)');
  if (links.some(l => /404|llms\.txt/.test(l))) err('llms.txt', 'lists the 404 page or itself');
  if (!/\]\([^)]*\):\s*\S/.test(llms)) warn('llms.txt', 'links have no ": description" after them');
}

// ---- Report --------------------------------------------------------------------------
for (const e of errors) console.log(`ERROR  ${e}`);
for (const w of warnings) console.log(`warn   ${w}`);
console.log(`\n${htmlFiles.length} HTML files checked: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
