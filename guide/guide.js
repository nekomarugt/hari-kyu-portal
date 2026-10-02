/* 学習資料ビューア（解剖学・生理学・出題基準対応表）。データ: <subject>/content.js, coverage.js */
(function () {
  "use strict";
  var page = document.body.getAttribute("data-page");
  var KEY_HIDE = "hk-guide-hide-v1";
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var G = window.HKGuide || {};

  /* ---------------- 入口ページ ---------------- */
  if (page === "landing") {
    [["gl-ana", G.anatomy], ["gl-phy", G.physiology]].forEach(function (x) {
      var el = document.getElementById(x[0]); var d = x[1];
      if (!el || !d) return;
      el.textContent = d.chapters.length + "分野・" + Object.keys(d.sections).length + "項目（過去問" + d.nq + "問と結び付け）";
    });
    return;
  }

  /* ---------------- 対応表 ---------------- */
  if (page === "coverage") {
    var C = window.HKCoverage || {}, subj = location.hash === "#physiology" ? "physiology" : "anatomy", filt = "all";
    var body = document.getElementById("cov-body"), sum = document.getElementById("cov-sum");
    function renderCov() {
      var rows = C[subj] || [], d = G[subj];
      document.querySelectorAll("[data-subj]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-subj") === subj)); });
      document.querySelectorAll("[data-f]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-f") === filt)); });
      var cnt = { "流用OK": 0, "手直し": 0, "新規必要": 0 }, nq = { "流用OK": 0, "手直し": 0, "新規必要": 0 };
      rows.forEach(function (r) { cnt[r.st]++; nq[r.st] += r.nq; });
      sum.innerHTML = ["流用OK", "手直し", "新規必要"].map(function (k) { return '<div class="g-sumbox st-' + k + '"><strong>' + cnt[k] + '</strong><span>' + k + '（中項目）</span><small>過去問' + nq[k] + '問</small></div>'; }).join("");
      body.replaceChildren();
      d.chapters.forEach(function (ch) {
        var list = rows.filter(function (r) { return r.dai === ch.id && (filt === "all" || r.st === filt); });
        if (!list.length) return;
        var sec = h("section", "g-covch"); sec.appendChild(h("h2", "", ch.id + " " + ch.name));
        list.forEach(function (r) {
          var row = h("div", "g-covrow st-" + r.st);
          var top = h("div", "g-covtop");
          top.appendChild(h("span", "g-chu-id", r.id)); top.appendChild(h("strong", "", r.name));
          top.appendChild(h("span", "g-stchip st-" + r.st, r.st)); top.appendChild(h("span", "g-covn", "過去問" + r.nq + "問"));
          row.appendChild(top);
          var det = h("div", "g-covdet");
          if (r.secs.length) {
            var p = h("p", "", "収録："); r.secs.forEach(function (id) { var a = h("a", "", D_title(subj, id)); a.href = "../" + subj + "/#" + id; p.appendChild(a); p.appendChild(document.createTextNode(" ")); });
            det.appendChild(p);
          }
          if (r.refs.length) { var p2 = h("p", "", "他の項目で一部ふれる："); r.refs.forEach(function (id) { var a = h("a", "", D_title(subj, id)); a.href = "../" + subj + "/#" + id; p2.appendChild(a); p2.appendChild(document.createTextNode(" ")); }); det.appendChild(p2); }
          if (r.miss.length) det.appendChild(h("p", "g-miss", "不足の小項目：" + r.miss.join("、")));
          else if (r.secs.length) det.appendChild(h("p", "g-miss ok", "小項目の語はひと通り収録"));
          if (!r.secs.length && !r.refs.length) det.appendChild(h("p", "g-miss", "未収録（準備中）。小項目：" + r.sho.join("、")));
          row.appendChild(det); sec.appendChild(row);
        });
        body.appendChild(sec);
      });
    }
    function D_title(s, id) { var x = G[s].sections[id]; return id + " " + (x ? x.t.replace(/[：:].*$/, "") : ""); }
    document.querySelectorAll("[data-subj]").forEach(function (b) { b.addEventListener("click", function () { subj = b.getAttribute("data-subj"); history.replaceState(null, "", "#" + subj); renderCov(); }); });
    document.querySelectorAll("[data-f]").forEach(function (b) { b.addEventListener("click", function () { filt = b.getAttribute("data-f"); renderCov(); }); });
    renderCov();
    return;
  }

  /* ---------------- ビューア ---------------- */
  var subject = document.body.getAttribute("data-subject");
  var D = G[subject];
  var stage = document.getElementById("g-stage"), nav = document.getElementById("g-chapters");
  if (!D) { stage.textContent = "データを読み込めませんでした。"; return; }
  var secIndex = {}; D.chapters.forEach(function (ch, i) { ch.chus.forEach(function (c) { c.secs.forEach(function (id) { secIndex[id] = i; }); }); });
  var cur = 0;
  document.getElementById("g-sub").textContent = D.edition + "の順に整理｜" + D.chapters.length + "分野・" + Object.keys(D.sections).length + "項目";
  document.getElementById("g-legend").innerHTML = "<strong>出題N問</strong>＝その項目に結び付けた過去問（第1〜" + D.nExam + "回の収録分）の数。自動で割り当てた目安で、完全な一致ではありません。<strong>頻出</strong>＝この資料の中で出題N問が" + D.thr + "問以上、または同じ趣旨の問題が3回以上出ている項目。";

  function chIndexFromHash() {
    var hsh = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!hsh) return { ch: 0, sec: null };
    if (secIndex[hsh] != null) return { ch: secIndex[hsh], sec: hsh };
    for (var i = 0; i < D.chapters.length; i++) if (D.chapters[i].id === hsh) return { ch: i, sec: null };
    return { ch: 0, sec: null };
  }
  function buildNav() {
    D.chapters.forEach(function (ch, i) {
      var b = h("button", "g-chip", ch.id + " " + ch.name); b.type = "button"; b.setAttribute("data-i", i);
      b.addEventListener("click", function () { go(i, null, true); }); nav.appendChild(b);
    });
  }
  function badge(cls, text, title) { var s = h("span", "g-badge " + cls, text); if (title) s.title = title; return s; }
  function practiceHref(ids) { return D.qdir + "?qs=" + ids.slice(0, 60).join(","); }
  function qlabel(k) { var a = k.split("-"); return "第" + a[0] + "回 問" + a[1]; }

  function sectionCard(id) {
    var s = D.sections[id];
    var art = h("article", "g-sec"); art.id = id;
    var hd = h("button", "g-sec-h"); hd.type = "button"; hd.setAttribute("aria-expanded", "false");
    var t = h("span", "g-sec-t"); t.appendChild(h("span", "g-sec-id", id)); t.appendChild(document.createTextNode(" " + s.t));
    hd.appendChild(t);
    var bs = h("span", "g-badges");
    if (s.freq) bs.appendChild(badge("g-freq", "頻出", "出題N問が" + D.thr + "問以上、または同趣旨の問題が3回以上"));
    bs.appendChild(badge(s.np ? "g-n" : "g-n0", "出題" + s.np + "問", "この項目に結び付けた過去問の数（自動割り当ての目安）"));
    if (s.st === "参考") bs.appendChild(badge("g-ref", "補足", "出題基準に明記のない補足"));
    hd.appendChild(bs);
    var meta = h("span", "g-sec-meta", (s.ex ? s.ex : "この項目に結び付けた過去問はありません") + (s.nr ? "｜関連" + s.nr + "問" : ""));
    hd.appendChild(meta);
    art.appendChild(hd);
    var b = h("div", "g-sec-b"); b.hidden = true; art.appendChild(b);
    hd.addEventListener("click", function () { toggle(art, hd, b, id); });
    return art;
  }
  function fill(b, id) {
    var s = D.sections[id];
    var html = '<div class="g-html">' + s.h + "</div>";
    if (s.w) html += '<p class="g-why">' + esc(s.w) + "</p>";
    b.innerHTML = html;
    if (s.cq) {
      var det = h("details", "g-check"); var sm = h("summary", "", "確認：" + s.cq); det.appendChild(sm);
      var a = h("p", "g-check-a"); a.innerHTML = '<span class="answer">' + esc(s.ca) + "</span>"; det.appendChild(a); b.appendChild(det);
    }
    (s.deep || []).forEach(function (d) {
      var dt = h("details", "g-deep"); dt.appendChild(h("summary", "", "くわしく：" + d.title));
      var inner = h("div", "g-deep-b");
      [["shortcut", "ひとことで"], ["mechanism", "しくみ"], ["folded", "つまずきやすい所"], ["exam", "問われ方"]].forEach(function (k) {
        if (d[k[0]]) { var p = h("p"); p.innerHTML = "<strong>" + k[1] + "</strong>　" + esc(d[k[0]]); inner.appendChild(p); }
      });
      dt.appendChild(inner); b.appendChild(dt);
    });
    var q = h("div", "g-q");
    q.appendChild(h("h4", "", "この項目の過去問"));
    if (s.cl >= 3) q.appendChild(h("p", "g-clu", "同じ趣旨の問題が最多" + s.cl + "回出ています（例：「" + s.clq + "」）。"));
    if (s.np) {
      var a1 = h("a", "g-btn", "この項目の過去問を解く（" + s.np + "問）"); a1.href = practiceHref(s.p); q.appendChild(a1);
      var ul = h("p", "g-qlist");
      s.p.slice(0, 14).forEach(function (k) { var a = h("a", "g-qchip", qlabel(k)); a.href = D.qdir + "?q=" + k; ul.appendChild(a); });
      if (s.p.length > 14) ul.appendChild(h("span", "g-more", "ほか" + (s.p.length - 14) + "問"));
      q.appendChild(ul);
    } else q.appendChild(h("p", "g-none", "この項目に主として結び付けた過去問はありません。"));
    if (s.nr) {
      var p3 = h("p", "g-rel"); p3.appendChild(document.createTextNode("関連する過去問（" + s.nr + "問）："));
      s.r.slice(0, 8).forEach(function (k) { var a = h("a", "g-qchip rel", qlabel(k)); a.href = D.qdir + "?q=" + k; p3.appendChild(a); });
      if (s.r.length > 8) p3.appendChild(h("span", "g-more", "ほか" + (s.r.length - 8) + "問"));
      q.appendChild(p3);
    }
    b.appendChild(q);
  }
  function toggle(art, hd, b, id, force) {
    var open = force != null ? force : b.hidden;
    if (open && !b.dataset.ready) { fill(b, id); b.dataset.ready = "1"; }
    b.hidden = !open; hd.setAttribute("aria-expanded", String(open)); art.classList.toggle("is-open", open);
  }
  function render(i) {
    var ch = D.chapters[i]; stage.replaceChildren();
    var head = h("header", "g-chhead"); head.appendChild(h("h2", "", ch.id + " " + ch.name)); head.appendChild(h("p", "g-intro", ch.intro));
    stage.appendChild(head);
    ch.chus.forEach(function (c) {
      var box = h("section", "g-chu");
      var hh = h("h3", ""); hh.appendChild(h("span", "g-chu-id", c.id)); hh.appendChild(document.createTextNode(" " + c.name)); box.appendChild(hh);
      if (c.sho.length) box.appendChild(h("p", "g-sho", "出題基準の小項目：" + c.sho.join("／")));
      if (c.secs.length) c.secs.forEach(function (id) { box.appendChild(sectionCard(id)); });
      else {
        var todo = h("p", "g-todo", "準備中：この中項目の解説はまだありません。");
        box.appendChild(todo);
        if (c.refs.length) {
          var p = h("p", "g-refs", "関連して、次の項目でふれています："); c.refs.forEach(function (id) { var s = D.sections[id]; var a = h("a", "", id + " " + s.t); a.href = "#" + id; p.appendChild(a); p.appendChild(document.createTextNode(" ")); });
          box.appendChild(p);
        }
      }
      stage.appendChild(box);
    });
    nav.querySelectorAll(".g-chip").forEach(function (b) { b.setAttribute("aria-current", b.getAttribute("data-i") == i ? "true" : "false"); });
    var cb = nav.querySelector('[aria-current="true"]'); if (cb) { nav.scrollLeft += cb.getBoundingClientRect().left - nav.getBoundingClientRect().left - 20; }
    document.getElementById("g-prev").disabled = i === 0; document.getElementById("g-next").disabled = i === D.chapters.length - 1;
    var oa = document.getElementById("g-openall"); oa.setAttribute("aria-pressed", "false"); oa.textContent = "すべて開く";
  }
  function go(i, secId, push) {
    cur = i; render(i);
    if (push) history.replaceState(null, "", "#" + (secId || D.chapters[i].id));
    if (secId) { var art = document.getElementById(secId); if (art) { toggle(art, art.querySelector(".g-sec-h"), art.querySelector(".g-sec-b"), secId, true); art.scrollIntoView({ block: "start" }); } }
    else window.scrollTo(0, 0);
  }
  /* 赤字（答えの語）を隠す */
  var hideBtn = document.getElementById("g-hide");
  function applyHide(on) { document.body.classList.toggle("g-hide", on); hideBtn.setAttribute("aria-pressed", String(on)); hideBtn.textContent = on ? "赤字を表示する" : "赤字を隠して確認"; lsSet(KEY_HIDE, on ? "1" : "0"); }
  hideBtn.addEventListener("click", function () { applyHide(!document.body.classList.contains("g-hide")); });
  document.addEventListener("click", function (e) { var a = e.target.closest ? e.target.closest(".answer") : null; if (a && document.body.classList.contains("g-hide")) a.classList.toggle("shown"); });
  applyHide(lsGet(KEY_HIDE) === "1");
  document.getElementById("g-openall").addEventListener("click", function () {
    var on = this.getAttribute("aria-pressed") !== "true"; this.setAttribute("aria-pressed", String(on)); this.textContent = on ? "すべて閉じる" : "すべて開く";
    stage.querySelectorAll(".g-sec").forEach(function (art) { toggle(art, art.querySelector(".g-sec-h"), art.querySelector(".g-sec-b"), art.id, on); });
  });
  document.getElementById("g-prev").addEventListener("click", function () { if (cur > 0) go(cur - 1, null, true); });
  document.getElementById("g-next").addEventListener("click", function () { if (cur < D.chapters.length - 1) go(cur + 1, null, true); });
  window.addEventListener("hashchange", function () { var x = chIndexFromHash(); go(x.ch, x.sec, false); });
  buildNav();
  var first = chIndexFromHash(); go(first.ch, first.sec, false);
})();
