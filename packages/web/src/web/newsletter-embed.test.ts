import { readFileSync } from "node:fs";

describe("public newsletter delivery", () => {
  test("keeps the web entrypoint free of the third-party full-screen MailerLite overlay", () => {
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

    expect(html).not.toContain("assets.mailerlite.com");
    expect(html).not.toContain('ml("account"');
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('src="/src/web/main.tsx"');
  });
});
