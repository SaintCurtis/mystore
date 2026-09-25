// app/(app)/quotation/page.tsx
import type { Metadata } from "next";
import { QuotationClient } from "./QuotationClient";
import { SITE_URL } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Get a Quotation | The Saint's TechNet",
  description:
    "Generate an instant, engineer-verified quotation for corporate purchases, school orders, and bulk buying — warranty on every item, same-day dispatch, and after-sales support. Print or save as PDF.",
  alternates: { canonical: `${SITE_URL}/quotation` },
  openGraph: {
    title: "Get a Quotation | The Saint's TechNet",
    description:
      "Instant corporate and bulk quotations — engineer-verified gadgets, warranty on every item, same-day dispatch, after-sales support.",
    type: "website",
    siteName: "The Saint's TechNet",
    url: `${SITE_URL}/quotation`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Get a Quotation | The Saint's TechNet",
    description:
      "Instant corporate and bulk quotations — engineer-verified gadgets, warranty on every item, same-day dispatch, after-sales support.",
  },
};

export default function QuotationPage() {
  return <QuotationClient />;
}