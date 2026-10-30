/**
 * Dates for receipts are always shown in Lagos time (WAT, UTC+1, no daylight
 * saving), whatever time zone the server or the browser happens to be in.
 */

export const RECEIPT_TIMEZONE = "Africa/Lagos";
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export function formatReceiptDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: RECEIPT_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatReceiptShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: RECEIPT_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatReceiptTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: RECEIPT_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/\s?([ap]m)$/i, (_m, mer: string) => ` ${mer.toUpperCase()}`);
}

export function formatReceiptDateTime(iso: string): string {
  return `${formatReceiptDate(iso)}, ${formatReceiptTime(iso)}`;
}

/** The calendar year in Lagos (used for numbering: STN-2026-0001). */
export function lagosYear(date: Date = new Date()): number {
  return new Date(date.getTime() + LAGOS_OFFSET_MS).getUTCFullYear();
}

/** ISO instant of midnight (Lagos) at the start of the day containing `date`. */
export function lagosDayStartISO(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() + LAGOS_OFFSET_MS);
  const startShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  return new Date(startShifted - LAGOS_OFFSET_MS).toISOString();
}

/** ISO instant of midnight (Lagos) on the 1st of the month containing `date`. */
export function lagosMonthStartISO(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() + LAGOS_OFFSET_MS);
  const startShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    1,
  );
  return new Date(startShifted - LAGOS_OFFSET_MS).toISOString();
}
