import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmailForDetection } from "./detection/detection-types";

const { listGmailMessageIds, getGmailMessageForDetection } = vi.hoisted(() => ({
    listGmailMessageIds: vi.fn(),
    getGmailMessageForDetection: vi.fn(),
}));

vi.mock("~/server/gmail/client", () => ({
    listGmailMessageIds,
    getGmailMessageForDetection,
}));

import {
    detectCandidates,
    gmailCandidateLimit,
    gmailFetchBatchSize,
} from "./detect-candidates";

function receipt(
    id: string,
    from = `${id} <${id}@example.com>`,
): EmailForDetection {
    return {
        id,
        subject: "Your subscription will renew",
        from,
        date: "2026-08-18",
        internalDate: String(
            1_700_000_000_000 + Number(id.replace(/\D/g, "") || 0),
        ),
        snippet: "You will be charged USD 10 per month",
        textBody: "Next payment date 2026-09-18",
    };
}

describe("Gmail candidate batching", () => {
    beforeEach(() => {
        listGmailMessageIds.mockReset();
        getGmailMessageForDetection.mockReset();
    });

    it("skips isolated request failures but retains valid candidates", async () => {
        const ids = Array.from({ length: gmailFetchBatchSize + 1 }, (_, index) =>
            String(index),
        );
        listGmailMessageIds.mockResolvedValue(ids);
        getGmailMessageForDetection.mockImplementation((_: string, id: string) =>
            id === "0" ? Promise.reject(new Error("temporary")) : receipt(id),
        );

        const candidates = await detectCandidates("token", "newer_than:1y");

        expect(candidates).toHaveLength(gmailFetchBatchSize);
        expect(listGmailMessageIds).toHaveBeenCalledWith("token", "newer_than:1y");
    });

    it("fails when an entire request batch fails", async () => {
        listGmailMessageIds.mockResolvedValue(
            Array.from({ length: gmailFetchBatchSize }, (_, index) => String(index)),
        );
        getGmailMessageForDetection.mockRejectedValue(new Error("Gmail down"));

        await expect(detectCandidates("token", null)).rejects.toThrow(
            "GMAIL_MESSAGE_BATCH_FAILED",
        );
    });

    it("rejects missing senders and caps returned candidates", async () => {
        const ids = Array.from({ length: gmailCandidateLimit + 2 }, (_, index) =>
            String(index),
        );
        getGmailMessageForDetection.mockImplementation((_: string, id: string) =>
            id === "0" ? receipt(id, "") : receipt(id),
        );

        const candidates = await detectCandidates("token", null, ids);

        expect(candidates).toHaveLength(gmailCandidateLimit);
        expect(candidates.every((item) => item.merchantKey)).toBe(true);
    });
});
