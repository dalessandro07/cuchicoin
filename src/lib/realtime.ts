/**
 * Redis Streams helpers for family-home realtime events.
 * Server-only — used from Expo API routes. Publish is best-effort:
 * Redis failures must never fail the HTTP mutation.
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

let redis: Redis | null = null;
let redisDisabled = false;

function streamKey(homeId: string): string {
  return `${STREAM_PREFIX}${homeId}`;
}

function getRedis(): Redis | null {
  if (redisDisabled) return null;
  if (redis) return redis;

  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    redisDisabled = true;
    console.warn("[realtime] REDIS_URL missing; realtime disabled");
    return null;
  }

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 5_000,
    });
    redis.on("error", (err) => {
      console.warn("[realtime] Redis error:", err.message);
    });
    return redis;
  } catch (err) {
    redisDisabled = true;
    console.warn("[realtime] Failed to create Redis client:", err);
    return null;
  }
}

async function ensureRedis(): Promise<Redis | null> {
  const client = getRedis();
  if (!client) return null;
  if (client.status === "ready") return client;
  if (client.status === "connecting" || client.status === "connect") {
    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        client.off("error", onError);
        resolve();
      };
      const onError = (err: Error) => {
        client.off("ready", onReady);
        reject(err);
      };
      client.once("ready", onReady);
      client.once("error", onError);
    });
    return client;
  }
  await client.connect();
  return client;
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
    const client = await ensureRedis();
    if (!client) return;
    const key = streamKey(homeId);
    await client.xadd(
      key,
      "MAXLEN",
      "~",
      String(MAX_LEN),
      "*",
      "data",
      JSON.stringify(payload),
    );
  } catch (err) {
    console.warn("[realtime] publishHomeEvent failed:", err);
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

/**
 * Read events after `afterId`. If `afterId` is empty, return no events and the
 * current tip id (so clients start live without replaying history).
 */
export async function readHomeEvents(
  homeId: string,
  afterId: string,
): Promise<{ events: HomeRealtimeEvent[]; lastId: string }> {
  try {
    const client = await ensureRedis();
    if (!client) {
      return { events: [], lastId: afterId || "0-0" };
    }

    const key = streamKey(homeId);

    if (!afterId) {
      const latest = await client.xrevrange(key, "+", "-", "COUNT", 1);
      const tip = latest[0]?.[0] ?? "0-0";
      return { events: [], lastId: tip };
    }

    const rows = await client.xrange(key, `(${afterId}`, "+");
    const events: HomeRealtimeEvent[] = [];
    let lastId = afterId;

    for (const [id, fields] of rows) {
      lastId = id;
      const parsed = parseEvent(id, fields);
      if (parsed) events.push(parsed.event);
    }

    return { events, lastId };
  } catch (err) {
    console.warn("[realtime] readHomeEvents failed:", err);
    return { events: [], lastId: afterId || "0-0" };
  }
}
