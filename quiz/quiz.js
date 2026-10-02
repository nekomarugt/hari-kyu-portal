/* 4択クイズ（10・30・50問）／まちがえた問題だけ復習。過去問JSON（anatomy/・physiology/ の questions.json）を読み込んで出題（重複なし）。 */
(function () {
  "use strict";
  var G = window.JKGame;
  var ROOT = G.rootUrl;
  var C = G.constants;
  var NAMES = C.SUBJ, PAGES = C.SUBJ_PAGE;
  var PAGE2S = { anatomy: "ana", physiology: "phy" };
    var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  if (params.get("mode") === "weak") history.replaceState(null, "", location.pathname + "?s=" + (params.get("s") || ""));
  var st = {
    subj: PAGE2S[params.get("s")] || "phy",
    n: [10, 30, 50].indexOf(+params.get("n")) >= 0 ? +params.get("n") : 10,
    queue: [], pos: 0, score: 0, wrong: [], xp: 0, coins: 0, secs: 0, t0: 0, mode: "quiz", sel: new Set(), answered: false
  };
  var cache = { past: {} };

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function view(name) {
    ["setup", "loading", "quiz", "result", "error"].forEach(function (v) { $("v-" + v).hidden = v !== name; });
    window.scrollTo(0, 0);
  }

  /* ---- data loading（過去問JSONのみ。4択） ---- */
  function loadPast(subj) {
    if (cache.past[subj]) return Promise.resolve(cache.past[subj]);
    return fetch(ROOT + PAGES[subj] + "/questions.json").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      var list = d.map(function (q) {
        return { kind: "mc", src: subj, id: q.exam + "-" + q.number, text: q.question, choices: q.choices, answers: q.answers,
          expl: q.explanation || "", inferred: !!q.inferred, label: "第" + q.exam + "回 問" + q.number };
      });
      cache.past[subj] = list; return list;
    });
  }

  /* ---- setup ---- */
  var HEAD = "4択クイズ";
  function renderSetup() {
    document.querySelectorAll("[data-subj]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.subj === st.subj)); });
    document.querySelectorAll("[data-n]").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.n === st.n)); });
    var wc = G.weakIds(st.subj).length;
    $("weak-btn").hidden = wc === 0;
    $("weak-btn-n").textContent = String(wc);
    $("no-weak").hidden = wc !== 0;
    $("start-label").textContent = st.n + "問スタート →";
    $("type-note").textContent = "4択の過去問から、ぴったり" + st.n + "問。" + (st.n === 30 ? "完走ボーナス +5コイン（1日1回）。" : st.n === 50 ? "完走ボーナス +10コイン（1日1回）。" : "");
  }
  function start(mode) {
    st.mode = mode; view("loading");
    document.querySelector(".jkq-head h1").textContent = mode === "weak" ? "まちがえた問題の復習" : HEAD;
    loadPast(st.subj).then(function (list) {
      var pool = list;
      if (mode === "weak") {
        var byId = {}; list.forEach(function (q) { byId[q.id] = q; });
        pool = G.weakIds(st.subj).map(function (id) { return byId[id]; }).filter(Boolean);
      }
      if (!pool.length) { renderSetup(); view("setup"); return; }
      var n = mode === "weak" ? 10 : st.n;
      st.queue = shuffle(pool).slice(0, n); // 重複なし
      st.N = st.queue.length; st.pos = 0; st.score = 0; st.wrong = []; st.xp = 0; st.coins = 0; st.secs = 0;
      view("quiz"); renderQ();
    }).catch(function () { view("error"); });
  }

  /* ---- quiz ---- */
  function renderQ() {
    var q = st.queue[st.pos]; st.sel = new Set(); st.answered = false; st.t0 = Date.now();
    $("prog-n").textContent = String(st.pos + 1); $("prog-t").textContent = String(st.N);
    $("prog-bar").style.width = ((st.pos + 1) / st.N * 100) + "%";
    $("q-label").textContent = (st.mode !== "quiz" ? "復習｜" : "") + q.label;
    $("q-text").textContent = q.text;
    $("fb").hidden = true; $("fb").className = "jkq-fb";
    var box = $("choices"); box.innerHTML = "";
    $("submit").hidden = false; $("submit").disabled = true;
    $("multi-note").hidden = !(q.answers.length > 1);
    if (q.answers.length > 1) $("multi-note").textContent = "※正解は複数あります。どれか1つを選んで"; // どれか1つを選べば正解
    {
      q.choices.forEach(function (c, i) {
        var b = document.createElement("button"); b.type = "button"; b.className = "jkq-choice"; b.setAttribute("aria-pressed", "false");
        var n = document.createElement("span"); n.className = "jkq-cn"; n.textContent = String(i + 1);
        var t = document.createElement("span"); t.textContent = c; b.appendChild(n); b.appendChild(t);
        b.addEventListener("click", function () { pick(i, b, false); }); // 複数正解の問題も単一選択
        box.appendChild(b);
      });
    }
  }
  function pick(i, btn, multi) {
    if (st.answered) return;
    var all = $("choices").children;
    if (!multi) { st.sel = new Set([i]); for (var k = 0; k < all.length; k++) { all[k].classList.remove("is-sel"); all[k].setAttribute("aria-pressed", "false"); } btn.classList.add("is-sel"); btn.setAttribute("aria-pressed", "true"); }
    else if (st.sel.has(i)) { st.sel.delete(i); btn.classList.remove("is-sel"); btn.setAttribute("aria-pressed", "false"); }
    else { st.sel.add(i); btn.classList.add("is-sel"); btn.setAttribute("aria-pressed", "true"); }
    $("submit").disabled = st.sel.size === 0;
  }
  function grade(q, ok) {
    if (ok) st.score++; else st.wrong.push(q);
    var ms = Date.now() - st.t0; st.secs += Math.min(ms, 120000) / 1000;
    var ev = G.record(q.src, q.id, ok, undefined, { ms: ms });
    if (ev && ev.fast) st.fastN = (st.fastN || 0) + 1;
    if (ev) { st.xp += ev.xp; st.coins += ev.coins || 0; }
  }
  function submit() {
    var q = st.queue[st.pos]; if (st.answered || !st.sel.size) return; st.answered = true;
    var ans = new Set(q.answers), ok = st.sel.size === 1 && ans.has(Array.from(st.sel)[0]); // 正解のどれか1つを選べば正解
    var bs = $("choices").children;
    for (var i = 0; i < bs.length; i++) { bs[i].disabled = true; bs[i].classList.remove("is-sel"); if (ans.has(i)) bs[i].classList.add("is-ok"); else if (st.sel.has(i)) bs[i].classList.add("is-ng"); }
    $("submit").hidden = true;
    fb(ok, (q.answers.length > 1 ? "正解（どれか1つでOK）：" : "正解：") + q.answers.map(function (a) { return (a + 1) + "．" + q.choices[a]; }).join("／"), q.expl || "");
    $("fb-inf").hidden = !q.inferred;
    $("next").hidden = false; $("next").textContent = st.pos === st.N - 1 ? "結果を見る" : "次の問題へ";
    grade(q, ok); $("next").focus({ preventScroll: true });
  }
  function fb(ok, a, w) {
    var f = $("fb"); f.hidden = false; f.className = "jkq-fb " + (ok === null ? "" : ok ? "is-ok" : "is-ng");
    $("fb-title").textContent = ok === null ? "答え" : ok ? "✓ 正解" : "× 不正解";
    $("fb-ans").textContent = a; $("fb-why").textContent = w; $("fb-why-wrap").hidden = !w;
  }
  function advance() {
    if (st.pos < st.N - 1) { st.pos++; renderQ(); window.scrollTo(0, 0); } else result();
  }

  /* ---- result ---- */
  function result() {
    var total = st.N, pct = Math.round(st.score / total * 100);
    var bonus = st.mode === "quiz" ? G.quizDone(total, st.score, st.secs) : null;
    if (bonus) { st.xp += bonus.xp; st.coins += bonus.coins || 0; }
    $("r-score").textContent = st.score + " / " + total;
    $("r-ring").style.setProperty("--p", pct + "%"); $("r-pct").textContent = pct + "%";
    var msg = pct === 100 ? "全問正解！ すごい！" : pct >= 80 ? "いい調子！ あと少しで満点。" : pct >= 50 ? "半分以上できた。まちがえた所は、次で取り返そう。" : "ここからが伸びどき。まちがえた問題は「復習リスト」に入れたよ。";
    if (st.mode !== "quiz") msg = st.wrong.length ? "あと " + st.wrong.length + " 問。2回つづけて正解すると、リストから外れます。" : "全部できた！ 2回つづけて正解した問題はリストから外れます。";
    $("r-msg").textContent = msg;
    var s = G.streak(), li = G.level();
    $("r-xp").textContent = "+" + st.xp + " XP";
    var note = "";
    if (st.mode === "quiz") {
      if (bonus && bonus.bonus) note = "（完走ボーナス +" + bonus.coins + " を含む）";
      else if (total >= 30 && !(bonus && bonus.xp)) note = "（完走ボーナスは 60%以上正解＋じっくり解いた場合のみ）";
      else if (total >= 30) note = "（完走ボーナスは今日はもう受け取り済み）";
    }
    $("r-coin").textContent = "+" + st.coins + " コイン" + note + "（いま " + G.coins() + "）";
    $("r-streak").textContent = s.n ? s.n + "日連続" : "—";
    $("r-lv").textContent = "Lv" + li.lv + " " + li.title;
    $("r-bar").style.width = li.pct + "%";
    $("r-wrong").hidden = !st.wrong.length;
    $("r-wrong").textContent = "まちがえた問題だけ（" + st.wrong.length + "問）";
    $("r-again").textContent = st.mode === "quiz" ? "もう一回（新しい" + st.n + "問）" : "もう一回（復習リスト）";
    var wc = G.weakIds(st.subj).length;
    $("r-weaknote").textContent = wc ? "復習リスト：いま " + wc + " 問" : "復習リスト：からっぽ。えらい！";
    view("result");
  }

  /* ---- wire ---- */
  document.querySelectorAll("[data-subj]").forEach(function (b) { b.addEventListener("click", function () { st.subj = b.dataset.subj; renderSetup(); }); });
  document.querySelectorAll("[data-n]").forEach(function (b) { b.addEventListener("click", function () { st.n = +b.dataset.n; renderSetup(); }); });
  $("start-btn").addEventListener("click", function () { start("quiz"); });
  $("weak-btn").addEventListener("click", function () { start("weak"); });
  $("submit").addEventListener("click", submit);
  $("next").addEventListener("click", advance);
  function toSetup() { document.querySelector(".jkq-head h1").textContent = HEAD; renderSetup(); view("setup"); }
  $("quit").addEventListener("click", toSetup);
  $("r-again").addEventListener("click", function () { start(st.mode === "quiz" ? "quiz" : "weak"); });
  $("r-wrong").addEventListener("click", function () {
    st.queue = shuffle(st.wrong); st.N = st.queue.length; st.pos = 0; st.score = 0; st.wrong = []; st.xp = 0; st.coins = 0; st.secs = 0; st.mode = "weak-round"; view("quiz"); renderQ();
  });
  $("r-back").addEventListener("click", toSetup);
  $("retry-error").addEventListener("click", toSetup);
  if (params.get("mode") === "weak" && G.weakIds(st.subj).length) start("weak"); else { renderSetup(); view("setup"); }
})();
