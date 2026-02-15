-- AlterTable: add notification and security columns to platform_settings
ALTER TABLE "platform_settings" ADD COLUMN "notifyNewEnrollments" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "platform_settings" ADD COLUMN "notifyTeacherApplications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "platform_settings" ADD COLUMN "notifySystemAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "platform_settings" ADD COLUMN "require2FAForAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "platform_settings" ADD COLUMN "sessionTimeoutEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "platform_settings" ADD COLUMN "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30;
