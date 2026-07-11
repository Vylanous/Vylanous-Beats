import { z } from "zod";
import { router } from "hono";
import { requireAdmin } from "./lib/admin-auth";
import { getSettings, upsertSettings } from "./database/settings-utils";

const admin = router();

admin.get("/customization", requireAdmin, async (c) => {
  const s = await getSettings();
  return c.json({ settings: s }, 200);
});

admin.post(
  "/customization",
  requireAdmin,
  async (c) => {
    const data = await c.req.json().catch(() => null);
    if (!data) return c.json({ error: "invalid json" }, 400);
    try {
      const saved = await upsertSettings(data);
      return c.json({ settings: saved }, 200);
    } catch (e) {
      return c.json({ error: String(e) }, 500);
    }
  },
);

export default admin;
