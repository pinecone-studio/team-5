PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_beneefots` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`subsidy_percent` integer NOT NULL,
	`vendor_name` text,
	`requires_contract` integer DEFAULT false,
	`active_contract_id` text,
	`is_active` integer DEFAULT true
);
--> statement-breakpoint
INSERT INTO `__new_beneefots`("id", "name", "category", "subsidy_percent", "vendor_name", "requires_contract", "active_contract_id", "is_active")
SELECT
	"id",
	"name",
	NULL,
	"subsidy_percent",
	"vendor_name",
	COALESCE("requires_contract", 0),
	NULL,
	COALESCE("is_active", 1)
FROM `beneefots`;--> statement-breakpoint
DROP TABLE `beneefots`;--> statement-breakpoint
ALTER TABLE `__new_beneefots` RENAME TO `beneefots`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_eligibility_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`benefit_id` text NOT NULL,
	`value` text,
	`error_message` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`benefit_id`) REFERENCES `beneefots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_eligibility_rules`("id", "benefit_id", "value", "error_message", "priority", "is_active") SELECT "id", "benefit_id", "value", "error_message", "priority", "is_active" FROM `eligibility_rules`;--> statement-breakpoint
DROP TABLE `eligibility_rules`;--> statement-breakpoint
ALTER TABLE `__new_eligibility_rules` RENAME TO `eligibility_rules`;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `email` text;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `name_eng` text;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `role` text;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `department` text;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `responsibility_level` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `employment_status` text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `hire_date` text;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `okr_submitted` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `late_arrival_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `late_arrival_updated_at` text;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `employee_code` text;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `benefit_employee` ADD `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
UPDATE `benefit_employee`
SET
	`employment_status` = COALESCE(`employment_status`, `status`, 'active'),
	`okr_submitted` = COALESCE(`okr_submitted`, CASE WHEN `okr_status` IN ('submitted', 'success') THEN 1 ELSE 0 END),
	`late_arrival_count` = COALESCE(`late_arrival_count`, `lateCount`, 0),
	`late_arrival_updated_at` = CASE
		WHEN COALESCE(`late_arrival_count`, `lateCount`, 0) > 0
			THEN COALESCE(`late_arrival_updated_at`, `updated_at`)
		ELSE `late_arrival_updated_at`
	END;
