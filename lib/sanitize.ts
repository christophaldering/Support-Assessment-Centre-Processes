import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "del",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "hr", "pre", "code",
  "span", "div",
  "a",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption",
  "sub", "sup", "mark",
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  span: ["class", "style"],
  div: ["class"],
  p: ["class"],
  a: ["href", "target", "rel", "title"],
  td: ["colspan", "rowspan", "style"],
  th: ["colspan", "rowspan", "style"],
  table: ["class", "style"],
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: {
      span: {
        "font-weight": [/^(bold|normal|[1-9]00)$/],
        "font-style": [/^(italic|normal)$/],
        "text-decoration": [/^(underline|line-through|none)$/],
        "text-align": [/^(left|center|right|justify)$/],
        "color": [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/],
        "background-color": [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/],
      },
      td: {
        "text-align": [/^(left|center|right)$/],
        "width": [/^\d+(%|px|em|rem)$/],
        "border": [/^\d+px\s+solid\s+#[0-9a-fA-F]{3,6}$/],
        "padding": [/^\d+px$/],
      },
      th: {
        "text-align": [/^(left|center|right)$/],
        "width": [/^\d+(%|px|em|rem)$/],
        "padding": [/^\d+px$/],
      },
      table: {
        "width": [/^\d+(%|px)$/],
        "border-collapse": [/^(collapse|separate)$/],
      },
    },
  });
}
