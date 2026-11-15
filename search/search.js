/* 学習資料の本文検索。日本語は部分一致（全角半角・かなカナ・大文字小文字を揃える）。 */
(function () {
  "use strict";
  var MAX = 50;
  var INDEX = null;
  var form = document.getElementById("search-form");
  var input = document.getElementById("q");
  var statusEl = document.getElementById("search-status");
  var resultsEl = document.getElementById("search-results");

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
  function indexFold(s) {
    var nfkc = String(s || "").normalize("NFKC");
    var f = "", map = [];
    for (var i = 0; i < nfkc.length; i++) {
      var ch = nfkc.charAt(i);
      var c = nfkc.charCodeAt(i);
      if (c >= 0x30a1 && c <= 0x30f6) ch = String.fromCharCode(c - 0x60);
      ch = ch.toLowerCase();
      if (/\s/.test(ch) || ch === "\u3000") continue;
      map.push(i);
      f += ch;
    }
    return { nfkc: nfkc, fold: f, map: map };
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function snippet(text, query, width) {
    var info = indexFold(text);
    var qf = fold(query);
    if (!qf) return esc(text.slice(0, width));
    var at = info.fold.indexOf(qf);
    if (at < 0) return esc(text.slice(0, width));
    var a = info.map[at];
    var b = info.map[at + qf.length - 1] + 1;
    var pad = Math.floor((width - (b - a)) / 2);
    if (pad < 12) pad = 12;
    var from = Math.max(0, a - pad);
    var to = Math.min(info.nfkc.length, b + pad);
    var pre = (from > 0 ? "…" : "") + info.nfkc.slice(from, a);
    var mid = info.nfkc.slice(a, b);
    var post = info.nfkc.slice(b, to) + (to < info.nfkc.length ? "…" : "");
    return esc(pre) + "<mark>" + esc(mid) + "</mark>" + esc(post);
  }
  function subjectOrder() {
    var order = [];
    if (window.JKSubjects && JKSubjects.all) {
      JKSubjects.all.forEach(function (s) { if (s.guide) order.push(s.label); });
    }
    return order;
  }
  function hrefFor(doc, q) {
    var parts = doc.u.split("#");
    var path = parts[0];
    var hash = parts[1] ? "#" + parts[1] : "";
    var qs = "q=" + encodeURIComponent(q);
    if (doc.box && (doc.box.t || doc.box.k)) qs += "&box=" + encodeURIComponent(doc.box.t || doc.box.k);
    var join = path.indexOf("?") >= 0 ? "&" : "?";
    return "../" + path + join + qs + hash;
  }
  function rank(doc, qf) {
    var hf = fold(doc.h);
    var xf = fold(doc.x);
    var hi = hf.indexOf(qf);
    var xi = xf.indexOf(qf);
    var score = 0;
    if (hi >= 0) score += 2000 - Math.min(hi, 500);
    if (xi >= 0) score += 1000 - Math.min(xi, 800);
    if (doc.box) score -= 20;
    return score;
  }
  function search(q) {
    var qf = fold(q);
    if (!qf) return [];
    var hits = [];
    INDEX.docs.forEach(function (d) {
      if (fold(d.h).indexOf(qf) >= 0 || fold(d.x).indexOf(qf) >= 0) hits.push(d);
    });
    hits.sort(function (a, b) { return rank(b, qf) - rank(a, qf); });
    return hits.slice(0, MAX);
  }
  function render(q, hits, totalHint) {
    resultsEl.innerHTML = "";
    if (!q) {
      statusEl.textContent = "学習資料の本文から探します。過去問の文面は対象外です。";
      return;
    }
    if (!hits.length) {
      statusEl.textContent = "";
      resultsEl.innerHTML = '<p class="search-empty">学習資料に「' + esc(q) + '」は見つかりませんでした。</p>';
      return;
    }
    var more = totalHint && totalHint > hits.length;
    statusEl.textContent = hits.length + "件" + (more ? "（多いので先頭" + MAX + "件）" : "");
    var groups = {};
    var order = subjectOrder().slice();
    hits.forEach(function (d) {
      if (!groups[d.s]) {
        groups[d.s] = [];
        if (order.indexOf(d.s) < 0) order.push(d.s);
      }
      groups[d.s].push(d);
    });
    order.forEach(function (s) {
      var list = groups[s];
      if (!list) return;
      var sec = document.createElement("section");
      sec.className = "search-group";
      sec.setAttribute("aria-label", s);
      var h2 = document.createElement("h2");
      h2.textContent = s + "（" + list.length + "）";
      sec.appendChild(h2);
      list.forEach(function (d) {
        var a = document.createElement("a");
        a.className = "search-hit";
        a.href = hrefFor(d, q);
        var h = document.createElement("span");
        h.className = "search-hit-h";
        h.textContent = d.h;
        a.appendChild(h);
        if (d.box) {
          var b = document.createElement("span");
          b.className = "search-hit-box";
          b.textContent = "閉じた箱「" + (d.box.k || "詳細") + "」の中";
          a.appendChild(b);
        }
        var p = document.createElement("p");
        p.className = "search-snip";
        p.innerHTML = snippet(d.x, q, 86);
        a.appendChild(p);
        sec.appendChild(a);
      });
      resultsEl.appendChild(sec);
    });
  }
  function runFromInput() {
    var q = (input.value || "").trim();
    var url = new URL(location.href);
    if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
    history.replaceState(null, "", url);
    if (!INDEX) { statusEl.textContent = "索引を読み込み中です…"; return; }
    var hits = q ? search(q) : [];
    render(q, hits);
  }
  function load() {
    statusEl.textContent = "索引を読み込み中です…";
    return fetch("./search-index.json").then(function (r) {
      if (!r.ok) throw new Error("index " + r.status);
      return r.json();
    }).then(function (data) {
      INDEX = data;
      runFromInput();
    }).catch(function () {
      statusEl.textContent = "索引を読み込めませんでした。接続を確認して、もう一度開いてください。";
    });
  }
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      runFromInput();
      if (input) input.blur();
    });
  }
  var params = new URLSearchParams(location.search);
  if (params.get("q") && input) input.value = params.get("q");
  load();
})();
