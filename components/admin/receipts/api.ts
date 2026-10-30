"use client";

/**
 * Browser-side helpers for receipt_issuance. Every call goes to /api/admin/*,
 * which needs the signed admin cookie. If the cookie has expired the server
 * answers 401; we then tell the admin layout (it shows the PIN screen again).
 */

import type {
  ItemCondition,
  PaymentMethod,
  ReceiptListRow,
  ReceiptSummary,
  StoredReceipt,
} from "@/lib/receipts/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("No connection. Check your internet and try again.", 0);
  }

  if (res.status === 401) {
    window.dispatchEvent(new Event("admin:unauthorized"));
    throw new ApiError("Your session has expired. Enter your PIN again.", 401);
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === "string"
        ? data.error
        : "Something went wrong. Please try again.",
      res.status,
      data,
    );
  }
  return data as T;
}

export interface IssuePayload {
  clientRequestId: string;
  customer: { name: string; phone?: string; email?: string; address?: string };
  items: {
    description: string;
    serial?: string;
    condition?: ItemCondition;
    warranty?: string;
    quantity: number;
    unitPrice: number;
  }[];
  discount: number;
  amountPaid?: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  servedBy?: string;
  notes?: string;
  sendEmail?: boolean;
}

export interface IssueResult {
  receipt: StoredReceipt;
  duplicate: boolean;
  email: { ok: boolean; to: string; error?: string } | null;
}

export const issueReceipt = (payload: IssuePayload) =>
  request<IssueResult>("/api/admin/receipts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export interface ListParams {
  q?: string;
  filter?: string;
  cursor?: string | null;
}

export interface ListResult {
  rows: ReceiptListRow[];
  nextCursor: string | null;
  summary: ReceiptSummary | null;
}

export function listReceipts({ q, filter, cursor }: ListParams) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (filter && filter !== "all") params.set("filter", filter);
  if (cursor) params.set("cursor", cursor);
  return request<ListResult>(`/api/admin/receipts?${params.toString()}`);
}

export const fetchSummary = () =>
  request<{ summary: ReceiptSummary }>("/api/admin/receipts?summary=1").then(
    (r) => r.summary,
  );

export const fetchReceipt = (receiptNumber: string) =>
  request<{ receipt: StoredReceipt }>(
    `/api/admin/receipts/${encodeURIComponent(receiptNumber)}`,
  ).then((r) => r.receipt);

export const emailReceipt = (receiptNumber: string, to?: string) =>
  request<{ ok: true; to: string; receipt: StoredReceipt }>(
    `/api/admin/receipts/${encodeURIComponent(receiptNumber)}/email`,
    { method: "POST", body: JSON.stringify(to ? { to } : {}) },
  );

export const voidReceipt = (receiptNumber: string, reason: string) =>
  request<{ receipt: StoredReceipt }>(
    `/api/admin/receipts/${encodeURIComponent(receiptNumber)}/void`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  ).then((r) => r.receipt);

export interface ProductHit {
  id: string;
  name: string;
  price: number | null;
  condition: string | null;
  stock: number | null;
}

export const searchProducts = (q: string) =>
  request<{ products: ProductHit[] }>(
    `/api/admin/receipts/products?q=${encodeURIComponent(q)}`,
  ).then((r) => r.products);

/** Fetches the PDF as a Blob. Done with fetch (not a link) so the session cookie rides along and nothing gets cached by the service worker. */
export async function fetchPdfBlob(receiptNumber: string): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(
      `/api/admin/receipts/${encodeURIComponent(receiptNumber)}/pdf`,
      { cache: "no-store" },
    );
  } catch {
    throw new ApiError("No connection. Check your internet and try again.", 0);
  }
  if (res.status === 401) {
    window.dispatchEvent(new Event("admin:unauthorized"));
    throw new ApiError("Your session has expired. Enter your PIN again.", 401);
  }
  if (!res.ok)
    throw new ApiError("Could not load the PDF. Please try again.", res.status);
  return res.blob();
}

export const pdfFileName = (receiptNumber: string) =>
  `Receipt-${receiptNumber}.pdf`;

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Opens the PDF in a new tab. The tab is opened straight away (inside the tap) so phone browsers don't block it. */
export async function openPdfInNewTab(
  receiptNumber: string,
  existing?: Blob | null,
) {
  const tab = window.open("", "_blank");
  try {
    const blob = existing ?? (await fetchPdfBlob(receiptNumber));
    const url = URL.createObjectURL(blob);
    if (tab) {
      tab.location.href = url;
    } else {
      saveBlob(blob, pdfFileName(receiptNumber));
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    tab?.close();
    throw err;
  }
}

export const canShareFiles = () => {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function")
    return false;
  if (typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({
      files: [new File([""], "x.pdf", { type: "application/pdf" })],
    });
  } catch {
    return false;
  }
};

/** Shares the PDF through the phone's share sheet (WhatsApp, Telegram, Gmail…). Needs the blob ready so it runs inside the tap. */
export async function shareBlob(
  blob: Blob,
  receiptNumber: string,
  text: string,
) {
  const file = new File([blob], pdfFileName(receiptNumber), {
    type: "application/pdf",
  });
  await navigator.share({
    files: [file],
    title: `Receipt ${receiptNumber}`,
    text,
  });
}
