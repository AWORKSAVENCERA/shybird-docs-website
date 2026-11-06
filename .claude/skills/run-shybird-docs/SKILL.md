---
name: run-shybird-docs
description: Build, run, serve, preview and screenshot the Shybird docs site (Jekyll + Just the Docs, docs.shybird.ai). Use when asked to start the docs site, build it, check a page renders, take a screenshot of a page, test the site search, or check for broken links after editing content in _pages/.
---

The Shybird docs site is a static Jekyll site. To work with it, start `jekyll serve` in the background, then use the headless Playwright driver at `.claude/skills/run-shybird-docs/driver.mjs` to screenshot pages, run the site search and crawl for broken links.

All paths are relative to the repo root (`/workspaces/shybird-docs-website`).

## Prerequisites

The dev container (`mcr.microsoft.com/devcontainers/jekyll:2-bookworm`) already has Ruby 3.4, Bundler, Jekyll and Node 18. The driver also needs Playwright and Chromium, which is a one-time install of about 170 MB. `--with-deps` installs the apt libraries through passwordless sudo, which works in this container.

```bash
cd .claude/skills/run-shybird-docs && npm i && npx playwright install --with-deps chromium && cd -
```

## Build

```bash
bundle install
bundle exec jekyll build -d /tmp/shybird-site    # check the build without touching _site/
```

The build should finish in under a second. The only expected warning is `Conflict: ... /trust/privacy.html` (see Gotchas). Any other warning is new, so investigate it.

## Run (agent path)

Start the server in the background and wait until it responds on the port:

```bash
bundle exec jekyll serve --port 4000 --host 127.0.0.1 > /tmp/jekyll.log 2>&1 &
timeout 60 bash -c 'until curl -sf http://127.0.0.1:4000/ >/dev/null; do sleep 1; done' && echo UP
```

Then drive it:

```bash
node .claude/skills/run-shybird-docs/driver.mjs smoke                   # 5 key pages + search + link crawl
node .claude/skills/run-shybird-docs/driver.mjs shot /trust/security    # screenshot one or more paths
WIDTH=400 FULL=0 node .claude/skills/run-shybird-docs/driver.mjs shot /trust/security   # mobile, viewport only
node .claude/skills/run-shybird-docs/driver.mjs search "business continuity"
node .claude/skills/run-shybird-docs/driver.mjs links                   # BFS crawl of internal links, lists non-200s
```

| command | what it does |
|---|---|
| `smoke` | Screenshots `/`, `/trust/`, `/trust/security`, `/trust/privacy` and `/release-notes`. Then types "security" into the search box, screenshots the results and clicks the first one. Finally crawls every internal link. |
| `shot <path>...` | Takes a full-page screenshot of each path and prints its HTTP status and `<h1>`. |
| `search <query>` | Types into the Just the Docs search, prints the top 5 results, screenshots them and clicks the first. |
| `links` | Crawls from `/` and prints `BROKEN <status> <path>` for each failing link. Exits 1 if any link fails. |
| `tab <path> [n]` | Presses Tab *n* times (default 5) and prints each focused element, flagging any that are invisible or have no outline. Then screenshots the page. Use it for the accessibility skill's keyboard check. |

For the WCAG 2.2 AA check, use `node scripts/a11y/check.mjs` (see the `accessibility` skill). It builds and serves its own copy of the site, so it doesn't need this server.

- Screenshots are saved to `/tmp/shybird-shots/<path-slug>-<width>.png`. Open them with Read to check they look right.
- Set `BASE_URL` to point the driver at another server, `SHOTS` to change the screenshot folder, `WIDTH` to set the viewport width (default 1280) and `FULL=0` for a viewport-only shot.
- The exit code is non-zero if any page returns a status of 400 or higher, a link is broken, or a step throws an error. Browser console errors are printed but don't fail the run.

`jekyll serve` watches `_pages/`, so edits appear on the next request (about 0.5 s). You don't need to restart it, except after editing `_config.yml`, which `serve` never reloads.

To stop the server:

```bash
lsof -ti:4000 -sTCP:LISTEN | xargs -r kill
```

## Run (human path)

```bash
bundle exec jekyll serve --livereload   # then open http://localhost:4000. Press Ctrl-C to stop.
```

## Test

There's no test suite. Use `driver.mjs smoke` together with a clean `jekyll build` instead.

## Gotchas

- **The search ignores `page.fill()`.** The Just the Docs search listens only for `keyup`, and `fill` sends only `input`, so the results stay empty and the driver times out after 10 seconds. The driver clicks the box and uses `keyboard.type()` instead.
- **Clicking a search result logs `Cannot read properties of null (reading 'id')`.** The error comes from the theme's focusout handler in `just-the-docs.js` (`nextFocusedElement.id`) when focus moves to the result link. It's a theme quirk and harmless. `shot` on its own produces no console errors.
- **`/trust/privacy` belongs to two files.** Both `_pages/trust/privacy.md` and `_pages/trust/data-protection.md` claim that URL. The served page shows `privacy.md` (h1 "Privacy"), but the search index points the "Data protection and privacy" sections there too, so those search hits land on the wrong page. This will stay broken until one permalink changes.
- **Section URLs redirect.** `/trust`, `/admin`, `/define` and the other section roots return 301 to a trailing-slash version, because their `index.md` builds to a directory. Request `/trust/` to get a 200 directly.
- **Append to `_pages/release-notes.md` only after a newline.** The file ends with `---` and no trailing newline, so `echo x >> file` corrupts the front matter and the page never regenerates. Use `printf '\n\n...'`.
- **Full-page shots at 400px come out about 9000px tall** and are unreadable when scaled down. Use `FULL=0` for mobile checks.
- **`llms.txt` and `sitemap.xml` use `site.url`.** Under `jekyll serve` that becomes `http://localhost:4000`. Production uses `https://docs.shybird.ai` from `_config.yml`.

## Troubleshooting

- **`jekyll serve` exits 1 straight away, and `/tmp/jekyll.log` ends in a Bundler stack trace**: an earlier server is still holding port 4000, so the `curl` wait succeeds against the old one. Run `lsof -ti:4000 -sTCP:LISTEN | xargs -r kill`, then start the server again.
- **`locator.waitFor: Timeout 10000ms exceeded ... .search-results .search-result`**: you're driving the search with `fill`. Type the keys instead (see Gotchas).
- **`Defaults: An invalid front-matter default set was found`**: the `defaults:` entry in `_config.yml` has a `scope` but no `values`. It now sets `layout: default2`, so keep a `values` key in that block.
