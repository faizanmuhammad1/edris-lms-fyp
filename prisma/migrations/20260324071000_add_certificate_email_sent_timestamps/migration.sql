-- Track idempotent certificate emails
ALTER TABLE "Certificate"
ADD COLUMN IF NOT EXISTS "completionEmailSentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "issuedEmailSentAt" TIMESTAMP(3);

