/**
 * Server-side helpers for finance API routes: session auth, home-membership
 * guards, JSON responses and body parsing. Runs only inside `+api.ts` routes.
 */

import { and, eq } from 'drizzle-orm';

import { auth } from '@/lib/auth-server';
import { db } from '@/db/server';
import { members } from '@/db/schema';

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function readBody<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, 'Cuerpo de la solicitud inválido');
  }
}

export async function requireUser(request: Request): Promise<SessionUser> {
  const result = await auth.api.getSession({ headers: request.headers });
  if (!result?.user) {
    throw new ApiError(401, 'Sesión no válida o expirada');
  }
  const u = result.user as Record<string, unknown>;
  return {
    id: result.user.id,
    firstName: (u.firstName as string) ?? result.user.name?.split(' ')[0] ?? '',
    lastName: (u.lastName as string) ?? result.user.name?.split(' ').slice(1).join(' ') ?? '',
    email: result.user.email,
    phone: (u.phone as string) ?? undefined,
  };
}

export async function requireHomeMember(userId: string, homeId: string) {
  const rows = await db
    .select()
    .from(members)
    .where(and(eq(members.userId, userId), eq(members.homeId, homeId)))
    .limit(1);
  const member = rows[0];
  if (!member) {
    throw new ApiError(403, 'No perteneces a este hogar');
  }
  return member;
}

/**
 * Wraps a route handler so thrown `ApiError`s become JSON responses and any
 * other error becomes a 500 without leaking internals to the client.
 */
export function handle(
  fn: (request: Request, params: Record<string, string>) => Promise<Response>,
) {
  return async (request: Request, params: Record<string, string> = {}): Promise<Response> => {
    try {
      return await fn(request, params);
    } catch (err) {
      if (err instanceof ApiError) {
        return json({ error: err.message, code: err.status }, err.status);
      }
      console.error('[API] Error no controlado:', err);
      return json({ error: 'Error interno del servidor', code: 500 }, 500);
    }
  };
}
