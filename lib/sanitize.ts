import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u",
  "h2", "h3", "h4",
  "ul", "ol", "li",
  "blockquote", "hr",
  "span", "div",
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  span: ["class", "style"],
  div: ["class"],
  p: ["class"],
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: {
      span: {
        "font-weight": [/^bold$/],
        "font-style": [/^italic$/],
        "text-decoration": [/^underline$/],
      },
    },
  });
}
