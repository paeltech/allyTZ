import { File } from 'expo-file-system';

/** Read picked image bytes using Expo SDK 54+ File API. */
export async function readLocalImageBytes(uri: string): Promise<Uint8Array> {
  const file = new File(uri);
  const bytes = await file.bytes();

  if (bytes.byteLength === 0) {
    throw new Error('Could not read the selected image. Please try another photo.');
  }

  return bytes;
}
