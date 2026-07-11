import { z } from "zod";
import { db } from "./database";
import { settings } from "./database/settings";

export async function getSettings() {
  const rows = await db.select().from(settings).where(settings.id.eq("site"));
  if (rows.length === 0) return null;
  try {
    return JSON.parse(rows[0].data as string);
  } catch {
    return null;
  }
}

export async function upsertSettings(data: unknown) {
  // basic validation: ensure it's an object
  const schema = z.object({}).passthrough();
  const parsed = schema.parse(data);
  const now = new Date().toISOString();

  const existing = await db.select().from(settings).where(settings.id.eq("site"));
  if (existing.length === 0) {
    await db.insert(settings).values({ id: "site", data: JSON.stringify(parsed), createdAt: now, updatedAt: now });
  } else {
    await db.update(settings).set({ data: JSON.stringify(parsed), updatedAt: now }).where(settings.id.eq("site"));
  }
  return parsed;
}
