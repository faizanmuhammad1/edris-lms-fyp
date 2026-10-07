-- CreateEnum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "TeacherStatus" AS ENUM ('Pending', 'Approved', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable (only add columns if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'teacherStatus') THEN
        ALTER TABLE "user" ADD COLUMN "teacherStatus" "TeacherStatus";
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'teacherApplicationDate') THEN
        ALTER TABLE "user" ADD COLUMN "teacherApplicationDate" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'teacherRejectionReason') THEN
        ALTER TABLE "user" ADD COLUMN "teacherRejectionReason" TEXT;
    END IF;
END $$;

-- CreateIndex (only if they don't exist)
CREATE INDEX IF NOT EXISTS "user_teacherStatus_idx" ON "user"("teacherStatus");
CREATE INDEX IF NOT EXISTS "user_teacherApplicationDate_idx" ON "user"("teacherApplicationDate");

