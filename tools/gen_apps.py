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
