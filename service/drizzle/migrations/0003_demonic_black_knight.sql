CREATE TABLE `benefit_employee` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`status` text DEFAULT 'active',
	`okr_status` text,
	`lateCount` integer DEFAULT 0
);