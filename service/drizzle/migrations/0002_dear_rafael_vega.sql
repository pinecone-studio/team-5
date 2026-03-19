PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`benefit_id` text NOT NULL,
	`vendor_name` text NOT NULL,
	`version` text NOT NULL,
	`r2_object_key` text NOT NULL,
	`sha256_hash` text NOT NULL,
	`effective_date` text,
	`expiry_date` text,
	`signatures_json` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true,
	FOREIGN KEY (`benefit_id`) REFERENCES `benefits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_contracts`("id", "benefit_id", "vendor_name", "version", "r2_object_key", "sha256_hash", "effective_date", "expiry_date", "signatures_json", "is_active") SELECT "id", "benefit_id", "vendor_name", "version", "r2_object_key", "sha256_hash", "effective_date", "expiry_date", "signatures_json", "is_active" FROM `contracts`;--> statement-breakpoint
DROP TABLE `contracts`;--> statement-breakpoint
ALTER TABLE `__new_contracts` RENAME TO `contracts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;