---
name: git
description: Git conventions for the Shybird docs repo - branches, what to commit, commit message format enforced by the commit-msg hook, and deployment implications of pushing. Use when committing, writing a commit message, branching, merging, opening a PR, or when the Stop hook says changes are uncommitted.
---

# Git in this repo

## Branches and deployment

| Branch | Pushing it... |
|---|---|
| `staging` | Deploys to the **staging** site (`gh-pages` → `/staging`) once the WCAG check passes |
| `main` | Deploys to **production** (docs.shybird.ai) once the WCAG check passes |
| `gh-pages` | Build output only. Never commit to it by hand. |

- **Never push or open a PR unless the user explicitly asks.** Any push to `staging` or `main` publishes the site.
- Work on `staging`, or on a short-lived branch merged into it. Content reaches `main` through a PR from `staging`.

## Commit every logical change

The Stop hook (`.claude/hooks/stop-gate.mjs`) won't let you finish while files you edited this session are uncommitted. It also requires a passing WCAG check first if any of those files are front-end. The order is:

1. Make the change.
2. Run `node scripts/a11y/check.mjs` if you touched anything that ends up in the built site.
3. Commit it.

Rules:
- **Stage files by name** (`git add _pages/trust/security.md`), never with `git add -A` or `git add .`. The working tree often holds the user's own uncommitted work. Don't commit it unless they ask.
- Make one commit per logical change. If you fix a typo and also restructure the nav, that's two commits.
- Never commit `.DS_Store`, `_site/`, `.jekyll-cache/`, `node_modules/` or `.claude/state/`. All of them are gitignored, so don't force-add them.
- Never rewrite published history (`push --force`, rebasing pushed commits) without being asked.

## Commit message format

`.githooks/commit-msg` enforces this format. Enable it with `git config core.hooksPath .githooks`; the dev container does this automatically.

```
type(optional-scope): imperative summary, max 72 chars, no full stop

Optional body after ONE blank line: why the change was made, anything a
reviewer needs. Wrap at ~72 chars.

Co-Authored-By: ...        (attribution trailer, when applicable)
```

| type | use for |
|---|---|
| `content` | Adding or changing documentation pages in `_pages/` |
| `fix` | Fixing something broken, such as a link, permalink clash, build error or typo |
| `a11y` | Accessibility fixes or improvements |
| `style` | Visual changes: colours, CSS, layout tweaks |
| `feat` | New site capability, such as a new section, search or layout feature |
| `docs` | Docs about the repo itself: README, skills, comments |
| `build` / `ci` | Gems, tooling, `_config.yml` build settings / GitHub Actions |
| `chore` / `refactor` / `revert` | Housekeeping / restructuring with no output change / undoing a commit |

Scope is the section or area, in lowercase: `trust`, `define`, `nav`, `a11y`, `claude`. For example:

- `content(trust): add data retention schedule`
- `fix(trust): give data protection page its own permalink`
- `a11y: make scrollable tables keyboard focusable`
- `ci: block deploys on WCAG 2.2 AA failures`

The hook rejects messages that are untyped, too long, end with a full stop, or have no blank line after the subject. Git's own `Merge …`, `Revert "…"` and `fixup!` messages pass through. If the hook rejects a message, fix the message. Don't use `--no-verify`.

To commit a multi-line message from a shell, use a heredoc:

```bash
git commit -F - <<'EOF'
content(trust): add data retention schedule

Retention periods agreed with the DPO on 2026-11-01.
EOF
```
