CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."court_status" AS ENUM('AVAILABLE', 'MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."experience" AS ENUM('U_1_M', 'U_3_M', 'U_6_M', 'U_1_YEAR', 'U_2_YEARS', 'U_3_YEARS', 'O_3_YEARS');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('MOMO', 'BANK_TRANSFER', 'CASH', 'VISA', 'MASTER_CARD', 'PAYPAL', 'INTERNET_BANKING');--> statement-breakpoint
CREATE TYPE "public"."user_point_type" AS ENUM('BOOKING', 'ADDTIONAL_SPENDING');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "centers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"district" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"phone_no" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "courts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid,
	"court_no" integer NOT NULL,
	"status" "court_status" DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "courts_court_no_unique" UNIQUE("court_no")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"user_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"due_date" date NOT NULL,
	"issued_date" date DEFAULT now() NOT NULL,
	"paid_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"transaction_id" varchar(100) NOT NULL,
	"amount_paid" numeric(10, 2) NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"points" integer DEFAULT 0 NOT NULL,
	"type" "user_point_type" DEFAULT 'BOOKING' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"user_id" uuid,
	"gender" "gender" DEFAULT 'MALE' NOT NULL,
	"phone" text,
	"avatar" text,
	"birthday" timestamp,
	"experience" "experience" DEFAULT 'U_1_M' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_courts_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."courts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courts" ADD CONSTRAINT "courts_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_number_invoices_invoice_number_fk" FOREIGN KEY ("invoice_number") REFERENCES "public"."invoices"("invoice_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;