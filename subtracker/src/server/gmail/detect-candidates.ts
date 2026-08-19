import {
    getGmailMessageForDetection,
    listGmailMessageIds,
} from "~/server/gmail/client";
import {
    createSubscriptionCandidate,
    detectSubscription,
} from "~/server/gmail/detection/detector";
import type {
    EmailForDetection,
    SubscriptionCandidate,
} from "~/server/gmail/detection/detection-types";

export const gmailCandidateLimit = 100;
export const gmailFetchBatchSize = 10;

export async function detectCandidates(
    accessToken: string,
    timeFilter: string | null,
    suppliedMessageIds?: string[],
): Promise<SubscriptionCandidate[]> {
    const messageIds =
        suppliedMessageIds ?? (await listGmailMessageIds(accessToken, timeFilter));
    const candidatesBySender = new Map<string, SubscriptionCandidate>();

    for (
        let batchStart = 0;
        batchStart < messageIds.length;
        batchStart += gmailFetchBatchSize
    ) {
        const batch = messageIds.slice(
            batchStart,
            batchStart + gmailFetchBatchSize,
        );
        const results = await Promise.allSettled(
            batch.map((messageId) =>
                getGmailMessageForDetection(accessToken, messageId),
            ),
        );

        if (
            results.length &&
            results.every((result) => result.status === "rejected")
        ) {
            throw new Error("GMAIL_MESSAGE_BATCH_FAILED");
        }

        for (const result of results) {
            if (result.status === "rejected") continue;

            const email: EmailForDetection | null = result.value;
            if (!email) continue;

            const detection = detectSubscription(email);
            if (!detection.isSubscriptionCandidate) continue;

            const candidate = createSubscriptionCandidate(email, detection);
            if (!candidate.merchantKey) continue;

            const existingCandidate = candidatesBySender.get(candidate.merchantKey);
            if (
                !existingCandidate ||
                Number(candidate.internalDate) > Number(existingCandidate.internalDate)
            ) {
                candidatesBySender.set(candidate.merchantKey, candidate);
            }
        }
    }

    return Array.from(candidatesBySender.values())
        .sort(
            (left, right) => Number(right.internalDate) - Number(left.internalDate),
        )
        .slice(0, gmailCandidateLimit);
}
