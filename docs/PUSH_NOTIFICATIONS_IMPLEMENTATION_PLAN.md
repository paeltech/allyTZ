# On-Device (Push) Notifications – Implementation Plan

## Implementation status (February 2026)

**Code implemented.** Remaining steps are one-time setup and deployment:

1. **Apply migrations**: Run `supabase db push` (or apply `20260209100000_create_push_tokens.sql` and `20260209100001_trigger_push_on_notification.sql`).
2. **Enable pg_net**: In Supabase Dashboard → Database → Extensions, enable `pg_net` if not already enabled.
3. **Configure DB settings** (see [How to configure DB settings](#how-to-configure-db-settings) below).
4. **Deploy Edge Function**: `supabase functions deploy send-push-for-notification`.
5. **Android**: Add FCM V1 credentials in EAS (see Phase 3).
6. **iOS**: First EAS iOS build with push enabled (see Phase 4).

---

## How to configure DB settings

The push trigger (and the WhatsApp trigger) call Edge Functions via **pg_net**. They need two PostgreSQL settings so the trigger can authenticate:

1. **Get your values**
   - **Service role key**: Supabase Dashboard → **Project Settings** (gear) → **API** → under "Project API keys" copy the **`service_role`** key (secret).  
     ⚠️ Never commit this key or expose it in client code.
   - **Push function URL** (optional): Only if your project URL is different from the default. Default is  
     `https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/send-push-for-notification`.  
     If you use a different Supabase project, replace the host with your project ref (Dashboard → Settings → API → "Project URL" host).

2. **Run in SQL Editor**
   - Supabase Dashboard → **SQL Editor** → New query.
   - Run **one** of the following.

   **Option A – Only set the service role key** (push trigger will use the default URL above):

   ```sql
   ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...';  -- paste your service_role key
   ```

   **Option B – Set both** (e.g. different project or custom URL):

   ```sql
   ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...';
   ALTER DATABASE postgres SET app.settings.push_edge_function_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-for-notification';
   ```

   **If you already set `app.settings.service_role_key` for the WhatsApp trigger**, you don’t need to set it again; the push trigger uses the same setting.

3. **Apply**
   - These settings are stored in the database and apply to new sessions. Existing connections may need to reconnect. No restart required.

4. **Verify**
   - After deploying the Edge Function, insert a test row into `notifications` (e.g. from the Table Editor or SQL). Check Edge Function logs (Dashboard → Edge Functions → `send-push-for-notification` → Logs) to confirm the trigger fired and the function was called.

---

## Overview

This plan adds **native push notifications** to the AllyTZ Panel mobile app (Expo/React Native) for **Android** and **iOS**, so users receive on-device alerts for signals, events, and analyses even when the app is closed or in the background. It builds on the existing in-app notification system and `expo-notifications` (already installed).

---

## Current State

| Component | Status |
|-----------|--------|
| **expo-notifications** | Installed and plugin in `app.json` (color `#F4C464`) |
| **expo-constants** | Installed (for `projectId`) |
| **expo-device** | **Not installed** – required for physical device check |
| **Push token registration** | Not implemented |
| **Backend push sending** | Not implemented |
| **notification_preferences** | Table exists with `push_signals`, `push_analyses`, `push_events`, `push_courses` |
| **EAS** | Configured (`projectId` in `app.json`) |
| **In-app notifications** | DB table + real-time; triggers create rows for signals/analyses/events |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TRIGGERS (signals / trade_analyses / events INSERT)                         │
│  → INSERT into notifications (existing)                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  NEW: DB trigger or Edge Function invocation on notifications INSERT        │
│  → For each affected user: check push_prefs → get push_tokens → send push    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Expo Push API (exp.host/--/api/v2/push/send)                                │
│  → FCM (Android) / APNs (iOS) → device                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Single source of truth**: Any code or trigger that inserts into `notifications` will drive both in-app and push; no duplicate business logic.
- **Preferences**: Only send push to users who have the corresponding `push_signals` / `push_events` / `push_analyses` (and optionally `push_courses`) enabled.

---

## Phase 1: Client – Register and Store Push Token (Mobile App)

### 1.1 Dependencies

- **Add** `expo-device` in `mobile/` (required to ensure we only request token on physical device).
- Keep `expo-notifications`, `expo-constants` (already present).

```bash
cd mobile && npx expo install expo-device
```

### 1.2 Push token registration (new module)

- **New file**: `mobile/lib/push-notifications.ts` (or `mobile/services/push-notifications.ts`).
- **Responsibilities**:
  - **Android**: Create default notification channel (e.g. `default`, importance HIGH, vibration) via `Notifications.setNotificationChannelAsync`.
  - **Physical device check**: Use `expo-device`; if not a device, return `null` and do not request token.
  - **Permissions**: `getPermissionsAsync` → if not granted, `requestPermissionsAsync`; if still not granted, return `null`.
  - **Project ID**: `Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId` (must be set for Expo push).
  - **Token**: `Notifications.getExpoPushTokenAsync({ projectId })` → return token string.
  - **Handler**: `Notifications.setNotificationHandler` – e.g. show banner, play sound, set badge (so foreground notifications still appear).
- **Return**: `Promise<string | null>` (Expo push token or null).

### 1.3 Store token in backend

- **New table**: `push_tokens` (see Phase 2). Client will **upsert** a row keyed by `user_id` + `expo_push_token` (or `user_id` + `device_id` if you prefer one token per device).
- **When to register**:
  - After successful **login** (and when session is restored on app open).
  - Optionally on app focus, to refresh token (Expo tokens are stable but can change).
- **Where to call**: From root layout or a dedicated “auth + notifications” hook that runs when `session?.user` is set: call registration → get token → upsert to Supabase `push_tokens` (user_id, expo_push_token, platform: Android/iOS, optional device_id).

### 1.4 Handle incoming notifications (mobile)

- **Foreground**: Already handled by `setNotificationHandler`.
- **Listeners**:
  - `Notifications.addNotificationReceivedListener` – e.g. refresh in-app list or badge.
  - `Notifications.addNotificationResponseReceivedListener` – user **tapped** notification: read `response.notification.request.content.data` (e.g. `action_url`, `notification_id`, `notification_type`, `metadata`). Map to app route (reuse logic from `app/notifications.tsx` `getActionRoute` / `handleNotificationPress`) and call `router.push(route)`; optionally mark as read via API.
- **Initial notification** (app opened from quit state via notification): Use `Notifications.getLastNotificationResponseAsync()` on startup and handle same as response listener (navigate + mark read).

### 1.5 Notification preferences (mobile)

- **Existing**: `notification-preferences.tsx` already has toggles for `push_signals`, `push_analyses`, `push_events`, `push_courses`. No change required except ensuring backend respects these when sending (Phase 2).

---

## Phase 2: Backend – Store Tokens and Send Push

### 2.1 Database: `push_tokens` table

- **New migration**: e.g. `supabase/migrations/YYYYMMDD_create_push_tokens.sql`.
- **Columns**:
  - `id` UUID PK default `gen_random_uuid()`
  - `user_id` UUID NOT NULL REFERENCES `auth.users(id)` ON DELETE CASCADE
  - `expo_push_token` TEXT NOT NULL
  - `platform` TEXT NOT NULL CHECK (platform IN ('ios', 'android'))
  - `device_id` TEXT (optional; for “one token per device” and cleanup)
  - `created_at`, `updated_at` timestamptz
- **Unique constraint**: `(user_id, expo_push_token)` so the same token is not duplicated; use `ON CONFLICT (user_id, expo_push_token) DO UPDATE SET updated_at = now(), platform = excluded.platform`.
- **Indexes**: `user_id`, `expo_push_token`.
- **RLS**:
  - Users can INSERT/UPDATE/DELETE only their own rows (`auth.uid() = user_id`).
  - Service role (and optionally admins) can SELECT for sending; no need for app users to read each other’s tokens.

### 2.2 Sending push when a notification is created

**Option A – Database trigger + Edge Function (recommended)**

- **Trigger**: On `INSERT` into `notifications`, call a Supabase Edge Function (e.g. `send-push-for-notification`) via `pg_net` or `http` extension, passing `notification_id` (or payload: `user_id`, `notification_type`, `title`, `message`, `action_url`, `metadata`).
- **Edge Function**:
  - Receives the notification payload.
  - Loads `notification_preferences` for that `user_id`; if the corresponding push preference is false (e.g. `push_signals` for type `signal`), skip sending.
  - Loads all rows from `push_tokens` for that `user_id`.
  - Builds Expo push messages (title, body, `data`: `{ action_url, notification_id, notification_type, metadata }`).
  - Calls Expo Push API: `https://exp.host/--/api/v2/push/send` (or use `expo-server-sdk-node` in the function). Batch up to 100 per request.
  - Optional: on receipt of push tickets/receipts, handle `DeviceNotRegistered` by deleting that `push_tokens` row.

**Option B – Call Edge Function from existing app code**

- Where you currently insert into `notifications` (e.g. admin panels or existing triggers that only insert in-app), after insert call the same Edge Function with the new notification id. Single source of truth is still the `notifications` table; the function only “broadcasts” to devices.

Recommendation: **Option A** so that any future code that inserts into `notifications` automatically gets push without extra calls.

### 2.3 Edge Function implementation sketch

- **Function name**: e.g. `send-push-for-notification`.
- **Runtime**: Deno (Supabase Edge Functions).
- **Input**: `{ notification_id: string }` or full payload.
- **Steps**:
  1. Fetch notification row by id (use service role or a DB role that can read `notifications` and `push_tokens` and `notification_preferences`).
  2. Map `notification_type` to preference key: `signal` → `push_signals`, `event` → `push_events`, `announcement` → `push_analyses` (or similar), `system` → e.g. always send or a dedicated pref.
  3. If preference is false, exit.
  4. Select `expo_push_token` from `push_tokens` where `user_id = notification.user_id`.
  5. Build message(s) for Expo: `to`, `title`, `body`, `data: { action_url, notification_id, notification_type, metadata }`.
  6. POST to `https://exp.host/--/api/v2/push/send` (or use a small fetch wrapper; Expo’s Node SDK is Node-specific but the API is simple). Respect batch limit (e.g. 100).
  7. (Optional) Store push ticket IDs and later poll for receipts; on `DeviceNotRegistered`, delete the token from `push_tokens`.

If you prefer not to use Deno’s fetch for Expo and want to use Expo’s official SDK, you can run a small Node service (e.g. on the same host as your app or a serverless Node function) that the Edge Function calls, or invoke that service from your existing backend; the plan stays the same.

---

## Phase 3: Android-Specific Setup (FCM V1)

Push on Android requires FCM V1 credentials in Expo and `google-services.json` in the app.

### 3.1 Create Firebase project and FCM V1 key

1. **Firebase**: [Firebase Console](https://console.firebase.google.com) → create a project (or use an existing one).
2. **Service account key**: In the project → **Project settings** (gear) → **Service accounts** → **Generate new private key** → confirm. Save the JSON file securely and add it to `.gitignore` (do not commit).
3. **Upload to EAS** (choose one):
   - **EAS Dashboard**: [expo.dev](https://expo.dev) → your project → **Credentials** → **Android** → your application identifier (e.g. `com.allytz.panel`) → under **Service Credentials** → **FCM V1 service account key** → **Add a service account key** → upload the JSON → **Save**.
   - **CLI**: Run `eas credentials` → **Android** → **production** (or **development** if you only use dev builds) → **Google Service Account** → **Manage your Google Service Account Key for Push Notifications (FCM V1)** → **Upload a new service account key** → select the JSON file.

### 3.2 Add google-services.json to the mobile app

1. **Download**: Firebase Console → Project settings → **General** → under "Your apps" add an Android app if needed (package: `com.allytz.panel`) → download **google-services.json**.
2. **Place file**: Put `google-services.json` in the **mobile/** directory (same level as `app.json`).
3. **Wire in app.json**: The mobile `app.json` should have `"android": { ..., "googleServicesFile": "./google-services.json" }`. This is required for the Android app to register with FCM.

### 3.3 Build and test

- Use **EAS Build** for Android (`eas build --platform android`). Development and production builds use the same FCM credentials once uploaded.
- Test on a **physical device**; push is not supported on the Android emulator.
- The default notification channel is created in code (`channelId: 'default'`).

---

## Phase 4: iOS-Specific Setup

- **Apple Developer Account**: Required for push (APNs).
- **EAS first build**: When running `eas build --platform ios` for the first time, EAS CLI will prompt:
  - “Setup Push Notifications for your project?” → Yes.
  - “Generate a new Apple Push Notifications service key?” → Yes.
- **Device registration**: For **development** builds, register the test device in the Apple Developer portal (or let EAS handle it when building for a registered device).
- **Capabilities**: EAS Build adds the Push Notifications capability to the app; no manual Xcode step needed if you use managed workflow.
- **Testing**: Use a **physical device**; push is not supported on iOS Simulator.
- **Optional**: In `app.json` / `app.config.js`, you can set iOS-specific notification options (e.g. `sound`, `_contentAvailable`) if needed later.

---

## Phase 5: End-to-End and Reliability

- **Respect preferences**: Backend must only send when the corresponding `notification_preferences.push_*` is true.
- **Badge**: Optional: set `badge` in the Expo payload to unread count (iOS); update when user opens app or marks read.
- **Token lifecycle**: On logout, remove the current device’s token from `push_tokens` (or delete all tokens for that user). On `DeviceNotRegistered` in receipts, remove that token.
- **Rate limiting**: Expo allows a high rate (e.g. 600/sec per project); batching (e.g. 100 per request) and optional retry with backoff are recommended.
- **Security**: Prefer storing Expo Push Token only on your backend; do not expose tokens to other users. Optionally enable [Expo push access token](https://docs.expo.dev/accounts/programmatic-access) for extra security.

---

## File and Change Summary

| Area | Action |
|------|--------|
| **mobile** | Add `expo-device`. |
| **mobile** | New `lib/push-notifications.ts` (or `services/push-notifications.ts`): permissions, channel, token, handler. |
| **mobile** | New hook or logic in `_layout.tsx` / auth flow: register token after login, upsert to `push_tokens`. |
| **mobile** | In root layout or a provider: set `Notifications.setNotificationHandler`; add received/response listeners; handle `getLastNotificationResponseAsync` on startup. |
| **mobile** | Reuse `getActionRoute` (or equivalent) for tap-to-navigate from push `data`. |
| **Supabase** | New migration: `push_tokens` table + RLS. |
| **Supabase** | New Edge Function: `send-push-for-notification` (or similar); optional DB trigger invoking it on `notifications` INSERT. |
| **EAS** | Android: upload FCM V1 credentials. |
| **EAS** | iOS: first build with push enabled; ensure device registered for dev. |

---

## Testing Checklist

- [ ] **Android physical device**: Login → token registered and stored in `push_tokens`. Create signal/event as admin → in-app notification created → push received on device. Tap push → app opens to correct screen.
- [ ] **iOS physical device**: Same flow.
- [ ] **Preferences**: Disable “Push – Signals”; create signal → in-app notification exists, no push. Re-enable → push received again.
- [ ] **Foreground**: App open → push received → banner shown; tap → navigates.
- [ ] **Background / killed**: App in background or killed → push received → tap opens app and navigates.
- [ ] **Logout**: Token removed (or marked inactive) so no push after logout.

---

## Troubleshooting: push_tokens table empty

If `push_tokens` stays empty after logging in on Android (or iOS), the token is never saved. **You do not need a new account** – the same account is fine. Check the following:

1. **Use a development build on a physical device**  
   Push does **not** work in Expo Go or on emulators. Build and install a dev build:
   - `cd mobile && eas build --profile development --platform android`  
   - Install the built APK on a real phone, then open the app and log in.

2. **Watch the app logs**  
   In dev, the app now logs push steps. With the app running (e.g. via `npx expo start` and “Open on Android” from the dev build), check Metro/terminal for:
   - `[Push] Not a physical device` → you’re in Expo Go or an emulator; use a dev build on a real device.
   - `[Push] Permission denied` → enable “Notifications” for the app in Android system settings (Settings → Apps → AllyTZ Panel → Notifications).
   - `[Push] No EAS projectId` → `app.json` should have `extra.eas.projectId`; dev/production builds include it; Expo Go may not.
   - `[Push] getExpoPushTokenAsync failed` → often Expo Go or missing FCM credentials; use a dev build and add FCM V1 credentials in EAS.
   - `[Push] Failed to save token to push_tokens: ...` → RLS or upsert error; check the message and that the `push_tokens` migration is applied.
   - `[Push] Token saved to push_tokens` → token was saved; if the table is still empty, check you’re looking at the same Supabase project and that RLS isn’t hiding the row (e.g. query with service role or as that user).

3. **Android notification permission (Android 13+)**  
   The app requests permission at runtime. If you previously denied, go to **Settings → Apps → AllyTZ Panel → Notifications** and turn them on, then restart the app and log in again.

4. **FCM credentials (Android)**  
   For a dev/production build to get a token, EAS must have FCM V1 credentials. In [Expo dashboard](https://expo.dev) → your project → Credentials → Android → add the FCM V1 service account key. Without it, `getExpoPushTokenAsync` can fail.

5. **Migrations and RLS**  
   Ensure `20260209100000_create_push_tokens.sql` has been applied. Users can only INSERT/UPDATE/DELETE their own rows; the anon key with the user’s JWT is used, so the logged-in user must match `user_id` in the upsert.

---

## Troubleshooting: "google-services.json is missing" on EAS Build

**Two different Firebase files:**

| File | Where to get it | Where it goes |
|------|------------------|---------------|
| **FCM V1 service account key** (JSON) | Firebase → Project settings → Service accounts → Generate new private key | EAS → Credentials → Android → FCM V1 service account key (for **sending** push) |
| **google-services.json** | Firebase → Project settings → General → Your apps → Android app → **Download google-services.json** | In your repo: **`mobile/google-services.json`** (for the **build** to register the app with FCM) |

If you only uploaded the **service account key** to EAS Credentials, that’s correct for push sending, but the **build** still needs **google-services.json** in the project. Add it like this:

### Fix: Add google-services.json to the repo (recommended)

EAS only uploads files **tracked by git**. File-type environment variables (e.g. `GOOGLE_SERVICES_JSON`) set as **Secret** are **not** available when `app.config.js` runs, so the path is never set and the build still fails. The reliable fix is to commit the file.

1. **Download** the correct file: [Firebase Console](https://console.firebase.google.com) → your project → **Project settings** (gear) → **General** → under “Your apps” select your **Android** app (package `com.allytz.panel`) → **Download google-services.json**. (If you don’t have an Android app, add one with that package name first.)
2. **Put** the downloaded file in the **`mobile/`** directory and name it exactly **`google-services.json`** (next to `app.json`).
3. **Commit and push** so EAS can upload it:
   ```bash
   git add mobile/google-services.json
   git commit -m "Add google-services.json for FCM"
   git push
   ```
4. **Rebuild** from the `mobile/` directory: `cd mobile && eas build --profile development --platform android`.

`google-services.json` is not secret (only public identifiers); committing it is the usual approach and avoids EAS config timing issues.

---

## References

- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Send notifications with the Expo Push Service](https://docs.expo.dev/push-notifications/sending-notifications/)
- [Add Android FCM V1 credentials](https://docs.expo.dev/push-notifications/fcm-credentials)
- [expo-notifications API](https://docs.expo.dev/versions/latest/sdk/notifications/)
- Existing: `IN_APP_NOTIFICATIONS_IMPLEMENTATION.md`, `mobile/app/notifications.tsx`, `create_in_app_notification_triggers.sql`, `create_notification_preferences.sql`

---

**Document version**: 1.0  
**Last updated**: February 2026
