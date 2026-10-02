#!/usr/bin/env python3
"""anat_filled.json / physio_filled.json → anatomy|physiology/questions.json + fields.json"""
import json, re, sys, collections, os
W = "/workspace/hk-portal-work/"
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIJ = json.load(open(W + "kijun_anat_physio.json"))
FW = str.maketrans("ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９",
                  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
def norm(s):
    s = s.translate(FW)
    s = re.sub(r"[─―]{2,}", "　―　", s)          # 組合せ問題の罫線を見やすく
    s = re.sub(r"[ \t]+\n", "\n", s).strip()
    return s
def load(subj, fn, dai_prefix):
    d = json.load(open(W + fn))
    ents = [q for q in d["questions"] if not q.get("chapter_defect")]
    by = collections.OrderedDict()
    for q in ents:
        k = q["qkey"] if "qkey" in q else q["id"]
        cur = by.get(k)
        if cur is None or (q.get("source") == "official" and cur.get("source") != "official"):
            by[k] = q
    out = []
    for k, q in by.items():
        ans = [a - 1 for a in q["answers"]]
        assert ans and all(0 <= a < 4 for a in ans), k
        assert len(q["options"]) == 4, k
        e = {"exam": q["kai"], "number": q["no"], "question": norm(q["stem"]),
             "choices": [norm(o) for o in q["options"]], "answers": sorted(ans), "explanation": "",
             "field": q["kijun_dai"], "chu": q["kijun_chu"]}
        if q.get("note"): e["note"] = q["note"]
        if str(q.get("answer_source", "")).startswith("inferred"): e["inferred"] = True
        out.append(e)
    out.sort(key=lambda e: (e["exam"], e["number"]))
    return out, ents
def kinfo(subj):
    ks = KIJ[subj] if subj in KIJ else None
    return ks
if __name__ == "__main__":
    res = {}
    for subj, fn, dir_ in (("anat", "anat_filled2.json", "anatomy"), ("physio", "physio_filled.json", "physiology")):
        out, ents = load(subj, fn, None)
        d = json.load(open(W + fn))
        dai_name, chu_name, dai_of_chu = {}, {}, {}
        for q in d["questions"]:
            dai_name[q["kijun_dai"]] = q["kijun_dai_name"]
            chu_name[q["kijun_chu"]] = q["kijun_chu_name"]
            dai_of_chu[q["kijun_chu"]] = q["kijun_dai"]
        key = lambda s: int(re.sub(r"\D", "", s.split("-")[0]))
        dais = sorted(dai_name, key=lambda s: (key(s)))
        cnt = collections.Counter(e["field"] for e in out)
        chus = sorted(chu_name, key=lambda c: (key(dai_of_chu[c]), c))
        fields = {"note": "分野は「出題基準（2026年版）」の大項目、サブ分野は中項目（第35回〜適用）に当てはめたものです。公式の出題区分そのものではなく、本サイトで割り当てました。",
                  "fields": [{"id": x, "name": dai_name[x]} for x in dais],
                  "sub": [{"id": c, "field": dai_of_chu[c], "name": chu_name[c]} for c in chus],
                  "map": {f'{e["exam"]}-{e["number"]}': e["field"] for e in out},
                  "submap": {f'{e["exam"]}-{e["number"]}': e["chu"] for e in out}}
        json.dump(out, open(f"{R}/{dir_}/questions.json", "w"), ensure_ascii=False, separators=(",", ":"))
        json.dump(fields, open(f"{R}/{dir_}/fields.json", "w"), ensure_ascii=False, indent=1)
        res[dir_] = {"n": len(out), "exams": [min(e["exam"] for e in out), max(e["exam"] for e in out)],
                     "dai": {x: [dai_name[x], cnt[x]] for x in dais}, "multi": [f'{e["exam"]}-{e["number"]}' for e in out if len(e["answers"]) > 1],
                     "inferred": [f'{e["exam"]}-{e["number"]}' for e in out if e.get("inferred")], "entries_nodefect": len(ents)}
    json.dump(res, open(R + "/tools/build_summary.json", "w"), ensure_ascii=False, indent=1)
    print(json.dumps(res, ensure_ascii=False, indent=1))
