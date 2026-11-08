"use client";
/**
 * ログイン状態の管理。ログイン中は RemoteSync で手元の記録と Supabase を同期する。
 * ログアウトしても手元の記録は消さない（同じ端末で続けて解けるように）。
 */
import type { Session } from "@supabase/supabase-js";
import { answerStore } from "@/lib/store/use-answers";
import { RemoteSync, type SyncStatus } from "@/lib/store/remote-sync";
import { getSupabase, isSupabaseConfigured } from "./client";

export type AuthState =
  | { status: "local" } // Supabase 未設定（ブラウザ内保存だけ）
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; userId: string; email: string | null };

const LOCAL: AuthState = { status: "local" };
const LOADING: AuthState = { status: "loading" };
const SIGNED_OUT: AuthState = { status: "signed-out" };

let state: AuthState = isSupabaseConfigured ? LOADING : LOCAL;
let sync: RemoteSync | null = null;
let started = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function applySession(session: Session | null) {
  const userId = session?.user.id ?? null;
  if (userId && state.status === "signed-in" && state.userId === userId) return;
  sync?.stop();
  sync = null;
  if (userId) {
    sync = new RemoteSync(getSupabase(), answerStore);
    sync.subscribe(emit);
    sync.start();
    state = { status: "signed-in", userId, email: session?.user.email ?? null };
  } else {
    state = SIGNED_OUT;
  }
  emit();
}

function start() {
  if (started || !isSupabaseConfigured || typeof window === "undefined") return;
  started = true;
  // INITIAL_SESSION を含め、ログイン状態の変化はすべてここに届く
  getSupabase().auth.onAuthStateChange((_event, session) => {
    // コールバック内で Supabase を呼ぶと詰まることがあるので、次のタスクに回す
    setTimeout(() => applySession(session), 0);
  });
}

export function subscribeAuth(onChange: () => void): () => void {
  start();
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}
export const getAuthState = () => state;
export const getServerAuthState = (): AuthState => (isSupabaseConfigured ? LOADING : LOCAL);
export const getSyncStatus = (): SyncStatus | null => sync?.getStatus() ?? null;
export const retrySync = () => void sync?.syncNow();

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (!error) return null;
  if (error.code === "invalid_credentials") return "メールアドレスかパスワードが違います";
  if (error.code === "email_not_confirmed") return "メールアドレスの確認が済んでいません";
  if (error.status === 429) return "試行回数が多すぎます。しばらく待ってからやり直してください";
  return "ログインできませんでした。通信状態を確認してください";
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}
