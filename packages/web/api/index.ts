// Standalone Vercel serverless API handler
// This bypasses the full Hono monolith and handles only the admin login
import { createHmac, timingSafeEqual } from "node:crypto";

const PASSWORD = process.env.ADMIN_PASSWORD;
const SECRET = process.env.ADMIN_TOKEN_SECRET || process.env.BETTER_AUTH_SECRET;

// Fail loudly at import time rather than shipping a guessable default credential.
if (!PASSWORD || PASSWORD.length < 10) {
  throw new Error("ADMIN_PASSWORD must be set and at least 10 characters long");
}
if (!SECRET || SECRET.length < 16) {
  throw new Error("ADMIN_TOKEN_SECRET (or BETTER_AUTH_SECRET) must be set and at least 16 characters long");
}

function makeToken(): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const payload = Buffer.from(String(exp)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch { return false; }
  const exp = Number(Buffer.from(payload, "base64url").toString("utf8"));
  return Number.isFinite(exp) && Date.now() <= exp;
}

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization,Content-Type,x-admin-token",
      },
    });
  }

  const path = url.pathname.replace(/^\/api\/index/, "").replace(/^\/api/, "") || "/";

  // POST /api/login
  if (req.method === "POST" && path === "/admin/login") {
    try {
      const body = await req.json();
      const input = String(body.password || "");
      const expected = PASSWORD;
      const a = Buffer.from(input);
      const b = Buffer.from(expected);
      if (a.length === b.length && timingSafeEqual(a, b)) {
        return json({ token: makeToken() });
      }
      return json({ error: "invalid_password" }, 401);
    } catch {
      return json({ error: "invalid_password" }, 401);
    }
  }

  // GET /api/admin/me
  if (req.method === "GET" && path === "/admin/me") {
    const header = req.headers.get("Authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.headers.get("x-admin-token") || "";
    if (verifyToken(token)) return json({ ok: true });
    return json({ error: "unauthorized" }, 401);
  }

  return json({ error: "not_found" }, 404);
}
