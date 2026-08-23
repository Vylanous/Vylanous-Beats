import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { seedDatabase } from "./seed";
import { beatsRoutes } from "./routes/beats";
import { checkoutRoutes } from "./routes/checkout";
import { ordersRoutes } from "./routes/orders";
import { publicRoutes } from "./routes/public";
import { adminRoutes } from "./routes/admin";
import { fourthwallRoutes } from "./routes/fourthwall";
import { resendWebhookRoutes } from "./routes/resend-webhook";
import { adminEmailRoutes } from "./routes/admin-email";
import { mobilePurchaseRoutes } from "./routes/mobile-purchases";
import { customerPortalRoutes } from "./routes/customer-portal";
import { appUrl } from "./lib/util";
import { S3_CONFIGURED } from "./lib/s3";
import { stripe } from "./lib/stripe";

function allowedOrigins() {
  const configured = [appUrl(), process.env.CORS_ORIGINS || "", "https://www.vylanous.com"]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (process.env.NODE_ENV !== "production") {
    configured.push("http://localhost:3000", "http://localhost:5173");
  }
  return new Set(configured);
}

const permittedOrigins = allowedOrigins();

// Seed on cold start (idempotent)
seedDatabase().catch((e) => console.error("[seed] failed", e));

const app = new Hono()
  // Serve license PDFs explicitly before SPA fallback
  .use("/licenses/*", serveStatic({ root: "./public" }))
  .basePath("api")
  .use(
    cors({
      origin: (origin) => {
        const normalized = origin.replace(/\/$/, "");
        return permittedOrigins.has(normalized) ? origin : "";
      },
      credentials: true,
      exposeHeaders: ["set-auth-token"],
    }),
  )
  .get("/health", (c) =>
    c.json(
      {
        status: "ok",
        checks: {
          appUrlConfigured: Boolean(appUrl()),
          emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
          paymentsConfigured: Boolean(stripe),
          storageConfigured: S3_CONFIGURED,
        },
      },
      200,
    ),
  );

publicRoutes(app);
customerPortalRoutes(app);
beatsRoutes(app);
checkoutRoutes(app);
ordersRoutes(app);
adminRoutes(app);
fourthwallRoutes(app);
resendWebhookRoutes(app);
adminEmailRoutes(app);
mobilePurchaseRoutes(app);

export type AppType = typeof app;
export default app;
