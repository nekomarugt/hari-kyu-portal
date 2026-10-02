/* はり師きゅう師 解剖学・生理学ポータル：学習ゲーム機能（連続日数・バッジ・レベル・弱点ステージ）
 * - すべて端末内（localStorage "jkp-hk-game-v1"）。サーバー送信・個人情報・計測なし。
 * - 各ドリルから JKGame.record(src, id, correct) を呼ぶだけ。
 *   src: ana/phy = 過去問(解剖学/生理学)
 */
(function () {
  "use strict";
  var KEY = "jkp-hk-game-v1"; // 同じ github.io にある別サイトの記録（jkp-game-v1）とは別
  var script = document.currentScript || document.querySelector('script[src*="game/game.js"]');
  var ROOT = script && script.src ? new URL("../", script.src).href : "../";

  var SUBJ = { ana: "解剖学", phy: "生理学" };
  var SUBJ_PAGE = { ana: "anatomy", phy: "physiology" };
  var QS = {}; // 短答ドリルは本サイトにはない（互換のため空のまま）
  var SRC_SUBJ = { ana: "ana", phy: "phy" };
  var WEAK_OUT = 2;      // 弱点リストから外れる連続正解数
  var MASTER_RATE = 0.8;
  var PAST_TITLES = [[100, ""], [300, "|300"]]; // 過去問で100問・300問（重複なし）に正解

  /* ---- コイン・ガチャ ---- */
  var ECO = { START: 30, CORRECT: 1, FIRST: 3, CAP: 30, FASTMS: 1500, BONUS: { 30: 5, 50: 10 }, BONUS_RATE: 0.6, BADGE: 5, MILESTONE: 10, PULL: 10, PULL10: 100, PITY: 30,
    DUPE: { N: 2, R: 5, SR: 15, SSR: 30 }, RATE: { N: 75, R: 22, SR: 2, SSR: 1 },
    LORE: [0, 20, 50, 80, 120], OMIKUJI: 5 }; // LORE：きろくN本目をコインでひらく値段（1本目は無料）。OMIKUJI：おみくじ1回（ごほうび・確率への影響なし） // 出現率の合計は100。天井(PITY)は「R以上」だけで、SSR専用の天井はない
  var MILESTONES = [3, 7, 14, 30];

  var LEVELS = [
    [0, "はじめの一歩"], [50, "かけだし"], [150, "見習い"], [300, "いっぱしの学生"], [500, "実力アップ"],
    [800, "力がついてきた"], [1200, "頼れる先輩"], [1700, "合格圏"], [2300, "ほぼ先生"], [3000, "解剖生理マスター"]
  ];
  var BADGES = [
    { id: "first", n: "はじめの一歩", d: "はじめて1問答えた", t: function (s) { return s.att >= 1; } },
    { id: "c10", n: "10問正解", d: "正解が合計10問", t: function (s) { return s.cor >= 10; } },
    { id: "c50", n: "50問正解", d: "正解が合計50問", t: function (s) { return s.cor >= 50; } },
    { id: "c100", n: "100問正解", d: "正解が合計100問", t: function (s) { return s.cor >= 100; } },
    { id: "st3", n: "3日連続", d: "3日つづけて問題をといた", t: function (s) { return s.best >= 3; } },
    { id: "st7", n: "7日連続", d: "7日つづけて問題をといた", t: function (s) { return s.best >= 7; } },
    { id: "st14", n: "14日連続", d: "14日つづけて問題をといた", t: function (s) { return s.best >= 14; } },
    { id: "st30", n: "30日連続", d: "30日つづけて問題をといた", t: function (s) { return s.best >= 30; } },
    { id: "q1", n: "4択クイズ クリア", d: "4択クイズを最後まで解いて60%以上正解", t: function (s) { return s.quests >= 1; } },
    { id: "q10", n: "満点クイズ", d: "4択クイズで全問正解", t: function (s) { return s.perfect >= 1; } },
    { id: "grad", n: "弱点を1つ克服", d: "まちがえた問題を2回連続で正解した", t: function (s) { return s.grads >= 1; } },
    { id: "both", n: "2科目デビュー", d: "解剖学・生理学の両方を1問以上といた", t: function (s) { return s.seen.ana && s.seen.phy; } },
    { id: "p100", n: "過去問100問クリア", d: "どちらかの科目で、過去問100問に正解（重複なし）", t: function (s) { return Object.keys(s.past).some(function (k) { return k.indexOf("|300") < 0; }); } },
    { id: "p300", n: "過去問300問クリア", d: "どちらかの科目で、過去問300問に正解（重複なし）", t: function (s) { return Object.keys(s.past).some(function (k) { return k.indexOf("|300") > 0; }); } },
    { id: "d20", n: "1日20問", d: "1日で20問といた", t: function (s) { return s.maxDay >= 20; } }
  ];

  /* ---------- state ---------- */
  var mem = null;
  function blank() {
    return { v: 1, xp: 0, att: 0, cor: 0, days: [], best: 0, qs: {}, ec: {}, weak: {}, badges: {}, mast: {}, past: {},
      quests: 0, perfect: 0, grads: 0, perfChap: 0, subjDone: 0, seen: {}, td: { d: "", n: 0 }, maxDay: 0, qb: { d: "", m: {} },
      coins: 0, own: {}, sel: "", pulls: 0, pity: 0, grant: 0, ms: {}, shown: {}, lore: {} };
  }
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    var s = blank();
    if (raw) { try { var o = JSON.parse(raw); if (o && o.v === 1) { for (var k in s) if (o[k] !== undefined) s[k] = o[k]; } } catch (e) {} }
    return sane(s);
  }
  // 新しい項目（コイン等）が無い・壊れている古い保存データでも安全に読めるようにする
  function sane(s) {
    function num(v) { v = Math.floor(+v); return isFinite(v) && v > 0 ? v : 0; }
    function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
    s.coins = num(s.coins); s.pulls = num(s.pulls); s.pity = num(s.pity); s.grant = s.grant ? 1 : 0;
    s.qb = obj(s.qb); s.qb.m = obj(s.qb.m); s.td = obj(s.td);
    s.own = obj(s.own); s.ms = obj(s.ms); s.shown = obj(s.shown);
    s.lore = obj(s.lore); Object.keys(s.lore).forEach(function (k) { var v = Math.floor(+s.lore[k]); if (!(v >= 1 && v <= 5) || !s.own[k]) delete s.lore[k]; else s.lore[k] = v; });
    s.sel = typeof s.sel === "string" && s.own[s.sel] ? s.sel : "";
    return s;
  }
  function starter() { if (!S.grant) { S.grant = 1; S.coins += ECO.START; save(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode etc.: keep in memory */ } }
  var S = load();
  starter();

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function dayNum(str) { var p = str.split("-"); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
  function streakNow() {
    var days = S.days; if (!days.length) return { n: 0, today: false };
    var t = dayNum(today()), last = dayNum(days[days.length - 1]);
    var doneToday = last === t;
    if (t - last > 1) return { n: 0, today: false };
    var n = 1;
    for (var i = days.length - 1; i > 0; i--) { if (dayNum(days[i]) - dayNum(days[i - 1]) === 1) n++; else break; }
    return { n: n, today: doneToday };
  }
  function levelInfo(xp) {
    var i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
    var cur = LEVELS[i][0], next = i + 1 < LEVELS.length ? LEVELS[i + 1][0] : null;
    return { lv: i + 1, title: LEVELS[i][1], cur: cur, next: next, pct: next ? Math.min(100, Math.round((xp - cur) / (next - cur) * 100)) : 100, max: next === null };
  }

  /* ---------- banks（互換用・未使用） ---------- */
  var banks = {};
  function registerBank(src, items) { if (Array.isArray(items)) banks[src] = items; }
  function topicsOf(src) {
    var m = {}, list = banks[src] || [];
    list.forEach(function (q) { (m[q.topic] = m[q.topic] || []).push(q.id); });
    return m;
  }
  function topicStat(src, topic) {
    var ids = topicsOf(src)[topic] || [], ok = 0;
    ids.forEach(function (id) { var r = S.qs[src + ":" + id]; if (r && r[2]) ok++; });
    return { ok: ok, total: ids.length };
  }
  function shortTopic(t) { return t === "骨・関節・頭頸部" ? "骨・関節" : t; }
  function checkMastery(src, ev) {
    if (QS[src] && !banks[src] && window[QS[src].v]) registerBank(src, window[QS[src].v]);
    if (!QS[src] || !banks[src]) return;
    var subj = QS[src].subj, tp = topicsOf(src), all = true;
    Object.keys(tp).forEach(function (t) {
      var st = topicStat(src, t), key = subj + "|" + t;
      if (st.total && st.ok / st.total >= MASTER_RATE) {
        if (!S.mast[key]) { S.mast[key] = today(); ev.titles.push(shortTopic(t) + "マスター（" + SUBJ[subj] + "）"); }
        if (st.ok === st.total && !S.mast[key + "|p"]) { S.mast[key + "|p"] = 1; S.perfChap++; }
      } else all = false;
    });
    if (all && !S.mast[subj + "|all"]) { S.mast[subj + "|all"] = 1; S.subjDone++; }
  }

  /* ---------- record ---------- */
  function record(src, id, ok, topic, opts) { // opts.ms: 問題を出してから答えるまでのミリ秒（4択クイズのみ。速すぎるとコインなし）
    if (!SRC_SUBJ[src]) return null;
    var ev = { xp: 0, coins: 0, badges: [], titles: [], levelUp: null, grad: false, ms: [] };
    var before = levelInfo(S.xp).lv;
    var k = src + ":" + id, r = S.qs[k] || (S.qs[k] = [0, 0, 0]);
    var firstOk = ok && !r[2];
    var d = today();
    if (S.td.d !== d) S.td = { d: d, n: 0, c: 0 };
    r[0]++; S.att++;
    if (ok) {
      r[1]++; S.cor++;
      if (!r[2]) { r[2] = 1; S.ec[src] = (S.ec[src] || 0) + 1; }
      ev.xp = firstOk ? 10 : 5;
      // コインの不正稼ぎ対策：①同じ問題のコインは1日1回まで（はじめての正解は +3、2回目以降の日は +1）②速すぎる回答（1.5秒未満）はコインなし ③回答コインは1日 CAP まで
      var c = firstOk ? ECO.FIRST : ECO.CORRECT;
      if (r[3] === d) c = 0;
      if (opts && opts.ms != null && opts.ms < ECO.FASTMS) { c = 0; ev.fast = true; }
      var room = Math.max(0, ECO.CAP - (S.td.c || 0));
      if (c > room) c = room;
      if (c > 0) { r[3] = d; S.td.c = (S.td.c || 0) + c; }
      if ((S.td.c || 0) >= ECO.CAP && !S.td.cm) { S.td.cm = 1; ev.capHit = true; }
      ev.coins = c;
    } else ev.xp = 2;
    S.xp += ev.xp;
    if (S.days[S.days.length - 1] !== d) { S.days.push(d); if (S.days.length > 400) S.days.splice(0, S.days.length - 400); }
    var sn = streakNow().n; if (sn > S.best) S.best = sn;
    S.td.n++; if (S.td.n > S.maxDay) S.maxDay = S.td.n;
    S.seen[SRC_SUBJ[src]] = 1;
    var w = S.weak[src] || (S.weak[src] = {});
    if (ok) { if (Object.prototype.hasOwnProperty.call(w, id)) { w[id]++; if (w[id] >= WEAK_OUT) { delete w[id]; S.grads++; ev.grad = true; } } }
    else w[id] = 0;
    // 過去問：100問正解の称号
    var subj = SRC_SUBJ[src];
    PAST_TITLES.forEach(function (pt) {
      var pk = subj + pt[1];
      if ((S.ec[src] || 0) >= pt[0] && !S.past[pk]) { S.past[pk] = today(); ev.titles.push(SUBJ[subj] + " 過去問" + pt[0] + "問クリア"); }
    });
    checkMastery(src, ev);
    finish(ev, before);
    return ev;
  }
  // 4択クイズ（30・50問）の完走ボーナス：60%以上正解・1問あたり平均3秒以上かけた場合のみ。コインは1日・1モードにつき1回（30問+5／50問+10）。10問はXPのみ。
  function quizDone(total, score, secs) {
    var d = today(), perfect = score === total && total > 0;
    var good = total > 0 && score / total >= ECO.BONUS_RATE && secs >= total * 3;
    var ev = { xp: 0, coins: 0, badges: [], titles: [], levelUp: null, ms: [], bonus: false };
    if (!S.qb || S.qb.d !== d) S.qb = { d: d, m: {} };
    if (good) {
      ev.xp = (total >= 50 ? 30 : total >= 30 ? 20 : 10) + (perfect ? 10 : 0);
      if (ECO.BONUS[total] && !S.qb.m[total]) { S.qb.m[total] = 1; ev.coins = ECO.BONUS[total]; ev.bonus = true; }
      S.quests++; if (perfect) S.perfect++;
      ev.quiz = { total: total, score: score, perfect: perfect, coins: ev.coins };
    }
    var before = levelInfo(S.xp).lv;
    S.xp += ev.xp;
    finish(ev, before, true);
    return ev;
  }
  function finish(ev, before, bonus) {
    BADGES.forEach(function (b) { if (!S.badges[b.id] && b.t(S)) { S.badges[b.id] = today(); ev.badges.push(b.n); ev.coins += ECO.BADGE; } });
    var sn = streakNow().n;
    MILESTONES.forEach(function (m) { if (sn >= m && !S.ms[m]) { S.ms[m] = today(); ev.ms.push(m); ev.coins += ECO.MILESTONE; } });
    var after = levelInfo(S.xp);
    if (after.lv > before) ev.levelUp = after;
    S.coins += ev.coins;
    save(); renderAll(); showToasts(ev, bonus);
    fxPlay(ev);
  }

  function fxPlay(ev) {
    var go = function () { try { window.JKFx.play(ev); } catch (e) {} };
    if (window.JKFx) go(); else loadExtra("fx.js", function () { return !!window.JKFx; }, go);
  }
  function markShown(key) { if (S.shown[key]) return false; S.shown[key] = 1; save(); return true; }

  /* ---------- ガチャ ---------- */
  function A() { return window.JKAvatars || null; }
  function pick(list, rng) { return list[Math.min(list.length - 1, Math.floor(rng() * list.length))]; }
  function rollRarity(rng, minRare) {
    var T = ECO.RATE, top = T.SSR + T.SR + T.R;
    var x = rng() * (minRare ? top : top + T.N); // R以上確定の抽せんは、R／SR／SSRを元の比率のまま引く（SSR専用の確定はなし）
    if (x < T.SSR) return "SSR";
    if (x < T.SSR + T.SR) return "SR";
    if (x < top) return "R";
    return "N";
  }
  function roll(rng, minRare) { // 1体えらぶ（状態は変えない）
    var av = A(); if (!av) return null;
    rng = rng || Math.random;
    var r = rollRarity(rng, minRare);
    return pick(av.byRarity[r], rng);
  }
  function pull(n, rng) {
    var av = A();
    if (!av) return { ok: false, reason: "loading" };
    n = n === 10 ? 10 : 1;
    var cost = n === 10 ? ECO.PULL10 : ECO.PULL;
    if (S.coins < cost) return { ok: false, reason: "coins", need: cost - S.coins };
    rng = rng || Math.random;
    S.coins -= cost;
    var res = [], gotRare = false;
    for (var i = 0; i < n; i++) {
      var force = (n === 10 && i === 9 && !gotRare) || S.pity >= ECO.PITY - 1; // 10連の最後／天井
      var a = roll(rng, force);
      if (av.get(a).r !== "N") { gotRare = true; S.pity = 0; } else S.pity++;
      var d = av.get(a), isNew = !S.own[a], refund = 0;
      var lo = 0;
      if (isNew) { S.own[a] = 1; if (!S.sel) S.sel = a; } else { S.own[a]++; refund = ECO.DUPE[d.r]; S.coins += refund; if (loreCount(a) < d.lr) { lo = loreCount(a) + 1; S.lore[a] = lo; } } // かぶると、次のきろくが1本ただでひらく
      S.pulls++;
      var item = { id: a, r: d.r, isNew: isNew, refund: refund }; if (lo) item.lore = lo;
      res.push(item);
    }
    save(); renderAll();
    return { ok: true, results: res, coins: S.coins, cost: cost };
  }
  /* ---------- キャラのきろく（本文は game/lore.js を後から読む。ここでは「何本ひらいたか」だけ持つ） ---------- */
  function loreCount(id) { // ひらいている本数（未入手は0。入手したら1本目は最初からひらいている。書き上がっている本数まで）
    var d = A() && A().get(id); if (!d || !S.own[id]) return 0;
    return Math.min(d.lr, Math.max(1, S.lore[id] || 0));
  }
  function loreCost(id) { var d = A() && A().get(id); if (!d || !S.own[id] || loreCount(id) >= d.lr) return 0; return ECO.LORE[loreCount(id)]; }
  function loreUnlock(id) { // 次のきろくをコインでひらく
    var d = A() && A().get(id); if (!d || !S.own[id]) return { ok: false, reason: "locked" };
    var n = loreCount(id); if (n >= d.lr) return { ok: false, reason: "none" };
    var cost = ECO.LORE[n]; if (S.coins < cost) return { ok: false, reason: "coins", need: cost - S.coins };
    S.coins -= cost; S.lore[id] = n + 1; save(); renderAll();
    return { ok: true, n: n + 1, cost: cost, coins: S.coins };
  }
  function spend(n) { n = Math.floor(n); if (!(n > 0 && n <= 100) || S.coins < n) return false; S.coins -= n; save(); renderAll(); return true; } // おみくじなど：コインを使うだけ
  function ownedCount() { return Object.keys(S.own).length; }
  function setAvatar(id) { if (!S.own[id]) return false; S.sel = id; save(); renderAll(); return true; }

  function weakIds(src) { return Object.keys(S.weak[src] || {}); }
  function weakCount(subj) { var n = 0; [subj, subj + "Q"].forEach(function (s) { n += weakIds(s).length; }); return n; }
  function reset() { S = blank(); try { localStorage.removeItem(KEY); } catch (e) {} starter(); renderAll(); } // コイン・アバター・ガチャ履歴も消える（最初のコイン30枚だけ再び付与）

  /* ---------- UI helpers ---------- */
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var toastBox = null, toastQ = [], toasting = false;
  function showToasts(ev, bonus) {
    var msgs = [];
    if (ev.xp) msgs.push({ t: "+" + ev.xp + " XP" + (ev.coins && !bonus ? "　+" + ev.coins + " コイン" : ""), k: "xp" });
    else if (ev.coins) msgs.push({ t: "+" + ev.coins + " コイン", k: "xp" });
    if (ev.grad) msgs.push({ t: "弱点を1つ克服！", k: "up" });
    if (ev.levelUp) msgs.push({ t: "レベルアップ！ Lv" + ev.levelUp.lv + "「" + ev.levelUp.title + "」", k: "up" });
    ev.badges.forEach(function (b) { msgs.push({ t: "バッジ：" + b, k: "up" }); });
    ev.titles.forEach(function (b) { msgs.push({ t: "称号：" + b, k: "up" }); });
    ev.ms.forEach(function (m) { msgs.push({ t: m + "日連続！ ボーナス +" + ECO.MILESTONE + " コイン", k: "up" }); });
    if (bonus) msgs = msgs.filter(function (m) { return m.k !== "xp"; }); // クイズ結果画面で表示するので省略
    if (ev.capHit) msgs.push({ t: "今日の回答コインは上限（" + ECO.CAP + "）に達しました。XPは引き続きもらえます。", k: "up" });
    if (!toastBox) {
      toastBox = document.createElement("div"); toastBox.className = "jkg-toasts"; toastBox.setAttribute("aria-live", "polite");
      document.body.appendChild(toastBox);
    }
    // 連続回答で画面がうるさくならないよう、XPだけのときは1つに保つ
    if (msgs.length === 1 && msgs[0].k === "xp") { toastQ = toastQ.filter(function (m) { return m.k !== "xp"; }); }
    toastQ = toastQ.concat(msgs); pump();
  }
  function pump() {
    if (toasting || !toastQ.length) return;
    toasting = true;
    var m = toastQ.shift(), el = document.createElement("div");
    el.className = "jkg-toast " + (m.k === "up" ? "is-up" : ""); el.textContent = m.t;
    toastBox.appendChild(el);
    setTimeout(function () {
      el.classList.add("is-out");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); toasting = false; pump(); }, 220);
    }, m.k === "up" ? 2600 : 1300);
  }

  function barHtml(li) {
    return '<div class="jkg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + li.pct + '"><i style="width:' + li.pct + '%"></i></div>';
  }
  function streakText(st) {
    if (st.n > 0) return '<strong>' + st.n + '</strong>日連続';
    return "今日からスタート";
  }
  function streakHint(st) {
    if (st.n === 0) return "1問やると「1日目」になります。";
    return st.today ? "今日の分はOK！" : "今日1問やると記録がつづきます。";
  }
  function avaHtml(size, bare) { // アバターは縦長（幅:高さ = 2:3）の全身絵。小さい所は枠なし
    var a = A(); if (!a || !S.sel || !a.get(S.sel)) return "";
    return '<a class="jkg-ava' + (bare ? " is-bare" : "") + '" href="' + ROOT + 'gacha/" aria-label="マイアバター：' + esc(a.get(S.sel).n) + '（ガチャへ）">' + a.svg(S.sel, size, { bare: !!bare }) + '</a>';
  }
  function gachaBtn() { return '<a class="jkg-btn is-gacha" href="' + ROOT + 'gacha/">🎁 ガチャを回す <span class="jkg-coinb">🪙 ' + S.coins + '</span></a>'; }
  function quizUrl(subj, extra) { return ROOT + "quiz/?s=" + SUBJ_PAGE[subj] + (extra || ""); }

  function badgeCount() { return BADGES.filter(function (b) { return S.badges[b.id]; }).length; }
  function renderHome(el) {
    var st = streakNow(), li = levelInfo(S.xp), n = S.td.d === today() ? S.td.n : 0;
    var rows = ["ana", "phy"].map(function (s) {
      var wc = weakIds(s).length; // 4択クイズの復習は過去問の分だけ
      return '<div class="jkg-subrow"><span class="jkg-subname">' + SUBJ[s] + '</span>' +
        '<a class="jkg-btn" href="' + quizUrl(s) + '">4択クイズ（10・30・50問）</a>' +
        (wc ? '<a class="jkg-btn is-weak" href="' + quizUrl(s, "&mode=weak") + '">まちがえた問題 ' + wc + '問</a>'
            : '<span class="jkg-none">まちがえた問題：なし</span>') + '</div>';
    }).join("");
    el.innerHTML =
      '<div class="jkg-card is-home">' +
      '<div class="jkg-sec"><span class="jk-tag is-quick">サクッとスキマ時間用</span><h2 class="jkg-sech">4択クイズ</h2><p class="jkg-secp">10・30・50問の短い勝負。正解でコイン → ガチャ。</p></div>' +
      '<div class="jkg-top">' +
      '<div class="jkg-streak"><span class="jkg-fire" aria-hidden="true">🔥</span><div><div class="jkg-streak-n">' + streakText(st) + '</div><div class="jkg-sub">' + streakHint(st) + '</div></div></div>' +
      '<div class="jkg-level' + (S.sel && A() ? " has-ava" : "") + '">' + avaHtml(58) + '<div class="jkg-lvbody"><div class="jkg-lvline"><span class="jkg-lv">Lv' + li.lv + '</span><span class="jkg-lvtitle">' + esc(li.title) + '</span></div>' + barHtml(li) +
      '<div class="jkg-sub">' + (li.max ? "最高レベル！ " + S.xp + " XP" : "あと " + (li.next - S.xp) + " XP で Lv" + (li.lv + 1)) + '</div></div></div>' +
      '</div>' +
      '<p class="jkg-today">' + (n ? "今日は <strong>" + n + "</strong> 問といたよ。" : "今日はまだ0問。まずは1問だけやってみよう。") + '</p>' +
      '<div class="jkg-subrows">' + rows + '</div>' +
      '<div class="jkg-gacha">' + gachaBtn() + '</div>' +
      '<div class="jkg-foot"><button type="button" class="jkg-link" data-jkg-open>🏅 バッジ・きろくを見る（' + badgeCount() + '/' + BADGES.length + '）</button>' +
      '<span class="jkg-note">記録は、この端末の中だけに保存されます。</span></div></div>';
  }
  function renderPanel(el) {
    var subj = el.getAttribute("data-subject");
    var st = streakNow(), li = levelInfo(S.xp), wc = weakIds(subj).length;
    el.innerHTML =
      '<div class="jkg-card is-compact">' +
      '<div class="jkg-strip">' + avaHtml(30, true) + '<span class="jkg-chip">🔥 ' + streakText(st) + '</span><span class="jkg-chip">Lv' + li.lv + ' ' + esc(li.title) + '</span>' +
      '<span class="jkg-chip is-coin">🪙 ' + S.coins + '</span><button type="button" class="jkg-link" data-jkg-open>きろく</button></div>' +
      '<div class="jkg-actions"><a class="jkg-btn" href="' + quizUrl(subj) + '">4択クイズ（10・30・50問）</a>' +
      (wc ? '<a class="jkg-btn is-weak" href="' + quizUrl(subj, "&mode=weak") + '">まちがえた問題だけ復習（' + wc + '問）</a>'
          : '<span class="jkg-none">まちがえた問題：いまはなし</span>') + '</div>' +
      '<p class="jkg-note">記録は、この端末の中だけに保存されます。</p></div>';
  }
  var mounts = [];
  function mountAll() {
    mounts = [].slice.call(document.querySelectorAll("[data-jkg]"));
    renderAll();
  }
  function renderAll() {
    mounts.forEach(function (el) { if (el.getAttribute("data-jkg") === "home") renderHome(el); else renderPanel(el); });
    if (overlay && !overlay.hidden) renderRecord();
    try { document.dispatchEvent(new CustomEvent("jkg-change")); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-jkg-open]");
    if (b) { e.preventDefault(); openRecord(); }
  });

  /* ---------- きろくパネル ---------- */
  var overlay = null, lastFocus = null;
  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement("div"); overlay.className = "jkg-overlay"; overlay.hidden = true;
    overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true"); overlay.setAttribute("aria-label", "わたしのきろく");
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeRecord(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !overlay.hidden) closeRecord(); });
    document.body.appendChild(overlay);
  }
  function openRecord() {
    ensureOverlay(); lastFocus = document.activeElement; overlay.hidden = false; document.documentElement.classList.add("jkg-lock");
    renderRecord();
    var c = overlay.querySelector("[data-jkg-close]"); if (c) c.focus();
  }
  function closeRecord() {
    overlay.hidden = true; document.documentElement.classList.remove("jkg-lock");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function renderRecord() {
    var st = streakNow(), li = levelInfo(S.xp);
    var badges = BADGES.map(function (b) {
      var got = S.badges[b.id];
      return '<li class="jkg-badge' + (got ? " is-got" : "") + '"><span class="jkg-bico" aria-hidden="true">' + (got ? "🏅" : "🔒") + '</span><span><strong>' + esc(b.n) + '</strong><small>' + esc(b.d) + '</small></span></li>';
    }).join("");
    var titles = [];
    Object.keys(S.past).forEach(function (k) { var p = k.split("|"); titles.push(SUBJ[p[0]] + " 過去問" + (p[1] ? p[1] : "100") + "問クリア"); });
    var prog = "";
    overlay.innerHTML =
      '<div class="jkg-modal"><div class="jkg-mhead"><h3>わたしのきろく</h3><button type="button" class="jkg-x" data-jkg-close aria-label="閉じる">閉じる</button></div>' +
      '<div class="jkg-me">' + (avaHtml(60) || '<span class="jkg-noava">🎁</span>') + '<div><strong>🪙 ' + S.coins + ' コイン</strong><span class="jkg-sub">キャラ ' + ownedCount() + '/' + (A() ? A().list.length : 38) + ' 体</span></div><a class="jkg-btn is-gacha" href="' + ROOT + 'gacha/">ガチャへ</a></div>' +
      '<div class="jkg-mgrid"><div class="jkg-stat"><small>連続日数</small><strong>' + st.n + '<em>日</em></strong><span>最高 ' + Math.max(S.best, st.n) + '日</span></div>' +
      '<div class="jkg-stat"><small>レベル</small><strong>Lv' + li.lv + '</strong><span>' + esc(li.title) + '</span></div>' +
      '<div class="jkg-stat"><small>正解した数</small><strong>' + S.cor + '<em>問</em></strong><span>挑戦 ' + S.att + '問</span></div></div>' +
      '<div class="jkg-lvbox">' + barHtml(li) + '<span class="jkg-sub">' + S.xp + ' XP' + (li.max ? "（最高レベル）" : " ／ 次のレベルまで " + (li.next - S.xp) + " XP") + '</span></div>' +
      '<h4>バッジ（' + badgeCount() + '/' + BADGES.length + '）</h4><ul class="jkg-badges">' + badges + '</ul>' +
      '<h4>称号</h4>' + (titles.length ? '<ul class="jkg-titles">' + titles.map(function (t) { return "<li>🎖 " + esc(t) + "</li>"; }).join("") + '</ul>' : '<p class="jkg-sub">まだありません。過去問で100問・300問に正解（重複なし）すると、科目ごとの称号がもらえます。</p>') +
      (prog ? '<h4>分野ごとの進みぐあい</h4><p class="jkg-sub">正解したことがある問題の数。80%で称号。</p>' + prog : '') +
      '<div class="jkg-rules"><h4>ルール</h4><ul><li>正解 +10 XP（同じ問題の2回目以降は +5）／ まちがい +2 XP ／ 4択クイズを60%以上で完走 +10／20／30 XP（10／30／50問。全問正解でさらに +10）</li>' +
      '<li>コイン：はじめての正解 +3（同じ問題の2回目以降は +1）。同じ問題のコインは1日1回まで、答えるのが速すぎる（1.5秒未満）とコインなし、回答コインは1日 '+ECO.CAP+' まで。</li>' +
      '<li>4択クイズの完走ボーナス（60%以上正解・1問3秒以上かけた場合、1日1モードにつき1回）：30問 +5／50問 +10。新しいバッジ +5 ／ 3・7・14・30日連続 +10。ガチャは1回10コイン、10連は100コイン、おみくじは1回5コイン、キャラのきろくは2つ目から20・50・80・120コイン（出る確率：N 75%／R 22%／SR 2%／SSR 1%）。</li>' +
      '<li>連続日数：1日1問でも答えれば、その日は数えます（端末の日付で、0時に切り替わります）。</li>' +
      '<li>まちがえた問題は「復習リスト」に入り、2回つづけて正解すると外れます。</li></ul></div>' +
      '<p class="jkg-note">記録は、この端末（このブラウザ）の中だけに保存されます。サーバーには送りません。別の端末とは共有されません。</p>' +
      '<button type="button" class="jkg-reset" data-jkg-reset>記録を消す（ゲームの記録だけ）</button></div>';
    overlay.querySelector("[data-jkg-close]").addEventListener("click", closeRecord);
    overlay.querySelector("[data-jkg-reset]").addEventListener("click", function () {
      if (window.confirm("ストリーク・バッジ・レベル・復習リスト・コイン・アバターなど、ゲームの記録をすべて消します。よろしいですか？")) reset();
    });
  }

  /* ---------- public ---------- */
  window.JKGame = {
    record: record, quizDone: quizDone, registerBank: registerBank, weakIds: weakIds, weakCount: weakCount,
    streak: streakNow, level: function () { return levelInfo(S.xp); }, xp: function () { return S.xp; },
    openRecord: openRecord, reset: reset,
    coins: function () { return S.coins; }, owned: function () { return S.own; }, ownedCount: ownedCount, loreCount: loreCount, loreCost: loreCost, loreUnlock: loreUnlock, spend: spend, loadLore: function (cb) { loadExtra("lore.js", function () { return !!window.JKLore; }, cb); }, selected: function () { return S.sel; },
    markShown: markShown, pull: pull, roll: roll, setAvatar: setAvatar, pulls: function () { return S.pulls; }, pity: function () { return S.pity; }, ECO: ECO, rootUrl: ROOT, isMastered: function (subj, topic) { return !!S.mast[subj + "|" + topic]; },
    qs: function (src, id) { return S.qs[src + ":" + id] || null; }, _state: function () { return S; },
    constants: { WEAK_OUT: WEAK_OUT, MASTER_RATE: MASTER_RATE, SUBJ: SUBJ, SUBJ_PAGE: SUBJ_PAGE, QS: QS }
  };
  // アバター絵・演出は別ファイル。ページ側の <script> を増やさず、ここで後から読み込む（失敗しても本体は動く）
  function loadExtra(file, ready, cb) {
    if (ready()) { if (cb) cb(); return; }
    var el = document.createElement("script"); el.src = ROOT + "game/" + file; el.async = true;
    el.onload = function () { renderAll(); if (cb) cb(); };
    (document.head || document.documentElement).appendChild(el);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll); else mountAll();
  loadExtra("avatars.js", function () { return !!window.JKAvatars; });
})();
