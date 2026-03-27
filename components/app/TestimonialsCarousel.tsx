"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Chukwuemeka Obi",
    location: "Abuja, Nigeria",
    product: "MacBook Air M2 (Foreign Used)",
    rating: 5,
    review:
      "Ordered a foreign used MacBook Air M2 and it arrived looking like it just came out of the Apple Store. Battery health was 97%. Saint answered every question I had before I even paid — this man knows his stuff. No dulling, swift delivery to Abuja.",
    initials: "CO",
    color: "bg-blue-600",
  },
  {
    id: 2,
    name: "Adaeze Nwosu",
    location: "Lagos, Nigeria",
    product: "ASUS ROG Strix SCAR 18",
    rating: 5,
    review:
      "I've bought from three different tech vendors on Instagram before. This is the first time nobody played games with me. He told me exactly what the laptop could and couldn't do before I bought it. That kind of honesty from a seller is rare in Nigeria.",
    initials: "AN",
    color: "bg-rose-600",
  },
  {
    id: 3,
    name: "Babatunde Fashola",
    location: "Port Harcourt, Nigeria",
    product: "Custom Gaming PC",
    rating: 5,
    review:
      "I described what I wanted my PC to do and he recommended the right build within my budget — didn't try to upsell me. Three months later, still running smooth. The after-sales support alone makes this worth it.",
    initials: "BF",
    color: "bg-emerald-600",
  },
  {
    id: 4,
    name: "Halima Abubakar",
    location: "Kano, Nigeria",
    product: "Dell XPS 13 (Brand New)",
    rating: 5,
    review:
      "Sent money from Kano to someone I only knew from Instagram — I was nervous. But the item arrived sealed, exactly as described, with a receipt and warranty card. I've since referred four colleagues. The trust is genuine.",
    initials: "HA",
    color: "bg-violet-600",
  },
  {
    id: 5,
    name: "Tolu Adeyemi",
    location: "Ibadan, Nigeria",
    product: "Lenovo Legion Pro 5i",
    rating: 5,
    review:
      "My Lenovo Legion was packed like it was going to space — bubble wrap, box within a box, the works. Performance is insane for the price. A Computer Engineering graduate selling computers is just different. He speaks my language.",
    initials: "TA",
    color: "bg-amber-600",
  },
  {
    id: 6,
    name: "Prosper Chukwu",
    location: "Enugu, Nigeria",
    product: "EcoFlow DELTA 2",
    rating: 5,
    review:
      "With NEPA doing what they do, I needed reliable backup power. Saint helped me pick the right EcoFlow for my home office setup. Didn't just sell me the most expensive one — gave me an honest comparison. This is customer service done right.",
    initials: "PC",
    color: "bg-teal-600",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-amber-400" : "text-zinc-700"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = TESTIMONIALS.length;

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrent((index + total) % total);
      setTimeout(() => setIsAnimating(false), 400);
    },
    [isAnimating, total],
  );

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  // Autoplay
  useEffect(() => {
    autoplayRef.current = setInterval(next, 6000);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [next]);

  const pauseAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };

  // Visible cards: prev, current, next
  const getVisible = () => {
    return [
      TESTIMONIALS[(current - 1 + total) % total],
      TESTIMONIALS[current],
      TESTIMONIALS[(current + 1) % total],
    ];
  };

  const [prevCard, activeCard, nextCard] = getVisible();

  return (
    <section className="bg-zinc-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400">
            What Our Customers Say
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Real People.{" "}
            <span className="text-amber-400">Real Experiences.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
            Over 5 years of verified sales across Nigeria and beyond. Here's
            what buyers actually say.
          </p>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={pauseAutoplay}
          onMouseLeave={() => {
            autoplayRef.current = setInterval(next, 6000);
          }}
        >
          {/* Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Previous card — dimmed */}
            <div className="hidden md:block opacity-40 scale-95 transition-all duration-400 cursor-pointer"
              onClick={prev}>
              <TestimonialCard testimonial={prevCard} />
            </div>

            {/* Active card */}
            <div
              className={`transition-all duration-400 ${isAnimating ? "opacity-70 scale-98" : "opacity-100 scale-100"}`}
            >
              <TestimonialCard testimonial={activeCard} isActive />
            </div>

            {/* Next card — dimmed */}
            <div className="hidden md:block opacity-40 scale-95 transition-all duration-400 cursor-pointer"
              onClick={next}>
              <TestimonialCard testimonial={nextCard} />
            </div>
          </div>

          {/* Mobile single card */}
          <div className="md:hidden">
            <TestimonialCard testimonial={activeCard} isActive />
          </div>

          {/* Navigation buttons */}
          <div className="mt-10 flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={prev}
              className="h-10 w-10 rounded-full border border-zinc-700 text-zinc-400 hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 h-2 bg-amber-400"
                      : "w-2 h-2 bg-zinc-700 hover:bg-zinc-500"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={next}
              className="h-10 w-10 rounded-full border border-zinc-700 text-zinc-400 hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  isActive = false,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  isActive?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-300 ${
        isActive
          ? "border-amber-500/40 bg-zinc-900 shadow-xl shadow-amber-500/5"
          : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      {/* Quote icon */}
      <Quote className="mb-4 h-8 w-8 text-amber-500/40" />

      {/* Stars */}
      <StarRating rating={testimonial.rating} />

      {/* Review text */}
      <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-300 sm:text-base">
        &ldquo;{testimonial.review}&rdquo;
      </p>

      {/* Product tag */}
      <div className="mt-4 inline-flex w-fit items-center rounded-full bg-zinc-800 px-3 py-1">
        <span className="text-xs text-zinc-400">
          Purchased:{" "}
          <span className="font-medium text-zinc-200">
            {testimonial.product}
          </span>
        </span>
      </div>

      {/* Author */}
      <div className="mt-5 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${testimonial.color}`}
        >
          {testimonial.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {testimonial.name}
          </p>
          <p className="text-xs text-zinc-500">{testimonial.location}</p>
        </div>
      </div>
    </div>
  );
}