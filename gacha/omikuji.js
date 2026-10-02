/* 合格祈願おみくじ（ガチャ画面のおまけ）。1回5コイン・何回でも可。コイン／XPのごほうびなし、ガチャの確率・天井・保存データには一切さわらない。
 * ラッキー分野は、過去問の「分野別」と同じ分野の一覧から選び、?field= でその分野の出題へ飛ぶ（fields.json のid）。 */
(function () {
  "use strict";
  var G = window.JKGame, $ = function (id) { return document.getElementById(id); };
  if (!G || !$("omi-draw")) return;
  var FORTUNES = [ // k：運勢、w：重み、c：色クラス、m：ひとこと（どれもポジティブ）
    { k: "大吉", w: 10, c: "dai", m: ["今日はぜんぶ追い風。ひと問ひと問、手ごたえがありそう。", "覚えたことが、ふっとつながる日。自信をもっていこう。", "ここまで続けてきた分が、ちゃんと味方になってくれる。"] },
    { k: "中吉", w: 20, c: "chu", m: ["いい調子。ひとつ前の復習から入ると、もっと伸びるよ。", "コツコツの人に、運が寄ってくる日。", "あと一歩のところに、いいことが待っている。"] },
    { k: "小吉", w: 20, c: "sho", m: ["小さな「わかった」を集める日。1問ずつでじゅうぶん。", "ちょっと眠くても大丈夫。短い時間でも前に進める。", "ささやかだけど、たしかな進歩の日。"] },
    { k: "吉", w: 22, c: "kichi", m: ["ふつうの日こそ、力がつく日。いつものペースでいこう。", "あわてず、ていねいに。それがいちばんの近道。", "いつもの席、いつもの1問。それがちゃんと力になる。"] },
    { k: "末吉", w: 18, c: "sue", m: ["あとからじわじわ効いてくる日。今の勉強は、本番でごほうびになる。", "ゆっくりでも、止まらなければ前進。", "今日の1問が、あとで「あっ、これ見たことある」に変わる。"] },
    { k: "凶", w: 10, c: "kyo", m: ["今日は基礎に戻る日。足もとを固めると、あとで大きく伸びる。", "まちがいは宝の地図。見直した分だけ、本番で強くなる。", "うまくいかない日は、少し休んでもOK。明日の自分が助かるよ。"] }
  ];
  var FIELDS = [ // 過去問「分野別」と同じ分野（出題基準2026年版の大項目。テストで fields.json／questions.json と照合）
    { s: "解剖学", dir: "anatomy", f: [["A1", "人体の構成"], ["A2", "骨格系"], ["A3", "筋系"], ["A4", "循環器系"], ["A5", "呼吸器系"], ["A6", "消化器系"], ["A7", "泌尿器系"], ["A8", "生殖器系"], ["A9", "内分泌系"], ["A10", "神経系"], ["A11", "感覚器系"]] },
    { s: "生理学", dir: "physiology", f: [["P1", "生理学の基礎"], ["P2", "血液"], ["P3", "循環"], ["P4", "呼吸"], ["P5", "消化と吸収"], ["P6", "代謝"], ["P7", "体温"], ["P8", "排泄"], ["P9", "内分泌"], ["P10", "生殖と成長"], ["P11", "神経"], ["P12", "筋肉"], ["P13", "身体の運動"], ["P14", "感覚"], ["P15", "生体の防御機構"], ["P16", "ホメオスタシスと生体リズム"]] }
  ];
  var TIPS = [
    "まちがえた問題は、その日のうちにもう一度。", "解説は「なぜ他の選択肢がちがうのか」まで読むと強くなる。", "1回30分より、10分を3回のほうが覚えやすい。",
    "覚えにくい用語は、声に出して言ってみよう。", "寝る前の5分の復習は、いちばん頭に残る。", "分からない問題には印をつけて、あとで見直そう。",
    "表や図は、自分で書き直すと記憶に残る。", "眠いときは、いったん水を飲んで深呼吸。", "同じ分野を続けて解くと、つながりが見えてくる。", "過去問は、解いたあとの「ひとことメモ」が宝になる。"
  ];
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var COST = G.ECO.OMIKUJI;
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pick(a) { return a[Math.min(a.length - 1, Math.floor(Math.random() * a.length))]; }
  function draw() {
    var tot = FORTUNES.reduce(function (a, f) { return a + f.w; }, 0), x = Math.random() * tot, fo = FORTUNES[FORTUNES.length - 1];
    for (var i = 0; i < FORTUNES.length; i++) { if (x < FORTUNES[i].w) { fo = FORTUNES[i]; break; } x -= FORTUNES[i].w; }
    var all = []; FIELDS.forEach(function (g) { g.f.forEach(function (f) { all.push({ s: g.s, dir: g.dir, id: f[0], n: f[1] }); }); });
    return { fo: fo, msg: pick(fo.m), field: pick(all), tip: pick(TIPS) };
  }
  function show(r) {
    var href = "../" + r.field.dir + "/?field=" + encodeURIComponent(r.field.id);
    $("omi-result").innerHTML = '<div class="jkc-omicard is-' + r.fo.c + (reduce ? " is-still" : "") + '"><div class="jkc-omi-top"><small>合格祈願</small><b class="jkc-omi-k">' + r.fo.k + '</b></div>' +
      '<p class="jkc-omi-msg">' + esc(r.msg) + '</p>' +
      '<dl class="jkc-omi-dl"><dt>ラッキー分野</dt><dd>' + esc(r.field.s) + '：' + esc(r.field.n) + '</dd><dt>ひとこと勉強メモ</dt><dd>' + esc(r.tip) + '</dd></dl>' +
      '<a class="jkq-primary jkc-omi-go" href="' + href + '">この分野の過去問を解く →</a></div>';
  }
  function hud() {
    var c = G.coins(), b = $("omi-draw"); b.disabled = c < COST;
    var n = $("omi-short"); n.hidden = c >= COST; if (c < COST) n.textContent = "コインが足りません（あと " + (COST - c) + " コイン）。";
  }
  $("omi-draw").addEventListener("click", function () {
    if (!G.spend(COST)) { hud(); return; }
    show(draw()); hud();
    try { $("omi-result").scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }); } catch (e) {}
  });
  document.addEventListener("jkg-change", hud);
  hud();
  window.JKOmikuji = { FORTUNES: FORTUNES, FIELDS: FIELDS, TIPS: TIPS, COST: COST };
})();
