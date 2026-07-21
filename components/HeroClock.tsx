"use client";

import { useEffect, useState } from "react";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

/**
 * Split out of HeroCarousel so the once-a-second tick re-renders only these two
 * spans. Kept inside the carousel it re-rendered every slide and every <Image>
 * on every tick, for the lifetime of the page.
 *
 * Placeholders are rendered on the server and for the first client paint so the
 * badge reserves its final width (tabular-nums) and never shifts layout.
 */
export default function HeroClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const currentDate = now ? dateFormatter.format(now) : "--/--/----";
  const currentTime = now ? timeFormatter.format(now) : "--:--:-- --";

  return (
    <div className="absolute right-3 top-3 z-20 inline-flex items-stretch overflow-hidden rounded-sm border border-white/55 bg-mint text-black sm:right-5 sm:top-5">
      <div className="inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="text-xs font-semibold tabular-nums text-black sm:text-sm">
          {currentDate}
        </span>
      </div>

      <span className="w-px bg-white/70" aria-hidden="true" />

      <div className="inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
        <span className="text-xs font-semibold tabular-nums text-black sm:text-sm">
          {currentTime}
        </span>
      </div>
    </div>
  );
}
