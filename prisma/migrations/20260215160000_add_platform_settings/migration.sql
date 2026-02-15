-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "platformName" TEXT NOT NULL DEFAULT 'Edris LMS',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@example.com',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default row
INSERT INTO "platform_settings" ("id", "platformName", "supportEmail", "updatedAt")
VALUES ('default', 'Edris LMS', 'support@example.com', NOW());
