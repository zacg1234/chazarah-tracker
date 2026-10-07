-- Family / sub-account profiles
-- Run once in the Supabase SQL editor.
--
-- Model: a "sub-account" is a real auth.users row (so admins can find it and add its
-- TblObligation like anyone else) that nobody ever logs in to directly. The parent
-- owns it through TblProfile and switches into it inside the app.
-- Sub-account emails are plus-addresses of the parent's email (parent+firstname@domain),
-- which is what ties a new auth user to the parent that created it.

begin;

create table if not exists public."TblProfile" (
  "ProfileUserId" uuid primary key references auth.users(id) on delete cascade,
  "OwnerId"       uuid not null    references auth.users(id) on delete cascade,
  "DisplayName"   text not null,
  "CreatedAt"     timestamptz not null default now()
);
create index if not exists "TblProfile_OwnerId_idx" on public."TblProfile" ("OwnerId");

alter table public."TblProfile" enable row level security;
drop policy if exists "owner reads profiles" on public."TblProfile";
create policy "owner reads profiles" on public."TblProfile"
  for select using ("OwnerId" = auth.uid());
-- No insert/update/delete policies on purpose: rows are only written by the functions below.

-- True for your own id or the id of a sub-account you own
create or replace function public.is_family_member(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select target = auth.uid()
      or exists (select 1 from public."TblProfile" p
                 where p."ProfileUserId" = target and p."OwnerId" = auth.uid());
$$;

-- Extra (additive) policies: policies are OR'd, so your existing "own rows" policies keep working.
drop policy if exists "family sessions" on public."TblSession";
create policy "family sessions" on public."TblSession"
  for all using (public.is_family_member("UserId")) with check (public.is_family_member("UserId"));

drop policy if exists "family obligations" on public."TblObligation";
create policy "family obligations" on public."TblObligation"
  for select using (public.is_family_member("UserId"));

drop policy if exists "family payments" on public."TblPayment";
create policy "family payments" on public."TblPayment"
  for select using (public.is_family_member("UserId"));

-- Called by the parent right after the app creates the sub-account's auth user.
create or replace function public.link_sub_account(child_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  parent_email text;
  child_email  text;
  child_created timestamptz;
  child_name   text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if child_id = auth.uid() then raise exception 'Cannot link yourself'; end if;

  select email into parent_email from auth.users where id = auth.uid();
  select email, created_at, coalesce(raw_user_meta_data->>'display_name', email)
    into child_email, child_created, child_name
    from auth.users where id = child_id;

  if child_email is null then raise exception 'Sub-account not found'; end if;
  if child_created < now() - interval '10 minutes' then raise exception 'Sub-account is too old to link'; end if;
  if exists (select 1 from "TblProfile" where "ProfileUserId" = child_id) then raise exception 'Already linked'; end if;
  if exists (select 1 from "TblProfile" where "ProfileUserId" = auth.uid()) then raise exception 'Sub-accounts cannot own sub-accounts'; end if;

  -- child email must be  <parent local part>+<anything>@<parent domain>
  if position('+' in split_part(child_email, '@', 1)) = 0
     or lower(split_part(split_part(child_email, '@', 1), '+', 1)) <> lower(split_part(split_part(parent_email, '@', 1), '+', 1))
     or lower(split_part(child_email, '@', 2)) <> lower(split_part(parent_email, '@', 2)) then
    raise exception 'Sub-account email does not match your email';
  end if;

  insert into "TblProfile" ("ProfileUserId", "OwnerId", "DisplayName")
  values (child_id, auth.uid(), child_name);
end $$;

-- Removes a sub-account and all of its data (parent only)
create or replace function public.delete_sub_account(child_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from "TblProfile" where "ProfileUserId" = child_id and "OwnerId" = auth.uid()) then
    raise exception 'Not your sub-account';
  end if;
  delete from "TblSession"    where "UserId" = child_id;
  delete from "TblObligation" where "UserId" = child_id;
  delete from "TblPayment"    where "UserId" = child_id;
  delete from auth.users      where id = child_id;  -- cascades to TblProfile
end $$;

-- Functions are executable by PUBLIC by default; limit them to signed-in users
revoke execute on function public.link_sub_account(uuid)   from public, anon;
revoke execute on function public.delete_sub_account(uuid) from public, anon;
revoke execute on function public.is_family_member(uuid)   from public, anon;
grant execute on function public.link_sub_account(uuid)   to authenticated;
grant execute on function public.delete_sub_account(uuid) to authenticated;
grant execute on function public.is_family_member(uuid)   to authenticated;

commit;
