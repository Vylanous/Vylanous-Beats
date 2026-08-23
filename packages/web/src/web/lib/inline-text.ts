export type InlineTextStyle = "plain" | "bold" | "italic" | "underline";

export interface InlineTextToken {
  text: string;
  style: InlineTextStyle;
}

export interface InlineTextInsertion {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  usedPlaceholder: boolean;
}

/**
 * Safely inserts a limited inline-format wrapper around the selected range. If
 * no text is selected, it inserts a selected placeholder so the next keystroke
 * replaces it with formatted copy instead of silently doing nothing.
 */
export function insertInlineText(
  value: string,
  start: number,
  end: number,
  open: string,
  close = open,
  placeholder = "formatted text",
): InlineTextInsertion {
  const selectionStart = Math.max(0, Math.min(start, value.length));
  const selectionEnd = Math.max(selectionStart, Math.min(end, value.length));
  const selected = value.slice(selectionStart, selectionEnd);
  const insertedText = selected || placeholder;
  return {
    value: `${value.slice(0, selectionStart)}${open}${insertedText}${close}${value.slice(selectionEnd)}`,
    selectionStart: selectionStart + open.length,
    selectionEnd: selectionStart + open.length + insertedText.length,
    usedPlaceholder: !selected,
  };
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
