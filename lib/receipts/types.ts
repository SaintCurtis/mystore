/**
 * Shared types and labels for receipt_issuance.
 * Pure data: safe to import from both server code and client components.
 */

export const PAYMENT_METHODS = [
  "cash",
  "transfer",
  "pos",
  "card",
  "crypto",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  transfer: "Bank transfer",
  pos: "POS",
  card: "Card",
  crypto: "Crypto",
  other: "Other",
};

export const ITEM_CONDITIONS = ["new", "foreign_used", "refurbished"] as const;
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];

export const ITEM_CONDITION_LABELS: Record<ItemCondition, string> = {
  new: "Brand new",
  foreign_used: "Foreign used",
  refurbished: "Refurbished",
};

export type ReceiptStatus = "issued" | "void";

export interface ReceiptItem {
  description: string;
  serial?: string;
  condition?: ItemCondition;
  warranty?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type EmailAttemptStatus = "sent" | "failed";

export interface EmailAttempt {
  at: string; // ISO timestamp
  to: string;
  status: EmailAttemptStatus;
  providerId?: string;
  error?: string;
}

/** A receipt exactly as it is stored in Sanity. */
export interface StoredReceipt {
  _id: string;
  receiptNumber: string; // e.g. STN-2026-0001
  status: ReceiptStatus;
  issuedAt: string; // ISO timestamp
  servedBy?: string;
  customer: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  emailAttempts?: EmailAttempt[];
  voidedAt?: string;
  voidReason?: string;
}

/** The slim shape the History table needs. */
export interface ReceiptListRow {
  receiptNumber: string;
  status: ReceiptStatus;
  issuedAt: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  itemCount: number;
  total: number;
  amountPaid: number;
  balance: number;
  paymentMethod: PaymentMethod;
  lastEmailStatus?: EmailAttemptStatus;
  lastEmailAt?: string;
  emailCount: number;
}

export interface ReceiptSummary {
  today: { count: number; total: number };
  month: { count: number; total: number };
  outstanding: { count: number; total: number };
}

export const RECEIPT_NUMBER_PATTERN = /^STN-\d{4}-\d{4,}$/;
