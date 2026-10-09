/* 達成エフェクト（紙ふぶき＋バナー）。音なし・外部ライブラリなし。
 * JKFx.play(ev) は game.js の記録処理から呼ばれる。タップで消える／操作はじゃましない（pointer-events: none）。
 * 同じ達成は S.shown に覚えておき、再読み込みしても出し直さない。動きを減らす設定のときはバナーだけ。 */
(function () {
  "use strict";
  var G = window.JKGame; if (!G) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var box = null, q = [], busy = false, raf = 0, cvs = null, timer = 0, cur = null;
  var COLS = ["#ff7aa8", "#ffd23f", "#5b8def", "#48d1a0", "#b48cff", "#ff9f43", "#ffffff"];

  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function items(ev) { // → [{key, icon, title, sub, size}]
    var out = [];
    if (ev.quiz) {
      var cs = ev.quiz.coins ? "　+" + ev.quiz.coins + " コイン" : "";
      if (ev.quiz.perfect) out.push({ icon: "🎉", title: "パーフェクト！", sub: ev.quiz.total + "問ぜんぶ正解！" + cs, size: 3 });
      else out.push({ icon: "✅", title: "クイズクリア！", sub: ev.quiz.score + "/" + ev.quiz.total + " 正解" + cs, size: 2 });
    }
    (ev.gates || []).forEach(function (g) { out.push({ key: "gate:" + g, icon: "🔓", title: "限界突破！", sub: "Lv" + g + "の壁をこえた！", size: 3 }); });
    if (ev.levelUp) out.push({ key: "lv:" + ev.levelUp.lv, icon: "⬆️", title: "レベルアップ！", sub: "Lv" + ev.levelUp.lv + "「" + ev.levelUp.title + "」", size: 3 });
    (ev.ms || []).forEach(function (m) { out.push({ key: "ms:" + m, icon: "🔥", title: m + "日連続！", sub: "ボーナス +10 コイン", size: m >= 14 ? 3 : 2 }); });
    (ev.badges || []).forEach(function (b) { out.push({ key: "badge:" + b, icon: "🏅", title: "新しいバッジ！", sub: b + "　+5 コイン", size: 2 }); });
    (ev.titles || []).forEach(function (t) { out.push({ key: "title:" + t, icon: "🎖", title: "称号ゲット！", sub: t, size: 3 }); });
    if (ev.grad) out.push({ icon: "💪", title: "弱点を克服！", sub: "まちがえた問題を2回つづけて正解", size: 1 });
    return out;
  }

  function ensure() {
    if (box) return;
    box = document.createElement("div"); box.className = "jkf-box"; box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  function stopCanvas() {
    if (raf) cancelAnimationFrame(raf); raf = 0;
    if (cvs && cvs.parentNode) cvs.parentNode.removeChild(cvs); cvs = null;
  }
  function confetti(size) {
    stopCanvas();
    var W = innerWidth, H = innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    cvs = document.createElement("canvas"); cvs.className = "jkf-cv"; cvs.width = W * dpr; cvs.height = H * dpr; cvs.setAttribute("aria-hidden", "true");
    document.body.appendChild(cvs);
    var c = cvs.getContext("2d"); if (!c) return; c.scale(dpr, dpr);
    var n = size >= 3 ? 130 : size === 2 ? 70 : 32, ps = [], t0 = performance.now(), dur = size >= 3 ? 3000 : 2200, myc = cvs;
    for (var i = 0; i < n; i++) {
      var side = i % 2, spark = i % 5 === 0;
      ps.push({ x: side ? W * (.1 + Math.random() * .2) : W * (.7 + Math.random() * .2), y: H * (.55 + Math.random() * .1),
        vx: (side ? 1 : -1) * (2 + Math.random() * 5) + (Math.random() - .5) * 3, vy: -(8 + Math.random() * 9), g: .28 + Math.random() * .12,
        w: 5 + Math.random() * 6, h: 3 + Math.random() * 5, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4, col: COLS[i % COLS.length], spark: spark });
    }
    (function frame(now) {
      if (cvs !== myc) return;
      var k = (now - t0) / dur; if (k >= 1) { stopCanvas(); return; }
      c.clearRect(0, 0, W, H);
      ps.forEach(function (p) {
        p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        c.globalAlpha = Math.max(0, Math.min(1, (1 - k) * 2.2)); c.fillStyle = p.col;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r);
        if (p.spark) { c.beginPath(); c.moveTo(0, -p.w); c.quadraticCurveTo(0, 0, p.w, 0); c.quadraticCurveTo(0, 0, 0, p.w); c.quadraticCurveTo(0, 0, -p.w, 0); c.quadraticCurveTo(0, 0, 0, -p.w); c.fill(); }
        else c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        c.restore();
      });
      raf = requestAnimationFrame(frame);
    })(t0);
  }
  function dismiss() {
    clearTimeout(timer);
    if (cur) { var el = cur; cur = null; el.classList.add("is-out"); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); busy = false; next(); }, reduce ? 0 : 220); }
    stopCanvas();
  }
  function next() {
    if (busy || !q.length) return;
    busy = true; ensure();
    var it = q.shift(), el = document.createElement("div");
    el.className = "jkf-banner s" + it.size; el.setAttribute("role", "status");
    el.innerHTML = '<span class="jkf-ico" aria-hidden="true">' + it.icon + '</span><span class="jkf-tx"><strong>' + esc(it.title) + '</strong><small>' + esc(it.sub) + '</small></span>';
    el.addEventListener("click", dismiss);
    box.appendChild(el); cur = el;
    if (!reduce) confetti(it.size);
    timer = setTimeout(dismiss, it.size >= 3 ? 3600 : 2800);
  }
  function play(ev) {
    var list = items(ev).filter(function (it) { return !it.key || G.markShown(it.key); });
    if (!list.length) return;
    list.sort(function (a, b) { return b.size - a.size; });
    q = q.concat(list.slice(0, 3)); next();
  }
  window.JKFx = { play: play, _reduce: reduce };
})();
