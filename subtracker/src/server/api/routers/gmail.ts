import {
    CandidateDecision,
    GmailScanStatus,
    SubscriptionSource,
} from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { auth } from "~/server/better-auth";
import {
    getGmailMessage,
    listSubscriptionMessages,
} from "~/server/gmail/client";
import { detectSubscription } from "~/server/gmail/detector";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const gmailReadonlyScope =
    "https://www.googleapis.com/auth/gmail.readonly";

const scanId = z.object({ scanId: z.string().cuid() });
const candidateId = z.string().cuid();

function hasGmailReadonlyScope(scope: string | null) {
    return (scope?.split(/[,\s]+/) ?? []).includes(gmailReadonlyScope);
}

const candidateSelect = {
    id: true,
    merchantKey: true,
    name: true,
    amountMinor: true,
    currency: true,
    billingInterval: true,
    category: true,
    planName: true,
    nextRenewalOn: true,
    messageDate: true,
    decision: true,
} as const;

const scanWithCandidates = {
    id: true,
    status: true,
    pageToken: true,
    estimatedMessages: true,
    processedMessages: true,
    errorCode: true,
    startedAt: true,
    completedAt: true,
    candidates: {
        select: candidateSelect,
        orderBy: { messageDate: "desc" as const },
    },
} as const;

