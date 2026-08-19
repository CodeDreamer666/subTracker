import { afterEach, describe, expect, it, vi } from "vitest";
import type { SubscriptionCandidate } from "./detection/detection-types";
import normalizeCandidateAmountsToUsd from "./normalizeCandidateAmountsToUsd";

function candidate(
    id: string,
    amountMinor: number,
    sourceCurrency: "USD" | "SGD",
): SubscriptionCandidate {
    return {
        id,
        sourceMessageId: id,
        from: `${id} <${id}@example.com>`,
        subject: "Subscription receipt",
        date: "2026-08-18",
        internalDate: "1700000000000",
        snippet: "Subscription",
        detection: {
            isSubscriptionCandidate: true,
            hasStrongSubscriptionSignal: true,
            hasOwnershipSignal: true,
            hasMoneyAmount: true,
            hasRecurringSignal: true,
            looksPromotional: false,
            looksNonPaid: false,
        },
        merchantKey: `${id}@example.com`,
        name: id,
        amountMinor,
        sourceCurrency,
        billingInterval: "MONTHLY",
        nextRenewalOn: null,
    };
}

describe("USD candidate normalization", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("deduplicates exchange-rate requests per source currency", async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(
                new Response(JSON.stringify({ base: "SGD", quote: "USD", rate: 0.75 })),
            );
        vi.stubGlobal("fetch", fetchMock);

        const normalized = await normalizeCandidateAmountsToUsd([
            candidate("one", 2_000, "SGD"),
            candidate("two", 1_000, "SGD"),
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(normalized.map((item) => item.amountMinor)).toEqual([1_500, 750]);
        expect(normalized[0]).not.toHaveProperty("sourceCurrency");
    });

    it("rejects malformed exchange-rate responses", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn<typeof fetch>()
                .mockResolvedValue(
                    new Response(JSON.stringify({ base: "SGD", quote: "USD", rate: 0 })),
                ),
        );

        await expect(
            normalizeCandidateAmountsToUsd([candidate("one", 2_000, "SGD")]),
        ).rejects.toThrow("FRANKFURTER_INVALID_RATE");
    });

    it("does not call the rate API for USD values", async () => {
        const fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);

        const normalized = await normalizeCandidateAmountsToUsd([
            candidate("one", 2_000, "USD"),
        ]);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(normalized[0]?.amountMinor).toBe(2_000);
    });
});
