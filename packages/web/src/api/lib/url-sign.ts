import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET } from "./s3";

const isHttp = (v: string) => /^https?:\/\//i.test(v);

const endpointHost = (() => {
  const raw =
    process.env.S3_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");
  try {
    return raw ? new URL(raw).host : "";
  } catch {
    return "";
  }
})();

function isOwnStorageUrl(u: URL): boolean {
  if (endpointHost && u.host === endpointHost) return true;
  if (/\.r2\.cloudflarestorage\.com$/i.test(u.host)) return true;
  if (/(^|\.)s3[.-][a-z0-9-]*\.amazonaws\.com$/i.test(u.host)) return true;
  return false;
}

/**
 * Turn a stored value into a plain object key.
 *
 * Historically the admin UI could round-trip a *presigned* URL back into the
 * database (the beat list returned signed urls in the same field the form
 * saved from). Signing that value again produced a nested, non-existent key
 * and every preview 404'd. This unwraps any number of those layers.
 *
 * External (non-storage) URLs are returned untouched so third-party links
 * keep working.
 */
export function normalizeKey(raw: string | null | undefined): string {
  let v = (raw || "").trim();
  if (!v) return "";

  for (let i = 0; i < 5 && isHttp(v); i++) {
    let u: URL;
    try {
      u = new URL(v);
    } catch {
      break;
    }
    if (!isOwnStorageUrl(u)) return v; // genuine external URL — leave as-is

    let path = u.pathname.replace(/^\/+/, "");
    try {
      path = decodeURIComponent(path);
    } catch {
      // keep the raw path if it isn't valid percent-encoding
    }
    if (S3_BUCKET && path.startsWith(`${S3_BUCKET}/`)) path = path.slice(S3_BUCKET.length + 1);
    if (!path) break;
    v = path;
  }

  if (!isHttp(v)) {
    const q = v.indexOf("?");
    if (q !== -1) v = v.slice(0, q);
    v = v.replace(/^\/+/, "");
  }
  return v;
}

/**
 * If the stored value is an S3 object key (not an http URL), return a
 * presigned GET url. Otherwise return it untouched (supports external URLs too).
 */
export async function signIfKey(key: string): Promise<string> {
  const normalized = normalizeKey(key);
  if (!normalized) return "";
  if (isHttp(normalized)) return normalized; // external url — nothing to sign
  try {
    return await getSignedUrl(s3, new GetObjectCommand({ Bucket: S3_BUCKET, Key: normalized }), {
      expiresIn: 3600,
    });
  } catch (e) {
    try {
      console.error("[s3] signIfKey failed", { key: normalized, error: e });
    } catch {
      // ignore logging failures
    }
    return "";
  }
}

/** Shape a beat row for public consumption: sign artwork + preview audio. */
export async function publicBeat<T extends { artworkUrl: string; audioUrl: string }>(b: T): Promise<T> {
  return { ...b, artworkUrl: await signIfKey(b.artworkUrl), audioUrl: await signIfKey(b.audioUrl) };
}
