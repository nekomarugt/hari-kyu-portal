/* 科目の単一ソース。トップ・統計・実力・ゲーム・おみくじ・クイズはここを読む。
 * id / jitsuryokuKey / 保存キーは変えない（学生の記録を守るため）。 */
(function (global) {
  "use strict";
  var script = document.currentScript || document.querySelector('script[src*="subjects.js"]');
  var ROOT = script && script.src ? new URL("./", script.src).href : "./";

  var SITE = {
    name: "はり師きゅう師 国家試験ポータル",
    shortName: "はりきゅう国試",
    title: "はり師きゅう師 国家試験ポータル",
    description: "はり師・きゅう師 国家試験の解剖学・生理学・経絡経穴概論・臨床医学総論・臨床医学各論の過去問と4択クイズ。基礎の復習と過去問演習のための無料ポータル",
    gameKey: "jkp-hk-game-v1",
    wjScoreKey: "hkp-wj-scores-v1",
    wjLogKey: "hkp-wj-log-v1"
  };

  var SUBJECTS = [
    {
      id: "ana", label: "解剖学", shortLabel: "解剖学", path: "anatomy",
      enLabel: "ANATOMY", css: "anatomy",
      summary: "第1〜34回・515問", features: "分野別／回数別／ランダム／苦手復習",
      kakomon: true, stats: true, jitsuryoku: true, shortcut: true, omikuji: true, quiz: true, game: true,
      guide: "guide/anatomy/", kind: "fields", data: "anatomy/fields.json",
      jitsuryokuKey: "anatomy", weight: 15.1,
      flavor: { w: "解剖の" }, ability: ["解剖学", "正確さ", "🎯"],
      fields: [["A1", "人体の構成"], ["A2", "骨格系"], ["A3", "筋系"], ["A4", "循環器系"], ["A5", "呼吸器系"], ["A6", "消化器系"], ["A7", "泌尿器系"], ["A8", "生殖器系"], ["A9", "内分泌系"], ["A10", "神経系"], ["A11", "感覚器系"]]
    },
    {
      id: "phy", label: "生理学", shortLabel: "生理学", path: "physiology",
      enLabel: "PHYSIOLOGY", css: "physiology",
      summary: "第1〜34回・455問", features: "分野別／回数別／ランダム／苦手復習",
      kakomon: true, stats: true, jitsuryoku: true, shortcut: true, omikuji: true, quiz: true, game: true,
      guide: "guide/physiology/", kind: "fields", data: "physiology/fields.json",
      jitsuryokuKey: "physiology", weight: 13.4,
      flavor: { w: "生理の" }, ability: ["生理学", "理解力", "💡"],
      fields: [["P1", "生理学の基礎"], ["P2", "血液"], ["P3", "循環"], ["P4", "呼吸"], ["P5", "消化と吸収"], ["P6", "代謝"], ["P7", "体温"], ["P8", "排泄"], ["P9", "内分泌"], ["P10", "生殖と成長"], ["P11", "神経"], ["P12", "筋肉"], ["P13", "身体の運動"], ["P14", "感覚"], ["P15", "生体の防御機構"], ["P16", "ホメオスタシスと生体リズム"]]
    },
    {
      id: "kei", label: "経絡経穴概論", shortLabel: "経絡経穴", path: "keiketsu",
      enLabel: "MERIDIANS & POINTS", css: "keiketsu",
      summary: "第1〜34回・337問", features: "分野別（経絡・要穴・取穴部位など）／回数別／ランダム／苦手復習",
      kakomon: true, stats: true, jitsuryoku: true, shortcut: true, omikuji: true, quiz: true, game: true,
      guide: "guide/keiketsu/", kind: "fields", data: "keiketsu/fields.json",
      jitsuryokuKey: "keiketsu", weight: 9.9,
      flavor: { t: ["ツボさがしの見習い", "がんばる経穴ハンター", "経穴ハンター", "腕ききの経穴ハンター", "経絡の達人", "経絡経穴マスター"] },
      ability: ["経絡経穴", "ツボ勘", "📍"],
      fields: [["K1", "経絡（流注・奇経など）"], ["K2", "骨度法・同身寸法"], ["K3", "要穴"], ["K4", "経穴（取穴部位）"], ["K5", "奇穴"], ["K6", "組合せ問題"], ["K7", "経絡・経穴の現代的研究"], ["K8", "注意が必要な経穴"]]
    },
    {
      id: "sor", label: "臨床医学総論", shortLabel: "臨床総論", path: "rinsho-soron",
      enLabel: "CLINICAL MEDICINE: GENERAL", css: "rinsho-soron",
      summary: "第1〜34回・370問", features: "分野別（症候・診察法・臨床検査法・治療法）／回数別／ランダム／苦手復習",
      kakomon: true, stats: true, jitsuryoku: false, shortcut: true, omikuji: true, quiz: true, game: true,
      guide: "guide/souron/", kind: "fields", data: "rinsho-soron/fields.json",
      flavor: { w: "診察の" }, ability: ["臨床総論", "みたて力", "🩺"],
      fields: [["S1", "症候"], ["S2", "診察法"], ["S3", "臨床検査法"], ["S4", "治療法"]]
    },
    {
      id: "kak", label: "臨床医学各論", shortLabel: "臨床各論", path: "rinsho-kakuron",
      enLabel: "CLINICAL MEDICINE: DISEASES", css: "rinsho-kakuron",
      summary: "第1〜34回・766問", features: "分野別（感染症・神経・呼吸器・循環器など16分野）／回数別／ランダム／苦手復習",
      kakomon: true, stats: true, jitsuryoku: false, shortcut: false, omikuji: true, quiz: true, game: true,
      guide: "guide/kakuron/", kind: "fields", data: "rinsho-kakuron/fields.json",
      flavor: { w: "臨床の" }, ability: ["臨床各論", "病気の知識", "🏥"],
      fields: [["K1", "感染症"], ["K2", "神経・筋疾患"], ["K3", "呼吸器・胸壁疾患"], ["K4", "循環器疾患"], ["K5", "消化器疾患"], ["K6", "腎泌尿生殖器疾患"], ["K7", "女性疾患"], ["K8", "血液・造血器疾患"], ["K9", "代謝・栄養疾患"], ["K10", "内分泌疾患"], ["K11", "アレルギー・自己免疫疾患"], ["K12", "運動器疾患"], ["K13", "皮膚・頭頸部・乳房疾患"], ["K14", "精神・心身医学的疾患"], ["K15", "小児疾患"]]
    },
    {
      id: "toyo", label: "東洋医学（五行・臓腑）", shortLabel: "東洋医学", path: "",
      kakomon: false, stats: true, jitsuryoku: true, shortcut: false, omikuji: false, quiz: false, game: false,
      jitsuryokuKey: "toyo", weight: 9.9,
      flavor: { t: ["五行の見習い", "がんばる五行さがし", "陰陽の使い手", "五行の名人", "臓腑の達人", "陰陽五行マスター"] },
      ability: ["東洋医学", "気の巡り", "🌀"]
    }
  ];

  function flagged(flag) { return SUBJECTS.filter(function (s) { return !!s[flag]; }); }
  function byId(id) { for (var i = 0; i < SUBJECTS.length; i++) if (SUBJECTS[i].id === id) return SUBJECTS[i]; return null; }
  function pad2(i) { return (i < 10 ? "0" : "") + i; }
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function statsCfg(opts) {
    opts = opts || {};
    var subjects = flagged("stats").filter(function (s) { return s.kakomon; }).map(function (s) {
      return { src: s.id, label: s.label, kind: s.kind, data: ROOT + s.data, app: ROOT + s.path + "/" };
    });
    var wjLabel = {}, order = [], flavor = {}, ability = {};
    SUBJECTS.forEach(function (s) {
      if (s.flavor) flavor[s.label] = s.flavor;
      if (s.ability) ability[s.label] = s.ability;
      if (s.stats) {
        if (s.jitsuryokuKey) wjLabel[s.jitsuryokuKey] = s.label;
        if (order.indexOf(s.label) < 0) order.push(s.label);
      }
    });
    return { gameKey: SITE.gameKey, wjScoreKey: SITE.wjScoreKey, wjLogKey: SITE.wjLogKey, subjects: subjects, wjLabel: wjLabel, order: order, flavor: flavor, ability: ability, mini: !!opts.mini };
  }

  function jitsuryokuWeights() {
    var w = {};
    SUBJECTS.forEach(function (s) { if (s.jitsuryoku && s.jitsuryokuKey && s.weight != null) w[s.jitsuryokuKey] = s.weight; });
    return w;
  }

  function gameMaps() {
    var SUBJ = {}, SUBJ_PAGE = {}, SRC_SUBJ = {}, GUIDE = {};
    flagged("game").forEach(function (s) {
      SUBJ[s.id] = s.label; SUBJ_PAGE[s.id] = s.path; SRC_SUBJ[s.id] = s.id;
      if (s.guide) GUIDE[s.id] = s.guide;
    });
    return { SUBJ: SUBJ, SUBJ_PAGE: SUBJ_PAGE, SRC_SUBJ: SRC_SUBJ, GUIDE: GUIDE };
  }

  function omikujiFields() {
    return flagged("omikuji").map(function (s) {
      var f = (s.fields || []).map(function (pair) { return Array.isArray(pair) ? pair : [pair, pair]; });
      return { s: s.label, dir: s.path, f: f };
    });
  }

  function quizPage2s() {
    var m = {};
    flagged("quiz").forEach(function (s) { m[s.path] = s.id; });
    return m;
  }

  function renderKakomonCards(el) {
    if (!el) return;
    el.innerHTML = flagged("kakomon").map(function (s, i) {
      return '<a class="subject-card ' + esc(s.css || "") + '" href="' + ROOT + s.path + '/">' +
        '<span class="card-number">' + pad2(i + 1) + '</span>' +
        '<div class="card-copy"><span class="card-label">' + esc(s.enLabel || "") + '</span>' +
        '<h3>' + esc(s.label) + '</h3>' +
        (s.summary ? "<p>" + esc(s.summary) + "</p>" : "") +
        (s.features ? '<span class="card-features">' + esc(s.features) + "</span>" : "") +
        '</div><span class="card-arrow" aria-hidden="true">→</span></a>';
    }).join("");
  }

  function renderReviewLinks(el) {
    if (!el) return;
    el.innerHTML = flagged("kakomon").map(function (s) {
      return '<a href="' + ROOT + s.path + '/">' + esc(s.shortLabel) + "の苦手復習 →</a>";
    }).join("");
  }

  function renderQuizButtons(el) {
    if (!el) return;
    el.innerHTML = flagged("quiz").map(function (s) {
      return '<button type="button" data-subj="' + esc(s.id) + '" aria-pressed="' + (s.id === "phy" ? "true" : "false") + '">' + esc(s.shortLabel) + "</button>";
    }).join("");
  }

  function jitsuryokuBlurb() {
    var names = flagged("jitsuryoku").map(function (s) { return s.shortLabel; });
    return "ランダム出題でうでだめし！ " + names.join("・") + "から毎回ちがう問題";
  }

  function mountHome() {
    renderKakomonCards(document.getElementById("kakomon-cards"));
    renderReviewLinks(document.getElementById("review-links"));
    var blurb = document.getElementById("jitsuryoku-blurb");
    if (blurb) blurb.textContent = jitsuryokuBlurb();
  }

  global.JKSubjects = {
    site: SITE, all: SUBJECTS, rootUrl: ROOT, flagged: flagged, byId: byId,
    statsCfg: statsCfg, jitsuryokuWeights: jitsuryokuWeights, gameMaps: gameMaps,
    omikujiFields: omikujiFields, quizPage2s: quizPage2s,
    renderKakomonCards: renderKakomonCards, renderReviewLinks: renderReviewLinks,
    renderQuizButtons: renderQuizButtons, jitsuryokuBlurb: jitsuryokuBlurb, mountHome: mountHome
  };
})(window);
