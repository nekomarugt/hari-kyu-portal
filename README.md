# はり師きゅう師 解剖学・生理学ポータル

はり師・きゅう師 国家試験の **解剖学・生理学** の過去問を、回別・分野別・ランダムで練習できる静的サイトです（基礎の復習と過去問演習用）。
4択クイズ（10・30・50問）、学習ゲーム（コイン・ガチャ・おみくじ）つき。登録不要・記録は端末内（localStorage）のみ。

- 公開: https://nekomarugt.github.io/hari-kyu-portal/
- 収録: 解剖学 489問・生理学 455問（第1〜34回、一部欠番あり）。分野別は出題基準（2026年版）の大項目（解剖 A1〜A11／生理 P1〜P16）、中項目をサブ分野に使用。
- 解説は準備中（画面では非表示）。
- 出典: 問題は公益財団法人東洋療法研修試験財団の国家試験問題を元にしています。

## 構成
- `anatomy/` `physiology/` … 過去問アプリ（`questions.json` `fields.json`）
- `quiz/` … 4択クイズ　`game/` … ゲーム本体　`gacha/` … ガチャ・おみくじ
- `sw.js` `manifest.webmanifest` … PWA（スコープ `/hari-kyu-portal/`、キャッシュ接頭辞 `hkp-`、保存キー `jkp-hk-game-v1`）
- `tools/build_data.py` … 入力データから `questions.json` / `fields.json` を生成
