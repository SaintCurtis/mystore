import { redirect } from "next/navigation";
import { SuccessClient } from "./SuccessClient";
import { getCheckoutSession } from "@/lib/actions/checkout";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order Confirmed | Gadget Store",
  description: "Your order has been placed successfully",
};

interface SuccessPageProps {
  // Paystack redirects with ?reference=xxx (not session_id)
  searchParams: Promise<{ reference?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const reference = params.reference;

  if (!reference) {
    redirect("/");
  }

  const result = await getCheckoutSession(reference);

  if (!result.success || !result.session) {
    redirect("/");
  }

  return <SuccessClient session={result.session} />;
}
