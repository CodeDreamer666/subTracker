import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const accountRouter = createTRPCRouter({
  deleteAccount: protectedProcedure
    .input(z.object({ confirmation: z.literal("DELETE") }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      await ctx.db.$transaction(async (transaction) => {
        await transaction.detectedSubscription.deleteMany({
          where: { scan: { userId } },
        });
        await transaction.gmailScan.deleteMany({ where: { userId } });
        await transaction.subscription.deleteMany({ where: { userId } });
        await transaction.session.deleteMany({ where: { userId } });
        await transaction.account.deleteMany({ where: { userId } });
        await transaction.user.delete({ where: { id: userId } });
      });

      return { success: true };
    }),
});
