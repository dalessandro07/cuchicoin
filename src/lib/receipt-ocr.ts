/**
 * On-device OCR for receipt / boleta images via expo-mlkit-ocr.
 * Requires a development build (not Expo Go). Unsupported on web.
 */

import { Platform } from 'react-native';

export class ReceiptOcrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReceiptOcrError';
  }
}

export function isReceiptOcrSupported(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    // Lazy require so web/metro doesn't crash if the native stub throws on import.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isSupported } = require('expo-mlkit-ocr') as {
      isSupported: () => boolean;
    };
    return isSupported();
  } catch {
    return false;
  }
}

export async function recognizeReceiptText(imageUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    throw new ReceiptOcrError('El escáner OCR no está disponible en la versión web.');
  }
  if (!imageUri?.trim()) {
    throw new ReceiptOcrError('No se encontró una imagen para escanear.');
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isSupported, recognizeText } = require('expo-mlkit-ocr') as {
      isSupported: () => boolean;
      recognizeText: (uri: string) => Promise<{ text: string }>;
    };

    if (!isSupported()) {
      throw new ReceiptOcrError(
        'El OCR no es compatible con este dispositivo. Necesitas iOS 16+ o Android 5+.',
      );
    }

    const result = await recognizeText(imageUri);
    const text = (result.text ?? '').trim();
    if (!text) {
      throw new ReceiptOcrError(
        'No se detectó texto en la imagen. Prueba con otra foto más nítida.',
      );
    }
    return text;
  } catch (err) {
    if (err instanceof ReceiptOcrError) throw err;
    const message =
      err instanceof Error && err.message.includes('native module')
        ? 'El módulo OCR no está disponible. Usa un development build (no Expo Go).'
        : err instanceof Error
          ? err.message
          : 'Falló el reconocimiento de texto';
    throw new ReceiptOcrError(message);
  }
}
