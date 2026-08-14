# Admin Upload and Object Storage Deployment

The Vylanous Beats admin panel uploads artwork, audio previews, delivery files, brand assets, and Page Builder images directly to Cloudflare R2 through short-lived presigned `PUT` URLs. The web API generates each URL only for an authenticated administrator and stores an object key rather than a long-lived public credential. R2 supports this `PUT` model, provided the browser sends the request to an unexpired URL and preserves any signature-bound headers such as `Content-Type`. [1]

For uploads to work in production, configure all four values below on the Vercel project for the **Preview** and **Production** environments. The application accepts the matching `S3_*` names instead, but the two naming conventions must not be mixed.

| Vercel variable        | Purpose                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| `R2_ACCOUNT_ID`        | Cloudflare account identifier used to derive the R2 S3 endpoint.              |
| `R2_BUCKET`            | Bucket that contains artwork, audio previews, delivery files, and site media. |
| `R2_ACCESS_KEY_ID`     | R2 S3 API-token access key with bucket object read/write permission.          |
| `R2_SECRET_ACCESS_KEY` | Secret paired with the R2 access key.                                         |

The R2 bucket also requires a CORS policy because the browser uploads directly to a cross-origin presigned URL. Without the policy, a browser upload can fail even when the generated URL is valid. Replace the example origins below with the actual public site origin and any preview origin that administrators use. Do not add a trailing slash to an origin. [2]

```json
[
  {
    "AllowedOrigins": [
      "https://www.vylanous.com",
      "https://vylanous.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD"
    ],
    "AllowedHeaders": [
      "https://www.vylanous.com",
      "https://vylanous.com"
    ],
    "MaxAgeSeconds": 3600
  },
  {
    "AllowedOrigins": [
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD"
    ],
    "AllowedHeaders": [
      "https://www.vylanous.com",
      "https://vylanous.com"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

In Cloudflare, open **R2 Object Storage**, select the configured bucket, open **Settings**, and add the JSON through **CORS Policy**. Vercel serves the Hono API from the `packages/web/api/[...path].ts` catch-all function using the Bun runtime, so `/api/admin/upload/presign` is available alongside the static Vite site after deployment.

> The browser can only complete a direct upload when both the Vercel environment variables and R2 CORS policy are present. Missing credentials cause the API to return `storage_not_configured`; a missing CORS policy causes the browser’s cross-origin `PUT` request to be blocked even when the presigned URL is valid.

## References

[1]: https://developers.cloudflare.com/r2/api/s3/presigned-urls/ "Cloudflare R2: Presigned URLs"
[2]: https://developers.cloudflare.com/r2/buckets/cors/ "Cloudflare R2: Configure CORS"
