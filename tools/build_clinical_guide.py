"""臨床医学総論・各論の学習資料を「共通倉庫」から作る。
入力: tools/clinical_wh/*.txt（本サイトで書いた独自の文章。はり灸・柔整で共通の倉庫）
      /workspace/hk-clinical-work/ds_all.json（過去問の中項目割当。リポジトリ外）
出力: guide/souron/content.js, guide/kakuron/content.js, guide/qlinks-clin.json,
      tools/clinical_secs.json（build_clinical.py が出題範囲マップに使う）,
      tools/clinical_wh_export.json（柔整ポータルの「はり灸で出る」箱の元）
書式（1節）:
  @ 節ID | 中項目ID,… | 見出し | both/hk/jusei | 検索語,… | 柔整の章ID:見出し（任意）
  - 本文（はり灸・柔整共通）      -+ 本文（はり灸のみの詳しい所。柔整側では箱に入る）
  |a|b|c|  表（1行目は見出し。|+ で始めるとはり灸のみ）
  ? 確認の問い = 答え      ! なぜ（1〜2行）      # 小見出し      > ひとこと（段落）
  qx 回-問 = その問題の一言解説（自信のあるものだけ）
  [[語]] = 赤字（隠して確認できる語）、**語** = 太字
"""
import json, re, os, glob, collections, unicodedata, html as H
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = "/workspace/hk-clinical-work/"
K = json.load(open(W + "kijun_clinical.json")); DS = json.load(open(W + "ds_all.json"))
nz = lambda s: unicodedata.normalize("NFKC", s or "").replace(" ", "").replace("　", "")
FIX = [("伳", "腱"), ("伹", "叉"), ("伮", "灸"), ("伷", "梗"), ("伱", "隙")]
def inl(s):
    s = H.escape(s, quote=False)
    s = re.sub(r"\[\[(.+?)\]\]", r'<span class="answer">\1</span>', s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    return s
def parse():
    secs = []
    for f in sorted(glob.glob(R + "/tools/clinical_wh/*.txt")):
        cur = None
        for raw in open(f, encoding="utf8"):
            line = raw.rstrip("\n")
            if not line.strip() or line.startswith("//"): continue
            if line.startswith("@ "):
                p = [x.strip() for x in line[2:].split("|")] + ["", "", ""]
                cur = {"id": p[0], "chu": [c for c in p[1].split(",") if c], "t": p[2], "tag": p[3] or "both",
                       "kw": [k for k in p[4].split(",") if k], "jz": p[5], "lines": [], "file": os.path.basename(f)}
                secs.append(cur); continue
            cur["lines"].append(line)
    return secs
def render(sec, only_hk=False):
    """HTML を作る。only_hk=True なら『はり灸のみ』の行だけ（柔整の箱用）。"""
    out, ul, tbl, why, cq, qx = [], [], [], [], None, {}
    def flush():
        nonlocal ul, tbl
        if ul: out.append('<ul class="g-list">' + "".join(ul) + "</ul>"); ul = []
        if tbl:
            hd, *rows = tbl
            t = '<div class="g-tblw"><table class="g-tbl"><thead><tr>' + "".join("<th>%s</th>" % inl(c) for c in hd) + "</tr></thead><tbody>"
            t += "".join("<tr>" + "".join("<td>%s</td>" % inl(c) for c in r) + "</tr>" for r in rows) + "</tbody></table></div>"
            out.append(t); tbl = []
    allhk = sec["tag"] == "hk"
    for l in sec["lines"]:
        hk = allhk or l.startswith(("-+", "|+", "#+", ">+"))
        if only_hk and not hk and not l.startswith(("qx", "?", "!")): 
            if l.startswith("#"): pass
            else: continue
        if l.startswith("qx "):
            m = re.match(r"qx\s+(\d+-\d+)\s*=\s*(.+)", l); qx[m.group(1)] = m.group(2).strip(); continue
        if l.startswith("? "):
            q, a = l[2:].split(" = ", 1); cq = (q.strip(), a.strip()); continue
        if l.startswith("! "): why.append(l[2:].strip()); continue
        if l.startswith(("|", "|+")):
            if ul: flush()
            row = l[2:] if l.startswith("|+") else l[1:]
            tbl.append([c.strip() for c in row.rstrip("|").split("|")]); continue
        flush()
        if l.startswith(("- ", "-+ ")):
            ul.append("<li>%s</li>" % inl(l.split(" ", 1)[1])); continue
        if l.startswith(("# ", "#+ ")): out.append('<h4 class="g-h4">%s</h4>' % inl(l.split(" ", 1)[1])); continue
        if l.startswith(("> ", ">+ ")): out.append('<p class="g-one">%s</p>' % inl(l.split(" ", 1)[1])); continue
        if l.startswith("<"): out.append(l); continue
        out.append("<p>%s</p>" % inl(l))
    flush()
    if only_hk:   # 見出しだけ残って中身がない場合は捨てる
        body = "".join(out); 
        if not re.sub(r'<h4 class="g-h4">.*?</h4>', "", body).strip(): return "", why, cq, qx
        return body, why, cq, qx
    return "".join(out), why, cq, qx
def qtext(x):
    t = x["stem"] + "／" + "／".join(x["opts"]) + "／" + (x.get("case") or "")
    for a, b in FIX: t = t.replace(a, b)
    return nz(t)
secs = parse()
ids = [s["id"] for s in secs]; assert len(ids) == len(set(ids)), [i for i, n in collections.Counter(ids).items() if n > 1]
chu_names = {}; 
for k in ("souron", "kakuron"):
    for d in K[k]:
        for c in d["chu"]: chu_names[c["id"]] = c
for s in secs:
    for c in s["chu"]: assert c in chu_names, (s["id"], c)
# ---- 過去問の割り当て ----
bychu = collections.defaultdict(list)
for s in secs:
    for c in s["chu"]: bychu[c].append(s)
P = collections.defaultdict(list); RL = collections.defaultdict(list); qlinks = {"sor": {}, "kak": {}, "titles": {}}
for x in DS:
    k = f'{x["kai"]}-{x["no"]}'; t = qtext(x); c = x["kijun_chu"]
    cands = bychu.get(c, [])
    sc = [(sum(len(w) for w in s["kw"] if nz(w) in t), -i, s) for i, s in enumerate(cands)]
    best = max(sc)[2] if sc and max(sc)[0] > 0 else (cands[0] if cands else None)
    if best is None:   # 中項目に節がない → 語で全体から探す（長い語が2つ以上）
        al = sorted(((sum(len(w) for w in s["kw"] if len(w) >= 3 and nz(w) in t), s) for s in secs if (s["chu"][0][0] == c[0])), key=lambda a: -a[0])
        if al and al[0][0] >= 6: best = al[0][1]
    rel = []
    for s in secs:
        if s is best or s["chu"][0][0] != c[0]: continue
        if sum(1 for w in s["kw"] if len(w) >= 3 and nz(w) in t) >= 2 and len(rel) < 2: rel.append(s)
    if best: P[best["id"]].append(k)
    for s in rel: RL[s["id"]].append(k)
    links = ([best["id"]] if best else []) + [s["id"] for s in rel]
    if links: qlinks["sor" if x["subject"] == "総論" else "kak"][k] = links
THR = 10
def order(k): a = k.split("-"); return (int(a[0]), int(a[1]))
QX = {}
sections = {}
for s in secs:
    h, why, cq, qx = render(s); QX.update(qx)
    p = sorted(set(P[s["id"]]), key=order); r = sorted(set(RL[s["id"]]) - set(p), key=order)
    rec = sum(1 for k in p if int(k.split("-")[0]) >= 27)
    e = {"t": s["t"], "chu": s["chu"], "st": "新規", "h": h, "p": p, "r": r, "np": len(p), "nr": len(r), "rec": rec,
         "ex": (f"第1〜34回で{len(p)}問（うち第27回以降{rec}問）" if p else ""), "freq": len(p) >= THR, "made": False, "pt": [], "cl": 0, "clq": "", "tag": s["tag"]}
    if why: e["w"] = "\n".join(why)
    if cq: e["cq"], e["ca"] = cq
    sections[s["id"]] = e
    qlinks["titles"][s["id"]] = s["t"]
NAME = {"souron": ("臨床医学総論", "../../rinsho-soron/", "S"), "kakuron": ("臨床医学各論", "../../rinsho-kakuron/", "K")}
cov_secs = {}
for key, (label, qdir, pre) in NAME.items():
    chs = []; my = {i: e for i, e in sections.items() if e["chu"][0].startswith(pre)}
    nq_all = sum(1 for x in DS if x["subject"] == ("総論" if pre == "S" else "各論"))
    for d in K[key]:
        chus = []
        for c in d["chu"]:
            sids = [s["id"] for s in secs if s["chu"][0] == c["id"]]
            refs = [s["id"] for s in secs if c["id"] in s["chu"][1:]]
            chus.append({"id": c["id"], "name": c["name"], "sho": [x["name"] for x in c["sho"]], "secs": sids, "refs": refs})
            cov_secs[c["id"]] = {"secs": sids, "refs": refs}
        nq = sum(1 for x in DS if x["kijun_dai"] == d["id"]); nr = sum(1 for x in DS if x["kijun_dai"] == d["id"] and x["kai"] >= 27)
        chs.append({"id": d["id"], "name": d["name"], "intro": f"出題基準「{d['name']}」。収録の過去問は{nq}問（うち第27回以降は{nr}問）。", "chus": chus})
    D = {"subject": key, "label": label, "short": pre, "qdir": qdir, "edition": "出題基準（2026年版）", "nExam": 34, "nq": nq_all, "thr": THR,
         "chapters": chs, "sections": my}
    os.makedirs(f"{R}/guide/{key}", exist_ok=True)
    open(f"{R}/guide/{key}/content.js", "w").write("window.HKGuide=window.HKGuide||{};window.HKGuide.%s=%s;\n" % (key, json.dumps(D, ensure_ascii=False, separators=(",", ":"))))
json.dump(qlinks, open(R + "/guide/qlinks-clin.json", "w"), ensure_ascii=False, separators=(",", ":"))
json.dump({"chu": cov_secs, "sections": {i: {"t": e["t"], "np": e["np"]} for i, e in sections.items()}, "qx": QX}, open(R + "/tools/clinical_secs.json", "w"), ensure_ascii=False, indent=0)
# ---- 柔整ポータル向け：はり灸のみの所 ----
exp = []
for s in secs:
    if s["tag"] == "jusei": continue
    body, why, cq, qx = render(s, only_hk=True)
    if not body: continue
    exp.append({"id": s["id"], "t": s["t"], "tag": s["tag"], "jz": s["jz"], "html": body, "np": sections[s["id"]]["np"], "rec": sections[s["id"]]["rec"]})
json.dump(exp, open(R + "/tools/clinical_wh_export.json", "w"), ensure_ascii=False, indent=0)
print("sections", len(secs), "export", len(exp), "assigned", sum(len(v) for v in P.values()), "of", len(DS), "qx", len(QX))
miss = collections.Counter(x["kijun_chu"] for x in DS if not any(f'{x["kai"]}-{x["no"]}' in P[s] for s in P))
print("unassigned by chu", miss.most_common(12))
