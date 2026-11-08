-- 解答ログと誤り報告。他のアプリと同じ Supabase プロジェクトに同居できるよう、テーブル名に hiaw_ を付ける。
--どちらも追記だけ（更新・削除はしない）なので、
-- 端末間の同期は「相手にない行を足す」だけで済む。

create table public.hiaw_answers (
  id text primary key check (char_length(id) between 1 and 64),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id text not null check (char_length(question_id) between 1 and 64),
  correct boolean not null,
  answered_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index hiaw_answers_user_answered_idx on public.hiaw_answers (user_id, answered_at);

create table public.hiaw_reports (
  id text primary key check (char_length(id) between 1 and 64),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id text not null check (char_length(question_id) between 1 and 64),
  note text not null check (char_length(note) between 1 and 1000),
  reported_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index hiaw_reports_user_idx on public.hiaw_reports (user_id);

alter table public.hiaw_answers enable row level security;
alter table public.hiaw_reports enable row level security;

create policy "read own answers" on public.hiaw_answers for select to authenticated
  using (user_id = (select auth.uid()));
create policy "add own answers" on public.hiaw_answers for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "read own reports" on public.hiaw_reports for select to authenticated
  using (user_id = (select auth.uid()));
create policy "add own reports" on public.hiaw_reports for insert to authenticated
  with check (user_id = (select auth.uid()));
