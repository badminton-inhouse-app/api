ALTER TABLE "centers" ADD COLUMN "lat" numeric(9, 6) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "centers" ADD COLUMN "lng" numeric(9, 6) DEFAULT '0' NOT NULL;