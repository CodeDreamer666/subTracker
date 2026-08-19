import {
    RenewalIntent,
    SubscriptionSource,
    SubscriptionStatus,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { subscriptionDate } from "~/lib/subscription-date";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const id = z.object({ id: z.string().cuid() });
const billingInterval = z.enum(["MONTHLY", "YEARLY"]);
export const manualPrice = z
    .string()
    .trim()
    .max(12)
    .transform((value, context) => {
        if (!value) return null;

        if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Enter a valid USD amount with up to two decimal places.",
            });
            return z.NEVER;
        }

        const [dollars = "0", cents = ""] = value.split(".");
        const amountMinor =
            Number.parseInt(dollars, 10) * 100 +
            Number.parseInt(cents.padEnd(2, "0") || "0", 10);

        if (!Number.isSafeInteger(amountMinor) || amountMinor > 100_000_000) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Enter a price below $1,000,000.",
            });
            return z.NEVER;
        }

        return amountMinor;
    });
const manualCreateFields = z.object({
    name: z.string().trim().min(1).max(120),
    price: manualPrice,
    billingInterval: billingInterval.nullable(),
    nextRenewalOn: z.string().date().nullable(),
});
const fields = z.object({
    name: z.string().trim().min(1).max(120),
    amountMinor: z.number().int().nonnegative().max(100_000_000).nullable(),
    billingInterval: billingInterval.nullable(),
    nextRenewalOn: z.string().date().nullable(),
    cancellationUrl: z
        .string()
        .url()
        .refine((value) => value.startsWith("https://"))
        .optional(),
    reminderEnabled: z.boolean(),
});

export const subscriptionRouter = createTRPCRouter({
    dashboard: protectedProcedure.query(({ ctx }) =>
        ctx.db.subscription.findMany({
            where: { userId: ctx.session.user.id },
            orderBy: { nextRenewalOn: "asc" },
            select: {
                id: true,
                name: true,
                amountMinor: true,
                billingInterval: true,
                nextRenewalOn: true,
            },
        }),
    ),
    list: protectedProcedure.query(({ ctx }) =>
        ctx.db.subscription.findMany({
            where: {
                userId: ctx.session.user.id,
                OR: [
                    { status: SubscriptionStatus.ACTIVE },
                    {
                        status: SubscriptionStatus.CANCELLED,
                        accessEndsOn: { gte: new Date() },
                    },
                ],
            },
            orderBy: { nextRenewalOn: "asc" },
        }),
    ),
    byId: protectedProcedure.input(id).query(async ({ ctx, input }) => {
        const subscription = await ctx.db.subscription.findFirst({
            where: { id: input.id, userId: ctx.session.user.id },
        });
        if (!subscription) throw new TRPCError({ code: "NOT_FOUND" });
        return subscription;
    }),
    create: protectedProcedure
        .input(manualCreateFields)
        .mutation(async ({ ctx, input }) => {
            return await ctx.db.subscription.create({
                data: {
                    userId: ctx.session.user.id,
                    name: input.name,
                    amountMinor: input.price,
                    billingInterval: input.billingInterval,
                    nextRenewalOn: input.nextRenewalOn
                        ? subscriptionDate(input.nextRenewalOn)
                        : null,
                    source: SubscriptionSource.MANUAL,
                },
            });
        }),
    update: protectedProcedure
        .input(
            fields
                .partial()
                .extend({ id: z.string().cuid(), price: manualPrice.optional() }),
        )
        .mutation(async ({ ctx, input }) => {
            const {
                id: subscriptionId,
                nextRenewalOn,
                reminderEnabled,
                price,
                ...changes
            } = input;
            const updated = await ctx.db.subscription.updateMany({
                where: { id: subscriptionId, userId: ctx.session.user.id },
                data: {
                    ...changes,
                    ...(price === undefined ? {} : { amountMinor: price }),
                    ...(nextRenewalOn === undefined
                        ? {}
                        : {
                            nextRenewalOn: nextRenewalOn
                                ? subscriptionDate(nextRenewalOn)
                                : null,
                        }),
                    ...(reminderEnabled === undefined
                        ? {}
                        : { reminderDaysBefore: reminderEnabled ? 3 : null }),
                },
            });
            if (!updated.count) throw new TRPCError({ code: "NOT_FOUND" });
            return { success: true };
        }),
    setRenewalIntent: protectedProcedure
        .input(id.extend({ intent: z.nativeEnum(RenewalIntent) }))
        .mutation(async ({ ctx, input }) => {
            const updated = await ctx.db.subscription.updateMany({
                where: { id: input.id, userId: ctx.session.user.id },
                data: { renewalIntent: input.intent },
            });
            if (!updated.count) throw new TRPCError({ code: "NOT_FOUND" });
            return { success: true };
        }),
    deleteSubscription: protectedProcedure
        .input(id)
        .mutation(async ({ ctx, input }) => {
            const deleted = await ctx.db.subscription.deleteMany({
                where: { id: input.id, userId: ctx.session.user.id },
            });
            if (!deleted.count) throw new TRPCError({ code: "NOT_FOUND" });
            return { success: true };
        }),
    markCancelled: protectedProcedure
        .input(id)
        .mutation(async ({ ctx, input }) => {
            const subscription = await ctx.db.subscription.findFirst({
                where: { id: input.id, userId: ctx.session.user.id },
            });
            if (!subscription) throw new TRPCError({ code: "NOT_FOUND" });
            if (subscription.status === SubscriptionStatus.CANCELLED)
                return { success: true };
            const updated = await ctx.db.subscription.updateMany({
                where: { id: subscription.id, userId: ctx.session.user.id },
                data: {
                    status: SubscriptionStatus.CANCELLED,
                    cancelledAt: new Date(),
                    accessEndsOn: subscription.nextRenewalOn,
                },
            });
            if (!updated.count) throw new TRPCError({ code: "NOT_FOUND" });
            return { success: true };
        }),
    revertCancellation: protectedProcedure
        .input(id)
        .mutation(async ({ ctx, input }) => {
            const subscription = await ctx.db.subscription.findFirst({
                where: { id: input.id, userId: ctx.session.user.id },
            });
            if (!subscription) throw new TRPCError({ code: "NOT_FOUND" });
            if (subscription.status === SubscriptionStatus.ACTIVE)
                return { success: true };

            const updated = await ctx.db.subscription.updateMany({
                where: { id: subscription.id, userId: ctx.session.user.id },
                data: {
                    status: SubscriptionStatus.ACTIVE,
                    cancelledAt: null,
                    accessEndsOn: null,
                },
            });
            if (!updated.count) throw new TRPCError({ code: "NOT_FOUND" });
            return { success: true };
        }),
});
