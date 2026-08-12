import { describe, it, expect } from "bun:test";

process.env.R2_ACCOUNT_ID = "abc123account";
process.env.R2_BUCKET = "vylanous";
process.env.R2_ACCESS_KEY_ID = "AKIATESTKEY";
process.env.R2_SECRET_ACCESS_KEY = "secretsecret";

const { normalizeKey, signIfKey } = await import("../lib/url-sign.ts");
const { S3_CONFIGURED } = await import("../lib/s3.ts");

describe("storage", () => {
  it("picks up R2_* env names", () => expect(S3_CONFIGURED).toBe(true));

  it("plain key untouched", () => expect(normalizeKey("audio/1712-abc-beat.mp3")).toBe("audio/1712-abc-beat.mp3"));

  it("unwraps a presigned r2 url back to the key", () => {
    const signed = "https://abc123account.r2.cloudflarestorage.com/vylanous/audio/1712-abc-beat.mp3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=deadbeef&X-Amz-Expires=3600";
    expect(normalizeKey(signed)).toBe("audio/1712-abc-beat.mp3");
  });

  it("unwraps a doubly nested presigned url", () => {
    const nested = "https://abc123account.r2.cloudflarestorage.com/vylanous/" + encodeURIComponent("https://abc123account.r2.cloudflarestorage.com/vylanous/audio/x.mp3?X-Amz-Signature=aa") + "?X-Amz-Signature=bb";
    expect(normalizeKey(nested)).toBe("audio/x.mp3");
  });

  it("leaves external urls alone", () => {
    expect(normalizeKey("https://cdn.example.com/song.mp3")).toBe("https://cdn.example.com/song.mp3");
  });

  it("signs a key into a working single-layer url", async () => {
    const url = await signIfKey("https://abc123account.r2.cloudflarestorage.com/vylanous/audio/1712-abc-beat.mp3?X-Amz-Signature=old");
    const u = new URL(url);
    expect(u.host).toBe("abc123account.r2.cloudflarestorage.com");
    expect(u.pathname).toBe("/vylanous/audio/1712-abc-beat.mp3");
    expect(u.searchParams.get("X-Amz-Signature")).toBeTruthy();
  });
});
