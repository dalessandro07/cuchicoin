import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { categories } from "@/db/schema";
import { client, db } from "@/db/server";
import {
  ApiError,
  handle,
  json,
  readBody,
  requireHomeMember,
  requireUser,
} from "@/lib/api-guard";
import { getTransactionView } from "@/lib/finance-server";
import {
  type ChatMessage,
  extractJsonObject,
  freellmChatCompletion,
  freellmSpeech,
} from "@/lib/freellm";
import { generateId } from "@/lib/home-defaults";
import { publishHomeEvent } from "@/lib/realtime";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

const requestSchema = z.object({
  homeId: z.string().min(1),
  messages: z.array(messageSchema).min(1).max(24),
});

const aiResultSchema = z.object({
  reply: z.string().min(1).max(500),
  ready: z.boolean(),
  transaction: z
    .object({
      type: z.enum(["expense", "income"]),
      amountCents: z.number().int().positive().max(99_999_999),
      description: z.string().max(120),
      categoryId: z.string().min(1),
    })
    .nullable(),
});

type CategoryRow = {
  id: string;
  name: string;
  type: "expense" | "income";
};

function buildCatalog(cats: CategoryRow[]) {
  return cats
    .map((c) => `- id=${c.id} | type=${c.type} | name=${c.name}`)
    .join("\n");
}

function buildSystemPrompt(catalog: string) {
  return `Eres el asistente de voz/texto de KuchiCoin, una app peruana de finanzas del hogar (soles PEN).
Hablas en español peruano, breve y claro.

Tu trabajo es registrar un gasto o ingreso a partir del mensaje del usuario.
Si falta monto, tipo (gasto/ingreso) o no puedes elegir categoría, pregunta lo mínimo necesario (ready=false, transaction=null).
Cuando tengas todo, confirma en reply y marca ready=true con la transacción.

Responde SOLO con un JSON válido (sin markdown) con esta forma exacta:
{"reply":string,"ready":boolean,"transaction":{"type":"expense"|"income","amountCents":number,"description":string,"categoryId":string}|null}

Reglas:
- amountCents: monto en centavos enteros (S/ 12.50 → 1250). "25 soles" → 2500.
- description: frase corta útil para el historial (máx 120 chars).
- categoryId: DEBE ser un id de la lista cuyo type coincida con type.
- reply: mensaje al usuario (confirmación o pregunta). Sin mencionar JSON.
- Si ready=true, transaction no puede ser null.

Categorías disponibles:
${catalog}`;
}

function resolveCategory(
  cats: CategoryRow[],
  type: "expense" | "income",
  preferredId: string,
): string | null {
  if (cats.some((c) => c.id === preferredId && c.type === type)) {
    return preferredId;
  }
  const others = cats.find(
    (c) =>
      c.type === type &&
      (c.name.toLowerCase().includes("otros") ||
        c.name.toLowerCase().includes("other")),
  );
  if (others) return others.id;
  return cats.find((c) => c.type === type)?.id ?? null;
}

async function insertTransaction(opts: {
  homeId: string;
  membershipId: string;
  type: "expense" | "income";
  amountCents: number;
  categoryId: string;
  description: string;
}) {
  const id = generateId("txn");
  const now = Math.floor(Date.now() / 1000);

  await client.execute({
    sql: `INSERT INTO transactions
      (id, home_id, member_id, category_id, created_by, type, amount, description, date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      opts.homeId,
      opts.membershipId,
      opts.categoryId,
      opts.membershipId,
      opts.type,
      opts.amountCents,
      opts.description,
      now,
      now,
      now,
    ],
  });

  return getTransactionView(id);
}

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const raw = await readBody<unknown>(request);
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    throw new ApiError(400, msg);
  }

  const { homeId, messages } = parsed.data;
  const membership = await requireHomeMember(user.id, homeId);

  const homeCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
    })
    .from(categories)
    .where(eq(categories.homeId, homeId));

  if (homeCategories.length === 0) {
    throw new ApiError(400, "Este hogar aún no tiene categorías");
  }

  const catalog = buildCatalog(homeCategories);
  const textModel = process.env.FREELLM_TEXT_MODEL?.trim();

  const llmMessages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(catalog) },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const content = await freellmChatCompletion(llmMessages, {
    ...(textModel && textModel !== "auto" ? { model: textModel } : {}),
    temperature: 0.2,
  });

  const aiParsed = aiResultSchema.safeParse(extractJsonObject(content));
  if (!aiParsed.success) {
    throw new ApiError(
      502,
      "No se pudo interpretar la respuesta del asistente",
    );
  }

  let reply = aiParsed.data.reply.trim().slice(0, 500);
  let transactionView = null as Awaited<
    ReturnType<typeof getTransactionView>
  > | null;

  if (aiParsed.data.ready && aiParsed.data.transaction) {
    const tx = aiParsed.data.transaction;
    const categoryId = resolveCategory(homeCategories, tx.type, tx.categoryId);
    if (!categoryId) {
      throw new ApiError(
        502,
        "No hay una categoría válida para este movimiento",
      );
    }

    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.homeId, homeId)))
      .limit(1);
    if (!category || category.type !== tx.type) {
      throw new ApiError(502, "La categoría elegida no es válida");
    }

    transactionView = await insertTransaction({
      homeId,
      membershipId: membership.id,
      type: tx.type,
      amountCents: tx.amountCents,
      categoryId,
      description: tx.description.trim().slice(0, 120),
    });

    if (transactionView) {
      await publishHomeEvent(homeId, {
        type: "transaction.created",
        actorUserId: user.id,
        entityId: transactionView.id,
      });
    }
  } else if (aiParsed.data.ready && !aiParsed.data.transaction) {
    reply =
      reply ||
      "Necesito un poco más de detalle (monto, si es gasto o ingreso, y de qué se trata).";
  }

  let audioBase64: string | undefined;
  let audioMime: string | undefined;
  if (transactionView) {
    const speech = await freellmSpeech(reply);
    if (speech) {
      audioBase64 = speech.base64;
      audioMime = speech.mime;
    }
  }

  return json({
    reply,
    transaction: transactionView,
    audioBase64: audioBase64 ?? null,
    audioMime: audioMime ?? null,
  });
});
