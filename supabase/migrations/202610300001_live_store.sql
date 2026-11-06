-- Auré application persistence. Does not modify existing catalogue or Auth tables.
-- All application records are private; only the authorised Next.js server accesses them.
begin;

create table if not exists public.aure_store_state (
  id integer primary key check (id = 1),
  revision bigint not null default 0,
  state jsonb,
  updated_at timestamptz not null default now(),
  constraint aure_state_object check (state is null or jsonb_typeof(state) = 'object')
);
alter table public.aure_store_state enable row level security;
revoke all on table public.aure_store_state from public, anon, authenticated;
grant select, update on table public.aure_store_state to service_role;
insert into public.aure_store_state (id) values (1) on conflict (id) do nothing;

create or replace function public.aure_read_store()
returns table (revision bigint, state jsonb)
language sql security invoker set search_path = ''
as $$ select s.revision, s.state from public.aure_store_state s where s.id = 1 $$;

create or replace function public.aure_commit_store(expected_revision bigint, next_state jsonb)
returns boolean language plpgsql security invoker set search_path = ''
as $$
declare changed integer;
begin
  if jsonb_typeof(next_state) is distinct from 'object'
     or not (next_state ?& array['products','categories','orders','customers','discounts','settings','credentials','audit','movements','tickets']) then
    raise exception 'Invalid Auré store state';
  end if;
  update public.aure_store_state
    set state = next_state, revision = revision + 1, updated_at = now()
    where id = 1 and revision = expected_revision;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;
revoke all on function public.aure_read_store() from public, anon, authenticated;
revoke all on function public.aure_commit_store(bigint,jsonb) from public, anon, authenticated;
grant execute on function public.aure_read_store() to service_role;
grant execute on function public.aure_commit_store(bigint,jsonb) to service_role;

-- A private, read-only product view makes catalogue verification convenient in Table Editor.
create or replace view public.aure_products with (security_invoker = true) as
select p->>'id' as id, p->>'name' as name, p->>'slug' as slug,
       p->>'category' as category, (p->>'price')::numeric as price,
       (p->>'stock')::integer as stock, (p->>'published')::boolean as published,
       p as product
from public.aure_store_state s
cross join lateral jsonb_array_elements(coalesce(s.state->'products','[]'::jsonb)) p
where s.id = 1;
revoke all on public.aure_products from public, anon, authenticated;
grant select on public.aure_products to service_role;

notify pgrst, 'reload schema';
commit;
