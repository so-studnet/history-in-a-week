"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { QUESTION_BY_ID, QUESTIONS, UNIT_BY_ID, TOPIC_BY_ID, questionIdsInScope, scopeLabel } from "@/data/bank";
import type { Question } from "@/lib/domain/question";
import { deriveProgress } from "@/lib/domain/progress";
import { createRandom, shuffleChoices } from "@/lib/domain/random";
import { pickDueReviews, pickPractice } from "@/lib/domain/selection";
import { answerStore, useProgress } from "@/lib/store/use-answers";
import { newId } from "@/lib/store/answer-store";

const SESSION_SIZE = 10;
const LABELS = ["ア", "イ", "ウ", "エ"];

type Item = { question: Question; order: number[]; displayAnswer: number; chosen: number | null };

function buildSession(scope: string): Item[] {
  const progress = deriveProgress(answerStore.getSnapshot().answers);
  const random = createRandom((Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0);
  const ids =
    scope === "review"
      ? pickDueReviews(
          QUESTIONS.map((q) => q.id),
          progress,
          Date.now(),
          SESSION_SIZE,
        )
      : pickPractice(questionIdsInScope(scope), progress, SESSION_SIZE, random);
  return ids.map((id) => {
    const question = QUESTION_BY_ID.get(id)!;
    const { order, displayAnswer } = shuffleChoices(question.answerIndex, random);
    return { question, order, displayAnswer, chosen: null };
  });
}

export function QuizView() {
  const params = useSearchParams();
  const scope = params.get("scope") ?? "all";
  const [round, setRound] = useState(0);
  return <QuizSession key={`${scope}-${round}`} scope={scope} onRestart={() => setRound((r) => r + 1)} />;
}

function QuizSession({ scope, onRestart }: { scope: string; onRestart: () => void }) {
  const [items, setItems] = useState<Item[]>(() => buildSession(scope));
  const [index, setIndex] = useState(0);

  if (items.length === 0) {
    return (
      <Shell scope={scope}>
        <p className="mt-10 text-center text-zinc-600 dark:text-zinc-300">
          {scope === "review" ? "いま復習の時刻が来ている問題はありません。" : "この範囲の問題はまだありません。"}
        </p>
        <Link href="/" className="mt-6 block rounded-xl bg-indigo-600 py-3 text-center font-bold text-white">
          ホームへ
        </Link>
      </Shell>
    );
  }

  if (index >= items.length) {
    return <Summary scope={scope} items={items} onRestart={onRestart} />;
  }

  const item = items[index];
  const answered = item.chosen !== null;

  const choose = (k: number) => {
    if (answered) return;
    const correct = k === item.displayAnswer;
    answerStore.addAnswer({ id: newId(), questionId: item.question.id, correct, answeredAt: Date.now() });
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, chosen: k } : it)));
  };

  return (
    <Shell scope={scope} progress={`${index + 1} / ${items.length}`}>
      <QuestionCard
        item={item}
        onChoose={choose}
        nextLabel={index + 1 < items.length ? "次の問題へ" : "結果を見る"}
        onNext={() => {
          setIndex(index + 1);
          window.scrollTo({ top: 0 });
        }}
      />
    </Shell>
  );
}

function Shell({ scope, progress, children }: { scope: string; progress?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10 pt-4">
      <header className="mb-4 flex items-center justify-between gap-3 text-sm">
        <Link href="/" className="shrink-0 text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
          ← ホーム
        </Link>
        <span className="truncate text-zinc-500 dark:text-zinc-400">{scopeLabel(scope)}</span>
        <span className="shrink-0 font-bold tabular-nums">{progress}</span>
      </header>
      {children}
    </main>
  );
}

