#!/usr/bin/env python3
"""one-shot pass 2: ガチャ/ゲームUIのピンク・紫(レア度以外) → 灸の橙(moxa)／翡翠。"""
import re,sys,colorsys
sys.path.insert(0,__file__.rsplit('/',1)[0])
from recolor import *
MOXA_H=20/360
def remap2(r,g,b):
    H,L,S=colorsys.rgb_to_hls(r/255,g/255,b/255); hd=H*360; Y=lum(r,g,b)
    if S<0.15: return None
    if 236<hd<=300:                       # 紫
        if L>=0.88: return match_lum(JADE_H, min(S,0.5)*0.7, Y) if False else match_lum(CREAM_H, 0.5, Y)
        return match_lum(JADE_H, 0.55, Y)
    if 300<hd<=346 or hd>=350 and False:  # ピンク
        if L>=0.88: return match_lum(CREAM_H, 0.55, Y)
        return match_lum(MOXA_H, 0.72, Y)
    return None
def fix2(line):
    if RARE.search(line): return line
    def h(m):
        r,g,b=[int(m.group(1)[i:i+2],16) for i in (0,2,4)]; n=remap2(r,g,b)
        return line_hex(n) if n else m.group(0)
    def a(m):
        r,g,b=int(m.group(1)),int(m.group(2)),int(m.group(3)); n=remap2(r,g,b)
        if not n: return m.group(0)
        return f"rgba({n[0]}, {n[1]}, {n[2]}{m.group(4) or ''})" if m.group(4) else f"rgb({n[0]}, {n[1]}, {n[2]})"
    return RGBA.sub(a,HEX.sub(h,line))
for f in sys.argv[1:]:
    s=open(f).read().split("\n"); o=[fix2(l) for l in s]; open(f,"w").write("\n".join(o)); print(f,sum(a!=b for a,b in zip(s,o)))
