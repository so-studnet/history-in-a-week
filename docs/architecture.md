# 設計

## 技術スタック

| 部分 | 使うもの | 理由 |
|---|---|---|
| 画面 | Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS 4 | 情報が多く Claude と相性がよい。スマホ向けの画面も速く作れる |
| 問題データ | `src/data/questions/*.json` + Zod で検証 | Git で履歴が残り、直しやすい。サーバー不要 |
| 解答の記録 | 最初は localStorage、M5 で Supabase（Auth + PostgreSQL + RLS）に同期 | すぐ使い始められ、後から保存先だけ差し替える |
| 公開 | Vercel | GitHub に push すると公開される |
| テスト | Vitest（ロジック）、Playwright（画面の確認） | |
| 問題の生成 | Claude Code のサブエージェント（作成役・検証役）+ `scripts/check-questions.mts` | 実行時に AI を使わないので、全問を確認済みにできる |

## データモデル

### 問題（`src/lib/domain/question.ts` の `questionSchema`）

| 項目 | 内容 |
|---|---|
| `id` | `u03-012`、`t-era-sense-004` のような固定の ID。解答ログが参照するので変えない |
| `set` | `unit`（単元帯）/ `frequent`（頻出帯） |
| `unitId` | 単元（`src/data/units.ts`）。頻出帯の問題も分析のために持つ |
| `topicId` | 頻出帯のテーマ |
| `format` | `correct` 正しいもの / `incorrect` 誤っているもの / `term` 用語・人物 / `combination` 組み合わせ / `chronology` 年代順・同時代 |
| `difficulty` | 1〜3 |
| `stem` | 問題文 |
| `choices` | 4つ。各 `{ text, explanation }` |
| `answerIndex` | 正解の番号（0〜3）。表示時にはシャッフルする |

### 解答ログ（`src/lib/domain/progress.ts`）

- `AnswerRecord = { id, questionId, correct, answeredAt }` を追記するだけ
- 各問題の状態（解いた回数・正答数・復習の段階と予定時刻）は、ログを時刻順に並べ直して毎回計算する（`deriveProgress`）
- 端末間の同期はログの和集合（`mergeLogs`）で済むので、上書きの衝突が起きない

## 設計のポイント

- 間違えやすいロジック（検証・シャッフル・復習の間隔・出題の選び方・残り日数）は `src/lib/domain/` の純粋関数にし、Vitest で固める
- 乱数はシード付き（`createRandom`）にしてテストで結果を固定する
- 問題 JSON の検証は `npm run questions:check`。Node の型除去で TypeScript を直接動かすため、スクリプトからの import は拡張子付き相対パス（`tsconfig` の `allowImportingTsExtensions`）

## ディレクトリ構成

```
docs/                      要件・設計・ロードマップ・調査・問題生成の手順
sources/                   問題集のテキストを置く場所（原文 sources/raw/ はコミットしない）
scripts/check.sh           コミット前のチェック一式
scripts/check-questions.mts 問題データの検証と配分表示
src/app/                   画面
src/data/units.ts          出題範囲マップ（単元・頻出テーマ）
src/data/questions/*.json  問題データ（単元・テーマごとに1ファイル）
src/lib/domain/            純粋関数とテスト
```
