# In-App Notifications Not Showing - Debug Guide

## 🔍 Issue: Created signal but notification not appearing on user dashboard

Let's debug this step by step:

---

## Step 1: ✅ Check Database Migration Applied

### Option A: Supabase Dashboard (Easiest)

1. **Go to**: https://supabase.com/dashboard
2. **Open**: Your AllyTZ Panel project
3. **Navigate**: Table Editor → Look for `notifications` table
4. **If table exists** ✅ - Migration applied
5. **If table missing** ❌ - Need to apply migration

### Option B: Run Migration Manually

If table doesn't exist, apply the migration:

```bash
# Using Supabase CLI
cd /Users/paulmandele/Desktop/Dev.nosync/allyTZ_panel

# Check migration status
supabase migration list

# Apply migrations
supabase db push

# Or apply specific migration
supabase migration up --file supabase/migrations/create_notifications_table.sql
```

### Option C: SQL Editor

1. **Go to**: Supabase Dashboard → SQL Editor
2. **Run this check**:
```sql
-- Check if notifications table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications'
);
-- Should return: true

-- If false, run the migration file manually
-- Copy contents of: supabase/migrations/create_notifications_table.sql
-- Paste and execute in SQL Editor
```

---

## Step 2: ✅ Check User Has Active Signal Subscription

The notification only goes to users with **active signal subscriptions**.

### Check in Supabase Dashboard:

```sql
-- Check signal_subscriptions table
SELECT 
  user_id,
  status,
  created_at
FROM signal_subscriptions
WHERE status = 'active';

-- If no rows: No users will get notifications!
-- Solution: Make sure test user has active subscription
```

### Create Test Subscription:

```sql
-- Get your test user ID first
SELECT id, email FROM auth.users WHERE email = 'your-test-email@example.com';

-- Create active subscription for test user
INSERT INTO signal_subscriptions (user_id, status)
VALUES ('YOUR-USER-ID-HERE', 'active')
ON CONFLICT (user_id) 
DO UPDATE SET status = 'active';
```

---

## Step 3: ✅ Check Browser Console for Errors

### While Creating Signal:

1. **Open Admin Panel** → Create Signal
2. **Open Browser Console** (F12)
3. **Look for errors** when signal is created
4. **Common errors**:

```javascript
// ❌ Table doesn't exist
Error: relation "public.notifications" does not exist

// ❌ Permission denied (RLS issue)
Error: new row violates row-level security policy

// ❌ User not found
Error: insert or update on table "notifications" violates foreign key constraint

// ✅ Success (should see)
console.log('In-app notifications created for X users')
```

### Check Network Tab:

1. **Network Tab** → Filter: `notifications`
2. **Look for POST** request to Supabase
3. **Check response**: Should be 201 Created
4. **If 400/403**: RLS policy blocking insert

---

## Step 4: ✅ Check Notification Creation Code Executed

### In AdminSignals.tsx:

Open browser console when creating signal and look for:

```javascript
// Should see these logs:
"Creating in-app notifications for signal: <signal-id>"
"In-app notifications created for X users"

// If you don't see these logs:
// - Code might not be executing
// - Check AdminSignals.tsx onSuccess function
```

### Verify Code is Running:

```typescript
// In src/pages/admin/AdminSignals.tsx
// Around line 453, should have:

// Create in-app notifications for subscribed users
try {
  console.log('Creating in-app notifications for signal:', signal.id);
  // ... notification creation code
  console.log(`In-app notifications created for ${userIds.length} users`);
} catch (error) {
  console.error('Error creating in-app notifications:', error);
}
```

---

## Step 5: ✅ Check User Dashboard Bell Icon

### User Dashboard Checklist:

1. **Is user logged in?** (Bell only shows when logged in)
2. **Is bell icon visible?** (Check SiteHeader component)
3. **Check browser console** for hook errors:

```javascript
// Common errors:
Error: Failed to fetch notifications
Error: RLS policy violation
Error: User not authenticated
```

4. **Open DevTools → Application → Local Storage**
   - Check if session exists
   - User should have valid JWT token

---

## Step 6: ✅ Test Notification Creation Manually

### Direct Database Insert (Bypass Code):

```sql
-- Insert test notification directly
INSERT INTO notifications (
  user_id,
  notification_type,
  title,
  message,
  action_url,
  metadata
) VALUES (
  'YOUR-USER-ID-HERE',  -- Replace with actual user ID
  'signal',
  '📈 Test Signal: EUR/USD',
  'Test notification - Entry at 1.0950',
  '/dashboard/signals',
  '{"signal_id": "test", "trading_pair": "EUR/USD"}'::jsonb
);

-- Check if it was created
SELECT * FROM notifications 
WHERE user_id = 'YOUR-USER-ID-HERE'
ORDER BY created_at DESC
LIMIT 5;
```

**If this works** → Problem is in the creation code
**If this fails** → Problem is with database/RLS

---

