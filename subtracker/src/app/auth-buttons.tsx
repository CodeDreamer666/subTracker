"use client";
import { useState } from "react";
import { authClient } from "~/server/better-auth/client";

export function GoogleSignInButton({
    compact = false,
    label,
}: {
    compact?: boolean;
    label?: string;
}) {
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    async function handleSignIn() {
        setError(null);
        setIsPending(true);

        const result = await authClient.signIn.social({
            provider: "google",
            callbackURL: "/app",
            errorCallbackURL: "/auth/oauth-error",
        });

        setIsPending(false);

        if (result.error) {
            setError("Google sign-in could not be started. Please try again.");
        }
    }

    return (
        <>
            <button
                className={
                    compact
                        ? "text-ink hover:text-violet cursor-pointer rounded-[10px] border-0 bg-transparent px-1 py-[9px] font-[650] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-65"
                        : "bg-violet cursor-pointer rounded-[10px] border-0 px-[22px] py-[15px] text-base font-[650] text-white no-underline shadow-[0_5px_16px_#4b40e92b] transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-[#3e35d0] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-65"
                }
                disabled={isPending}
                onClick={handleSignIn}
                type="button"
            >
                {isPending
                    ? "Signing in..."
                    : (label ?? (compact ? "Sign in" : "Get Started"))}
            </button>

            {error ? (
                <p className="text-[.82rem] text-[#c02846]" role="alert">
                    {error}
                </p>
            ) : null}
        </>
    );
}
