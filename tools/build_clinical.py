#!/usr/bin/env python3
"""臨床医学総論・各論の過去問 → rinsho-soron|rinsho-kakuron/questions.json + fields.json
入力: /workspace/hk-clinical-work/ds_27_34.json（公開問題PDF＋財団の正答肢表から作成、出題基準の大・中項目を割当済み。リハビリテーション医学の問題は除外）
分野＝出題基準（2026年版）の大項目、サブ分野＝中項目。科目（総論/各論）は割り当てた項目で決める（試験の問題番号の並びとは一致しないことがある）。"""
import json, re, os, collections, unicodedata
W = "/workspace/hk-clinical-work/"
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DS = json.load(open(W + "ds_27_34.json"))
K = json.load(open(W + "kijun_clinical.json"))
EXPL = json.load(open(os.path.join(R, "tools", "explanations_hk.json"), encoding="utf8"))
CJ = r"[一-龥ぁ-んァ-ヶー]"
FIX = str.maketrans({"伳": "腱", "伹": "叉", "伮": "灸", "伷": "梗", "伱": "隙"})   # 問題PDFの外字（テキスト抽出で別字になるもの）
def clean(s):
    s = unicodedata.normalize("NFKC", s).replace("\u3000", " ").translate(FIX)
    s = re.sub(r"(?<![A-Za-z])([A-E]) +型", r"\1型", s)
    s = s.replace("ラムゼイ ハント", "ラムゼイ・ハント").replace("肘 部", "肘部").replace("圧 迫", "圧迫")
    s = s.replace("仏痛", "疼痛").replace("アミロイド b ", "アミロイドβ").replace("c ‐GTP", "γ-GTP").replace("c -GT", "γ-GT")
    s = re.sub(r"(?<!\S)(" + CJ + r")\s+(" + CJ + r")(?!\S)", r"\1\2", s)   # 「胃   癌」→「胃癌」
    return s.strip()
def opt(s, combo):
    s = re.split(r"次の(?:文で示す)?症例について", s)[0]   # 最後の選択肢に次の症例文がくっつくのを切る
    s = clean(s)
    m = re.match(r"^([A-E])\s*型(肝炎)?\s+(.+)$", s)
    if combo and m: return f"{m.group(1)}型{m.group(2) or ''}　―　{casej(m.group(3))}"
    if combo:
        parts = [p for p in re.split(r"\s{2,}", s) if p]
        if len(parts) == 2: return casej(parts[0]) + "　―　" + casej(parts[1])
        if s.startswith("甲状腺機能低下症") and "眉毛" in s: return "甲状腺機能低下症　―　眉毛外側脱落"
    return casej(s)
def casej(t):
    # 問題文・選択肢・症例文：日本語の間の空白は詰め、英数字どうし（例 BMI 30、HbA1c 8.9%）の空白は1つ残す
    t = re.sub(r"\s+", " ", clean(t)).strip()
    return re.sub(r" (?![A-Za-z0-9])|(?<![A-Za-z0-9.%]) ", "", t)
def stem(x):
    s = casej(x["stem"])
    return (f"「{casej(x['case'])}」\n\n" + s) if x.get("case") else s
