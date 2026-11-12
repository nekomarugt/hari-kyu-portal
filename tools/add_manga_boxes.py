# -*- coding: utf-8 -*-
"""授業用のオリジナル漫画・イラストを、はり灸・柔整ポータルの該当項目に閉じた箱で入れる。"""
import json, os, re, shutil, sys
from pathlib import Path
from PIL import Image

HK = Path("/workspace/hari-kyu-portal")
JU = Path("/workspace/j-kokushi-portal")
ST = Path("/tmp/manga_add/webp")
ST.mkdir(parents=True, exist_ok=True)

MAXW, QUALITY = 1280, 78

def webp(src, dest_name, maxw=MAXW, q=QUALITY):
    src = Path(src)
    im = Image.open(src)
    if im.mode in ("RGBA", "P", "LA"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        im2 = im.convert("RGBA")
        bg.paste(im2, mask=im2.split()[-1] if im2.mode == "RGBA" else None)
        im = bg
    else:
        im = im.convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, max(1, int(im.height * maxw / im.width))), Image.Resampling.LANCZOS)
    dest = ST / dest_name
    im.save(dest, "WEBP", quality=q, method=6)
    return {"src_name": dest_name, "w": im.width, "h": im.height, "bytes": dest.stat().st_size}

# ---------- series ----------
def pages(pattern, n, start=1):
    return [pattern % i for i in range(start, start + n)]

SHOKA_TITLES = [
    "タイトル「消化と吸収」",
    "三大栄養素は刻む",
    "消化酵素の地図（口→胃→膵→小腸）",
    "アミラーゼ",
    "史実：タカジアスターゼ",
    "ペプシン",
    "史実：ペプシコーラ",
    "リパーゼ",
    "史実：洗剤・阻害薬・アブラソコムツ",
    "ガストリン",
    "セクレチン",
    "CCK（コレシストキニン）",
    "膵液 vs 胆汁",
    "乳化→ミセル",
    "カイロミクロン→乳び管",
    "門脈の根",
    "初回通過回避",
    "ビリルビン",
    "腸肝循環",
    "胃の分泌細胞",
    "肝臓の仕事",
    "まとめ",
]
VIT_TITLES = [
    "タイトル「マンガで覚えるビタミン」",
    "ビタミンA：シロクマの肝臓",
    "ナイアシン：トウモロコシとペラグラ",
    "ビタミンB1：鈴木梅太郎とオリザニン",
    "ビタミンA：ニンジンと夜目",
    "ビタミンK：新生児とKシロップ",
    "ビタミンD：日光が届かない街",
    "ビオチン：生卵白と欠乏",
    "ビタミンB12：胃を取ったあと",
    "早見表：作用・欠乏症・多い食品",
]
IMMUNE_FILES = [
    ("/workspace/hoshu-physio-blood/manga/p1_侵入_一時防衛.png", "侵入と一時防衛（バリア・貪食）"),
    ("/workspace/hoshu-physio-blood/manga/p2_報告_指令.png", "報告と指令（抗原提示・ヘルパーT細胞）"),
    ("/workspace/hoshu-physio-blood/manga/p3_伝令_展開.png", "伝令と展開（サイトカイン・出動）"),
    ("/workspace/hoshu-physio-blood/manga/p4_攻撃_まとめ.png", "攻撃のまとめ（キラーT・抗体）"),
    ("/workspace/hoshu-physio-blood/manga/p5_液性_細胞性.png", "液性免疫と細胞性免疫"),
    ("/workspace/hoshu-physio-blood/manga/p6_B細胞_形質細胞.png", "B細胞から形質細胞へ、抗体のポイント"),
]
ATP_ALTS = [
    "ATPは細胞のエネルギー通貨。運動や脳の活動に使われる。",
    "グルコースが細胞質の解糖系で分解され、ATPが少量できる。",
    "酸素が足りないとピルビン酸は乳酸になる（無酸素的解糖）。",
    "酸素が十分だとミトコンドリアのクエン酸回路へ進む。",
    "電子伝達系でATPをたくさんつくる（マンガの『38個』は古典的な数え方。本文では少量／多量と押さえる）。",
    "乳酸は肝臓でブドウ糖に戻せる（コリ回路）。まとめ。",
]
MITO_ALTS = [
    "ミトコンドリアのつくり：外膜・内膜・クリステ。自分のDNAを持ち、母から子へ伝わる。",
    "クエン酸回路と電子伝達系でATPをつくるイメージ。",
    "酸素を使って効率よくATPをつくる（好気的代謝）。",
]
INS_ALTS = [
    "インスリンは銀行の窓口：血糖（現金）を細胞（金庫）へ入れる。膵B細胞から出る。",
    "グルカゴンは金庫から出す：血糖を上げる。膵A細胞から出る。",
    "インスリンとグルカゴンはシーソー。血糖を反対向きに調節する。",
    "両方とも足りない／効かないと血糖の調節が崩れる（糖尿病など）。",
]

