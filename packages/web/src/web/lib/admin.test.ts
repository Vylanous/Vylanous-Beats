import { describe, expect, test } from "bun:test";
import { formatAdminError } from "./admin";

describe("admin error formatting", () => {
  test("formats nested validation issues with their field paths", () => {
    expect(
      formatAdminError(
        {
          error: "Validation failed",
          issues: [
            { path: ["pages", 0, "layout", "primaryColor"], message: "Invalid hex color" },
            { path: ["pages", 0, "layout", "chrome", "header"], message: "Expected boolean" },
          ],
        },
        "Request failed",
      ),
    ).toBe(
      "pages.0.layout.primaryColor: Invalid hex color; pages.0.layout.chrome.header: Expected boolean",
    );
  });

  test("keeps a useful server message", () => {
    expect(formatAdminError({ message: "Settings saved" }, "Request failed")).toBe(
      "Settings saved",
    );
  });

  test("never returns object coercion output", () => {
    expect(formatAdminError({ unexpected: { value: true } }, "Request failed")).not.toBe(
      "[object Object]",
    );
  });
});
