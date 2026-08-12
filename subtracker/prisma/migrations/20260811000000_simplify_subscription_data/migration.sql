-- subTracker V1 stores all subscription amounts as normalized USD minor units.
ALTER TABLE "Subscription"
    DROP COLUMN "category",
    DROP COLUMN "currency",
    ALTER COLUMN "amountMinor" DROP NOT NULL,
    ALTER COLUMN "billingInterval" DROP NOT NULL,
    ALTER COLUMN "nextRenewalOn" DROP NOT NULL;

-- This legacy scan table is not used by the current Gmail flow, but category is
-- removed so the schema no longer carries the discarded V1 concept.
ALTER TABLE "DetectedSubscription"
    DROP COLUMN "category",
    DROP COLUMN "currency",
    ALTER COLUMN "amountMinor" DROP NOT NULL,
    ALTER COLUMN "billingInterval" DROP NOT NULL,
    ALTER COLUMN "nextRenewalOn" DROP NOT NULL;
