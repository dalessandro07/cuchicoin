/**
 * Prepare local receipt images for FreeLLM vision: resize/compress to JPEG
 * and detect real MIME via magic bytes (URI extensions are unreliable).
 */

import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import {
  detectMimeFromBase64,
  type ImageMime,
} from '@/lib/image-mime';

export type ImageBase64Result = {
  base64: string;
  mimeType: ImageMime;
};

export { detectMimeFromBase64 } from '@/lib/image-mime';

const MAX_WIDTH = 1280;
const JPEG_QUALITY = 0.7;

async function readFileBase64(uri: string): Promise<string> {
  const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  return base64.replace(/\s/g, '');
}

/**
 * Resize + JPEG-compress a local image, then return base64 suitable for FreeLLM.
 */
export async function prepareReceiptImage(uri: string): Promise<ImageBase64Result> {
  if (!uri?.trim()) {
    throw new Error('No hay una imagen para leer.');
  }

  try {
    const manipulated = await manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: JPEG_QUALITY, format: SaveFormat.JPEG },
    );
    const base64 = await readFileBase64(manipulated.uri);
    if (!base64) {
      throw new Error('La imagen comprimida quedó vacía.');
    }
    const detected = detectMimeFromBase64(base64);
    return {
      base64,
      mimeType: detected ?? 'image/jpeg',
    };
  } catch (err) {
    try {
      const base64 = await readFileBase64(uri);
      const detected = detectMimeFromBase64(base64);
      if (!detected) {
        throw new Error(
          'El archivo no parece una imagen JPEG/PNG/WebP válida.',
        );
      }
      return { base64, mimeType: detected };
    } catch (fallbackErr) {
      const message =
        err instanceof Error
          ? err.message
          : fallbackErr instanceof Error
            ? fallbackErr.message
            : 'No se pudo preparar la imagen';
      throw new Error(
        `No se pudo preparar la imagen para el escáner. ${message}`,
      );
    }
  }
}

/** @deprecated Prefer prepareReceiptImage */
export async function readImageAsBase64(uri: string): Promise<ImageBase64Result> {
  return prepareReceiptImage(uri);
}
