/* 検索結果から学習資料へ来たとき：該当箇所を開き、閉じた箱があれば開け、語句を一時的に強調する。見出しIDは変えない。 */
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  var q = params.get("q");
  var box = params.get("box");
  if (!q && !box) return;

  var style = document.createElement("style");
  style.textContent =
    "mark.search-hl{background:#ffe08a;color:inherit;padding:0 .12em;border-radius:3px}" +
    "@keyframes search-flash{0%,100%{box-shadow:0 0 0 0 rgba(255,209,74,0)}40%{box-shadow:0 0 0 6px rgba(255,209,74,.85);background:#ffd24a}}" +
    "mark.search-hl.search-flash{animation:search-flash 1.1s ease 0s 3}";
  document.head.appendChild(style);

  function fold(s) {
    var t = String(s || "").normalize("NFKC");
    var out = "";
    for (var i = 0; i < t.length; i++) {
      var ch = t.charAt(i);
      var c = t.charCodeAt(i);
      if (c >= 0x30a1 && c <= 0x30f6) ch = String.fromCharCode(c - 0x60);
      ch = ch.toLowerCase();
      if (/\s/.test(ch) || ch === "\u3000") continue;
      out += ch;
    }
    return out;
  }
  function clearMarks(root) {
    root.querySelectorAll("mark.search-hl").forEach(function (m) {
      var p = m.parentNode;
      if (!p) return;
      p.replaceChild(document.createTextNode(m.textContent), m);
      p.normalize();
    });
  }
  function openAncestors(el) {
    var n = el;
    while (n && n !== document.body) {
      if (n.tagName === "DETAILS") n.open = true;
      if (n.classList && n.classList.contains("lesson-card")) {
        var body = n.querySelector(".lesson-body");
        var head = n.querySelector(".lesson-head");
        if (body) body.hidden = false;
        n.classList.add("is-open");
        if (head) head.setAttribute("aria-expanded", "true");
      }
      if (n.classList && n.classList.contains("acc-item")) {
        n.classList.add("is-open");
        var accB = n.querySelector("[hidden]");
        if (accB && accB.className && /body|panel/.test(accB.className)) accB.hidden = false;
      }
      if (n.classList && n.classList.contains("g-sec")) {
        var hd = n.querySelector(".g-sec-h");
        var bd = n.querySelector(".g-sec-b");
        if (bd && bd.hidden && hd) hd.click();
        else if (bd) {
          bd.hidden = false;
          if (hd) hd.setAttribute("aria-expanded", "true");
          n.classList.add("is-open");
        }
      }
      n = n.parentElement;
    }
  }
  function openBox(scope, title) {
    if (!title) return;
    var qf = fold(title);
    scope.querySelectorAll("details").forEach(function (d) {
      var sum = d.querySelector("summary");
      if (sum && fold(sum.textContent).indexOf(qf) >= 0) d.open = true;
    });
  }
  function highlightNode(root, query) {
    if (!query) return null;
    var qf = fold(query);
    if (!qf) return null;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
        if (p.closest("mark.search-hl")) return NodeFilter.FILTER_REJECT;
        return fold(node.nodeValue).indexOf(qf) >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    var first = null;
    nodes.forEach(function (node) {
      var raw = node.nodeValue;
      var nfkc = raw; // match on folded with map back to raw if lengths align; use simple fold-scan on raw via NFKC
      var map = [], f = "";
      var t = String(raw).normalize("NFKC");
      // If NFKC changes length, highlight on a wrapper using original search of first occurrence in fold
      for (var i = 0; i < raw.length; i++) {
        var ch = raw.charAt(i);
        var c = raw.charCodeAt(i);
        var folded = ch;
        if (c >= 0x30a1 && c <= 0x30f6) folded = String.fromCharCode(c - 0x60);
        folded = folded.toLowerCase();
        if (/\s/.test(folded) || folded === "\u3000") continue;
        // NFKC of this char might be multi, skip rare cases by using folded char[0]
        map.push(i);
        f += folded.normalize ? folded.normalize("NFKC") : folded;
      }
      var at = f.indexOf(qf);
      if (at < 0) return;
      var a = map[at];
      var b = map[Math.min(at + qf.length - 1, map.length - 1)] + 1;
      var before = raw.slice(0, a);
      var mid = raw.slice(a, b);
      var after = raw.slice(b);
      var mark = document.createElement("mark");
      mark.className = "search-hl";
      mark.textContent = mid;
      var frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(mark);
      if (after) frag.appendChild(document.createTextNode(after));
      node.parentNode.replaceChild(frag, node);
      if (!first) first = mark;
    });
    return first;
  }
  var finished = false;
  var lastLen = -1;
  function apply(attempt) {
    var id = "";
    try { id = decodeURIComponent((location.hash || "").replace(/^#/, "")); } catch (e) { id = (location.hash || "").replace(/^#/, ""); }
    var target = id ? document.getElementById(id) : null;
    var scope = target || document.querySelector("main") || document.body;
    if (target) openAncestors(target);
    if (box) openBox(scope, box);
    var textLen = (scope.textContent || "").replace(/\s+/g, "").length;
    if (target && textLen < 8 && attempt < 24) {
      setTimeout(function () { apply(attempt + 1); }, 80);
      return;
    }
    if (q && (textLen !== lastLen || !finished)) {
      clearMarks(scope);
      var mark = highlightNode(scope, q);
      var focus = mark || target;
      if (focus) {
        if (mark) mark.classList.add("search-flash");
        else target.classList.add("search-flash");
        try { focus.scrollIntoView({ block: "center", behavior: "instant" }); } catch (e) { focus.scrollIntoView(true); }
      }
      lastLen = textLen;
      if (mark || (target && textLen >= 8)) finished = true;
    } else if (finished) {
      var keep = scope.querySelector("mark.search-hl");
      if (keep) {
        try { keep.scrollIntoView({ block: "center", behavior: "instant" }); } catch (e) { keep.scrollIntoView(true); }
      }
    }
    if (!finished && attempt < 24) setTimeout(function () { apply(attempt + 1); }, attempt < 10 ? 80 : 160);
    else if (finished && attempt < 12) setTimeout(function () { apply(attempt + 1); }, 200);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { apply(0); });
  else apply(0);
  window.addEventListener("hashchange", function () { finished = false; lastLen = -1; apply(0); });
})();
