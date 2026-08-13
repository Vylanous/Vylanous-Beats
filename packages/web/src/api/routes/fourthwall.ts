import { z } from "zod";
import type { Hono } from "hono";
import { loadSettings } from "../lib/settings";

const FOURTHWALL_API = "https://storefront-api.fourthwall.com/v1";
const DEFAULT_SHOP_DOMAIN = "vylanous-shop.fourthwall.com";
const collectionSchema = z.string().regex(/^[a-z0-9-]+$/i);
const checkoutSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  currency: z.string().length(3).default("USD"),
});

function storefrontToken() {
  return process.env.FOURTHWALL_STOREFRONT_TOKEN;
}

function shopDomain() {
  return process.env.FOURTHWALL_SHOP_DOMAIN || DEFAULT_SHOP_DOMAIN;
}

export function fourthwallRoutes(app: Hono) {
  app.get("/fourthwall/status", (c) => {
    return c.json({ configured: Boolean(storefrontToken()), shopDomain: shopDomain() }, 200);
  });

  app.get("/fourthwall/collections/:handle/products", async (c) => {
    const handle = collectionSchema.safeParse(c.req.param("handle"));
    if (!handle.success) return c.json({ error: "invalid_collection" }, 400);
    const token = storefrontToken();
    if (!token) {
      return c.json(
        {
          error: "fourthwall_not_configured",
          message: "Merch catalog is not configured yet.",
        },
        503,
      );
    }

    const source = new URL(
      `${FOURTHWALL_API}/collections/${encodeURIComponent(handle.data)}/products`,
    );
    source.searchParams.set("storefront_token", token);
    source.searchParams.set("currency", c.req.query("currency") || "USD");
    source.searchParams.set("page", c.req.query("page") || "0");
    source.searchParams.set("size", c.req.query("size") || "24");

    const response = await fetch(source, { headers: { Accept: "application/json" } });
    const data = await response.json();
    if (!response.ok) return c.json(data, response.status as 400 | 401 | 404 | 500);
    c.header("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    return c.json(data, 200);
  });

  app.get("/fourthwall/checkout", async (c) => {
    const parsed = checkoutSchema.safeParse(c.req.query());
    if (!parsed.success) return c.json({ error: "invalid_checkout_item" }, 400);
    const params = new URLSearchParams({
      products: `${parsed.data.variantId}:${parsed.data.quantity}`,
      currency: parsed.data.currency.toUpperCase(),
      cart_origin: "vylanous-beats",
    });
    const settings = await loadSettings();
    const configuredDomain = settings.fourthwall.shopDomain || shopDomain();
    return c.redirect(`https://${configuredDomain}/cart/checkout?${params.toString()}`, 302);
  });
}
