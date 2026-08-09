"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";

const gmailReadonlyScope = "https://www.googleapis.com/auth/gmail.readonly";

export default function SettingsPage() {
    const router = useRouter();
    const [gmailCallbackStatus, setGmailCallbackStatus] = useState<string | null>(
        null,
    );
    const [connectError, setConnectError] = useState<string | null>(null);
    const [signOutError, setSignOutError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const connection = api.gmail.connection.useQuery();
    const disconnect = api.gmail.disconnect.useMutation({
        onSuccess: async () => {
            await connection.refetch();
        },
    });
    const deleteAccount = api.account.deleteAccount.useMutation();

    useEffect(() => {
        setGmailCallbackStatus(
            new URLSearchParams(window.location.search).get("gmail"),
        );
    }, []);

    async function handleConnectGmail() {
        setConnectError(null);
        setIsConnecting(true);

        const result = await authClient.linkSocial({
            provider: "google",
            scopes: [gmailReadonlyScope],
            callbackURL: "/app/settings?gmail=connected",
            errorCallbackURL: "/app/settings?gmail=error",
        });

        setIsConnecting(false);
        if (result.error) {
            setConnectError(
                "Gmail connection could not be started. Please try again.",
            );
        }
    }

    async function handleDisconnectGmail() {
        await disconnect.mutateAsync();
    }

    async function handleSignOut() {
        setSignOutError(null);

        const result = await authClient.signOut();

        if (result.error) {
            setSignOutError("You could not be signed out. Please try again.");
            return;
        }

        router.replace("/");
        router.refresh();
    }

    async function handleDeleteAccount(
        event: React.MouseEvent<HTMLButtonElement>,
    ) {
        event.preventDefault();
        await deleteAccount.mutateAsync({ confirmation: "DELETE" });
        await authClient.signOut();
        router.replace("/");
        router.refresh();
    }

    const showConnectionSuccess =
        gmailCallbackStatus === "connected" && connection.data?.connected;
    const showConnectionError =
        gmailCallbackStatus === "error" ||
        (gmailCallbackStatus === "connected" &&
            !connection.isLoading &&
            !connection.data?.connected);

    return (
        <>
            <header className="py-10 max-[760px]:py-7">
                <p className="text-violet m-0 text-[.69rem] font-extrabold tracking-[.13em]">
                    ACCOUNT
                </p>
                <h1 className="my-2 text-[clamp(2rem,4vw,2.75rem)] leading-none tracking-[-.055em]">
                    Settings
                </h1>
                <p className="text-muted text-sm leading-normal">
                    Connections and account controls.
                </p>
            </header>

            {showConnectionSuccess ? (
                <p
                    className="mb-4 rounded-[10px] border border-[#bfe7d1] bg-[#eef9f3] px-4 py-3 text-sm text-[#176b48]"
                    role="status"
                >
                    Gmail connected successfully.
                </p>
            ) : null}
            {showConnectionError ? (
                <p
                    className="mb-4 rounded-[10px] border border-[#f0c8cf] bg-[#fff5f6] px-4 py-3 text-sm text-[#9e283c]"
                    role="alert"
                >
                    Gmail was not connected. Please try again.
                </p>
            ) : null}

            <section className="border-line rounded-[14px] border bg-white p-6 sm:p-7">
                <div className="flex items-start justify-between gap-6 max-[640px]:flex-col">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg tracking-[-.035em]">Gmail</h2>
                            {connection.data?.connected ? (
                                <Badge variant="success">Connected</Badge>
                            ) : null}
                        </div>
                        <p className="text-muted mt-2 max-w-xl text-sm leading-6">
                            {connection.data?.connected
                                ? "subTracker can read subscription-related emails when you start a scan."
                                : "Connect Gmail to let subTracker find subscription-related emails."}
                        </p>
                        {connection.data?.connected ? (
                            <p className="text-muted mt-2 text-xs">
                                Connected as {connection.data.email}
                            </p>
                        ) : null}
                    </div>

                    {connection.isLoading ? (
                        <span className="text-muted text-sm">Checking connection…</span>
                    ) : connection.isError ? (
                        <Button
                            onClick={async () => {
                                await connection.refetch();
                            }}
                            variant="outline"
                        >
                            Retry
                        </Button>
                    ) : connection.data?.connected ? (
                        <div className="flex shrink-0 flex-wrap gap-2">
                            <Button asChild>
                                <Link href="/app/scan">Find subscriptions</Link>
                            </Button>
                            <Button
                                disabled={disconnect.isPending}
                                onClick={handleDisconnectGmail}
                                variant="ghost"
                            >
                                {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
                            </Button>
                        </div>
                    ) : (
                        <Button disabled={isConnecting} onClick={handleConnectGmail}>
                            {isConnecting ? "Connecting…" : "Connect Gmail"}
                        </Button>
                    )}
                </div>

                <Separator className="my-6" />
                <p className="text-muted text-xs leading-5">
                    Access is read-only. Email contents, subjects, and attachments are not
                    stored.
                </p>
            </section>

            {connectError || disconnect.error ? (
                <p className="mt-3 text-sm text-[#c02846]" role="alert">
                    {connectError ?? "Gmail could not be disconnected. Please try again."}
                </p>
            ) : null}

            <section className="border-line mt-6 rounded-[14px] border bg-white p-6 sm:p-7">
                <h2 className="text-lg tracking-[-.035em]">Account</h2>
                <div className="mt-5 flex items-center justify-between gap-5">
                    <h3 className="text-sm font-semibold">Sign out</h3>
                    <Button onClick={handleSignOut} variant="outline">
                        Sign out
                    </Button>
                </div>

                <Separator className="my-6" />

                <div className="flex items-center justify-between gap-5">
                    <h3 className="text-sm font-semibold">Delete account</h3>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This permanently deletes your subscriptions, Gmail scan data,
                                    and subTracker account. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            {deleteAccount.error ? (
                                <p className="text-sm text-[#c02846]" role="alert">
                                    Your account could not be deleted. Please try again.
                                </p>
                            ) : null}
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={deleteAccount.isPending}>
                                    Keep account
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={deleteAccount.isPending}
                                    onClick={handleDeleteAccount}
                                >
                                    {deleteAccount.isPending ? "Deleting…" : "Permanently delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </section>

            {signOutError ? (
                <p className="mt-3 text-sm text-[#c02846]" role="alert">
                    {signOutError}
                </p>
            ) : null}
        </>
    );
}
