CREATE TYPE "public"."EventType" AS ENUM('lecture', 'exam', 'holiday', 'break', 'event');--> statement-breakpoint
CREATE TABLE "BibData" (
	"id" serial PRIMARY KEY NOT NULL,
	"percentage" integer,
	"name" text,
	"year" integer,
	"month" integer,
	"day" integer,
	"chunk" integer,
	"iat" timestamp
);
--> statement-breakpoint
CREATE TABLE "BibPredictionData" (
	"id" serial PRIMARY KEY NOT NULL,
	"percentage" integer,
	"name" text,
	"year" integer,
	"month" integer,
	"day" integer,
	"chunk" integer,
	"iat" timestamp
);
--> statement-breakpoint
CREATE TABLE "CalendarEvent" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"type" "EventType",
	"start" timestamp,
	"end" timestamp
);
