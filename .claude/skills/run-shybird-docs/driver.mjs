#!/usr/bin/env node
// Headless driver for the Shybird docs site (Jekyll + Just the Docs).
// Requires the dev server running (default http://127.0.0.1:4000).
//
// Usage (from the repo root):
//   node .claude/skills/run-shybird-docs/driver.mjs smoke              # screenshot key pages + search + link check
//   node .claude/skills/run-shybird-docs/driver.mjs shot /trust/security [/other ...]
//   node .claude/skills/run-shybird-docs/driver.mjs search "business continuity"
//   node .claude/skills/run-shybird-docs/driver.mjs links               # crawl sidebar + content links, report non-200s
//   node .claude/skills/run-shybird-docs/driver.mjs tab /trust/security 5   # press Tab N times, print focus order, screenshot
//
// Env: BASE_URL (default http://127.0.0.1:4000), SHOTS (default /tmp/shybird-shots),
//      WIDTH (default 1280; use 400 for a mobile check), FULL (default 1; FULL=0 = viewport-only shot)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const SHOTS = process.env.SHOTS || '/tmp/shybird-shots';
const WIDTH = Number(process.env.WIDTH || 1280);
mkdirSync(SHOTS, { recursive: true });

const [cmd = 'smoke', ...args] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(`${page.url()}: ${m.text()}`); });
page.on('pageerror', e => consoleErrors.push(`${page.url()}: ${e.message}`));

const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[^\w-]+/g, '_') || 'home');

async function shot(path) {
  const res = await page.goto(BASE + path, { waitUntil: 'networkidle' });
  const h1 = (await page.locator('main h1').first().textContent().catch(() => ''))?.trim();
  const file = `${SHOTS}/${slug(path)}-${WIDTH}.png`;
  await page.screenshot({ path: file, fullPage: process.env.FULL !== '0' });
  console.log(`${res.status()} ${path} h1="${h1}" -> ${file}`);
  return res.status();
}

async function search(q) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  // Just the Docs search: input#search-input, results in .search-results; index loads from /assets/js/search-data.json.
  // It listens for 'keyup' only - page.fill() fires 'input' and the results stay empty. Type real keys.
  await page.click('#search-input');
  await page.keyboard.type(q, { delay: 30 });
  const first = page.locator('.search-results .search-result').first();
  await first.waitFor({ timeout: 10000 });
  const titles = await page.locator('.search-results .search-result-title').allTextContents();
  const file = `${SHOTS}/search-${slug(q)}-${WIDTH}.png`;
  await page.screenshot({ path: file });
  console.log(`search "${q}": ${titles.length} results -> ${file}`);
  titles.slice(0, 5).forEach(t => console.log(`  - ${t.trim().replace(/\s+/g, ' ')}`));
  await first.click();
  await page.waitForLoadState('networkidle');
  console.log(`  clicked first result -> ${page.url().replace(BASE, '')}`);
}

async function links() {
  const seen = new Set(), queue = ['/'], bad = [];
  while (queue.length) {
    const p = queue.shift();
    if (seen.has(p)) continue;
    seen.add(p);
    const res = await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    if (!res || res.status() >= 400) { bad.push(`${res?.status()} ${p}`); continue; }
    const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
    for (const h of hrefs) {
      if (!h || !h.startsWith('/') || h.startsWith('//')) continue;
      const clean = h.split('#')[0].split('?')[0];
      if (clean && !seen.has(clean) && !/\.(png|jpe?g|css|js|xml|txt|ico)$/.test(clean)) queue.push(clean);
    }
  }
  console.log(`crawled ${seen.size} internal URLs`);
  bad.length ? bad.forEach(b => console.log(`  BROKEN ${b}`)) : console.log('  no broken internal links');
  return bad.length;
}

let failed = 0;
try {
  if (cmd === 'shot') { for (const p of args.length ? args : ['/']) if ((await shot(p)) >= 400) failed++; }
  else if (cmd === 'search') await search(args.join(' ') || 'security');
  else if (cmd === 'links') failed += await links();
  else if (cmd === 'tab') {
    // Keyboard check (WCAG 2.1.1 / 2.4.3 / 2.4.7 / 2.4.11): walk the focus order, screenshot the last focused element.
    const [path = '/', n = '5'] = args;
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    for (let i = 1; i <= Number(n); i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const el = document.activeElement, r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        return { tag: el.tagName.toLowerCase(), text: (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 40),
          visible: r.width > 0 && r.height > 0, outline: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' };
      });
      console.log(`${i}. <${f.tag}> "${f.text}"${f.visible ? '' : ' [NOT VISIBLE]'}${f.outline ? '' : ' [no outline/box-shadow - check focus is visible]'}`);
    }
    const file = `${SHOTS}/tab-${slug(path)}-${n}-${WIDTH}.png`;
    await page.screenshot({ path: file });
    console.log(`-> ${file}`);
  }
  else if (cmd === 'smoke') {
    for (const p of ['/', '/trust/', '/trust/security', '/trust/privacy', '/release-notes'])
      if ((await shot(p)) >= 400) failed++;
    await search('security');
    failed += await links();
  } else { console.error(`unknown command: ${cmd}`); failed = 1; }
} catch (e) { console.error(`ERROR: ${e.message}`); failed++; }

if (consoleErrors.length) { console.log('console errors:'); consoleErrors.forEach(e => console.log(`  ${e}`)); }
else console.log('no console errors');
await browser.close();
process.exit(failed ? 1 : 0);
