import { File } from 'expo-file-system';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  PANEL_DOCUMENT_BUCKET,
} from '../../shared/types/document';
import { supabase } from './supabase';

export async function uploadPanelDocument(
  localUri: string,
  fileName: string,
  mimeType: string
): Promise<{
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
}> {
  const normalizedMime = mimeType || 'application/octet-stream';
  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(normalizedMime as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number])) {
    throw new Error('File type not allowed. Use PDF or images.');
  }

  const file = new File(localUri);
  const bytes = await file.bytes();

  if (bytes.byteLength > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error('File must be under 20 MB');
  }

  const ext = fileName.split('.').pop() || 'bin';
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  const { error } = await supabase.storage.from(PANEL_DOCUMENT_BUCKET).upload(path, bytes, {
    contentType: normalizedMime,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  return {
    file_path: path,
    file_name: fileName,
    mime_type: normalizedMime,
    file_size_bytes: bytes.byteLength,
  };
}
