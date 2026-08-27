import { staticContentType } from "./static-content-type";

const IMMUTABLE_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";

export function staticResponseHeaders(pathname: string): HeadersInit {
  const headers: HeadersInit = { "Content-Type": staticContentType(pathname) };
  if (pathname.startsWith("/assets/")) {
    headers["Cache-Control"] = IMMUTABLE_ASSET_CACHE_CONTROL;
  }
  return headers;
}
