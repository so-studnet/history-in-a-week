"use client";
import Link from "next/link";
import { useAuth, useSyncStatus } from "@/lib/supabase/use-auth";

const LABEL = {
  syncing: "同期中…",
  synced: "同期済み",
  offline: "オフライン（あとで送ります）",
  error: "同期エラー",
} as const;

/** ホーム右上などに出す、ログインと同期の状態 */
export function SyncBadge() {
  const auth = useAuth();
  const status = useSyncStatus();
  if (auth.status === "local" || auth.status === "loading") return null;
  const text = auth.status === "signed-out" ? "ログインして同期" : status ? LABEL[status] : "同期中…";
  const tone =
    auth.status === "signed-out"
      ? "text-indigo-700 dark:text-indigo-300"
      : status === "error"
        ? "text-rose-700 dark:text-rose-300"
        : "text-zinc-500 dark:text-zinc-400";
  return (
    <Link href="/account" className={`text-xs underline underline-offset-2 ${tone}`}>
      {text}
    </Link>
  );
}
