/**
 * Shared image MIME helpers (safe for client + server API routes).
 */

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

function decodeBase64Prefix(base64: string, byteLength = 16): Uint8Array {
  const clean = base64.replace(/\s/g, '');
  const slice = clean.slice(0, Math.ceil((byteLength * 4) / 3) + 4);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];
  for (let i = 0; i < slice.length; i += 4) {
    const c1 = chars.indexOf(slice[i] ?? 'A');
    const c2 = chars.indexOf(slice[i + 1] ?? 'A');
    const c3 = chars.indexOf(slice[i + 2] ?? '=');
    const c4 = chars.indexOf(slice[i + 3] ?? '=');
    if (c1 < 0 || c2 < 0) break;
    const n =
      (c1 << 18) | (c2 << 12) | ((c3 < 0 ? 0 : c3) << 6) | (c4 < 0 ? 0 : c4);
    bytes.push((n >> 16) & 255);
    if (c3 >= 0) bytes.push((n >> 8) & 255);
    if (c4 >= 0) bytes.push(n & 255);
    if (bytes.length >= byteLength) break;
  }
  return new Uint8Array(bytes.slice(0, byteLength));
}

export function detectMimeFromBase64(base64: string): ImageMime | null {
  const b = decodeBase64Prefix(base64, 16);
  if (b.length < 3) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return 'image/png';
  }
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export function normalizeMime(mime: string): ImageMime {
  if (mime === 'image/png') return 'image/png';
  if (mime === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}
