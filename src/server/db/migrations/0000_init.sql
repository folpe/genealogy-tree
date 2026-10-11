CREATE TYPE "public"."date_precision" AS ENUM('exacte', 'mois', 'annee', 'vers', 'avant', 'apres', 'entre');--> statement-breakpoint
CREATE TYPE "public"."event_kind" AS ENUM('naissance', 'deces', 'bapteme', 'inhumation', 'demenagement', 'autre');--> statement-breakpoint
CREATE TYPE "public"."filiation_kind" AS ENUM('biologique', 'adoptive', 'a_eleve', 'inconnue');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('homme', 'femme', 'autre', 'inconnu');--> statement-breakpoint
CREATE TYPE "public"."geocoder" AS ENUM('ban', 'nominatim', 'manuel');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('photo', 'document', 'audio', 'video');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('acte', 'livret', 'photo', 'temoignage', 'autre');--> statement-breakpoint
CREATE TYPE "public"."union_end_reason" AS ENUM('deces', 'divorce', 'separation');--> statement-breakpoint
CREATE TYPE "public"."union_kind" AS ENUM('mariage', 'pacs', 'union_libre', 'inconnu');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('famille', 'cercle');--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"kind" "event_kind" NOT NULL,
	"date_precision" date_precision,
	"date_value" date,
	"date_value_end" date,
	"place_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_date_complete" CHECK (("events"."date_precision" is null) = ("events"."date_value" is null)),
	CONSTRAINT "events_date_range" CHECK (("events"."date_value_end" is not null) = ("events"."date_precision" is not distinct from 'entre')),
	CONSTRAINT "events_date_order" CHECK ("events"."date_value_end" is null or "events"."date_value_end" >= "events"."date_value")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "media_kind" NOT NULL,
	"pathname" text NOT NULL,
	"sha256" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"blur_data_url" text,
	"caption" text,
	"origin_url" text,
	"legacy_notion_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_sha256_unique" UNIQUE("sha256")
);
--> statement-breakpoint
CREATE TABLE "media_persons" (
	"media_id" text NOT NULL,
	"person_id" text NOT NULL,
	CONSTRAINT "media_persons_media_id_person_id_pk" PRIMARY KEY("media_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "parent_child" (
	"parent_id" text NOT NULL,
	"child_id" text NOT NULL,
	"kind" "filiation_kind" DEFAULT 'biologique' NOT NULL,
	"union_id" text,
	CONSTRAINT "parent_child_parent_id_child_id_pk" PRIMARY KEY("parent_id","child_id"),
	CONSTRAINT "parent_child_distinct" CHECK ("parent_child"."parent_id" <> "parent_child"."child_id")
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"birth_name" text,
	"gender" "gender" DEFAULT 'inconnu' NOT NULL,
	"visibility" "visibility" DEFAULT 'famille' NOT NULL,
	"is_living_override" boolean,
	"notes" text,
	"photo_media_id" text,
	"legacy_notion_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "persons_legacy_notion_id_unique" UNIQUE("legacy_notion_id")
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"normalized_label" text NOT NULL,
	"city" text,
	"postcode" text,
	"region" text,
	"country" text,
	"lat" double precision,
	"lng" double precision,
	"geocoder" "geocoder",
	"geocode_score" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "places_normalized_label_unique" UNIQUE("normalized_label")
);
--> statement-breakpoint
CREATE TABLE "residences" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"place_id" text NOT NULL,
	"start_precision" date_precision,
	"start_value" date,
	"start_value_end" date,
	"end_precision" date_precision,
	"end_value" date,
	"end_value_end" date,
	CONSTRAINT "residences_start_complete" CHECK (("residences"."start_precision" is null) = ("residences"."start_value" is null)),
	CONSTRAINT "residences_start_range" CHECK (("residences"."start_value_end" is not null) = ("residences"."start_precision" is not distinct from 'entre')),
	CONSTRAINT "residences_start_order" CHECK ("residences"."start_value_end" is null or "residences"."start_value_end" >= "residences"."start_value"),
	CONSTRAINT "residences_end_complete" CHECK (("residences"."end_precision" is null) = ("residences"."end_value" is null)),
	CONSTRAINT "residences_end_range" CHECK (("residences"."end_value_end" is not null) = ("residences"."end_precision" is not distinct from 'entre')),
	CONSTRAINT "residences_end_order" CHECK ("residences"."end_value_end" is null or "residences"."end_value_end" >= "residences"."end_value")
);
--> statement-breakpoint
CREATE TABLE "sourced_facts" (
	"person_id" text NOT NULL,
	"field" text NOT NULL,
	"source_id" text,
	CONSTRAINT "sourced_facts_person_id_field_pk" PRIMARY KEY("person_id","field")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "source_kind" NOT NULL,
	"description" text,
	"media_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unions" (
	"id" text PRIMARY KEY NOT NULL,
	"partner_a_id" text NOT NULL,
	"partner_b_id" text,
	"kind" "union_kind" DEFAULT 'inconnu' NOT NULL,
	"start_precision" date_precision,
	"start_value" date,
	"start_value_end" date,
	"end_reason" "union_end_reason",
	"end_precision" date_precision,
	"end_value" date,
	"end_value_end" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unions_distinct_partners" CHECK ("unions"."partner_a_id" <> "unions"."partner_b_id"),
	CONSTRAINT "unions_end_needs_reason" CHECK ("unions"."end_precision" is null or "unions"."end_reason" is not null),
	CONSTRAINT "unions_start_complete" CHECK (("unions"."start_precision" is null) = ("unions"."start_value" is null)),
	CONSTRAINT "unions_start_range" CHECK (("unions"."start_value_end" is not null) = ("unions"."start_precision" is not distinct from 'entre')),
	CONSTRAINT "unions_start_order" CHECK ("unions"."start_value_end" is null or "unions"."start_value_end" >= "unions"."start_value"),
	CONSTRAINT "unions_end_complete" CHECK (("unions"."end_precision" is null) = ("unions"."end_value" is null)),
	CONSTRAINT "unions_end_range" CHECK (("unions"."end_value_end" is not null) = ("unions"."end_precision" is not distinct from 'entre')),
	CONSTRAINT "unions_end_order" CHECK ("unions"."end_value_end" is null or "unions"."end_value_end" >= "unions"."end_value")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_persons" ADD CONSTRAINT "media_persons_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_persons" ADD CONSTRAINT "media_persons_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child" ADD CONSTRAINT "parent_child_parent_id_persons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child" ADD CONSTRAINT "parent_child_child_id_persons_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child" ADD CONSTRAINT "parent_child_union_id_unions_id_fk" FOREIGN KEY ("union_id") REFERENCES "public"."unions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_photo_media_id_media_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residences" ADD CONSTRAINT "residences_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residences" ADD CONSTRAINT "residences_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourced_facts" ADD CONSTRAINT "sourced_facts_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourced_facts" ADD CONSTRAINT "sourced_facts_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unions" ADD CONSTRAINT "unions_partner_a_id_persons_id_fk" FOREIGN KEY ("partner_a_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unions" ADD CONSTRAINT "unions_partner_b_id_persons_id_fk" FOREIGN KEY ("partner_b_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_person_idx" ON "events" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_one_birth" ON "events" USING btree ("person_id") WHERE "events"."kind" = 'naissance';--> statement-breakpoint
CREATE UNIQUE INDEX "events_one_death" ON "events" USING btree ("person_id") WHERE "events"."kind" = 'deces';--> statement-breakpoint
CREATE INDEX "media_persons_person_idx" ON "media_persons" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "parent_child_child_idx" ON "parent_child" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "residences_person_idx" ON "residences" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "unions_partner_a_idx" ON "unions" USING btree ("partner_a_id");--> statement-breakpoint
CREATE INDEX "unions_partner_b_idx" ON "unions" USING btree ("partner_b_id");