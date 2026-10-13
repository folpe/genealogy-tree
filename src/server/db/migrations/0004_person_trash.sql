ALTER TABLE "persons" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "deleted_by" text;