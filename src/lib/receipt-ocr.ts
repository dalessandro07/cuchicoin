/**
 * On-device OCR for receipt / boleta images via expo-mlkit-ocr.
 * Requires a development build (not Expo Go). Unsupported on web.
 */

import { Platform } from 'react-native';

import { parseSolesToCents } from '@/lib/money';

export class ReceiptOcrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReceiptOcrError';
  }
}

/**
 * Decorative names printed on Yape payment screenshots (bill artwork),
 * keyed by amount range in soles. Not the real sender/receiver.
 */
const YAPE_DESIGN_NAMES_BY_RANGE: ReadonlyArray<{
  minCents: number;
  maxCents: number | null;
  name: string;
}> = [
  { minCents: 10, maxCents: 1999, name: 'José Abelardo Quiñones' }, // S/ 0.10–19.99
  { minCents: 2000, maxCents: 4999, name: 'Miguel Grau' }, // S/ 20–49.99
  { minCents: 5000, maxCents: 9999, name: 'Abraham Valdelomar' }, // S/ 50–99.99
  { minCents: 10000, maxCents: 19999, name: 'Pedro Paulet' }, // S/ 100–199.99
  { minCents: 20000, maxCents: null, name: 'Santa Rosa de Lima' }, // S/ 200+
];

const SOLES_AMOUNT_RE = /S\/\s*([\d.,]+)/gi;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function designNameForAmountCents(cents: number): string | null {
  for (const range of YAPE_DESIGN_NAMES_BY_RANGE) {
    if (cents < range.minCents) continue;
    if (range.maxCents != null && cents > range.maxCents) continue;
    return range.name;
  }
  return null;
}

/** Largest S/ amount in the OCR text, or null if none parse. */
export function extractPrimaryAmountCents(text: string): number | null {
  let max: number | null = null;
  for (const match of text.matchAll(SOLES_AMOUNT_RE)) {
    const cents = parseSolesToCents(match[1] ?? '');
    if (cents == null || cents < 10) continue;
    if (max == null || cents > max) max = cents;
  }
  return max;
}

/** Accent-tolerant regex for a full person name (spaces flexible). */
function nameToRegex(name: string): RegExp {
  const ascii = name.normalize('NFD').replace(/\p{M}/gu, '');
  const body = ascii
    .trim()
    .split(/\s+/)
    .map((word) =>
      [...word]
        .map((ch) =>
          /[a-zA-Z]/.test(ch) ? `${escapeRegExp(ch)}\\p{M}?` : escapeRegExp(ch),
        )
        .join(''),
    )
    .join('\\s+');
  return new RegExp(body, 'giu');
}

/**
 * Removes the Yape bill design name that matches the detected amount range.
 * If no amount can be parsed, returns the text unchanged.
 */
export function stripYapeDesignNames(text: string): string {
  const amountCents = extractPrimaryAmountCents(text);
  if (amountCents == null) return text;

  const designName = designNameForAmountCents(amountCents);
  if (!designName) return text;

  return text
    .replace(nameToRegex(designName), ' ')
    .replace(/[^\S\n]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
    const text = stripYapeDesignNames((result.text ?? '').trim());
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
