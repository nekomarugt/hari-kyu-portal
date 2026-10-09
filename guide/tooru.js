/* 通るシリーズ：データ（tooru-data.js の window.TOORU）を描くだけ。中身は資料倉庫（_build）側で作る。 */
(function () {
  'use strict';
  var D = window.TOORU, root = document.getElementById('tooru');
  if (!D || !root) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var h = '<p class="tr-lead">' + esc(D.lead) + '</p>';
  h += '<nav class="tr-jump" aria-label="グループへ移動">' + D.groups.map(function (g) {
    return '<a href="#' + esc(g.id) + '">' + esc(g.name) + '<span>' + g.items.length + '</span></a>';
  }).join('') + '</nav>';
  h += '<p class="tr-tools"><button type="button" id="trOpenAll" aria-pressed="false">すべて開く</button></p>';
  h += D.groups.map(function (g) {
    var items = g.items.map(function (it) {
      return '<li class="tr-item" id="' + esc(it.id) + '">' +
        '<p class="tr-line"><span class="tr-place">' + esc(it.place) + '</span><span class="tr-verb">' + esc(it.verb) + ' →</span>' +
        '<span class="tr-what">' + esc(it.what) + '</span></p>' +
        '<p class="tr-meta">' + (it.hot ? '<span class="tr-hot">頻出</span>' : '') +
        (it.n ? '<span class="tr-n">過去問 ' + it.n + '問</span>' : '<span class="tr-n tr-n0">基本</span>') +
        (it.note ? '<span class="tr-note">' + esc(it.note) + '</span>' : '') + '</p>' +
        (it.chips && it.chips.length ? '<p class="tr-chips">' + it.chips.map(function (c) {
          return '<a class="tr-chip" href="' + esc(c.href) + '"><span class="tr-chip-k">近くの経穴</span><strong>' + esc(c.name) + '</strong>' +
            (c.code ? '<span class="tr-chip-code">' + esc(c.code) + '</span>' : '') + '<span class="tr-chip-loc">' + esc(c.loc) + '</span></a>';
        }).join('') + '</p>' : '') +
        '</li>';
    }).join('');
    var goro = (g.goro || []).map(function (x) {
      return '<div class="tr-goro"><p class="tr-goro-g"><span class="tr-goro-k">語呂</span>' + esc(x.g) + '</p><ul>' +
        x.dec.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    var figs = (g.figs || []).length ? '<details class="tr-zu"><summary><span class="tr-zu-k">図説</span>' +
      esc(g.figs.map(function (f) { return f.cap; }).join('／')) + '<span class="tr-open" aria-hidden="true">ひらく</span></summary><div class="tr-zu-b">' +
      g.figs.map(function (f) {
        return '<figure><a href="' + esc(f.src) + '" target="_blank" rel="noopener"><img src="' + esc(f.src) + '" width="' + f.w + '" height="' + f.h +
          '" alt="' + esc(f.alt) + '" loading="lazy" decoding="async"></a><figcaption>' + esc(f.cap) + '（タップで拡大）</figcaption></figure>';
      }).join('') + '</div></details>' : '';
    return '<details class="tr-group" id="' + esc(g.id) + '"><summary><span class="tr-g-name">' + esc(g.name) + '</span>' +
      '<span class="tr-g-meta">' + g.items.length + '項目' + (g.hot ? '・頻出' + g.hot : '') + '</span><span class="tr-open" aria-hidden="true">ひらく</span></summary>' +
      '<div class="tr-g-b"><p class="tr-g-lead">' + esc(g.lead) + '</p>' + figs + '<ul class="tr-items">' + items + '</ul>' + goro + '</div></details>';
  }).join('');
  h += '<p class="tr-src">' + esc(D.note) + '</p>';
  root.innerHTML = h;
  function openTarget() {
    var id = decodeURIComponent(location.hash.replace(/^#/, ''));
    var el = id && document.getElementById(id);
    if (!el) return;
    var g = el.closest('details.tr-group'); if (g) g.open = true;
    el.scrollIntoView({ block: 'start' });
  }
  window.addEventListener('hashchange', openTarget); openTarget();
  var all = document.getElementById('trOpenAll');
  all.addEventListener('click', function () {
    var on = all.getAttribute('aria-pressed') !== 'true';
    all.setAttribute('aria-pressed', on ? 'true' : 'false'); all.textContent = on ? 'すべて閉じる' : 'すべて開く';
    root.querySelectorAll('details.tr-group').forEach(function (d) { d.open = on; });
  });
})();