def compress_all():
    out = {}  # series_id -> list of meta
    # tetanus
    out["tetanus"] = [webp(f"/workspace/handouts/tetanus_manga/page{i:02d}.png", f"tetanus-{i:02d}.webp") for i in range(1, 15)]
    for i, m in enumerate(out["tetanus"], 1):
        m["alt"] = f"破傷風の漫画『震える舌』{i}/14ページ。傷口から入った菌の毒素が抑制性シナプス（グリシン・GABA）を外し、筋が固くなるしくみ。"
    out["cellulitis"] = [webp(f"/workspace/handouts/tetanus_manga/cellulitis/page{i:02d}.png", f"cellulitis-{i:02d}.webp") for i in range(1, 10)]
    for i, m in enumerate(out["cellulitis"], 1):
        m["alt"] = f"蜂窩織炎（蜂巣炎）の漫画 {i}/9ページ。皮膚の深い所の化膿性炎症と、毛嚢炎などとの見分け。"
    out["drainage"] = [webp(f"/workspace/handouts/tetanus_manga/drainage/page{i:02d}.png", f"drainage-{i:02d}.webp") for i in range(1, 11)]
    for i, m in enumerate(out["drainage"], 1):
        m["alt"] = f"ドレナージの漫画 {i}/10ページ。たまった膿や液体を外へ出す方法（開放・閉鎖、胸腔など）。"
    out["immune"] = []
    for i, (p, t) in enumerate(IMMUNE_FILES, 1):
        m = webp(p, f"immune-{i:02d}.webp")
        m["alt"] = f"免疫の漫画 {i}/6：{t}"
        out["immune"].append(m)
    out["atp"] = [webp(f"/workspace/atp_manga/atp_{i:02d}.png", f"atp-{i:02d}.webp") for i in range(1, 7)]
    for m, a in zip(out["atp"], ATP_ALTS):
        m["alt"] = a
    out["mito"] = [webp(f"/workspace/atp_manga/mito_{i:02d}.png", f"mito-{i:02d}.webp") for i in range(1, 4)]
    for m, a in zip(out["mito"], MITO_ALTS):
        m["alt"] = a
    out["insulin"] = [webp(f"/workspace/atp_manga/insulin_{i:02d}.png", f"insulin-{i:02d}.webp") for i in range(1, 5)]
    for m, a in zip(out["insulin"], INS_ALTS):
        m["alt"] = a
    out["shoka"] = [webp(f"/workspace/slides/shoka-4koma-YtHAtm/renders/finish-1/slide-{i:02d}.jpg", f"shoka-{i:02d}.webp") for i in range(1, 23)]
    for m, t in zip(out["shoka"], SHOKA_TITLES):
        m["alt"] = f"消化と吸収の4コマ「{t}」"
    out["vitamin"] = [webp(f"/workspace/slides/vitamin-manga-Mn2y9D/renders/finish-6/slide-{i:02d}.jpg", f"vitamin-{i:02d}.webp") for i in range(1, 11)]
    for m, t in zip(out["vitamin"], VIT_TITLES):
        m["alt"] = f"ビタミンの漫画「{t}」"
    # kankaku
    kank = []
    kspec = [
        ("/workspace/handouts/kankaku/blindspot/01_white_black-dot.png", "盲点の実験1：白い背景、黒い点。右目を閉じ左目で＋を見たまま顔を近づける。"),
        ("/workspace/handouts/kankaku/blindspot/02_yellow-bg.png", "盲点の実験2：黄色い背景。消えた所は何色に見えるか。"),
        ("/workspace/handouts/kankaku/blindspot/03_swapped-colors.png", "盲点の実験3：色を入れ替えた版。"),
        ("/workspace/handouts/kankaku/blindspot/04_line-through.png", "盲点の実験4：線が点を貫く。消えても線はつながって見えるか。"),
        ("/workspace/handouts/kankaku/blindspot/05_stripes-through.png", "盲点の実験5：縞模様が点を貫く。"),
        ("/workspace/handouts/kankaku/blindspot/06_line-stops-inside.png", "盲点の実験6：線が点の中で途切れる。どう見えるか。"),
        ("/workspace/handouts/kankaku/blindspot/07_watermelon.png", "盲点の実験7：スイカ模様。赤い点はどうなるか。"),
        ("/workspace/handouts/kankaku/blindspot/eye_diagram.png", "模式図：視神経乳頭には視細胞がなく、ここが盲点になる。"),
        ("/workspace/handouts/kankaku/blindspot/fillin_diagram.png", "模式図：脳が周りの模様で盲点を埋めている（フィリングイン）。"),
        ("/workspace/handouts/kankaku/afterimage/01_magenta_fixate.png", "残像の実験1：マゼンタの円を数十秒じっと見る。"),
        ("/workspace/handouts/kankaku/afterimage/02_green_test.png", "残像の実験2：緑の画面に目を移す（残像の色を確認）。"),
        ("/workspace/handouts/kankaku/afterimage/03_green_control.png", "残像の実験3：対照の緑画面。"),
        ("/workspace/handouts/kankaku/afterimage/cone_diagram.png", "模式図：錐体の順応。見続けた色の錐体が疲れ、残った錐体の色が残像になる。"),
        ("/workspace/handouts/kankaku/purkinje/01_bright_room.png", "プルキニエ現象1：明るい所では赤い花が目立つ。"),
        ("/workspace/handouts/kankaku/purkinje/02_dark_room.png", "プルキニエ現象2：暗い所では青い花の方が相対的に見えやすい。"),
        ("/workspace/handouts/kankaku/purkinje/sensitivity_diagram.png", "模式図：明るい所は錐体（赤に敏感）、暗い所は杆体（青緑に敏感）＝プルキニエ移動。"),
        ("/workspace/handouts/kankaku/build/fig_adapt.png", "順応の図：杆体と錐体の感度が明るさで入れ替わる。"),
        ("/workspace/handouts/kankaku/build/fig_transduce.png", "光受容の図：視細胞が光を電気信号に変える。"),
    ]
    for i, (p, alt) in enumerate(kspec, 1):
        m = webp(p, f"kankaku-{i:02d}.webp")
        m["alt"] = alt
        kank.append(m)
    out["kankaku"] = kank
    fem = []
    for key, src, alt in [
        ("femur-parts", "/workspace/femur_lesson/src/fig/parts.png", "大腿骨の部位：骨頭・頸・大転子・小転子・骨幹部・顆など。"),
        ("femur-angles", "/workspace/femur_lesson/src/fig/angles.png", "大腿骨の頸体角（約125〜130°）と前捻角の模式図。"),
        ("femur-blood", "/workspace/femur_lesson/src/fig/blood.png", "大腿骨頭の栄養血管。内側大腿回旋動脈が主。頚部骨折で血流が絶たれやすい。"),
        ("femur-capsule", "/workspace/femur_lesson/src/fig/capsule_v2.png", "股関節の関節包の付着。頚部骨折は関節包の内側、転子部骨折は外側。"),
        ("femur-muscles", "/workspace/femur_lesson/src/fig/muscles.png", "小転子に付く腸腰筋、大転子に付く中殿筋・小殿筋・外旋筋など。"),
        ("iliopsoas", "/tmp/manga_add/ilio.png", "腸腰筋＝大腰筋（腰椎）＋腸骨筋（腸骨窩）。両方とも小転子に停止し、縮むと股関節が屈曲する。"),
    ]:
        m = webp(src, f"{key}.webp")
        m["alt"] = alt
        m["key"] = key
        fem.append(m)
    out["femur"] = fem
    # report sizes
    total = 0
    print("=== compressed ===")
    for k, lst in out.items():
        b = sum(x["bytes"] for x in lst)
        total += b
        print(f"  {k}: {len(lst)} files, {b/1024:.0f} KB")
    print(f"  TOTAL {total/1024/1024:.2f} MB")
    Path("/tmp/manga_add/manifest.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf8")
    return out