function QuestionCard({
  item,
  onChoose,
  nextLabel,
  onNext,
}: {
  item: Item;
  onChoose: (k: number) => void;
  nextLabel: string;
  onNext: () => void;
}) {
  const { question, order, displayAnswer, chosen } = item;
  const answered = chosen !== null;
  const unit = UNIT_BY_ID.get(question.unitId);
  const topic = question.topicId ? TOPIC_BY_ID.get(question.topicId) : undefined;

  return (
    <article>
      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        {topic ? `頻出：${topic.title}` : unit ? `${unit.era}・${unit.region}` : ""}
      </p>
      <h2 className="whitespace-pre-wrap text-[17px] leading-relaxed">{question.stem}</h2>

      {answered && (
        <div
          className={`mt-4 flex items-center justify-between gap-3 rounded-xl py-2 pl-4 pr-2 text-lg font-bold ${
            chosen === displayAnswer
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              : "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200"
          }`}
        >
          <span>{chosen === displayAnswer ? "○ 正解" : `× 不正解（正解は ${LABELS[displayAnswer]}）`}</span>
          {/* 解説を読まずに進みたいとき用。読み終えたら下の大きいボタンで進む */}
          <button
            type="button"
            onClick={onNext}
            className="shrink-0 rounded-lg bg-white/80 px-3 py-1.5 text-sm font-bold text-zinc-900 active:bg-white dark:bg-zinc-900/60 dark:text-zinc-100"
          >
            {nextLabel} →
          </button>
        </div>
      )}

      <ol className="mt-4 space-y-3">
        {order.map((orig, k) => {
          const choice = question.choices[orig];
          const isAnswer = k === displayAnswer;
          const isChosen = k === chosen;
          const tone = !answered
            ? "border-zinc-300 active:bg-zinc-100 dark:border-zinc-700 dark:active:bg-zinc-800"
            : isAnswer
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
              : isChosen
                ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40"
                : "border-zinc-200 dark:border-zinc-800";
          return (
            <li key={orig}>
              <button
                type="button"
                disabled={answered}
                onClick={() => onChoose(k)}
                className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left ${tone}`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    answered && isAnswer
                      ? "bg-emerald-600 text-white"
                      : answered && isChosen
                        ? "bg-rose-600 text-white"
                        : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                >
                  {LABELS[k]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block leading-relaxed">{choice.text}</span>
                  {answered && (
                    <span className="mt-1 block text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {choice.explanation}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {answered && question.note && (
        <p className="mt-4 rounded-xl bg-zinc-100 px-4 py-3 text-sm leading-relaxed dark:bg-zinc-800">{question.note}</p>
      )}
      {answered && (
        <button
          type="button"
          onClick={onNext}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-4 text-lg font-bold text-white active:bg-indigo-700"
        >
          {nextLabel}
        </button>
      )}
      {answered && <ReportBox questionId={question.id} />}
    </article>
  );
}

function ReportBox({ questionId }: { questionId: string }) {
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">報告しました。後で確認して直します。</p>;
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-zinc-500 dark:text-zinc-400">この問題おかしい？</summary>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="どこがおかしいか（例：イも正しいのでは）"
        rows={3}
        className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent p-3 dark:border-zinc-700"
      />
      <button
        type="button"
        disabled={note.trim() === ""}
        onClick={() => {
          answerStore.addReport({ id: newId(), questionId, note: note.trim(), createdAt: Date.now() });
          setSent(true);
        }}
        className="mt-2 rounded-lg bg-zinc-800 px-4 py-2 text-white disabled:opacity-40 dark:bg-zinc-200 dark:text-zinc-900"
      >
        報告する
      </button>
    </details>
  );
}

function Summary({ scope, items, onRestart }: { scope: string; items: Item[]; onRestart: () => void }) {
  const progress = useProgress();
  const correct = items.filter((it) => it.chosen === it.displayAnswer).length;
  const wrong = items.filter((it) => it.chosen !== it.displayAnswer);
  return (
    <Shell scope={scope}>
      <section className="mt-4 rounded-2xl bg-zinc-100 px-4 py-6 text-center dark:bg-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">結果</p>
        <p className="text-4xl font-bold tabular-nums">
          {correct} / {items.length}
        </p>
        <p className="mt-1 text-sm">{Math.round((correct / items.length) * 100)}%（合格の目安は 60%）</p>
      </section>

      {wrong.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold">間違えた問題（10分後から復習に出ます）</h2>
          <ul className="space-y-2">
            {wrong.map((it) => (
              <li key={it.question.id} className="rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
                <p className="whitespace-pre-wrap leading-relaxed">{it.question.stem}</p>
                <p className="mt-1 font-bold text-emerald-700 dark:text-emerald-400">
                  正解：{it.question.choices[it.question.answerIndex].text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={onRestart} className="rounded-xl bg-indigo-600 py-3 font-bold text-white">
          {scope === "review" ? "続けて復習" : "もう10問"}
        </button>
        <Link href="/" className="rounded-xl border border-zinc-300 py-3 text-center font-bold dark:border-zinc-700">
          ホームへ
        </Link>
      </div>
      <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
        これまでに解いた問題：{progress.size}問
      </p>
    </Shell>
  );
}
