import { Hono } from "hono";
import { cors } from "hono/cors";
import { seedDatabase } from "./seed";
import { beatsRoutes } from "./routes/beats";
import { checkoutRoutes } from "./routes/checkout";
import { ordersRoutes } from "./routes/orders";
import { publicRoutes } from "./routes/public";
import { adminRoutes } from "./routes/admin";
import { webhookRoutes } from "./routes/webhooks";

// Seed on cold start (idempotent)
seedDatabase().catch((e) => console.error("[seed] failed", e));

const app = new Hono()
  .basePath("api")
  .use(
    cors({
      origin: (origin) => origin ?? "*",
      credentials: true,
      exposeHeaders: ["set-auth-token"],
    }),
  )
  .get("/health", (c) => c.json({ status: "ok" }, 200));

publicRoutes(app);
beatsRoutes(app);
checkoutRoutes(app);
ordersRoutes(app);
adminRoutes(app);
webhookRoutes(app);

export type AppType = typeof app;
export default app;
