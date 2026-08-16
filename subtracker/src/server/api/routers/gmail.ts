import { SubscriptionSource } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { auth } from "~/server/better-auth";
import {
    getGmailMessageForDetection,
    listGmailMessageIds,
} from "~/server/gmail/client";
import {
    createSubscriptionCandidate,
    detectSubscription,
} from "~/server/gmail/detection/detector";
import type {
    SubscriptionCandidate,
    EmailForDetection
} from "~/server/gmail/detection/detection-types"
import normalizeCandidateAmountsToUsd from "~/server/gmail/normalizeCandidateAmountsToUsd"

export const gmailReadonlyScope =
    "https://www.googleapis.com/auth/gmail.readonly";

const scanPeriod = z.enum(["WEEK", "MONTH", "YEAR", "ALL"]);

const gmailTimeFilters: Record<z.infer<typeof scanPeriod>, string | null> = {
    WEEK: "newer_than:7d",
    MONTH: "newer_than:1m",
    YEAR: "newer_than:1y",
    ALL: null,
};

type NormalizedSubscriptionCandidate = Omit<
    SubscriptionCandidate,
    "sourceCurrency"
>;

function hasGmailReadonlyScope(scope: string | null) {
    return (scope?.split(/[,\s]+/) ?? []).includes(gmailReadonlyScope);
}

async function gmailAccessToken(headers: Headers) {
    try {
        const token = await auth.api.getAccessToken({
            headers,
            body: { providerId: "google" },
        });

        return token.accessToken;
    } catch {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Reconnect Gmail to continue scanning.",
        });
    }
}

async function detectCandidates(
    accessToken: string,
    messageIds: string[],
): Promise<SubscriptionCandidate[]> {
    const candidatesBySender = new Map<string, SubscriptionCandidate>();

    for (const messageId of messageIds) {
        let email: EmailForDetection | null;

        try {
            email = await getGmailMessageForDetection(accessToken, messageId);
        } catch {
            continue;
        }

        if (!email) continue;

        const detection = detectSubscription(email);

        if (!detection.isSubscriptionCandidate) continue;

        const candidate = createSubscriptionCandidate(email, detection);
        const existingCandidate = candidatesBySender.get(candidate.merchantKey);

        if (
            !existingCandidate ||
            Number(candidate.internalDate) > Number(existingCandidate.internalDate)
        ) {
            candidatesBySender.set(candidate.merchantKey, candidate);
        }
    }

    return Array.from(candidatesBySender.values());
}

export const gmailRouter = createTRPCRouter({
    connection: protectedProcedure.query(async ({ ctx }) => {
        const account = await ctx.db.account.findFirst({
            where: { userId: ctx.session.user.id, providerId: "google" },
            select: { accessToken: true, refreshToken: true, scope: true },
        });

        return {
            connected: Boolean(
                account &&
                hasGmailReadonlyScope(account.scope) &&
                (account.accessToken ?? account.refreshToken),
            ),
            email: ctx.session.user.email,
        };
    }),

    scan: protectedProcedure
        .input(z.object({ period: scanPeriod }))
        .mutation(async ({ ctx, input }) => {
        const account = await ctx.db.account.findFirst({
            where: { userId: ctx.session.user.id, providerId: "google" },
            select: { scope: true },
        });

        if (!account || !hasGmailReadonlyScope(account.scope)) {
            throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: "Connect Gmail before starting a scan.",
            });
        }

        const accessToken = await gmailAccessToken(ctx.headers);

        let messageIds: string[];

        try {
            messageIds = await listGmailMessageIds(
                accessToken,
                gmailTimeFilters[input.period],
            );
        } catch {
            throw new TRPCError({
                code: "BAD_GATEWAY",
                message: "Gmail could not be scanned. Please try again.",
            });
        }

        const detectedCandidates = await detectCandidates(accessToken, messageIds);

        try {
            return {
                candidates: await normalizeCandidateAmountsToUsd(detectedCandidates),
            };
        } catch {
            throw new TRPCError({
                code: "BAD_GATEWAY",
                message:
                    "Subscription prices could not be converted to USD. Please try again.",
            });
        }
        }),

    confirm: protectedProcedure
        .input(
            z.object({
                sourceMessageIds: z
                    .array(z.string().min(1).max(200))
                    .min(1)
                    .max(100)
                    .refine(
                        (messageIds) => new Set(messageIds).size === messageIds.length,
                        "Duplicate Gmail message IDs are not allowed.",
                    ),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const account = await ctx.db.account.findFirst({
                where: {
                    userId: ctx.session.user.id,
                    providerId: "google",
                },
                select: { scope: true },
            });

            if (!account || !hasGmailReadonlyScope(account.scope)) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "Connect Gmail before adding subscriptions.",
                });
            }

            const accessToken = await gmailAccessToken(ctx.headers);

            const detectedCandidates = await detectCandidates(
                accessToken,
                input.sourceMessageIds,
            );
            
            let candidates: NormalizedSubscriptionCandidate[];

            try {
                candidates = await normalizeCandidateAmountsToUsd(detectedCandidates);
            } catch {
                throw new TRPCError({
                    code: "BAD_GATEWAY",
                    message:
                        "Subscription prices could not be converted to USD. Please try again.",
                });
            }

            let savedCount = 0;

            await ctx.db.$transaction(async (tx) => {
                for (const candidate of candidates) {
                    const alreadyTracked = await tx.subscription.findFirst({
                        where: {
                            userId: ctx.session.user.id,
                            merchantKey: candidate.merchantKey,
                            status: "ACTIVE",
                        },
                        select: { id: true },
                    });

                    if (alreadyTracked) continue;

                    await tx.subscription.create({
                        data: {
                            userId: ctx.session.user.id,
                            name: candidate.name,
                            merchantKey: candidate.merchantKey,
                            amountMinor: candidate.amountMinor,
                            billingInterval: candidate.billingInterval,
                            nextRenewalOn: candidate.nextRenewalOn,
                            source: SubscriptionSource.GMAIL,
                        },
                    });
                    savedCount += 1;
                }
            });

            return { savedCount };
        }),

    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
        await ctx.db.account.updateMany({
            where: { userId: ctx.session.user.id, providerId: "google" },
            data: {
                accessToken: null,
                refreshToken: null,
                accessTokenExpiresAt: null,
                refreshTokenExpiresAt: null,
                scope: null,
            },
        });

        return { success: true };
    }),
});
