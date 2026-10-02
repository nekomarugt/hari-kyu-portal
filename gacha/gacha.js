/* アバターガチャ画面。抽せんと保存は game/game.js（JKGame.pull）、絵は game/avatars.js。 */
(function () {
  "use strict";
  var G = window.JKGame, AV = window.JKAvatars;
  var $ = function (id) { return document.getElementById(id); };
  var RN = AV.RARITY, busy = false, hold = null, timers = [], skip = null;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ORDER = { N: 0, R: 1, SR: 2, SSR: 3 };

  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function capsule(cls) {
    return '<svg class="jkc-cap ' + cls + '" viewBox="0 0 120 120" width="150" height="150" aria-hidden="true">' +
      '<defs><radialGradient id="jkcg" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#9fb8ff"/></radialGradient></defs>' +
      '<ellipse cx="60" cy="112" rx="34" ry="6" fill="#0b1730" opacity=".18"/>' +
      '<g class="jkc-cap-in"><circle cx="60" cy="60" r="46" fill="#3a2f4d"/>' +
      '<path d="M15 60a45 45 0 0 1 90 0Z" fill="#ff7aa8"/><path d="M15 60a45 45 0 0 0 90 0Z" fill="url(#jkcg)"/>' +
      '<rect x="14" y="56.5" width="92" height="7" fill="#3a2f4d"/><circle cx="60" cy="60" r="10" fill="#ffd23f" stroke="#3a2f4d" stroke-width="4"/>' +
      '<ellipse cx="42" cy="36" rx="9" ry="5" transform="rotate(-35 42 36)" fill="#fff" opacity=".75"/>' +
      '<path d="M88 78l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#fff" opacity=".8"/></g></svg>';
  }
  function idle() { $("stage").innerHTML = '<div class="jkc-idle">' + capsule("") + '</div>'; }

  function card(r, big) {
    var d = AV.get(r.id), tag = r.isNew ? '<span class="jkc-new">NEW!</span>' : '<span class="jkc-dupe">DUPE +' + r.refund + '</span>';
    return '<div class="jkc-card r-' + d.r.toLowerCase() + (big ? " is-big" : "") + '" data-id="' + r.id + '">' + tag +
      AV.svg(r.id, big ? 150 : 78) + '<span class="jkc-rar r-' + d.r.toLowerCase() + '">' + d.r + '</span><strong>' + esc(d.n) + '</strong>' +
      (r.lore ? '<span class="jkc-loren">📖 きろく' + r.lore + 'がひらいた</span>' : '') +
      (big ? '<small>' + esc(d.f) + '</small>' : '') + '</div>';
  }

  function updateHud() {
    var c = hold === null ? G.coins() : hold;
    $("coin").textContent = c;
    $("pity").textContent = G.pity();
    $("pull1").disabled = busy || c < G.ECO.PULL;
    $("pull10").disabled = busy || c < G.ECO.PULL10;
    var s = $("short");
    if (!busy && c < G.ECO.PULL) { s.hidden = false; s.textContent = "コインが足りません。問題を解くとたまります（あと " + (G.ECO.PULL - c) + " コイン）。"; }
    else if (!busy && c < G.ECO.PULL10) { s.hidden = false; s.textContent = "10連はあと " + (G.ECO.PULL10 - c) + " コインで回せます。"; }
    else s.hidden = true;
  }

  function renderBook() {
    var own = G.owned(), sel = G.selected(), n = G.ownedCount(), tot = AV.list.length;
    $("count").textContent = n + "/" + tot;
    $("count-bar").style.width = Math.round(n / tot * 100) + "%";
    // 未入手のキャラは、名前・レア度・絵を出さない（固定シャッフル順・黒いシルエット・中立の枠）。レア度ごとの数も出さない。
    var html = '<div class="jkc-bgrid">';
    AV.order.forEach(function (id) {
      var has = own[id], d = has ? AV.get(id) : null;
      html += '<button type="button" class="jkc-cell' + (has ? " r-" + d.r.toLowerCase() : " is-locked") + (has && sel === id ? " is-sel" : "") + '" data-id="' + id + '" aria-label="' + (has ? esc(d.n) : "？？？") + '">' +
        (has ? AV.svg(id, 68) : AV.sil(id, 68)) + '<span>' + (has ? esc(d.n) : "？？？") + '</span>' + (has && sel === id ? '<i class="jkc-mine">つかってる</i>' : "") + '</button>';
    });
    $("book").innerHTML = html + "</div>";
  }

  function showDetail(id) {
    var own = G.owned(), d = AV.get(id), box = $("detail");
    if (!own[id]) { box.hidden = false; box.innerHTML = '<p class="jkc-locked"><b>？？？</b>　まだ出会っていない子です。ガチャで探そう。</p>'; return; }
    var sel = G.selected() === id;
    box.hidden = false;
    box.innerHTML = '<div class="jkc-dwrap">' + AV.svg(id, 84) + '<div><span class="jkc-rar r-' + d.r.toLowerCase() + '">' + d.r + ' ' + RN[d.r] + '</span><strong>' + esc(d.n) + '</strong><small>' + esc(d.f) + '</small>' +
      '<small>あつめた数：' + own[id] + '</small></div></div>' +
      '<button type="button" class="jkq-primary" data-use="' + id + '"' + (sel ? " disabled" : "") + '>' + (sel ? "いま使っています" : "この子をマイアバターにする") + '</button>' +
      '<div class="jkc-lore" id="lore" data-id="' + id + '"></div>';
    renderLore(id);
  }

  /* きろく：入手済みのキャラだけ。本文は game/lore.js（必要になったときに読み込む）。ひらいていない本の本文は画面にもHTMLにも出さない。 */
  var LOREOPEN = {}, GHOST = '<span class="jkc-ghost" aria-hidden="true"><i></i><i></i><i></i></span>'; // 2本目以降のひらいた本は、最初はたたんでおく（タップで開閉）。ダミーの線は文字を持たない
  function renderLore(id) {
    var box = $("lore"); if (!box || box.getAttribute("data-id") !== id || !G.owned()[id]) return;
    if (!window.JKLore) { box.innerHTML = '<p class="jkc-lore-wait">きろくを読みこみ中…</p>'; G.loadLore(function () { renderLore(id); }); return; }
    var d = AV.get(id), texts = window.JKLore[id] || [], n = G.loreCount(id), coins = G.coins(), h = "";
    for (var k = 1; k <= d.lm; k++) {
      var t = "きろく" + k;
      if (k <= n) {
        if (k === 1) { h += '<li class="is-open"><b>' + t + '</b><p>' + esc(texts[0] || "") + '</p></li>'; continue; }
        var ex = !!LOREOPEN[id + ":" + k];
        h += '<li class="is-open' + (ex ? "" : " is-fold") + '"><button type="button" class="jkc-fold" data-fold="' + k + '" aria-expanded="' + ex + '" aria-controls="lorep-' + k + '"><b>' + t + '</b><span class="jkc-chev" aria-hidden="true"></span></button>' +
          '<p id="lorep-' + k + '"' + (ex ? "" : " hidden") + '>' + esc(texts[k - 1] || "") + '</p></li>';
      }
      else if (k > d.lr) h += '<li class="is-soon"><b>🔒 ' + t + '</b><span class="jkc-lk">ひみつの きろく</span>' + GHOST + '</li>';
      else {
        var need = k - n, next = k === n + 1;
        h += '<li class="is-lock' + (next ? " is-next" : "") + '"><b>🔒 ' + t + '</b><span class="jkc-lk">かぶりで ひらく ／ あと' + need + '回 かぶると読めるよ</span>' + GHOST;
        if (next) { var c = G.loreCost(id); h += (coins >= c ? '<button type="button" class="jkq-secondary jkc-lbtn" data-lore="' + id + '">🪙 ' + c + ' コインでひらく</button>' : '<button type="button" class="jkq-secondary jkc-lbtn" disabled>🪙 ' + c + ' コイン（あと ' + (c - coins) + '）</button>'); }
        h += '</li>';
      }
    }
    box.innerHTML = '<h3 class="jkc-lore-h">きろく <small>' + n + '/' + d.lm + '</small></h3><ol class="jkc-lore-list">' + h + '</ol>' +
      (n < d.lr ? '<p class="jkq-note">かぶりが出ると、次のきろくが1つ無料でひらきます。</p>' : "");
  }

  function burst(r) {
    var n = r === "SSR" ? 44 : r === "SR" ? 26 : r === "R" ? 14 : 6, cols = r === "SSR" ? ["#ffd23f", "#fff", "#ff6ec7", "#6ec1ff", "#6ef0c2", "#c58bff"] : r === "SR" ? ["#ffd23f", "#fff", "#ff9fc4", "#8fe3ff"] : r === "R" ? ["#5b8def", "#fff", "#9fd2ff"] : ["#fff", "#cfd8e6"];
    var h = "";
    for (var i = 0; i < n; i++) {
      var a = (i / n) * 6.283 + Math.random() * .4, dist = (r === "SSR" ? 150 : r === "SR" ? 120 : 84) + Math.random() * (r === "SSR" ? 90 : 60);
      h += '<i class="jkc-p" style="--x:' + Math.round(Math.cos(a) * dist) + 'px;--y:' + Math.round(Math.sin(a) * dist) + 'px;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * .12).toFixed(2) + 's"></i>';
    }
    return '<div class="jkc-burst">' + h + '</div>';
  }

  function finish(pr) {
    clearTimers(); skip = null; hold = null; busy = false;
    var st = $("stage"); st.className = "jkc-stage";
    var rs = pr.results, big = rs.length === 1;
    $("results").hidden = false;
    $("res-grid").className = "jkc-grid" + (big ? " is-one" : "");
    $("res-grid").innerHTML = rs.map(function (r, i) { return card(r, big).replace('class="jkc-card', 'style="animation-delay:' + (reduce ? 0 : i * 70) + 'ms" class="jkc-card'); }).join("");
    if (big) {
      var d = AV.get(rs[0].id);
      $("res-grid").insertAdjacentHTML("beforeend", '<button type="button" class="jkq-secondary jkc-use" data-use="' + rs[0].id + '"' + (G.selected() === rs[0].id ? " disabled" : "") + '>' + (G.selected() === rs[0].id ? "いま使っています" : "この子をマイアバターにする") + '</button>');
    }
    var best = rs.reduce(function (a, r) { return ORDER[r.r] > ORDER[a] ? r.r : a; }, "N");
    var newN = rs.filter(function (r) { return r.isNew; }).length, back = rs.reduce(function (a, r) { return a + r.refund; }, 0);
    $("msg").textContent = (best === "SSR" ? "SSR！！！ とくべつな子が来た！ " : best === "SR" ? "スーパーレア！！ " : best === "R" ? "レアが出た！ " : "") + "新しい子 " + newN + " 体" + (back ? "／ かぶり分で +" + back + " コインもどった" : "") + (rs.some(function (r) { return r.lore; }) ? "／ きろくが" + rs.filter(function (r) { return r.lore; }).length + "つひらいた" : "") + "。";
    idle(); updateHud(); renderBook();
    try { $("results").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); } catch (e) {}
  }

  function run(n) {
    if (busy) return;
    var before = G.coins();
    var pr = G.pull(n);
    if (!pr.ok) { updateHud(); return; }
    busy = true; hold = before - pr.cost; updateHud();
    $("results").hidden = true;
    var best = pr.results.reduce(function (a, r) { return ORDER[r.r] > ORDER[a] ? r.r : a; }, "N"), st = $("stage");
    var ids = pr.results.map(function (r) { return r.id; }), ready = AV.preload(ids, 150), done = false;
    var go = function () { if (done) return; done = true; finish(pr); };
    skip = function () { ready.then(go, go); };
    if (reduce) { $("msg").textContent = "ひらいています…"; later(function () { skip(); }, 350); return; }
    $("msg").textContent = "ドキドキ…（タップでスキップ）";
    st.className = "jkc-stage is-" + best.toLowerCase();
    st.innerHTML = '<div class="jkc-wrap">' + capsule("is-shake") + '</div>';
    var shakeMs = best === "SSR" ? 2600 : best === "SR" ? 1900 : best === "R" ? 1400 : 950;
    later(function () {
      st.innerHTML = '<div class="jkc-flash f-' + best.toLowerCase() + '"></div>' + (best === "SSR" ? '<div class="jkc-rays is-ssr"></div><div class="jkc-rays is-ssr is-ssr2"></div><i class="jkc-ring"></i><i class="jkc-ring r2"></i>' : best === "SR" ? '<div class="jkc-rays"></div>' : "") + burst(best) +
        '<div class="jkc-pop">' + (best === "N" ? "" : '<b class="jkc-rar r-' + best.toLowerCase() + '">' + best + '</b>') + '</div>';
      later(function () { skip(); }, best === "SSR" ? 2300 : best === "SR" ? 1500 : best === "R" ? 1000 : 600);
    }, shakeMs);
  }

  $("stage").addEventListener("click", function () { if (skip) skip(); });
  $("pull1").addEventListener("click", function () { run(1); });
  $("pull10").addEventListener("click", function () { run(10); });
  document.addEventListener("click", function (e) {
    var u = e.target.closest && e.target.closest("[data-use]");
    if (u && !u.disabled) {
      if (G.setAvatar(u.getAttribute("data-use"))) {
        renderBook();
        document.querySelectorAll("[data-use]").forEach(function (b) { b.disabled = b.getAttribute("data-use") === G.selected(); b.textContent = b.disabled ? "いま使っています" : b.textContent; });
        var cell = document.querySelector('.jkc-cell[data-id="' + G.selected() + '"]'); if (cell) showDetail(G.selected());
      }
      return;
    }
    var fb = e.target.closest && e.target.closest("[data-fold]");
    if (fb) { var fid = $("lore") && $("lore").getAttribute("data-id"), fk = fb.getAttribute("data-fold"); if (fid) { LOREOPEN[fid + ":" + fk] = !LOREOPEN[fid + ":" + fk]; renderLore(fid); var fb2 = document.querySelector('#lore [data-fold="' + fk + '"]'); if (fb2) fb2.focus(); } return; }
    var lb = e.target.closest && e.target.closest("[data-lore]");
    if (lb && !lb.disabled) { var lid = lb.getAttribute("data-lore"), r = G.loreUnlock(lid); if (r.ok) LOREOPEN[lid + ":" + G.loreCount(lid)] = true; renderLore(lid); if (r.ok) { var li = document.querySelectorAll("#lore .is-open"); if (li.length) li[li.length - 1].scrollIntoView({ block: "nearest", behavior: "auto" }); } return; }
    var c = e.target.closest && e.target.closest(".jkc-cell");
    if (c) { showDetail(c.getAttribute("data-id")); $("detail").scrollIntoView({ block: "nearest", behavior: "auto" }); }
  });
  document.addEventListener("jkg-change", function () { if (!busy) { updateHud(); renderBook(); } var lo = $("lore"); if (lo) renderLore(lo.getAttribute("data-id")); });

  idle(); updateHud(); renderBook();
})();
