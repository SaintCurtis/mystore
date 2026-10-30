import { NextResponse } from "next/server";
import { isValidReceiptNumber, ReceiptError } from "./store";

export const NO_STORE = { "Cache-Control": "no-store" } as const;

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function failure(err: unknown, context: string) {
  if (err instanceof ReceiptError)
    return json({ error: err.message }, err.status);
  console.error(`[receipts] ${context}:`, err);
  return json({ error: "Something went wrong. Please try again." }, 500);
}

/** Normalises the [id] route segment and rejects anything that isn't a receipt number. */
export function parseReceiptNumber(raw: string): string | null {
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return null;
  }
  value = value.trim().toUpperCase();
  return isValidReceiptNumber(value) ? value : null;
}
