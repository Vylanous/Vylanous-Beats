import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Beats catalog. Pricing is per-license-tier (see LICENSE_TIERS in shared config),
 * so a beat stores the base/lease price plus availability flags.
 */
export const beats = sqliteTable(
  "beats",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    bpm: integer("bpm").notNull().default(0),
    musicalKey: text("musical_key").notNull().default(""),
    genre: text("genre").notNull().default("Hip-Hop"),
    mood: text("mood").notNull().default(""),
    tags: text("tags").notNull().default(""), // comma separated
    artworkUrl: text("artwork_url").notNull().default(""),
    audioUrl: text("audio_url").notNull().default(""), // preview/stream url
    // delivery files per tier (urls). Stored as JSON string.
    fileUrls: text("file_urls").notNull().default("{}"),
    // base price for the cheapest paid tier, in cents (display "from")
    priceFrom: integer("price_from").notNull().default(2400),
    // is this beat sold exclusively already?
    soldExclusive: integer("sold_exclusive", { mode: "boolean" }).notNull().default(false),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    plays: integer("plays").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [uniqueIndex("beats_slug_idx").on(t.slug)],
);

/**
 * Orders — created when a customer initiates checkout.
 * status: pending -> paid -> delivered (or cancelled)
 */
export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().default(""),
    email: text("email").notNull(),
    name: text("name").notNull().default(""),
    status: text("status").notNull().default("pending"), // pending | paid | cancelled
    totalCents: integer("total_cents").notNull().default(0),
    currency: text("currency").notNull().default("cad"),
    stripeSessionId: text("stripe_session_id").notNull().default(""),
    // secure token used to access the download page
    downloadToken: text("download_token").notNull().default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    paidAt: text("paid_at"),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_customer_idx").on(t.customerId),
    index("orders_stripe_session_idx").on(t.stripeSessionId),
  ],
);

/** A customer account shared by the website and native mobile application. */
export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull().default(""),
    passwordHash: text("password_hash").notNull(),
    marketingOptIn: integer("marketing_opt_in", { mode: "boolean" }).notNull().default(false),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    emailVerifiedAt: text("email_verified_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at"),
  },
  (t) => [uniqueIndex("customers_email_idx").on(t.email)],
);

/** Revocable bearer-token sessions for customers on mobile and web. */
export const customerEmailVerifications = sqliteTable(
  "customer_email_verifications",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    usedAt: text("used_at"),
  },
  (t) => [
    uniqueIndex("customer_email_verifications_token_hash_idx").on(t.tokenHash),
    index("customer_email_verifications_customer_idx").on(t.customerId),
  ],
);

export const customerSessions = sqliteTable(
  "customer_sessions",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    revokedAt: text("revoked_at"),
  },
  (t) => [
    uniqueIndex("customer_sessions_token_hash_idx").on(t.tokenHash),
    index("customer_sessions_customer_idx").on(t.customerId),
  ],
);

/** A customer-owned, server-authorized right to download a purchased license. */
export const customerEntitlements = sqliteTable(
  "customer_entitlements",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull(),
    orderId: text("order_id").notNull(),
    orderItemId: text("order_item_id").notNull(),
    beatId: text("beat_id").notNull(),
    status: text("status").notNull().default("pending"), // pending | active | revoked
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    activatedAt: text("activated_at"),
    revokedAt: text("revoked_at"),
  },
  (t) => [
    uniqueIndex("customer_entitlements_order_item_idx").on(t.orderItemId),
    index("customer_entitlements_customer_idx").on(t.customerId),
    index("customer_entitlements_order_idx").on(t.orderId),
  ],
);

/**
 * Line items for an order — one per beat+license tier purchased.
 */
export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    beatId: text("beat_id").notNull(),
    beatTitle: text("beat_title").notNull(),
    licenseTier: text("license_tier").notNull(), // free | mp3 | wav | unlimited | exclusive
    licenseName: text("license_name").notNull(),
    priceCents: integer("price_cents").notNull().default(0),
    fileUrl: text("file_url").notNull().default(""),
  },
  (t) => [index("order_items_order_id_idx").on(t.orderId)],
);

