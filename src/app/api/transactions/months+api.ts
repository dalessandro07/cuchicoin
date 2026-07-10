import { handle, json, requireHomeMember, requireUser, ApiError } from '@/lib/api-guard';
import { listMonths } from '@/lib/finance-server';

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const homeId = url.searchParams.get('homeId');
  if (!homeId) throw new ApiError(400, 'Falta el parámetro homeId');
  await requireHomeMember(user.id, homeId);

  const months = await listMonths(homeId);
  return json({ months });
});
