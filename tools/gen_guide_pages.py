#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""学習資料のHTMLページを生成（guide/index.html, guide/anatomy|physiology/index.html, guide/coverage/index.html）"""
import os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def head(depth, title, desc, extra_css=""):
    up = "../" * depth
    return f'''<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0c4a40" />
    <!-- PWA -->
    <link rel="manifest" href="{up}manifest.webmanifest" />
    <link rel="icon" href="{up}icons/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="{up}icons/favicon-32.png" sizes="32x32" type="image/png" />
    <link rel="apple-touch-icon" href="{up}icons/apple-touch-icon.png" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="解剖生理" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <script>if("serviceWorker"in navigator){{addEventListener("load",function(){{navigator.serviceWorker.register("{up}sw.js",{{scope:"{up}"}}).catch(function(){{}})}})}}</script>
    <!-- /PWA -->
    <meta name="description" content="{desc}" />
    <title>{title}｜はり師きゅう師 解剖学・生理学ポータル</title>
    <link rel="stylesheet" href="{up}theme.css" />
    <link rel="stylesheet" href="{up}guide/guide.css" />
  </head>
'''
FOOT = '''  </body>
</html>
'''
def viewer(subj, label, short):
    return head(2, f"{label} 学習資料", f"はり師・きゅう師 国家試験の{label}を、出題基準（2026年版）の順に整理した学習資料。各項目から過去問へ、過去問から項目へ行き来できます。") + f'''  <body class="g-body" data-page="viewer" data-subject="{subj}">
    <a class="g-return" href="../">← 学習資料トップへ</a>
    <main class="g-shell">
      <header class="g-head">
        <img class="g-logo" src="../../icons/logo.svg" width="48" height="48" alt="" />
        <div>
          <p class="g-eyebrow">学習資料　基礎の復習と過去問演習</p>
          <h1>{label} 学習資料</h1>
          <p class="g-sub" id="g-sub">出題基準（2026年版）の順に整理</p>
        </div>
      </header>

      <section class="g-tools" aria-label="表示の設定">
        <button id="g-hide" class="g-toggle" type="button" aria-pressed="false">赤字を隠して確認</button>
        <button id="g-openall" class="g-toggle" type="button" aria-pressed="false">すべて開く</button>
        <a class="g-toggle" id="g-practice-all" href="../../{ 'anatomy' if subj=='anatomy' else 'physiology' }/">{label}の過去問へ</a>
        <a class="g-toggle" href="../coverage/#{subj}">出題範囲マップ</a>
      </section>

      <p class="g-legend" id="g-legend"></p>

      <nav class="g-chapters" id="g-chapters" aria-label="分野を選ぶ"></nav>
      <section class="g-stage" id="g-stage" aria-live="polite"><p class="g-loading">読み込んでいます…</p></section>
      <div class="g-pager">
        <button id="g-prev" type="button">← 前の分野</button>
        <button id="g-next" type="button">次の分野 →</button>
      </div>
      <p class="g-src">図・文章は学習用に作成した独自の資料です。出題基準は公益財団法人東洋療法研修試験財団の「出題基準（2026年版）」の大項目・中項目に当てはめたもので、公式の区分そのものではありません。過去問との対応は自動で割り当てた目安です。</p>
    </main>
    <script src="./content.js"></script>
    <script src="../guide.js"></script>
''' + FOOT

