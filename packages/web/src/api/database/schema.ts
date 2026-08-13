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
  (t) => [index("orders_status_idx").on(t.status)],
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
export type MobilePurchaseTransaction = typeof mobilePurchaseTransactions.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
export type EmailEvent = typeof emailEvents.$inferSelect;
export type InboundEmail = typeof inboundEmails.$inferSelect;
