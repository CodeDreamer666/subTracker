-- Preserve user-owned data integrity and prevent concurrent duplicate Gmail
-- subscriptions while still allowing multiple manual rows with NULL merchantKey.
CREATE UNIQUE INDEX "Subscription_userId_merchantKey_key"
ON "Subscription"("userId", "merchantKey");

ALTER TABLE "Subscription"
ADD CONSTRAINT "Subscription_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GmailScan"
ADD CONSTRAINT "GmailScan_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
