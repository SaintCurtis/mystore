import Link from "next/link";
import { RotateCcw, ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Return Policy — The Saint's TechNet",
  description: "7-day return policy for all products sold by The Saint's TechNet.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors mb-8"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Shop
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
            <RotateCcw className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Return Policy
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Last updated: April 2026
            </p>
          </div>
        </div>

        <div className="space-y-8">

          {/* highlight box */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-5">
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 mb-1">
              7-Day Return Window
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You have <strong className="text-zinc-800 dark:text-zinc-200">7 calendar days</strong> from
              the date of delivery to initiate a return. After 7 days, products are only
              covered under the warranty policy.
            </p>
          </div>

          <Section title="Eligibility for Returns">
            <p>To be eligible for a return, your item must meet all of the following:</p>
            <ul>
              <li>Return is initiated within 7 days of confirmed delivery</li>
              <li>Item is in the same condition as received — unused, unaltered</li>
              <li>Original packaging, accessories, and documentation are included</li>
              <li>Proof of purchase (order number or receipt) is provided</li>
              <li>The fault or reason for return is clearly communicated</li>
            </ul>
          </Section>

          <Section title="Valid Reasons for Return">
            <ul>
              <li>Item received is significantly different from the product description</li>
              <li>Item arrived with a defect or hardware fault not disclosed at purchase</li>
              <li>Wrong item was delivered</li>
              <li>Item was damaged in transit (must be reported within 24 hours of delivery)</li>
            </ul>
          </Section>

          <Section title="Non-Returnable Items">
            <ul>
              <li>Items damaged due to buyer misuse, drops, liquid damage, or negligence</li>
              <li>Items with broken seals or removed packaging (for brand new products)</li>
              <li>Digital products, software licences, or downloaded content</li>
              <li>Items returned after the 7-day window (these fall under warranty)</li>
              <li>Items where serial numbers or warranty stickers have been tampered with</li>
              <li>Custom-built PCs (these are built to order and non-returnable unless faulty)</li>
            </ul>
          </Section>

          <Section title="Step-by-Step Return Process">
            <ol>
              <li>
                <strong>Initiate within 7 days</strong> — contact us via WhatsApp
                (+234 906 089 8951), email, or Telegram with your order number and
                the reason for return.
              </li>
              <li>
                <strong>Await approval</strong> — we will review your request and
                respond within 24 hours. We may request photos or a short video of
                the issue.
              </li>
              <li>
                <strong>Pack securely</strong> — once approved, repack the item
                carefully in its original packaging with all accessories included.
              </li>
              <li>
                <strong>Ship or drop off</strong> — we will provide the return
                address or arrange a pickup. For returns within Lagos, we can
                arrange a courier. For other states, you ship to us and we
                reimburse reasonable shipping costs upon receipt.
              </li>
              <li>
                <strong>Inspection</strong> — we inspect the returned item within
                2 business days of receipt.
              </li>
              <li>
                <strong>Resolution</strong> — depending on the outcome, we will
                offer a replacement, repair, or refund to your original payment
                method within 3–5 business days.
              </li>
            </ol>
          </Section>

          <Section title="Refunds">
            <p>
              Approved refunds are processed to your original payment method
              (bank transfer, card, or wallet) within <strong className="text-zinc-800 dark:text-zinc-200">3–5 business days</strong> of
              the returned item being inspected and approved.
            </p>
            <p>
              We may offer store credit as an alternative to a cash refund where
              applicable — this is always at your discretion.
            </p>
          </Section>

          <ContactBlock />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        {title}
      </h2>
      <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_li]:text-zinc-600 dark:[&_li]:text-zinc-400">
        {children}
      </div>
    </section>
  );
}

function ContactBlock() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 mt-4">
      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">
        Want to start a return?
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Message us on{" "}
        <a href="https://wa.me/2349060898951" className="text-amber-600 dark:text-amber-400 underline underline-offset-2">
          WhatsApp
        </a>{" "}
        or{" "}
        <a href="mailto:iamsaintcurtis@gmail.com" className="text-amber-600 dark:text-amber-400 underline underline-offset-2">
          email us
        </a>{" "}
        with your order number. We respond within 24 hours.
      </p>
    </div>
  );
}