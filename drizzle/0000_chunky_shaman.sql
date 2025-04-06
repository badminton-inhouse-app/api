CREATE TYPE "public"."experience" AS ENUM('U_1_M', 'U_3_M', 'U_6_M', 'U_1_YEAR', 'U_2_YEARS', 'U_3_YEARS', 'O_3_YEARS');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TABLE "centers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"district" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"phone_no" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "courts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"center_id" uuid,
	"court_no" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "courts_court_no_unique" UNIQUE("court_no")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
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
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "courts" ADD CONSTRAINT "courts_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;