import { unstable_cache } from "next/cache";
import { getAboutCompanyInfo } from "@/services/about-company-info-service";
import { getMessageFromCeo } from "@/services/message-from-ceo-service";
import { getContactDetails } from "@/services/contact-service";
import { getHeroSection } from "@/services/hero-service";

/**
 * Cached, serialization-safe reads for the public homepage.
 *
 * The homepage was issuing four uncached MongoDB round trips per request, which
 * measured ~2.7s of TTFB and delayed discovery of the hero image — the LCP
 * resource — by that whole amount.
 *
 * These wrappers exist separately from the underlying services for two reasons:
 *
 *  1. `unstable_cache` persists values through a JSON-shaped serialization, so
 *     ObjectId and Date do not survive as themselves. Each getter below narrows
 *     to the plain fields the page actually renders, so the cached shape is
 *     honest about what comes back.
 *  2. The admin screens still need the raw documents (ObjectId included), so the
 *     original service functions are deliberately left untouched.
 *
 * Cache entries are invalidated by tag from the admin write routes, so editors
 * still see changes immediately rather than waiting out the TTL.
 */

export const HOME_CACHE_TAGS = {
  about: "home:about-company-info",
  ceo: "home:message-from-ceo",
  contact: "home:contact",
  hero: "home:hero",
} as const;

/**
 * Deliberately short. Write routes revalidate by tag for instant updates, but
 * the TTL is the safety net for any write path that is added later and forgets
 * to do so. At homepage traffic levels a 60s window still absorbs virtually
 * every request, so the TTFB win is the same as a long TTL — without a long
 * TTL's failure mode of an editor's change being invisible for hours.
 */
const REVALIDATE_SECONDS = 60;

/**
 * Mirrors the required/optional shape of the stored documents minus `_id` and
 * the timestamps, so consumers keep the same contract they had when reading
 * straight from Mongo.
 */
export type PublicContentBlock = {
  heading: string;
  "heading-en"?: string;
  "heading-ne"?: string;
  description: string;
  "description-en"?: string;
  "description-ne"?: string;
  imageUrl: string;
  imagePublicId: string;
};

function toPublicContentBlock(doc: {
  heading: string;
  "heading-en"?: string;
  "heading-ne"?: string;
  description: string;
  "description-en"?: string;
  "description-ne"?: string;
  imageUrl: string;
  imagePublicId: string;
}): PublicContentBlock {
  return {
    heading: doc.heading ?? "",
    "heading-en": doc["heading-en"],
    "heading-ne": doc["heading-ne"],
    description: doc.description ?? "",
    "description-en": doc["description-en"],
    "description-ne": doc["description-ne"],
    imageUrl: doc.imageUrl ?? "",
    imagePublicId: doc.imagePublicId ?? "",
  };
}

export type PublicAboutCompanyInfo = PublicContentBlock;

export const getCachedAboutCompanyInfo = unstable_cache(
  async (): Promise<PublicAboutCompanyInfo | null> => {
    const doc = await getAboutCompanyInfo();
    return doc ? toPublicContentBlock(doc) : null;
  },
  ["home-about-company-info"],
  { revalidate: REVALIDATE_SECONDS, tags: [HOME_CACHE_TAGS.about] },
);

export type PublicMessageFromCeo = PublicContentBlock;

export const getCachedMessageFromCeo = unstable_cache(
  async (): Promise<PublicMessageFromCeo | null> => {
    const doc = await getMessageFromCeo();
    return doc ? toPublicContentBlock(doc) : null;
  },
  ["home-message-from-ceo"],
  { revalidate: REVALIDATE_SECONDS, tags: [HOME_CACHE_TAGS.ceo] },
);

type PublicContactItem = { text: string; textNe: string; link: string };

export type PublicContactDetails = {
  phone: PublicContactItem;
  email: PublicContactItem;
  facebook: PublicContactItem;
  whatsapp: PublicContactItem;
  location: PublicContactItem;
  isActive: boolean;
};

export const getCachedContactDetails = unstable_cache(
  async (): Promise<PublicContactDetails | null> => {
    const doc = await getContactDetails();
    if (!doc) return null;

    const item = (value?: { text?: string; textNe?: string; link?: string }): PublicContactItem => ({
      text: value?.text ?? "",
      textNe: value?.textNe ?? "",
      link: value?.link ?? "",
    });

    return {
      phone: item(doc.phone),
      email: item(doc.email),
      facebook: item(doc.facebook),
      whatsapp: item(doc.whatsapp),
      location: item(doc.location),
      isActive: doc.isActive ?? false,
    };
  },
  ["home-contact-details"],
  { revalidate: REVALIDATE_SECONDS, tags: [HOME_CACHE_TAGS.contact] },
);

export type PublicHeroSection = {
  title?: string;
  subtitle?: string;
  "title-en"?: string;
  "title-ne"?: string;
  "subtitle-en"?: string;
  "subtitle-ne"?: string;
  slides: { imageUrl: string; imagePublicId: string }[];
};

export const getCachedHeroSection = unstable_cache(
  async (): Promise<PublicHeroSection | null> => {
    const doc = await getHeroSection();
    if (!doc) return null;
    return {
      title: doc.title,
      subtitle: doc.subtitle,
      "title-en": doc["title-en"],
      "title-ne": doc["title-ne"],
      "subtitle-en": doc["subtitle-en"],
      "subtitle-ne": doc["subtitle-ne"],
      slides: (doc.slides ?? []).map((slide) => ({
        imageUrl: slide.imageUrl,
        imagePublicId: slide.imagePublicId,
      })),
    };
  },
  ["home-hero-section"],
  { revalidate: REVALIDATE_SECONDS, tags: [HOME_CACHE_TAGS.hero] },
);
