# 同期（Supabase）の設定手順

PC とスマホで解答の記録をそろえるための設定です。所要時間は 10〜15 分ほど。
**Secret key（`sb_secret_...`）は使いません。会話にも貼らないでください。**

## 1. プロジェクトを作る
1. https://supabase.com を開き、右上の「Sign in」→「Continue with GitHub」でログイン
2. 「New project」を押す
3. 入力欄
   - Project name：`history-in-a-week`
   - Database Password：右の「Generate a password」を押す（このアプリでは使わないので控えなくてよい）
   - Region：**Northeast Asia (Tokyo)**
4. 「Create new project」を押し、1〜2 分待つ

## 2. テーブルを作る（SQL を実行）
1. 左のメニューの「SQL Editor」（`>_` のアイコン）を押す
2. 右上の「+」→「Create a new snippet」
3. リポジトリの `supabase/migrations/20261108000000_init.sql` の中身を全部貼り付ける
4. 右下の「Run」を押し、下に「Success. No rows returned」と出れば完了
5. 左のメニュー「Table Editor」に `answers` と `reports` が出ていることを確かめる

## 3. ログイン用のユーザーを作る
1. 左のメニュー「Authentication」→「Users」
2. 右上の「Add user」→「Create new user」
3. 自分のメールアドレスとパスワードを入れ、**「Auto Confirm User」にチェック**して「Create user」
4. 他人に使われないよう、新規登録を止める：「Authentication」→「Sign In / Providers」→「Allow new users to sign up」を**オフ**→「Save changes」

## 4. 接続情報を Vercel に設定する
1. Supabase 左下の歯車「Project Settings」→「API Keys」
2. 「Publishable key」の `sb_publishable_...` の右のコピーボタンを押す（公開してよい値）
3. URL は、ダッシュボードのアドレス `https://supabase.com/dashboard/project/<ID>/...` の `<ID>` を使って `https://<ID>.supabase.co`（上部の緑の「Connect」ボタンでも見られる）
4. Vercel のプロジェクトを開き、上の「Settings」→ 左の「Environment Variables」
5. 次の 2 つを追加（Environments はすべてにチェックのまま）して「Save」
   - `NEXT_PUBLIC_SUPABASE_URL` ＝ 3 の URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ＝ 2 の値
6. 上の「Deployments」→ 一番上の行の右の「⋯」→「Redeploy」→「Redeploy」（環境変数は再デプロイで反映される）

## 5. 使う
- アプリのホームの「ログインして同期」を押し、3 で作ったメールアドレスとパスワードでログイン
- PC とスマホの両方でログインすると、記録がそろう。ログイン前にその端末で解いた記録も送られる
- 画面に戻ったとき・解答したとき（少し後）に自動で同期する。オフラインで解いた分は、つながったときに送られる

## 困ったとき
| 症状 | 見るところ |
|---|---|
| 「ログインして同期」が出ない | Vercel の環境変数の名前のつづり、Redeploy したか |
| メールアドレスかパスワードが違う | Supabase の Authentication → Users にユーザーがあるか、Auto Confirm したか |
| 「同期エラー」 | 2 の SQL を実行したか（Table Editor に answers があるか） |
