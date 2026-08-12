import { BillingInterval } from "../../../../generated/prisma";
import {
    strongSubscriptionPhrases,
    ownershipPhrases,
    recurringPhrases,
    promotionalPhrases,
    nonPaidPhrases
} from "./detection-phrases";
import type {
    EmailForDetection,
    DetectionResult,
    SubscriptionCandidate
} from "./detection-types"

function containsAny(text: string, phrases: string[]) {
    return phrases.some((phrase) => text.includes(phrase));
}

export function detectSubscription(email: EmailForDetection): DetectionResult {
    const content = [email.subject, email.snippet, email.textBody]
        .join(" ")
        .toLowerCase();

    const hasStrongSubscriptionSignal = containsAny(
        content,
        strongSubscriptionPhrases,
    );
    const hasOwnershipSignal = containsAny(content, ownershipPhrases);
    const hasRecurringSignal = containsAny(content, recurringPhrases);
    const hasMoneyAmount = amountAndCurrencyFrom(content) !== null;
    const looksPromotional = containsAny(content, promotionalPhrases);
    const looksNonPaid = containsAny(content, nonPaidPhrases);

    const isSubscriptionCandidate =
        !looksNonPaid &&
        (hasStrongSubscriptionSignal ||
            (!looksPromotional &&
                hasOwnershipSignal &&
                (hasMoneyAmount || hasRecurringSignal)));

    return {
        isSubscriptionCandidate,
        hasStrongSubscriptionSignal,
        hasOwnershipSignal,
        hasMoneyAmount,
        hasRecurringSignal,
        looksPromotional,
        looksNonPaid,
    };
}

export function getSenderKey(from: string) {
    const match = /<([^>]+)>/.exec(from);
    return (match?.[1] ?? from).trim().toLowerCase();
}

function senderName(from: string) {
    const displayName = from
        .split("<")[0]
        ?.trim()
        .replace(/^['"]|['"]$/g, "");
    if (displayName) return displayName.slice(0, 120);

    const senderKey = getSenderKey(from);
    const localPart = senderKey
        .split("@")[0]
        ?.replace(/[._-]+/g, " ")
        .trim();
    const candidateName = localPart?.length ? localPart : "Subscription";
    return candidateName.slice(0, 120);
}

function amountAndCurrencyFrom(content: string) {
    const match =
        /(?:\b(USD|SGD|EUR|GBP)\b|(US|S)\$|(\$|€|£))\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)/i.exec(
            content,
        );
    if (!match?.[4]) return null;

    const amount = Number.parseFloat(match[4].replaceAll(",", ""));
    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
        return null;
    }

    const sourceCurrency = (match[1]?.toUpperCase() ??
        (match[2]?.toUpperCase() === "S"
            ? "SGD"
            : match[3] === "€"
                ? "EUR"
                : match[3] === "£"
                    ? "GBP"
                    : "USD")) as "USD" | "SGD" | "EUR" | "GBP";

    return {
        amountMinor: Math.round(amount * 100),
        sourceCurrency,
    };
}

function billingIntervalFrom(content: string) {
    const hasMonthlyInterval =
        /per month|monthly|every month|each month|\/\s*(?:month|mo)\b/i.test(
            content,
        );
    const hasYearlyInterval =
        /per year|yearly|annually|annual|every year|each year|\/\s*(?:year|yr)\b/i.test(
            content,
        );

    if (hasMonthlyInterval === hasYearlyInterval) return null;

    return hasYearlyInterval ? BillingInterval.YEARLY : BillingInterval.MONTHLY;
}

function nextRenewalOnFrom(content: string) {
    const renewalDate =
        /(?:renews?|renewal(?: date)?|next billing(?: date)?|next payment(?: date)?|due(?: date)?)\D{0,24}([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i.exec(
            content,
        )?.[1];
    if (!renewalDate) return null;

    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(renewalDate)
        ? new Date(`${renewalDate}T00:00:00.000Z`)
        : new Date(`${renewalDate} 00:00:00 UTC`);

    return Number.isNaN(parsedDate.valueOf()) ? null : parsedDate;
}

export function createSubscriptionCandidate(
    email: EmailForDetection,
    detection: DetectionResult,
): SubscriptionCandidate {
    const content = [email.subject, email.snippet, email.textBody].join(" ");
    const detectedAmount = amountAndCurrencyFrom(content);

    return {
        id: email.id,
        sourceMessageId: email.id,
        from: email.from,
        subject: email.subject,
        date: email.date,
        internalDate: email.internalDate,
        snippet: email.snippet,
        detection,
        merchantKey: getSenderKey(email.from),
        name: senderName(email.from),
        amountMinor: detectedAmount?.amountMinor ?? null,
        sourceCurrency: detectedAmount?.sourceCurrency ?? null,
        billingInterval: billingIntervalFrom(content),
        nextRenewalOn: nextRenewalOnFrom(content),
    };
}
