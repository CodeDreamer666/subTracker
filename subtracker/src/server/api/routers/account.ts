import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { auth } from "~/server/better-auth";
import { revokeGoogleToken } from "~/server/better-auth/google-token";

export const accountRouter = createTRPCRouter({
    deleteAccount: protectedProcedure
        .input(z.object({ confirmation: z.literal("DELETE") }))
        .mutation(async ({ ctx }) => {
            const userId = ctx.session.user.id;

            try {
                const token = await auth.api.getAccessToken({
                    headers: ctx.headers,
                    body: { providerId: "google" },
                });
                await revokeGoogleToken(token.accessToken);
            } catch {
                // Local deletion must not be blocked by an unavailable OAuth provider.
            }

            // Sessions, accounts, subscriptions, and Gmail scans (with their detected
            // subscriptions) are removed by the schema's onDelete: Cascade rules.
            await ctx.db.user.delete({ where: { id: userId } });

            return { success: true };
        }),
});
