/**
 * Server-only FreeLLM client (OpenAI-compatible chat completions).
 * Supports multimodal content (text + image_url) for vision models.
 */

import { ApiError } from '@/lib/api-guard';

const DEFAULT_BASE = 'https://freellmapi.alessandrorios.com/v1';

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatContentPart[];
};

type ChatCompletionResponse = {
  choices?: { message?: { content?: string | null } }[];
  error?: unknown;
  message?: unknown;
  code?: unknown;
};

function messageHasImage(messages: ChatMessage[]): boolean {
  for (const msg of messages) {
    if (!Array.isArray(msg.content)) continue;
    if (msg.content.some((part) => part.type === 'image_url')) return true;
  }
  return false;
}

function freellmErrorMessage(data: unknown, status: number): string {
  if (!data || typeof data !== 'object') {
    return `El servicio de IA respondió con error (${status})`;
  }
  const obj = data as Record<string, unknown>;
  const err = obj.error;

  if (typeof err === 'string' && err.trim()) return err.trim();
  if (err && typeof err === 'object') {
    const nested = err as Record<string, unknown>;
    const msg = nested.message;
    const code = nested.code ?? obj.code;
    if (typeof msg === 'string' && msg.trim()) {
      return typeof code === 'string' && code.trim()
        ? `${msg.trim()} (${code.trim()})`
        : msg.trim();
    }
    if (typeof code === 'string' && code.trim()) {
      if (code === 'no_vision_model') {
        return 'No hay un modelo de visión disponible en FreeLLM (no_vision_model).';
      }
      return `Error de IA: ${code.trim()}`;
    }
  }
  if (typeof obj.message === 'string' && obj.message.trim()) {
    return obj.message.trim();
  }
  if (typeof obj.code === 'string' && obj.code.trim()) {
    if (obj.code === 'no_vision_model') {
      return 'No hay un modelo de visión disponible en FreeLLM (no_vision_model).';
    }
    return `Error de IA: ${obj.code.trim()}`;
  }
  return `El servicio de IA respondió con error (${status})`;
}

export async function freellmChatCompletion(
  messages: ChatMessage[],
  opts?: { temperature?: number; model?: string },
): Promise<string> {
  const apiKey = process.env.FREELLM_API_KEY?.trim();
  if (!apiKey) {
    throw new ApiError(500, 'FREELLM_API_KEY no está configurada en el servidor');
  }

  const base = (process.env.FREELLM_BASE_URL?.trim() || DEFAULT_BASE).replace(/\/$/, '');
  const url = `${base}/chat/completions`;
  const hasImage = messageHasImage(messages);

  // This FreeLLM host has no "auto" id — omit `model` to auto-route.
  const requested = opts?.model?.trim();
  const resolved =
    requested && requested !== 'auto'
      ? requested
      : hasImage
        ? process.env.FREELLM_VISION_MODEL?.trim() || 'gpt-4o'
        : undefined;

  const body: Record<string, unknown> = { messages };
  if (resolved) body.model = resolved;

  // Some vision providers reject temperature alongside image inputs.
  if (!hasImage && opts?.temperature !== undefined) {
    body.temperature = opts.temperature;
  } else if (!hasImage) {
    body.temperature = 0.1;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(502, 'No se pudo conectar con el servicio de IA');
  }

  const data = (await response.json().catch(() => null)) as ChatCompletionResponse | null;
  if (!response.ok) {
    const status =
      response.status === 422
        ? 422
        : response.status >= 400 && response.status < 500
          ? response.status
          : 502;
    throw new ApiError(status, freellmErrorMessage(data, response.status));
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new ApiError(502, 'El servicio de IA no devolvió contenido');
  }
  return content;
}

/** Extract the first JSON object from a model reply (handles markdown fences). */
export function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new ApiError(502, 'La IA no devolvió un JSON válido');
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new ApiError(502, 'La IA no devolvió un JSON válido');
  }
}

export type FreellmSpeechResult = {
  base64: string;
  mime: string;
};

/**
 * OpenAI-compatible TTS via FreeLLM (`POST /audio/speech`).
 * Returns null when the gateway has no audio model / request fails —
 * callers should fall back to on-device speech.
 */
export async function freellmSpeech(
  text: string,
  opts?: { model?: string; voice?: string },
): Promise<FreellmSpeechResult | null> {
  const apiKey = process.env.FREELLM_API_KEY?.trim();
  if (!apiKey) return null;

  const trimmed = text.trim().slice(0, 4096);
  if (!trimmed) return null;

  const base = (process.env.FREELLM_BASE_URL?.trim() || DEFAULT_BASE).replace(/\/$/, '');
  const url = `${base}/audio/speech`;
  const model =
    opts?.model?.trim() ||
    process.env.FREELLM_SPEECH_MODEL?.trim() ||
    undefined;

  const body: Record<string, unknown> = {
    input: trimmed,
    voice: opts?.voice?.trim() || 'alloy',
  };
  if (model) body.model = model;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return null;
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) return null;

  const mimePart = contentType.split(';')[0]?.trim();
  const mime =
    mimePart && mimePart.includes('audio/') ? mimePart : 'audio/mpeg';

  const base64 = Buffer.from(buffer).toString('base64');
  return { base64, mime };
}