def copy_assets():
    for dest in [HK / "guide/manga", JU / "manga"]:
        dest.mkdir(parents=True, exist_ok=True)
        # clean previous manga webps we own (idempotent)
        for p in dest.glob("*.webp"):
            if p.name.split("-")[0] in {
                "tetanus", "cellulitis", "drainage", "immune", "atp", "mito",
                "insulin", "shoka", "vitamin", "kankaku", "femur", "iliopsoas"
            } or p.stem in {"iliopsoas", "femur-parts", "femur-angles", "femur-blood", "femur-capsule", "femur-muscles"}:
                p.unlink()
        for p in ST.glob("*.webp"):
            shutil.copy2(p, dest / p.name)
        print("copied to", dest, "n=", len(list(dest.glob('*.webp'))))

# path prefixes: HK physiology is guide/physiology/ so ../manga/
# HK anatomy guide/anatomy/ -> ../manga/
# HK kakuron guide/kakuron/ -> ../manga/
# J physio physiology-guide/ -> ../manga/
# J anatomy anatomy-guide/ -> ../manga/
# J clinical clinical-guide/ -> ../manga/
# J jusei jusei-guide/ -> ../manga/

def imgs(meta, prefix="../manga/"):
    return [{"src": prefix + m["src_name"], "w": m["w"], "h": m["h"], "alt": m["alt"]} for m in meta]

def fig_html(meta, prefix="../manga/"):
    parts = []
    for m in meta:
        src = prefix + m["src_name"]
        parts.append(
            f'<figure class="fig manga-fig"><a href="{src}" target="_blank" rel="noopener">'
            f'<img src="{src}" alt="{_esc(m["alt"])}" width="{m["w"]}" height="{m["h"]}" loading="lazy" decoding="async">'
            f'</a><figcaption>{_esc(m["alt"])}</figcaption></figure>'
        )
    return "".join(parts)

def _esc(s):
    return (s.replace("&", "&amp").replace("&amp;", "&amp;").replace("&amp", "&amp;")
            if False else
            str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))

def hk_tip(tid, lab, title, meta, cap, note=None, prefix="../manga/"):
    t = {"id": tid, "lab": lab, "t": title, "imgs": imgs(meta, prefix), "cap": cap}
    if note:
        t["note"] = note
    return t

def put_hk_tips(sec, tip):
    tips = sec.setdefault("tips", [])
    tips[:] = [t for t in tips if t.get("id") != tip["id"]]
    tips.append(tip)

def load_assign(path, last=True):
    s = Path(path).read_text(encoding="utf8")
    ms = list(re.finditer(r"(window\.\w+|window\.\w+\.\w+)\s*=\s*", s))
    if not ms:
        i = s.index("=")
        return s[: i + 1], json.loads(s[i + 1 :].rstrip().rstrip(";")), s
    m = ms[-1] if last else ms[0]
    pre = s[: m.end()]
    raw = s[m.end() :].rstrip().rstrip(";")
    return pre, json.loads(raw), s

