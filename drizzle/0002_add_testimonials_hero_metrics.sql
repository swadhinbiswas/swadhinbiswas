CREATE TABLE `hero_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`sub` text NOT NULL,
	`order` integer DEFAULT 0,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quote` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`order` integer DEFAULT 0,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
ALTER TABLE `skills` ADD `description` text;--> statement-breakpoint
ALTER TABLE `skills` ADD `used_in` text;--> statement-breakpoint
ALTER TABLE `skills` ADD `tier` text DEFAULT 'core';--> statement-breakpoint
ALTER TABLE `support_options` ADD `order` integer DEFAULT 0;