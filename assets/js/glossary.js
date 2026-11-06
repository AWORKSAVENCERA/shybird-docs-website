/*
 * Glossary terms ("toggletips").
 *
 * Reads the terms for this page from <script id="glossary-data"> (written by
 * _includes/glossary.html from _data/glossary.yml), finds the first use of
 * each one in the main content and wraps it in a <button>. Selecting the
 * button shows the definition in a single shared popup.
 *
 * Terms are not highlighted inside links, buttons, headings or code, or in
 * names of things on screen. By this site's writing convention those are
 * bold (**Start Course**) or in quotes ('Course Overview'). Wrap any other
 * text in an element with data-glossary-skip to leave it alone.
 *
 * Accessibility (WCAG 2.2 AA):
 * - Native <button>, so it is reachable with Tab and works with Enter/Space (2.1.1, 4.1.2).
 * - aria-expanded tells screen reader users whether the definition is showing (4.1.2).
 * - The popup is a role="status" live region that stays in the DOM, so the
 *   definition is announced when it appears (4.1.3).
 * - Escape, selecting the term again, clicking elsewhere or moving focus away
 *   closes it. It stays open until then and the pointer can move over it (1.4.13).
 * - The dotted underline is not the only cue: the cursor and focus ring change too,
 *   and the role is exposed as a button (1.4.1).
 * - The popup is clamped to the viewport so it never needs sideways scrolling (1.4.10).
 * - Without JavaScript the page reads normally; terms are just plain text.
 */
