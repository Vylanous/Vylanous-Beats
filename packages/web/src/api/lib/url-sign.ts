import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET } from "./s3";

/**
 * If the stored value is an S3 object key (not an http URL), return a
 * presigned GET url. Otherwise return it untouched (supports external URLs too).
 */
export async function signIfKey(key: string): Promise<string> {
  if (!key) return "";
  // Already a usable URL, or a local file served from /public — never presign these,
  // otherwise seeded/local assets turn into 404ing bucket URLs.
  if (key.startsWith("/") || key.startsWith("http://") || key.startsWith("https://")) return key;
  try {
    return await getSignedUrl(
      // @aws-sdk/client-s3 and s3-request-presigner can resolve slightly different
      // @smithy/types versions, which makes the structurally identical client type
      // mismatch. Runtime is unaffected.
      s3 as unknown as Parameters<typeof getSignedUrl>[0],
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
  } catch (e) {
    try {
      console.error("[s3] signIfKey failed", { key, error: e });
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
