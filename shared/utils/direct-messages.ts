import { SUPABASE_URL } from '../constants/supabase';

export const DIRECT_MESSAGE_BUCKET = 'direct-message-attachments';
export const DIRECT_MESSAGE_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function getDirectMessageAttachmentUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = SUPABASE_URL.replace(/\/$/, '');
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${base}/storage/v1/object/public/${DIRECT_MESSAGE_BUCKET}/${encodedPath}`;
}

export function buildDirectMessageAttachmentPath(
  authorId: string,
  threadUserId: string,
  extension: string
): string {
  const safeExt = extension.replace(/^\./, '').toLowerCase() || 'jpg';
  return `${authorId}/${threadUserId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${safeExt}`;
}
