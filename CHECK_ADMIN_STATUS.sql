-- Check if admin exists for the current auth users
-- Run this in Supabase SQL Editor

-- 1. Check all auth users
SELECT 
    id as auth_user_id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;
| auth_user_id                         | email                 | created_at                    | email_confirmed_at            |
| ------------------------------------ | --------------------- | ----------------------------- | ----------------------------- |
| 9b279ba0-86f4-45d2-9ab9-970873e14299 | cafenescu@admin.test  | 2026-01-31 12:03:58.21882+00  | 2026-01-31 12:03:58.222373+00 |
| 958e3c94-410a-48e5-970d-6e9df48f2cff | nailbeauty@admin.test | 2026-01-31 12:02:56.031396+00 | 2026-01-31 12:02:56.035081+00 |
| 06f81569-a1f1-4c20-bedb-049425a5a591 | fitgym@admin.test     | 2026-01-31 12:01:48.575812+00 | 2026-01-31 12:01:48.592087+00 |
-- 2. Check all admin records
SELECT 
    a.id as admin_id,
    a.user_id as auth_user_id,
    a.tenant_id,
    a.active,
    a.role,
    a.store_id,
    t.name as tenant_name,
    au.email
FROM admins a
LEFT JOIN tenants t ON t.id = a.tenant_id
LEFT JOIN auth.users au ON au.id = a.user_id
ORDER BY a.created_at DESC;

| admin_id                             | auth_user_id                         | tenant_id                            | active | role  | store_id                             | tenant_name | email                 |
| ------------------------------------ | ------------------------------------ | ------------------------------------ | ------ | ----- | ------------------------------------ | ----------- | --------------------- |
| a106ec4b-914f-4155-9f6d-91e78dd79e59 | 9b279ba0-86f4-45d2-9ab9-970873e14299 | 11111111-1111-1111-1111-111111111111 | true   | owner | 11111111-1111-1111-1111-111111111112 | Cafenescu   | cafenescu@admin.test  |
| d85b076d-827e-4fc3-90d3-7931931f4935 | 06f81569-a1f1-4c20-bedb-049425a5a591 | 22222222-2222-2222-2222-222222222222 | true   | owner | 22222222-2222-2222-2222-222222222223 | FitGym      | fitgym@admin.test     |
| e2ffc044-fec4-4430-a009-edb7a3223080 | 958e3c94-410a-48e5-970d-6e9df48f2cff | 33333333-3333-3333-3333-333333333333 | true   | owner | 33333333-3333-3333-3333-333333333334 | Nail Beauty | nailbeauty@admin.test |
-- 3. Check which auth users DON'T have admin records
SELECT 
    au.id as auth_user_id,
    au.email,
    'NO ADMIN RECORD' as status
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM admins WHERE active = true);



Success. No rows returned