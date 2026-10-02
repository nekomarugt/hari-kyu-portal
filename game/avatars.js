/* はり師きゅう師 解剖学・生理学ポータル：ごほうびアバター（生成イラスト）38体。絵は gacha/art/aNN.webp（320x480）・aNN_t.webp（160x240）・aNN_s.webp（シルエット用の黒い小画像）。
 * ノーマル22／レア8／スーパーレア5／SSR3（最上位）。ID（n01…n22／r01…r08／s01…s05／ssr01…ssr03）は保存データに使うので、変更しないこと。
 * 未入手のキャラは、名前・レア度・本物の絵を画面に出さない（ずかんは固定のシャッフル順・黒いシルエットだけ）。
 * API（旧SVG版と同じ）：list / get(id) / byRarity / svg(id,size,opts) / sil(id,size) / RARITY ／ 追加：img（svgの別名）・order（ずかんの表示順）。 */
(function () {
  "use strict";
  var ROOT = (function () { // このファイルのある場所から gacha/art/ を求める（どの階層のページでも動く）
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/game\/avatars\.js(\?.*)?$/, "gacha/art/") : "/hari-kyu-portal/gacha/art/";
  })();
  // id, 名前, レア度, 一言, 絵の番号（シート1〜4を左上から右へ順に 1〜32、シート5＝SR3体は 33〜35、シート6＝SSR3体は 36〜38）
  var D = [
    { id: "n01", n: "カケル", r: "N", f: "坂道は友だち。転んだ数だけ上手くなる。", a: 1 },
    { id: "n02", n: "ホムラ", r: "N", f: "刀の手入れは完ぺき。朝ごはんは、まだ。", a: 2 },
    { id: "n03", n: "ミント", r: "N", f: "メガネをクイッ。もう3冊目を読み終わった。", a: 3 },
    { id: "n04", n: "クロウ", r: "N", f: "眼帯の下は、ただの寝不足。たぶん。", a: 4 },
    { id: "n05", n: "コハル", r: "N", f: "うちわでパタパタ。お祭りの話になると耳が動く。", a: 5 },
    { id: "n06", n: "アルド", r: "N", f: "盾の星が自慢。磨きすぎて自分の顔が映る。", a: 6 },
    { id: "n07", n: "スピカ", r: "N", f: "ほうきより杖が好き。星座の話は止まらない。", a: 7 },
    { id: "n08", n: "ユグ", r: "N", f: "森の朝は早い。矢を放つ前に深呼吸。", a: 8 },
    { id: "n09", n: "ラテ", r: "N", f: "ラテアートはハートより、たまにクマが出る。", a: 9 },
    { id: "n10", n: "ビート", r: "N", f: "ヘッドホンを外すと、急に静かな人になる。", a: 10 },
    { id: "n11", n: "ナツ", r: "N", f: "ウインクひとつでパスが通る…ことになっている。", a: 11 },
    { id: "n12", n: "ソルト", r: "N", f: "フライパンを振れば、どんな野菜もごちそうに。", a: 12 },
    { id: "n13", n: "ピント", r: "N", f: "いい瞬間は待たない。先回りして撮る。", a: 13 },
    { id: "n14", n: "ブンゴ", r: "N", f: "読書中は声が届かない。しおりだけが友だち。", a: 14 },
    { id: "n15", n: "エール", r: "N", f: "ポンポンを振れば、テスト前でも元気が出る。", a: 15 },
    { id: "n16", n: "ボルト", r: "N", f: "直せないものは、たぶんこの世にない。", a: 16 },
    { id: "n17", n: "ハヤテ", r: "N", f: "音もなく現れて、音もなくおやつを食べる。", a: 18 },
    { id: "n18", n: "ジョリー", r: "N", f: "宝の地図は逆さまでも、気合で進む。", a: 19 },
    { id: "n19", n: "ミナト", r: "N", f: "望遠鏡をのぞくと、だいたい雲が見える。", a: 20 },
    { id: "n20", n: "リケ", r: "N", f: "ぶくぶく光る薬は、まず自分で味見する派。", a: 21 },
    { id: "n21", n: "カリム", r: "N", f: "砂漠のオアシスは、頭の中の地図にある。", a: 22 },
    { id: "n22", n: "リュート", r: "N", f: "ポロロン♪ 即興の歌で、場をなごませる。", a: 24 },
    { id: "r01", n: "ルミナ", r: "R", f: "やさしい光で、みんなの肩こりまでほぐす。", a: 17 },
    { id: "r02", n: "ユキミ", r: "R", f: "杖をひとふり、あたり一面が粉雪に。", a: 23 },
    { id: "r03", n: "ホノカ", r: "R", f: "炎のうちわで舞えば、会場はあったかい。", a: 25 },
    { id: "r04", n: "ライガ", r: "R", f: "剣をかまえるとビリビリ。ドアノブは苦手。", a: 26 },
    { id: "r05", n: "ナギサ", r: "R", f: "波の音を聞きながら、トライデントでごあいさつ。", a: 27 },
    { id: "r06", n: "コダチ", r: "R", f: "角には小鳥がよく止まる。気にしない主義。", a: 28 },
    { id: "r07", n: "ツキヨ", r: "R", f: "月のみちかけで、明日の運勢を占う。", a: 29 },
    { id: "r08", n: "ギラン", r: "R", f: "槍をかまえた竜の角。ほめられると照れる。", a: 30 },
    { id: "s01", n: "アリエ", r: "SR", f: "竪琴の音色が、空にやさしい光をひろげる。", a: 31 },
    { id: "s02", n: "ノワール", r: "SR", f: "魔導書をめくれば、夜空もページになる。", a: 32 },
    { id: "s03", n: "ライカ", r: "SR", f: "肩の小さな竜と短い槍で、空をひとっ飛び。", a: 33 },
    { id: "s04", n: "コハク", r: "SR", f: "歯車がカチカチ。懐中時計は、いつも3分進んでいる。", a: 34 },
    { id: "s05", n: "ライゼン", r: "SR", f: "拳にバチバチ、羽織がひらり。まず準備運動から。", a: 35 },
    { id: "ssr01", n: "ヴェガ", r: "SSR", f: "ドローンが見つけた的は、ぜったいに外さない。", a: 36 },
    { id: "ssr02", n: "ジン", r: "SSR", f: "コートの橙の線が光ったら、ひと仕事の合図。", a: 37 },
    { id: "ssr03", n: "ネオン", r: "SSR", f: "ハートの銃でバグを撃退。ファンへのウインクつき。", a: 38 }
  ];
  // きろく：最大本数 lm（SR/SSRは5、ほかは3）／書き上がっている本数 lr（SR/SSRは5、ほかは今は1）。game/lore.js の本数と合わせること。
  D.forEach(function (d) { var top = d.r === "SR" || d.r === "SSR"; d.lm = top ? 5 : 3; d.lr = top ? 5 : 1; });
  var BYID = {}, BYR = { N: [], R: [], SR: [], SSR: [] };
  D.forEach(function (d) { BYID[d.id] = d; BYR[d.r].push(d.id); });
  // ずかんの表示順：レア度がばれないよう、固定のシャッフル順（ID順・レア度順にしない）
  var ORDER = [18, 4, 31, 12, 36, 25, 33, 7, 21, 1, 29, 15, 9, 32, 22, 38, 3, 27, 14, 35, 6, 30, 11, 19, 37, 2, 26, 34, 16, 8, 23, 5, 28, 13, 20, 10, 24, 17]
    .map(function (k) { return D[k - 1].id; });

  function pad(a) { return (a < 10 ? "0" : "") + a; }
  function src(d, size) { return ROOT + "a" + pad(d.a) + (size <= 120 ? "_t" : "") + ".webp?v=4"; }
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* svg(id,size,{bare:true}) → 枠つき（2:3）か、枠なし（ストリップ用）のHTML。名前は owned 前提で呼ぶこと（未入手は sil を使う）。 */
  function img(id, size, o) {
    var d = BYID[id]; if (!d) return "";
    o = o || {}; var w = size || 64, h = Math.round(w * 1.5), c = d.r.toLowerCase();
    var tag = '<img src="' + src(d, w * (window.devicePixelRatio > 1.5 ? 1.6 : 1)) + '" alt="' + esc(d.n) + '" width="' + w + '" height="' + h + '" loading="' + (o.eager ? "eager" : "lazy") + '" decoding="async" draggable="false">';
    if (o.bare) return '<span class="jka is-bare jka-' + c + '" style="width:' + w + 'px;height:' + h + 'px">' + tag + "</span>";
    var fx = d.r === "N" ? "" : '<i class="jka-sp s1"></i><i class="jka-sp s2"></i><i class="jka-sp s3"></i>' + (d.r === "SR" || d.r === "SSR" ? '<i class="jka-sp s4"></i>' : "") + (d.r === "SSR" ? '<i class="jka-sp s5"></i>' : "");
    return '<span class="jka jka-' + c + '" style="width:' + w + 'px;height:' + h + 'px">' + (d.r === "SR" ? '<i class="jka-rays"></i>' : "") + '<i class="jka-in">' + tag + "</i>" + fx + "</span>";
  }
  /* シルエット：名前・レア度・本物の絵は一切出さない（黒い小画像＋brightness(0)、中立の枠）。 */
  function sil(id, size) {
    var d = BYID[id]; if (!d) return "";
    var w = size || 64, h = Math.round(w * 1.5);
    return '<span class="jka jka-sil" style="width:' + w + 'px;height:' + h + 'px" aria-hidden="true"><i class="jka-in"><img src="' + ROOT + "a" + pad(d.a) + '_s.webp?v=4" alt="" width="' + w + '" height="' + h + '" loading="lazy" decoding="async" draggable="false"></i></span>';
  }
  function preload(ids, size) { // 引いた直後の結果用に先読み（演出中に読み込む）
    return Promise.all((ids || []).map(function (id) {
      var d = BYID[id]; if (!d) return null;
      return new Promise(function (ok) { var i = new Image(); i.onload = i.onerror = ok; i.src = src(d, size || 150); });
    }));
  }
  window.JKAvatars = { list: D, get: function (id) { return BYID[id] || null; }, byRarity: BYR, order: ORDER, svg: img, img: img, sil: sil, preload: preload, RARITY: { N: "ノーマル", R: "レア", SR: "スーパーレア", SSR: "スペシャル" } };
})();
