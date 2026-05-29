// app/(app)/quotation/page.tsx
import type { Metadata } from "next";
import { QuotationClient } from "./QuotationClient";

export const metadata: Metadata = {
  title: "Get a Quotation | The Saint's TechNet",
  description:
    "Generate an instant AI-powered formal quotation — perfect for corporate purchases, school orders, and bulk buying. Print or save as PDF.",
};

export default function QuotationPage() {
  return <QuotationClient />;
}