(function () {
  'use strict';

  var dataEl = document.getElementById('glossary-data');
  var root = document.querySelector('#main-content main') || document.querySelector('main');
  if (!dataEl || !root) return;

  var entries;
  try {
    entries = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }
  if (!entries.length) return;

  // Map every matchable form (lower case) to its entry.
  var byForm = {};
  entries.forEach(function (entry) {
    [entry.term].concat(entry.aliases || []).forEach(function (form) {
      byForm[String(form).toLowerCase()] = entry;
    });
  });

  // Longest forms first so "learning path" wins over any shorter overlap.
  var forms = Object.keys(byForm).sort(function (a, b) { return b.length - a.length; });
  var escape = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  var pattern = new RegExp('(^|[^\\w\\u00C0-\\u024F-])(' + forms.map(escape).join('|') + ')(?![\\w\\u00C0-\\u024F-])', 'gi');

  // Don't turn text inside these into buttons: interactive content can't be
  // nested, headings and code should stay as written, and bold text names a
  // button or menu item on screen.
  var SKIP = 'h1,h2,h3,h4,h5,h6,a,button,input,select,textarea,label,summary,code,pre,kbd,samp,script,style,svg,strong,b,[role="button"],[role="link"],[role="menuitem"],[role="tab"],[data-glossary-skip],.glossary-term,.glossary-tip';

  // Quoted text names a page or label on screen ('Course Overview').
  // Markdown turns straight quotes into curly ones, so both are handled.
  var QUOTED = /\u2018[^\u2019]*\u2019|\u201C[^\u201D]*\u201D|"[^"]*"/g;
  function quotedRanges(text) {
    var ranges = [];
    var q;
    QUOTED.lastIndex = 0;
    while ((q = QUOTED.exec(text)) !== null) ranges.push([q.index, q.index + q[0].length]);
    return ranges;
  }
  function inRanges(ranges, start, end) {
    return ranges.some(function (r) { return start >= r[0] && end <= r[1]; });
  }

  // Skip matches that are part of an email address, web address or file name,
  // such as "avencera" and "ai" in no-reply@avencera.ai.
  function inAddress(text, start, end) {
    return /[@./:]$/.test(text.slice(0, start)) || /^[@./:]\w/.test(text.slice(end));
  }

  // Only the first use of each term on the page is highlighted.
  var done = new Set();

  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentElement && node.parentElement.closest(SKIP)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  var textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  var TIP_ID = 'glossary-tip';

  textNodes.forEach(function (node) {
    var text = node.nodeValue;
    pattern.lastIndex = 0;
    if (!pattern.test(text)) return;
    pattern.lastIndex = 0;

    var quotes = quotedRanges(text);
    var frag = null;
    var last = 0;
    var match;
    while ((match = pattern.exec(text)) !== null) {
      var start = match.index + match[1].length;
      var word = match[2];
      var entry = byForm[word.toLowerCase()];
      if (done.has(entry) || inRanges(quotes, start, start + word.length) || inAddress(text, start, start + word.length)) continue;
      done.add(entry);

      frag = frag || document.createDocumentFragment();
      if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start)));

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'glossary-term';
      btn.textContent = word;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', TIP_ID);
      btn.dataset.term = entry.term;
      btn.dataset.definition = entry.definition;
      frag.appendChild(btn);

      last = start + word.length;
    }
    if (!frag) return;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });

  if (!root.querySelector('.glossary-term')) return;

  // One shared live region. It must exist (and be rendered) before its content
  // changes, or screen readers won't announce the definition.
  var tip = document.createElement('div');
  tip.id = TIP_ID;
  tip.className = 'glossary-tip';
  tip.setAttribute('role', 'status');
  document.body.appendChild(tip);

  var current = null;

  function position() {
    if (!current) return;
    var bubble = tip.firstElementChild;
    if (!bubble) return;
    var gap = 8;
    var margin = 16;
    var r = current.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var bw = bubble.offsetWidth;
    var bh = bubble.offsetHeight;

    var left = Math.min(Math.max(r.left, margin), vw - bw - margin);
    left = Math.max(left, margin);

    // Below the term if it fits, otherwise above.
    var top = r.bottom + gap;
    var above = false;
    if (top + bh > vh - margin && r.top - gap - bh >= margin) {
      top = r.top - gap - bh;
      above = true;
    }
    tip.classList.toggle('glossary-tip--above', above);
    tip.style.left = (left + window.scrollX) + 'px';
    tip.style.top = (top + window.scrollY) + 'px';
  }

  function close(returnFocus) {
    if (!current) return;
    var btn = current;
    btn.setAttribute('aria-expanded', 'false');
    current = null;
    tip.textContent = '';
    tip.classList.remove('glossary-tip--open');
    if (returnFocus) btn.focus();
  }

  function open(btn) {
    close(false);
    current = btn;
    btn.setAttribute('aria-expanded', 'true');

    var bubble = document.createElement('span');
    bubble.className = 'glossary-tip__bubble';
    var term = document.createElement('strong');
    term.className = 'glossary-tip__term';
    term.textContent = btn.dataset.term;
    var def = document.createElement('span');
    def.className = 'glossary-tip__definition';
    def.textContent = btn.dataset.definition;
    bubble.appendChild(term);
    bubble.appendChild(document.createTextNode(': '));
    bubble.appendChild(def);

    // Clear then fill on the next frame so the live region reliably announces,
    // even when the same term is opened twice in a row.
    tip.textContent = '';
    tip.classList.add('glossary-tip--open');
    window.requestAnimationFrame(function () {
      if (current !== btn) return;
      tip.appendChild(bubble);
      position();
    });
  }

  root.addEventListener('click', function (e) {
    var btn = e.target.closest('.glossary-term');
    if (!btn) return;
    if (current === btn) close(false);
    else open(btn);
  });

  document.addEventListener('click', function (e) {
    if (!current) return;
    if (e.target.closest('.glossary-term') || tip.contains(e.target)) return;
    close(false);
  });

  document.addEventListener('keydown', function (e) {
    if (current && (e.key === 'Escape' || e.key === 'Esc')) {
      e.preventDefault();
      close(true);
    }
  });

  document.addEventListener('focusin', function (e) {
    if (current && e.target !== current && !tip.contains(e.target)) close(false);
  });

  window.addEventListener('resize', position);
})();
