---
name: seo
description: Search engine optimisation (SEO) and generative engine optimisation (GEO) for the Shybird docs site - page titles, meta descriptions, canonical URLs, Open Graph, structured data (JSON-LD), sitemap.xml, robots.txt, llms.txt and writing content that AI assistants can find, quote and cite. Use when adding or editing pages or front matter, changing _config.yml, the head or crawler files, or when asked to audit or improve SEO, GEO, AI or LLM visibility, search rankings or link previews.
---

# SEO and GEO

**SEO** gets pages found and ranked in classic search results. **GEO** (generative engine optimisation) gets pages retrieved, quoted and cited correctly by AI assistants such as ChatGPT, Claude, Perplexity, Gemini and Google AI Overviews. Both rely on the same foundations: crawlable pages, accurate metadata and clear, specific, self-contained content.

The site's audience is awarding organisations doing procurement, due diligence and onboarding. The Trust pages are the ones they search for and the ones they ask assistants about, so they matter most.

All paths are relative to the repo root. For front matter and config conventions, see the `jekyll` skill. To build and view the site, use the `run-shybird-docs` skill.

## Run the audit

```bash
node .claude/skills/seo/audit.mjs               # production build into a temp dir, then audit
node .claude/skills/seo/audit.mjs --site _site  # audit an existing build (must be built with JEKYLL_ENV=production)
```

The audit checks permalinks, front-matter descriptions, `<title>`, meta descriptions, canonical URLs, `<h1>` count, `lang`, `og:image`, JSON-LD, image `alt`, `robots.txt`, `sitemap.xml` and `llms.txt`. It exits 1 on errors. Treat warnings as a to-do list. A local `jekyll serve` build uses `http://localhost:4000` URLs, so audit a production build.

## How metadata is produced here

- Just the Docs calls **jekyll-seo-tag** (v2.9) in every page's `<head>`. That plugin writes `<title>`, the meta description, the canonical link, Open Graph and Twitter tags, and JSON-LD from `_config.yml` and page front matter. Don't hand-write these tags. Set the inputs instead.
- `_includes/head_custom.html` is the theme hook for anything extra in `<head>`. It already adds `noindex` when `site.noindex` is set.
- `sitemap.xml` and `llms.txt` at the repo root are hand-written Liquid templates. `robots.txt` doesn't exist yet.
- The staging build (`_config.staging.yml`) sets `baseurl: /staging` and `noindex: true`. Keep staging `noindex`. Don't block `/staging/` in `robots.txt`, because crawlers have to fetch a page to see its `noindex`.

### Inputs jekyll-seo-tag reads

| Key | Where | Effect |
| --- | --- | --- |
| `title` | `_config.yml` | Site name, used in `<title>` as "Page \| Site" and in `og:site_name` |
| `description` | `_config.yml`, then each page's front matter | Meta description and `og:description`. Pages without one fall back to the site description |
| `url` | `_config.yml` | Base for canonical and `og:url`. It must stay `https://docs.shybird.ai` |
| `lang` | `_config.yml` | `<html lang>` (Just the Docs defaults to `en-US`). The content is British English, so set `en-GB` |
| `locale` | `_config.yml` | `og:locale`. Use `en_GB` |
| `logo` | `_config.yml` | Organization logo in JSON-LD |
| `image` | front matter, or `defaults:` in `_config.yml` | `og:image` and `twitter:image`: a 1200×630 PNG or JPG at an absolute path |
| `social.name`, `social.links` | `_config.yml` | Organization name and `sameAs` profiles (LinkedIn, Companies House and so on) in JSON-LD |
| `last_modified_at` | front matter | `dateModified` in JSON-LD |
| `seo.type` | front matter | Overrides the JSON-LD `@type`, for example `TechArticle` |
| `sitemap: false` | front matter | Your own convention. The sitemap template must check it (see below) |

## Rules for every page

1. **Unique permalink.** Two files with the same permalink silently overwrite each other, and one page vanishes from the site. The audit reports this as an error.
2. **`description:` in front matter.** 50-160 characters, specific to the page, written for a person choosing which result to click. Lead with what the page answers, using the words a buyer would search for (for example "UK GDPR", "data retention", "WCAG 2.2 AA", "ISO 27001", "awarding organisation"). Every page needs its own description.
3. **Descriptive `title`.** The `<title>` is "title \| Shybird Documentation". Keep the full string to 60 characters or fewer where possible. Name the product: "Getting started with Shybird Define", not "Getting started".
4. **One `<h1>`.** `default2` renders the title as the `<h1>`, so don't start the body with `# Heading`. Use `##` and `###` in order.
5. **Descriptive link text and image `alt`.** These are also accessibility requirements (see the `accessibility` skill).
6. **Absolute internal links** (`/trust/security`) to the canonical URL, with no `.html` and no trailing-slash variants.
7. **Don't publish thin pages.** A stub of 10-20 words (several "Getting started" pages right now) ranks badly and gives assistants nothing to quote. Either fill it in or give it `nav_exclude: true` and `sitemap: false` until it's ready.

