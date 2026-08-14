/**
 * Vercel catch-all function for the Hono API.
 *
 * The Vite client is deployed as static output, so every `/api/*` request must
 * be handled by a Vercel Function rather than the SPA fallback. The project
 * uses Bun APIs for Argon2id customer-password hashing, so `vercel.json`
 * explicitly selects Vercel's Bun runtime for this function.
 */
import { handle } from "hono/vercel";
import app from "../src/api";

export default handle(app);
