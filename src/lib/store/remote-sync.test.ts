import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RemoteSync } from "./remote-sync";
import type { AnswerData, AnswerStore } from "./answer-store";
import { mergeSyncData } from "@/lib/domain/sync";

/** テーブルごとに行を持つ、メモリ上の偽の Supabase クライアント */
function fakeSupabase(tables: Record<string, Record<string, unknown>[]>, opts: { failUpsert?: boolean } = {}) {
  const upserts: string[] = [];
  const client = {
    from(table: string) {
      const rows = (tables[table] ??= []);
      const query = {
        select: () => query,
        order: () => query,
        range: async (from: number, to: number) => ({ data: rows.slice(from, to + 1), error: null }),
        upsert: async (newRows: { id: string }[]) => {
          if (opts.failUpsert) return { error: new Error("network") };
          for (const r of newRows) {
            upserts.push(r.id);
            if (!rows.some((x) => x.id === r.id)) rows.push(r);
          }
          return { error: null };
        },
      };
      return query;
    },
  };
  return { client: client as unknown as SupabaseClient, upserts };
}

function memoryStore(initial: AnswerData): AnswerStore & { data: AnswerData } {
  const s = {
    data: initial,
    subscribe: () => () => {},
    getSnapshot: () => s.data,
    getServerSnapshot: () => s.data,
    addAnswer: () => {},
    addReport: () => {},
    mergeRemote: (remote: AnswerData) => {
      s.data = mergeSyncData(s.data, remote);
    },
    onAdd: () => () => {},
  };
  return s;
}

describe("RemoteSync", () => {
  it("サーバーの行を手元に足し、手元にしかない行だけを送る", async () => {
    const { client, upserts } = fakeSupabase({
      answers: [{ id: "s1", question_id: "q1", correct: true, answered_at: "2026-11-08T00:00:00+00:00" }],
      reports: [],
    });
    const store = memoryStore({
      answers: [{ id: "l1", questionId: "q2", correct: false, answeredAt: Date.parse("2026-11-08T01:00:00Z") }],
      reports: [{ id: "r1", questionId: "q2", note: "変", createdAt: 1 }],
    });
    const sync = new RemoteSync(client, store);
    await sync.syncNow();
    expect(store.data.answers.map((a) => a.id)).toEqual(["s1", "l1"]);
    expect(upserts.sort()).toEqual(["l1", "r1"]);
    expect(sync.getStatus()).toBe("synced");

    // 2 回目は送るものがない
    upserts.length = 0;
    await sync.syncNow();
    expect(upserts).toEqual([]);
  });

  it("送信に失敗したらエラーになるが、手元の記録は残る", async () => {
    const { client } = fakeSupabase({ answers: [], reports: [] }, { failUpsert: true });
    const store = memoryStore({ answers: [{ id: "l1", questionId: "q", correct: true, answeredAt: 1 }], reports: [] });
    const sync = new RemoteSync(client, store);
    await sync.syncNow();
    expect(["error", "offline"]).toContain(sync.getStatus());
    expect(store.data.answers).toHaveLength(1);
  });
});
