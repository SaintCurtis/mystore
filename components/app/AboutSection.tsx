import { Wrench, ShieldCheck, Globe, Award } from "lucide-react";

const MILESTONES = [
  {
    icon: Wrench,
    year: "2016",
    title: "Deep Technical Roots",
    desc: "Years of hands-on hardware experience — diagnosing faults, replacing components, and understanding computers the way most resellers never will. That foundation is what sets The Saint's TechNet apart.",
  },
  {
    icon: Award,
    year: "2019",
    title: "The Saint's TechNet Founded",
    desc: "What started as a passion project quickly became a trusted name in premium tech retail. Built on integrity, verified products, and honest recommendations — not just sales targets.",
  },
  {
    icon: ShieldCheck,
    year: "2021",
    title: "CAC Business Registration",
    desc: "Formalised as The Saint's Technology Networks — a fully registered Nigerian business. Every transaction is backed by a real, accountable entity. No side hustle. This is the real thing.",
  },
  {
    icon: Globe,
    year: "2024",
    title: "Shipping Worldwide",
    desc: "From Nigeria to anywhere on Earth. Brand new and premium foreign-used tech delivered to customers across the globe — with warranty, with care, and with expertise.",
  },
];

export function AboutSection() {
  return (
    <section className="bg-zinc-100 dark:bg-zinc-900 py-24 sm:py-32 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">

          {/* Left — Story */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400">
              About The Saint's TechNet
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Not Just a Seller.{" "}
              <span className="text-amber-500 dark:text-amber-400">An Engineer</span>{" "}
              Who Happens to Sell.
            </h2>

            <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400 sm:text-base">
              <p>
                The Saint's Technology Networks — known as{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  The Saint's TechNet
                </span>{" "}
                — was built on something most tech vendors don't have: real,
                deep technical knowledge. Not certifications on a wall. Actual
                hands-on engineering expertise developed over years of working
                with hardware at its most fundamental level.
              </p>
              <p>
                When you buy from us, you're not buying from a middleman who
                googled specs. You're buying from someone who can look at a
                machine, understand it completely, and tell you honestly whether
                it fits your needs — or whether something else does.
              </p>
              <p>
                That commitment to honesty is why our customers come back, refer
                their colleagues, and trust us with purchases that matter.
                Every product is personally verified. Every recommendation is
                genuine. Every sale is backed by a warranty and a 7-day return
                policy — because when you truly understand what you're selling,
                you have nothing to hide.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-zinc-300 dark:border-zinc-800 pt-10">
              {[
                { value: "5+", label: "Years in business" },
                { value: "1000+", label: "Happy customers" },
                { value: "100%", label: "Verified products" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-extrabold text-amber-500 dark:text-amber-400">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Timeline */}
          <div className="relative">
            <div className="absolute left-5 top-0 h-full w-px bg-zinc-300 dark:bg-zinc-800" />
            <div className="space-y-10">
              {MILESTONES.map(({ icon: Icon, year, title, desc }) => (
                <div key={year} className="relative flex gap-6 pl-14">
                  <div className="absolute left-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                    <Icon className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div>
                    <span className="mb-1 inline-block rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-0.5 text-xs font-semibold text-amber-500 dark:text-amber-400">
                      {year}
                    </span>
                    <h3 className="mt-1 text-base font-bold text-zinc-900 dark:text-white">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}