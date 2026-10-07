-- Read-only checks to run BEFORE sub_accounts.sql. Nothing here changes data.

-- 1. TblProfile must not already exist, and the 3 existing tables should have RLS on (rowsecurity = true)
select tablename, rowsecurity from pg_tables
 where schemaname = 'public' and tablename in ('TblSession','TblObligation','TblPayment','TblProfile');

-- 2. Existing policies (look for any with permissive = RESTRICTIVE)
select tablename, policyname, permissive, cmd, qual from pg_policies
 where schemaname = 'public' and tablename in ('TblSession','TblObligation','TblPayment');

-- 3. None of the three new function names should exist yet (delete_user is yours and is left alone)
select proname, prosrc from pg_proc
 where proname in ('is_family_member','link_sub_account','delete_sub_account','delete_user');

-- 4. UserId must be uuid in all three tables (if it is text, the policies in sub_accounts.sql will fail to install)
select table_name, data_type from information_schema.columns
 where table_schema = 'public' and column_name = 'UserId';
