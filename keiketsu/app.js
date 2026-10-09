const els = {
  loading: document.getElementById("loading-view"),
  setup: document.getElementById("setup-view"),
  quiz: document.getElementById("quiz-view"),
  result: document.getElementById("result-view"),
  error: document.getElementById("error-view"),
  headerTotal: document.getElementById("header-total"),
  examSelect: document.getElementById("exam-select"),
  fieldSelect: document.getElementById("field-select"),
  fieldWrap: document.getElementById("field-wrap"),
  subSelect: document.getElementById("sub-select"),
  subWrap: document.getElementById("sub-wrap"),
  inferredNote: document.getElementById("inferred-note"),
  historySummary: document.getElementById("history-summary"),
  startButton: document.getElementById("start-button"),
  reviewSavedButton: document.getElementById("review-saved-button"),
  quitButton: document.getElementById("quit-button"),
  progressCurrent: document.getElementById("progress-current"),
  progressTotal: document.getElementById("progress-total"),
  progressBar: document.getElementById("progress-bar"),
  sourceBadge: document.getElementById("source-badge"),
  multiNote: document.getElementById("multi-note"),
  questionText: document.getElementById("question-text"),
  choices: document.getElementById("choices"),
  submitAnswerButton: document.getElementById("submit-answer-button"),
  feedback: document.getElementById("feedback"),
  feedbackIcon: document.getElementById("feedback-icon"),
  feedbackLabel: document.getElementById("feedback-label"),
  feedbackAnswer: document.getElementById("feedback-answer"),
  feedbackExplanation: document.getElementById("feedback-explanation"),
  nextButton: document.getElementById("next-button"),
  scoreRing: document.getElementById("score-ring"),
  scorePercent: document.getElementById("score-percent"),
  scoreCorrect: document.getElementById("score-correct"),
  scoreTotal: document.getElementById("score-total"),
  resultMessage: document.getElementById("result-message"),
  retryWrongButton: document.getElementById("retry-wrong-button"),
  backToSetupButton: document.getElementById("back-to-setup-button"),
  resetHistoryButton: document.getElementById("reset-history-button"),
};

const SUBJECT_KEY = "kei"; // JKGame の科目キー（経絡経穴概論）
const HISTORY_KEY = "hk-keiketsu-history-v1";
let questions = [];
let queue = [];
let position = 0;
let selected = new Set();
let answered = false;
let correctCount = 0;
let wrongQuestions = [];
let history = readHistory();

