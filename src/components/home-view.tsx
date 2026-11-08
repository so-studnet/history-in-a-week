"use client";
import Link from "next/link";
import { ERAS, UNITS, TOPICS } from "@/data/units";
import { QUESTIONS, questionIdsInScope } from "@/data/bank";
import { daysUntilExam } from "@/lib/domain/countdown";
import { pickDueReviews, countInReview } from "@/lib/domain/selection";
import { groupStats, type GroupStats } from "@/lib/domain/stats";
import { useNow, useProgress } from "@/lib/store/use-answers";

const ALL_IDS = QUESTIONS.map((q) => q.id);

function practiceHref(scope: string) {
  return `/practice?scope=${encodeURIComponent(scope)}`;
}

function StatLine({ s }: { s: GroupStats }) {
  return (
    <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
      {s.seen}/{s.total}問
      {s.rate !== null && ` ・ ${Math.round(s.rate * 100)}%`}
    </span>
  );
}

function ScopeRow({ scope, title, sub }: { scope: string; title: string; sub?: string }) {
  const progress = useProgress();
  const ids = questionIdsInScope(scope);
  if (ids.length === 0) return null;
  const s = groupStats(ids, progress);
  return (
    <li>
      <Link
        href={practiceHref(scope)}
        className="flex items-center justify-between gap-3 px-4 py-3 active:bg-zinc-100 dark:active:bg-zinc-800"
      >
        <span className="min-w-0">
          <span className="block text-[15px] leading-snug">{title}</span>
          {sub && <span className="block text-xs text-zinc-500 dark:text-zinc-400">{sub}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <StatLine s={s} />
          <span className="h-2 w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700" aria-hidden>
            <span className="block h-full bg-indigo-500" style={{ width: `${(s.seen / s.total) * 100}%` }} />
          </span>
        </span>
      </Link>
    </li>
  );
}

export function HomeView() {
  const now = useNow();
  const progress = useProgress();
  const days = now === null ? null : daysUntilExam(now);
  const due = now === null ? 0 : pickDueReviews(ALL_IDS, progress, now, Infinity).length;
  const waiting = countInReview(ALL_IDS, progress);
  const all = groupStats(ALL_IDS, progress);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">歴史能力検定 世界史2級</p>
          <h1 className="text-xl font-bold">直前演習</h1>
        </div>
        <p className="text-right">
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">11/15（日）まで</span>
          <span className="text-2xl font-bold tabular-nums">{days === null ? "–" : days > 0 ? `あと${days}日` : days === 0 ? "今日" : "終了"}</span>
        </p>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <Link
          href={practiceHref("all")}
          className="rounded-2xl bg-indigo-600 px-4 py-5 text-white shadow-sm active:bg-indigo-700"
        >
          <span className="block text-lg font-bold">全範囲から10問</span>
          <span className="text-xs opacity-90">未出題を優先して出します</span>
        </Link>
        <Link
          href={practiceHref("review")}
          className={`rounded-2xl px-4 py-5 shadow-sm ${due > 0 ? "bg-rose-600 text-white active:bg-rose-700" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}
        >
          <span className="block text-lg font-bold">苦手の復習</span>
          <span className="text-xs opacity-90">
            {due > 0 ? `${due}問が復習の時刻です` : waiting > 0 ? `復習待ち ${waiting}問` : "間違えた問題がここに来ます"}
          </span>
        </Link>
      </section>

      <Link
        href={practiceHref("basic")}
        className="mt-3 flex items-center justify-between rounded-2xl border-2 border-indigo-200 px-4 py-3 active:bg-indigo-50 dark:border-indigo-900 dark:active:bg-indigo-950"
      >
        <span>
          <span className="block font-bold">基本用語から10問</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">教科書の太字語を一問一答で。すきま時間に</span>
        </span>
        <StatLine s={groupStats(questionIdsInScope("basic"), progress)} />
      </Link>

      <p className="mt-3 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          全体 {all.seen}/{all.total}問{all.rate !== null && ` ・ 正答率 ${Math.round(all.rate * 100)}%`}
        </span>
        <Link href="/stats" className="underline underline-offset-2">
          成績を見る
        </Link>
      </p>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold">頻出テーマ</h2>
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          <ScopeRow scope="set:frequent" title="頻出テーマから全部" />
          {TOPICS.map((t) => (
            <ScopeRow key={t.id} scope={`topic:${t.id}`} title={t.title} sub={t.description} />
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold">時代・地域</h2>
        {ERAS.map((era) => {
          const units = UNITS.filter((u) => u.era === era);
          return (
            <details key={era} className="mb-2 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-bold">
                {era}
                <StatLine s={groupStats(questionIdsInScope(`era:${era}`), progress)} />
              </summary>
              <ul className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                <ScopeRow scope={`era:${era}`} title={`${era}から全部`} />
                {units.map((u) => (
                  <ScopeRow key={u.id} scope={`unit:${u.id}`} title={u.title} sub={`${u.region} ・ 頻出度 ${u.frequency}`} />
                ))}
              </ul>
            </details>
          );
        })}
      </section>
    </main>
  );
}
