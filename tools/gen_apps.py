#!/usr/bin/env python3
"""anatomy/ をテンプレートに、解剖学・生理学の index.html を生成（app.js / styles.css は anatomy/ を基に physiology/ へ複製）"""
import os, re, shutil
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TPL = open(R + "/tools/app_index.tpl.html").read()
CFG = {
  "anatomy": dict(NAME="解剖学", KEY="ana", TITLE="解剖学 過去問", DESC="はり師・きゅう師 国家試験の解剖学の過去問を、回別・分野別・ランダムで練習できるアプリ", NF="A1〜A11の11分野"),
  "physiology": dict(NAME="生理学", KEY="phy", TITLE="生理学 過去問", DESC="はり師・きゅう師 国家試験の生理学の過去問を、回別・分野別・ランダムで練習できるアプリ", NF="P1〜P16の16分野"),
}
for d, c in CFG.items():
    h = TPL
    for k, v in c.items(): h = h.replace("{{%s}}" % k, v)
    open(f"{R}/{d}/index.html", "w").write(h)
a = open(R + "/anatomy/app.js").read()
open(R + "/physiology/app.js", "w").write(a.replace('const SUBJECT_KEY = "ana";', 'const SUBJECT_KEY = "phy";').replace("hk-anatomy-history-v1", "hk-physiology-history-v1"))
shutil.copy(R + "/anatomy/styles.css", R + "/physiology/styles.css")

# 臨床医学総論・各論（2026-11 追加）：anatomy/app.js を基に。学習資料はまだ無いので資料リンクは出さない
CLIN = {
  "rinsho-soron": dict(NAME="臨床医学総論", KEY="sor", TITLE="臨床医学総論 過去問", DESC="はり師・きゅう師 国家試験の臨床医学総論の過去問を、回別・分野別・ランダムで練習できるアプリ", NF="大項目（症候・診察法・臨床検査法・治療法など）に当てはめたもの。収録は第1〜34回（第26回以降の正答は財団の正答肢表、第25回以前は問題集の正答）"),
  "rinsho-kakuron": dict(NAME="臨床医学各論", KEY="kak", TITLE="臨床医学各論 過去問", DESC="はり師・きゅう師 国家試験の臨床医学各論の過去問を、回別・分野別・ランダムで練習できるアプリ", NF="大項目（感染症・神経・呼吸器・循環器など）に当てはめたもの。収録は第1〜34回（第26回以降の正答は財団の正答肢表、第25回以前は問題集の正答）。症例問題は「」内が症例文"),
}
for d, c in CLIN.items():
    h = TPL
    for k, v in c.items(): h = h.replace("{{%s}}" % k, v)
    h = h.replace("<li><strong>分野別</strong><span>出題基準の大項目ごと</span></li>", "<li><strong>分野別</strong><span>出題基準の大項目ごと（中項目でさらに絞れる）</span></li>")
    h = h.replace("※この問題は公式の正答表が見つからず、内容から正答を判断しています。", "【推定】この問題は公式の正答表が見つからないため、内容から判断した正答です。")
    h = h.replace('<link rel="stylesheet" href="./styles.css', '<style>#question-text{white-space:pre-line}</style>\n    <link rel="stylesheet" href="./styles.css')
    open(f"{R}/{d}/index.html", "w").write(h)
    js = a.replace('const SUBJECT_KEY = "ana";', 'const SUBJECT_KEY = "%s";' % c["KEY"]).replace("hk-anatomy-history-v1", "hk-%s-history-v1" % d)
    js = js.replace('if (!guideLinks) guideLinks = fetch("../guide/qlinks.json").then((response) => (response.ok ? response.json() : null)).catch(() => null);', 'if (!guideLinks) guideLinks = Promise.resolve(null); // 臨床医学の学習資料は準備中')
    assert "Promise.resolve(null)" in js and ('"%s"' % c["KEY"]) in js
    open(f"{R}/{d}/app.js", "w").write(js)
    shutil.copy(R + "/anatomy/styles.css", f"{R}/{d}/styles.css")
