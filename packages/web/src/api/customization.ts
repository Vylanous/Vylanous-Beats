import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { requireAdmin } from "./lib/admin-auth";
import { db } from "./database";
import { settings } from "./database/schema";
import { eq } from "drizzle-orm";

const customizationSchema = z.object({
  json: z.string(),
});

export async function registerCustomizationRoutes(app: any) {
  app.get("/admin/customization", requireAdmin, async (c: any) => {
    const rows = await db.select().from(settings).limit(1);
    const row = rows[0] || { id: "settings", json: "{}" };
    return c.json({ settings: JSON.parse(row.json) }, 200);
  });

  app.post(
    "/admin/customization",
    requireAdmin,
    zValidator("json", customizationSchema),
    async (c: any) => {
      const body = c.req.valid("json");
      const up = JSON.stringify(JSON.parse(body.json || "{}"));
      const existing = await db.select().from(settings).where(eq(settings.id, "settings")).limit(1);
      if (existing.length === 0) {
        await db.insert(settings).values({ id: "settings", json: up });
      } else {
        await db.update(settings).set({ json: up }).where(eq(settings.id, "settings"));
      }
      return c.json({ ok: true }, 200);
    },
  );
}
