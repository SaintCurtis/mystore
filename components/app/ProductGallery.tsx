"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassPlusIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import type { PRODUCT_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type ProductImages = NonNullable<NonNullable<PRODUCT_BY_SLUG_QUERY_RESULT>["images"]>;
type ProductVideos = NonNullable<NonNullable<PRODUCT_BY_SLUG_QUERY_RESULT>["videos"]>;

type MediaItem =
  | { kind: "image"; _key: string; url: string }
  | { kind: "video"; _key: string; url: string };

interface ProductGalleryProps {
  images: ProductImages | null;
  videos?: ProductVideos | null;
  productName: string | null;
}

type AnimState = "idle" | "entering";

export function ProductGallery({ images, videos, productName }: ProductGalleryProps) {
  // Build unified media array: images first, then videos
  const media: MediaItem[] = [
    ...(images ?? []).map((img) => ({
      kind: "image" as const,
      _key: img._key ?? Math.random().toString(),
      url: img.asset?.url ?? "",
    })),
    ...(videos ?? []).map((vid) => ({
      kind: "video" as const,
      _key: (vid as any)._key ?? Math.random().toString(),
      url: (vid as any).asset?.url ?? "",
    })),
  ].filter((m) => m.url);

  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [enterFrom, setEnterFrom] = useState<"left" | "right">("right");
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDraggingHoriz = useRef(false);
  const transitionLock = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const total = media.length;

  const goTo = useCallback(
    (targetIndex: number, direction: "left" | "right") => {
      if (transitionLock.current || total <= 1) return;
      const safeTarget = ((targetIndex % total) + total) % total;
      if (safeTarget === current) return;
      transitionLock.current = true;
      setEnterFrom(direction);
      setNext(safeTarget);
      setAnimState("entering");
      setDragX(0);
      // Pause any playing video when navigating away
      if (videoRef.current) videoRef.current.pause();
    },
    [current, total],
  );

  const prev = useCallback(() => goTo(current - 1, "right"), [current, goTo]);
  const nextSlide = useCallback(() => goTo(current + 1, "left"), [current, goTo]);
  const goToIndex = useCallback(
    (index: number) => {
      if (index === current) return;
      goTo(index, index > current ? "left" : "right");
    },
    [current, goTo],
  );

  const handleTransitionEnd = useCallback(() => {
    if (next !== null) {
      setCurrent(next);
      setNext(null);
      setAnimState("idle");
      transitionLock.current = false;
    }
  }, [next]);

  useEffect(() => {
    if (animState === "entering") {
      const t = setTimeout(() => {
        if (transitionLock.current) handleTransitionEnd();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [animState, handleTransitionEnd]);

  // ── Early return AFTER all hooks are declared (Rules of Hooks) ──────────
  if (media.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-zinc-100 dark:bg-[#111111] border border-zinc-200 dark:border-[#1f1f1f]">
        <span className="text-sm text-zinc-400">No images available</span>
      </div>
    );
  }

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
        return;
      }
    }
    if (isDraggingHoriz.current) {
      e.preventDefault();
      setDragX(dx * (total === 1 ? 0.05 : 0.8));
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
        setDragX(0);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isDraggingHoriz.current = false;
    if (animState === "idle") setDragX(0);
  }

  function getCurrentTransform() {
    if (animState === "idle") return dragX !== 0 ? `translateX(${dragX}px)` : "translateX(0)";
    return enterFrom === "left" ? "translateX(-100%)" : "translateX(100%)";
  }

  const transition =
    animState === "entering"
      ? "transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      : dragX !== 0
        ? "none"
        : "transform 200ms ease-out";

  const displayedItem = media[current];
  const nextItem = next !== null ? media[next] : null;

  function renderMediaItem(item: MediaItem, isPrimary = false) {
    if (item.kind === "video") {
      return (
        <video
          ref={isPrimary ? videoRef : undefined}
          src={item.url}
          controls
          playsInline
          className="absolute inset-0 h-full w-full object-contain p-2"
        />
      );
    }
    return (
      <Image
        src={item.url}
        alt={productName ?? "Product image"}
        fill
        className="object-contain p-4"
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority={isPrimary}
        draggable={false}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Main frame ─────────────────────────────────────────────── */}
      <div className="group relative">
        <div className="relative overflow-hidden rounded-2xl border-2 border-zinc-200 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] shadow-md shadow-zinc-200/60 dark:shadow-black/40">
          <div
            className="relative aspect-square select-none overflow-hidden cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Current item */}
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
              {renderMediaItem(displayedItem, true)}
            </div>

            {/* Next item (only during transition) */}
            {animState === "entering" && nextItem && (
              <div
                className="absolute inset-0"
                style={{
                  transform: "translateX(0)",
                  transition,
                  willChange: "transform",
                  zIndex: 2,
                  animation: `slideIn${enterFrom === "left" ? "FromRight" : "FromLeft"} 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                }}
              >
                {renderMediaItem(nextItem)}
              </div>
            )}

            {/* Arrow buttons */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-[#111111]/90 border border-zinc-200 dark:border-[#2a2a2a] shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-[#1a1a1a] z-10"
                  aria-label="Previous"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-[#111111]/90 border border-zinc-200 dark:border-[#2a2a2a] shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-[#1a1a1a] z-10"
                  aria-label="Next"
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

            {/* Zoom hint — desktop, images only */}
            {displayedItem.kind === "image" && (
              <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <MagnifyingGlassPlusIcon className="h-3 w-3 text-white/80" />
                <span className="text-[10px] text-white/80 font-medium">Click to zoom</span>
              </div>
            )}
          </div>

          <div className="h-0.5 w-full bg-linear-to-r from-transparent via-brand-500/60 to-transparent" />
        </div>

        <div className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-brand-500/10" />
      </div>

      {/* Dot indicators — mobile */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 sm:hidden">
          {media.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToIndex(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current
                  ? "h-2 w-6 bg-brand-500"
                  : "h-2 w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400",
              )}
              aria-label={`Go to item ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {media.map((item, index) => (
            <button
              key={item._key}
              type="button"
              onClick={() => goToIndex(index)}
              aria-label={`View ${item.kind} ${index + 1}`}
              aria-pressed={current === index}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                current === index
                  ? "border-brand-500 shadow-sm shadow-brand-500/20 scale-105"
                  : "border-zinc-200 dark:border-[#1f1f1f] hover:border-zinc-400 dark:hover:border-[#3a3a3a] opacity-70 hover:opacity-100",
              )}
            >
              {item.kind === "image" ? (
                <Image
                  src={item.url}
                  alt={`${productName ?? "Product"} view ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                  <PlayIcon className="h-6 w-6 text-white/80" />
                </div>
              )}
              {current === index && (
                <div className="absolute inset-0 bg-brand-500/5 rounded-xl" />
              )}
            </button>
          ))}
        </div>
      )}

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