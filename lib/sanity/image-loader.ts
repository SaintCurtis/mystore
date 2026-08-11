import type { ImageLoaderProps } from "next/image";

/**
 * Routes all next/image resizing to the origin CDN instead of Vercel's
 * Image Optimization API. cdn.sanity.io and images.unsplash.com both
 * support on-the-fly resizing via query params (?w=&q=&auto=format),
 * so there's no reason to burn Vercel's metered transformation quota
 * re-doing work the origin already does for free.
 *
 * This fully replaces Vercel's optimizer for every <Image> in the app —
 * no changes needed at individual call sites.
 */
export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", (quality ?? 75).toString());
    url.searchParams.set("auto", "format"); // serves WebP/AVIF when the browser supports it
    return url.toString();
  } catch {
    return src;
  }
}