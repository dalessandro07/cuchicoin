/**
 * Redis Streams helpers for family-home realtime events.
 * Server-only — used from Expo API routes. Publish is best-effort:
 * Redis failures must never fail the HTTP mutation.
 *
 * Connections are per-request (no module singleton). EAS Hosting runs on
 * Cloudflare Workers, which must not share TCP sockets across requests.
 */

import Redis from "ioredis";

export type HomeRealtimeEventType =
  | "member.joined"
  | "member.left"
  | "transaction.created"
  | "transaction.updated"
  | "transaction.deleted"
  | "category.created"
  | "category.updated"
  | "category.deleted";

export type HomeRealtimeEvent = {
  type: HomeRealtimeEventType;
  actorUserId: string;
  entityId?: string;
  at: number;
};

const STREAM_PREFIX = "home:events:";
const MAX_LEN = 200;
const XREAD_COUNT = 100;

function streamKey(homeId: string): string {
  return `${STREAM_PREFIX}${homeId}`;
}

function redisUrl(): string | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    console.warn("[realtime] REDIS_URL missing; realtime disabled");
    return null;
  }
  return url;
}

/**
 * Open a fresh Redis connection, run `fn`, then always close.
 * Required on EAS Hosting (Workers) — never reuse sockets across requests.
 */
async function withRedis<T>(fn: (client: Redis) => Promise<T>): Promise<T | null> {
  const url = redisUrl();
  if (!url) return null;

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    lazyConnect: true,
    connectTimeout: 5_000,
  });
  client.on("error", (err) => {
    console.warn("[realtime] Redis error:", err.message);
  });

  try {
    await client.connect();
    return await fn(client);
  } finally {
    client.disconnect();
  }
}

function parseEvent(
  id: string,
  fields: string[],
): { id: string; event: HomeRealtimeEvent } | null {
  const dataIdx = fields.indexOf("data");
  const raw = dataIdx >= 0 ? fields[dataIdx + 1] : undefined;
  if (!raw) return null;
  try {
    const event = JSON.parse(raw) as HomeRealtimeEvent;
    if (!event?.type || !event?.actorUserId) return null;
    return { id, event };
  } catch {
    return null;
  }
}

export async function publishHomeEvent(
  homeId: string,
  event: Omit<HomeRealtimeEvent, "at"> & { at?: number },
): Promise<void> {
  const payload: HomeRealtimeEvent = {
    type: event.type,
    actorUserId: event.actorUserId,
    at: event.at ?? Math.floor(Date.now() / 1000),
    ...(event.entityId ? { entityId: event.entityId } : {}),
  };

  try {
    await withRedis(async (client) => {
      await client.xadd(
        streamKey(homeId),
        "MAXLEN",
        "~",
        String(MAX_LEN),
        "*",
        "data",
        JSON.stringify(payload),
      );
    });
  } catch (err) {
    console.warn("[realtime] publishHomeEvent failed:", err);
  }
}

/**
 * Read events after `afterId`. If `afterId` is empty, return no events and the
 * current tip id (so clients start live without replaying history).
 */
export async function readHomeEvents(
  homeId: string,
  afterId: string,
): Promise<{ events: HomeRealtimeEvent[]; lastId: string }> {
  try {
    const result = await withRedis(async (client) => {
      const key = streamKey(homeId);

      if (!afterId) {
        const latest = await client.xrevrange(key, "+", "-", "COUNT", 1);
        const tip = latest[0]?.[0] ?? "0-0";
        return { events: [] as HomeRealtimeEvent[], lastId: tip };
      }

      // XREAD returns entries with IDs strictly greater than afterId.
      const rows = await client.xread(
        "COUNT",
        String(XREAD_COUNT),
        "STREAMS",
        key,
        afterId,
      );

      const events: HomeRealtimeEvent[] = [];
      let lastId = afterId;

      if (rows) {
        for (const [, messages] of rows) {
          for (const [id, fields] of messages) {
            lastId = id;
            const parsed = parseEvent(id, fields);
            if (parsed) events.push(parsed.event);
          }
        }
      }

      return { events, lastId };
    });

    if (!result) {
      return { events: [], lastId: afterId || "0-0" };
    }
    return result;
  } catch (err) {
    console.warn("[realtime] readHomeEvents failed:", err);
    return { events: [], lastId: afterId || "0-0" };
  }
}
