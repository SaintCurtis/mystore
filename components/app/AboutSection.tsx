import { Wrench, ShieldCheck, Globe, Award } from "lucide-react";

const MILESTONES = [
  { icon: Wrench, year: "2016", title: "Deep Technical Roots", desc: "Years of hands-on hardware work — diagnosing faults, replacing components, understanding machines the way most resellers never will. That foundation is what drives every product decision we make." },
  { icon: Award, year: "2019", title: "The Saint's TechNet Founded", desc: "Launched with one goal: bring honest, engineer-verified tech retail to Nigeria. No hype. No guesswork. Just the right product at the right price." },
  { icon: ShieldCheck, year: "2021", title: "CAC Business Registration", desc: "Registered as The Saint's Technology Networks — a fully accountable Nigerian business. Every transaction is backed by a real, legal entity." },
  { icon: Globe, year: "2024", title: "Shipping Worldwide", desc: "From Lagos to anywhere on Earth — brand-new and premium foreign-used tech, warranted and delivered worldwide." },
];

export function AboutSection() {
  return (
    <section className="bg-zinc-100 dark:bg-[#0f0f0f] py-24 sm:py-32 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">

          {/* Left */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              About The Saint's TechNet
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-[#f1f1f1] sm:text-4xl">
              Engineering Expertise.{" "}
              <span className="text-brand-600 dark:text-brand-400">Not Just</span>{" "}
              Sales.
            </h2>

            <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-600 dark:text-[#a3a3a3] sm:text-base">
              <p>
                <span className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">The Saint's TechNet</span>{" "}
                was built on something most tech vendors skip: genuine engineering knowledge applied to every product we touch.
              </p>
              <p>
                Every recommendation is honest. Every product is verified by our team before it reaches you.
                We only stock what we'd stand behind — which is why every sale comes with a warranty and a 7-day return policy.
              </p>
              <p>
                That standard is why our customers come back, and why they send their colleagues.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-zinc-300 dark:border-[#1f1f1f] pt-10">
              {[
                { value: "5+", label: "Years in business" },
                { value: "1000+", label: "Happy customers" },
                { value: "100%", label: "Verified products" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">{value}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-[#a3a3a3]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Timeline */}
          <div className="relative">
            <div className="absolute left-5 top-0 h-full w-px bg-zinc-300 dark:bg-[#1f1f1f]" />
            <div className="space-y-10">
              {MILESTONES.map(({ icon: Icon, year, title, desc }) => (
                <div key={year} className="relative flex gap-6 pl-14">
                  <div className="absolute left-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-500/30 bg-brand-500/8 dark:bg-brand-500/6">
                    <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <span className="mb-1 inline-block rounded-full bg-zinc-200 dark:bg-[#1a1a1a] px-3 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {year}
                    </span>
                    <h3 className="mt-1 text-base font-bold text-zinc-900 dark:text-[#f1f1f1]">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-[#a3a3a3]">{desc}</p>
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