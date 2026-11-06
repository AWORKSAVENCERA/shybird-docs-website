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
│   └── x*.html            # Older Bootstrap-based layouts, not currently used
├── _includes/
│   ├── footer_custom.html # Footer injected by Just the Docs
│   └── nav.html, footer.html, xhead.html, logo.html  # Used only by the old x* layouts
├── _sass/color_schemes/avencera.scss  # Custom colour scheme (based on the dark scheme)
├── assets/                # Images (logos, favicon) and CSS overrides
├── sitemap.xml            # Liquid-generated sitemap
├── llms.txt               # Liquid-generated index of pages for LLM crawlers
├── version.txt            # Site version number
├── .devcontainer/         # VS Code / Codespaces dev container (Jekyll image + Claude Code)
└── .github/
    ├── workflows/         # CI/CD (see "Deployment")
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
2. Open the repo and choose **Reopen in Container**.
3. In the container terminal, run:

   ```bash
   bundle install
   bundle exec jekyll serve --livereload
   ```

4. Open <http://localhost:4000>. VS Code forwards the port automatically.

### Option 2: Local Ruby

Prerequisites: Ruby 3.2+ (CI uses 3.2) and Bundler.

```bash
bundle install
bundle exec jekyll serve --livereload
```

### Useful commands

| Command | Purpose |
| --- | --- |
| `bundle exec jekyll serve --livereload` | Run a local server that rebuilds and reloads when files change |
| `bundle exec jekyll build` | Build the static site into `_site/` |
| `bundle update` | Update gems and refresh `Gemfile.lock` |

Changes to `_config.yml` only take effect after you restart `jekyll serve`.

## Deployment

Deployment uses GitHub Actions with a two-branch flow:

| Branch | Workflow | Result |
| --- | --- | --- |
| `staging` | `deploy-staging.yml` | Builds the site and publishes it to the `staging/` folder of the `gh-pages` branch |
| `main` | `deploy-production.yml` | Builds the site and publishes it to the root of the `gh-pages` branch (orphan commit) |
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