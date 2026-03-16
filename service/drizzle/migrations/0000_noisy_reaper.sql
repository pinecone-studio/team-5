CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text,
	`benefit_id` text,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`performed_by_employee_id` text,
	`performed_by_label` text NOT NULL,
	`metadata_json` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `benefit_employee`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`benefit_id`) REFERENCES `benefits`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`performed_by_employee_id`) REFERENCES `benefit_employee`(`id`) ON UPDATE no action ON DELETE no action
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
	FOREIGN KEY (`benefit_id`) REFERENCES `benefits`(`id`) ON UPDATE no action ON DELETE no action,
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
	FOREIGN KEY (`benefit_id`) REFERENCES `benefits`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `benefit_employee`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `benefits` (
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
	FOREIGN KEY (`benefit_id`) REFERENCES `benefits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `eligibility_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`benefit_id` text NOT NULL,
	`rule_type` text NOT NULL,
	`operator` text NOT NULL,
	`value` text,
	`error_message` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`benefit_id`) REFERENCES `benefits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `benefit_employee` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text,
	`name_eng` text,
	`role` text,
	`department` text,
	`responsibility_level` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`employment_status` text DEFAULT 'active',
	`hire_date` text,
	`okr_status` text,
	`okr_submitted` integer DEFAULT false,
	`lateCount` integer DEFAULT 0,
	`late_arrival_count` integer DEFAULT 0,
	`late_arrival_updated_at` text,
	`employee_code` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
