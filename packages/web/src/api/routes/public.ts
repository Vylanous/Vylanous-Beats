import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import type { Hono } from "hono";
import { db } from "../database";
import { subscribers } from "../database/schema";
import { loadSettings, publicSettings } from "../lib/settings";
import { rid } from "../lib/util";

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
    zValidator("json", z.object({ email: z.string().trim().email() })),
    async (c) => {
      const email = c.req.valid("json").email.trim().toLowerCase();
      const existing = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.email, email))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(subscribers).values({ id: rid("sub"), email });
      }
      return c.json({ ok: true }, 200);
    },
  );
}
