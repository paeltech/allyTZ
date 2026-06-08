# Email Uniqueness Enforcement

## Overview

Supabase Auth **already enforces email uniqueness** by default. The `auth.users` table has built-in constraints that prevent duplicate emails.

## What This Migration Does

The `enforce_unique_user_email.sql` migration adds:

1. **Additional safeguard function** - Checks for duplicate emails (case-insensitive)
2. **Trigger** - Attempts to create a trigger to enforce uniqueness (may not work due to Supabase restrictions)
3. **Unique index** - Attempts to create a case-insensitive unique index (may already exist)
4. **Verification query** - Checks for any existing duplicate emails

## Important Notes

- **Supabase Auth already enforces email uniqueness** - This is built into the authentication system
- The migration may show warnings if it cannot modify `auth.users` directly (this is normal and safe)
- If you see warnings, it means Supabase is already managing email uniqueness for you

## Running the Migration

1. Go to Supabase Dashboard → SQL Editor
2. Run the `enforce_unique_user_email.sql` migration
3. Check the output for any warnings (warnings are normal and expected)

## Verifying Email Uniqueness

After running the migration, verify there are no duplicates:

```sql
SELECT email, COUNT(*) as count
FROM auth.users
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;
```

This should return **0 rows**. If it returns any rows, you have duplicate emails that need manual resolution.

## Supabase Auth Settings

To ensure email uniqueness is enforced:

1. Go to **Authentication** → **Settings** in Supabase Dashboard
2. Under **Email Auth**, ensure:
   - "Enable email confirmations" is configured
   - "Enable email change" settings are appropriate
3. The system will automatically prevent duplicate emails during signup

## Troubleshooting

### If you see "insufficient_privilege" errors:
- This is **normal** - Supabase manages `auth.users` table permissions
- Email uniqueness is still enforced by Supabase Auth
- The migration is safe to run despite warnings

### If you find duplicate emails:
1. Identify the duplicate emails using the verification query
2. Decide which account to keep
3. Manually delete or merge duplicate accounts
4. Update any related data in your custom tables
