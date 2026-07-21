"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import cloudinaryLoader, { isCloudinaryUrl } from "@/lib/cloudinary-loader";
import HeroClock from "@/components/HeroClock";
import type { HeroSlide } from "@/services/hero-service";

type HeroCarouselProps = {
  slides: HeroSlide[];
  title: string;
  subtitle?: string;
  intervalMs?: number;
};

export default function HeroCarousel({
  slides,
  title,
  subtitle,
  intervalMs = 6000,
}: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [slides.length, intervalMs]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[calc(100svh-128px)] max-h-[calc(100dvh-128px)] min-h-[320px] sm:min-h-[420px] overflow-hidden bg-linear-to-br from-slate-900 to-slate-700">
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        const isFirst = index === 0;
        const hasImage = Boolean(slide.imageUrl && slide.imageUrl.trim().length > 0);

        return (
          <div
            key={slide.imagePublicId || `slide-${index}`}
            className={`absolute inset-0 transition-opacity duration-700 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            {hasImage && (
              <Image
                src={slide.imageUrl}
                /* Slides 2+ are decorative variants of the same banner and the
                   copy below already carries the meaning, so only the first
                   image is described. */
                alt={isFirst ? title : ""}
                fill
                sizes="100vw"
                quality={isFirst ? 80 : 70}
                loader={isCloudinaryUrl(slide.imageUrl) ? cloudinaryLoader : undefined}
                className="object-cover object-center"
                /* Only the first slide is the LCP candidate. Eager-loading the
                   rest put every banner on the wire at once, starving the one
                   image the user can actually see. */
                priority={isFirst}
                fetchPriority={isFirst ? "high" : "low"}
                loading={isFirst ? "eager" : "lazy"}
              />
            )}

            <div className="absolute inset-0 bg-black/15"></div>

            {/* Title / subtitle overlay — shown on laptop (lg) and up only; hidden on mobile & tablet.
                Painted immediately rather than faded in on image load: this is
                server-rendered text and gating it on a client onLoad handler
                pushed the LCP past hydration. The text-shadow, not the fade,
                is what keeps it legible over a light banner. */}
            <div className="absolute inset-0 hidden flex-col items-center justify-end text-white px-4 pb-6 pt-6 sm:px-6 sm:pb-8 lg:flex lg:px-8 lg:pb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4 text-center leading-tight [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]">
                {title}
              </h1>

              {subtitle && (
                <p className="text-sm sm:text-base lg:text-lg text-gray-100 mb-6 sm:mb-8 text-center max-w-3xl [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <HeroClock />

      {slides.length > 1 && (
        <div
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 sm:bottom-4"
          role="tablist"
          aria-label="Hero slides"
        >
          {/* The dot itself was the button, giving an 8px tap target. The
              button is now a transparent 24px square (WCAG 2.2 minimum) with
              the dot drawn inside, so the visual spacing is unchanged. */}
          {slides.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              role="tab"
              onClick={() => setActiveIndex(index)}
              className="grid h-6 w-6 place-items-center rounded-full"
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === activeIndex}
            >
              <span
                aria-hidden="true"
                className={`block h-2 w-2 rounded-full transition-colors sm:h-2.5 sm:w-2.5 ${
                  index === activeIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