/** Signed Stripe events retained for webhook replay protection and support audit. */
export const stripeWebhookEvents = sqliteTable(
  "stripe_webhook_events",
  {
    id: text("id").primaryKey(),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    checkoutSessionId: text("checkout_session_id").notNull().default(""),
    orderId: text("order_id").notNull().default(""),
    status: text("status").notNull().default("processing"), // processing | fulfilled | ignored | failed
    lastError: text("last_error").notNull().default(""),
    receivedAt: text("received_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    processedAt: text("processed_at"),
  },
  (t) => [
    uniqueIndex("stripe_webhook_events_provider_event_id_idx").on(t.providerEventId),
    index("stripe_webhook_events_order_idx").on(t.orderId),
    index("stripe_webhook_events_session_idx").on(t.checkoutSessionId),
  ],
);

/**
 * Durable fixed-window request counters for public abuse controls. Identifiers
 * are HMAC hashes rather than raw IP addresses or email addresses, and rows are
 * retained only briefly so counters can be shared safely across Render instances.
 */
export const rateLimitWindows = sqliteTable(
  "rate_limit_windows",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    subjectHash: text("subject_hash").notNull(),
    windowStart: integer("window_start").notNull(),
    hits: integer("hits").notNull().default(0),
    expiresAt: integer("expires_at").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at"),
  },
  (t) => [
    uniqueIndex("rate_limit_windows_scope_subject_window_idx").on(
      t.scope,
      t.subjectHash,
      t.windowStart,
    ),
    index("rate_limit_windows_expires_at_idx").on(t.expiresAt),
  ],
);

/** Short-lived, revocable sessions for privileged Admin Studio access. */
export const adminSessions = sqliteTable(
  "admin_sessions",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at").notNull(),
    idleExpiresAt: integer("idle_expires_at").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    lastSeenAt: text("last_seen_at"),
    revokedAt: text("revoked_at"),
  },
  (t) => [
    uniqueIndex("admin_sessions_token_hash_idx").on(t.tokenHash),
    index("admin_sessions_expiry_idx").on(t.expiresAt, t.idleExpiresAt),
  ],
);

/** A short-lived customer request record that makes checkout retries idempotent. */
export const checkoutIdempotencyKeys = sqliteTable(
  "checkout_idempotency_keys",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull(),
    requestKey: text("request_key").notNull(),
    cartHash: text("cart_hash").notNull(),
    orderId: text("order_id").notNull(),
    state: text("state").notNull().default("processing"),
    expiresAt: integer("expires_at").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at"),
  },
  (t) => [
    uniqueIndex("checkout_idempotency_customer_request_idx").on(t.customerId, t.requestKey),
    index("checkout_idempotency_expiry_idx").on(t.expiresAt),
  ],
);

/** Durable delivery state keeps payment fulfillment and email retries separate. */
export const orderDeliveries = sqliteTable(
  "order_deliveries",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    status: text("status").notNull().default("pending"), // pending | sent | failed
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error").notNull().default(""),
    sentAt: text("sent_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at"),
  },
  (t) => [uniqueIndex("order_deliveries_order_id_idx").on(t.orderId)],
);

/**
 * Privacy-conscious, aggregated engagement metrics for Page Builder Published
 * Beats blocks. No visitor identifiers, IP addresses, or raw event payloads are
 * stored; each row is a daily counter for one page, block, beat, and event type.
 */
export const publishedBeatBlockMetrics = sqliteTable(
  "published_beat_block_metrics",
  {
    id: text("id").primaryKey(),
    pageId: text("page_id").notNull(),
    blockId: text("block_id").notNull(),
    beatId: text("beat_id").notNull(),
    eventType: text("event_type").notNull(), // card_click | preview_play
    day: text("day").notNull(), // UTC ISO date, e.g. 2026-08-23
    count: integer("count").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at"),
  },
  (t) => [
    uniqueIndex("published_beat_block_metrics_daily_unique_idx").on(
      t.pageId,
      t.blockId,
      t.beatId,
      t.eventType,
      t.day,
    ),
    index("published_beat_block_metrics_page_day_idx").on(t.pageId, t.day),
    index("published_beat_block_metrics_beat_day_idx").on(t.beatId, t.day),
  ],
);

