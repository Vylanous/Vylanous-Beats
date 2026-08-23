import { describe, expect, test } from "bun:test";
import { insertInlineText, parseInlineText, stripInlineText } from "./inline-text";

describe("inline Builder text", () => {
  test("parses only the bold, italic, and underline markers produced by the Builder toolbar", () => {
    expect(parseInlineText("A **bold** _italic_ [u]underline[/u] line")).toEqual([
      { text: "A ", style: "plain" },
      { text: "bold", style: "bold" },
      { text: " ", style: "plain" },
      { text: "italic", style: "italic" },
      { text: " ", style: "plain" },
      { text: "underline", style: "underline" },
      { text: " line", style: "plain" },
    ]);
  });

  test("keeps malformed marker text visible and strips valid markers for metadata", () => {
    expect(parseInlineText("Keep **unfinished")).toEqual([
      { text: "Keep **unfinished", style: "plain" },
    ]);
    expect(stripInlineText("**Bold** _italic_ [u]underline[/u]")).toBe("Bold italic underline");
  });

  test("wraps selected text and creates a selected formatted placeholder at a cursor", () => {
    expect(insertInlineText("Make this loud", 5, 9, "**")).toEqual({
      value: "Make **this** loud",
      selectionStart: 7,
      selectionEnd: 11,
      usedPlaceholder: false,
    });
    expect(insertInlineText("Make it", 4, 4, "[u]", "[/u]")).toEqual({
      value: "Make[u]formatted text[/u] it",
      selectionStart: 7,
      selectionEnd: 21,
      usedPlaceholder: true,
    });
  });
});
