"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import type { PRODUCT_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type ProductImages = NonNullable<
  NonNullable<PRODUCT_BY_SLUG_QUERY_RESULT>["images"]
>;

interface ProductGalleryProps {
  images: ProductImages | null;
  productName: string | null;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // ── Drag/swipe animation state ──────────────────────────────────────────
  const [dragX, setDragX] = useState(0);           // live offset while dragging
  const [isAnimating, setIsAnimating] = useState(false); // true during snap
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-zinc-100 dark:bg-[#111111] border border-zinc-200 dark:border-[#1f1f1f]">
        <span className="text-sm text-zinc-400">No images available</span>
      </div>
    );
  }

  const total = images.length;
  const selectedImage = images[selectedIndex];

  function goTo(index: number, direction: "left" | "right") {
    if (isAnimating) return;
    const next = (index + total) % total;
    setSlideDir(direction);
    setIsAnimating(true);
    setDragX(0);
    setTimeout(() => {
      setSelectedIndex(next);
      setSlideDir(null);
      setIsAnimating(false);
    }, 280);
  }

  function prev() { goTo(selectedIndex - 1, "right"); }
  function next() { goTo(selectedIndex + 1, "left"); }

  function goToIndex(index: number) {
    if (index === selectedIndex || isAnimating) return;
    goTo(index, index > selectedIndex ? "left" : "right");
  }

  // ── Touch handlers ───────────────────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isDragging.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        isDragging.current = true;
      } else if (Math.abs(dy) > 10) {
        // vertical scroll — don't hijack
        return;
      }
    }

    if (isDragging.current) {
      e.preventDefault();
      // Rubber-band resistance at edges
      const resistance = total === 1 ? 0.1 : 0.85;
      setDragX(dx * resistance);
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;

    if (isDragging.current && Math.abs(dx) > 50) {
      // Committed swipe
      if (dx < 0) next();
      else prev();
    } else {
      // Snap back with spring
      setIsAnimating(true);
      setDragX(0);
      setTimeout(() => setIsAnimating(false), 300);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current = false;
  }

  // ── Slide animation transform ─────────────────────────────────────────
  // During drag: follow finger
  // During slide: animate out/in
  function getTransform() {
    if (dragX !== 0 && !isAnimating) {
      return `translateX(${dragX}px)`;
    }
    if (isAnimating && slideDir === "left") {
      return `translateX(-100%)`;
    }
    if (isAnimating && slideDir === "right") {
      return `translateX(100%)`;
    }
    return `translateX(0px)`;
  }

  function getTransition() {
    if (dragX !== 0 && !isAnimating) return "none"; // live drag — no transition
    return "transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  }

  return (
    <div className="space-y-3">

      {/* ── Main image frame ─────────────────────────────────────────────── */}
      <div className="group relative">
        <div className="relative overflow-hidden rounded-2xl border-2 border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] shadow-md shadow-zinc-200/60 dark:shadow-black/40">

          {/* Aspect ratio container — clips the sliding images */}
          <div
            ref={containerRef}
            className="relative aspect-square select-none overflow-hidden cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sliding image wrapper */}
            <div
              style={{
                transform: getTransform(),
                transition: getTransition(),
                willChange: "transform",
              }}
              className="absolute inset-0"
            >
              {selectedImage?.asset?.url ? (
                <Image
                  src={selectedImage.asset.url}
                  alt={productName ?? "Product image"}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  draggable={false}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400 text-sm">
                  No image
                </div>
              )}
            </div>

            {/* Peek of next image during drag — right side */}
            {dragX < -20 && selectedIndex < total - 1 && (
              <div
                style={{
                  transform: `translateX(calc(100% + ${dragX}px))`,
                  transition: "none",
                }}
                className="absolute inset-0 opacity-60"
              >
                {images[selectedIndex + 1]?.asset?.url && (
                  <Image
                    src={images[selectedIndex + 1].asset!.url!}
                    alt="Next"
                    fill
                    className="object-contain p-4"
                    sizes="50vw"
                    draggable={false}
                  />
                )}
              </div>
            )}

            {/* Peek of prev image during drag — left side */}
            {dragX > 20 && selectedIndex > 0 && (
              <div
                style={{
                  transform: `translateX(calc(-100% + ${dragX}px))`,
                  transition: "none",
                }}
                className="absolute inset-0 opacity-60"
              >
                {images[selectedIndex - 1]?.asset?.url && (
                  <Image
                    src={images[selectedIndex - 1].asset!.url!}
                    alt="Previous"
                    fill
                    className="object-contain p-4"
                    sizes="50vw"
                    draggable={false}
                  />
                )}
              </div>
            )}

            {/* Arrow buttons — desktop hover */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-[#111111]/90 border border-zinc-200 dark:border-[#2a2a2a] shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-[#1a1a1a] z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-[#111111]/90 border border-zinc-200 dark:border-[#2a2a2a] shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-[#1a1a1a] z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                </button>
              </>
            )}

            {/* Counter badge */}
            {total > 1 && (
              <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm z-10">
                <span className="text-[11px] font-semibold text-white">
                  {selectedIndex + 1} / {total}
                </span>
              </div>
            )}

            {/* Swipe hint — mobile only, fades after first swipe */}
            {total > 1 && dragX === 0 && !isAnimating && selectedIndex === 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:hidden flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm animate-pulse">
                <span className="text-[10px] text-white/90 font-medium">← swipe →</span>
              </div>
            )}

            {/* Zoom hint — desktop */}
            <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ZoomIn className="h-3 w-3 text-white/80" />
              <span className="text-[10px] text-white/80 font-medium">Click to zoom</span>
            </div>
          </div>

          {/* Amber accent line */}
          <div className="h-0.5 w-full bg-linear-to-r from-transparent via-amber-500/60 to-transparent" />
        </div>

        {/* Outer glow ring */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-amber-500/10" />
      </div>

      {/* ── Dot indicators — mobile ──────────────────────────────────────── */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 sm:hidden">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToIndex(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === selectedIndex
                  ? "h-2 w-6 bg-amber-500"
                  : "h-2 w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400",
              )}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Thumbnail strip — desktop ────────────────────────────────────── */}
      {total > 1 && (
        <div className="hidden sm:flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {images.map((image, index) => (
            <button
              key={image._key}
              type="button"
              onClick={() => goToIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={selectedIndex === index}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                selectedIndex === index
                  ? "border-amber-500 shadow-sm shadow-amber-500/20 scale-105"
                  : "border-zinc-200 dark:border-[#1f1f1f] hover:border-zinc-400 dark:hover:border-[#3a3a3a] opacity-70 hover:opacity-100",
              )}
            >
              {image.asset?.url ? (
                <Image
                  src={image.asset.url}
                  alt={`${productName ?? "Product"} view ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">N/A</div>
              )}
              {selectedIndex === index && (
                <div className="absolute inset-0 bg-amber-500/5 rounded-xl" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Thumbnail strip — mobile ─────────────────────────────────────── */}
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:hidden">
          {images.map((image, index) => (
            <button
              key={image._key}
              type="button"
              onClick={() => goToIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={cn(
                "relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                selectedIndex === index
                  ? "border-amber-500 shadow-md shadow-amber-500/30 scale-105"
                  : "border-zinc-200 dark:border-[#1f1f1f] opacity-60 hover:opacity-100",
              )}
            >
              {image.asset?.url ? (
                <Image
                  src={image.asset.url}
                  alt={`${productName ?? "Product"} view ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">N/A</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}