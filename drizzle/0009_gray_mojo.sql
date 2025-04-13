ALTER TABLE "bookings" DROP CONSTRAINT "bookings_payment_session_id_unique";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "payment_session_id";