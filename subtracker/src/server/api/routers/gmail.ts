import { SubscriptionSource, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { auth } from "~/server/better-auth";
import { revokeGoogleToken } from "~/server/better-auth/google-token";
import { detectCandidates } from "~/server/gmail/detect-candidates";
import normalizeCandidateAmountsToUsd from "~/server/gmail/normalizeCandidateAmountsToUsd";

export const gmailReadonlyScope =
  "https://www.googleapis.com/auth/gmail.readonly";

export const scanPeriod = z.enum(["WEEK", "MONTH", "YEAR", "ALL"]);

export const gmailTimeFilters: Record<
  z.infer<typeof scanPeriod>,
  string | null
> = {
  WEEK: "newer_than:7d",
  MONTH: "newer_than:1m",
  YEAR: "newer_than:1y",
  ALL: null,
};

function hasGmailReadonlyScope(scope: string | null) {
  return (scope?.split(/[,\s]+/) ?? []).includes(gmailReadonlyScope);
}

async function requireGmailScope(
  db: PrismaClient,
  userId: string,
  message: string,
) {
  const account = await db.account.findFirst({
    where: { userId, providerId: "google" },
    select: { scope: true },
  });

  if (!account || !hasGmailReadonlyScope(account.scope)) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message });
  }
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

async function usdCandidates(
  accessToken: string,
  timeFilter: string | null,
  sourceMessageIds?: string[],
) {
  let detectedCandidates;

  try {
    detectedCandidates = await detectCandidates(
      accessToken,
      timeFilter,
      sourceMessageIds,
    );
  } catch {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Gmail could not be scanned. Please try again.",
    });
  }

  try {
    return await normalizeCandidateAmountsToUsd(detectedCandidates);
  } catch {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message:
        "Subscription prices could not be converted to USD. Please try again.",
    });
  }
}

function isInvalidGoogleGrant(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const details = error as {
    status?: number;
    statusCode?: number;
    code?: string;
    message?: string;
  };
  const status = details.statusCode ?? details.status;
  if (status === 400 || status === 401) return true;

  const description = `${details.code ?? ""} ${details.message ?? ""}`;
  return /invalid[_ -]?(grant|token)|access[_ -]?token[_ -]?(not[_ -]?found|missing)/i.test(
    description,
  );
}

function publicCandidate(
  candidate: Awaited<ReturnType<typeof usdCandidates>>[number],
) {
  return {
    id: candidate.id,
    sourceMessageId: candidate.sourceMessageId,
    name: candidate.name,
    subject: candidate.subject,
    from: candidate.from,
    amountMinor: candidate.amountMinor,
    billingInterval: candidate.billingInterval,
  };
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
    };
  }),

  scan: protectedProcedure
    .input(z.object({ period: scanPeriod }))
    .mutation(async ({ ctx, input }) => {
      await requireGmailScope(
        ctx.db,
        ctx.session.user.id,
        "Connect Gmail before starting a scan.",
      );

      const accessToken = await gmailAccessToken(ctx.headers);
      const candidates = await usdCandidates(
        accessToken,
        gmailTimeFilters[input.period],
      );

      return { candidates: candidates.map(publicCandidate) };
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
      await requireGmailScope(
        ctx.db,
        ctx.session.user.id,
        "Connect Gmail before adding subscriptions.",
      );

      const accessToken = await gmailAccessToken(ctx.headers);
      const candidates = await usdCandidates(
        accessToken,
        null,
        input.sourceMessageIds,
      );

      const created = await ctx.db.subscription.createMany({
        data: candidates.map((candidate) => ({
          userId: ctx.session.user.id,
          name: candidate.name,
          merchantKey: candidate.merchantKey,
          amountMinor: candidate.amountMinor,
          billingInterval: candidate.billingInterval,
          nextRenewalOn: candidate.nextRenewalOn,
          source: SubscriptionSource.GMAIL,
        })),
        skipDuplicates: true,
      });

      return { savedCount: created.count };
    }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    let accessToken: string | null = null;

    try {
      const token = await auth.api.getAccessToken({
        headers: ctx.headers,
        body: { providerId: "google" },
      });
      accessToken = token.accessToken;
    } catch (error) {
      if (!isInvalidGoogleGrant(error)) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Gmail could not be disconnected. Please try again.",
        });
      }
    }

    if (accessToken) {
      try {
        await revokeGoogleToken(accessToken);
      } catch {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Gmail could not be disconnected. Please try again.",
        });
      }
    }

    await ctx.db.$transaction([
      ctx.db.account.updateMany({
        where: { userId: ctx.session.user.id, providerId: "google" },
        data: {
          accessToken: null,
          refreshToken: null,
          idToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          scope: null,
        },
      }),
      ctx.db.gmailScan.deleteMany({
        where: { userId: ctx.session.user.id },
      }),
    ]);

    return { success: true };
  }),
});