def save_assign(path, pre, data, pretty=False):
    if pretty:
        body = json.dumps(data, ensure_ascii=False, indent=2)
    else:
        body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    Path(path).write_text(pre + body + ";\n", encoding="utf8")

NOTE_MANGA = "授業用に作ったオリジナル漫画です。たとえ話なので、正確な用語や数値は本文で確認しよう。"
NOTE_ATP = "授業用のオリジナル漫画です。マンガ中の「ATP 38個」は古典的な教科書の数え方です。本文では「解糖系は少量、ミトコンドリアは多量」と押さえてあります（実際は約30〜32ともされます）。"
NOTE_ILL = "授業用に作ったオリジナルの図です。正確な用語は本文で確認しよう。"
NOTE_KANK = "授業用のオリジナル図です。盲点・残像は画面でも試せます（片目で＋を見たまま顔を近づける、色をじっと見てから視線を移す）。"

def patch_hk(man):
    # physiology
    pre, d, _ = load_assign(HK / "guide/physiology/content.js")
    S = d["sections"]
    put_hk_tips(S["P15-01"], hk_tip("manga-immune", "🎨 漫画で見る", "免疫の流れ（侵入から攻撃まで）", man["immune"],
        "侵入→報告→指令→攻撃。液性免疫と細胞性免疫、B細胞から形質細胞へ。", NOTE_MANGA))
    put_hk_tips(S["P1-04"], hk_tip("manga-atp", "🎨 漫画で見る", "ATP産生の旅", man["atp"],
        "解糖系（細胞質）→酸素があればミトコンドリアへ。酸素が足りないと乳酸。", NOTE_ATP))
    put_hk_tips(S["P1-02"], hk_tip("manga-mito", "🎨 漫画で見る", "ミトコンドリア", man["mito"],
        "二重膜でATPをつくる。ミトコンドリアのDNAは母から子へ。", NOTE_MANGA))
    put_hk_tips(S["P9-06"], hk_tip("manga-insulin", "🎨 漫画で見る", "インスリンとグルカゴン", man["insulin"],
        "インスリンは血糖を下げ、グルカゴンは血糖を上げる。銀行の窓口と金庫のたとえ。", NOTE_MANGA))
    put_hk_tips(S["P5-01"], hk_tip("manga-shoka", "🎨 漫画で見る", "消化と吸収（4コマ）", man["shoka"],
        "酵素・ホルモン・吸収の芯を4コマで。①から順に読む（全22枚）。", NOTE_MANGA))
    put_hk_tips(S["P6-07"], hk_tip("manga-vitamin", "🎨 漫画で見る", "ビタミン（食べ物と歴史のヘンな話）", man["vitamin"],
        "脂溶性と水溶性、欠乏症と食品。歴史のエピソードつき（全10枚）。", NOTE_MANGA))
    put_hk_tips(S["P14-10"], hk_tip("manga-kankaku", "🖼 イラストで見る", "視覚の実験（盲点・残像・プルキニエ）", man["kankaku"],
        "盲点の穴あき、残像の色、暗い所で青が目立つ現象。図の指示どおりに試してみよう。", NOTE_KANK))
    save_assign(HK / "guide/physiology/content.js", pre, d)
    print("HK physio tips added")

    # anatomy
    pre, d, _ = load_assign(HK / "guide/anatomy/content.js")
    S = d["sections"]
    fem = {m["key"]: m for m in man["femur"]}
    put_hk_tips(S["A2-16"], hk_tip("illust-femur-bone", "🖼 イラストで見る", "大腿骨の部位と角度",
        [fem["femur-parts"], fem["femur-angles"]],
        "骨頭・頸・大転子・小転子と、頸体角。", NOTE_ILL))
    put_hk_tips(S["A2-14"], hk_tip("illust-femur-joint", "🖼 イラストで見る", "大腿骨頭の栄養血管と関節包",
        [fem["femur-blood"], fem["femur-capsule"]],
        "内側大腿回旋動脈が主。頚部骨折（関節包の内側）では骨頭の血流が絶たれやすい。", NOTE_ILL))
    put_hk_tips(S["A3-24"], hk_tip("illust-iliopsoas", "🖼 イラストで見る", "腸腰筋と小転子",
        [fem["iliopsoas"], fem["femur-muscles"]],
        "腸腰筋＝大腰筋＋腸骨筋。両方とも小転子に付き、縮むと股関節が屈曲する。", NOTE_ILL))
    save_assign(HK / "guide/anatomy/content.js", pre, d)
    print("HK anatomy tips added")

    # kakuron clinical
    pre, d, _ = load_assign(HK / "guide/kakuron/content.js")
    S = d["sections"]
    put_hk_tips(S["K1-02"], hk_tip("manga-tetanus", "🎨 漫画で見る", "破傷風『震える舌』", man["tetanus"],
        "傷口から入った菌の毒素が、抑制性の伝達（グリシン・GABA）を外して筋を固くする。全14枚。", NOTE_MANGA))
    put_hk_tips(S["K1-02"], hk_tip("manga-cellulitis", "🎨 漫画で見る", "蜂窩織炎（蜂巣炎）", man["cellulitis"],
        "皮膚の深い所の化膿性炎症。蜂の巣に似た広がり方と、浅い炎症との違い。全9枚。", NOTE_MANGA))
    put_hk_tips(S["K1-02"], hk_tip("manga-drainage", "🎨 漫画で見る", "ドレナージ", man["drainage"],
        "たまった膿や液体を外へ出す技術。開放・閉鎖、適応と注意。全10枚。", NOTE_MANGA))
    # vitamin if there is a kakuron section
    vit_sec = [k for k, v in S.items() if "ビタミン" in (v.get("t") or "")]
    print("kakuron vitamin secs", vit_sec)
    save_assign(HK / "guide/kakuron/content.js", pre, d)
    print("HK kakuron tips added")

