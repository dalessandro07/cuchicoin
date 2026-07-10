/**
 * Money helpers. Amounts are stored and passed around as integer cents (S/).
 */

export function formatSoles(cents: number, options?: { withSymbol?: boolean }): string {
  const withSymbol = options?.withSymbol ?? true;
  const abs = Math.abs(Math.round(cents)) / 100;
  const [intPart, decPart] = abs.toFixed(2).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = cents < 0 ? '-' : '';
  const body = `${sign}${grouped}.${decPart}`;
  return withSymbol ? `S/ ${body}` : body;
}

export function formatSignedSoles(cents: number, type: 'expense' | 'income'): string {
  const prefix = type === 'income' ? '+ ' : '- ';
  return `${prefix}${formatSoles(Math.abs(cents))}`;
}

/**
 * Parses user input like "25.50", "1,234.50" or "25,50" into integer cents.
 * Returns null when the input has no usable number.
 */
export function parseSolesToCents(text: string): number | null {
  if (!text) return null;
  let cleaned = text.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalSep = lastComma > lastDot ? ',' : lastDot > -1 ? '.' : '';

  if (decimalSep) {
    const thousandSep = decimalSep === ',' ? '.' : ',';
    cleaned = cleaned.split(thousandSep).join('');
    cleaned = cleaned.replace(decimalSep, '.');
  } else {
    cleaned = cleaned.replace(/[.,]/g, '');
  }

  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Formats "YYYY-MM" into "Enero 2026". */
export function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  const idx = Number(m) - 1;
  const name = MONTH_NAMES[idx] ?? month;
  return `${name} ${year}`;
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