function questionId(question) {
  return `${question.exam}-${question.number}`;
}

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || {};
  } catch {
    return {};
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function show(view) {
  [els.loading, els.setup, els.quiz, els.result, els.error].forEach((item) => item.classList.add("is-hidden"));
  view.classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

let fieldData = null;

function fieldOf(question) {
  return fieldData ? fieldData.map[questionId(question)] : undefined;
}

function refreshFieldOptions() {
  if (!fieldData) return;
  const exam = els.examSelect.value;
  const inExam = exam === "all" ? questions : questions.filter((question) => question.exam === Number(exam));
  const previous = els.fieldSelect.value;
  els.fieldSelect.innerHTML = "";
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = `すべての分野（${inExam.length}問）`;
  els.fieldSelect.appendChild(all);
  fieldData.fields.forEach((field) => {
    const count = inExam.filter((question) => fieldOf(question) === field.id).length;
    const option = document.createElement("option");
    option.value = field.id;
    option.textContent = `${field.name}（${count}問）`;
    option.disabled = count === 0;
    els.fieldSelect.appendChild(option);
  });
  const keep = [...els.fieldSelect.options].some((option) => option.value === previous && !option.disabled);
  els.fieldSelect.value = keep ? previous : "all";
  refreshSubOptions();
  updateStartLabel();
}

function subOf(question) {
  return fieldData && fieldData.submap ? fieldData.submap[questionId(question)] : undefined;
}

// 中項目（サブ分野）：分野を選んだときだけ表示する任意の絞り込み
function refreshSubOptions() {
  if (!els.subSelect || !els.subWrap) return;
  const fid = els.fieldSelect.value;
  const subs = fieldData && fieldData.sub && fid !== "all" ? fieldData.sub.filter((item) => item.field === fid) : [];
  const previous = els.subSelect.value;
  els.subSelect.innerHTML = "";
  els.subWrap.classList.toggle("is-hidden", subs.length < 2);
  if (subs.length < 2) return;
  const exam = els.examSelect.value;
  const inExam = (exam === "all" ? questions : questions.filter((question) => question.exam === Number(exam))).filter((question) => fieldOf(question) === fid);
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = `この分野すべて（${inExam.length}問）`;
  els.subSelect.appendChild(all);
  subs.forEach((item) => {
    const count = inExam.filter((question) => subOf(question) === item.id).length;
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.name}（${count}問）`;
    option.disabled = count === 0;
    els.subSelect.appendChild(option);
  });
  const keep = [...els.subSelect.options].some((option) => option.value === previous && !option.disabled);
  els.subSelect.value = keep ? previous : "all";
  updateStartLabel();
}

function onFieldChange() {
  refreshSubOptions();
  updateStartLabel();
}

function updateStartLabel() {
  const label = els.startButton.querySelector("span");
  if (!label) return;
  const sub = els.subSelect && !els.subWrap.classList.contains("is-hidden") && els.subSelect.value !== "all";
  label.textContent = els.fieldSelect.value === "all" ? "ランダムに開始" : sub ? "このサブ分野で開始" : "この分野で開始";
}

function loadFields() {
  return fetch("./fields.json")
    .then((response) => {
      if (!response.ok) throw new Error("fields unavailable");
      return response.json();
    })
    .then((data) => {
      fieldData = data;
      els.fieldWrap.classList.remove("is-hidden");
      refreshFieldOptions();
    })
    .catch(() => {
      fieldData = null;
    });
}

// おみくじなどから ?field=分野ID で来たら、その分野を選んでそのまま出題を始める（分野別モードと同じ出題）
function launchFromField() {
  const search = location.search;
  const f = new URLSearchParams(search).get("field");
  if (!f) return;
  window.history.replaceState(null, "", location.pathname);
  if (!fieldData || ![...els.fieldSelect.options].some((option) => option.value === f && !option.disabled)) return;
  els.fieldSelect.value = f;
  refreshSubOptions();
  // ?sub=中項目ID（例 A3-B）なら、その中項目だけに絞って始める（学習資料の「過去問を解く」から）
  const sub = new URLSearchParams(search).get("sub");
  if (sub && els.subSelect && [...els.subSelect.options].some((option) => option.value === sub && !option.disabled)) els.subSelect.value = sub;
  updateStartLabel();
  els.startButton.click();
}

// 学習資料などから ?q=回-問（1問）／?qs=回-問,回-問,…（複数）で来たら、その問題だけで出題を始める
function launchFromIds() {
  const params = new URLSearchParams(location.search);
  const raw = params.get("qs") || params.get("q");
  if (!raw) return false;
  window.history.replaceState(null, "", location.pathname);
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 60);
  const byId = new Map(questions.map((question) => [questionId(question), question]));
  const items = ids.map((id) => byId.get(id)).filter(Boolean);
  if (!items.length) return false;
  startQuiz(items);
  return true;
}

function populateSetup() {
  const exams = [...new Set(questions.map((question) => question.exam))].sort((a, b) => b - a);
  exams.forEach((exam) => {
    const count = questions.filter((question) => question.exam === exam).length;
    const option = document.createElement("option");
    option.value = String(exam);
    option.textContent = `第${exam}回（${count}問）`;
    els.examSelect.appendChild(option);
  });
  els.headerTotal.textContent = `${questions.length}問収録`;
  if (exams.length) els.examSelect.options[0].textContent = `第${exams[exams.length - 1]}〜${exams[0]}回・すべて（${questions.length}問）`;
  updateHistorySummary();
}

function updateHistorySummary() {
  const attempted = Object.keys(history).length;
  const weak = questions.filter((question) => {
    const stats = history[questionId(question)];
    return stats && stats.wrong > 0 && stats.correct / stats.attempts < 0.7;
  }).length;

  els.historySummary.innerHTML = attempted
    ? `<strong>${attempted}</strong>問に挑戦<br>苦手 ${weak}問`
    : "まだ記録はありません";
  els.reviewSavedButton.classList.toggle("is-hidden", weak === 0);
  els.resetHistoryButton.classList.toggle("is-hidden", attempted === 0);
}

function selectedCount() {
  return document.querySelector('input[name="count"]:checked').value;
}

function startFromSetup() {
  const exam = els.examSelect.value;
  let pool = exam === "all" ? questions : questions.filter((question) => question.exam === Number(exam));
  if (fieldData && els.fieldSelect.value !== "all") pool = pool.filter((question) => fieldOf(question) === els.fieldSelect.value);
  if (fieldData && els.subSelect && !els.subWrap.classList.contains("is-hidden") && els.subSelect.value !== "all") pool = pool.filter((question) => subOf(question) === els.subSelect.value);
  const requested = selectedCount();
  if (requested !== "all") pool = shuffled(pool).slice(0, Number(requested));
  else pool = shuffled(pool);
  startQuiz(pool);
}

function startSavedReview() {
  const pool = questions.filter((question) => {
    const stats = history[questionId(question)];
    return stats && stats.wrong > 0 && stats.correct / stats.attempts < 0.7;
  });
  startQuiz(shuffled(pool));
}

function startQuiz(items) {
  if (!items.length) return;
  queue = items;
  position = 0;
  correctCount = 0;
  wrongQuestions = [];
  show(els.quiz);
  renderQuestion();
}

const MULTI_NOTE = "※正解は複数あります。どれか1つを選んで";

function renderQuestion() {
  const question = queue[position];
  selected = new Set();
  answered = false;
  const isMulti = question.answers.length > 1;

  els.progressCurrent.textContent = String(position + 1);
  els.progressTotal.textContent = String(queue.length);
  els.progressBar.style.width = `${((position + 1) / queue.length) * 100}%`;
  const fieldName = fieldData && fieldData.fields.find((field) => field.id === fieldOf(question));
  els.sourceBadge.textContent = `第${question.exam}回・問題${question.number}` + (fieldName ? `・${fieldName.name}` : "");
  els.questionText.textContent = question.question;
  els.multiNote.classList.toggle("is-hidden", !isMulti);
  if (isMulti) els.multiNote.textContent = MULTI_NOTE; // 複数正解＝どれか1つを選べば正解（単一選択）
  els.submitAnswerButton.classList.remove("is-hidden");
  els.submitAnswerButton.disabled = true;
  els.feedback.className = "feedback is-hidden";
  els.choices.replaceChildren();

  question.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.dataset.index = String(index);
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<span class="choice-number">${index + 1}</span><span>${escapeHtml(choice)}</span>`;
    button.addEventListener("click", () => choose(index, false, button)); // 複数正解の問題も単一選択
    els.choices.appendChild(button);
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));
}

function choose(index, isMulti, button) {
  if (answered) return;
  if (!isMulti) {
    [...els.choices.children].forEach((choiceButton) => {
      choiceButton.classList.remove("is-selected");
      choiceButton.setAttribute("aria-pressed", "false");
    });
    selected = new Set([index]);
    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");
  } else if (selected.has(index)) {
    selected.delete(index);
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  } else {
    selected.add(index);
    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");
  }
  els.submitAnswerButton.disabled = selected.size === 0;
}


// 解説は現在空。あるときだけ表示し、ないときはブロックごと隠す
function renderExplanation(question) {
  const text = String(question.explanation || "").trim();
  els.feedbackExplanation.replaceChildren();
  els.feedbackExplanation.classList.toggle("is-hidden", !text);
  if (!text) return;
  const block = document.createElement("section");
  block.className = "explanation-block";
  const heading = document.createElement("strong");
  heading.textContent = "解説";
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  block.append(heading, paragraph);
  els.feedbackExplanation.appendChild(block);
}

function submitAnswer() {
  if (answered || selected.size === 0) return;
  answered = true;
  const question = queue[position];
  const answers = new Set(question.answers);
  const correct = selected.size === 1 && answers.has([...selected][0]); // 正解の選択肢のどれか1つを選べば正解
  const id = questionId(question);
  const stats = history[id] || { attempts: 0, correct: 0, wrong: 0 };
  stats.attempts += 1;
  if (correct) {
    stats.correct += 1;
    correctCount += 1;
  } else {
    stats.wrong += 1;
    wrongQuestions.push(question);
  }
  history[id] = stats;
  saveHistory();
  if (window.JKGame) JKGame.record(SUBJECT_KEY, questionId(question), correct);
  paintAnswer(question, correct);
}

// 答えたあとの表示（記録はしない）。学習資料から戻ったときの復元でも使う
function paintAnswer(question, correct) {
  const answers = new Set(question.answers);
  [...els.choices.children].forEach((button, index) => {
    button.disabled = true;
    button.classList.remove("is-selected");
    if (answers.has(index)) button.classList.add("is-correct");
    else if (selected.has(index)) button.classList.add("is-wrong");
  });

  els.submitAnswerButton.classList.add("is-hidden");
  els.feedback.className = `feedback ${correct ? "is-correct" : "is-wrong"}`;
  els.feedbackIcon.textContent = correct ? "✓" : "×";
  els.feedbackLabel.textContent = correct ? "正解" : "不正解";
  els.feedbackAnswer.textContent = `${question.answers.length > 1 ? "正解（どれか1つでOK）" : "正解"}：${question.answers.map((index) => `${index + 1}．${question.choices[index]}`).join("／")}`;
  renderExplanation(question);
  renderGuideLink(question);
  // 第25回以前は公式の正答表がないので、問題集の正答を使っていることを小さく示す
  if (els.inferredNote) els.inferredNote.classList.toggle("is-hidden", !String(question.basis || "").startsWith("book"));
  els.nextButton.textContent = position === queue.length - 1 ? "結果を見る" : "次の問題へ";
  els.feedback.classList.remove("is-hidden");
  els.nextButton.focus({ preventScroll: true });
}

// この問題に結び付けた学習資料：questions.json の links（経穴・経絡ページの経穴／経絡の見出しへ。主1つ＋関連最大2つ）
function loadGuideLinks() { return Promise.resolve(null); }
function renderGuideLink(question) {
  const box = document.getElementById("guide-link");
  if (!box) return;
  box.replaceChildren();
  const links = question.links || [];
  box.classList.toggle("is-hidden", !links.length);
  if (!links.length) return;
  const label = document.createElement("span");
  label.className = "guide-link-label";
  label.textContent = "関連資料";
  box.appendChild(label);
  links.forEach((item, index) => {
    const link = document.createElement("a");
    link.href = item.href;
    link.className = index === 0 ? "guide-link-main" : "guide-link-sub";
    link.textContent = (index === 0 ? "📖 " : "関連：") + item.t;
    box.appendChild(link);
  });
}

// ---- 学習資料へ移って戻ってきたとき、出題の位置（何問目・答えたか・スクロール）を戻す ----
// このタブの sessionStorage だけに置く。戻る／再読み込みで開いたときだけ使う
const RESUME_KEY = "hk-resume:" + location.pathname;
function saveResume() {
  try {
    if (els.quiz.classList.contains("is-hidden") || !queue.length) { sessionStorage.removeItem(RESUME_KEY); return; }
    sessionStorage.setItem(RESUME_KEY, JSON.stringify({
      t: Date.now(), ids: queue.map(questionId), position, correctCount,
      wrong: wrongQuestions.map(questionId), answered, selected: [...selected], y: window.scrollY,
    }));
  } catch (error) { /* 保存できなくても出題は続けられる */ }
}
function takeResume() {
  try {
    const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    if (!nav || (nav.type !== "back_forward" && nav.type !== "reload")) return null;
    const saved = JSON.parse(sessionStorage.getItem(RESUME_KEY) || "null");
    return saved && Date.now() - saved.t < 12 * 60 * 60 * 1000 ? saved : null;
  } catch (error) {
    return null;
  }
}
function resumeQuiz() {
  const saved = takeResume();
  if (!saved || !Array.isArray(saved.ids)) return false;
  const byId = new Map(questions.map((question) => [questionId(question), question]));
  const items = saved.ids.map((id) => byId.get(id));
  if (!items.length || items.some((question) => !question) || !(saved.position >= 0 && saved.position < items.length)) return false;
  queue = items;
  position = saved.position;
  correctCount = saved.correctCount || 0;
  wrongQuestions = (saved.wrong || []).map((id) => byId.get(id)).filter(Boolean);
  show(els.quiz);
  renderQuestion();
  const picked = (saved.selected || []).filter((index) => els.choices.children[index]);
  if (saved.answered && picked.length) {
    const question = queue[position];
    selected = new Set(picked);
    answered = true;
    paintAnswer(question, selected.size === 1 && new Set(question.answers).has([...selected][0]));
  } else if (picked.length) {
    choose(picked[0], false, els.choices.children[picked[0]]);
  }
  const y = Number(saved.y) || 0;
  const scroll = () => window.scrollTo({ top: y, behavior: "instant" });
  requestAnimationFrame(() => requestAnimationFrame(scroll));
  loadGuideLinks().then(() => requestAnimationFrame(scroll));
  return true;
}
// 資料リンクを押した時点の位置を残す（離れる途中のスクロールで上書きしない）
let resumeClickAt = 0;
window.addEventListener("pagehide", () => { if (Date.now() - resumeClickAt > 3000) saveResume(); });
const guideLinkBox = document.getElementById("guide-link");
if (guideLinkBox) guideLinkBox.addEventListener("click", (event) => { if (event.target.closest("a")) { saveResume(); resumeClickAt = Date.now(); } });

function nextQuestion() {
  if (position < queue.length - 1) {
    position += 1;
    renderQuestion();
    return;
  }
  showResult();
}

function showResult() {
  const percent = Math.round((correctCount / queue.length) * 100);
  els.scorePercent.textContent = String(percent);
  els.scoreCorrect.textContent = String(correctCount);
  els.scoreTotal.textContent = String(queue.length);
  els.scoreRing.style.background = `conic-gradient(var(--blue) ${percent * 3.6}deg, #e7ecf4 0deg)`;
  els.resultMessage.textContent = percent === 100
    ? "全問正解。"
    : percent >= 80
      ? "あと少し。間違えた問題だけ確認しよう。"
      : "間違えた問題から、もう一度。";
  els.retryWrongButton.classList.toggle("is-hidden", wrongQuestions.length === 0);
  show(els.result);
}

els.startButton.addEventListener("click", startFromSetup);
els.examSelect.addEventListener("change", refreshFieldOptions);
els.fieldSelect.addEventListener("change", onFieldChange);
els.subSelect.addEventListener("change", updateStartLabel);
els.reviewSavedButton.addEventListener("click", startSavedReview);
els.submitAnswerButton.addEventListener("click", submitAnswer);
els.nextButton.addEventListener("click", nextQuestion);
els.retryWrongButton.addEventListener("click", () => startQuiz(shuffled(wrongQuestions)));
els.backToSetupButton.addEventListener("click", () => {
  updateHistorySummary();
  show(els.setup);
});
els.quitButton.addEventListener("click", () => {
  updateHistorySummary();
  show(els.setup);
});
els.resetHistoryButton.addEventListener("click", () => {
  if (!window.confirm("この端末の学習記録をすべて消しますか？")) return;
  history = {};
  localStorage.removeItem(HISTORY_KEY);
  updateHistorySummary();
});

fetch("./questions.json")
  .then((response) => {
    if (!response.ok) throw new Error("questions unavailable");
    return response.json();
  })
  .then((data) => {
    questions = data;
    populateSetup();
    loadFields().then(() => { if (!resumeQuiz() && !launchFromIds()) launchFromField(); });
    show(els.setup);
  })
  .catch(() => show(els.error));
