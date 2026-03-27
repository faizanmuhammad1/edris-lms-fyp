ALTER TABLE "Course" ADD COLUMN "normalizedName" TEXT;

UPDATE "Course"
SET "normalizedName" = regexp_replace(lower("title"), '[^a-z0-9]+', '', 'g')
WHERE "normalizedName" IS NULL;

CREATE INDEX "Course_normalizedName_idx" ON "Course"("normalizedName");
