import sanitizeHtml from "sanitize-html";

/**
 * Sanitizes rich-text HTML (produced by the TipTap editor / stored CMS content)
 * before it is rendered via `dangerouslySetInnerHTML`.
 *
 * This is the single defense against **stored XSS** in CMS content: the admin
 * editor only constrains input on the client, so a crafted `POST` to an admin
 * content API could otherwise persist `<script>` / `onerror=` / `javascript:`
 * payloads that execute on public pages and in other admins' browsers.
 *
 * Uses `sanitize-html` (pure JS, no jsdom) so it runs identically in Node
 * serverless functions and the browser. It strips scripts, event-handler
 * attributes and dangerous URL schemes while preserving the formatting tags the
 * editor emits (headings, lists, bold/italic, links, tables, images, etc.).
 * Every `dangerouslySetInnerHTML` sink that renders user/CMS-authored HTML MUST
 * pass through this function.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "span", "div",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "strike", "del", "ins", "mark", "sub", "sup", "small",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
  ],
  allowedAttributes: {
    "*": ["class", "style", "id", "dir", "lang", "title"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan", "scope"],
    col: ["span"],
    ol: ["start", "type"],
  },
  // Only safe URL schemes survive; `javascript:`/`data:` (except images) are dropped.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowProtocolRelative: true,
  // Keep inline styles as authored (CMS content is admin-sourced); sanitize-html
  // still escapes the values so `expression()`/url(javascript:) cannot break out.
  allowedStyles: {},
  transformTags: {
    // Harden new-tab links against reverse-tabnabbing without dropping rel.
    a: (tagName, attribs) => {
      if (attribs.target === "_blank") {
        attribs.rel = attribs.rel
          ? Array.from(new Set([...attribs.rel.split(/\s+/), "noopener", "noreferrer"])).join(" ")
          : "noopener noreferrer";
      }
      return { tagName, attribs };
    },
  },
};

export function sanitizeRichText(html?: string | null): string {
  if (!html) {
    return "";
  }

  return sanitizeHtml(html, SANITIZE_OPTIONS);
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
