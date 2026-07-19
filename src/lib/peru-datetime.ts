/**
 * Date/time helpers for America/Lima (Peru, UTC-5, no DST).
 */

export const PERU_TZ = "America/Lima";
/** Lima is fixed UTC-5 year-round. */
const LIMA_OFFSET_MS = -5 * 60 * 60 * 1000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export type OccurredAtParts = {
	/** Calendar date YYYY-MM-DD, or null/undefined if not provided. */
	date?: string | null;
	/** Local time HH:mm, or null/undefined if not provided. */
	time?: string | null;
};

function limaParts(now = new Date()) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: PERU_TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(now);

	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((p) => p.type === type)?.value ?? "";

	return {
		year: get("year"),
		month: get("month"),
		day: get("day"),
		hour: get("hour") === "24" ? "00" : get("hour"),
		minute: get("minute"),
	};
}

/** Current wall-clock in Lima as YYYY-MM-DD and HH:mm. */
export function limaNowStrings(now = new Date()): {
	date: string;
	time: string;
} {
	const p = limaParts(now);
	return {
		date: `${p.year}-${p.month}-${p.day}`,
		time: `${p.hour}:${p.minute}`,
	};
}

/**
 * Builds a Date for a Lima local YYYY-MM-DD + HH:mm.
 * Invalid inputs return null.
 */
export function limaLocalToDate(
	dateStr: string,
	timeStr: string,
): Date | null {
	if (!DATE_RE.test(dateStr) || !TIME_RE.test(timeStr)) return null;
	const [y, m, d] = dateStr.split("-").map(Number);
	const [hh, mm] = timeStr.split(":").map(Number);
	if (
		!Number.isFinite(y) ||
		!Number.isFinite(m) ||
		!Number.isFinite(d) ||
		!Number.isFinite(hh) ||
		!Number.isFinite(mm) ||
		m < 1 ||
		m > 12 ||
		d < 1 ||
		d > 31 ||
		hh < 0 ||
		hh > 23 ||
		mm < 0 ||
		mm > 59
	) {
		return null;
	}
	// Interpret as Lima local: UTC = local - offset → local + 5h as UTC ms
	const utcMs = Date.UTC(y, m - 1, d, hh, mm, 0) - LIMA_OFFSET_MS;
	const date = new Date(utcMs);
	return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Resolves optional date/time parts to unix seconds using Lima rules:
 * - neither → now
 * - only time → today (Lima) + time
 * - only date → that date at 12:00 Lima
 * - both → exact combination
 */
export function resolveOccurredAt(
	parts: OccurredAtParts,
	now = new Date(),
): number {
	const rawDate = parts.date?.trim() || null;
	const rawTime = parts.time?.trim() || null;
	const dateStr = rawDate && DATE_RE.test(rawDate) ? rawDate : null;
	const timeStr = rawTime && TIME_RE.test(rawTime) ? rawTime : null;

	if (!dateStr && !timeStr) {
		return Math.floor(now.getTime() / 1000);
	}

	const today = limaNowStrings(now);
	const resolvedDate = dateStr ?? today.date;
	const resolvedTime = timeStr ?? (dateStr ? "12:00" : today.time);

	const date = limaLocalToDate(resolvedDate, resolvedTime);
	if (!date) return Math.floor(now.getTime() / 1000);
	return Math.floor(date.getTime() / 1000);
}

/** Formats unix seconds for display (es-PE, America/Lima). */
export function formatLimaDateTime(seconds: number): string {
	const date = new Date(seconds * 1000);
	const day = date.toLocaleDateString("es-PE", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		timeZone: PERU_TZ,
	});
	const time = date.toLocaleTimeString("es-PE", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: PERU_TZ,
	});
	return `${day} · ${time}`;
}
