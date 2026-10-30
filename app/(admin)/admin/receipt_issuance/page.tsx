// app/(admin)/admin/receipt_issuance/page.tsx
//
// buyfromsaint.com/admin/receipt_issuance
//
// Issue numbered PDF receipts for walk-in customers. This page is only a
// shell: it holds no data. Everything it shows comes from /api/admin/receipts,
// which requires the signed PIN-session cookie, so the page is protected by
// the same 6-digit PIN as the rest of /admin (the admin layout shows the PIN
// screen first).

import type { Metadata } from "next";
import { ReceiptIssuance } from "@/components/admin/receipts/ReceiptIssuance";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Receipt issuance",
  robots: { index: false, follow: false },
};

export default function ReceiptIssuancePage() {
  return <ReceiptIssuance />;
}
