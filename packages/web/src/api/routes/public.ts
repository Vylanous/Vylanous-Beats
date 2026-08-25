import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import type { Hono } from "hono";
import { db } from "../database";
import { subscribers } from "../database/schema";
import { loadSettings, publicSettings } from "../lib/settings";
import { rid } from "../lib/util";
import { enforceRateLimit, RATE_LIMITS } from "../lib/rate-limit";

export function publicRoutes(app: Hono) {
  app.get("/settings", async (c) => {
    const s = await loadSettings();
    // Builder media and layout edits must be visible immediately after save;
    // caching this response can otherwise keep an older card image live for minutes.
    c.header("Cache-Control", "no-store");
    return c.json({ settings: await publicSettings(s) }, 200);
  });

  app.post(
    "/subscribe",
    zValidator(
      "json",
      z.object({
        email: z.string().trim().email(),
        firstName: z.string().trim().min(1).max(80).optional(),
        lastName: z.string().trim().min(1).max(80).optional(),
        sourcePageId: z.string().trim().min(1).max(120).optional(),
        sourceBlockId: z.string().trim().min(1).max(120).optional(),
        workflowKey: z
          .string()
          .trim()
          .regex(/^[a-z0-9][a-z0-9_-]*$/)
          .max(80)
          .optional(),
      }),
    ),
    async (c) => {
      const rateLimited = await enforceRateLimit(c, RATE_LIMITS.newsletterSubscribe);
      if (rateLimited) return rateLimited;
      const input = c.req.valid("json");
      const email = input.email.trim().toLowerCase();
      const existing = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.email, email))
        .limit(1);
      const metadata = {
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.sourcePageId ? { sourcePageId: input.sourcePageId } : {}),
        ...(input.sourceBlockId ? { sourceBlockId: input.sourceBlockId } : {}),
        ...(input.workflowKey ? { workflowKey: input.workflowKey } : {}),
      };
      if (existing.length === 0) {
        await db.insert(subscribers).values({
          id: rid("sub"),
          email,
          firstName: input.firstName || "",
          lastName: input.lastName || "",
          sourcePageId: input.sourcePageId || "",
          sourceBlockId: input.sourceBlockId || "",
          workflowKey: input.workflowKey || "",
        });
      } else if (Object.keys(metadata).length > 0) {
        // A later, richer signup can fill in a subscriber profile without creating duplicates.
        await db.update(subscribers).set(metadata).where(eq(subscribers.email, email));
      }
      // workflowKey is deliberately stored as metadata only. No product is delivered until a
      // dedicated fulfillment workflow is connected to the subscriber event in a future release.
      return c.json({ ok: true }, 200);
    },
  );
}
