ALTER TABLE `benefits` ADD `active_contract_id` text REFERENCES contracts(id);--> statement-breakpoint
ALTER TABLE `contracts` DROP COLUMN `sha256_hash`;