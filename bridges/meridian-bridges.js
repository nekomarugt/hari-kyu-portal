/* 解剖学の骨・筋 ⇄ 経穴・経絡。
 * データ: ../data/meridian-bridges.json（対応表）→ ここで描画するだけ。リンクを HTML に直書きしない。
 * 解剖学の節：折りたたみの「つながり」バー（← 骨・筋の目印 ｜ → 経穴・経絡）。経穴ガイドが無い間は、取穴の一行リストを中に出す。
 * 経穴は過去問での出題数の順（データ側で並べ済み）。pt.hot なら「頻出」、pt.freq があれば出題数を小さく出す。
 * 学習資料側が描き直しても MutationObserver で付け直す。データが読めなければ何もしない。 */
(function () {
  'use strict';
  var p = location.pathname;
  if (!/\/guide\/anatomy\//.test(p) || !window.fetch) return;
  var DATA = '../../data/meridian-bridges.json';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var byAnat = {};
  var FREQ = null;
  function index(data) {
    FREQ = data.freq || null;
    (data.slices || []).forEach(function (slice) {
      (slice.rows || []).forEach(function (row) {
        (row.anatomy || []).forEach(function (a) {
          if (!byAnat[a.id]) byAnat[a.id] = [];
          byAnat[a.id].push(row);
        });
      });
    });
  }

  function bar(id, rows) {
    var names = rows.map(function (r) { return r.topic; });
    var more = names.length > 2;
    if (more) names = names.slice(0, 2);
    var body = rows.map(function (r) {
      var mers = (r.meridians || []).map(function (m) {
        return '<span class="mb-chip">' + esc(m.t) + '</span>';
      }).join('');
      var pts = (r.points || []).map(function (pt) {
        return '<li class="mb-pt">' +
          '<span class="mb-pt-name"><strong>' + esc(pt.name) + '</strong>' +
          (pt.kana ? '<span class="mb-pt-kana">（' + esc(pt.kana) + '）</span>' : '') +
          (pt.code ? '<span class="mb-pt-code">' + esc(pt.code) + '</span>' : '') +
          (pt.hot ? '<span class="mb-hot">頻出</span>' : '') +
          '</span>' +
          (pt.freq ? '<span class="mb-pt-freq">過去問 ' + esc(pt.freq.all) + '問' +
            (pt.freq.since20 != null ? '（第20回以降 ' + esc(pt.freq.since20) + '問）' : '') + '</span>' : '') +
          (pt.meridian ? '<span class="mb-pt-mer">' + esc(pt.meridian) + '</span>' : '') +
          '<span class="mb-pt-loc">' + esc(pt.loc) + '</span>' +
          '</li>';
      }).join('');
      return '<div class="mb-row">' +
        '<p class="mb-topic"><strong>' + esc(r.topic) + '</strong></p>' +
        (mers ? '<p class="mb-go"><span class="mb-k">経絡</span>' + mers + '</p>' : '') +
        (pts ? '<p class="mb-k mb-k-block">→ 経穴（取穴・骨筋の目印）</p><ul class="mb-pts">' + pts + '</ul>' : '') +
        (r.hint ? '<p class="mb-hint">' + esc(r.hint) + '</p>' : '') +
        '</div>';
    }).join('');
    body += (FREQ ? '<p class="mb-note mb-freq-note">並びは過去問（経絡経穴概論 ' + esc(FREQ.years ? FREQ.years.split('（')[0] : '') +
        '）で名前が出た問題の数が多い順。' + esc(FREQ.hot || '') + '。' + esc(FREQ.min || '') + '。</p>' : '') +
      '<p class="mb-note">経穴の学習資料ページはまだ無いため、ここには取穴の要約だけを載せています。詳しい経穴ガイドができたら、そこへ相互リンクします。</p>';
    var d = document.createElement('details');
    d.className = 'meridian-bridge';
    d.setAttribute('data-meridian-bridge', id);
    d.innerHTML = '<summary><span class="mb-badge">つながり</span><span class="mb-title">← 骨・筋 ｜ → 経穴・経絡' +
      (names.length ? '：' + esc(names.join('・')) + (more ? ' ほか' : '') : '') +
      '</span><span class="mb-open" aria-hidden="true">ひらく</span></summary>' +
      '<div class="mb-body">' + body + '</div>';
    return d;
  }

  function apply() {
    Object.keys(byAnat).forEach(function (id) {
      var art = document.getElementById(id);
      var body = art && art.querySelector('.g-sec-b');
      if (!body || body.querySelector('[data-meridian-bridge]')) return;
      /* fill() が innerHTML で中身を入れたあとだけ付ける（空のまま付けても消される） */
      if (!body.dataset.ready && !body.querySelector('.g-html')) return;
      body.insertBefore(bar(id, byAnat[id]), body.firstChild);
    });
  }

  var CSS =
    'details.meridian-bridge{margin:4px 0 12px;border:1px dashed #7aa89a;border-radius:12px;background:#f4fbf8}' +
    'details.meridian-bridge>summary{display:flex;align-items:center;gap:10px;min-height:44px;padding:8px 12px;list-style:none;cursor:pointer;font-size:.92rem;color:#1f4a40}' +
    'details.meridian-bridge>summary::-webkit-details-marker{display:none}' +
    'details.meridian-bridge>summary:focus-visible{outline:3px solid #0c4a40;outline-offset:2px}' +
    '.mb-badge{flex:none;padding:2px 10px;border-radius:999px;background:#e7f5ef;color:#0c4a40;font-size:.78rem;font-weight:800}' +
    '.mb-title{flex:1;min-width:0;font-weight:700}.mb-open{flex:none;font-size:.78rem;color:#5a7a70}' +
    'details.meridian-bridge[open] .mb-open{display:none}' +
    '.mb-body{padding:2px 12px 12px;font-size:.95rem;line-height:1.7;overflow-wrap:anywhere}' +
    '.mb-row{padding:6px 0;border-top:1px dotted #b7d4c8}.mb-row:first-child{border-top:0}' +
    '.mb-row p{margin:4px 0}.mb-topic{margin:2px 0 4px}' +
    '.mb-k{display:inline-block;margin-right:6px;padding:1px 8px;border-radius:999px;background:#e8f3ee;color:#0c4a40;font-size:.78rem;font-weight:700}' +
    '.mb-k-block{display:inline-block;margin:6px 0 2px}' +
    '.mb-chip{display:inline-block;margin:2px 4px 2px 0;padding:3px 10px;border:1px solid #9bc4b4;border-radius:999px;background:#fff;font-size:.85rem;color:#1f4a40}' +
    '.mb-pts{list-style:none;margin:4px 0 8px;padding:0}' +
    '.mb-pt{margin:0 0 8px;padding:8px 10px;border-radius:10px;background:#fff;border:1px solid #d5e8df}' +
    '.mb-pt-name{display:block;font-size:1rem}.mb-pt-kana{margin-left:4px;font-size:.85rem;color:#5a7a70;font-weight:400}' +
    '.mb-pt-code{margin-left:8px;font-size:.8rem;color:#0c4a40;font-weight:700}' +
    '.mb-hot{display:inline-block;margin-left:8px;padding:0 8px;border-radius:999px;background:#c2410c;color:#fff;font-size:.75rem;font-weight:800;line-height:1.7;vertical-align:1px}' +
    '.mb-pt-freq{display:block;font-size:.78rem;color:#7a5a2a;margin-top:1px}' +
    '.mb-pt-mer{display:block;font-size:.82rem;color:#3d6a5c;margin-top:2px}' +
    '.mb-pt-loc{display:block;font-size:.9rem;color:#243830;margin-top:2px;line-height:1.55}' +
    '.mb-hint{font-size:.9rem;line-height:1.6;color:#33473f;padding:4px 10px;border-left:3px solid #c4a35a;background:#fffaf0}' +
    '.mb-note{font-size:.82rem;color:#5a7a70;margin-top:6px}';

  function start(data) {
    index(data);
    if (!document.querySelector('style[data-meridian-bridge-css]')) {
      var st = document.createElement('style');
      st.setAttribute('data-meridian-bridge-css', '');
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var queued = false;
    var mo = new MutationObserver(function () {
      if (queued) return;
      queued = true;
      (window.requestAnimationFrame || setTimeout)(function () { queued = false; apply(); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    apply();
  }

  fetch(DATA).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(start).catch(function () {});
})();
