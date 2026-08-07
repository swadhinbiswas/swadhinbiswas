ALTER TABLE `projects` ADD `slug` text NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `category` text DEFAULT 'data-engineering';--> statement-breakpoint
ALTER TABLE `projects` ADD `tech_stack` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `projects` ADD `demo_url` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `documentation` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `metrics` text DEFAULT '{}';--> statement-breakpoint
ALTER TABLE `projects` ADD `gallery` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `projects` ADD `team_size` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `duration` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `role` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `challenges` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `outcomes` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `lessons_learned` text;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);