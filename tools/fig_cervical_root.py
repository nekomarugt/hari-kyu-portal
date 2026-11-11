"""頸椎の神経根症（C5〜C8）の見分け図。本サイトで作図したオリジナル（右上肢を手のひら側から見た模式図）。"""
import os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, Hh, P = 880, 510, 220
cols = [("C5", "C4/5", "上腕二頭筋（弱）", "三角筋", "上腕の外側"),
        ("C6", "C5/6", "上腕二頭筋・腕橈骨筋", "上腕二頭筋・手関節背屈", "前腕の外側〜母指・示指"),
        ("C7", "C6/7", "上腕三頭筋", "上腕三頭筋", "中指"),
        ("C8", "C7/T1", "決まったものなし", "手の小さい筋（指の屈曲）", "小指・前腕の内側")]
HL, BASE, ST = "#f2a0a0", "#e8eef0", "#5a6b70"
o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {Hh}" font-family="sans-serif" role="img" aria-label="頸椎の神経根症 C5〜C8の腱反射・筋力・感覚の見分け">', '<rect width="100%" height="100%" fill="#fff"/>']
def rect(a, fill, rx=12, sw=1.5): return f'<rect x="{a[0]}" y="{a[1]}" width="{a[2]}" height="{a[3]}" rx="{rx}" fill="{fill}" stroke="{ST}" stroke-width="{sw}"/>'
for i, (r, lv, rf, mu, se) in enumerate(cols):
    x = i * P + 10; cx = x + P / 2 - 10; top = 100
    o.append(f'<rect x="{x}" y="10" width="{P-20}" height="{Hh-20}" rx="10" fill="#fbfdfc" stroke="#cfdcd8"/>')
    o.append(f'<text x="{cx}" y="44" text-anchor="middle" font-size="26" font-weight="700" fill="#0c4a40">{r}</text>')
    o.append(f'<text x="{cx}" y="66" text-anchor="middle" font-size="13" fill="#555">椎間 {lv}</text>')
    o.append(f'<text x="{cx-46}" y="{top-6}" font-size="11" fill="#888">外側</text><text x="{cx+24}" y="{top-6}" font-size="11" fill="#888">内側</text>')
    ua = (cx - 22, top, 44, 96); fa = (cx - 20, top + 100, 40, 92); pa = (cx - 24, top + 196, 48, 40)
    for a in (ua, fa, pa): o.append(rect(a, BASE))
    hl = set()
    if r == "C5": o.append(f'<rect x="{ua[0]+2}" y="{ua[1]+8}" width="{ua[2]/2-2}" height="{ua[3]-16}" rx="8" fill="{HL}"/>')
    if r == "C6": o.append(f'<rect x="{fa[0]+2}" y="{fa[1]+6}" width="{fa[2]/2-2}" height="{fa[3]-10}" rx="8" fill="{HL}"/>'); hl = {0, 1}
    if r == "C7": hl = {2}
    if r == "C8": o.append(f'<rect x="{fa[0]+fa[2]/2}" y="{fa[1]+6}" width="{fa[2]/2-2}" height="{fa[3]-10}" rx="8" fill="{HL}"/>'); hl = {4}
    fx = [cx - 34, cx - 18, cx - 6, cx + 6, cx + 18]; fl = [30, 40, 44, 40, 32]; fy = [top + 192] + [top + 236] * 4
    for k in range(5): o.append(rect((fx[k], fy[k], 10, fl[k]), HL if k in hl else BASE, 5, 1.2))
    y = 400
    for lab, val in (("腱反射↓", rf), ("筋力↓", mu), ("感覚↓", se)):
        o.append(f'<text x="{x+12}" y="{y}" font-size="12" fill="#0c4a40" font-weight="700">{lab}</text><text x="{x+12}" y="{y+17}" font-size="13" fill="#222">{val}</text>'); y += 36
o.append("</svg>")
open(R + "/guide/kakuron/figures/k_cervical_root.svg", "w").write("\n".join(o))
