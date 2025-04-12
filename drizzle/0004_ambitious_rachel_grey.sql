ALTER TABLE "use_vouchers" RENAME TO "user_vouchers";--> statement-breakpoint
ALTER TABLE "user_vouchers" DROP CONSTRAINT "use_vouchers_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_vouchers" DROP CONSTRAINT "use_vouchers_voucher_id_vouchers_id_fk";
--> statement-breakpoint
ALTER TABLE "user_vouchers" ADD CONSTRAINT "user_vouchers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vouchers" ADD CONSTRAINT "user_vouchers_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;