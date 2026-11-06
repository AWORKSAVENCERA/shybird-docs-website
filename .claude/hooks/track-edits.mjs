#!/usr/bin/env node
// PostToolUse hook (Edit|Write|NotebookEdit): remember which repo files Claude changed
// in this session, so the Stop hook can insist they are a11y-checked and committed.
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, isAbsolute } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const file = input.tool_input?.file_path || input.tool_input?.notebook_path || input.tool_response?.filePath;
if (!file || !input.session_id) process.exit(0);

const rel = relative(root, isAbsolute(file) ? file : resolve(root, file));
if (!rel || rel.startsWith('..') || isAbsolute(rel)) process.exit(0); // outside the repo (scratchpad, memory, ...)

const dir = join(root, '.claude/state');
mkdirSync(dir, { recursive: true });
appendFileSync(join(dir, `edits-${input.session_id}.txt`), rel + '\n');
