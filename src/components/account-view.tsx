"use client";
import Link from "next/link";
import { useState } from "react";
import { retrySync, signIn, signOut } from "@/lib/supabase/auth";
import { useAuth, useSyncStatus } from "@/lib/supabase/use-auth";
import { useAnswerData } from "@/lib/store/use-answers";

export function AccountView() {
  const auth = useAuth();
  const status = useSyncStatus();
  const data = useAnswerData();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-4">
      <header className="mb-6 flex items-center justify-between text-sm">
        <Link href="/" className="text-zinc-500 dark:text-zinc-400">
          ← ホーム
        </Link>
        <h1 className="font-bold">ログインと同期</h1>
        <span />
      </header>

      {auth.status === "local" && (
        <p className="text-sm leading-relaxed">
          同期の設定（Supabase）がまだありません。記録はこのブラウザの中だけに保存されています。
        </p>
      )}
      {auth.status === "loading" && <p className="text-sm text-zinc-500">確認中…</p>}
      {auth.status === "signed-out" && <SignInForm />}
      {auth.status === "signed-in" && (
        <section className="space-y-4">
          <p className="text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">ログイン中：</span>
            {auth.email}
          </p>
          <p className="rounded-xl bg-zinc-100 px-4 py-3 text-sm dark:bg-zinc-800">
            状態：
            {status === "synced"
              ? "同期済み"
              : status === "offline"
                ? "オフライン。つながったら自動で送ります"
                : status === "error"
                  ? "同期に失敗しました。下のボタンでやり直せます"
                  : "同期中…"}
            <br />
            この端末の記録：解答 {data.answers.length} 件・報告 {data.reports.length} 件
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={retrySync} className="rounded-xl bg-indigo-600 py-3 font-bold text-white">
              今すぐ同期
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-xl border border-zinc-300 py-3 font-bold dark:border-zinc-700"
            >
              ログアウト
            </button>
          </div>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            PC とスマホで同じアカウントにログインすると、解答の記録と「おかしい」報告がそろいます。ログアウトしても、この端末の記録は消えません。
          </p>
        </section>
      )}
    </main>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(await signIn(email, password));
        setBusy(false);
      }}
    >
      <p className="text-sm leading-relaxed">
        ログインすると、このブラウザで解いた記録もサーバーに送られ、別の端末と同期されます。
      </p>
      <label className="block text-sm">
        メールアドレス
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-3 dark:border-zinc-700"
        />
      </label>
      <label className="block text-sm">
        パスワード
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-3 dark:border-zinc-700"
        />
      </label>
      {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white disabled:opacity-50">
        {busy ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