def landing():
    return head(1, "学習資料", "解剖学・生理学の学習資料。出題基準（2026年版）の順に整理し、過去問と相互にリンクしています。") + '''  <body class="g-body" data-page="landing">
    <a class="g-return" href="../">← ポータルへ戻る</a>
    <main class="g-shell">
      <header class="g-head">
        <img class="g-logo" src="../icons/logo.svg" width="48" height="48" alt="" />
        <div>
          <p class="g-eyebrow">基礎の復習と過去問演習</p>
          <h1>学習資料</h1>
          <p class="g-sub">出題基準（2026年版）の順に整理。項目ごとに「出題N問」と、その過去問へのリンクつき。</p>
        </div>
      </header>
      <nav class="g-cards" aria-label="学習資料の一覧">
        <a class="g-card" href="./anatomy/"><span class="g-card-no">01</span><div><h2>解剖学</h2><p id="gl-ana">読み込み中…</p><p class="g-card-sub">A1〜A11（人体の構成〜感覚器系）</p></div><span class="g-arrow" aria-hidden="true">→</span></a>
        <a class="g-card" href="./physiology/"><span class="g-card-no">02</span><div><h2>生理学</h2><p id="gl-phy">読み込み中…</p><p class="g-card-sub">P1〜P16（生理学の基礎〜ホメオスタシスと生体リズム）</p></div><span class="g-arrow" aria-hidden="true">→</span></a>
        <a class="g-card g-card-sub" href="./coverage/"><span class="g-card-no">地図</span><div><h2>出題範囲マップ</h2><p>分野ごとに、よく出る所を確認して「資料を読む」「過去問を解く」へ進めます</p></div><span class="g-arrow" aria-hidden="true">→</span></a>
      </nav>
      <section class="g-note">
        <h2>使い方</h2>
        <ul>
          <li>分野（出題基準の大項目）を選び、項目を開くと要点・なぜ・確認問題が読めます。</li>
          <li>項目ごとの「出題N問」は、その項目に結び付けた過去問の数です（自動の割り当てで目安）。「過去問を解く」で、その問題だけを出題します。</li>
          <li>項目の中の「頻出ポイントと出され方」は、その項目に結び付いた過去問の本文・選択肢の語を集計したものです（目安）。</li>
          <li>過去問アプリの解答後にも、その問題に関係する項目へのリンクが出ます。</li>
          <li>「赤字を隠して確認」で、答えの語を隠して覚えているかを確かめられます（タップで1か所ずつ表示）。</li>
        </ul>
        <p class="g-src">登録・ログイン不要、記録は端末内だけに保存されます。</p>
      </section>
    </main>
    <script src="./anatomy/content.js"></script>
    <script src="./physiology/content.js"></script>
    <script src="./guide.js"></script>
''' + FOOT

def coverage():
    return head(2, "出題範囲マップ", "分野ごとに、よく出る所と過去問の数を確認して、資料を読む・過去問を解くへ進めるページ。") + '''  <body class="g-body" data-page="coverage">
    <a class="g-return" href="../">← 学習資料トップへ</a>
    <main class="g-shell">
      <header class="g-head">
        <img class="g-logo" src="../../icons/logo.svg" width="48" height="48" alt="" />
        <div>
          <p class="g-eyebrow">学習資料</p>
          <h1>出題範囲マップ</h1>
          <p class="g-sub">どの分野がよく出るかを見て、「資料を読む」か「過去問を解く」を選びます。</p>
        </div>
      </header>
      <section class="g-tools" aria-label="表示の切りかえ">
        <button class="g-toggle" data-subj="anatomy" aria-pressed="true" type="button">解剖学</button>
        <button class="g-toggle" data-subj="physiology" aria-pressed="false" type="button">生理学</button>
        <button id="cov-sort" class="g-toggle" aria-pressed="false" type="button">頻出順に並べる</button>
        <button id="cov-openall" class="g-toggle" aria-pressed="false" type="button">すべて開く</button>
      </section>
      <p class="g-covnote">分野の名前をタップすると、中の項目が開きます。「頻出」は、過去問でとくによく出ている所のめやすです。「過去問を解く」は、その項目の問題を10問ずつ出します（出す数は過去問のページで変えられます）。</p>
      <div id="cov-body"></div>
    </main>
    <script src="../coverage.js"></script>
    <script src="../anatomy/content.js"></script>
    <script src="../physiology/content.js"></script>
    <script src="../guide.js"></script>
''' + FOOT

for rel, html in (("guide/index.html", landing()), ("guide/anatomy/index.html", viewer("anatomy", "解剖学", "A")),
                  ("guide/physiology/index.html", viewer("physiology", "生理学", "P")), ("guide/coverage/index.html", coverage())):
    os.makedirs(os.path.dirname(f"{R}/{rel}"), exist_ok=True)
    open(f"{R}/{rel}", "w", encoding="utf-8").write(html)
print("pages generated")
