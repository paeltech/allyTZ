import { SIGNAL_POST_BUCKET } from "./signal-posts";

/** Normalize MIME types from pickers (e.g. image/jpg → image/jpeg). */
export function normalizeSignalPostImageMime(mime: string | null | undefined): string {
  const value = (mime || "image/jpeg").toLowerCase();
  if (value === "image/jpg") return "image/jpeg";
  if (value === "image/heic" || value === "image/heif") return "image/jpeg";
  return value;
}

export function extensionForSignalPostMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Decode base64 image data for Supabase upload (React Native / web). */
export function decodeBase64Image(base64: string): Uint8Array {
  return base64ToUint8Array(base64.replace(/^data:[^;]+;base64,/, ""));
}

export interface SignalPostImageUploadClient {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Uint8Array | ArrayBuffer | Blob | File,
        options?: { contentType?: string; upsert?: boolean }
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
}

export async function uploadSignalPostImage(
  client: SignalPostImageUploadClient,
  path: string,
  data: Uint8Array | ArrayBuffer | Blob | File,
  mimeType: string
): Promise<void> {
  if (data instanceof Uint8Array && data.byteLength === 0) {
    throw new Error("Image file is empty");
  }
  if (data instanceof Blob && data.size === 0) {
    throw new Error("Image file is empty");
  }
  if (data instanceof File && data.size === 0) {
    throw new Error("Image file is empty");
  }

  const contentType = normalizeSignalPostImageMime(mimeType);
  const { error } = await client.storage.from(SIGNAL_POST_BUCKET).upload(path, data, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }
}
