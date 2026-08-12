import { createClient } from "@libsql/client";

/**
 * Creates the app schema (tables + indexes) in a fresh test database.
 * Mirrors src/api/database/schema.ts — keep in sync when the schema changes.
 * Needed because the runtime relies on `drizzle-kit push` (npm start) to
 * create tables; tests get a brand-new temp file DB with nothing in it.
 */
export async function createTestSchema(url: string) {
  const client = createClient({ url });
  const statements = [
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
  ];
  for (const sql of statements) await client.execute(sql);
  client.close();
}
