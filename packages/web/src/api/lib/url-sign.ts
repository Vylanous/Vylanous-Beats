import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET, S3_ENDPOINT, S3_CONFIGURED } from "./s3";

const isHttp = (v: string) => /^https?:\/\//i.test(v);

const endpointHost = (() => {
  try {
    return S3_ENDPOINT ? new URL(S3_ENDPOINT).host : "";
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

let warnedUnconfigured = false;
function warnUnconfigured() {
  if (warnedUnconfigured) return;
  warnedUnconfigured = true;
  try {
    console.error("[s3] refusing to presign: object storage credentials/bucket are not configured");
  } catch {
    // ignore logging failures
  }
}

/**
 * If the stored value is an S3 object key (not an http URL), return a
 * presigned GET url. Otherwise return it untouched (supports external URLs too).
 */
export async function signIfKey(key: string): Promise<string> {
  const value = key.trim();
  if (!value) return "";
  // Vite copies assets in public/ to the site root. They are already browser-
  // reachable and must not be rewritten to private object-storage URLs.
  if (value.startsWith("/")) return value;

  const normalized = normalizeKey(value);
  if (!normalized) return "";
  if (isHttp(normalized)) return normalized; // external url — nothing to sign
  if (!S3_CONFIGURED) {
    warnUnconfigured();
    return "";
  }
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
