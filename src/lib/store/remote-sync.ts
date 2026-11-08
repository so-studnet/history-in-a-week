/**
 * ログイン中、手元の記録（localStorage）と Supabase を同期する。
 * 記録は追記だけなので、毎回「サーバーから全部読む → 手元に足す → サーバーにない行を送る」でよい。
 * 手元に先に保存するので、オフラインでも解答でき、つながったときに送られる。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  answerToRow,
  reportToRow,
  rowToAnswer,
  rowToReport,
  unsent,
  type AnswerRow,
  type ReportRow,
} from "@/lib/domain/sync";
import type { AnswerRecord } from "@/lib/domain/progress";
import type { ReportRecord } from "@/lib/domain/sync";
import type { AnswerStore } from "./answer-store";

export type SyncStatus = "syncing" | "synced" | "offline" | "error";

const PAGE = 1000;

async function readAll<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  orderBy: string,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data as T[]));
    if (!data || data.length < PAGE) return out;
  }
}

export class RemoteSync {
  private status: SyncStatus = "syncing";
  private listeners = new Set<() => void>();
  private running = false;
  private again = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private cleanups: (() => void)[] = [];

  constructor(
    private supabase: SupabaseClient,
    private store: AnswerStore,
  ) {}

  start() {
    this.cleanups.push(this.store.onAdd(() => this.schedule(1500)));
    const onVisible = () => document.visibilityState === "visible" && this.schedule(0);
    const onOnline = () => this.schedule(0);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    this.cleanups.push(() => document.removeEventListener("visibilitychange", onVisible));
    this.cleanups.push(() => window.removeEventListener("online", onOnline));
    this.schedule(0);
  }

  stop() {
    for (const c of this.cleanups) c();
    this.cleanups = [];
    if (this.timer) clearTimeout(this.timer);
  }

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  getStatus = () => this.status;

  /** 少し待ってから同期する（続けて解答したときにまとめて送る） */
  schedule(delayMs: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.syncNow(), delayMs);
  }

  async syncNow(): Promise<void> {
    if (this.running) {
      this.again = true;
      return;
    }
    this.running = true;
    this.setStatus("syncing");
    try {
      do {
        this.again = false;
        await this.cycle();
      } while (this.again);
      this.setStatus("synced");
    } catch (e) {
      console.error("同期に失敗しました", e);
      this.setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
    } finally {
      this.running = false;
    }
  }

  private async cycle() {
    const [answerRows, reportRows] = await Promise.all([
      readAll<AnswerRow>(this.supabase, "answers", "id, question_id, correct, answered_at", "answered_at"),
      readAll<ReportRow>(this.supabase, "reports", "id, question_id, note, reported_at", "reported_at"),
    ]);
    const remote = {
      answers: answerRows.map(rowToAnswer).filter((x): x is AnswerRecord => x !== null),
      reports: reportRows.map(rowToReport).filter((x): x is ReportRecord => x !== null),
    };
    this.store.mergeRemote(remote);

    const serverIds = new Set([...answerRows.map((r) => r.id), ...reportRows.map((r) => r.id)]);
    const toSend = unsent(this.store.getSnapshot(), serverIds);
    for (let i = 0; i < toSend.answers.length; i += PAGE) {
      const { error } = await this.supabase
        .from("answers")
        .upsert(toSend.answers.slice(i, i + PAGE).map(answerToRow), { onConflict: "id", ignoreDuplicates: true });
      if (error) throw error;
    }
    if (toSend.reports.length > 0) {
      const { error } = await this.supabase
        .from("reports")
        .upsert(toSend.reports.map(reportToRow), { onConflict: "id", ignoreDuplicates: true });
      if (error) throw error;
    }
  }

  private setStatus(s: SyncStatus) {
    if (this.status === s) return;
    this.status = s;
    for (const l of this.listeners) l();
  }
}
