#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
upstream="$PWD/.build/upstream"
if [ ! -d "$upstream/.git" ]; then
  git clone https://github.com/Kitrinx/Ultima7_Decomp.git "$upstream"
fi
git -C "$upstream" checkout --detach 770e21a06faad77fda0b9bf157dd9cfd5d85d05e
# The upstream reset-generation script passes its build paths through a quoted
# -D argument. A short source/build path avoids breaking that step in workspaces
# whose parent directory contains spaces (common on Windows/WSL).
cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/ultima7-browser"
mkdir -p "$cache_dir"
short_source="$cache_dir/portable-source"
build_dir="$cache_dir/build"
ln -sfn "$upstream/ultima7-portable" "$short_source"
export U7_SOURCE="$short_source/Black Gate"
python3 engine/prepare.py
emcmake cmake -S engine -B "$build_dir" -DU7_SOURCE="$U7_SOURCE" -DU7_INTERACTION_PROBE=OFF
cmake --build "$build_dir" --parallel
python3 -c 'from pathlib import Path; p=Path("dist/engine/ultima7.js"); p.write_text("\n".join(line.rstrip() for line in p.read_text().splitlines())+"\n")'
