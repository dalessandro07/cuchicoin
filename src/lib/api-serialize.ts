/**
 * Serializers that turn Drizzle rows (with `Date` fields) into the JSON shape
 * the client expects: timestamps as unix seconds, booleans as booleans.
 */

import type { InferSelectModel } from 'drizzle-orm';
import type { categories, homes, members } from '@/db/schema';

function toSeconds(date: Date | number | null | undefined): number {
  if (date == null) return 0;
  if (typeof date === 'number') return date;
  return Math.floor(date.getTime() / 1000);
}

export function serializeHome(home: InferSelectModel<typeof homes>) {
  return {
    id: home.id,
    name: home.name,
    currency: home.currency,
    inviteCode: home.inviteCode,
    createdAt: toSeconds(home.createdAt),
  };
}

export function serializeMember(member: InferSelectModel<typeof members>) {
  return {
    id: member.id,
    homeId: member.homeId,
    userId: member.userId,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    role: member.role,
    joinedAt: toSeconds(member.joinedAt),
  };
}

export function serializeCategory(category: InferSelectModel<typeof categories>) {
  return {
    id: category.id,
    homeId: category.homeId,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    isDefault: category.isDefault,
    createdBy: category.createdBy,
    createdAt: toSeconds(category.createdAt),
  };
}
