-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "maxFileSizeBytes" INTEGER,
ADD COLUMN "maxTextLength" INTEGER;

-- AlterTable
ALTER TABLE "AssignmentSubmission" ADD COLUMN "gradingMethod" TEXT,
ADD COLUMN "gradedByAiAt" TIMESTAMP(3);

-- Backfill existing graded submissions as Manual
UPDATE "AssignmentSubmission"
SET "gradingMethod" = 'Manual'
WHERE "status" = 'Graded' AND "gradingMethod" IS NULL;
