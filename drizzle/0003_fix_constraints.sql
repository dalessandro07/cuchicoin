CREATE TABLE `transactions_v2` (
  `id` text PRIMARY KEY NOT NULL,
  `home_id` text NOT NULL,
  `member_id` text NOT NULL DEFAULT '',
  `category_id` text DEFAULT '',
  `type` text NOT NULL,
  `amount` integer NOT NULL,
  `description` text NOT NULL DEFAULT '',
  `date` integer DEFAULT 0,
  `created_at` integer NOT NULL DEFAULT (unixepoch()),
  `updated_at` integer NOT NULL DEFAULT 0,
  `created_by` text NOT NULL DEFAULT ''
);--> statement-breakpoint
INSERT INTO `transactions_v2` (id, home_id, member_id, category_id, type, amount, description, date, created_at, updated_at, created_by) SELECT id, home_id, member_id, category_id, type, amount, description, date, created_at, updated_at, created_by FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `transactions_v2` RENAME TO `transactions`;--> statement-breakpoint
CREATE INDEX `idx_transactions_home_created` ON `transactions` (`home_id`, `created_at`);
