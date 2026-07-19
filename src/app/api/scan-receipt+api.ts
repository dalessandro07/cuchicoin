import { z } from 'zod';

import {
  ApiError,
  handle,
  json,
  readBody,
  requireUser,
} from '@/lib/api-guard';
import { extractJsonObject, freellmChatCompletion } from '@/lib/freellm';
import { limaNowStrings, resolveOccurredAt } from '@/lib/peru-datetime';

const categoryInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['expense', 'income']),
});

const requestSchema = z.object({
  categories: z.array(categoryInputSchema).min(1).max(80),
  ocrText: z.string().trim().min(1).max(12_000),
});

const datePartSchema = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
);
const timePartSchema = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
);

const aiResultSchema = z.object({
  type: z.enum(['expense', 'income']),
  amountCents: z.number().int().positive().max(99_999_999),
  description: z.string().max(120),
  categoryId: z.string().nullable(),
  date: datePartSchema,
  time: timePartSchema,
});

export type ScanReceiptResult = {
  type: 'expense' | 'income';
  amountCents: number;
  description: string;
  categoryId: string | null;
  /** Unix seconds resolved in America/Lima. */
  date: number;
};

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

function buildCatalog(categories: z.infer<typeof categoryInputSchema>[]) {
  return categories
    .map((c) => `- id=${c.id} | type=${c.type} | name=${c.name}`)
    .join('\n');
}

function buildJsonRules(catalog: string, today: string) {
  return `Eres un asistente financiero para una app peruana (soles PEN).
Responde SOLO con un JSON válido (sin markdown) con esta forma exacta:
{"type":"expense"|"income","amountCents":number,"description":string,"categoryId":string|null,"date":string|null,"time":string|null}

Reglas:
- type: "expense" si es compra/pago/gasto; "income" si es depósito, salario, transferencia recibida, venta o ingreso.
- amountCents: monto total en centavos enteros (S/ 12.50 → 1250). Usa el total a pagar o el monto principal, no subtotales.
- description: frase corta en español (máx 120 chars), útil para el historial.
- categoryId: elige el id de la lista cuyo type coincida con type. Si ninguna encaja, usa null.
- date: fecha de la boleta en YYYY-MM-DD (zona Perú). Formatos comunes: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD. Si no aparece ninguna fecha clara, usa null. Hoy es ${today}.
- time: hora de la boleta en HH:mm (24h) solo si aparece clara. Si no hay hora, usa null.
- Si es ambiguo, prioriza expense y el monto más grande razonable.

Categorías disponibles:
${catalog}`;
}

function parseAnalysis(
  content: string,
  categories: z.infer<typeof categoryInputSchema>[],
): ScanReceiptResult {
  const extracted = extractJsonObject(content) as Record<string, unknown>;
  // Tolerate models that omit date/time.
  if (extracted && typeof extracted === 'object') {
    if (!('date' in extracted)) extracted.date = null;
    if (!('time' in extracted)) extracted.time = null;
  }
  const aiParsed = aiResultSchema.safeParse(extracted);
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
    type: aiParsed.data.type,
    amountCents: aiParsed.data.amountCents,
    description: aiParsed.data.description.trim().slice(0, 120),
    categoryId: fallbackCategoryId(
      aiParsed.data.type,
      categories,
      aiParsed.data.categoryId,
    ),
    date: resolveOccurredAt({
      date: aiParsed.data.date,
      time: aiParsed.data.time,
    }),
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
  const { date: today } = limaNowStrings();
  const rules = buildJsonRules(catalog, today);
  const ocrRaw = ocrText.trim();
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
});
