import {
  RenewalIntent,
  SubscriptionStatus,
} from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const id = z.object({ id: z.string().cuid() });
const fields = z.object({
  name: z.string().trim().min(1).max(120),
  amountMinor: z.number().int().positive(),
  billingInterval: z.enum(["MONTHLY", "YEARLY"]),
  nextRenewalOn: z.string().date(),
  category: z.string().trim().min(1).max(60),
  cancellationUrl: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"))
    .optional(),
  reminderEnabled: z.boolean(),
});

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

export const subscriptionRouter = createTRPCRouter({
  dashboard: protectedProcedure.query(({ ctx }) =>
    ctx.db.subscription.findMany({
      where: {
        userId: ctx.session.user.id,
        status: SubscriptionStatus.ACTIVE,
      },
      orderBy: { nextRenewalOn: "asc" },
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
  create: protectedProcedure.input(fields).mutation(({ ctx, input }) =>
    ctx.db.subscription.create({
      data: {
        userId: ctx.session.user.id,
        name: input.name,
        amountMinor: input.amountMinor,
        currency: "USD",
        billingInterval: input.billingInterval,
        nextRenewalOn: date(input.nextRenewalOn),
        category: input.category,
        cancellationUrl: input.cancellationUrl,
        reminderDaysBefore: input.reminderEnabled ? 3 : null,
        source: "MANUAL",
      },
    }),
  ),
  update: protectedProcedure
    .input(fields.partial().extend({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.subscription.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const {
        id: subscriptionId,
        nextRenewalOn,
        reminderEnabled,
        ...changes
      } = input;
      return ctx.db.subscription.update({
        where: { id: subscriptionId },
        data: {
          ...changes,
          ...(nextRenewalOn ? { nextRenewalOn: date(nextRenewalOn) } : {}),
          ...(reminderEnabled === undefined
            ? {}
            : { reminderDaysBefore: reminderEnabled ? 3 : null }),
        },
      });
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
  markCancelled: protectedProcedure
    .input(id)
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.db.subscription.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!subscription) throw new TRPCError({ code: "NOT_FOUND" });
      if (subscription.status === SubscriptionStatus.CANCELLED)
        return subscription;
      return ctx.db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
          accessEndsOn: subscription.nextRenewalOn,
        },
      });
    }),
});
