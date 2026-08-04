import { S3Client } from "@aws-sdk/client-s3";

// Configure S3 client to work with Cloudflare R2 or any S3-compatible endpoint.
// - If S3_ENDPOINT is set, use that.
// - Otherwise, if R2_ACCOUNT_ID is provided, build the Cloudflare R2 endpoint.
// - Set forcePathStyle: true to ensure compatibility with R2 (no virtual-host style).

const endpoint = process.env.S3_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

export const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export const S3_BUCKET = process.env.S3_BUCKET!;
