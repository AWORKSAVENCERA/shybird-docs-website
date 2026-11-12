# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Source for https://docs.shybird.ai: Avencera's public docs for the Shybird product suite (Define, Design, Deliver, Admin Centre) plus a **trust centre** that buyers read during procurement. It is a static Jekyll 4 site using the **Just the Docs 0.12** theme (installed as a gem), hosted on GitHub Pages.

## Skills hold the detailed rules. Load the right one first

| Task | Skill |
|---|---|
| Adding, moving or editing pages, front matter, nav, layouts, `_config.yml`, Liquid | `jekyll` |
| Building, serving, screenshotting, site search, broken-link crawl | `run-shybird-docs` |
| Anything that changes rendered output; WCAG questions or failures | `accessibility` |
| Titles, descriptions, `sitemap.xml`, `robots.txt`, `llms.txt`, JSON-LD | `seo` |
| Committing, branching, PRs | `git` |

## Commands

```bash
bundle exec jekyll build -d /tmp/shybird-site       # check the build (about 1s; ~90 theme Sass deprecation warnings are normal)
bundle exec jekyll serve --livereload               # http://localhost:4000. Restart after editing _config.yml
bundle exec jekyll build --config _config.yml,_config.staging.yml   # staging build (baseurl /staging, noindex)

node scripts/a11y/check.mjs                         # build + WCAG 2.2 AA check of every page at 1280px and 320px
node scripts/a11y/check.mjs --only /trust/security  # check one page (still builds the whole site)
node .claude/skills/seo/audit.mjs                   # SEO/GEO audit
node .claude/skills/run-shybird-docs/driver.mjs smoke   # needs a running server; screenshots, search, link crawl
```

There is no unit test suite. The WCAG check plus a clean build are the tests.

## Architecture

- **Content** lives only in `_pages/<section>/*.md`. `_config.yml` `include: [_pages]` pulls it in, and `defaults:` gives every page `layout: default2`. Each page sets its own `permalink`. The sidebar comes from `title` / `parent` (the parent page's exact `title`) / `nav_order`.
- **`_layouts/default2.html`** wraps the theme's `default` layout and renders `page.title` as the only `<h1>`. Page bodies start at `##`.
- **Theme overrides** use the theme's own file paths. A same-named file here replaces the gem's copy (for example `_layouts/table_wrappers.html` makes scrollable tables keyboard-focusable, which WCAG needs). The theme's hooks are `_includes/head_custom.html` and `_includes/footer_custom.html`.
- **Styling:** the brand palette is in `_sass/custom/setup.scss`, the colour scheme is `_sass/color_schemes/avencera.scss` (built on the theme's dark scheme), and site-wide CSS is in `_sass/custom/custom.scss`.
- **Glossary:** `_data/glossary.yml` is the single source. `_pages/glossary.md` renders it as a page. On every other page, `head_custom.html` → `_includes/glossary.html` filters the terms by each term's `scope` URL prefixes and inlines them as JSON for `assets/js/glossary.js`, which turns the first use of each term into a definition popup. `glossary: false` in front matter opts a page out.
- **Crawler files** (`sitemap.xml`, `llms.txt`, `robots.txt`) are hand-written Liquid templates at the repo root. They list every page except those with `sitemap: false`.

## Staging vs production (why links must use the `link` tag)

One workflow (`.github/workflows/deploy-pages.yml`) builds **both** branches on any push to either branch: `main` → `/`, and `staging` → `/staging/`. Staging uses `baseurl: /staging` and `noindex`. The combined site must pass the WCAG check or **nothing deploys**, so a staging failure also blocks production.

Because of the `/staging` baseurl:
- Link between pages with `[Text]({% link _pages/trust/security.md %})` (anchors go after `%}`). This also fails the build if the target is missing. **Never** use root-relative links like `(/trust/security)`, because on staging they go to production pages.
- In Liquid, build URLs with `{{ path | relative_url }}`.

## Planning and backlog (StoriesOnBoard)

The backlog for this site is the **Shybird Docs** story map in StoriesOnBoard (slug `shybird-docs`, https://avencera.storiesonboard.com/storymap/shybird-docs). Use the StoriesOnBoard tools for any planning:

- **Before planning** work (a plan, a roadmap, "what's next", scoping a change), read the map with `GetStoryMapCards` and base the plan on its existing cards, statuses and releases.
- **Record work for later as a story on the map**, not as a file in the repo, a code comment or a note in chat. That includes follow-ups, known issues and technical debt.
- Add a story as a subtask under the activity and task it belongs to. Title technical debt `Tech debt: <what to fix>`, set status `Todo` and leave it unscheduled unless the user names a release. The description says what the problem is, why it matters, a suggested fix and when it is done, and names the files and commit involved.
- When work finishes a story, tell the user which card it was. Change a card's status only when the user asks.
- If the StoriesOnBoard tools aren't available, say so and ask the user how to proceed. Don't fall back to recording it in the repo.

## Hooks and workflow rules

- `.claude/hooks/track-edits.mjs` records each repo file you edit. `.claude/hooks/stop-gate.mjs` blocks you from finishing until (1) a **full** `node scripts/a11y/check.mjs` has passed since your last edit to a file that ends up in the built site, and (2) every file you edited is committed.
- Commit messages must be `type(scope): summary` (≤72 chars, no full stop), which `.githooks/commit-msg` enforces. Stage files by name. **Never push**: pushing `staging` or `main` publishes the site.
- Work happens on `staging`. Production changes reach `main` through a PR from `staging`.
- A new top-level file or tooling folder that shouldn't be published must be added to `exclude:` in `_config.yml`. Jekyll copies everything else into the site, and the a11y checker crawls it.
