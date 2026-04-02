import Link from "next/link";
import { Cpu, Mail, Phone, Send } from "lucide-react";

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/the_saints_technet?igsh=MXkxejdvdHl0anM2OQ==",
    icon: (<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>),
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/Saint_Curtis_",
    icon: (<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>),
  },
  {
    label: "Facebook",
    href: "https://web.facebook.com/oluwatobi.samuel.733",
    icon: (<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>),
  },
  {
    label: "Telegram",
    href: "https://t.me/oluwasaintcurtis",
    icon: (<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>),
  },
];

const QUICK_LINKS = [
  { label: "All Products", href: "/" },
  { label: "Computers", href: "/?category=computers" },
  { label: "Accessories", href: "/?category=accessories" },
  { label: "Tech Setup Gears", href: "/?category=tech-setup-gears" },
  { label: "Monitors", href: "/?category=monitors" },
  { label: "Content Creation Tools", href: "/?category=content-creation-tools" },
  { label: "Custom PCs", href: "/?category=custom-pcs" },
  { label: "EcoFlow", href: "/?category=ecoflow" },
  { label: "Starlink", href: "/?category=starlink" },
];

const POLICY_LINKS = [
  { label: "Warranty Policy", href: "#" },
  { label: "Return Policy", href: "#" },
  { label: "Shipping Info", href: "#" },
  { label: "Privacy Policy", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-[#1a1a1a] bg-zinc-100 dark:bg-[#0a0a0a] transition-colors duration-300">

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-5 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 w-fit group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 shadow-sm shadow-amber-500/30 dark:shadow-amber-500/15 transition-all duration-200 group-hover:bg-amber-400">
                <Cpu className="h-4 w-4 text-zinc-950" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-extrabold tracking-tight text-zinc-900 dark:text-[#f1f1f1]">
                  The Saint's TechNet
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                  CAC Registered
                </span>
              </div>
            </Link>

            <p className="text-sm leading-relaxed text-zinc-600 dark:text-[#a3a3a3] max-w-xs">
              Premium brand-new and foreign-used tech — verified by a Seasoned Computer Engineer.
              Warranty on everything. Shipped worldwide since 2019.
            </p>

            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 dark:border-[#2a2a2a] text-zinc-500 dark:text-[#a3a3a3] transition-all duration-200 hover:border-amber-500/50 hover:bg-amber-500/8 hover:text-amber-600 dark:hover:text-amber-400"
                >
                  {icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-[#555]">Shop</p>
            <ul className="flex flex-col gap-3">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-zinc-600 dark:text-[#a3a3a3] transition-colors hover:text-amber-600 dark:hover:text-amber-400">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-[#555]">Policies</p>
            <ul className="flex flex-col gap-3">
              {POLICY_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-zinc-600 dark:text-[#a3a3a3] transition-colors hover:text-amber-600 dark:hover:text-amber-400">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-2">
              {["Warranty on every product", "7-day hassle-free returns", "Worldwide shipping"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-xs text-zinc-500 dark:text-[#a3a3a3]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-[#555]">Contact Us</p>
            <ul className="flex flex-col gap-4">
              {[
                { href: "mailto:iamsaintcurtis@gmail.com", icon: Mail, label: "Email", value: "iamsaintcurtis@gmail.com" },
                { href: "https://wa.me/2349060898951", icon: Phone, label: "WhatsApp / Call", value: "+234 906 089 8951", external: true },
                { href: "https://t.me/oluwasaintcurtis", icon: Send, label: "Telegram", value: "@oluwasaintcurtis", external: true },
              ].map(({ href, icon: Icon, label, value, external }) => (
                <li key={label}>
                  <Link href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] text-zinc-500 dark:text-[#a3a3a3] transition-colors group-hover:border-amber-500/40 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 dark:text-[#555]">{label}</p>
                      <p className="text-sm text-zinc-700 dark:text-[#a3a3a3] transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400 break-all">
                        {value}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="https://wa.me/2349060898951"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 px-4 py-3 text-sm font-semibold text-[#25D366] transition-all duration-200 hover:bg-[#25D366]/15 hover:border-[#25D366]/40"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </Link>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-zinc-200 dark:border-[#1a1a1a]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-zinc-500 dark:text-[#555]">
              © {new Date().getFullYear()} The Saint's Technology Networks. CAC Registered. All rights reserved.
            </p>
            <p className="text-xs text-zinc-400 dark:text-[#444]">
              Built by an Engineer. Trusted by Thousands.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}