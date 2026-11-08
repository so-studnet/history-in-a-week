import { Suspense } from "react";
import { QuizView } from "@/components/quiz-view";

export default function PracticePage() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-zinc-500">読み込み中…</p>}>
      <QuizView />
    </Suspense>
  );
}
