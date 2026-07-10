/**
 * Traduce los errores de Better Auth a mensajes de marca en español para
 * mostrarlos al usuario. Centraliza el mapeo para que signIn/signUp compartan
 * el mismo tono de KuchiCoin.
 */

type AuthError = {
  code?: string;
  message?: string;
  status?: number;
};

const GENERIC_MESSAGE =
  'Ups, algo salió mal en KuchiCoin. Inténtalo de nuevo en unos momentos.';

const MESSAGES_BY_CODE: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD:
    'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
  USER_NOT_FOUND:
    'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
  INVALID_PASSWORD:
    'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
  USER_ALREADY_EXISTS: 'Ya existe una cuenta con este correo. Inicia sesión.',
  EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con este correo. Inicia sesión.',
  EMAIL_NOT_VERIFIED:
    'Tu correo aún no está verificado. Revisa tu bandeja de entrada.',
  PASSWORD_TOO_SHORT: 'La contraseña es demasiado corta.',
  PASSWORD_TOO_LONG: 'La contraseña es demasiado larga.',
  FAILED_TO_CREATE_USER: 'No pudimos crear tu cuenta. Inténtalo de nuevo.',
  INVALID_EMAIL: 'El correo electrónico no es válido.',
};

export function resolveAuthError(error: AuthError | null | undefined): string {
  if (!error) return GENERIC_MESSAGE;

  if (error.code && MESSAGES_BY_CODE[error.code]) {
    return MESSAGES_BY_CODE[error.code];
  }

  if (error.status && error.status >= 500) {
    return GENERIC_MESSAGE;
  }

  return GENERIC_MESSAGE;
}
