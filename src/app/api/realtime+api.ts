import { ApiError, handle, json, requireHomeMember, requireUser } from "@/lib/api-guard";
import { readHomeEvents } from "@/lib/realtime";

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const homeId = url.searchParams.get("homeId")?.trim() ?? "";
  if (!homeId) throw new ApiError(400, "Falta el parámetro homeId");

  await requireHomeMember(user.id, homeId);

  const after = url.searchParams.get("after")?.trim() ?? "";
  const { events, lastId } = await readHomeEvents(homeId, after);

  return json({ events, lastId });
});