def j_tip(tid, title, meta, cap, note, prefix="../manga/"):
    return {
        "id": tid,
        "title": title,
        "images": [{"src": prefix + m["src_name"], "alt": m["alt"]} for m in meta],
        "caption": cap,
        "note": note,
    }

def put_j_tips(sec, tip):
    tips = sec.setdefault("tips", [])
    tips[:] = [t for t in tips if t.get("id") != tip["id"]]
    tips.append(tip)

def find_j_sec(chapters, chapter_id, title_contains):
    ch = next(c for c in chapters if c["id"] == chapter_id)
    hits = [s for s in ch["sections"] if title_contains in s["title"]]
    if len(hits) != 1:
        raise SystemExit(f"section not unique: {chapter_id} {title_contains} -> {[s['title'] for s in hits]}")
    return hits[0]

def patch_j_physio(man):
    path = JU / "physiology-guide/content.js"
    s = path.read_text(encoding="utf8")
    # keep leading comments
    m = re.search(r"window\.physiologyChapters\s*=\s*", s)
    pre, raw = s[: m.end()], s[m.end() :].rstrip().rstrip(";")
    d = json.loads(raw)
    put_j_tips(find_j_sec(d, "blood", "自然免疫と獲得免疫"),
        j_tip("manga-immune", "🎨 漫画で見る：免疫の流れ（侵入から攻撃まで）", man["immune"],
              "侵入→報告→指令→攻撃。液性免疫と細胞性免疫、B細胞から形質細胞へ。", NOTE_MANGA))
    put_j_tips(find_j_sec(d, "metabolism", "ATP産生"),
        j_tip("manga-atp", "🎨 漫画で見る：ATP産生の旅", man["atp"],
              "解糖系（細胞質）→酸素があればミトコンドリアへ。酸素が足りないと乳酸。", NOTE_ATP))
    put_j_tips(find_j_sec(d, "basics", "細胞膜と細胞小器官"),
        j_tip("manga-mito", "🎨 漫画で見る：ミトコンドリア", man["mito"],
              "二重膜でATPをつくる。ミトコンドリアのDNAは母から子へ。", NOTE_MANGA))
    put_j_tips(find_j_sec(d, "endocrine", "膵臓のホルモン"),
        j_tip("manga-insulin", "🎨 漫画で見る：インスリンとグルカゴン", man["insulin"],
              "インスリンは血糖を下げ、グルカゴンは血糖を上げる。銀行の窓口と金庫のたとえ。", NOTE_MANGA))
    put_j_tips(find_j_sec(d, "digestion", "糖質・タンパク質・脂質の消化"),
        j_tip("manga-shoka", "🎨 漫画で見る：消化と吸収（4コマ）", man["shoka"],
              "酵素・ホルモン・吸収の芯を4コマで。①から順に読む（全22枚）。", NOTE_MANGA))
    put_j_tips(find_j_sec(d, "metabolism", "栄養素の役割"),
        j_tip("manga-vitamin", "🎨 漫画で見る：ビタミン（食べ物と歴史のヘンな話）", man["vitamin"],
              "脂溶性と水溶性、欠乏症と食品。歴史のエピソードつき（全10枚）。", NOTE_MANGA))
    put_j_tips(find_j_sec(d, "sensation", "視覚"),
        j_tip("manga-kankaku", "🖼 イラストで見る：視覚の実験（盲点・残像・プルキニエ）", man["kankaku"],
              "盲点の穴あき、残像の色、暗い所で青が目立つ現象。図の指示どおりに試してみよう。", NOTE_KANK))
    path.write_text(pre + json.dumps(d, ensure_ascii=False, indent=2) + ";\n", encoding="utf8")
    print("J physio tips added")

def j_box(kid, kind, title, meta, cap, prefix="../manga/"):
    html = f'<p class="mb-caption">{_esc(cap)}</p>' + fig_html(meta, prefix)
    return {"type": "box", "kind": kind, "id": kid, "title": title, "html": html}

def insert_after_heading(blocks, text, newb):
    idx = [i for i, b in enumerate(blocks) if b.get("type") == "heading" and b.get("text") == text]
    if not idx:
        return False
    i = idx[0]
    lv = blocks[i]["level"]
    j = i + 1
    while j < len(blocks) and not (blocks[j].get("type") == "heading" and blocks[j]["level"] <= lv):
        j += 1
    # remove old same-id boxes first (may already be in this slice)
    def is_ours(b):
        i = str(b.get("id", ""))
        return b.get("type") == "box" and (i.startswith("manga-") or i.startswith("illust-"))
    blocks[i:j] = [b for b in blocks[i:j] if not is_ours(b)]
    # recompute j
    j = i + 1
    while j < len(blocks) and not (blocks[j].get("type") == "heading" and blocks[j]["level"] <= lv):
        j += 1
    blocks[j:j] = newb
    return True

