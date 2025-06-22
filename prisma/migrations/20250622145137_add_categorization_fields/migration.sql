-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "category" TEXT[],
ADD COLUMN     "eventType" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "price" JSONB,
ADD COLUMN     "tags" TEXT[],
ALTER COLUMN "cleCredits" SET DATA TYPE DOUBLE PRECISION;
