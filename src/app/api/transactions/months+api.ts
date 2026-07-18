import {
  ApiError,
  handle,
  json,
  requireHomeMember,
  requireUser,
} from "@/lib/api-guard";
import { listMonths } from "@/lib/finance-server";

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const homeId = url.searchParams.get("homeId");
  if (!homeId) throw new ApiError(400, "Falta el parámetro homeId");
  await requireHomeMember(user.id, homeId);

  const memberId = url.searchParams.get("memberId") ?? undefined;
  const months = await listMonths(homeId, memberId);
  return json({ months });
});
