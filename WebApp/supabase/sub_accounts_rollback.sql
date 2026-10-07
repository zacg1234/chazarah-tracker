-- Undoes sub_accounts.sql. Existing sub-account auth users and their sessions are NOT deleted;
-- the app falls back to single-profile mode when TblProfile is missing.
begin;
drop policy if exists "family sessions"    on public."TblSession";
drop policy if exists "family obligations" on public."TblObligation";
drop policy if exists "family payments"    on public."TblPayment";
drop function if exists public.link_sub_account(uuid), public.delete_sub_account(uuid), public.is_family_member(uuid);
drop table if exists public."TblProfile";
commit;
