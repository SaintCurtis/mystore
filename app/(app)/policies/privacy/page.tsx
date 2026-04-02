import Link from "next/link";
import { Lock, ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — The Saint's TechNet",
  description: "How The Saint's TechNet collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
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
            <Lock className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Last updated: April 2026
            </p>
          </div>
        </div>

        <div className="space-y-8">

          <Section title="Who We Are">
            <p>
              The Saint's Technology Networks (trading as <strong className="text-zinc-800 dark:text-zinc-200">The Saint's TechNet</strong>),
              CAC Business Name Registration No. 9245886, is the data controller
              responsible for your personal information collected through this website
              and our sales channels.
            </p>
            <p>
              We are committed to protecting your privacy and handling your data
              transparently and responsibly.
            </p>
          </Section>

          <Section title="What Data We Collect">
            <p>We collect the following categories of personal data:</p>
            <ul>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Identity data</strong> — your name,
                username, or similar identifiers provided when you create an account or place an order
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Contact data</strong> — email address,
                phone number, and delivery address
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Transaction data</strong> — details
                of products purchased, order amounts, and payment status
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Technical data</strong> — IP address,
                browser type, device type, and pages visited (collected automatically via analytics tools)
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Communication data</strong> — messages
                you send us via WhatsApp, email, or Telegram
              </li>
            </ul>
          </Section>

          <Section title="How We Use Your Data">
            <p>We use your personal data for the following purposes:</p>
            <ul>
              <li>To process and fulfil your orders</li>
              <li>To send order confirmations, tracking updates, and receipts</li>
              <li>To respond to customer service enquiries</li>
              <li>To process warranty and return claims</li>
              <li>To improve our website and product offerings</li>
              <li>To comply with legal and regulatory obligations</li>
              <li>To send promotional messages (only with your consent — opt-out anytime)</li>
            </ul>
          </Section>

          <Section title="Payment Security">
            <p>
              We take payment security seriously. All transactions on our platform
              are processed through <strong className="text-zinc-800 dark:text-zinc-200">Paystack</strong>,
              a PCI-DSS compliant payment processor. We do not store your card
              details on our servers.
            </p>
            <p>
              All payment pages are encrypted using TLS/SSL technology. You can
              verify this by the padlock icon in your browser's address bar.
            </p>
            <p>
              For bank transfers, your bank account details are used solely for
              the purpose of that transaction and are not retained.
            </p>
          </Section>

          <Section title="Data Sharing">
            <p>We do not sell your personal data. We only share it with:</p>
            <ul>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Courier partners</strong> — for
                delivery purposes (name, phone, address only)
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Payment processors</strong> — Paystack,
                for transaction processing
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Authentication services</strong> — Clerk,
                for secure account login
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">Legal authorities</strong> — only
                when required to do so by Nigerian law
              </li>
            </ul>
          </Section>

          <Section title="Data Retention">
            <p>
              We retain your personal data for as long as necessary to fulfil the
              purposes outlined in this policy. Order and transaction records are
              kept for a minimum of 6 years for accounting and legal purposes.
              You may request deletion of your account data at any time.
            </p>
          </Section>

          <Section title="Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to legal retention obligations)</li>
              <li>Opt out of marketing communications at any time</li>
              <li>Lodge a complaint with the relevant data protection authority</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:iamsaintcurtis@gmail.com" className="text-amber-600 dark:text-amber-400 underline underline-offset-2">
                iamsaintcurtis@gmail.com
              </a>.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Our website uses essential cookies to maintain your session and
              shopping cart. We may also use analytics cookies to understand how
              visitors use our site. You can control cookie settings through your
              browser. Disabling cookies may affect some site functionality.
            </p>
          </Section>

          <Section title="Changes to This Policy">
            <p>
              We may update this privacy policy from time to time. Any changes
              will be posted on this page with an updated date. Continued use of
              our website after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">
              Privacy concerns?
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Email us at{" "}
              <a href="mailto:iamsaintcurtis@gmail.com" className="text-amber-600 dark:text-amber-400 underline underline-offset-2">
                iamsaintcurtis@gmail.com
              </a>{" "}
              and we will respond within 48 hours.
            </p>
          </div>

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
      <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-zinc-600 dark:[&_li]:text-zinc-400">
        {children}
      </div>
    </section>
  );
}