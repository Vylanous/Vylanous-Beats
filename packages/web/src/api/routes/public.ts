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
    return c.json({ settings: await publicSettings(s) }, 200);
  });

  app.post("/subscribe", zValidator("json", z.object({ email: z.string().email() })), async (c) => {
    const { email } = c.req.valid("json");
    const existing = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
    if (existing.length === 0) {
      await db.insert(subscribers).values({ id: rid("sub"), email });
    }
    return c.json({ ok: true }, 200);
  });
}
