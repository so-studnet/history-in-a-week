@AGENTS.md

# 歴検2級 世界史 直前演習アプリ

## ドキュメント
- `docs/requirements.md` 要件 / `docs/architecture.md` 設計 / `docs/roadmap.md` 進み具合
- `docs/exam-research.md` 試験の調査 / `docs/question-generation.md` 問題の作り方
- `sources/README.md` 問題集テキストの受け取り方（原文は `sources/raw/` に置き、コミットしない）

## 開発ルール
- 間違えやすいロジックは `src/lib/domain/` の純粋関数にし、Vitest でテストする
- 時刻は UTC のミリ秒で保存し、表示と残り日数は日本時間
- UI の文言は日本語
- 問題の `id` は一度付けたら変えない（解答の記録が参照する）
- 書籍の原文・問題文の写しをコミットしない
- 仕様を変えたら docs も更新する

## コミット前
- `bash scripts/check.sh`（問題データの検証・テスト・lint・型チェック・ビルド）
