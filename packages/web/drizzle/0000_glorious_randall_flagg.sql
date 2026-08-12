CREATE TABLE `beats` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`bpm` integer DEFAULT 0 NOT NULL,
	`musical_key` text DEFAULT '' NOT NULL,
	`genre` text DEFAULT 'Hip-Hop' NOT NULL,
	`mood` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`artwork_url` text DEFAULT '' NOT NULL,
	`audio_url` text DEFAULT '' NOT NULL,
	`file_urls` text DEFAULT '{}' NOT NULL,
	`price_from` integer DEFAULT 2400 NOT NULL,
	`sold_exclusive` integer DEFAULT false NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`plays` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`beat_id` text NOT NULL,
	`beat_title` text NOT NULL,
	`license_tier` text NOT NULL,
	`license_name` text NOT NULL,
	`price_cents` integer DEFAULT 0 NOT NULL,
	`file_url` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'cad' NOT NULL,
	`stripe_session_id` text DEFAULT '' NOT NULL,
	`download_token` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`paid_at` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
