#!/usr/bin/env python3
"""one-shot: 旧配色（青系）を、輝度を保ったまま翡翠(jade)×クリーム系へ置換する。
 レア度(N/R/SR/SSR)の色・おみくじ以外のアクセント(紫/ピンク/金/赤)は変更しない。"""
import re, sys, colorsys
JADE_H = 172/360; CREAM_H = 42/360; GRAY_H = 160/360; GREEN_H = 128/360
def lin(c): c/=255; return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
def lum(r,g,b): return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b)
def hls_to_rgb255(h,l,s):
    r,g,b=colorsys.hls_to_rgb(h,l,s); return [round(x*255) for x in (r,g,b)]
def match_lum(h,s,Y):
    lo,hi=0.0,1.0
    for _ in range(30):
        mid=(lo+hi)/2; r,g,b=hls_to_rgb255(h,mid,s)
        if lum(r,g,b)<Y: lo=mid
        else: hi=mid
    return hls_to_rgb255(h,(lo+hi)/2,s)
def remap(r,g,b):
    H,L,S=colorsys.rgb_to_hls(r/255,g/255,b/255); hd=H*360; Y=lum(r,g,b)
    if S==0 or (r,g,b)==(255,255,255): return None
    if 195<=hd<=262 and not (hd>235 and S>0.5 and L>0.45 and False):
        if 236<hd<=262: return None            # 紫(レア度SR/SSR・演出)は触らない
        if L>=0.85:                              # 薄い青の面 → クリーム
            return match_lum(CREAM_H, min(0.55, S*0.75), Y)
        if S<0.30:                               # 青灰色(文字・枠) → 緑灰
            return match_lum(GRAY_H, 0.13, Y)
        if L<0.22:                               # 濃紺 → 深い翡翠
            return match_lum(JADE_H, 0.55, Y)
        return match_lum(JADE_H, 0.62, Y)        # 彩度の高い青 → 翡翠
    if 130<=hd<=165 and S>0.2 and L<0.6:       # 「正解」の緑は黄緑寄りにして、主色の翡翠と区別
        return match_lum(GREEN_H, min(S,0.6), Y)
    return None
HEX=re.compile(r'#([0-9a-fA-F]{6})\b'); RGBA=re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)')
RARE=re.compile(r'(\br-(n|r|sr|ssr)\b|\bis-(r|sr|ssr|n)\b|\bjka-(n|r|sr|ssr)\b|\.(rr|rs|rss|rn)\b|\bjkc-(rar|rates)\b)')
def fix_line(line):
    if RARE.search(line): return line
    def h(m):
        r,g,b=[int(m.group(1)[i:i+2],16) for i in (0,2,4)]; n=remap(r,g,b)
        return line_hex(n) if n else m.group(0)
    def a(m):
        r,g,b=int(m.group(1)),int(m.group(2)),int(m.group(3)); n=remap(r,g,b)
        if not n: return m.group(0)
        return f"rgba({n[0]}, {n[1]}, {n[2]}{m.group(4) or ', 1'})" if m.group(4) else f"rgb({n[0]}, {n[1]}, {n[2]})"
    line=HEX.sub(h,line); line=RGBA.sub(a,line); return line
def line_hex(n): return "#%02x%02x%02x"%tuple(n)
if __name__=="__main__":
    for f in sys.argv[1:]:
        src=open(f).read().split("\n"); out=[fix_line(l) for l in src]
        open(f,"w").write("\n".join(out)); print(f, sum(1 for a,b in zip(src,out) if a!=b), "lines changed")
