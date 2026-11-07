#!/usr/bin/env bash
# コミット前のチェックをまとめて実行する。どれかが失敗したらそこで止まる。
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
step() { printf '\n=== %s ===\n' "$1"; }
step "問題データの検証"; npm run questions:check --silent
step "単体テスト (Vitest)"; npm test --silent
step "lint"; npm run lint --silent
step "型チェック"; npm run typecheck --silent
step "本番ビルド"; rm -rf .next; npm run build --silent >/dev/null; rm -rf .next
printf '\nすべてのチェックが通りました\n'
