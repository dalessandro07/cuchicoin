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
	/** Local time HH:mm (24h), or null/undefined if not provided. */
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
 * Converts a time string to HH:mm (24h).
 * Accepts "15:30", "3:30 PM", "03:30 p.m.", "12:00 AM", etc.
 */
export function normalizeTimeTo24h(
	raw: string | null | undefined,
): string | null {
	if (raw == null) return null;
	const s = raw.trim();
	if (!s) return null;

	const m = s.match(
		/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?$/i,
	);
	if (!m) return null;

	let hour = Number(m[1]);
	const minute = Number(m[2]);
	const merRaw = m[3]?.toLowerCase().replace(/[\s.]/g, "") ?? "";
	const isAm = merRaw === "am";
	const isPm = merRaw === "pm";

	if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
	if (minute < 0 || minute > 59) return null;

	if (isAm || isPm) {
		if (hour < 1 || hour > 12) return null;
		if (isAm) {
			if (hour === 12) hour = 0;
		} else if (hour !== 12) {
			hour += 12;
		}
	} else if (hour < 0 || hour > 23) {
		return null;
	}

	return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Finds a clock time in OCR text. Prefers matches that include AM/PM
 * (common on Peruvian receipts / Yape / POS tickets).
 */
export function extractTimeFromOcrText(text: string): string | null {
	if (!text) return null;

	const withMeridian = [
		...text.matchAll(
			/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)\b/gi,
		),
	];
	for (const match of withMeridian) {
		const normalized = normalizeTimeTo24h(match[0]);
		if (normalized) return normalized;
	}

	return null;
}

/**
 * Builds a Date for a Lima local YYYY-MM-DD + HH:mm.
 * Invalid inputs return null.
 */
export function limaLocalToDate(
	dateStr: string,
	timeStr: string,
): Date | null {
	const normalized = normalizeTimeTo24h(timeStr) ?? timeStr;
	if (!DATE_RE.test(dateStr) || !TIME_RE.test(normalized)) return null;
	const [y, m, d] = dateStr.split("-").map(Number);
	const [hh, mm] = normalized.split(":").map(Number);
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
	const timeStr = rawTime ? normalizeTimeTo24h(rawTime) : null;

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
