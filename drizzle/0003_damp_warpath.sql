ALTER TABLE "conversation" ALTER COLUMN "document_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "document_chunk" ALTER COLUMN "document_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "conversation_id" SET NOT NULL;