/** Monthly roll-ups retain historical interaction trends after daily rows expire. */
export const publishedBeatBlockMonthlyMetrics = sqliteTable(
  "published_beat_block_monthly_metrics",
  {
    id: text("id").primaryKey(),
    pageId: text("page_id").notNull(),
    blockId: text("block_id").notNull(),
    beatId: text("beat_id").notNull(),
    eventType: text("event_type").notNull(),
    month: text("month").notNull(),
    count: integer("count").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at"),
  },
  (t) => [
    uniqueIndex("published_beat_block_monthly_metrics_unique_idx").on(
      t.pageId,
      t.blockId,
      t.beatId,
      t.eventType,
      t.month,
    ),
    index("published_beat_block_monthly_metrics_month_idx").on(t.month),
  ],
);

/**
 * Newsletter / fan list signups.
 */
/**
 * Mobile purchase transactions — durable, idempotent record of store-native
 * purchases. A verified transaction may fulfill exactly one Vylanous order.
 */
export const mobilePurchaseTransactions = sqliteTable(
  "mobile_purchase_transactions",
  {
    id: text("id").primaryKey(),
    platform: text("platform").notNull(), // apple | google
    transactionId: text("transaction_id").notNull(),
    productId: text("product_id").notNull(),
    purchaseToken: text("purchase_token").notNull().default(""),
    beatId: text("beat_id").notNull(),
    licenseTier: text("license_tier").notNull(),
    buyerEmail: text("buyer_email").notNull(),
    orderId: text("order_id").notNull().default(""),
    status: text("status").notNull().default("pending"), // pending | verified | fulfilled | revoked | failed
    storeEnvironment: text("store_environment").notNull().default(""),
    verificationPayload: text("verification_payload").notNull().default("{}"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    verifiedAt: text("verified_at"),
    fulfilledAt: text("fulfilled_at"),
    revokedAt: text("revoked_at"),
  },
  (t) => [
    uniqueIndex("mobile_purchase_transactions_platform_transaction_idx").on(
      t.platform,
      t.transactionId,
    ),
    index("mobile_purchase_transactions_order_idx").on(t.orderId),
    index("mobile_purchase_transactions_buyer_idx").on(t.buyerEmail),
  ],
);

export const subscribers = sqliteTable("subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// New settings table
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  json: text("json").notNull().default("{}"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at"),
});

/** Verified Resend webhook deliveries retained for email audit and status visibility. */
export const emailEvents = sqliteTable(
  "email_events",
  {
    id: text("id").primaryKey(),
    providerEventId: text("provider_event_id").notNull(),
    providerEmailId: text("provider_email_id").notNull().default(""),
    eventType: text("event_type").notNull(),
    payloadJson: text("payload_json").notNull().default("{}"),
    receivedAt: text("received_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [
    uniqueIndex("email_events_provider_event_id_idx").on(t.providerEventId),
    index("email_events_provider_email_id_idx").on(t.providerEmailId),
  ],
);

/** Metadata for inbound emails. Full body content is retrieved on demand from Resend. */
export const inboundEmails = sqliteTable(
  "inbound_emails",
  {
    id: text("id").primaryKey(),
    providerEventId: text("provider_event_id").notNull(),
    fromAddress: text("from_address").notNull().default(""),
    toJson: text("to_json").notNull().default("[]"),
    subject: text("subject").notNull().default(""),
    receivedAt: text("received_at").notNull(),
    status: text("status").notNull().default("unread"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [
    uniqueIndex("inbound_emails_provider_event_id_idx").on(t.providerEventId),
    index("inbound_emails_status_idx").on(t.status),
    index("inbound_emails_received_at_idx").on(t.receivedAt),
  ],
);

export type Beat = typeof beats.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type OrderDelivery = typeof orderDeliveries.$inferSelect;
export type PublishedBeatBlockMetric = typeof publishedBeatBlockMetrics.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type CustomerSession = typeof customerSessions.$inferSelect;
export type CustomerEntitlement = typeof customerEntitlements.$inferSelect;
export type MobilePurchaseTransaction = typeof mobilePurchaseTransactions.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
export type EmailEvent = typeof emailEvents.$inferSelect;
export type InboundEmail = typeof inboundEmails.$inferSelect;