const gmailAccessToken = async (headers: Headers) => {
    try {
        return await auth.api.getAccessToken({
            headers,
            body: { providerId: "google" },
        });
    } catch {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Reconnect Gmail to continue scanning.",
        });
    }
};

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

    activeScan: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.gmailScan.findFirst({
            where: { userId: ctx.session.user.id, status: GmailScanStatus.RUNNING },
            select: scanWithCandidates,
            orderBy: { startedAt: "desc" },
        });
    }),

    startScan: protectedProcedure.mutation(async ({ ctx }) => {
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

        const existing = await ctx.db.gmailScan.findFirst({
            where: { userId: ctx.session.user.id, status: GmailScanStatus.RUNNING },
            select: scanWithCandidates,
            orderBy: { startedAt: "desc" },
        });
        
        if (existing) return existing;

        const scan = await ctx.db.gmailScan.create({
            data: {
                userId: ctx.session.user.id,
                status: GmailScanStatus.RUNNING,
                activeKey: ctx.session.user.id,
            },
            select: scanWithCandidates,
        });

        return scan;
    }),

    processNextBatch: protectedProcedure
        .input(scanId)
        .mutation(async ({ ctx, input }) => {
            const scan = await ctx.db.gmailScan.findFirst({
                where: { id: input.scanId, userId: ctx.session.user.id },
                select: {
                    id: true,
                    status: true,
                    pageToken: true,
                    processedMessages: true,
                },
            });
            if (!scan) throw new TRPCError({ code: "NOT_FOUND" });
            if (scan.status !== GmailScanStatus.RUNNING) {
                return ctx.db.gmailScan.findUniqueOrThrow({
                    where: { id: scan.id },
                    select: scanWithCandidates,
                });
            }

            const token = await gmailAccessToken(ctx.headers);
            let page;
            try {
                page = await listSubscriptionMessages(
                    token.accessToken,
                    scan.pageToken,
                );
            } catch (error) {
                const errorCode =
                    error instanceof Error && error.message === "GMAIL_403"
                        ? "GMAIL_PERMISSION_REVOKED"
                        : "GMAIL_UNAVAILABLE";
                await ctx.db.gmailScan.updateMany({
                    where: {
                        id: scan.id,
                        userId: ctx.session.user.id,
                        status: GmailScanStatus.RUNNING,
                    },
                    data: {
                        status: GmailScanStatus.FAILED,
                        errorCode,
                        activeKey: null,
                        completedAt: new Date(),
                    },
                });
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "Gmail could not be scanned. Reconnect Gmail and try again.",
                });
            }

            for (const item of page.messages ?? []) {
                try {
                    const message = await getGmailMessage(token.accessToken, item.id);
                    const candidate = detectSubscription(message);
                    if (candidate) {
                        await ctx.db.detectedSubscription.upsert({
                            where: {
                                scanId_merchantKey: {
                                    scanId: scan.id,
                                    merchantKey: candidate.merchantKey,
                                },
                            },
                            create: { scanId: scan.id, ...candidate },
                            update: candidate,
                        });
                    }
                } catch {
                    // A single unavailable message must not discard the rest of this real scan batch.
                }
            }

            const isComplete = !page.nextPageToken;
            const candidateCount = await ctx.db.detectedSubscription.count({
                where: { scanId: scan.id },
            });
            const updated = await ctx.db.gmailScan.updateMany({
                where: {
                    id: scan.id,
                    userId: ctx.session.user.id,
                    status: GmailScanStatus.RUNNING,
                    pageToken: scan.pageToken,
                },
                data: {
                    pageToken: page.nextPageToken ?? null,
                    estimatedMessages: page.resultSizeEstimate ?? 0,
                    processedMessages: { increment: (page.messages ?? []).length },
                    ...(isComplete
                        ? {
                            status: candidateCount
                                ? GmailScanStatus.REVIEW_READY
                                : GmailScanStatus.NO_RESULTS,
                            activeKey: null,
                            completedAt: new Date(),
                        }
                        : {}),
                },
            });

            if (!updated.count) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "This scan advanced in another tab. Refresh to continue.",
                });
            }

            return ctx.db.gmailScan.findUniqueOrThrow({
                where: { id: scan.id },
                select: scanWithCandidates,
            });
        }),

    review: protectedProcedure.input(scanId).query(async ({ ctx, input }) => {
        const scan = await ctx.db.gmailScan.findFirst({
            where: { id: input.scanId, userId: ctx.session.user.id },
            select: scanWithCandidates,
        });
        if (!scan) throw new TRPCError({ code: "NOT_FOUND" });
        return scan;
    }),

    confirm: protectedProcedure
        .input(
            scanId.extend({ candidateIds: z.array(candidateId).min(1).max(100) }),
        )
        .mutation(async ({ ctx, input }) => {
            const scan = await ctx.db.gmailScan.findFirst({
                where: {
                    id: input.scanId,
                    userId: ctx.session.user.id,
                    status: GmailScanStatus.REVIEW_READY,
                },
                include: { candidates: true },
            });
            if (!scan) throw new TRPCError({ code: "NOT_FOUND" });

            const selected = scan.candidates.filter((candidate) =>
                input.candidateIds.includes(candidate.id),
            );
            if (!selected.length) throw new TRPCError({ code: "BAD_REQUEST" });

            await ctx.db.$transaction(async (tx) => {
                for (const candidate of selected) {
                    const alreadyTracked = await tx.subscription.findFirst({
                        where: {
                            userId: ctx.session.user.id,
                            merchantKey: candidate.merchantKey,
                            status: "ACTIVE",
                        },
                        select: { id: true },
                    });
                    const subscription =
                        alreadyTracked ??
                        (await tx.subscription.create({
                            data: {
                                userId: ctx.session.user.id,
                                name: candidate.name,
                                merchantKey: candidate.merchantKey,
                                category: candidate.category ?? "Other",
                                planName: candidate.planName,
                                amountMinor: candidate.amountMinor,
                                currency: candidate.currency,
                                billingInterval: candidate.billingInterval,
                                nextRenewalOn: candidate.nextRenewalOn,
                                source: SubscriptionSource.GMAIL,
                            },
                        }));
                    await tx.detectedSubscription.update({
                        where: { id: candidate.id },
                        data: {
                            decision: CandidateDecision.ACCEPTED,
                            subscriptionId: subscription.id,
                        },
                    });
                }

                await tx.detectedSubscription.updateMany({
                    where: {
                        scanId: scan.id,
                        id: { notIn: selected.map((candidate) => candidate.id) },
                    },
                    data: { decision: CandidateDecision.DISMISSED },
                });
                await tx.gmailScan.update({
                    where: { id: scan.id },
                    data: { status: GmailScanStatus.CONFIRMED, completedAt: new Date() },
                });
            });

            return { success: true };
        }),

    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
        await ctx.db.$transaction([
            ctx.db.detectedSubscription.deleteMany({
                where: {
                    scan: { userId: ctx.session.user.id },
                    decision: { not: CandidateDecision.ACCEPTED },
                },
            }),
            ctx.db.gmailScan.deleteMany({
                where: {
                    userId: ctx.session.user.id,
                    status: { not: GmailScanStatus.CONFIRMED },
                },
            }),
            ctx.db.account.updateMany({
                where: { userId: ctx.session.user.id, providerId: "google" },
                data: {
                    accessToken: null,
                    refreshToken: null,
                    accessTokenExpiresAt: null,
                    refreshTokenExpiresAt: null,
                    scope: null,
                },
            }),
        ]);
        return { success: true };
    }),
});
