-- Public data source for https://chazarahtracker.com/chart
-- Run once in the Supabase SQL editor.
--
-- The chart page is public (no login) and the tables are protected by RLS, so the
-- page reads through this SECURITY DEFINER function. It exposes ONLY initials
-- (e.g. "D.G"), the weekly obligation, and total minutes learned - no names/emails.
-- Column names assume the schema used by the mobile app (TblYear / TblObligation / TblSession).

create or replace function public.get_chart_data()
returns table (
  jewish_year        int,
  start_date         text,
  end_date           text,
  initials           text,
  obligation_per_week numeric,
  minutes_learned    numeric
)
language sql
security definer
set search_path = public, auth
stable
as $$
  with y as (
    -- the most recent year that has started
    select ty."JewishYear", ty."StartDate", ty."EndDate"
    from "TblYear" ty
    where ty."StartDate" <= now()
    order by ty."JewishYear" desc
    limit 1
  ),
  members as (
    -- everyone with an obligation or a session in that year
    select o."UserId" from "TblObligation" o join y on o."YearId" = y."JewishYear"
    union
    select s."UserId" from "TblSession" s join y on s."YearId" = y."JewishYear"
  )
  select
    y."JewishYear"::int,
    y."StartDate"::text,
    y."EndDate"::text,
    upper(
      coalesce(left(u.raw_user_meta_data->>'firstname', 1), '') || '.' ||
      coalesce(left(u.raw_user_meta_data->>'lastname', 1), '')
    ) as initials,
    coalesce((select o."ObligationPerWeek" from "TblObligation" o
              where o."UserId" = m."UserId" and o."YearId" = y."JewishYear" limit 1), 0)::numeric,
    coalesce((
      select sum(s."SessionLength")
      from "TblSession" s
      where s."UserId" = m."UserId"
        and s."YearId" = y."JewishYear"
        and s."SessionStartTime" <= now()
    ), 0)::numeric / 60000.0 as minutes_learned
  from y
  cross join members m
  left join auth.users u on u.id = m."UserId"
  order by u.created_at nulls last;
$$;

revoke all on function public.get_chart_data() from public;
grant execute on function public.get_chart_data() to anon, authenticated;

notify pgrst, 'reload schema';
