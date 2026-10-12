CREATE TABLE "admin_record_views" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"person_id" text NOT NULL,
	"viewed_on" date NOT NULL,
	"first_viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_record_views_once_a_day" UNIQUE("user_id","person_id","viewed_on")
);
--> statement-breakpoint
ALTER TABLE "admin_record_views" ADD CONSTRAINT "admin_record_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_record_views" ADD CONSTRAINT "admin_record_views_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;