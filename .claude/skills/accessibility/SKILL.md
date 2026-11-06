---
name: accessibility
description: Make and verify Shybird docs changes meet WCAG 2.2 Level AA. Use when writing or editing pages, layouts, includes, styles, images, tables or links; when asked to check, test or audit accessibility, a11y or WCAG; or when the Stop hook or CI reports an accessibility failure.
---

# Accessibility: WCAG 2.2 Level AA

The site's published commitment (`_pages/trust/accessibility.md`) is WCAG 2.2 AA. Every front-end change must pass the automated check, and you must also do the manual checks for anything the tooling can't see.

All paths are relative to the repo root.

## Run the check

```bash
node scripts/a11y/check.mjs                         # builds the site, checks every page at 1280px and 320px
node scripts/a11y/check.mjs --only /trust/security  # one page (quicker; doesn't satisfy the Stop hook)
```

- The checker runs axe-core 4.10 with the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`. Checking at 320px covers WCAG 1.4.10 Reflow.
- It exits 0 on pass and 1 on any violation, and prints the rule, WCAG criterion, affected pages and an example selector.
- The full JSON report is saved next to the temporary build. The script prints its path.
- Only a full run (without `--only`) is recorded in `.claude/state/a11y-last.json`, which is the record the Stop hook reads.
- A full run takes about 30 seconds.
- First-time setup, if `node_modules` is missing: `cd scripts/a11y && npm ci && npx playwright install --with-deps chromium`.

CI runs the same script in `.github/workflows/accessibility.yml`. Both deploy workflows depend on it, so a failing check blocks deployment to staging or production.

## Writing content (Markdown in `_pages/`)

- **Headings (1.3.1, 2.4.6).** `default2` renders the page `title` as the only `<h1>`. Start the body at `##` and don't skip levels (`##` → `####` is wrong). Headings must describe the section that follows.
- **Link text (2.4.4).** The text must make sense on its own. Write `[Read the security overview](/trust/security)`, not `[click here](...)` or a bare URL. Don't use two links with the same text that go to different places.
- **Images (1.1.1).** `![Avencera logo](/assets/images/x.png)`. Alt text should give the image's purpose, not "image of". For purely decorative images, use `![](...)` with empty alt text. Don't put text inside images.
- **Tables (1.3.1).** Use tables only for data, always with a header row. Wide tables scroll sideways on mobile. `_layouts/table_wrappers.html` makes each scroll container focusable and labels it, so don't remove that override.
- **Lists.** Use real Markdown lists, not lines that start with `-` inside a paragraph or `<br>`.
- **Language and abbreviations (3.1).** Spell out an abbreviation the first time you use it, for example "business continuity and disaster recovery (BCDR)".
- **Colour (1.4.1).** Never rely on colour alone to carry meaning, such as "items in yellow are mandatory".
- **Plain language.** The readers are procurement and compliance staff. Use short sentences and active voice.

## Changing layouts, includes, CSS or the colour scheme

- **Contrast (1.4.3, 1.4.11).** Text needs a contrast ratio of at least 4.5:1 (3:1 for large text), and UI component boundaries and focus indicators need at least 3:1. The custom scheme in `_sass/color_schemes/avencera.scss` uses yellow links on a dark background, so re-run the check after any colour change.
- **Focus visible and not obscured (2.4.7, 2.4.11 – new in 2.2).** Never set `outline: none` without a visible replacement. Sticky headers or footers must not cover the focused element.
- **Target size (2.5.8 – new in 2.2).** Interactive targets need to be at least 24×24 CSS px, or have enough spacing around them. axe checks this with the `target-size` rule.
- **Consistent help (3.2.6 – new in 2.2).** Contact and help links, such as the footer's Avencera link, must stay in the same place on every page.
- **Keyboard (2.1.1, 2.4.3).** Every control must be reachable and usable with Tab, Enter and Escape, in a logical order. Anything that scrolls must be focusable.
- **Name, role, value (4.1.2).** Use native elements (`<button>`, `<a href>`). Add ARIA only when no native element exists, and give every region or landmark you add an accessible name.
- **Dragging (2.5.7) and redundant entry (3.3.7).** These are new in 2.2. They aren't relevant to this static site unless you add forms or widgets, in which case read the criteria first.

## Manual checks axe can't do

Automated tools catch roughly a third of WCAG failures. For layout, include or CSS changes, also do the following with the run skill's driver (see `run-shybird-docs`):

1. Take keyboard screenshots. Load the page, press Tab a few times and screenshot. The focus ring should be visible and not hidden behind the header.
2. Run `WIDTH=320 FULL=0 node .claude/skills/run-shybird-docs/driver.mjs shot <path>`. Nothing should be cut off, and there should be no sideways page scroll other than tables and code blocks.
3. Read the page as text. Headings should form a sensible outline and every link should make sense out of context.

## When a violation can't be fixed

Don't commit around it and don't disable axe rules. Tell the user which page, rule and criterion are affected and why it can't be fixed. If the cause is the theme, override the theme file locally, as `_layouts/table_wrappers.html` does.
