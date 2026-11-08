"use client";
import { useMemo, useSyncExternalStore } from "react";
import { deriveProgress } from "@/lib/domain/progress";
import { LocalAnswerStore, type AnswerStore } from "./answer-store";

export const answerStore: AnswerStore = new LocalAnswerStore();

export function useAnswerData() {
  return useSyncExternalStore(answerStore.subscribe, answerStore.getSnapshot, answerStore.getServerSnapshot);
}

export function useProgress() {
  const data = useAnswerData();
  return useMemo(() => deriveProgress(data.answers), [data.answers]);
}

/** 1 分ごとに更新される現在時刻（復習の時刻判定・残り日数用）。サーバー描画時は null */
let nowValue: number | null = null;
const nowListeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
function subscribeNow(l: () => void) {
  nowListeners.add(l);
  if (!timer) {
    nowValue = Date.now();
    timer = setInterval(() => {
      nowValue = Date.now();
      for (const x of nowListeners) x();
    }, 60_000);
  }
  return () => {
    nowListeners.delete(l);
    if (nowListeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribeNow,
    () => nowValue ?? (nowValue = Date.now()),
    () => null,
  );
}
