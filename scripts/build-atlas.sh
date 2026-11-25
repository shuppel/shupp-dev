#!/usr/bin/env bash
# Build the Scattered Atlas ship (atlas/) to WebAssembly and drop the result in
# public/atlas/pkg, where /atlas loads it from.
#
# Needs: rustup (the wasm32 target is pulled in by atlas/rust-toolchain.toml),
# wasm-bindgen-cli matching atlas/Cargo.toml, and optionally wasm-opt.
#   cargo install wasm-bindgen-cli --version 0.2.130 --locked
#   npm i -g binaryen   # for wasm-opt
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=public/atlas/pkg
WASM=atlas/target/wasm32-unknown-unknown/release/scattered_atlas.wasm

(cd atlas && cargo build --release --target wasm32-unknown-unknown)
rm -rf "$OUT"
wasm-bindgen --target web --no-typescript --out-dir "$OUT" "$WASM"

if command -v wasm-opt >/dev/null 2>&1; then
  wasm-opt -Oz --strip-debug --strip-producers --enable-bulk-memory --enable-nontrapping-float-to-int --enable-sign-ext \
    --enable-mutable-globals --enable-reference-types \
    -o "$OUT/scattered_atlas_bg.wasm" "$OUT/scattered_atlas_bg.wasm"
else
  echo "wasm-opt not found; skipping size optimisation" >&2
fi

ls -lh "$OUT"
