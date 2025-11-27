-- Migration: Add Teacher Status Fields to User Table
-- This migration adds teacher application and approval functionality

-- Step 1: Create the TeacherStatus enum type
CREATE TYPE "TeacherStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- Step 2: Add teacher-related columns to the user table
ALTER TABLE "user" 
ADD COLUMN "teacherStatus" "TeacherStatus",
ADD COLUMN "teacherApplicationDate" TIMESTAMP(3),
ADD COLUMN "teacherRejectionReason" TEXT;

-- Step 3: Create indexes for better query performance (optional but recommended)
CREATE INDEX "user_teacherStatus_idx" ON "user"("teacherStatus");
CREATE INDEX "user_teacherApplicationDate_idx" ON "user"("teacherApplicationDate");

-- Verification query to check the changes
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'user' 
-- AND column_name LIKE 'teacher%';
