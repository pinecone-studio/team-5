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
	FOREIGN KEY (`benefit_id`) REFERENCES `beneefots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`performed_by_employee_id`) REFERENCES `benefit_employee`(`id`) ON UPDATE no action ON DELETE no action
);
