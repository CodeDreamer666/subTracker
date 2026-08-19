import { BillingInterval } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    getAccessToken,
    revokeGoogleToken,
    detectCandidates,
    normalizeCandidateAmountsToUsd,
} = vi.hoisted(() => ({
    getAccessToken: vi.fn(),
    revokeGoogleToken: vi.fn(),
    detectCandidates: vi.fn(),
    normalizeCandidateAmountsToUsd: vi.fn(),
}));

vi.mock("~/server/better-auth", () => ({
    auth: { api: { getAccessToken, getSession: vi.fn() } },
}));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/better-auth/google-token", () => ({ revokeGoogleToken }));
vi.mock("~/server/gmail/detect-candidates", () => ({ detectCandidates }));
vi.mock("~/server/gmail/normalizeCandidateAmountsToUsd", () => ({
    default: normalizeCandidateAmountsToUsd,
}));

import { gmailReadonlyScope, gmailRouter, gmailTimeFilters } from "./gmail";

const candidate = {
    id: "message-1",
    sourceMessageId: "message-1",
    from: "Example <billing@example.com>",
    subject: "Your subscription will renew",
    date: "2026-08-18",
    internalDate: "1786982400000",
    snippet: "USD 10 per month",
    detection: {
        isSubscriptionCandidate: true,
        hasStrongSubscriptionSignal: true,
        hasOwnershipSignal: true,
        hasMoneyAmount: true,
        hasRecurringSignal: true,
        looksPromotional: false,
        looksNonPaid: false,
    },
    merchantKey: "billing@example.com",
    name: "Example",
    amountMinor: 1_000,
    billingInterval: BillingInterval.MONTHLY,
    nextRenewalOn: new Date("2026-09-18T00:00:00.000Z"),
};

describe("Gmail scan periods", () => {
    it("maps all four periods to the expected Gmail query", () => {
        expect(gmailTimeFilters).toEqual({
            WEEK: "newer_than:7d",
            MONTH: "newer_than:1m",
            YEAR: "newer_than:1y",
            ALL: null,
        });
    });
});

describe("Gmail confirmation", () => {
    const findFirst = vi.fn();
    const createMany = vi.fn();
    const updateMany = vi.fn();
    const deleteMany = vi.fn();
    const transaction = vi.fn();

    beforeEach(() => {
        findFirst.mockReset();
        createMany.mockReset();
        updateMany.mockReset();
        deleteMany.mockReset();
        transaction.mockReset();
        getAccessToken.mockReset();
        revokeGoogleToken.mockReset();
        detectCandidates.mockReset();
        normalizeCandidateAmountsToUsd.mockReset();

        findFirst.mockResolvedValue({ scope: gmailReadonlyScope });
        getAccessToken.mockResolvedValue({ accessToken: "test-token" });
        detectCandidates.mockResolvedValue([candidate]);
        normalizeCandidateAmountsToUsd.mockResolvedValue([candidate]);
        updateMany.mockResolvedValue({ count: 1 });
        deleteMany.mockResolvedValue({ count: 0 });
        transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
            Promise.all(operations),
        );
    });

    function caller() {
        return gmailRouter.createCaller({
            db: {
                account: { findFirst, updateMany },
                subscription: { createMany },
                gmailScan: { deleteMany },
                $transaction: transaction,
            },
            session: { user: { id: "user-a" } },
            headers: new Headers(),
        } as never);
    }

    it("creates confirmed subscriptions atomically with duplicate skipping", async () => {
        createMany.mockResolvedValue({ count: 1 });

        await expect(
            caller().confirm({ sourceMessageIds: ["message-1"] }),
        ).resolves.toEqual({ savedCount: 1 });

        expect(detectCandidates).toHaveBeenCalledWith("test-token", null, [
            "message-1",
        ]);
        expect(createMany).toHaveBeenCalledWith({
            data: [
                expect.objectContaining({
                    userId: "user-a",
                    merchantKey: "billing@example.com",
                }),
            ],
            skipDuplicates: true,
        });
    });

    it("reports zero inserts when a concurrent confirmation already won", async () => {
        createMany.mockResolvedValue({ count: 0 });

        await expect(
            caller().confirm({ sourceMessageIds: ["message-1"] }),
        ).resolves.toEqual({ savedCount: 0 });
    });

    it("retains the local connection when Google revocation is unavailable", async () => {
        getAccessToken.mockResolvedValue({ accessToken: "test-token" });
        revokeGoogleToken.mockRejectedValue(new Error("network unavailable"));

        await expect(caller().disconnect()).rejects.toMatchObject({
            code: "BAD_GATEWAY",
        });
        expect(updateMany).not.toHaveBeenCalled();
    });

    it("clears an already-invalid Google grant as disconnected", async () => {
        getAccessToken.mockRejectedValue({ statusCode: 400 });

        await expect(caller().disconnect()).resolves.toEqual({ success: true });
        expect(updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: "user-a", providerId: "google" },
            }),
        );
    });
});
