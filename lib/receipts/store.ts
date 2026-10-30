/**
 * Storage for receipt_issuance (Sanity, server side only).
 *
 * Every receipt is one document with a dotted id, receipts.STN-2026-0001.
 * Sanity treats ids containing a dot as private, so receipts (which hold
 * customer names, phones and emails) are never readable without a token even
 * if your dataset is public. They are not part of the Studio schema; the
 * admin page is the only place they're created or read, which is how
 * pushSubscription documents are handled too.
 *
 * Numbering: one counter document per year (receipts.counter.2026). The
 * counter bump and the new receipt are written in a single transaction that
 * is pinned to the counter's revision, so two receipts issued at the same
 * moment can never share a number and a failed save can't burn one.
 */

import { createHash } from "node:crypto";
import { writeClient } from "@/sanity/lib/client";
import { RECEIPT_NUMBER_PREFIX } from "./config";
import { lagosDayStartISO, lagosMonthStartISO, lagosYear } from "./dates";
import { computeTotals } from "./money";
import type { CreateReceiptInput } from "./schema";
import {
  type EmailAttempt,
  RECEIPT_NUMBER_PATTERN,
  type ReceiptListRow,
  type ReceiptSummary,
  type StoredReceipt,
} from "./types";

export class ReceiptError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "ReceiptError";
  }
}

const docId = (receiptNumber: string) => `receipts.${receiptNumber}`;
const counterId = (year: number) => `receipts.counter.${year}`;
// One tiny marker document per request id. It is created in the same
// transaction as the receipt, so a retry (or a slow request that the browser
// gave up on and sent again) can never produce a second receipt.
const requestMarkerId = (clientRequestId: string) =>
  `receipts.req.${createHash("sha256").update(clientRequestId).digest("hex").slice(0, 32)}`;

export function formatReceiptNumber(year: number, sequence: number): string {
  return `${RECEIPT_NUMBER_PREFIX}-${year}-${String(sequence).padStart(4, "0")}`;
}

export function isValidReceiptNumber(value: string): boolean {
  return RECEIPT_NUMBER_PATTERN.test(value);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isConflict(err: unknown): boolean {
  const status = (err as { statusCode?: number })?.statusCode;
  return status === 409;
}

// Fields we store for our own bookkeeping and never send to the browser.
type StoredDoc = StoredReceipt & {
  _rev?: string;
  _type?: string;
  _createdAt?: string;
  _updatedAt?: string;
  clientRequestId?: string;
  phoneDigits?: string;
};

function toStoredReceipt(doc: StoredDoc): StoredReceipt {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    _rev,
    _type,
    _createdAt,
    _updatedAt,
    clientRequestId: _clientRequestId,
    phoneDigits: _phoneDigits,
    ...rest
  } = doc;
  return {
    ...rest,
    items: (rest.items ?? []).map((item) => {
      const { _key: _ignored, ...clean } = item as typeof item & {
        _key?: string;
      };
      return clean;
    }),
    emailAttempts: (rest.emailAttempts ?? []).map((a) => {
      const { _key: _ignored, ...clean } = a as typeof a & { _key?: string };
      return clean;
    }),
  };
}

export async function getReceipt(
  receiptNumber: string,
): Promise<StoredReceipt | null> {
  if (!isValidReceiptNumber(receiptNumber)) return null;
  const doc = await writeClient.fetch<StoredDoc | null>(`*[_id == $id][0]`, {
    id: docId(receiptNumber),
  });
  return doc ? toStoredReceipt(doc) : null;
}

