ALTER TABLE "BibData" RENAME COLUMN "percentage" TO "occupancy";--> statement-breakpoint
ALTER TABLE "BibPredictionData" RENAME COLUMN "percentage" TO "occupancy";--> statement-breakpoint
ALTER TABLE "BibData" ADD COLUMN "ttl" timestamp;--> statement-breakpoint
ALTER TABLE "BibPredictionData" ADD COLUMN "ttl" timestamp;