def patch_j_clinical(man):
    path = JU / "clinical-guide/disease-content.js"
    pre, d, _ = load_assign(path)
    ch = {c["id"]: c for c in d["chapters"]}
    inf = ch["infection_rheumatology"]["blocks"]
    ok1 = insert_after_heading(inf, "破傷風", [
        j_box("manga-tetanus", "manga", "破傷風『震える舌』", man["tetanus"],
              "傷口から入った菌の毒素が、抑制性の伝達（グリシン・GABA）を外して筋を固くする。全14枚。")
    ])
    ok2 = insert_after_heading(inf, "ブドウ球菌感染症", [
        j_box("manga-cellulitis", "manga", "蜂窩織炎（蜂巣炎）", man["cellulitis"],
              "皮膚の深い所の化膿性炎症。蜂の巣に似た広がり方と、浅い炎症との違い。全9枚。"),
        j_box("manga-drainage", "manga", "ドレナージ", man["drainage"],
              "たまった膿や液体を外へ出す技術。開放・閉鎖、適応と注意。全10枚。"),
    ])
    met = ch["metabolic"]["blocks"]
    ok3 = insert_after_heading(met, "ビタミン欠乏症", [
        j_box("manga-vitamin", "manga", "ビタミン（食べ物と歴史のヘンな話）", man["vitamin"],
              "脂溶性と水溶性、欠乏症と食品。歴史のエピソードつき（全10枚）。")
    ])
    print("J clinical boxes", ok1, ok2, ok3)
    assert ok1 and ok2 and ok3
    save_assign(path, pre, d)
    # also general content.js? no

def put_point_box(point, box):
    boxes = point.setdefault("boxes", [])
    boxes[:] = [b for b in boxes if b.get("id") != box["id"] and b.get("title") != box["title"]]
    boxes.append(box)

def patch_j_anatomy(man):
    path = JU / "anatomy-guide/content.js"
    s = path.read_text(encoding="utf8")
    m1 = re.search(r"window\.anatomyGuideMeta\s*=\s*", s)
    m2 = re.search(r"window\.anatomyChapters\s*=\s*", s)
    raw_meta = s[m1.end():m2.start()].rstrip().rstrip(";")
    meta = json.loads(raw_meta)
    pre2 = s[m2.start():m2.end()]  # 'window.anatomyChapters = '
    header = s[:m2.end()]
    # actually header should be comment + meta + assignment of chapters
    header = s[:m2.end()]
    d = json.loads(s[m2.end():].rstrip().rstrip(";"))
    fem = {m["key"]: m for m in man["femur"]}
    ch = next(c for c in d if c["id"] == "lower-limb")
    pts = {p["id"]: p for p in ch["points"]}
    put_point_box(pts["lower-limb-8"], {
        "kind": "art", "id": "illust-femur-joint", "title": "大腿骨の部位・栄養血管・関節包",
        "html": f'<p class="zu-cap">内側大腿回旋動脈が骨頭を主に栄養する。頚部骨折（関節包の内側）では血流が絶たれやすい。</p>'
                + fig_html([fem["femur-parts"], fem["femur-angles"], fem["femur-blood"], fem["femur-capsule"]])
    })
    put_point_box(pts["lower-limb-9"], {
        "kind": "art", "id": "illust-iliopsoas", "title": "腸腰筋と小転子",
        "html": f'<p class="zu-cap">腸腰筋＝大腰筋＋腸骨筋。両方とも小転子に付き、縮むと股関節が屈曲する。</p>'
                + fig_html([fem["iliopsoas"], fem["femur-muscles"]])
    })
    # rewrite: keep everything before anatomyChapters =
    path.write_text(s[:m2.end()] + json.dumps(d, ensure_ascii=False, indent=2) + ";\n", encoding="utf8")
    print("J anatomy boxes added")

def patch_j_jusei(man):
    path = JU / "jusei-guide/content.js"
    s = path.read_text(encoding="utf8")
    m = re.search(r"window\.juseiChapters\s*=\s*", s)
    pre, raw = s[: m.end()], s[m.end() :].rstrip().rstrip(";")
    d = json.loads(raw)
    fem = {x["key"]: x for x in man["femur"]}
    found = False
    for ch in d:
        for sec in ch.get("sections") or []:
            if sec.get("title", "").startswith("大腿骨近位部骨折"):
                boxes = sec.setdefault("boxes", [])
                boxes[:] = [b for b in boxes if b.get("id") != "illust-femur-prox"]
                boxes.append({
                    "kind": "art", "id": "illust-femur-prox", "title": "大腿骨頭の栄養血管と腸腰筋（小転子）",
                    "html": '<p class="mb-caption">頚部骨折で問題になる骨頭の血流と、小転子に付く腸腰筋。</p>'
                            + fig_html([fem["femur-blood"], fem["femur-capsule"], fem["iliopsoas"]])
                })
                found = True
    assert found
    path.write_text(pre + json.dumps(d, ensure_ascii=False, indent=2) + ";\n", encoding="utf8")
    print("J jusei box added")

