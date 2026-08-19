import { describe, expect, it } from "vitest";
import { createSubscriptionCandidate, detectSubscription } from "./detector";
import type { EmailForDetection } from "./detection-types";

function email(overrides: Partial<EmailForDetection> = {}): EmailForDetection {
    return {
        id: "message-1",
        subject: "Your subscription will renew",
        from: "Service <billing@example.com>",
        date: "2026-08-18",
        internalDate: "1700000000000",
        snippet: "You will be charged SGD 20.00 per month",
        textBody: "Next payment date 2026-09-18",
        ...overrides,
    };
}

describe("subscription detection", () => {
    it("detects a paid recurring receipt and extracts normalized fields", () => {
        const message = email();
        const detection = detectSubscription(message);
        const candidate = createSubscriptionCandidate(message, detection);

        expect(detection.isSubscriptionCandidate).toBe(true);
        expect(candidate.merchantKey).toBe("billing@example.com");
        expect(candidate.amountMinor).toBe(2_000);
        expect(candidate.sourceCurrency).toBe("SGD");
        expect(candidate.billingInterval).toBe("MONTHLY");
        expect(candidate.nextRenewalOn?.toISOString()).toBe(
            "2026-09-18T00:00:00.000Z",
        );
    });

    it("rejects promotional and non-paid newsletter messages", () => {
        const promotion = detectSubscription(
            email({
                subject: "Subscribe now",
                snippet: "Start your free trial for $10 per month",
                textBody: "",
            }),
        );
        const newsletter = detectSubscription(
            email({
                subject: "Newsletter subscription",
                snippet: "You subscribed to this mailing list",
                textBody: "",
            }),
        );

        expect(promotion.isSubscriptionCandidate).toBe(false);
        expect(newsletter.isSubscriptionCandidate).toBe(false);
    });

    it("leaves malformed dates null and exposes a missing sender key", () => {
        const message = email({
            from: "",
            textBody: "Next payment date Not-a-date",
        });
        const detection = detectSubscription(message);
        const candidate = createSubscriptionCandidate(message, detection);

        expect(candidate.merchantKey).toBe("");
        expect(candidate.nextRenewalOn).toBeNull();
    });
});
