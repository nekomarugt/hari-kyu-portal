#!/usr/bin/env python3
"""学習資料の本文から検索インデックス（search/search-index.json）を作る。過去問は対象外。"""
import argparse, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve()

def main():
    ap = argparse.ArgumentParser(description="学習資料の検索インデックスを生成する")
    ap.add_argument("root", nargs="?", default=".", help="ポータルのルート（省略時はカレント）")
    args = ap.parse_args()
    root = Path(args.root).resolve()
    extract = root / "tools" / "build_search_extract.js"
    if not extract.exists():
        sys.exit(f"見つかりません: {extract}")
    r = subprocess.run(["node", str(extract)], cwd=root, check=True)
    idx = root / "search" / "search-index.json"
    if idx.exists():
        kb = idx.stat().st_size / 1024
        print(f"wrote {idx} ({kb:.1f} KB)")

if __name__ == "__main__":
    main()
