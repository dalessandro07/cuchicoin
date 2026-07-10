ALTER TABLE `transactions` ADD `updated_at` integer NOT NULL DEFAULT 0;--> statement-breakpoint
CREATE INDEX `idx_transactions_home_created` ON `transactions` (`home_id`,`created_at`);
