// ⚠️ TEMPORARY DIAGNOSTIC VERSION — surfaces the real sanitizer error in the
// rendered HTML (instead of a masked 500) so we can read it from production via
// curl. Revert to the clean import-based version once the cause is confirmed.

type Purifier = { sanitize: (html: string, opts?: unknown) => string };

let purifier: Purifier | null = null;
let loadError = "";

try {
  // Lazy require so a module-load/native-dep failure on Vercel is captured here
  // rather than crashing the whole route's module evaluation.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("isomorphic-dompurify");
  const candidate = (mod && mod.default) || mod;
  if (candidate && typeof candidate.sanitize === "function") {
    purifier = candidate as Purifier;
  } else {
    loadError = `LOAD: module shape unexpected: keys=${Object.keys(mod || {}).join(",")}`;
  }
} catch (e) {
  const err = e as Error;
  loadError = `LOAD: ${err?.message} :: ${(err?.stack || "").split("\n").slice(0, 4).join(" | ")}`;
}

export function sanitizeRichText(html?: string | null): string {
  if (!html) {
    return "";
  }

  if (!purifier) {
    return `[[RICHTEXT_ERROR ${loadError}]]`;
  }

  try {
    return purifier.sanitize(html, {
      ADD_ATTR: ["target", "rel"],
    });
  } catch (e) {
    const err = e as Error;
    return `[[RICHTEXT_ERROR RUNTIME: ${err?.message} :: ${(err?.stack || "").split("\n").slice(0, 4).join(" | ")}]]`;
  }
}

export function hasRichTextContent(value?: string | null) {
  if (!value) {
    return false;
  }

  // Strip tags, decode the common &nbsp; entity, then trim — String.trim()
  // also removes literal non-breaking spaces (U+00A0), so a value containing
  // only whitespace/nbsp correctly reports as empty.
  const text = value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  return text.length > 0;
}
