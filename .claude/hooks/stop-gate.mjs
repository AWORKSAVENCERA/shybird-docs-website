#!/usr/bin/env node
// Stop hook: before Claude finishes, the files it changed this session must
//   1. pass the WCAG 2.2 AA check (only when front-end files changed), and
//   2. be committed to git.
// Blocks with instructions otherwise. Gives up after MAX_BLOCKS consecutive blocks so a
// genuinely stuck state (e.g. a user-denied commit) can't trap the session; it then warns the user.
import { existsSync, readFileSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const MAX_BLOCKS = 3;
const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const state = join(root, '.claude/state');
const sid = input.session_id || 'unknown';
const editsFile = join(state, `edits-${sid}.txt`);
const blocksFile = join(state, `blocks-${sid}.txt`);

const done = () => { rmSync(blocksFile, { force: true }); process.exit(0); };
if (!existsSync(editsFile)) done();

const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' });
const edited = [...new Set(readFileSync(editsFile, 'utf8').split('\n').filter(Boolean))]
  .filter(f => { try { git('check-ignore', '-q', f); return false; } catch { return true; } }); // drop ignored files

// Front-end = anything that ends up in the built site. Tooling, docs and CI are not.
const NOT_SITE = /^(\.claude|\.github|\.githooks|\.devcontainer|scripts)\/|^(README\.md|Gemfile(\.lock)?|\.gitignore)$/;
const SITE = /^(_pages|_layouts|_includes|_sass|assets)\/|^_config\.yml$|\.(html|md|markdown|scss|css|js|xml|txt)$/;
const frontEnd = edited.filter(f => SITE.test(f) && !NOT_SITE.test(f));

const problems = [];

if (frontEnd.length) {
  const latest = Math.max(...frontEnd.map(f => { try { return statSync(join(root, f)).mtimeMs; } catch { return Date.now(); } }));
  let last = null;
  try { last = JSON.parse(readFileSync(join(state, 'a11y-last.json'), 'utf8')); } catch {}
  if (!last || !last.full || last.time < latest) {
    problems.push(`Front-end files changed since the last full WCAG 2.2 AA check (${frontEnd.slice(0, 5).join(', ')}${frontEnd.length > 5 ? ', ...' : ''}). ` +
      'Run `node scripts/a11y/check.mjs` from the repo root (see the accessibility skill).');
  } else if (!last.pass) {
    problems.push(`The last WCAG 2.2 AA check found ${last.violations} violation(s). Fix them and re-run \`node scripts/a11y/check.mjs\`. ` +
      'If a violation cannot be fixed, stop and explain it to the user rather than committing around it.');
  }
}

const dirty = edited.length ? git('status', '--porcelain', '--', ...edited).trim() : '';
if (dirty) {
  problems.push(`These files you changed are not committed:\n${dirty}\n` +
    'Commit them (only these files - do not sweep in the user\'s other uncommitted work) with a message that follows the git skill ' +
    '(`type(scope): summary`, <=72 chars, imperative). Do not push.');
}

if (!problems.length) done();

const n = (existsSync(blocksFile) ? Number(readFileSync(blocksFile, 'utf8')) : 0) + 1;
if (n > MAX_BLOCKS) {
  rmSync(blocksFile, { force: true });
  console.log(JSON.stringify({ systemMessage: `Stop gate gave up after ${MAX_BLOCKS} attempts. Outstanding:\n- ${problems.join('\n- ')}` }));
  process.exit(0);
}
writeFileSync(blocksFile, String(n));
console.log(JSON.stringify({ decision: 'block', reason: `Before finishing (stop gate ${n}/${MAX_BLOCKS}):\n- ${problems.join('\n- ')}` }));
