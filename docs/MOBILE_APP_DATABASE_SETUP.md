# Mobile App Database Setup

This guide will help you set up the required database tables for the mobile app's profile, notifications, and preferences features.

## 🗄️ Required Tables

1. **`user_profiles`** (already exists, adding `full_name` column)
   - Stores user profile information
   - Fields: `id`, `full_name`, `phone_number`, `phone_verified`, etc.

2. **`notifications`** (already exists)
   - Stores in-app notifications
   - Fields: `id`, `user_id`, `notification_type`, `title`, `message`, `read`, etc.

3. **`notification_preferences`** (NEW - needs to be created)
   - Stores user notification settings
   - Fields: `user_id`, `email_signals`, `push_signals`, `marketing_emails`, etc.

## 🚀 Quick Setup

### Option 1: Run the All-in-One Migration (Recommended)

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy the entire contents of `/supabase/migrations/RUN_MOBILE_APP_SETUP.sql`
4. Paste it into the SQL Editor
5. Click **Run** or press `Cmd+Enter`
6. Check the output for success messages ✓

### Option 2: Run Individual Migrations

If you prefer to run migrations separately:

1. **Add full_name to user_profiles:**
   ```bash
   supabase/migrations/add_full_name_to_user_profiles.sql
   ```

2. **Create notification_preferences table:**
   ```bash
   supabase/migrations/create_notification_preferences.sql
   ```

## ✅ Verification

After running the migration, verify the setup:

```sql
-- Check notification_preferences table exists
SELECT * FROM notification_preferences LIMIT 1;

-- Check user_profiles has full_name column
SELECT id, full_name, phone_number FROM user_profiles LIMIT 1;

-- Check if default preferences were created for existing users
SELECT COUNT(*) FROM notification_preferences;
```

## 🔐 Security (RLS Policies)

The migration automatically sets up Row Level Security policies:

### notification_preferences
- ✅ Users can read/update their own preferences
- ✅ Admins can read/update all preferences
- ✅ Auto-creates default preferences on user signup

### user_profiles
- ✅ Users can read/update their own profile
- ✅ Admins can read/update all profiles

## 🎯 Features Enabled

Once the database is set up, users can:

1. **Profile Management**
   - Edit full name and phone number
   - View email (read-only)
   - See membership status

2. **Notifications**
   - Receive in-app notifications
   - Mark notifications as read
   - Group by date (Today, Yesterday, Older)

3. **Notification Preferences**
   - Toggle email notifications (signals, analyses, events, courses)
   - Toggle push notifications (signals, analyses, events, courses)
   - Manage marketing email preferences

## 🐛 Troubleshooting

### Error: "Could not find the table 'public.notification_preferences'"
- **Solution**: Run the `RUN_MOBILE_APP_SETUP.sql` migration

### Error: "column user_profiles.full_name does not exist"
- **Solution**: Run the `add_full_name_to_user_profiles.sql` migration

### Error: "permission denied for table notification_preferences"
- **Solution**: Check that RLS policies are enabled (they're included in the migration)

## 📱 Mobile App Changes

The mobile app has been updated to use the correct table names:
- `user_profiles` (not `profiles`)
- `notifications.notification_type` (not `notifications.type`)

## 🔄 Rollback (if needed)

If you need to rollback the changes:

```sql
-- Remove notification_preferences table
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- Remove full_name column from user_profiles
ALTER TABLE user_profiles DROP COLUMN IF EXISTS full_name;
```

## 📞 Support

If you encounter any issues:
1. Check the Supabase logs for detailed error messages
2. Verify your database connection
3. Ensure you have admin/service_role access
4. Contact support if problems persist

---

**Last Updated**: January 15, 2026
**Created By**: AllyTZ Panel Development Team