export async function createReceipt(
  input: CreateReceiptInput,
  now: Date = new Date(),
): Promise<{ receipt: StoredReceipt; duplicate: boolean }> {
  const totals = computeTotals(input.items, input.discount, input.amountPaid);
  if (input.discount > totals.subtotal) {
    throw new ReceiptError("The discount is more than the subtotal.");
  }
  if (input.amountPaid != null && input.amountPaid > totals.total) {
    throw new ReceiptError("Amount paid is more than the total.");
  }

  const year = lagosYear(now);
  const counter = counterId(year);
  const MAX_ATTEMPTS = 6;

  const findExisting = () =>
    writeClient.fetch<StoredDoc | null>(
      `*[_type == "receipt" && clientRequestId == $id][0]`,
      {
        id: input.clientRequestId,
      },
    );

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // A retry or double-tap with the same request id returns the receipt we
    // already made instead of issuing a second one.
    const existing = await findExisting();
    if (existing)
      return { receipt: toStoredReceipt(existing), duplicate: true };

    const current = await writeClient.fetch<{
      _rev: string;
      value: number;
    } | null>(`*[_id == $id][0]{ _rev, value }`, { id: counter });
    const sequence = (current?.value ?? 0) + 1;
    const receiptNumber = formatReceiptNumber(year, sequence);

    const doc: StoredDoc & { _id: string; _type: "receipt" } = {
      _id: docId(receiptNumber),
      _type: "receipt",
      receiptNumber,
      status: "issued",
      issuedAt: now.toISOString(),
      servedBy: input.servedBy,
      customer: {
        name: input.customer.name,
        phone: input.customer.phone,
        email: input.customer.email,
        address: input.customer.address,
      },
      items: input.items.map((item, index) => ({
        _key: `item-${index + 1}`,
        description: item.description,
        serial: item.serial,
        condition: item.condition,
        warranty: item.warranty,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: totals.lineTotals[index],
      })) as StoredReceipt["items"],
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      amountPaid: totals.amountPaid,
      balance: totals.balance,
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference,
      notes: input.notes,
      emailAttempts: [],
      clientRequestId: input.clientRequestId,
      phoneDigits: input.customer.phone?.replace(/\D/g, "") || undefined,
    };

    try {
      const tx = writeClient.transaction();
      if (current) {
        tx.patch(counter, {
          ifRevisionID: current._rev,
          set: { value: sequence },
        });
      } else {
        tx.create({ _id: counter, _type: "receiptCounter", value: sequence });
      }
      tx.create(doc);
      tx.create({
        _id: requestMarkerId(input.clientRequestId),
        _type: "receiptRequest",
        receiptNumber,
      });
      await tx.commit();
      return { receipt: toStoredReceipt(doc), duplicate: false };
    } catch (err) {
      if (isConflict(err) && attempt < MAX_ATTEMPTS - 1) {
        // Someone else took this number a split second ago. Look again.
        await sleep(40 + Math.floor(Math.random() * 120));
        continue;
      }
      if (isConflict(err)) {
        throw new ReceiptError(
          "Receipt numbering is busy. Please try again.",
          503,
        );
      }
      throw err;
    }
  }

  throw new ReceiptError(
    "Could not allocate a receipt number. Please try again.",
    503,
  );
}

