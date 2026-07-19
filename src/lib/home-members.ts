import { and, asc, eq, isNull, ne } from "drizzle-orm";

import { members } from "@/db/schema";
import { db } from "@/db/server";

/**
 * Promotes the earliest-joined active member (excluding `excludeMemberId`) to admin.
 * Returns the promoted member id, or null if nobody remains.
 */
export async function promoteEarliestMember(
  homeId: string,
  excludeMemberId: string,
): Promise<string | null> {
  const [candidate] = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.homeId, homeId),
        isNull(members.leftAt),
        ne(members.id, excludeMemberId),
      ),
    )
    .orderBy(asc(members.joinedAt))
    .limit(1);

  if (!candidate) return null;

  if (candidate.role !== "admin") {
    await db
      .update(members)
      .set({ role: "admin" })
      .where(eq(members.id, candidate.id));
  }

  return candidate.id;
}