CFG = {"総論": ("rinsho-soron", "souron", "sor"), "各論": ("rinsho-kakuron", "kakuron", "kak")}
summary = {}
for subj, (dir_, key, ekey) in CFG.items():
    rows = [x for x in DS if x["subject"] == subj]
    out = []
    for x in rows:
        combo = "組合せ" in x["stem"]
        e = {"exam": x["kai"], "number": x["no"], "question": stem(x), "choices": [opt(o, combo) for o in x["opts"]],
             "answers": sorted(a - 1 for a in x["answers"]), "explanation": EXPL.get(ekey, {}).get(f'{x["kai"]}-{x["no"]}', ""),
             "field": x["kijun_dai"], "chu": x["kijun_chu"]}
        assert len(e["choices"]) == 4 and all(0 <= a < 4 for a in e["answers"]), e
        if len(e["answers"]) > 1: e["note"] = "※正解は複数あります。どれか1つを選んで。" if len(e["answers"]) < 4 else "※この問題は全員正解（すべての選択肢が正解）の扱いです。"
        if x.get("case"): e["case"] = True
        out.append(e)
    out.sort(key=lambda e: (e["exam"], e["number"]))
    cnt = collections.Counter(e["field"] for e in out); ccnt = collections.Counter(e["chu"] for e in out)
    dais = K[key]
    fields = {"note": "分野は「出題基準（2026年版）」の大項目、サブ分野は中項目に当てはめたものです。公式の出題区分そのものではなく、本サイトで割り当てました（症例問題も内容で総論・各論に振り分けています）。",
              "fields": [{"id": d["id"], "name": d["name"]} for d in dais if cnt[d["id"]]],
              "sub": [{"id": c["id"], "field": d["id"], "name": c["name"]} for d in dais for c in d["chu"] if ccnt[c["id"]]],
              "map": {f'{e["exam"]}-{e["number"]}': e["field"] for e in out},
              "submap": {f'{e["exam"]}-{e["number"]}': e["chu"] for e in out}}
    os.makedirs(f"{R}/{dir_}", exist_ok=True)
    json.dump(out, open(f"{R}/{dir_}/questions.json", "w"), ensure_ascii=False, separators=(",", ":"))
    json.dump(fields, open(f"{R}/{dir_}/fields.json", "w"), ensure_ascii=False, indent=1)
    summary[dir_] = {"n": len(out), "exams": sorted(set(e["exam"] for e in out)), "by_exam": dict(collections.Counter(e["exam"] for e in out)),
                     "dai": {d["id"]: [d["name"], cnt[d["id"]]] for d in dais}, "chu_n": {c: n for c, n in ccnt.most_common()},
                     "multi": [f'{e["exam"]}-{e["number"]}' for e in out if len(e["answers"]) > 1], "case": sum(1 for e in out if e.get("case"))}
json.dump(summary, open(R + "/tools/build_summary_clinical.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps({k: {kk: v[kk] for kk in ("n", "by_exam", "multi", "case")} for k, v in summary.items()}, ensure_ascii=False))

# ---- 出題範囲マップ用（guide/clinical-cov.js）：中項目ごとの出題数・頻出・よく出る小項目 ----
from collections import Counter
FREQ_MIN = 5   # 第27〜34回（8回分）で5問以上＝頻出の目安（ほぼ毎回近く出ている）
cov_g, cov_c = {}, {}
for subj, (dir_, key, ekey) in CFG.items():
    kj = K["souron" if subj == "総論" else "kakuron"]
    rows = [x for x in DS if x.get("subject") == subj]
    nchu = Counter(x["kijun_chu"] for x in rows)
    nsho = Counter((x["kijun_chu"], x["sho_name"]) for x in rows if x.get("sho_name") and x.get("kijun_sho", "") and x["kijun_sho"].startswith(x["kijun_chu"] + "-"))
    name = "souron" if subj == "総論" else "kakuron"
    cov_g[name] = {"chapters": [{"id": d["id"], "name": d["name"]} for d in kj], "sections": {}, "qdir": f"../../{dir_}/"}
    cov_c[name] = []
    for d in kj:
        for c in d["chu"]:
            pts = sorted([(n, s) for (ch, s), n in nsho.items() if ch == c["id"] and n >= 2], reverse=True)
            r = {"id": c["id"], "dai": d["id"], "name": c["name"], "secs": [], "refs": [], "nq": nchu.get(c["id"], 0)}
            r["freq"] = r["nq"] >= FREQ_MIN
            if pts: r["pt"] = {"t": pts[0][1], "n": pts[0][0]}
            cov_c[name].append(r)
js = ("/* 出題範囲マップ：臨床医学総論・各論（tools/build_clinical.py が生成。手で編集しない）\n"
      "   nq＝第27〜34回の過去問のうち、その中項目に当てはめた数（本サイトの割り当て）。freq＝nq>=" + str(FREQ_MIN) + " */\n"
      "window.HKGuide = window.HKGuide || {}; window.HKCoverage = window.HKCoverage || {};\n")
for n in ("souron", "kakuron"):
    js += f"window.HKGuide.{n} = {json.dumps(cov_g[n], ensure_ascii=False)};\nwindow.HKCoverage.{n} = {json.dumps(cov_c[n], ensure_ascii=False)};\n"
open(R + "/guide/clinical-cov.js", "w").write(js)
