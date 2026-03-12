PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_benefits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subsidy_percent` integer NOT NULL,
	`vendor_name` text,
	`requires_contract` integer,
	`is_active` integer
);
--> statement-breakpoint
INSERT INTO `__new_benefits`("id", "name", "subsidy_percent", "vendor_name", "requires_contract", "is_active") SELECT "id", "name", "subsidy_percent", "vendor_name", "requires_contract", "is_active" FROM `benefits`;--> statement-breakpoint
DROP TABLE `benefits`;--> statement-breakpoint
ALTER TABLE `__new_benefits` RENAME TO `benefits`;--> statement-breakpoint
PRAGMA foreign_keys=ON;