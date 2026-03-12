PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_employee` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text NOT NULL,
	`department` text NOT NULL,
	`responsibility_level` integer NOT NULL,
	`status` text DEFAULT 'active',
	`hire_date` text NOT NULL,
	`okr_submitted` integer DEFAULT 0,
	`lateCount` integer DEFAULT 0,
	`lateCount_updated_at` text,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
INSERT INTO `__new_employee`("id", "email", "full_name", "role", "department", "responsibility_level", "status", "hire_date", "okr_submitted", "lateCount", "lateCount_updated_at", "createdAt", "updatedAt") SELECT "id", "email", "full_name", "role", "department", "responsibility_level", "status", "hire_date", "okr_submitted", "lateCount", "lateCount_updated_at", "createdAt", "updatedAt" FROM `employee`;--> statement-breakpoint
DROP TABLE `employee`;--> statement-breakpoint
ALTER TABLE `__new_employee` RENAME TO `employee`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `employee_email_unique` ON `employee` (`email`);--> statement-breakpoint
CREATE TABLE `__new_eligibility_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`benefit_id` text NOT NULL,
	`value` text NOT NULL,
	`error_message` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`benefit_id`) REFERENCES `benefits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_eligibility_rules`("id", "benefit_id", "value", "error_message", "is_active") SELECT "id", "benefit_id", "value", "error_message", "is_active" FROM `eligibility_rules`;--> statement-breakpoint
DROP TABLE `eligibility_rules`;--> statement-breakpoint
ALTER TABLE `__new_eligibility_rules` RENAME TO `eligibility_rules`;