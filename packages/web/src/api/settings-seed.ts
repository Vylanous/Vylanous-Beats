import { db } from "./database";
import { settings } from "./database/settings";

const DEFAULT = {
  theme: { primary: "#7c3aed", background: "#0b0b0b", text: "#e6e6e6" },
  layout: { sidebar: "left", containerWidth: "max-w-5xl" },
  typography: { fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", baseSize: 16 },
  assets: { logoUrl: "", faviconUrl: "", heroUrl: "" },
  dashboard: { showRevenue: true, cardStyle: "default" },
  customCss: "",
};

export async function seedSettings() {
  const existing = await db.select().from(settings);
  if (existing.length > 0) return;
  await db.insert(settings).values({ id: "site", data: JSON.stringify(DEFAULT), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
}
