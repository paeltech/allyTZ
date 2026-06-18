import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

type NotificationType = "signal" | "event" | "announcement" | "system" | "tip";

const TYPE_TO_PREF: Partial<Record<NotificationType, keyof {
  push_signals: boolean;
  push_events: boolean;
  push_analyses: boolean;
  push_tips: boolean;
}>> = {
  signal: "push_signals",
  event: "push_events",
  announcement: "push_analyses",
  tip: "push_tips",
};

interface NotificationRow {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const notificationId = body.notification_id as string | undefined;
    if (!notificationId) {
      return new Response(
        JSON.stringify({ error: "notification_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select("id, user_id, notification_type, title, message, action_url, metadata")
      .eq("id", notificationId)
      .single();

    if (notifError || !notification) {
      console.error("Notification fetch error:", notifError);
      return new Response(
        JSON.stringify({ error: "Notification not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const row = notification as NotificationRow;
    const prefKey = TYPE_TO_PREF[row.notification_type];
    if (prefKey) {
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select(prefKey)
        .eq("user_id", row.user_id)
        .single();
      const enabled = prefs?.[prefKey];
      if (enabled === false) {
        return new Response(
          JSON.stringify({ skipped: "user disabled push for this type" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("expo_push_token")
      .eq("user_id", row.user_id);

    if (tokensError || !tokens?.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No push tokens for user" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      title: row.title,
      body: row.message,
      sound: "default" as const,
      priority: "high" as const,
      data: {
        action_url: row.action_url ?? undefined,
        notification_id: row.id,
        notification_type: row.notification_type,
        metadata: row.metadata ?? undefined,
      },
      channelId: "default",
    };

    const messages = tokens.map((t: { expo_push_token: string }) => ({
      to: t.expo_push_token,
      ...payload,
    }));

    let totalSent = 0;
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Expo push error:", res.status, errText);
        return new Response(
          JSON.stringify({ error: "Expo push failed", details: errText }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await res.json();
      const okCount = Array.isArray(result.data)
        ? result.data.filter((t: { status?: string }) => t.status === "ok").length
        : result.data?.status === "ok"
        ? 1
        : 0;
      totalSent += okCount;
    }

    return new Response(
      JSON.stringify({ sent: totalSent, tokens: messages.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-push-for-notification error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
