import { UNITS, TOPICS } from "@/data/units";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold">歴検2級 世界史 直前演習</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        準備中です。単元 {UNITS.length} 個・頻出テーマ {TOPICS.length} 個の範囲で問題を作成しています。
      </p>
    </main>
  );
}
