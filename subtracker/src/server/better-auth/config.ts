import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { env } from "~/env";
import { db } from "~/server/db";

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    database: prismaAdapter(db, {
        provider: "postgresql", // or "sqlite" or "mysql"
    }),
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            accessType: "offline",
            scope: [],
            prompt: "select_account",
        },
    },
    account: {
        encryptOAuthTokens: true,
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
            allowDifferentEmails: false,
        },
    },
    databaseHooks: {
        account: {
            create: {
                before: async (account) => ({
                    data: { ...account, idToken: null },
                }),
            },
            update: {
                before: async (account) => ({
                    data: { ...account, idToken: null },
                }),
            },
        },
    },

    plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
