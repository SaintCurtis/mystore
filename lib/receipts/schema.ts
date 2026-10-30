/**
 * Request validation for receipt_issuance (server side).
 * The browser form validates too, but the server never trusts it: totals are
 * recomputed here from quantities and prices, so a tampered request can't
 * change what a receipt says.
 */

import { z } from "zod";
import { ITEM_CONDITIONS, PAYMENT_METHODS } from "./types";

// Empty strings from the form become "not provided".
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalEmail = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine(
    (value) => value === undefined || z.email().safeParse(value).success,
    {
      message: "Enter a valid email address",
    },
  );

const naira = z.number().int("Use whole naira").min(0).max(999_999_999_999);

export const receiptItemSchema = z.object({
  description: z.string().trim().min(1, "Describe the item").max(160),
  serial: optionalText(80),
  condition: z.enum(ITEM_CONDITIONS).optional(),
  warranty: optionalText(40),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(999),
  unitPrice: naira,
});

export const createReceiptSchema = z.object({
  clientRequestId: z.string().trim().min(8).max(64),
  customer: z.object({
    name: z.string().trim().min(1, "Enter the customer's name").max(80),
    phone: optionalText(30),
    email: optionalEmail,
    address: optionalText(200),
  }),
  items: z
    .array(receiptItemSchema)
    .min(1, "Add at least one item")
    .max(30, "Maximum 30 items per receipt"),
  discount: naira.default(0),
  // Leave out for "paid in full"
  amountPaid: naira.optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  paymentReference: optionalText(80),
  servedBy: optionalText(60),
  notes: optionalText(400),
  sendEmail: z.boolean().optional(),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;

export const emailReceiptSchema = z.object({
  to: optionalEmail,
});

export const voidReceiptSchema = z.object({
  reason: z.string().trim().min(3, "Give a short reason").max(200),
});

export function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request";
  const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
  return `${path}${issue.message}`;
}
