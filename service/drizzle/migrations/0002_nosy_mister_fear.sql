CREATE TABLE `benefit_employee` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`status` text DEFAULT 'active',
	`okr_status` text,
	`lateCount` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `benefit_eligibility` (
	`employee_id` text NOT NULL,
	`benefit_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`rule_evaluation_json` text NOT NULL,
	`computed_at` text NOT NULL,
	`override_by` text,
	`override_reason` text,
	`override_expires_at` text,
	PRIMARY KEY(`employee_id`, `benefit_id`),
	FOREIGN KEY (`employee_id`) REFERENCES `benefit_employee`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`benefit_id`) REFERENCES `beneefots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`override_by`) REFERENCES `benefit_employee`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `benefit_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`benefit_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`contract_version_accepted` text,
	`contract_accepted_at` text,
	`reviewed_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `benefit_employee`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`benefit_id`) REFERENCES `beneefots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `benefit_employee`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `beneefots` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subsidy_percent` integer NOT NULL,
	`vendor_name` text,
	`requires_contract` integer,
	`is_active` integer
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`benefit_id` text NOT NULL,
	`vendor_name` text NOT NULL,
	`version` text NOT NULL,
	`r2_object_key` text NOT NULL,
	`sha256_hash` text NOT NULL,
	`effective_date` text,
	`expiry_date` text,
	`is_active` integer DEFAULT true,
	FOREIGN KEY (`benefit_id`) REFERENCES `beneefots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `eligibility_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`benefit_id` text NOT NULL,
	`value` text,
	`error_message` text NOT NULL,
	`priority` integer NOT NULL,
	`is_active` integer NOT NULL,
	FOREIGN KEY (`benefit_id`) REFERENCES `beneefots`(`id`) ON UPDATE no action ON DELETE no action
);
