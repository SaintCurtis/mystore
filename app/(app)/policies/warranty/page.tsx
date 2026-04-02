import Link from "next/link";
import { ShieldCheck, ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Warranty Policy — The Saint's TechNet",
  description: "Warranty terms and coverage for all products sold by The Saint's TechNet.",
};

export default function WarrantyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors mb-8"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Shop
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
            <ShieldCheck className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Warranty Policy
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Last updated: April 2026
            </p>
          </div>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">

          <Section title="Our Warranty Promise">
            <p>
              At The Saint's TechNet, every product we sell is personally inspected and
              verified before it reaches you. We back our products with a warranty
              that reflects our confidence in what we sell. Warranty duration varies
              by product category and condition — details are specified on each product
              listing and on your receipt.
            </p>
          </Section>

          <Section title="Warranty Coverage by Product Type">
            <Table
              headers={["Product Type", "Brand New", "Foreign Used"]}
              rows={[
                ["Gaming Laptops", "3–6 months", "1–3 months"],
                ["Regular Laptops", "3–6 months", "1–3 months"],
                ["MacBooks", "3–6 months", "1–3 months"],
                ["Monitors", "3–6 months", "1–3 months"],
                ["Custom PCs", "3 months (parts)", "N/A"],
                ["Accessories & Peripherals", "1–3 months", "As stated"],
                ["EcoFlow / Power Stations", "6 months", "N/A"],
                ["Cameras & Content Creation", "3 months", "N/A"],
              ]}
            />
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">
              * Specific warranty duration is stated on your invoice and product receipt.
              When in doubt, contact us before purchase.
            </p>
          </Section>

          <Section title="What the Warranty Covers">
            <ul>
              <li>Manufacturing defects present at the time of delivery</li>
              <li>Hardware failures not caused by misuse or physical damage</li>
              <li>Battery defects (capacity below 80% within the warranty period)</li>
              <li>Screen defects (dead pixels, backlight failure) not caused by impact</li>
              <li>Component failures under normal use conditions</li>
            </ul>
          </Section>

          <Section title="What Voids the Warranty">
            <ul>
              <li>Physical damage — drops, cracks, liquid spills, or impact damage</li>
              <li>Unauthorised repairs or modifications by a third party</li>
              <li>Removal or alteration of serial numbers or warranty stickers</li>
              <li>Damage caused by incorrect voltage, power surges, or improper storage</li>
              <li>Normal wear and tear (scratches, cosmetic ageing)</li>
              <li>Products used outside of their intended purpose</li>
              <li>Warranty claims submitted after the warranty period has expired</li>
            </ul>
          </Section>

          <Section title="How to Claim Your Warranty">
            <ol>
              <li>
                <strong>Contact us</strong> — reach out via WhatsApp (+234 906 089 8951),
                email (iamsaintcurtis@gmail.com), or Telegram (@oluwasaintcurtis)
                within the warranty period.
              </li>
              <li>
                <strong>Provide proof of purchase</strong> — share your order number or
                receipt. We keep records of all sales.
              </li>
              <li>
                <strong>Describe the fault</strong> — give a clear description and, if
                possible, a short video or photos showing the issue.
              </li>
              <li>
                <strong>Ship or bring the product</strong> — we will guide you on
                whether to bring it in person or ship it to us. Shipping costs for
                warranty claims within Nigeria are covered by us.
              </li>
              <li>
                <strong>Resolution</strong> — we will repair, replace, or issue store
                credit depending on the nature of the fault, typically within 5–10
                business days.
              </li>
            </ol>
          </Section>

          <Section title="Important Notes">
            <ul>
              <li>
                Warranty is non-transferable — it applies only to the original buyer.
              </li>
              <li>
                We reserve the right to assess whether a fault is covered before
                proceeding with a warranty claim.
              </li>
              <li>
                For foreign-used products, warranty coverage reflects the pre-owned
                nature of the item and is stated clearly at the time of purchase.
              </li>
            </ul>
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
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 mt-8">
      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">
        Questions about your warranty?
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Contact us on{" "}
        <a href="https://wa.me/2349060898951" className="text-amber-600 dark:text-amber-400 underline underline-offset-2">
          WhatsApp
        </a>
        ,{" "}
        <a href="mailto:iamsaintcurtis@gmail.com" className="text-amber-600 dark:text-amber-400 underline underline-offset-2">
          email
        </a>
        , or{" "}
        <a href="https://t.me/oluwasaintcurtis" className="text-amber-600 dark:text-amber-400 underline underline-offset-2">
          Telegram
        </a>
        . We respond within 24 hours.
      </p>
    </div>
  );
}