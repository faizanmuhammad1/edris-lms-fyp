-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('Pending', 'Confirmed', 'Unsubscribed');

-- CreateEnum
CREATE TYPE "MailAudienceType" AS ENUM ('Subscribers', 'AllStudents', 'CourseStudents', 'AllTeachers', 'CategoryStudents', 'LevelStudents');

-- CreateEnum
CREATE TYPE "MailRecipientStatus" AS ENUM ('Sent', 'Bounced', 'Unsubscribed');

-- CreateTable
CREATE TABLE "subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'Pending',
    "token" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_campaign" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyJson" TEXT,
    "audienceType" "MailAudienceType" NOT NULL,
    "audiencePayload" JSONB,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "mail_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_recipient" (
    "id" TEXT NOT NULL,
    "mailCampaignId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "subscriberId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MailRecipientStatus" NOT NULL DEFAULT 'Sent',

    CONSTRAINT "mail_recipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriber_email_key" ON "subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriber_token_key" ON "subscriber"("token");

-- CreateIndex
CREATE INDEX "subscriber_email_idx" ON "subscriber"("email");

-- CreateIndex
CREATE INDEX "subscriber_status_idx" ON "subscriber"("status");

-- CreateIndex
CREATE INDEX "subscriber_token_idx" ON "subscriber"("token");

-- CreateIndex
CREATE INDEX "mail_campaign_createdById_idx" ON "mail_campaign"("createdById");

-- CreateIndex
CREATE INDEX "mail_campaign_sentAt_idx" ON "mail_campaign"("sentAt");

-- CreateIndex
CREATE INDEX "mail_recipient_mailCampaignId_idx" ON "mail_recipient"("mailCampaignId");

-- CreateIndex
CREATE INDEX "mail_recipient_email_idx" ON "mail_recipient"("email");

-- AddForeignKey
ALTER TABLE "mail_campaign" ADD CONSTRAINT "mail_campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_recipient" ADD CONSTRAINT "mail_recipient_mailCampaignId_fkey" FOREIGN KEY ("mailCampaignId") REFERENCES "mail_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
