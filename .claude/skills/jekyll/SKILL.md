---
name: jekyll
description: Conventions for editing the Shybird docs Jekyll site (Just the Docs 0.12 theme) - adding or moving pages, front matter, navigation, permalinks, layouts, includes, theme overrides, _config.yml and Liquid. Use when creating, editing, restructuring or debugging pages or site configuration.
---

# Jekyll on this site

The site is a Jekyll 4 site using the **Just the Docs 0.12.0** theme, which is installed as a gem. All content lives in `_pages/`. Paths are relative to the repo root.

To build, serve or screenshot the site, use the `run-shybird-docs` skill. To check accessibility, use the `accessibility` skill.

## Pages

Every page is a Markdown file under `_pages/<section>/` with this front matter:

```yaml
---
title: Security                 # becomes the <h1> and the nav label - don't repeat it as "# ..." in the body
parent: Trust                   # exact `title` of the section index page; nests it in the sidebar
nav_order: 3                    # optional ordering (section index pages use it for top-level order)
permalink: /trust/security      # REQUIRED and must be unique - this is the public URL
---
```

- `layout: default2` is applied automatically by `defaults:` in `_config.yml`, so you can leave it out.
- Section indexes are `_pages/<section>/index.md` with `permalink: /<section>`. The current top-level `nav_order` values are Home 1, Trust 3, Shybird Admin Centre 4, Shybird Define 5, Shybird Design 6, Shybird Deliver 7, Release notes 90 and Glossary 100.
- Before adding a page, check that its permalink isn't already taken: `grep -rn "^permalink:" _pages | sort -k2`. Two files with the same permalink silently overwrite each other.
- Link to other pages with the `link` tag on the source file: `[Security]({% link _pages/trust/security.md %})`, with any `#anchor` after the closing `%}`. Never write root-relative links like `(/trust/security)`. Production has an empty `baseurl` but staging is built with `baseurl: /staging`, so root-relative links on staging go to production pages (and 404 if the page only exists on staging). The `link` tag adds the baseurl and fails the build if the file doesn't exist. For URLs built in Liquid, where there's no fixed source file, use `{{ path | relative_url }}`.
- Keep page bodies in Markdown. Raw HTML in a page bypasses the theme's styles and makes accessibility mistakes easier.

## Layouts, includes and theme overrides

- `_layouts/default2.html` wraps the theme's `default` layout and adds the page title as `<h1>`. Every page uses it.
- `_layouts/table_wrappers.html` overrides the theme file of the same name so that scrollable tables are keyboard-focusable (WCAG). Keep it.
- `_includes/footer_custom.html` is the site footer and a theme hook. The theme also offers `head_custom.html`, `header_custom.html` and `nav_footer_custom.html` as hooks.
- `_layouts/x*.html`, `_includes/nav.html`, `footer.html`, `xhead.html` and `logo.html` are legacy Bootstrap templates that nothing uses. Don't build on them.
- To change other theme behaviour, copy the file from the theme into the same path here and edit the copy. Find the theme with `bundle info just-the-docs --path`.
- Colours are set in `_sass/color_schemes/avencera.scss`, which builds on the theme's `dark` scheme. Extra CSS goes in `assets/css/`.

## `_config.yml`

- `jekyll serve` never reloads `_config.yml`, so restart the server after editing it.
- `exclude:` keeps `scripts/` (the Node a11y tooling and its `node_modules`) and `README.md` out of the built site. If you add more tooling folders, add them here too. Otherwise the a11y checker crawls them and they get published.
- `url: https://docs.shybird.ai` is used by `sitemap.xml` and `llms.txt`, which are Liquid templates at the repo root.

## Gotchas

- The theme compresses HTML output, so the built HTML is `<h1> Title </h1>` with spaces. Keep that in mind when grepping `_site`.
- Theme Sass prints about 90 `darken()` deprecation warnings on every build. They're noise from the theme, not a problem here.
- Section roots (`/trust`) 301-redirect to `/trust/` under `jekyll serve`.
- Some files, such as `_pages/release-notes.md`, have no trailing newline after the closing `---`. If you append with `echo >>`, the front matter gets corrupted.
