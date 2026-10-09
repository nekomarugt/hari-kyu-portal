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

  /* ---------------- 出題範囲マップ（学習者向け） ---------------- */
  if (page === "coverage") {
    var C = window.HKCoverage || {}, subj = location.hash === "#physiology" ? "physiology" : "anatomy", sortFreq = false, openState = {};
    var body = document.getElementById("cov-body");
    function best(d, r) {
      // 「資料を読む」の行き先：この中項目の項目のうち、過去問がいちばん多いもの（なければ先頭。収録がなければ関連項目）
      var ids = r.secs.length ? r.secs : r.refs; if (!ids.length) return null;
      var top = ids[0]; ids.forEach(function (id) { if (d.sections[id] && d.sections[id].np > d.sections[top].np) top = id; });
      return top;
    }
    function topPoint(d, r) {
      var t = null;
      r.secs.forEach(function (id) { var s = d.sections[id]; if (s && s.pt) s.pt.forEach(function (p) { if (p.n >= 2 && (!t || p.n > t.n)) t = p; }); });
      return t;
    }
    function model() {
      var d = G[subj], rows = C[subj] || [];
      var list = d.chapters.map(function (ch) {
        var items = rows.filter(function (r) { return r.dai === ch.id; }).map(function (r) {
          var freq = r.secs.some(function (id) { return d.sections[id] && d.sections[id].freq; });
          return { r: r, freq: freq, read: best(d, r), pt: topPoint(d, r) };
        });
        return { ch: ch, items: items, nq: items.reduce(function (a, x) { return a + x.r.nq; }, 0), nfreq: items.filter(function (x) { return x.freq; }).length };
      });
      if (sortFreq) {
        list.forEach(function (c) { c.items = c.items.slice().sort(function (a, b) { return b.r.nq - a.r.nq; }); });
        list = list.slice().sort(function (a, b) { return b.nq - a.nq; });
      }
      return list;
    }
    function setOpen(art, open) {
      var hd = art.querySelector(".g-sec-h"), bd = art.querySelector(".g-sec-b");
      bd.hidden = !open; art.classList.toggle("is-open", open); hd.setAttribute("aria-expanded", String(open));
      openState[subj + art.getAttribute("data-dai")] = open;
      var all = document.querySelectorAll(".g-covdai"), n = document.querySelectorAll(".g-covdai.is-open").length;
      var oa = document.getElementById("cov-openall"); if (oa) { oa.setAttribute("aria-pressed", String(n === all.length)); oa.textContent = n === all.length ? "すべて閉じる" : "すべて開く"; }
    }
    function renderCov() {
      var d = G[subj];
      document.querySelectorAll("[data-subj]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-subj") === subj)); });
      document.getElementById("cov-sort").setAttribute("aria-pressed", String(sortFreq));
      document.getElementById("cov-sort").textContent = sortFreq ? "出題基準の順にもどす" : "頻出順に並べる";
      body.replaceChildren();
      model().forEach(function (c) {
        var art = h("article", "g-sec g-covdai"); art.setAttribute("data-dai", c.ch.id);
        var hd = h("button", "g-sec-h"); hd.type = "button"; hd.setAttribute("aria-expanded", "false");
        var t = h("span", "g-sec-t"); t.appendChild(h("span", "g-sec-id", c.ch.id)); t.appendChild(document.createTextNode(" " + c.ch.name)); hd.appendChild(t);
        var bs = h("span", "g-badges");
        if (c.nfreq) bs.appendChild(h("span", "g-badge g-freq", "頻出" + c.nfreq + "か所"));
        bs.appendChild(h("span", "g-badge g-n", "出題" + c.nq + "問"));
        hd.appendChild(bs);
        art.appendChild(hd);
        var bd = h("div", "g-sec-b"); bd.hidden = true;
        c.items.forEach(function (x) {
          var r = x.r, row = h("div", "g-covrow");
          var top = h("div", "g-covtop");
          top.appendChild(h("strong", "g-covname", r.name));
          var b2 = h("span", "g-badges");
          if (x.freq) b2.appendChild(h("span", "g-badge g-freq", "頻出"));
          b2.appendChild(h("span", "g-badge " + (r.nq ? "g-n" : "g-n0"), "過去問" + r.nq + "問"));
          top.appendChild(b2); row.appendChild(top);
          if (x.pt) row.appendChild(h("p", "g-covpt", "よく出る所：" + x.pt.t + "（" + x.pt.n + "問）"));
          var act = h("div", "g-covact");
          if (x.read) { var a1 = h("a", "g-btn", "資料を読む"); a1.href = "../" + subj + "/#" + x.read; act.appendChild(a1); }
          if (r.nq) { var a2 = h("a", "g-btn g-btn2", "過去問を解く"); a2.href = d.qdir + "?field=" + encodeURIComponent(r.dai) + "&sub=" + encodeURIComponent(r.id); act.appendChild(a2); }
          else act.appendChild(h("span", "g-covnone", "この項目の過去問はまだありません"));
          row.appendChild(act); bd.appendChild(row);
        });
        art.appendChild(bd);
        hd.addEventListener("click", function () { setOpen(art, bd.hidden); });
        body.appendChild(art);
        if (openState[subj + c.ch.id]) setOpen(art, true);
      });
      var oa = document.getElementById("cov-openall"); if (oa) { oa.setAttribute("aria-pressed", "false"); oa.textContent = "すべて開く"; }
      var n = document.querySelectorAll(".g-covdai.is-open").length, all = document.querySelectorAll(".g-covdai").length;
      if (oa && n === all && all) { oa.setAttribute("aria-pressed", "true"); oa.textContent = "すべて閉じる"; }
    }
    document.querySelectorAll("[data-subj]").forEach(function (b) { b.addEventListener("click", function () { subj = b.getAttribute("data-subj"); history.replaceState(null, "", "#" + subj); renderCov(); }); });
    document.getElementById("cov-sort").addEventListener("click", function () { sortFreq = !sortFreq; renderCov(); });
    document.getElementById("cov-openall").addEventListener("click", function () {
      var arts = [].slice.call(document.querySelectorAll(".g-covdai")), allOpen = arts.every(function (a) { return a.classList.contains("is-open"); });
      arts.forEach(function (a) { setOpen(a, !allOpen); });
    });
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
    if (s.made) bs.appendChild(badge("g-new", "新規", "出題基準に合わせて新しく書いた項目"));
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
    if (s.w) html += s.w.split("\n").map(function (x) { return '<p class="g-why">' + esc(x) + "</p>"; }).join("");
    b.innerHTML = html;
    if (s.pt && s.pt.length) {
      var bx = h("div", "g-pt"); bx.appendChild(h("h4", "", "頻出ポイントと出され方（この項目の過去問から集計）"));
      var ul0 = h("ul", "g-ptl");
      s.pt.forEach(function (p) {
        var li = h("li", "g-pti");
        li.appendChild(h("strong", "", p.t));
        li.appendChild(h("span", "g-ptn", p.n + "問｜" + p.ex + (p.rec ? "｜第23回以降" + p.rec + "問" : "")));
        li.appendChild(h("span", "g-pth", "出し方：" + p.how));
        var cs = h("span", "g-ptq"); p.qs.slice(0, 4).forEach(function (k) { var a = h("a", "g-qchip", qlabel(k)); a.href = D.qdir + "?q=" + k; cs.appendChild(a); });
        li.appendChild(cs); ul0.appendChild(li);
      });
      bx.appendChild(ul0);
      var wh = b.querySelector(".g-why:last-of-type"); if (wh) wh.after(bx); else b.appendChild(bx);
    }
    if (s.tr && s.tr.n >= 3) {
      var tl = h("p", "g-tr", "出され方の目安（主な結び付け" + s.tr.n + "問を自動集計）：誤りを選ぶ形" + s.tr.wrong + "問／正しいものを選ぶ形" + s.tr.right + "問。年代は 第1〜11回" + s.tr.e1 + "問・第12〜22回" + s.tr.e2 + "問・第23回以降" + s.tr.e3 + "問。");
      b.appendChild(tl);
    }
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
    (s.tips || []).forEach(function (t) {
      var tp = h("details", t.lab ? "g-tips g-tips-zu" : "g-tips"); tp.appendChild(h("summary", "", (t.lab || "TIPS") + "：" + t.t));
      var inner = h("div", "g-tips-b");
      var fg = h("figure", t.imgs || t.lab ? "g-tips-fig g-tips-multi" : "g-tips-fig");
      (t.imgs || [{ src: t.src, alt: t.alt, w: t.w, h: t.h }]).forEach(function (x) {
        var a = h("a"); a.href = x.src; a.target = "_blank"; a.rel = "noopener";
        var im = h("img"); im.src = x.src; im.alt = x.alt; im.width = x.w; im.height = x.h; im.loading = "lazy"; im.decoding = "async";
        a.appendChild(im); fg.appendChild(a);
      });
      fg.appendChild(h("figcaption", "", t.cap)); inner.appendChild(fg);
      if (t.ch && t.ch.length) { // 経穴・経絡ページ（#pt-コード）へのリンク
        var cp = h("p", "g-kchips"); cp.appendChild(h("span", "g-kchips-k", "経穴・経絡ページで見る"));
        t.ch.forEach(function (c) { var a = h("a", "g-kchip", c.n); a.href = "../keiketsu/#pt-" + c.c; cp.appendChild(a); });
        inner.appendChild(cp);
      }
      if (t.note) inner.appendChild(h("p", "g-tips-note", t.note));
      tp.appendChild(inner); b.appendChild(tp);
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
