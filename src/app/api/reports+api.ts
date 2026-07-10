import { ApiError, handle, json, requireHomeMember, requireUser } from '@/lib/api-guard';
import { getMonthlySummary } from '@/lib/finance-server';

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const homeId = url.searchParams.get('homeId');
  if (!homeId) throw new ApiError(400, 'Falta el parámetro homeId');
  await requireHomeMember(user.id, homeId);

  const month = url.searchParams.get('month') ?? currentMonth();
  if (!/^\d{4}-\d{2}$/.test(month)) throw new ApiError(400, 'Mes inválido (usa YYYY-MM)');

  const summary = await getMonthlySummary(homeId, month);
  return json({ summary });
});
