"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShoppingBag, Cpu, Headphones, Monitor, Gamepad2,
  Video, Home, Zap, Satellite, Wand2,
} from "lucide-react";

const PILLS = [
  { label: "All",         href: "/",                                  icon: ShoppingBag },
  { label: "Laptops",     href: "/?category=gaming-laptops",          icon: Gamepad2    },
  { label: "Computers",   href: "/?category=computers",               icon: Cpu         },
  { label: "Monitors",    href: "/?category=monitors",                icon: Monitor     },
  { label: "Accessories", href: "/?category=accessories",             icon: Headphones  },
  { label: "Content",     href: "/?category=content-creation-tools",  icon: Video       },
  { label: "Setup",       href: "/?category=tech-setup-gears",        icon: Home        },
  { label: "ACASIS",      href: "/?category=acasis",                  icon: Zap         },
  { label: "EcoFlow",     href: "/?category=ecoflow",                 icon: Zap         },
  { label: "Starlink",    href: "/?category=starlink",                icon: Satellite   },
  { label: "AI Setup",    href: "/build-my-setup",                    icon: Wand2       },
];

export function MobileCategoryPills() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") ?? "";

  function isActive(href: string) {
    if (href === "/" && !currentCategory) return true;
    const match = href.match(/category=([^&]+)/);
    if (match) return currentCategory === match[1];
    return false;
  }

  return (
    // top-14 = 56px = exact height of the sticky Header (h-14)
    <div className="md:hidden sticky top-14 z-30 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-100 dark:border-[#1a1a1a]">
      <div className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-hide">
        {PILLS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={label}
              href={href}
              className={`
                flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5
                text-xs font-semibold whitespace-nowrap transition-all duration-150
                ${active
                  ? "bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20"
                  : "bg-zinc-100 dark:bg-[#1a1a1a] text-zinc-600 dark:text-[#a3a3a3] hover:bg-zinc-200 dark:hover:bg-[#2a2a2a]"
                }
              `}
            >
              <Icon className="h-3 w-3 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}