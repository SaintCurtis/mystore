import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price amount in Nigerian Naira with thousand separators
 * @param amount - The price amount in Naira (can be null/undefined)
 * @param currency - Currency symbol (default: "₦")
 * @returns Formatted price string (e.g., "₦3,299,990")
 *
 * Note: Prices in Sanity should be stored as full Naira amounts (e.g., 3299990)
 * not in dollars/cents. Whole numbers are used since Naira kobo is rarely shown
 * in retail contexts.
 */
export function formatPrice(
  amount: number | null | undefined,
  currency = "₦"
): string {
  const value = amount ?? 0;

  // Use Intl.NumberFormat for proper locale-aware thousand separators
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));

  return `${currency}${formatted}`;
}

type DateFormatOption = "short" | "long" | "datetime";

const DATE_FORMAT_OPTIONS: Record<
  DateFormatOption,
  Intl.DateTimeFormatOptions
> = {
  short: { day: "numeric", month: "short" },
  long: { day: "numeric", month: "long", year: "numeric" },
  datetime: {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
};

/**
 * Format a date string with locale-specific formatting
 */
export function formatDate(
  date: string | null | undefined,
  format: DateFormatOption = "long",
  fallback = "Date unknown"
): string {
  if (!date) return fallback;
  return new Date(date).toLocaleDateString(
    "en-GB",
    DATE_FORMAT_OPTIONS[format]
  );
}

/**
 * Format an order number for display (shows only the last segment)
 */
export function formatOrderNumber(
  orderNumber: string | null | undefined
): string {
  if (!orderNumber) return "N/A";
  return orderNumber.split("-").pop() ?? orderNumber;
}