import type { SignalPostAudience, SignalPostType } from "../types/signal";
import { SUPABASE_URL } from "../constants/supabase";

export const SIGNAL_POST_BUCKET = "signal-post-attachments";

export const SIGNAL_POST_TYPE_OPTIONS: { value: SignalPostType; label: string }[] = [
  { value: "feedback", label: "Feedback" },
  { value: "update", label: "Update" },
  { value: "question", label: "Question" },
  { value: "query", label: "Query" },
];

export const USER_SIGNAL_POST_TYPE_OPTIONS = SIGNAL_POST_TYPE_OPTIONS.filter(
  (o) => o.value !== "update"
);

export const SIGNAL_POST_AUDIENCE_OPTIONS: { value: SignalPostAudience; label: string; description: string }[] = [
  {
    value: "all_users",
    label: "All users",
    description: "Visible to everyone following this signal",
  },
  {
    value: "admin_only",
    label: "Admin only",
    description: "Only admins and you can see this post",
  },
];

export function getSignalPostTypeLabel(type: SignalPostType): string {
  return SIGNAL_POST_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function getSignalPostAudienceLabel(audience: SignalPostAudience): string {
  return SIGNAL_POST_AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? audience;
}

export function getSignalPostAttachmentUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = SUPABASE_URL.replace(/\/$/, "");
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${SIGNAL_POST_BUCKET}/${encodedPath}`;
}

export function buildSignalPostAttachmentPath(
  authorId: string,
  signalId: string,
  extension: string
): string {
  const safeExt = extension.replace(/^\./, "").toLowerCase() || "jpg";
  return `${authorId}/${signalId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${safeExt}`;
}

export const SIGNAL_POST_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
] as const;

export const SIGNAL_POST_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
