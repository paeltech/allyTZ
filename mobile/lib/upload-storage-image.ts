import {
  extensionForSignalPostMime,
  normalizeSignalPostImageMime,
  uploadSignalPostImage,
} from '../../shared/utils/signal-post-image';
import { readLocalImageBytes } from './read-local-image';
import { supabase } from './supabase';
import { DIRECT_MESSAGE_MAX_IMAGE_BYTES } from '../../shared/utils/direct-messages';

export async function uploadImageToBucket(
  bucket: string,
  path: string,
  localUri: string,
  mimeType: string
): Promise<void> {
  const normalizedMime = normalizeSignalPostImageMime(mimeType);
  const bytes = await readLocalImageBytes(localUri);

  if (bytes.byteLength > DIRECT_MESSAGE_MAX_IMAGE_BYTES) {
    throw new Error('Image must be under 5 MB');
  }

  if (bucket === 'signal-post-attachments') {
    await uploadSignalPostImage(supabase, path, bytes, normalizedMime);
    return;
  }

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: normalizedMime,
    upsert: false,
  });

  if (error) throw new Error(error.message);
}

export function extensionFromMime(mimeType: string): string {
  return extensionForSignalPostMime(normalizeSignalPostImageMime(mimeType));
}