## Writing for GEO (AI assistants)

Assistants split pages into passages, retrieve the passages that match a question, and quote or paraphrase them, often with a link. A passage gets used when it answers a question on its own.

- **Answer first.** Open each page, and each `##` section, with one or two sentences that directly answer the question the section covers. Put the detail after that.
- **Self-contained sections.** Each section should make sense when quoted alone. Name the subject ("Shybird stores customer data in the UK") rather than writing "It is stored in...". Avoid "as mentioned above".
- **Headings phrased like questions or tasks.** Use the questions people ask: "Where is my data stored?" or "How do I add a user?". Don't use labels such as "Location".
- **Be specific and checkable.** Use concrete facts: named standards and versions, regions, retention periods, response times, subprocessors and dates. Vague claims ("industry-leading security") are not cited. Specific ones are.
- **Consistent entity names.** Always "Shybird" for the product and "Avencera Ltd" for the company, and the same product names everywhere (Shybird Define, Design and Deliver, the Admin Centre). Say once on the home page and on the Trust pages who operates the service and how the companies relate.
- **Freshness.** On policy and Trust pages, show a visible "Last reviewed: 6 November 2026" line and set `last_modified_at` to match. Assistants and buyers both prefer dated content.
- **Tables and lists for facts.** Comparison data, subprocessors and retention periods are extracted more reliably from tables than from prose.
- **Don't hide text in images or PDFs.** If a PDF is the canonical document, also publish the key content as HTML.

## Crawler files

### robots.txt (production only)

Create `robots.txt` at the repo root with `layout: null` front matter, and serve it only from the production root (`https://docs.shybird.ai/robots.txt`). Allow everything and point to the sitemap. AI crawlers are allowed by default. Blocking them (`GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`) removes the docs from those assistants, so for a public docs site leave them allowed unless the site owner decides otherwise.

```
User-agent: *
Allow: /

Sitemap: https://docs.shybird.ai/sitemap.xml
```

### sitemap.xml

- List only indexable HTML pages. Skip `/404.html`, `llms.txt`, `*.xml` and any page with `sitemap: false` or `nav_exclude` used for drafts.
- Use `{{ site.url }}{{ site.baseurl }}{{ page.url }}`, so that staging's sitemap uses `/staging/` URLs.
- Add `<lastmod>` from `page.last_modified_at` when it's set. Drop `<priority>` and `<changefreq>`, which Google ignores.
- Alternatively, replace the template with the `jekyll-sitemap` plugin (add it to the Gemfile and `plugins:`, then delete `sitemap.xml`). It honours `sitemap: false` and handles `lastmod`.

### llms.txt

The [llms.txt convention](https://llmstxt.org/) is a Markdown index for LLMs. The required shape is:

```markdown
# Shybird Documentation

> One-paragraph summary: what Shybird is, who it is for, who operates it.

## Trust
- [Security](https://docs.shybird.ai/trust/security): How Shybird protects customer data...

## Products
- [Getting started with Shybird Define](https://docs.shybird.ai/define/getting-started): ...
```

- Use absolute URLs (`{{ site.url }}{{ site.baseurl }}{{ page.url }}`), and give each link a `: description` taken from `page.description`.
- Group links by section (`page.parent`), not in one flat list. Leave out the 404 page, `llms.txt` itself and drafts.
- Optionally add `llms-full.txt`, which holds the full Markdown of every page in one file, for assistants that ingest whole sites.

## Structured data

jekyll-seo-tag emits `WebSite` on the home page and `WebPage` elsewhere, with a nameless `Organization` publisher. To improve it:

- Set `social.name: Avencera Ltd` and `social.links` so that the Organization has a name and `sameAs` profiles.
- Use `seo.type: TechArticle` on how-to pages if you want a more specific type.
- If you add more JSON-LD (for example `BreadcrumbList` from `page.parent`, or `FAQPage` for a question-and-answer page), put it in `_includes/head_custom.html` behind a front-matter flag, and check it with https://validator.schema.org/.

## Before you finish

1. Run `node .claude/skills/seo/audit.mjs` and fix all errors.
2. If you changed anything that ends up in the built site, also run the accessibility check, because the Stop hook requires it.
3. Commit using the `git` skill's format, for example `fix(seo): add page descriptions to Trust pages`.

After deployment, check the live site with Google Search Console (submit `https://docs.shybird.ai/sitemap.xml`), Bing Webmaster Tools (whose index also feeds ChatGPT search), and by asking a few assistants buyer-style questions ("Does Shybird use customer data to train AI?") to see what they cite.
