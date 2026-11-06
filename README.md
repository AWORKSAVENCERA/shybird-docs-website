# Shybird Documentation Website

Source for [docs.shybird.ai](https://docs.shybird.ai), the public documentation site for the **Shybird** suite of products from [Avencera](https://avencera.ai).

Shybird helps awarding organisations to **define** qualifications, **design** support materials and **deliver** those materials to educators and participants. This site covers:

- **Product guides** for Shybird Define, Design and Deliver, and the client Admin Centre.
- **Trust centre**: the policies and practices behind security, data protection, privacy, accessibility, responsible AI, governance, business continuity and service status. Customers and prospective buyers read these pages during procurement and due diligence.
- **Release notes**.

The site is a static [Jekyll](https://jekyllrb.com/) site that uses the [Just the Docs](https://just-the-docs.com/) theme. It is hosted on GitHub Pages.

## Repository structure

```
.
├── _config.yml            # Site settings, theme, logo, favicon, colour scheme
├── Gemfile / Gemfile.lock # Ruby dependencies (just-the-docs, jekyll-feed, …)
├── _pages/                # All site content (Markdown)
│   ├── index.md           # Home page (/)
│   ├── release-notes.md   # /release-notes
│   ├── 404.html
│   ├── client-admin/      # /admin       – Admin Centre
│   ├── define/            # /define      – Shybird Define
│   ├── design/            # /design      – Shybird Design
│   ├── deliver/           # /deliver     – Shybird Deliver
│   └── trust/             # /trust       – Trust centre pages
├── _layouts/
│   ├── default2.html      # Layout used by every page: Just the Docs default + page title as <h1>
│   ├── table_wrappers.html # Theme override: keyboard-focusable scrollable tables (WCAG)
│   └── x*.html            # Older Bootstrap-based layouts, not currently used
├── _includes/
│   ├── footer_custom.html # Footer injected by Just the Docs
│   └── nav.html, footer.html, xhead.html, logo.html  # Used only by the old x* layouts
├── _sass/color_schemes/avencera.scss  # Custom colour scheme (based on the dark scheme)
├── assets/                # Images (logos, favicon) and CSS overrides
├── sitemap.xml            # Liquid-generated sitemap
├── llms.txt               # Liquid-generated index of pages for LLM crawlers
├── version.txt            # Site version number
├── scripts/a11y/          # WCAG 2.2 AA checker (Node + Playwright + axe-core); excluded from the site
├── .githooks/commit-msg   # Enforces the commit message format
├── .claude/               # Claude Code config: skills (run-shybird-docs, accessibility, jekyll, git) and hooks
├── .devcontainer/         # VS Code / Codespaces dev container (Jekyll image + Claude Code)
└── .github/
    ├── workflows/         # CI/CD (see "Deployment" and "Accessibility")
    └── dependabot.yml     # Weekly updates for the dev container
```

### Adding or editing a page

Every page lives under `_pages/` and starts with front matter like this:

```yaml
---
title: Security          # Shown as the page heading and in the navigation
layout: default2         # Optional: _config.yml already makes default2 the default for _pages
parent: Trust            # Optional: the title of the parent page, which nests this page in the sidebar
nav_order: 3             # Optional: position in the sidebar (top-level pages)
nav_exclude: true        # Optional: hide the page from the sidebar
permalink: /trust/security  # Public URL. Must be unique.
---
```

- Don't add an `# H1` heading in the body. `default2` renders `title` as the H1, so start the content at `##`.
- To add a page to a section, create a file in that section's folder and set `parent:` to the section's `title`, for example `Trust`, `Define` or `Client administration`.
- To add a new top-level section, create a folder with an `index.md` that has a `title`, `nav_order` and `permalink`.
- See the [Just the Docs navigation docs](https://just-the-docs.com/docs/navigation/) for more options.

## Development setup

### Option 1: Dev container (recommended)

The repo includes a dev container based on `mcr.microsoft.com/devcontainers/jekyll`, which comes with Ruby, Bundler and Jekyll.

1. Install Docker and VS Code with the **Dev Containers** extension, or open the repo in GitHub Codespaces.
2. Open the repo and choose **Reopen in Container**. On first creation the container runs `postCreateCommand`, which:
   - enables the git hooks,
   - installs gems,
   - installs the accessibility checker and headless Chromium.
3. In the container terminal, run:

   ```bash
   bundle exec jekyll serve --livereload
   ```

4. Open <http://localhost:4000>. VS Code forwards the port automatically.

### Option 2: Local Ruby

Prerequisites: Ruby 3.2+ (CI uses 3.2), Bundler, and Node 18+ for the accessibility checker.

```bash
git config core.hooksPath .githooks        # enable the commit-msg hook (once per clone)
bundle install
(cd scripts/a11y && npm ci && npx playwright install --with-deps chromium)
bundle exec jekyll serve --livereload
```

### Useful commands

| Command | Purpose |
| --- | --- |
| `bundle exec jekyll serve --livereload` | Run a local server that rebuilds and reloads when files change |
| `bundle exec jekyll build` | Build the static site into `_site/` |
| `node scripts/a11y/check.mjs` | Build the site and check every page against WCAG 2.2 AA |
| `bundle update` | Update gems and refresh `Gemfile.lock` |

Changes to `_config.yml` only take effect after you restart `jekyll serve`.

## Accessibility

The site must meet **WCAG 2.2 Level AA**, which is the commitment made on the site's own accessibility page. `scripts/a11y/check.mjs` builds the site and runs [axe-core](https://github.com/dequelabs/axe-core) against every page at two widths: 1280px, and 320px for the Reflow criterion. It covers the WCAG 2.0, 2.1 and 2.2 level A and AA rules.

- **Locally:** run `node scripts/a11y/check.mjs`. It exits with a non-zero code on any violation and prints the rule, WCAG criterion, page and an example element.
- **In CI:** `.github/workflows/accessibility.yml` runs the same check on pull requests into `staging` and `main`. Both deploy workflows call it first, so **nothing deploys if the check fails**. The JSON report is uploaded as a workflow artifact.
- Automated tools find only some WCAG failures. Manual checks such as keyboard use, focus visibility and content quality are listed in `.claude/skills/accessibility/SKILL.md`.

## Commits

Every commit message must follow this format, which `.githooks/commit-msg` enforces:

```
type(optional-scope): imperative summary (<= 72 chars, no full stop)
```

The types are `content`, `fix`, `a11y`, `style`, `feat`, `docs`, `build`, `ci`, `chore`, `refactor` and `revert`. For example: `content(trust): add data retention schedule`. Full conventions are in `.claude/skills/git/SKILL.md`.

## Working with Claude Code

`.claude/` holds project skills and hooks so that Claude follows the same rules as everyone else:

- **Skills:**
  - `run-shybird-docs`: serve the site, take screenshots, search, check links and keyboard focus.
  - `accessibility`: WCAG 2.2 AA guidance and the checker.
  - `jekyll`: site conventions.
  - `git`: branching and commit conventions.
- **Hooks** (`.claude/settings.json`): Claude Code records each file Claude edits. Before Claude finishes a task, a Stop hook checks that:
  1. a full WCAG check has passed since the last front-end change, and
  2. every file Claude changed is committed.

  If either check fails, the hook sends Claude back to fix it, up to three times, and then warns you. Claude commits only the files it changed and never pushes.

## Deployment

Deployment uses GitHub Actions with a two-branch flow:

| Branch | Workflow | Result |
| --- | --- | --- |
| `staging` | `deploy-staging.yml` | Runs the WCAG check. If it passes, builds the site and publishes it to the `staging/` folder of the `gh-pages` branch |
| `main` | `deploy-production.yml` | Runs the WCAG check. If it passes, builds the site and publishes it to the root of the `gh-pages` branch (orphan commit) |
| `gh-pages` | `jekyll-site-build.yml` | Deploys the `gh-pages` branch to GitHub Pages (can also be run manually) |

Typical workflow:

1. Make changes on `staging`, or on a feature branch that you merge into `staging`.
2. Push, then review the staging build.
3. Open a pull request from `staging` to `main`. Merging it publishes to production.

Update `version.txt` when you release.

## Known issues / housekeeping

These came up while reviewing the repo and are worth tidying:

- **Duplicate permalink.** `_pages/trust/privacy.md` and `_pages/trust/data-protection.md` both use `permalink: /trust/privacy`, so one of them overwrites the other when the site builds. Give one of them a different URL, such as `/trust/data-protection`.
- **Placeholder description.** `description` in `_config.yml` still contains the Jekyll boilerplate text, which shows up in search-engine metadata.
- **Unused legacy templates.** The `x*` layouts and `_includes/nav.html`, `footer.html` and `xhead.html` are no longer used. `nav.html` also links to `/security`, `/privacy` and `/status`, which don't exist. Consider deleting these files.
- **Incomplete content.** The Design section's `index.md` has no `nav_order`, so its position in the sidebar isn't fixed. Several section and getting-started pages are still empty stubs.
- **Double build.** `jekyll-site-build.yml` runs Jekyll again on the `gh-pages` branch, which already holds built HTML. To serve that output exactly as it is, consider adding a `.nojekyll` file or setting GitHub Pages to **Deploy from a branch → `gh-pages`**.