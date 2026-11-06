---
title: Glossary
nav_order: 8
permalink: /glossary
glossary: false
description: Definitions of the terms used in the Shybird documentation, such as course, module, learning path and Learning Assistant, and where each one applies.
---

This page lists the terms used across this site and what they mean. Elsewhere on the site, the first time a term appears on a page it has a dotted underline. Select it to read its definition, and press Escape to close it.

Some words mean different things in different parts of Shybird. Where a definition only applies to one part of the site, it says which.

{% comment %}
  Generated from _data/glossary.yml. Edit terms there, not here.
  `glossary: false` above stops this page highlighting its own terms.
{% endcomment %}
{%- assign glossary_sorted = site.data.glossary | sort_natural: "term" -%}
{%- assign glossary_letters = glossary_sorted | group_by_exp: "entry", "entry.term | slice: 0 | upcase" -%}
{% for letter in glossary_letters %}
## {{ letter.name }}

{% for entry in letter.items -%}
{% if forloop.first %}{: .glossary-list}
{% endif %}{{ entry.term }}
: {{ entry.definition }}{% if entry.scope %} _(Used in {% for prefix in entry.scope %}{% assign section = site.pages | where: "permalink", prefix | first %}{% if section %}[{{ section.title }}]({{ prefix }}){% else %}{{ prefix }}{% endif %}{% unless forloop.last %}, {% endunless %}{% endfor %}.)_{% endif %}

{% endfor -%}
{% endfor %}
