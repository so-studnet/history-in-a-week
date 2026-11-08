-- RLS と制約のテスト。失敗すると例外で止まる。
\set ON_ERROR_STOP on

insert into auth.users values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
insert into public.answers (id, question_id, correct, answered_at) values ('a1', 'u01-001', true, '2026-11-08T01:00Z');
insert into public.reports (id, question_id, note, reported_at) values ('r1', 'u01-001', 'イも正しいのでは', '2026-11-08T01:00Z');

do $$ begin
  assert (select count(*) from public.answers) = 1, 'A は自分の解答を読める';
  assert (select user_id from public.answers where id = 'a1') = '00000000-0000-0000-0000-00000000000a', 'user_id は自動で入る';
  assert (select count(*) from public.reports) = 1, 'A は自分の報告を読める';
end $$;

-- 他人の user_id では書けない
do $$ begin
  begin
    insert into public.answers (id, user_id, question_id, correct, answered_at)
      values ('x', '00000000-0000-0000-0000-00000000000b', 'u01-001', true, now());
    raise exception 'FAIL: 他人の user_id で書けてしまった';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 空のメモは拒否
do $$ begin
  begin
    insert into public.reports (id, question_id, note, reported_at) values ('bad', 'u01-001', '', now());
    raise exception 'FAIL: 空のメモが入ってしまった';
  exception when check_violation then null;
  end;
end $$;

-- 同じ ID の二重送信は主キーで弾かれる（アプリは on conflict do nothing で送る）
insert into public.answers (id, question_id, correct, answered_at) values ('a1', 'u01-001', false, now()) on conflict (id) do nothing;
do $$ begin
  assert (select correct from public.answers where id = 'a1') = true, '二重送信で上書きされない';
end $$;

-- 更新・削除はポリシーがないので効かない
update public.answers set correct = false where id = 'a1';
delete from public.answers where id = 'a1';
do $$ begin
  assert (select correct from public.answers where id = 'a1') = true, '更新できない';
end $$;

-- B から A の行は見えない
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin
  assert (select count(*) from public.answers) = 0, 'B から A の解答は見えない';
  assert (select count(*) from public.reports) = 0, 'B から A の報告は見えない';
end $$;

-- 未ログインは何も見えず、書けない
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  assert (select count(*) from public.answers) = 0, '未ログインでは見えない';
  begin
    insert into public.answers (id, question_id, correct, answered_at) values ('z', 'u01-001', true, now());
    raise exception 'FAIL: 未ログインで書けてしまった';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
