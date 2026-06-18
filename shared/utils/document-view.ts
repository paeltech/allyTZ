import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../constants/supabase";

/** Edge Function endpoint for inline document viewing (auth required). */
export function getPanelDocumentViewUrl(documentId: string): string {
  return `${SUPABASE_URL}/functions/v1/view-panel-document?documentId=${encodeURIComponent(documentId)}`;
}

/** Headers required by Supabase Edge Functions (JWT + apikey). */
export function getPanelDocumentViewHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    apikey: SUPABASE_PUBLISHABLE_KEY,
  };
}

export function formatDocumentFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isPdfMimeType(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}
