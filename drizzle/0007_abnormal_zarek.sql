ALTER TABLE "message" ADD COLUMN "parts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "message" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "message" DROP COLUMN "source_chunk_ids";