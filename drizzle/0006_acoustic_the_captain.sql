ALTER TYPE "public"."payment_method" ADD VALUE 'STRIPE';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "payment_session_id" varchar;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_payment_session_id_unique" UNIQUE("payment_session_id");