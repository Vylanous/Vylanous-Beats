import type { Client } from "@libsql/client";

/**
 * Authoritative DDL for the app schema — tables AND indexes.
 *
 * Why this exists: the Docker/Fly runtime starts with `bun src/server.ts`, which
 * never runs `drizzle-kit push`, so a fresh database would otherwise have no
 * tables. This runs on every cold start, is idempotent, and fails loudly.
 *
 * Keep in sync with ./schema.ts. Drizzle remains the source of truth for types
 * and for `db:push` / `db:generate`; this is the runtime bootstrap only.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `create table if not exists "beats" (
    "id" text primary key not null,
    "title" text not null,
    "slug" text not null,
    "bpm" integer not null default 0,
    "musical_key" text not null default '',
    "genre" text not null default 'Hip-Hop',
    "mood" text not null default '',
    "tags" text not null default '',
    "artwork_url" text not null default '',
    "audio_url" text not null default '',
    "file_urls" text not null default '{}',
    "price_from" integer not null default 2400,
    "sold_exclusive" integer not null default 0,
    "featured" integer not null default 0,
    "published" integer not null default 1,
    "plays" integer not null default 0,
    "created_at" text not null default (CURRENT_TIMESTAMP)
  )`,
  `create unique index if not exists "beats_slug_idx" on "beats" ("slug")`,
  `create table if not exists "orders" (
    "id" text primary key not null,
    "customer_id" text not null default '',
    "email" text not null,
    "name" text not null default '',
    "status" text not null default 'pending',
    "total_cents" integer not null default 0,
    "currency" text not null default 'cad',
    "stripe_session_id" text not null default '',
    "download_token" text not null default '',
    "created_at" text not null default (CURRENT_TIMESTAMP),
    "paid_at" text
  )`,
  `create index if not exists "orders_status_idx" on "orders" ("status")`,
  `create index if not exists "orders_stripe_session_idx" on "orders" ("stripe_session_id")`,
  `create table if not exists "customers" (
    "id" text primary key not null,
    "email" text not null,
    "display_name" text not null default '',
    "password_hash" text not null,
    "marketing_opt_in" integer not null default 0,
    "email_verified" integer not null default 0,
    "email_verified_at" text,
    "created_at" text not null default (CURRENT_TIMESTAMP),
    "updated_at" text
  )`,
  `create unique index if not exists "customers_email_idx" on "customers" ("email")`,
  `create table if not exists "customer_email_verifications" (
    "id" text primary key not null,
    "customer_id" text not null,
    "token_hash" text not null,
    "expires_at" text not null,
    "created_at" text not null default (CURRENT_TIMESTAMP),
    "used_at" text
  )`,
  `create unique index if not exists "customer_email_verifications_token_hash_idx" on "customer_email_verifications" ("token_hash")`,
  `create index if not exists "customer_email_verifications_customer_idx" on "customer_email_verifications" ("customer_id")`,
  `create table if not exists "customer_sessions" (
    "id" text primary key not null,
    "customer_id" text not null,
    "token_hash" text not null,
    "expires_at" text not null,
    "created_at" text not null default (CURRENT_TIMESTAMP),
    "revoked_at" text
  )`,
  `create unique index if not exists "customer_sessions_token_hash_idx" on "customer_sessions" ("token_hash")`,
  `create index if not exists "customer_sessions_customer_idx" on "customer_sessions" ("customer_id")`,
  `create table if not exists "customer_entitlements" (
    "id" text primary key not null,
    "customer_id" text not null,
    "order_id" text not null,
    "order_item_id" text not null,
    "beat_id" text not null,
    "status" text not null default 'pending',
    "created_at" text not null default (CURRENT_TIMESTAMP),
    "activated_at" text,
    "revoked_at" text
  )`,
  `create unique index if not exists "customer_entitlements_order_item_idx" on "customer_entitlements" ("order_item_id")`,
  `create index if not exists "customer_entitlements_customer_idx" on "customer_entitlements" ("customer_id")`,
  `create index if not exists "customer_entitlements_order_idx" on "customer_entitlements" ("order_id")`,
  `create table if not exists "order_items" (
    "id" text primary key not null,
    "order_id" text not null,
    "beat_id" text not null,
    "beat_title" text not null,
    "license_tier" text not null,
    "license_name" text not null,
    "price_cents" integer not null default 0,
    "file_url" text not null default ''
  )`,
  `create index if not exists "order_items_order_id_idx" on "order_items" ("order_id")`,
  `create table if not exists "stripe_webhook_events" (
    "id" text primary key not null,
    "provider_event_id" text not null,
    "event_type" text not null,
    "checkout_session_id" text not null default '',
    "order_id" text not null default '',
    "status" text not null default 'processing',
    "last_error" text not null default '',
    "received_at" text not null default (CURRENT_TIMESTAMP),
    "processed_at" text
  )`,
  `create unique index if not exists "stripe_webhook_events_provider_event_id_idx" on "stripe_webhook_events" ("provider_event_id")`,
  `create index if not exists "stripe_webhook_events_order_idx" on "stripe_webhook_events" ("order_id")`,
  `create index if not exists "stripe_webhook_events_session_idx" on "stripe_webhook_events" ("checkout_session_id")`,
  `create table if not exists "order_deliveries" (
    "id" text primary key not null,
    "order_id" text not null,
    "status" text not null default 'pending',
    "attempts" integer not null default 0,
    "last_error" text not null default '',
    "sent_at" text,
    "created_at" text not null default (CURRENT_TIMESTAMP),
    "updated_at" text
  )`,
  `create unique index if not exists "order_deliveries_order_id_idx" on "order_deliveries" ("order_id")`,
  `create table if not exists "mobile_purchase_transactions" (
    "id" text primary key not null,
    "platform" text not null,
    "transaction_id" text not null,
    "product_id" text not null,
    "purchase_token" text not null default '',
    "beat_id" text not null,
    "license_tier" text not null,
    "buyer_email" text not null,
    "order_id" text not null default '',
    "status" text not null default 'pending',
    "store_environment" text not null default '',
    "verification_payload" text not null default '{}',
    "created_at" text not null default (CURRENT_TIMESTAMP),
    "verified_at" text,
    "fulfilled_at" text,
    "revoked_at" text
  )`,
  `create unique index if not exists "mobile_purchase_transactions_platform_transaction_idx" on "mobile_purchase_transactions" ("platform", "transaction_id")`,
  `create index if not exists "mobile_purchase_transactions_order_idx" on "mobile_purchase_transactions" ("order_id")`,
  `create index if not exists "mobile_purchase_transactions_buyer_idx" on "mobile_purchase_transactions" ("buyer_email")`,
  `create table if not exists "subscribers" (
    "id" text primary key not null,
    "email" text not null,
    "created_at" text not null default (CURRENT_TIMESTAMP)
  )`,
  `create table if not exists "settings" (
    "id" text primary key not null,
    "json" text not null default '{}',
    "created_at" text not null default (CURRENT_TIMESTAMP),
    "updated_at" text
  )`,
  `create table if not exists "email_events" (
    "id" text primary key not null,
    "provider_event_id" text not null,
    "provider_email_id" text not null default '',
    "event_type" text not null,
    "payload_json" text not null default '{}',
    "received_at" text not null default (CURRENT_TIMESTAMP)
  )`,
  `create unique index if not exists "email_events_provider_event_id_idx" on "email_events" ("provider_event_id")`,
  `create index if not exists "email_events_provider_email_id_idx" on "email_events" ("provider_email_id")`,
  `create table if not exists "inbound_emails" (
    "id" text primary key not null,
    "provider_event_id" text not null,
    "from_address" text not null default '',
    "to_json" text not null default '[]',
    "subject" text not null default '',
    "received_at" text not null,
    "status" text not null default 'unread',
    "created_at" text not null default (CURRENT_TIMESTAMP)
  )`,
  `create unique index if not exists "inbound_emails_provider_event_id_idx" on "inbound_emails" ("provider_event_id")`,
  `create index if not exists "inbound_emails_status_idx" on "inbound_emails" ("status")`,
  `create index if not exists "inbound_emails_received_at_idx" on "inbound_emails" ("received_at")`,
];

/** Applies SCHEMA_STATEMENTS in order. Throws if the database is unreachable. */
export async function ensureSchema(client: Client): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }
  // Existing installations predate customer email verification. SQLite has no
  // portable `ADD COLUMN IF NOT EXISTS`, so an already-applied migration is
  // deliberately ignored while other schema errors remain fatal.
  for (const statement of [
    `alter table "customers" add column "email_verified" integer not null default 0`,
    `alter table "customers" add column "email_verified_at" text`,
  ]) {
    try {
      await client.execute(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (!message.includes("duplicate column")) throw error;
    }
  }

  // Existing installations predate customer-owned orders. SQLite has no
  // portable `ADD COLUMN IF NOT EXISTS`, so an already-applied migration is
  // deliberately ignored while other schema errors remain fatal.
  try {
    await client.execute(`alter table "orders" add column "customer_id" text not null default ''`);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (!message.includes("duplicate column")) throw error;
  }
  await client.execute(
    `create index if not exists "orders_customer_idx" on "orders" ("customer_id")`,
  );
}
