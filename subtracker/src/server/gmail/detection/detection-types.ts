import { BillingInterval } from "../../../../generated/prisma";

export type EmailForDetection = {
    id: string;
    subject: string;
    from: string;
    date: string;
    internalDate: string;
    snippet: string;
    textBody: string;
};

export type DetectionResult = {
    isSubscriptionCandidate: boolean;
    hasStrongSubscriptionSignal: boolean;
    hasOwnershipSignal: boolean;
    hasMoneyAmount: boolean;
    hasRecurringSignal: boolean;
    looksPromotional: boolean;
    looksNonPaid: boolean;
};

export type SubscriptionCandidate = {
    id: string;
    sourceMessageId: string;
    from: string;
    subject: string;
    date: string;
    internalDate: string;
    snippet: string;
    detection: DetectionResult;
    merchantKey: string;
    name: string;
    amountMinor: number | null;
    sourceCurrency: "USD" | "SGD" | "EUR" | "GBP" | null;
    billingInterval: BillingInterval | null;
    nextRenewalOn: Date | null;
};