export async function appendEmailAttempt(
  receiptNumber: string,
  attempt: EmailAttempt,
): Promise<void> {
  await writeClient
    .patch(docId(receiptNumber))
    .setIfMissing({ emailAttempts: [] })
    .append("emailAttempts", [
      {
        _key: `email-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        ...attempt,
      },
    ])
    .commit();
}

export async function voidReceipt(
  receiptNumber: string,
  reason: string,
): Promise<StoredReceipt> {
  const receipt = await getReceipt(receiptNumber);
  if (!receipt) throw new ReceiptError("Receipt not found.", 404);
  if (receipt.status === "void")
    throw new ReceiptError("This receipt is already void.", 409);

  const updated = await writeClient
    .patch(docId(receiptNumber))
    .set({
      status: "void",
      voidedAt: new Date().toISOString(),
      voidReason: reason,
    })
    .commit<StoredDoc>();
  return toStoredReceipt(updated);
}

// ── History ────────────────────────────────────────────────────────────────

export type ReceiptFilter = "all" | "paid" | "part" | "void" | "not_emailed";

export interface ListParams {
  q?: string;
  filter?: ReceiptFilter;
  cursor?: string;
  limit?: number;
}

function encodeCursor(issuedAt: string, id: string): string {
  return Buffer.from(JSON.stringify([issuedAt, id])).toString("base64url");
}

function decodeCursor(cursor: string): [string, string] | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    );
    if (
      Array.isArray(parsed) &&
      typeof parsed[0] === "string" &&
      typeof parsed[1] === "string"
    ) {
      return [parsed[0], parsed[1]];
    }
  } catch {
    /* fall through */
  }
  return null;
}

export async function listReceipts(
  params: ListParams,
): Promise<{ rows: ReceiptListRow[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
  const groq: string[] = [`_type == "receipt"`];
  const query: Record<string, string | string[] | number> = { take: limit + 1 };

  switch (params.filter) {
    case "paid":
      groq.push(`status == "issued" && balance == 0`);
      break;
    case "part":
      groq.push(`status == "issued" && balance > 0`);
      break;
    case "void":
      groq.push(`status == "void"`);
      break;
    case "not_emailed":
      groq.push(
        `status == "issued" && count(emailAttempts[status == "sent"]) == 0`,
      );
      break;
    default:
      break;
  }

  const tokens = (params.q ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((token) => `${token}*`);
  const digits = (params.q ?? "").replace(/\D/g, "");

  if (tokens.length) {
    query.tokens = tokens;
    const fields = [
      `receiptNumber match $tokens`,
      `customer.name match $tokens`,
      `customer.email match $tokens`,
      `customer.phone match $tokens`,
    ];
    if (digits.length >= 4) {
      query.digits = `${digits}*`;
      fields.push(`phoneDigits match $digits`);
    }
    groq.push(`(${fields.join(" || ")})`);
  }

  if (params.cursor) {
    const decoded = decodeCursor(params.cursor);
    if (decoded) {
      query.cursorAt = decoded[0];
      query.cursorId = decoded[1];
      groq.push(
        `(issuedAt < $cursorAt || (issuedAt == $cursorAt && _id < $cursorId))`,
      );
    }
  }

  const rows = await writeClient.fetch<(ReceiptListRow & { _id: string })[]>(
    `*[${groq.join(" && ")}] | order(issuedAt desc, _id desc) [0...$take] {
      _id,
      receiptNumber,
      status,
      issuedAt,
      "customerName": customer.name,
      "customerPhone": customer.phone,
      "customerEmail": customer.email,
      "itemCount": count(items),
      total,
      amountPaid,
      balance,
      paymentMethod,
      "lastEmailStatus": emailAttempts[-1].status,
      "lastEmailAt": emailAttempts[-1].at,
      "emailCount": count(emailAttempts[status == "sent"])
    }`,
    query,
  );

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return {
    rows: page.map(({ _id: _ignored, ...row }) => row),
    nextCursor: hasMore && last ? encodeCursor(last.issuedAt, last._id) : null,
  };
}

export async function getSummary(
  now: Date = new Date(),
): Promise<ReceiptSummary> {
  const result = await writeClient.fetch<{
    todayCount: number;
    todayTotal: number | null;
    monthCount: number;
    monthTotal: number | null;
    outstandingCount: number;
    outstandingTotal: number | null;
  }>(
    `{
      "todayCount": count(*[_type == "receipt" && status == "issued" && issuedAt >= $todayStart]),
      "todayTotal": math::sum(*[_type == "receipt" && status == "issued" && issuedAt >= $todayStart].total),
      "monthCount": count(*[_type == "receipt" && status == "issued" && issuedAt >= $monthStart]),
      "monthTotal": math::sum(*[_type == "receipt" && status == "issued" && issuedAt >= $monthStart].total),
      "outstandingCount": count(*[_type == "receipt" && status == "issued" && balance > 0]),
      "outstandingTotal": math::sum(*[_type == "receipt" && status == "issued" && balance > 0].balance)
    }`,
    { todayStart: lagosDayStartISO(now), monthStart: lagosMonthStartISO(now) },
  );
  return {
    today: { count: result.todayCount ?? 0, total: result.todayTotal ?? 0 },
    month: { count: result.monthCount ?? 0, total: result.monthTotal ?? 0 },
    outstanding: {
      count: result.outstandingCount ?? 0,
      total: result.outstandingTotal ?? 0,
    },
  };
}
