CREATE TYPE "public"."voucher_status" AS ENUM('CLAIMED', 'USED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "use_vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"voucher_id" uuid,
	"status" "voucher_status" DEFAULT 'CLAIMED' NOT NULL,
	"claimed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "use_vouchers" ADD CONSTRAINT "use_vouchers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "use_vouchers" ADD CONSTRAINT "use_vouchers_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;