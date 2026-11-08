"use client";
import Link from "next/link";
import { ERAS, UNITS, TOPICS } from "@/data/units";
import { QUESTIONS, QUESTION_BY_ID, questionIdsInScope } from "@/data/bank";
import { groupStats, type GroupStats } from "@/lib/domain/stats";
import { useAnswerData, useProgress } from "@/lib/store/use-answers";

function Row({ title, s }: { title: string; s: GroupStats }) {
  const pct = s.rate === null ? null : Math.round(s.rate * 100);
  return (
    <li className="px-4 py-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">{title}</span>
        <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
          {s.seen}/{s.total}問 ・ {pct === null ? "—" : `${pct}%`}
          {s.inReview > 0 && ` ・ 復習${s.inReview}`}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700" aria-hidden>
        <div
          className={`h-full ${pct === null ? "" : pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
    </li>
  );
}

export function StatsView() {
  const progress = useProgress();
  const { answers, reports } = useAnswerData();
  const all = groupStats(QUESTIONS.map((q) => q.id), progress);
  const ul = "divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800";

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-4">
      <header className="mb-4 flex items-center justify-between text-sm">
        <Link href="/" className="text-zinc-500 dark:text-zinc-400">
          ← ホーム
        </Link>
        <h1 className="font-bold">成績</h1>
        <span />
      </header>

      <section className="grid grid-cols-3 gap-2 text-center">
        {[
          ["解いた問題", `${all.seen}/${all.total}`],
          ["正答率", all.rate === null ? "—" : `${Math.round(all.rate * 100)}%`],
          ["解答回数", `${answers.length}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-zinc-100 py-3 dark:bg-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{k}</p>
            <p className="text-xl font-bold tabular-nums">{v}</p>
          </div>
        ))}
      </section>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">バーの色：70%以上は緑、50%以上は黄、それ未満は赤</p>

      <h2 className="mb-2 mt-6 text-sm font-bold">時代ごと</h2>
      <ul className={ul}>
        {ERAS.map((era) => (
          <Row key={era} title={era} s={groupStats(questionIdsInScope(`era:${era}`), progress)} />
        ))}
      </ul>

      <h2 className="mb-2 mt-6 text-sm font-bold">頻出テーマ</h2>
      <ul className={ul}>
        {TOPICS.map((t) => (
          <Row key={t.id} title={t.title} s={groupStats(questionIdsInScope(`topic:${t.id}`), progress)} />
        ))}
      </ul>

      <h2 className="mb-2 mt-6 text-sm font-bold">単元</h2>
      <ul className={ul}>
        {UNITS.map((u) => (
          <Row key={u.id} title={`${u.era}｜${u.title}`} s={groupStats(questionIdsInScope(`unit:${u.id}`), progress)} />
        ))}
      </ul>

      {reports.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-bold">「おかしい」と報告した問題</h2>
          <ul className={ul}>
            {reports.map((r) => (
              <li key={r.id} className="px-4 py-2 text-sm">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{r.questionId}</p>
                <p className="line-clamp-2">{QUESTION_BY_ID.get(r.questionId)?.stem}</p>
                <p className="mt-1">→ {r.note}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