## Step 7: ✅ Check RLS Policies

### Verify Insert Policy:

```sql
-- Check if admin can insert notifications
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'notifications';

-- Should see policy: "Service role and admins can insert notifications"
```

### Test Admin Permissions:

```sql
-- Check if current user is admin
SELECT is_admin(auth.uid());
-- Should return: true (when logged in as admin)
```

### Common RLS Issue - Fix:

If insert fails with "permission denied", temporarily test without RLS:

```sql
-- ONLY FOR DEBUGGING - NEVER IN PRODUCTION
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Try creating signal again
-- Does it work now?

-- Re-enable RLS after testing
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

---

## Step 8: ✅ Check Real-Time Subscription

### Verify Supabase Realtime Enabled:

1. **Supabase Dashboard** → Database → Replication
2. **Check**: `notifications` table is enabled for realtime
3. **If not enabled**: Toggle it on

### Test Real-Time in Console:

```javascript
// Run this in browser console on user dashboard
import { supabase } from '@/integrations/supabase/client';

const channel = supabase
  .channel('test-notifications')
  .on('postgres_changes', 
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.YOUR-USER-ID`
    },
    (payload) => {
      console.log('Real-time notification received!', payload);
    }
  )
  .subscribe();

// Now create a signal as admin
// Should see log in this console
```

---

## Quick Diagnostic Script

Run this in **Supabase SQL Editor** to get full diagnostic:

```sql
-- COMPLETE DIAGNOSTIC CHECK
-- Run this and share results if still stuck

-- 1. Check notifications table exists
SELECT 'Notifications table exists: ' || 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
  );

-- 2. Count total notifications
SELECT 'Total notifications: ' || COUNT(*) FROM notifications;

-- 3. Count unread notifications per user
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM notifications
WHERE read = false AND deleted = false
GROUP BY user_id;

-- 4. Check active signal subscriptions
SELECT 
  'Active signal subscriptions: ' || COUNT(*) 
FROM signal_subscriptions 
WHERE status = 'active';

-- 5. Check RLS policies
SELECT 
  'RLS policies: ' || COUNT(*) 
FROM pg_policies 
WHERE tablename = 'notifications';

-- 6. Show recent notifications
SELECT 
  id,
  user_id,
  notification_type,
  title,
  created_at,
  read
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Check if realtime enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'notifications';
```

---

## Common Solutions

### Issue #1: "Table doesn't exist"
**Solution**: Apply migration in Supabase Dashboard SQL Editor

### Issue #2: "No notifications created"
**Solution**: User needs active signal subscription
```sql
INSERT INTO signal_subscriptions (user_id, status)
VALUES ('USER-ID', 'active');
```

### Issue #3: "Permission denied"
**Solution**: Check you're logged in as admin when creating signal

### Issue #4: "Bell icon not showing count"
**Solution**: 
- Check browser console for errors
- Verify user is logged in
- Check if useUnreadCount hook is being called

### Issue #5: "Notification created but not appearing"
**Solution**: 
- Check RLS policy allows user to read their notifications
- Verify user_id matches logged-in user
- Check realtime subscription is active

---

## Testing Flow (Start Fresh)

1. **Apply Migration**:
```bash
# In Supabase SQL Editor
-- Paste contents of create_notifications_table.sql
-- Execute
```

2. **Create Test User Subscription**:
```sql
-- Get user ID
SELECT id FROM auth.users WHERE email = 'test@example.com';

-- Create subscription
INSERT INTO signal_subscriptions (user_id, status)
VALUES ('USER-ID-HERE', 'active');
```

3. **Open Two Browser Windows**:
   - Window 1: Admin panel (logged in as admin)
   - Window 2: User dashboard (logged in as test user)

4. **Open Console in Both**:
   - Look for any errors

5. **Create Signal (Admin Window)**:
   - Check console logs
   - Should see: "Creating in-app notifications..."
   - Should see: "In-app notifications created for X users"

6. **Check User Dashboard (User Window)**:
   - Bell icon should show badge count
   - Click bell → Should see notification
   - Check console for any errors

---

## Still Not Working?

### Share This Debug Info:

1. **Console Logs** when creating signal
2. **SQL Query Results** from diagnostic script above
3. **Browser Console Errors** on user dashboard
4. **Screenshot** of bell icon area
5. **Supabase Dashboard** → Table Editor → notifications (row count)

### Most Common Fix:

90% of the time, it's one of these:
- ❌ Migration not applied → Apply in SQL Editor
- ❌ No active subscription → Create subscription for test user
- ❌ Wrong user logged in → Make sure test user is logged in, not admin

---

## Quick Test Command

Run this to verify everything is set up:

```bash
# Check if files exist
ls -la src/hooks/use-notifications.tsx
ls -la src/components/notifications/NotificationDropdown.tsx
ls -la supabase/migrations/create_notifications_table.sql

# Should all exist ✅
```

---

**Need More Help?** Run the diagnostic SQL script above and share the output!