# ---- JS / CSS patches (additive, existing kinds unchanged) ----
CSS = """
/* 漫画・イラストの閉じた箱（授業用オリジナル） */
.more-box.mb-manga, .more-box.mb-art, .tips-box.mb-manga, .g-tips-manga {
  border-color: #e6c99a; background: #fffdf7;
}
.more-box.mb-manga .more-badge, .tips-box.mb-manga .tips-badge, .g-tips-manga > summary {
  /* badge color via existing badge styles; extra hook */
}
.more-box.mb-manga .more-badge, .more-box.mb-art .more-badge {
  background: #fcefd4; color: #6a4a12;
}
.manga-fig, .more-body .manga-fig, .tips-body .manga-fig { margin: 8px 0 12px; }
.manga-fig img, .g-tips-manga img, .tips-box.mb-manga img, .more-box.mb-manga img, .more-box.mb-art img {
  width: 100%; max-width: 900px; height: auto; display: block; margin: 0 auto; border-radius: 6px;
}
.manga-fig figcaption, .mb-caption { font-size: .85rem; margin: 4px 0 8px; }
"""

def patch_js_css():
    # HK guide.js lab class
    p = HK / "guide/guide.js"
    s = p.read_text(encoding="utf8")
    old = 'var tp = h("details", t.lab ? "g-tips g-tips-zu" : "g-tips"); tp.appendChild(h("summary", "", (t.lab || "TIPS") + "：" + t.t));'
    new = 'var isManga = t.lab && /漫画|イラスト/.test(t.lab); var tp = h("details", t.lab ? (isManga ? "g-tips g-tips-manga more-box" : "g-tips g-tips-zu") : "g-tips"); tp.appendChild(h("summary", "", (t.lab || "TIPS") + "：" + t.t));'
    if old not in s:
        if "g-tips-manga" in s:
            print("HK guide.js already patched")
        else:
            raise SystemExit("HK guide.js pattern not found:\n" + s[s.find("var tp = h"):s.find("var tp = h")+200])
    else:
        p.write_text(s.replace(old, new, 1), encoding="utf8")
        print("HK guide.js patched")
    css = HK / "guide/guide.css"
    t = css.read_text(encoding="utf8")
    if "g-tips-manga" not in t:
        css.write_text(t + "\n" + CSS, encoding="utf8")
        print("HK guide.css appended")

    # J clinical app.js
    p = JU / "clinical-guide/app.js"
    s = p.read_text(encoding="utf8")
    old = '''      const isHk = block.kind === "hk"; // はり灸の臨床医学で出る所（柔整では読まなくてよい）
      const label = escapeHtml(String(block.title || "").replace(/^(つながりで覚える|より深く|はり灸で出る)：/, ""));
      return `<details class="more-box mb-${isHk ? "hk" : isLink ? "link" : "deep"}" data-box-id="${escapeHtml(bid)}"${openBoxes.has(bid) ? " open" : ""}><summary><span class="more-badge">${isHk ? "はり灸で出る" : isLink ? "つながり" : "より深く"}</span><span class="more-title">${label}</span><span class="more-open" aria-hidden="true">ひらく</span></summary><div class="more-body">${html}${btn}</div></details>`;'''
    new = '''      const isHk = block.kind === "hk"; // はり灸の臨床医学で出る所（柔整では読まなくてよい）
      const isManga = block.kind === "manga";
      const isArt = block.kind === "art";
      const label = escapeHtml(String(block.title || "").replace(/^(つながりで覚える|より深く|はり灸で出る|🎨 漫画で見る|🖼 イラストで見る)：/, ""));
      const mb = isHk ? "hk" : isManga ? "manga" : isArt ? "art" : isLink ? "link" : "deep";
      const badge = isHk ? "はり灸で出る" : isManga ? "🎨 漫画で見る" : isArt ? "🖼 イラストで見る" : isLink ? "つながり" : "より深く";
      return `<details class="more-box mb-${mb}" data-box-id="${escapeHtml(bid)}"${openBoxes.has(bid) ? " open" : ""}><summary><span class="more-badge">${badge}</span><span class="more-title">${label}</span><span class="more-open" aria-hidden="true">ひらく</span></summary><div class="more-body">${html}${btn}</div></details>`;'''
    if old not in s:
        if 'block.kind === "manga"' in s:
            print("J clinical app.js already patched")
        else:
            raise SystemExit("J clinical app.js pattern not found")
    else:
        p.write_text(s.replace(old, new, 1), encoding="utf8")
        print("J clinical app.js patched")
    css = JU / "clinical-guide/styles.css"
    t = css.read_text(encoding="utf8")
    if "mb-manga" not in t:
        css.write_text(t + "\n" + CSS, encoding="utf8")

    # J physiology tips
    p = JU / "physiology-guide/app.js"
    s = p.read_text(encoding="utf8")
    old = '''            '<details class="tips-box">' +
              '<summary><span class="tips-badge">TIPS</span><span class="tips-title">' + escapeHtml(String(tip.title || '').replace(/^TIPS\\s*/, '')) + '</span><span class="tips-open" aria-hidden="true">ひらく</span></summary>' +'''
    new = '''            '<details class="tips-box' + (/漫画で見る|イラストで見る/.test(String(tip.title || '')) ? ' more-box mb-manga' : '') + '">' +
              '<summary><span class="' + (/漫画で見る|イラストで見る/.test(String(tip.title || '')) ? 'more-badge' : 'tips-badge') + '">' + (/🎨/.test(String(tip.title || '')) ? '🎨 漫画で見る' : /🖼/.test(String(tip.title || '')) ? '🖼 イラストで見る' : 'TIPS') + '</span><span class="tips-title">' + escapeHtml(String(tip.title || '').replace(/^TIPS\\s*/, '').replace(/^🎨 漫画で見る：/, '').replace(/^🖼 イラストで見る：/, '')) + '</span><span class="tips-open" aria-hidden="true">ひらく</span></summary>' +'''
    if old not in s:
        if "mb-manga" in s and "漫画で見る" in s:
            print("J physio app.js already patched")
        else:
            # show nearby
            i = s.find("details class=\"tips-box\"")
            print("NOT FOUND physio, context:", repr(s[i:i+300]))
            raise SystemExit("J physio app.js pattern not found")
    else:
        p.write_text(s.replace(old, new, 1), encoding="utf8")
        print("J physio app.js patched")
    css = JU / "physiology-guide/styles.css"
    t = css.read_text(encoding="utf8")
    if "mb-manga" not in t:
        css.write_text(t + "\n" + CSS, encoding="utf8")

    def patch_kind_ternary(path, already="mb-manga"):
        s = Path(path).read_text(encoding="utf8")
        if "kind === 'manga'" in s or 'kind === "manga"' in s:
            print(path, "already patched")
            return
        # anatomy / jusei similar patterns
        # box.kind === 'link' ? 'link' : box.kind === 'zu' ? 'zu' : 'deep'
        n = 0
        def repl_cls(m):
            nonlocal n
            n += 1
            mid = m.group(0)
            if "manga" in mid:
                return mid
            # insert before final : 'deep'
            return mid.replace(": 'deep'", ": box.kind === 'manga' ? 'manga' : box.kind === 'art' ? 'art' : 'deep'").replace(': "deep"', ': box.kind === "manga" ? "manga" : box.kind === "art" ? "art" : "deep"')
        s2 = re.sub(r"box\.kind === 'link' \? 'link' : box\.kind === 'zu' \? 'zu' : 'deep'",
                    "box.kind === 'link' ? 'link' : box.kind === 'zu' ? 'zu' : box.kind === 'manga' ? 'manga' : box.kind === 'art' ? 'art' : 'deep'", s)
        s2 = s2.replace(
            "box.kind === 'link' ? 'link' : 'deep'",
            "box.kind === 'link' ? 'link' : box.kind === 'manga' ? 'manga' : box.kind === 'art' ? 'art' : 'deep'",
        )
        # badges
        s2 = s2.replace(
            "box.kind === 'link' ? 'つながり' : box.kind === 'zu' ? '図説' : 'より深く'",
            "box.kind === 'link' ? 'つながり' : box.kind === 'zu' ? '図説' : box.kind === 'manga' ? '🎨 漫画で見る' : box.kind === 'art' ? '🖼 イラストで見る' : 'より深く'",
        )
        s2 = s2.replace(
            "box.kind === 'link' ? 'つながり' : 'より深く'",
            "box.kind === 'link' ? 'つながり' : box.kind === 'manga' ? '🎨 漫画で見る' : box.kind === 'art' ? '🖼 イラストで見る' : 'より深く'",
        )
        if s2 == s:
            print("NO CHANGE", path)
            i = s.find("more-box mb-")
            print(repr(s[i:i+400]))
        else:
            Path(path).write_text(s2, encoding="utf8")
            print("patched kinds", path)
        css = Path(path).parent / "styles.css"
        if css.exists():
            t = css.read_text(encoding="utf8")
            if "mb-manga" not in t:
                css.write_text(t + "\n" + CSS, encoding="utf8")

    patch_kind_ternary(JU / "anatomy-guide/app.js")
    patch_kind_ternary(JU / "jusei-guide/app.js")
    patch_kind_ternary(JU / "physiology-guide/app.js")  # boxes too

def bump_sw():
    def bump(path, old, new):
        s = Path(path).read_text(encoding="utf8")
        if f"'{new}'" in s or f'"{new}"' in s:
            print(path, "already", new)
            return
        if f"'{old}'" not in s and f'"{old}"' not in s:
            # show current
            m = re.search(r"VERSION\s*=\s*['\"]([^'\"]+)", s)
            print("current", m.group(1) if m else "?", "wanted to replace", old)
            raise SystemExit("SW version not found " + str(path))
        Path(path).write_text(s.replace(f"'{old}'", f"'{new}'").replace(f'"{old}"', f'"{new}"'), encoding="utf8")
        print("bumped", path, old, "->", new)
    bump(HK / "sw.js", "v51", "v52")
    bump(JU / "sw.js", "v69", "v70")

def main():
    man = compress_all()
    copy_assets()
    patch_hk(man)
    patch_j_physio(man)
    patch_j_clinical(man)
    patch_j_anatomy(man)
    patch_j_jusei(man)
    patch_js_css()
    bump_sw()
    print("ALL DONE")

if __name__ == "__main__":
    main()
