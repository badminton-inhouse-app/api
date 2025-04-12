CREATE TYPE "public"."discount_type" AS ENUM('FIXED', 'PERCENTAGE');--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"required_points" integer DEFAULT 0 NOT NULL,
	"discount_type" "discount_type" DEFAULT 'FIXED' NOT NULL,
	"discount_value" numeric DEFAULT '0' NOT NULL,
	"valid_from" timestamp NOT NULL,
	"valid_to" timestamp NOT NULL,
	"updated_at" timestamp
);
