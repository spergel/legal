-- Add categorization fields to Event table
ALTER TABLE "Event" 
ADD COLUMN "category" TEXT[] DEFAULT '{}',
ADD COLUMN "tags" TEXT[] DEFAULT '{}',
ADD COLUMN "eventType" TEXT,
ADD COLUMN "image" TEXT,
ADD COLUMN "price" JSONB,
ADD COLUMN "metadata" JSONB;
