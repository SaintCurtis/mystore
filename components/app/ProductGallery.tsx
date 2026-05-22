"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassPlusIcon } from "@heroicons/react/24/outline";
import type { PRODUCT_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type ProductImages = NonNullable<
  NonNullable<PRODUCT_BY_SLUG_QUERY_RESULT>["images"]
>;

interface ProductGalleryProps {
  images: ProductImages | null;
  productName: string | null;
}

// ── Animation state machine ───────────────────────────────────────────────
// FIX: The original implementation had a race condition where slideDir was
// set and immediately read by getTransform() in the same render cycle,
// causing inconsistent animation directions and "stuck" states.
//
// New approach: we track the DISPLAYED index separately from the TARGET index.
// Transitions are:
//  idle → entering (new image slides in from side, old slides out)
//  entering → idle (transition complete, new image fully visible)
//
// The key insight: we always keep both the current and next image in the DOM
// during the transition, absolutely positioned, and CSS transitions handle
// the movement. No setTimeout race conditions.

type AnimState = "idle" | "entering";

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [enterFrom, setEnterFrom] = useState<"left" | "right">("right");

  // Touch/drag state
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDraggingHoriz = useRef(false);
  const transitionLock = useRef(false);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-zinc-100 dark:bg-[#111111] border border-zinc-200 dark:border-[#1f1f1f]">
        <span className="text-sm text-zinc-400">No images available</span>
      </div>
    );
  }

  const total = images.length;

  // ── Navigate to index ─────────────────────────────────────────────────
  const goTo = useCallback((targetIndex: number, direction: "left" | "right") => {
    if (transitionLock.current || total <= 1) return;
    const safeTarget = ((targetIndex % total) + total) % total;
    if (safeTarget === current) return;

    transitionLock.current = true;
    setEnterFrom(direction);
    setNext(safeTarget);
    setAnimState("entering");
    setDragX(0);
  }, [current, total]);

  const prev = useCallback(() => goTo(current - 1, "right"), [current, goTo]);
  const nextSlide = useCallback(() => goTo(current + 1, "left"), [current, goTo]);

  const goToIndex = useCallback((index: number) => {
    if (index === current) return;
    goTo(index, index > current ? "left" : "right");
  }, [current, goTo]);

  // When transition ends, promote next → current
  const handleTransitionEnd = useCallback(() => {
    if (next !== null) {
      setCurrent(next);
      setNext(null);
      setAnimState("idle");
      transitionLock.current = false;
    }
  }, [next]);

  // Safety timeout — if transitionend doesn't fire (e.g. reduced-motion), unlock anyway
  useEffect(() => {
    if (animState === "entering") {
      const t = setTimeout(() => {
        if (transitionLock.current) {
          handleTransitionEnd();
        }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [animState, handleTransitionEnd]);

  // ── Touch handlers ────────────────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDraggingHoriz.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (transitionLock.current) return;
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isDraggingHoriz.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        isDraggingHoriz.current = true;
      } else if (Math.abs(dy) > 10) {
        return; // vertical scroll — don't intercept
      }
    }

    if (isDraggingHoriz.current) {
      e.preventDefault();
      const resistance = total === 1 ? 0.05 : 0.8;
      setDragX(dx * resistance);
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;

    if (isDraggingHoriz.current) {
      if (Math.abs(dx) > 60) {
        if (dx < 0) nextSlide();
        else prev();
      } else {
        // Snap back
        setDragX(0);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isDraggingHoriz.current = false;
    if (animState === "idle") setDragX(0);
  }

  // ── Slide positions ───────────────────────────────────────────────────
  // Current image: slides OUT in the direction we're going
  // Next image: slides IN from the opposite side
  function getCurrentTransform() {
    if (animState === "idle") {
      return dragX !== 0 ? `translateX(${dragX}px)` : "translateX(0)";
    }
    // Slide out
    return enterFrom === "left" ? "translateX(-100%)" : "translateX(100%)";
  }

  function getNextTransform() {
    if (animState === "idle") return "translateX(0)";
    // Start position (before animation), then animate to 0
    // CSS transition will move it from its start to 0
    return "translateX(0)";
  }

  function getNextInitialTransform() {
    // Where the next image starts (off-screen)
    return enterFrom === "left" ? "translateX(100%)" : "translateX(-100%)";
  }

  const transition = animState === "entering"
    ? "transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    : dragX !== 0 ? "none" : "transform 200ms ease-out";

  const displayedImage = images[current];
  const nextImage = next !== null ? images[next] : null;

  return (
    <div className="space-y-3">
      {/* ── Main image frame ─────────────────────────────────────────────── */}
      <div className="group relative">
        <div className="relative overflow-hidden rounded-2xl border-2 border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] shadow-md shadow-zinc-200/60 dark:shadow-black/40">

          <div
            className="relative aspect-square select-none overflow-hidden cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Current image */}
            <div
              className="absolute inset-0"
              style={{
                transform: getCurrentTransform(),
                transition,
                willChange: "transform",
                zIndex: 1,
              }}
              onTransitionEnd={animState === "entering" ? handleTransitionEnd : undefined}
            >
              {displayedImage?.asset?.url ? (
                <Image
                  src={displayedImage.asset.url}
                  alt={productName ?? "Product image"}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  draggable={false}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400 text-sm">No image</div>
              )}
            </div>

            {/* Next image (only during transition) */}
            {animState === "entering" && nextImage && (
              <div
                className="absolute inset-0"
                style={{
                  // Starts off-screen, transitions to center
                  transform: "translateX(0)",
                  transition,
                  willChange: "transform",
                  zIndex: 2,
                  // Use CSS animation to enter from the correct side
                  animation: `slideIn${enterFrom === "left" ? "FromRight" : "FromLeft"} 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                }}
              >
                {nextImage.asset?.url && (
                  <Image
                    src={nextImage.asset.url}
                    alt="Next product view"
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    draggable={false}
                  />
                )}
              </div>
            )}

            {/* Arrow buttons */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-[#111111]/90 border border-zinc-200 dark:border-[#2a2a2a] shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-[#1a1a1a] z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-[#111111]/90 border border-zinc-200 dark:border-[#2a2a2a] shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-[#1a1a1a] z-10"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                </button>
              </>
            )}

            {/* Counter */}
            {total > 1 && (
              <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm z-10">
                <span className="text-[11px] font-semibold text-white">
                  {current + 1} / {total}
                </span>
              </div>
            )}

            {/* Swipe hint — mobile only */}
            {total > 1 && dragX === 0 && animState === "idle" && current === 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:hidden flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm animate-pulse pointer-events-none">
                <span className="text-[10px] text-white/90 font-medium">← swipe →</span>
              </div>
            )}

            {/* Zoom hint — desktop */}
            <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <MagnifyingGlassPlusIcon className="h-3 w-3 text-white/80" />
              <span className="text-[10px] text-white/80 font-medium">Click to zoom</span>
            </div>
          </div>

          <div className="h-0.5 w-full bg-linear-to-r from-transparent via-amber-500/60 to-transparent" />
        </div>

        <div className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-amber-500/10" />
      </div>

      {/* Dot indicators — mobile */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 sm:hidden">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToIndex(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current
                  ? "h-2 w-6 bg-amber-500"
                  : "h-2 w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400",
              )}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip — desktop */}
      {total > 1 && (
        <div className="hidden sm:flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {images.map((image, index) => (
            <button
              key={image._key}
              type="button"
              onClick={() => goToIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={current === index}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                current === index
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
              {current === index && (
                <div className="absolute inset-0 bg-amber-500/5 rounded-xl" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Thumbnail strip — mobile */}
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
                current === index
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

      {/* Keyframe animations for slide transitions */}
      <style jsx global>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}