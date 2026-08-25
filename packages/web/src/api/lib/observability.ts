import type { Context, Next } from "hono";

function requestPath(c: Context): string {
  try {
    return new URL(c.req.url).pathname;
  } catch {
    return "unknown";
  }
}

/** Emits only route, status, and duration for server failures; never request bodies or identifiers. */
export async function logServerErrors(c: Context, next: Next) {
  const startedAt = performance.now();
  try {
    await next();
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "api_unhandled_error",
        method: c.req.method,
        path: requestPath(c),
        durationMs: Math.round(performance.now() - startedAt),
      }),
    );
    throw error;
  }
  if (c.res.status >= 500) {
    console.error(
      JSON.stringify({
        event: "api_server_error",
        method: c.req.method,
        path: requestPath(c),
        status: c.res.status,
        durationMs: Math.round(performance.now() - startedAt),
      }),
    );
  }
}
