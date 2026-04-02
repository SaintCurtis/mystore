import Link from "next/link";
import { Globe, ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Shipping Policy — The Saint's TechNet",
  description: "Shipping information, delivery timeframes, and worldwide shipping details.",
};

export default function ShippingPolicyPage() {
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
            <Globe className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Shipping Policy
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Last updated: April 2026
            </p>
          </div>
        </div>

        <div className="space-y-8">

          <Section title="We Ship Worldwide">
            <p>
              The Saint's TechNet ships to every country in the world. Whether you
              are in Lagos, London, Houston, or Dubai — we will get your order to you.
              International orders are processed and shipped via reliable courier
              partners with full tracking.
            </p>
          </Section>

          <Section title="Delivery Timeframes">
            <Table
              headers={["Destination", "Estimated Delivery", "Shipping Method"]}
              rows={[
                ["Lagos (within city)", "1–2 business days", "Same-day / Next-day courier"],
                ["Nigeria (other states)", "3–5 business days", "GIG Logistics / DHL / Jumia"],
                ["West Africa", "5–10 business days", "DHL / FedEx"],
                ["UK & Europe", "7–14 business days", "DHL Express / FedEx"],
                ["USA & Canada", "7–14 business days", "DHL Express / FedEx"],
                ["Rest of World", "10–21 business days", "DHL / EMS / Partner courier"],
              ]}
            />
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">
              * Timeframes are estimates and may vary due to customs clearance,
              public holidays, or courier delays outside our control.
            </p>
          </Section>

          <Section title="Shipping Costs">
            <p>
              Shipping costs are calculated at checkout based on your location,
              order weight, and selected courier. For local Lagos deliveries,
              flat-rate or free shipping may apply on qualifying orders.
            </p>
            <p>
              International shipping costs include packaging, insurance, and
              courier fees. Customs duties and import taxes at the destination
              country are the buyer's responsibility.
            </p>
          </Section>

          <Section title="Order Processing">
            <p>
              Orders are processed within <strong className="text-zinc-800 dark:text-zinc-200">1–2 business days</strong> of
              payment confirmation. You will receive a confirmation message with
              your tracking number once your order has been dispatched.
            </p>
            <p>
              Orders placed on weekends or Nigerian public holidays are processed
              on the next business day.
            </p>
          </Section>

          <Section title="Order Tracking">
            <p>
              Once dispatched, you will receive a tracking number via WhatsApp
              or email. You can use this to monitor your shipment in real time
              via the courier's website.
            </p>
            <p>
              For international orders, tracking updates may take 24–48 hours to
              appear after dispatch.
            </p>
          </Section>

          <Section title="Packaging">
            <p>
              All products are carefully packaged to prevent damage in transit.
              Laptops and electronics are double-boxed with bubble wrap and foam
              padding. We take packaging seriously — damaged-in-transit claims
              are rare, but if it happens, we have you covered (see our Return Policy).
            </p>
          </Section>

          <Section title="Customs & Import Duties (International)">
            <p>
              International shipments may be subject to customs inspection and
              import duties imposed by the destination country. These charges are
              outside our control and are the buyer's responsibility. We declare
              all shipments accurately and do not misrepresent item values on
              customs forms.
            </p>
          </Section>

          <Section title="Lost or Undelivered Packages">
            <p>
              If your package has not arrived within the estimated timeframe,
              contact us immediately. We will liaise with the courier on your
              behalf. If a package is confirmed lost, we will arrange a
              replacement or full refund.
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

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-900">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-300">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((row, i) => (
            <tr key={i} className="bg-white dark:bg-zinc-950">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-3 ${j === 0 ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactBlock() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 mt-4">
      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">
        Shipping question?
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Message us on{" "}
        <a href="https://wa.me/2349060898951" className="text-amber-600 dark:text-amber-400 underline underline-offset-2">
          WhatsApp
        </a>{" "}
        or{" "}
        <a href="mailto:iamsaintcurtis@gmail.com" className="text-amber-600 dark:text-amber-400 underline underline-offset-2">
          email
        </a>. We respond within 24 hours.
      </p>
    </div>
  );
}