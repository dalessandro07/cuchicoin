import { z } from 'zod';

import {
  ApiError,
  handle,
  json,
  readBody,
  requireUser,
} from '@/lib/api-guard';
import { extractJsonObject, freellmChatCompletion } from '@/lib/freellm';
import { detectMimeFromBase64, normalizeMime } from '@/lib/image-mime';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB decoded

const categoryInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['expense', 'income']),
});

const requestSchema = z
  .object({
    imageBase64: z.string().trim().max(7_000_000).optional(),
    mimeType: z
      .enum(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
      .optional()
      .default('image/jpeg'),
    categories: z.array(categoryInputSchema).min(1).max(80),
    ocrText: z.string().trim().max(12_000).optional(),
  })
  .refine(
    (data) =>
      Boolean(data.imageBase64?.trim()) || Boolean(data.ocrText?.trim()),
    { message: 'Se necesita una imagen o texto OCR para analizar' },
  );

const aiResultSchema = z.object({
  type: z.enum(['expense', 'income']),
  amountCents: z.number().int().positive().max(99_999_999),
  description: z.string().max(120),
  categoryId: z.string().nullable(),
});

export type ScanReceiptResult = z.infer<typeof aiResultSchema>;

function fallbackCategoryId(
  type: 'expense' | 'income',
  categories: z.infer<typeof categoryInputSchema>[],
  preferredId: string | null,
): string | null {
  if (preferredId && categories.some((c) => c.id === preferredId && c.type === type)) {
    return preferredId;
  }
  const others = categories.find(
    (c) =>
      c.type === type &&
      (c.name.toLowerCase().includes('otros') || c.name.toLowerCase().includes('other')),
  );
  if (others) return others.id;
  return categories.find((c) => c.type === type)?.id ?? null;
}

function stripDataUrlPrefix(raw: string): { base64: string; mime?: string } {
  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (match) {
    return { mime: match[1], base64: match[2] };
  }
  return { base64: raw.replace(/\s/g, '') };
}

function buildCatalog(categories: z.infer<typeof categoryInputSchema>[]) {
  return categories
    .map((c) => `- id=${c.id} | type=${c.type} | name=${c.name}`)
    .join('\n');
}

function buildJsonRules(catalog: string) {
  return `Eres un asistente financiero para una app peruana (soles PEN).
Responde SOLO con un JSON válido (sin markdown) con esta forma exacta:
{"type":"expense"|"income","amountCents":number,"description":string,"categoryId":string|null}

Reglas:
- type: "expense" si es compra/pago/gasto; "income" si es depósito, salario, transferencia recibida, venta o ingreso.
- amountCents: monto total en centavos enteros (S/ 12.50 → 1250). Usa el total a pagar o el monto principal, no subtotales.
- description: frase corta en español (máx 120 chars), útil para el historial.
- categoryId: elige el id de la lista cuyo type coincida con type. Si ninguna encaja, usa null.
- Si es ambiguo, prioriza expense y el monto más grande razonable.

Categorías disponibles:
${catalog}`;
}

function parseAnalysis(
  content: string,
  categories: z.infer<typeof categoryInputSchema>[],
): ScanReceiptResult {
  const aiParsed = aiResultSchema.safeParse(extractJsonObject(content));
  if (!aiParsed.success) {
    const detail = aiParsed.error.issues[0]?.message;
    throw new ApiError(
      502,
      detail
        ? `No se pudo interpretar el análisis de la boleta: ${detail}`
        : 'No se pudo interpretar el análisis de la boleta',
    );
  }
  return {
    ...aiParsed.data,
    description: aiParsed.data.description.trim().slice(0, 120),
    categoryId: fallbackCategoryId(
      aiParsed.data.type,
      categories,
      aiParsed.data.categoryId,
    ),
  };
}

export const POST = handle(async (request) => {
  await requireUser(request);

  const raw = await readBody<unknown>(request);
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos';
    throw new ApiError(400, msg);
  }

  const { categories, ocrText } = parsed.data;
  const catalog = buildCatalog(categories);
  const rules = buildJsonRules(catalog);

  const imageRaw = parsed.data.imageBase64?.trim() ?? '';
  const ocrRaw = ocrText?.trim() ?? '';

  // Text-only path (OCR fallback from the client).
  if (ocrRaw && !imageRaw) {
    const textModel = process.env.FREELLM_TEXT_MODEL?.trim();
    const content = await freellmChatCompletion(
      [
        {
          role: 'user',
          content: `${rules}

Analiza este texto OCR de una boleta/captura y responde solo con el JSON indicado.

Texto OCR:
${ocrRaw.slice(0, 10_000)}`,
        },
      ],
      {
        // Omit model when unset/"auto" so FreeLLM auto-routes (no catalog id "auto").
        ...(textModel && textModel !== 'auto' ? { model: textModel } : {}),
        temperature: 0.1,
      },
    );
    return json({ analysis: parseAnalysis(content, categories), mode: 'ocr' });
  }

  const stripped = stripDataUrlPrefix(imageRaw);
  const imageBase64 = stripped.base64;
  const claimedMime = normalizeMime(stripped.mime ?? parsed.data.mimeType ?? 'image/jpeg');
  const detectedMime = detectMimeFromBase64(imageBase64);

  if (!detectedMime) {
    throw new ApiError(
      400,
      'La imagen no es un JPEG/PNG/WebP válido (magic bytes no reconocidos)',
    );
  }

  const mime = detectedMime;
  if (claimedMime !== detectedMime) {
    console.warn(
      `[scan-receipt] mime mismatch: claimed=${claimedMime} detected=${detectedMime}`,
    );
  }

  const approxBytes = Math.floor((imageBase64.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    throw new ApiError(400, 'La imagen supera el límite de 5 MB');
  }
  if (approxBytes < 100) {
    throw new ApiError(400, 'La imagen parece vacía o corrupta');
  }

  const textParts = [
    `${rules}

Analiza la imagen adjunta y responde solo con el JSON indicado.`,
  ];
  if (ocrText?.trim()) {
    textParts.push(`Texto OCR opcional (pista):\n${ocrText.trim().slice(0, 4000)}`);
  }

  const dataUrl = `data:${mime};base64,${imageBase64}`;
  const visionModel =
    process.env.FREELLM_VISION_MODEL?.trim() || 'gpt-4o';

  const content = await freellmChatCompletion(
    [
      {
        role: 'user',
        content: [
          { type: 'text', text: textParts.join('\n\n') },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    { model: visionModel },
  );

  return json({ analysis: parseAnalysis(content, categories), mode: 'vision' });
});
