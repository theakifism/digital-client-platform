-- Run this AFTER you have created the admin login in
-- Supabase dashboard > Authentication > Users > Add user > Create new user.
-- (Email: admin@example.com, a strong password, and "Auto Confirm User" ticked.)
-- Change the username below if you used a different one, then Run.

update public.profiles
set role = 'admin'
where username = 'admin';

-- Check it worked: this should show one row with role = admin
select id, username, role from public.profiles;
