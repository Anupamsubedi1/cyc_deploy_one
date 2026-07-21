"use client";

import { useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";

type MapEmbedProps = {
  /** The `https://www.google.com/maps/embed?pb=...` URL. */
  src: string;
  /** Accessible title for the iframe, also shown on the placeholder. */
  title: string;
  /** Human-readable address rendered on the placeholder. */
  address?: string;
  /** Where the "open in Google Maps" affordance points. */
  directionsHref?: string;
};

/**
 * Click-to-load wrapper around the Google Maps embed.
 *
 * The bare <iframe> pulled 443 KiB of Maps JS (222 KiB of it unused) and spent
 * ~315 ms on the main thread during load, which was the single largest
 * contributor to Total Blocking Time — all for a widget below the fold that most
 * visitors never interact with. `loading="lazy"` did not help: the section is
 * close enough to the viewport that the lazy threshold fires almost immediately.
 *
 * The facade renders the same footprint with the address and a real link out to
 * Google Maps, so the information is available (and crawlable) without the
 * embed. The iframe is only mounted once the user asks for it. As a side effect
 * no third-party frame is created until then, so no Google cookies are set on
 * first visit.
 */
export default function MapEmbed({
  src,
  title,
  address,
  directionsHref,
}: MapEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        src={src}
        title={title}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  return (
    <div className="map-facade">
      <button
        type="button"
        className="map-facade-btn"
        onClick={() => setLoaded(true)}
        aria-label={`Load interactive map: ${title}`}
      >
        <span className="map-facade-pin" aria-hidden="true">
          <FaMapMarkerAlt />
        </span>
        <span className="map-facade-title">View location on map</span>
        {address && <span className="map-facade-address">{address}</span>}
        <span className="map-facade-cta">Load interactive map</span>
      </button>

      {directionsHref && (
        <a
          className="map-facade-link"
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps
        </a>
      )}
    </div>
  );
}
