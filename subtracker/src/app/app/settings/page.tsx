"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { ManualSubscriptionDialog } from "../manual-subscription-dialog";

const gmailReadonlyScope = "https://www.googleapis.com/auth/gmail.readonly";

type GmailScanPeriod = "WEEK" | "MONTH" | "YEAR" | "ALL";

const gmailScanPeriods: Array<{ label: string; value: GmailScanPeriod }> = [
    { label: "Past week", value: "WEEK" },
    { label: "Past month", value: "MONTH" },
    { label: "Past year", value: "YEAR" },
    { label: "All mail", value: "ALL" },
];

function formatCost(
    amountMinor: number | null,
    billingInterval: "MONTHLY" | "YEARLY" | null,
) {
    if (amountMinor === null) return "Price not found";

    const price = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(amountMinor / 100);

    if (!billingInterval) return price;

    return `${price} / ${billingInterval === "MONTHLY" ? "month" : "year"}`;
}

export default function SettingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const gmailCallbackStatus = searchParams.get("gmail");
    const [connectError, setConnectError] = useState<string | null>(null);
    const [signOutError, setSignOutError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [scanDialogOpen, setScanDialogOpen] = useState(false);
    const [scanPeriod, setScanPeriod] = useState<GmailScanPeriod>("YEAR");
    const [manualDialogOpen, setManualDialogOpen] = useState(false);
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(
        [],
    );
    const utils = api.useUtils();

    const connection = api.gmail.connection.useQuery();

    const confirmCandidates = api.gmail.confirm.useMutation({
        onSuccess: async () => {
            await utils.subscription.dashboard.invalidate();
        },
    });

    const scan = api.gmail.scan.useMutation({
        onSuccess: (result) => {
            setSelectedCandidateIds(
                result.candidates.map((candidate) => candidate.id),
            );
        },
    });
    
    const disconnect = api.gmail.disconnect.useMutation({
        onSuccess: async () => {
            scan.reset();
            confirmCandidates.reset();
            setSelectedCandidateIds([]);
            setScanDialogOpen(false);
            setManualDialogOpen(false);
            await connection.refetch();
        },
    });
    const deleteAccount = api.account.deleteAccount.useMutation();

    const candidates = scan.data?.candidates ?? [];

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

    async function handleStartScan() {
        scan.reset();
        confirmCandidates.reset();
        setSelectedCandidateIds([]);

        try {
            await scan.mutateAsync({ period: scanPeriod });
        } catch {
            return;
        }
    }

    async function handleConfirmCandidates() {
        const selectedCandidates = candidates.filter((candidate) =>
            selectedCandidateIds.includes(candidate.id),
        );
        if (!selectedCandidates.length) return;

        try {
            await confirmCandidates.mutateAsync({
                sourceMessageIds: selectedCandidates.map(
                    (candidate) => candidate.sourceMessageId,
                ),
            });
        } catch {
            return;
        }
    }

    function handleOpenScanDialog() {
        scan.reset();
        confirmCandidates.reset();
        setSelectedCandidateIds([]);
        setScanDialogOpen(true);
    }

    function handleScanDialogOpenChange(nextOpen: boolean) {
        if (scan.isPending || confirmCandidates.isPending) return;
        setScanDialogOpen(nextOpen);
    }

    function handleScanAgain() {
        scan.reset();
        confirmCandidates.reset();
        setSelectedCandidateIds([]);
    }

    function handleOpenManualFromResults() {
        setScanDialogOpen(false);
        setManualDialogOpen(true);
    }

    function toggleCandidate(candidateId: string) {
        setSelectedCandidateIds((currentIds) =>
            currentIds.includes(candidateId)
                ? currentIds.filter((id) => id !== candidateId)
                : [...currentIds, candidateId],
        );
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
                        {connection.data?.connected ? (
                            <div className="mt-4">
                                <p className="text-muted text-xs">Connected as:</p>
                                <p className="mt-1 text-sm font-semibold">
                                    {connection.data.email}
                                </p>
                            </div>
                        ) : (
                            <p className="text-muted mt-2 max-w-xl text-sm leading-6">
                                Connect Gmail to let subTracker find subscription-related
                                emails.
                            </p>
                        )}
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
                            <Button
                                disabled={scan.isPending || confirmCandidates.isPending}
                                onClick={handleOpenScanDialog}
                            >
                                Scan Gmail
                            </Button>
                            <Button
                                disabled={disconnect.isPending || scan.isPending}
                                onClick={async () => {
                                    await disconnect.mutateAsync();
                                }}
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
            </section>

            <Dialog open={scanDialogOpen} onOpenChange={handleScanDialogOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {scan.isPending
                                ? "Scanning Gmail"
                                : scan.isError
                                    ? "Gmail scan couldn’t finish"
                                    : confirmCandidates.data
                                        ? "Subscriptions added"
                                        : scan.data
                                            ? "Scan results"
                                            : "Scan Gmail"}
                        </DialogTitle>
                        <DialogDescription>
                            {scan.isPending
                                ? "Looking for subscription-related emails…"
                                : scan.isError
                                    ? "No subscriptions were changed. You can try the scan again."
                                    : confirmCandidates.data
                                        ? "Your selected subscriptions are now in Overview."
                                        : scan.data
                                            ? "Review what Gmail found before adding anything to Overview."
                                            : "Before scanning, keep these details in mind."}
                        </DialogDescription>
                    </DialogHeader>

                    {scan.isPending ? (
                        <div
                            className="grid min-h-36 place-items-center gap-3 text-center"
                            role="status"
                        >
                            <span
                                aria-hidden="true"
                                className="border-line border-t-violet size-8 animate-spin rounded-full border-4"
                            />
                            <p className="text-muted text-sm">
                                This may take a moment. Keep this window open.
                            </p>
                        </div>
                    ) : scan.isError ? (
                        <div className="grid gap-5">
                            <p className="text-sm font-semibold text-[#9e283c]" role="alert">
                                Couldn&apos;t scan Gmail.
                            </p>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button onClick={handleStartScan}>Try again</Button>
                            </DialogFooter>
                        </div>
                    ) : confirmCandidates.data ? (
                        <div className="border-line rounded-xl border bg-[#faf9f8] p-5">
                            <Badge variant="success">Subscriptions added</Badge>
                            <p className="mt-3 text-sm leading-6">
                                Added {confirmCandidates.data.savedCount} subscription
                                {confirmCandidates.data.savedCount === 1 ? "" : "s"} to
                                Overview.
                            </p>
                            <Button
                                className="mt-4"
                                onClick={handleScanAgain}
                                variant="outline"
                            >
                                Scan again
                            </Button>
                        </div>
                    ) : scan.data && candidates.length === 0 ? (
                        <div className="border-line rounded-xl border bg-[#faf9f8] p-5">
                            <p className="mt-3 text-sm font-semibold">
                                No subscription emails were found.
                            </p>
                            <Button
                                className="mt-4"
                                onClick={handleScanAgain}
                                variant="outline"
                            >
                                Scan again
                            </Button>
                        </div>
                    ) : candidates.length ? (
                        <div className="grid gap-4">
                            <div className="border-line rounded-xl border bg-[#faf9f8] p-5">
                                <p className="mt-3 text-sm font-semibold">
                                    Found {candidates.length} possible subscription
                                    {candidates.length === 1 ? "" : "s"}.
                                </p>
                                <p className="text-muted mt-1 text-sm leading-6">
                                    Select the subscriptions you want to add to Overview.
                                </p>
                            </div>

                            <div className="grid gap-2">
                                {candidates.map((candidate) => (
                                    <label
                                        className="border-line grid cursor-pointer grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-4 max-[560px]:grid-cols-[20px_minmax(0,1fr)]"
                                        key={candidate.id}
                                    >
                                        <input
                                            checked={selectedCandidateIds.includes(candidate.id)}
                                            className="accent-violet size-4"
                                            type="checkbox"
                                            onChange={() => toggleCandidate(candidate.id)}
                                        />
                                        <span className="min-w-0">
                                            <strong className="block truncate text-sm">
                                                {candidate.name}
                                            </strong>
                                            <small className="text-muted block truncate text-xs">
                                                {candidate.subject || candidate.from}
                                            </small>
                                        </span>
                                        <span className="text-sm font-semibold max-[560px]:col-start-2">
                                            {formatCost(
                                                candidate.amountMinor,
                                                candidate.billingInterval,
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <div className="w-full flex justify-end items-center">
                                <Button
                                    disabled={
                                        selectedCandidateIds.length === 0 ||
                                        confirmCandidates.isPending
                                    }
                                    onClick={handleConfirmCandidates}
                                >
                                    {confirmCandidates.isPending
                                        ? "Adding subscriptions…"
                                        : "Add selected subscriptions"}
                                </Button>
                            </div>

                            {confirmCandidates.error ? (
                                <p className="text-sm text-[#c02846]" role="alert">
                                    The selected subscriptions could not be added. Please try
                                    again.
                                </p>
                            ) : null}
                        </div>
                    ) : (
                        <div className="grid gap-5">
                            <fieldset className="border-line grid gap-3 rounded-xl border p-4">
                                <legend className="px-1 text-sm font-semibold">
                                    Scan period
                                </legend>
                                {gmailScanPeriods.map((period) => (
                                    <label
                                        className="flex cursor-pointer items-center gap-3 text-sm"
                                        key={period.value}
                                    >
                                        <input
                                            checked={scanPeriod === period.value}
                                            className="accent-violet size-4"
                                            name="gmail-scan-period"
                                            onChange={() => setScanPeriod(period.value)}
                                            type="radio"
                                            value={period.value}
                                        />
                                        {period.label}
                                    </label>
                                ))}
                            </fieldset>
                            <ul className="text-muted grid list-disc gap-3 pl-5 text-sm leading-6 marker:text-[#8d86ee]">
                                <li>
                                    subTracker uses read-only Gmail access for scanning. It does
                                    not send, edit, or delete your Gmail messages.
                                </li>
                                <li>Scanning may miss some subscriptions.</li>
                                <li>
                                    Price, billing interval, or renewal date may be missing from a
                                    detected subscription.
                                </li>
                                <li>
                                    Non-USD prices use a reference exchange rate, so the final
                                    bank or card charge may differ slightly.
                                </li>
                                <li>
                                    subTracker scans only when you ask it to. It does not
                                    continuously monitor your inbox.
                                </li>
                            </ul>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button onClick={handleStartScan}>Start scanning</Button>
                            </DialogFooter>
                        </div>
                    )}

                    {scan.data && !scan.isPending && !confirmCandidates.isPending ? (
                        <div className="border-line flex flex-wrap items-center gap-x-2 border-t pt-4 text-sm">
                            <span>Didn&apos;t find a subscription?</span>
                            <Button
                                className="h-auto px-0 py-0"
                                onClick={handleOpenManualFromResults}
                                variant="link"
                            >
                                + Add manually
                            </Button>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            <ManualSubscriptionDialog
                onOpenChange={setManualDialogOpen}
                open={manualDialogOpen}
                showOverviewAfterCreate
            />

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
