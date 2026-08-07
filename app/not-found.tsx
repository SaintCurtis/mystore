import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { SearchX, ChevronLeft, MessageCircle, Search } from "lucide-react";
import { RecentlyViewed } from "@/components/app/RecentlyViewed";

export const metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist or may have been moved.",
};

export default async function NotFound() {
  const user = await currentUser();
  const firstName = user?.firstName;

  return (
    <div className="bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 animate-bounce">
            <SearchX className="h-8 w-8 text-amber-500" />
          </div>

          <p className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-amber-500 dark:text-amber-400">
            404 — Component Not Found
          </p>
          <h1 className="mb-3 font-display text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            {firstName ? `Not your fault, ${firstName}.` : "Not your fault."}
          </h1>
          <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            We moved, renamed, or sold out of whatever you were looking for.
            Our engineers are already on it — meanwhile, here's a shortcut back to the good stuff.
          </p>

          {/* Quick search — plain GET form, no client JS needed */}
          <form action="/" method="GET" className="mb-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                name="q"
                placeholder="Search for a product…"
                className="h-11 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>
          </form>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-6 font-display text-sm font-bold text-zinc-950 shadow-md shadow-amber-500/25 transition-all hover:bg-amber-400 active:scale-[0.98]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Shop
            </Link>
            <a
              href="https://wa.me/2349060898951"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 px-6 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <MessageCircle className="h-4 w-4" />
              Chat With Us
            </a>
          </div>
        </div>
      </div>

      <RecentlyViewed />
    </div>
  );
}