/**
 * Auth-specific constants for the Peruvian market.
 */

export const PERU_PHONE_PREFIX = '+51';
export const PERU_PHONE_REGEX = /^9\d{8}$/;

export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
} as const;

export const PASSWORD_HINT =
  'Mínimo 8 caracteres, una mayúscula y un número';
