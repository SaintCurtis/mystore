/**
 * Add this to your CategoryTiles.tsx
 *
 * Step 1: Import this map at the top of CategoryTiles.tsx:
 *   import { CATEGORY_SUBTITLES } from "@/lib/constants/category-subtitles";
 *
 * Step 2: In your category tile JSX, below the category title, add:
 *   {CATEGORY_SUBTITLES[cat.slug ?? ""] && (
 *     <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight">
 *       {CATEGORY_SUBTITLES[cat.slug ?? ""]}
 *     </p>
 *   )}
 */

export const CATEGORY_SUBTITLES: Record<string, string> = {
  "computers":              "Laptops, Desktops, Mac Mini",
  "gaming-laptops":         "RTX, High FPS, Budget Picks",
  "regular-laptops":        "Work, School & Everyday Use",
  "accessories":            "Keyboards, Mice, Docks & More",
  "monitors":               "Gaming, Pro & Ultrawide",
  "content-creation-tools": "Cameras, Lights, Microphones",
  "tech-setup-gears":       "Chairs, Desks, LED & Decor",
  "acasis":                 "Docks, Hubs & Enclosures",
  "ecoflow":                "Power Stations & Solar",
  "starlink":               "Satellite Internet Kits",
  "docks-and-hubs":         "USB-C, Thunderbolt, Multi-Port",
  "keyboards":              "Mechanical, Wireless, Gaming",
  "mice":                   "Gaming, Ergonomic, Wireless",
  "headsets":               "Gaming, Studio, Noise-Cancel",
  "webcams":                "HD, 4K & Streaming Cams",
};