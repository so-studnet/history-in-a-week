"use client";
import { useAuth } from "@/lib/supabase/use-auth";

/** どの画面から開いても、ログイン状態の確認と同期が始まるようにする */
export function SyncBoot() {
  useAuth();
  return null;
}
