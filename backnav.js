/* 「← 戻る」ボタン（ホーム画面に追加したアプリ＝スタンドアロン表示のときだけ）。
 * ブラウザの戻るボタンが無い表示で、左下に小さく出す。ブラウザで開いているときは何もしない。
 * ・アプリ内の履歴があれば history.back()、無ければポータルのホームへ。
 * ・履歴の深さは各履歴エントリの history.state.bnDepth と、sessionStorage（直前のページの深さ）で数える。
 * ・ページ内の # 移動（目次・アコーディオン・つながりのリンク）や pushState も1歩として戻れる。
 * ・同じサイト内のページを別タブで開くリンク（target=_blank）は、この表示では同じ画面で開く（戻れるように）。
 * 両ポータル共通の型から色だけ変えて書き出している（2つのポータルで同じ動き）。 */
(function () {
  'use strict';
  var me = document.currentScript;
  var HOME = new URL('./', (me && me.src) || location.href).href; // このファイルはサイト直下に置く
  var BASE = new URL(HOME).pathname;
  function standalone() {
    try {
      if (window.matchMedia && (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches)) return true;
    } catch (e) {}
    return window.navigator.standalone === true;
  }
  if (!standalone() || !window.history || !window.URL) return;

  var KEY = 'portal-back-depth', RESET = 'portal-back-reset';
  function ss(k, v) {
    try {
      if (v === undefined) return window.sessionStorage.getItem(k);
      if (v === null) window.sessionStorage.removeItem(k);
      else window.sessionStorage.setItem(k, String(v));
    } catch (e) {}
    return null;
  }
  var H = window.history, rawReplace = H.replaceState, rawPush = H.pushState, depth = 0;
  function withDepth(state, d) {
    if (state == null) return { bnDepth: d };
    if (typeof state === 'object' && !Array.isArray(state)) {
      var o = {}; for (var k in state) if (Object.prototype.hasOwnProperty.call(state, k)) o[k] = state[k];
      o.bnDepth = d; return o;
    }
    return state;
  }
  function stateDepth() {
    var s = H.state;
    return s && typeof s === 'object' && typeof s.bnDepth === 'number' ? s.bnDepth : null;
  }
  function tag(d) { try { rawReplace.call(H, withDepth(H.state, d), '', location.href); } catch (e) {} }
  function save() { ss(KEY, depth); }
  /* 学習資料などが replaceState(null, …) しても深さを消さない。pushState は1歩進んだと数える */
  H.replaceState = function (state, title, url) { return rawReplace.call(H, withDepth(state, depth), title, url); };
  H.pushState = function (state, title, url) { depth += 1; save(); var r = rawPush.call(H, withDepth(state, depth), title, url); update(); return r; };

  /* このページ（履歴エントリ）の深さを決める */
  if (ss(RESET)) { ss(RESET, null); depth = 0; }
  else if (stateDepth() !== null) depth = stateDepth();             // 戻る・進む・再読み込み
  else { var prev = parseInt(ss(KEY), 10); depth = isNaN(prev) ? 0 : prev + 1; } // 新しく開いたページ
  tag(depth); save();

  /* # 移動：新しいエントリ（state なし）は1歩進む、戻る・進むで来たエントリは記録した深さ */
  function sync() {
    var d = stateDepth();
    if (d === null) { depth += 1; tag(depth); } else depth = d;
    save(); update();
  }
  window.addEventListener('popstate', sync, true);
  window.addEventListener('hashchange', sync, true);
  window.addEventListener('pageshow', function (e) { if (e.persisted) { var d = stateDepth(); if (d !== null) depth = d; save(); update(); } });

  function isHome() { var p = location.pathname; return p === BASE || p === BASE + 'index.html'; }
  function goHome() { ss(RESET, '1'); location.replace(HOME); }
  var pending = 0, WATCH = ['pagehide', 'beforeunload', 'popstate', 'hashchange'];
  function goBack() {
    if (depth <= 0) { goHome(); return; }
    if (pending) return; // 連打しても1歩ずつ
    var left = false;
    function stop() { WATCH.forEach(function (t) { window.removeEventListener(t, gone); }); clearTimeout(pending); pending = 0; }
    function gone() { left = true; stop(); }
    WATCH.forEach(function (t) { window.addEventListener(t, gone); });
    /* 戻る先が無かった（履歴が消えていた）ときだけホームへ */
    pending = setTimeout(function () { stop(); if (!left) goHome(); }, 1500);
    H.back();
  }

  /* 同じサイト内のページへの target=_blank は同じ画面で開く（画像・PDF などはそのまま） */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[target="_blank"][href]') : null;
    if (!a) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || u.pathname.indexOf(BASE) !== 0) return;
    if (!/(\/|\.html)$/.test(u.pathname)) return;
    e.preventDefault();
    location.href = u.href;
  }, true);

  var btn = null, space = null;
  function update() { if (btn) { btn.hidden = depth <= 0 && isHome(); avoid(); } }
  /* 狭い画面で下に広がる「ポータルへ戻る」などの固定ボタンがあれば、その上に出す */
  var AVOID = '.portal-return,.portal-dock,.jkq-return,[data-portal-back-avoid]';
  function avoid() {
    if (!btn || btn.hidden) return;
    btn.style.bottom = '';
    var b = btn.getBoundingClientRect(), lift = 0, list = document.querySelectorAll(AVOID), vh = window.innerHeight;
    for (var i = 0; i < list.length; i++) {
      var cs = window.getComputedStyle(list[i]);
      if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') continue;
      var r = list[i].getBoundingClientRect();
      if (!r.width || !r.height || r.height > vh * 0.4) continue;
      if (r.right <= b.left || r.left >= b.right || r.bottom <= b.top || r.top >= b.bottom) continue;
      lift = Math.max(lift, Math.ceil(vh - r.top + 8));
    }
    if (lift) btn.style.bottom = lift + 'px';
    if (space) space.style.height = lift ? (lift + 72) + 'px' : '';
  }
  var later = 0;
  function avoidSoon() { clearTimeout(later); later = setTimeout(avoid, 60); }
  var CSS = '.portal-back{position:fixed;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:1500;' +
    'display:inline-flex;align-items:center;justify-content:center;gap:2px;min-width:48px;min-height:44px;margin:0;padding:8px 14px;' +
    'border:2px solid rgba(255,255,255,.88);border-radius:999px;background:#0c4a40;color:#fff;' +
    'font:700 15px/1.2 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;letter-spacing:.02em;' +
    'box-shadow:0 6px 18px rgba(8,51,44,.32);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
    '.portal-back:active{background:#08332c}.portal-back:focus-visible{outline:3px solid #f0a24a;outline-offset:2px}' +
    '.portal-back[hidden]{display:none}.portal-back-space{height:88px}' +
    '@media print{.portal-back,.portal-back-space{display:none}}';
  function mount() {
    if (document.querySelector('.portal-back')) return;
    var st = document.createElement('style'); st.setAttribute('data-portal-back', ''); st.textContent = CSS; document.head.appendChild(st);
    space = document.createElement('div'); space.className = 'portal-back-space'; space.setAttribute('aria-hidden', 'true');
    document.body.appendChild(space); // 最後の行がボタンに隠れないように
    btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'portal-back';
    btn.setAttribute('aria-label', '前の画面に戻る');
    btn.textContent = '← 戻る';
    btn.addEventListener('click', goBack);
    document.body.appendChild(btn);
    update();
    window.addEventListener('resize', avoidSoon);
    window.addEventListener('load', avoidSoon);
    document.addEventListener('click', avoidSoon); // 画面の切り替えで固定ボタンが出入りしたとき
  }
  window.PortalBack = { depth: function () { return depth; }, back: goBack, home: goHome };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
