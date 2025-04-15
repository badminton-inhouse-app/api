ALTER TABLE "courts" DROP CONSTRAINT "courts_court_no_unique";--> statement-breakpoint
ALTER TABLE "courts" ALTER COLUMN "center_id" SET NOT NULL;