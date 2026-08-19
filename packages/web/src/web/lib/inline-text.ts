export type InlineTextStyle = "plain" | "bold" | "italic" | "underline";

export interface InlineTextToken {
  text: string;
  style: InlineTextStyle;
}

const WRAPPERS: Array<{ open: string; close: string; style: Exclude<InlineTextStyle, "plain"> }> = [
  { open: "**", close: "**", style: "bold" },
  { open: "[u]", close: "[/u]", style: "underline" },
  { open: "_", close: "_", style: "italic" },
];

/**
 * Parses only the small marker set produced by the Builder toolbar. It never
 * evaluates HTML, so authored copy stays safe to render as React text nodes.
 */
export function parseInlineText(value: string): InlineTextToken[] {
  const tokens: InlineTextToken[] = [];
  let cursor = 0;

  const push = (text: string, style: InlineTextStyle) => {
    if (!text) return;
    const previous = tokens.at(-1);
    if (previous?.style === style) previous.text += text;
    else tokens.push({ text, style });
  };

  while (cursor < value.length) {
    const wrapper = WRAPPERS.find(({ open }) => value.startsWith(open, cursor));
    if (!wrapper) {
      push(value[cursor], "plain");
      cursor += 1;
      continue;
    }

    const contentStart = cursor + wrapper.open.length;
    const closingIndex = value.indexOf(wrapper.close, contentStart);
    if (closingIndex === -1 || closingIndex === contentStart) {
      push(value[cursor], "plain");
      cursor += 1;
      continue;
    }

    push(value.slice(contentStart, closingIndex), wrapper.style);
    cursor = closingIndex + wrapper.close.length;
  }

  return tokens;
}

export function stripInlineText(value: string): string {
  return parseInlineText(value)
    .map((token) => token.text)
    .join("");
}
