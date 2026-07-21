import type { ImageLoaderProps } from "next/image";

/**
 * Whether `src` can be served through Cloudinary's transformation pipeline.
 *
 * Call sites use this to decide whether to pass `cloudinaryLoader` at all:
 * a custom loader replaces the Next.js optimizer outright, so handing it a
 * local /public path would ship that file raw. Pass the loader for Cloudinary
 * sources and leave it undefined otherwise, so bundled assets keep going
 * through Next's own AVIF/WebP pipeline.
 */
export function isCloudinaryUrl(src: string | undefined | null): boolean {
  return Boolean(src && src.includes("res.cloudinary.com") && src.includes("/upload/"));
}

/**
 * Builds Cloudinary delivery URLs so resizing and format negotiation happen on
 * their CDN rather than in the Next.js image optimizer. On serverless this
 * matters twice over: no function invocation per variant, and no cold-start
 * transcode in front of the LCP image.
 *
 * `f_auto` negotiates AVIF/WebP from the request's Accept header, `q_auto`
 * picks a perceptual quality target, and `c_limit` never upscales past the
 * asset's native width.
 *
 * Non-Cloudinary sources pass through untouched, so this is safe to hand to any
 * <Image> whose src may come from either the CMS or /public.
 */
/**
 * Single-URL variant for the raw <img> tags that can't be migrated to
 * next/image yet (styled with inline objectFit, hover handlers, etc.).
 * Returns a width-capped, format-negotiated URL instead of the original upload.
 */
export function cloudinarySrc(
  src: string | undefined | null,
  width: number,
  quality: number | "auto" = "auto",
): string {
  if (!src) return "";
  return cloudinaryLoader({ src, width, quality: quality === "auto" ? undefined : quality });
}

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
    return src;
  }

  const transforms = ["f_auto", "c_limit", `w_${width}`, `q_${quality ?? "auto"}`];

  // Transformations sit directly after `/upload/`, ahead of any version
  // segment (`v1234/`) that Cloudinary includes in stored URLs.
  return src.replace("/upload/", `/upload/${transforms.join(",")}/`);
}
