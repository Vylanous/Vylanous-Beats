import { S3Client } from "@aws-sdk/client-s3";

// Configure S3 client to work with Cloudflare R2 or any S3-compatible endpoint.
//
// Both naming conventions are accepted, because .env.template documents the
// R2_* names while the original code only read the S3_* names — when only the
// R2_* vars were set the client had no credentials and no bucket, so every
// presign silently produced a broken url and previews never played.
//
// - Endpoint: S3_ENDPOINT, else built from R2_ACCOUNT_ID.
// - forcePathStyle: true for R2 compatibility (no virtual-host style).

const env = (...names: string[]): string => {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) return v.trim();
  }
  return "";
};

const accountId = env("R2_ACCOUNT_ID", "S3_ACCOUNT_ID");

export const S3_ENDPOINT =
  env("S3_ENDPOINT", "R2_ENDPOINT") ||
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

export const S3_BUCKET = env("S3_BUCKET", "R2_BUCKET", "R2_BUCKET_NAME");

const accessKeyId = env("S3_ACCESS_KEY_ID", "R2_ACCESS_KEY_ID");
const secretAccessKey = env("S3_SECRET_ACCESS_KEY", "R2_SECRET_ACCESS_KEY");

/** True when the object storage is fully configured (endpoint, bucket, creds). */
export const S3_CONFIGURED = Boolean(S3_ENDPOINT && S3_BUCKET && accessKeyId && secretAccessKey);

if (!S3_CONFIGURED) {
  const missing = [
    S3_ENDPOINT ? null : "S3_ENDPOINT or R2_ACCOUNT_ID",
    S3_BUCKET ? null : "S3_BUCKET or R2_BUCKET",
    accessKeyId ? null : "S3_ACCESS_KEY_ID or R2_ACCESS_KEY_ID",
    secretAccessKey ? null : "S3_SECRET_ACCESS_KEY or R2_SECRET_ACCESS_KEY",
  ].filter(Boolean);
  try {
    console.error(
      `[s3] object storage is NOT configured — audio previews, artwork and downloads will not load. Missing: ${missing.join(", ")}`,
    );
  } catch {
    // ignore logging failures
  }
}

export const s3 = new S3Client({
  region: env("S3_REGION", "R2_REGION") || "auto",
  endpoint: S3_ENDPOINT || undefined,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
  // AWS SDK v3 defaults to always adding CRC32 checksums. On a *presigned* url
  // that bakes `x-amz-checksum-crc32` (computed over an empty body) and
  // `x-amz-sdk-checksum-algorithm` into the query string — Cloudflare R2
  // rejects those uploads, so audio/artwork never actually landed in the
  // bucket and previews had nothing to play. Only checksum when required.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
