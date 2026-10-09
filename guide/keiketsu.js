/* 経穴・経絡ページ：データ（keiketsu/keiketsu-data.js の window.KEIKETSU）を描くだけ。中身は資料倉庫（hk-portal-work/guide/extra）で作る。 */
(function () {
  'use strict';
  var D = window.KEIKETSU, root = document.getElementById('keiketsu');
  if (!D || !root) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var h = '<p class="tr-lead">14の経絡ごとに、通り道（走行）と、過去問によく出る経穴を骨・筋の目印で。経絡名をタップで開く。</p>';
  h += '<details class="tr-zu"><summary><span class="tr-zu-k">図説</span>流注の順番・手足の指先の始まりと終わり<span class="tr-open" aria-hidden="true">ひらく</span></summary><div class="tr-zu-b">' +
    D.figs.map(function (f) {
      return '<figure><a href="' + esc(f.src) + '" target="_blank" rel="noopener"><img src="' + esc(f.src) + '" width="' + f.w + '" height="' + f.h + '" alt="' + esc(f.alt) +
        '" loading="lazy" decoding="async"></a><figcaption>' + esc(f.cap) + '（タップで拡大）</figcaption></figure>';
    }).join('') + '</div></details>';
  h += D.goro.map(function (x) {
    return '<div class="tr-goro"><p class="tr-goro-g"><span class="tr-goro-k">語呂</span>' + esc(x.g) + '</p><ul>' + x.dec.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></div>';
  }).join('');
  h += '<nav class="tr-jump" aria-label="経絡へ移動">' + D.mers.map(function (m) { return '<a href="#' + m.id + '">' + esc(m.short) + '<span>' + m.id + '</span></a>'; }).join('') + '</nav>';
  h += '<p class="tr-tools"><button type="button" id="trOpenAll" aria-pressed="false">すべて開く</button></p>';
  function ep(lab, p) { return '<p class="kk-ep"><span class="kk-ep-k">' + lab + '</span><strong>' + esc(p.name) + '</strong>（' + esc(p.kana) + '・' + esc(p.code) + '）<span class="kk-loc">' + esc(p.loc) + '</span></p>'; }
  h += D.mers.map(function (m) {
    var pts = m.pts.map(function (p) {
      return '<li class="kk-pt" id="pt-' + esc(p.code) + '"><p class="kk-pt-h"><strong>' + esc(p.name) + '</strong><span class="kk-kana">' + esc(p.kana) + '</span>' +
        '<span class="kk-code">' + esc(p.code) + '</span>' + (p.hot ? '<span class="tr-hot">頻出</span>' : '') +
        '<span class="tr-n">過去問 ' + p.freq.all + '問</span></p>' +
        '<p class="kk-loc">' + esc(p.loc) + '</p>' +
        (p.anat.length ? '<p class="kk-anat"><span class="kk-anat-k">← 骨・筋</span>' + p.anat.map(function (a) {
          return '<a href="../anatomy/#' + esc(a.id) + '">' + esc(a.t) + '</a>';
        }).join('') + '</p>' : '') + '</li>';
    }).join('');
    return '<details class="tr-group" id="' + m.id + '"><summary><span class="tr-g-name">' + esc(m.name) + '</span><span class="tr-g-meta">' + m.n + '穴・よく出る' + m.pts.length +
      '</span><span class="tr-open" aria-hidden="true">ひらく</span></summary><div class="tr-g-b">' +
      '<p class="kk-route"><span class="kk-route-k">走行</span>' + m.path.map(esc).join(' → ') + '</p>' +
      ep('始まり', m.start) + ep('終わり', m.end) +
      '<h3 class="kk-h">よく出る経穴（過去問の多い順）</h3><ul class="kk-pts">' + pts + '</ul></div></details>';
  }).join('');
  h += '<p class="tr-src">' + esc(D.note) + '</p>';
  root.innerHTML = h;
  function openTarget() {
    var id = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!id) return;
    var el = document.getElementById(id);
    if (!el && /^pt-([A-Z]+)/.test(id)) el = document.getElementById(id.match(/^pt-([A-Z]+)/)[1]);
    if (!el) return;
    var g = el.closest('details.tr-group'); if (g) g.open = true;
    el.scrollIntoView({ block: 'start' });
    if (el.classList.contains('kk-pt')) { el.classList.add('kk-flash'); setTimeout(function () { el.classList.remove('kk-flash'); }, 1600); }
  }
  window.addEventListener('hashchange', openTarget); openTarget();
  var all = document.getElementById('trOpenAll');
  all.addEventListener('click', function () {
    var on = all.getAttribute('aria-pressed') !== 'true';
    all.setAttribute('aria-pressed', on ? 'true' : 'false'); all.textContent = on ? 'すべて閉じる' : 'すべて開く';
    root.querySelectorAll('details.tr-group').forEach(function (d) { d.open = on; });
  });
})();
