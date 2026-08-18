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
      callbackURL: "/app/manage?gmail=connected",
      errorCallbackURL: "/app/manage?gmail=error",
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

  async function handleStartScanFromPage() {
    setScanDialogOpen(true);
    await handleStartScan();
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

  function handleScanDialogOpenChange(nextOpen: boolean) {
    if (scan.isPending || confirmCandidates.isPending) return;
    setScanDialogOpen(nextOpen);
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
    <section className="mx-auto w-full max-w-[920px] px-6 py-[clamp(48px,8vw,88px)] max-[620px]:px-4 max-[620px]:pt-9">
      <header className="mb-9 max-w-[640px]">
        <h1 className="font-display m-0 text-[clamp(36px,6vw,56px)] leading-[1.02] tracking-[-0.03em]">
          Account and scanning
        </h1>
        <p className="text-muted mt-4 max-w-[58ch] text-[15px] leading-[1.6]">
          Start a Gmail scan or manage your subTracker account.
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

      <div className="border-line bg-surface overflow-hidden rounded-[22px] border shadow-[0_18px_55px_var(--fg-soft)]">
        <article className="grid grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)] gap-10 p-7 max-[760px]:grid-cols-1 max-[760px]:gap-6 max-[620px]:p-5">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display m-0 text-[26px] leading-[1.08]">
                Scan Gmail
              </h2>
              {connection.data?.connected ? (
                <Badge variant="success">Connected</Badge>
              ) : null}
            </div>
            {connection.data?.connected ? (
              <p className="text-muted mt-2.5 max-w-[46ch] text-sm leading-[1.6]">
                Find subscription emails and add what you confirm to your
                overview. Messages are not edited or deleted.
              </p>
            ) : (
              <p className="text-muted mt-2.5 max-w-[46ch] text-sm leading-[1.6]">
                Connect Gmail to let subTracker find subscription-related
                emails.
              </p>
            )}
          </div>

          <div className="border-line rounded-2xl border bg-[color-mix(in_oklch,var(--bg)_48%,var(--surface))] p-4.5">
            <p className="text-muted mb-3 font-mono text-[10px] font-semibold tracking-[0.08em] uppercase">
              Scan period
            </p>
            <div
              className="grid grid-cols-2 gap-2"
              role="group"
              aria-label="Email history to scan"
            >
              {gmailScanPeriods.map((period) => (
                <button
                  key={period.value}
                  className={`min-h-11 cursor-pointer rounded-[9px] border px-3 text-xs transition-colors ${scanPeriod === period.value ? "border-ink bg-ink text-surface font-bold" : "border-line bg-surface text-ink hover:border-ink"}`}
                  type="button"
                  aria-pressed={scanPeriod === period.value}
                  onClick={() => setScanPeriod(period.value)}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {connection.isLoading ? (
              <Button className="mt-3 min-h-11 w-full rounded-xl" disabled>
                Checking connection…
              </Button>
            ) : connection.isError ? (
              <Button
                className="mt-3 min-h-11 w-full rounded-xl"
                onClick={async () => {
                  await connection.refetch();
                }}
                variant="outline"
              >
                Retry
              </Button>
            ) : connection.data?.connected ? (
              <div className="flex flex-col gap-3">
                <Button
                  className="mt-4 min-h-11 w-full rounded-xl"
                  disabled={scan.isPending || confirmCandidates.isPending}
                  onClick={handleStartScanFromPage}
                >
                  {scan.isPending ? "Scanning Gmail…" : "Start scan"}
                </Button>
                <Button
                  className="w-full"
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
              <Button
                className="mt-3 min-h-11 w-full rounded-xl"
                disabled={isConnecting}
                onClick={handleConnectGmail}
              >
                {isConnecting ? "Connecting…" : "Connect Gmail"}
              </Button>
            )}
          </div>
        </article>

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
                <p
                  className="text-sm font-semibold text-[#9e283c]"
                  role="alert"
                >
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
                  onClick={() => scan.mutate({ period: scanPeriod })}
                  variant="outline"
                >
                  Scan again
                </Button>
              </div>
            ) : scan.data && candidates.length === 0 ? (
              <div className="border-line flex items-center justify-between rounded-xl border bg-[#faf9f8] p-5">
                <p className="text-sm font-semibold">
                  No subscription emails were found.
                </p>
                <Button
                  className=""
                  onClick={() => scan.mutate({ period: scanPeriod })}
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

                <div className="flex w-full items-center justify-end">
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
            ) : null}

            {scan.data && !scan.isPending && !confirmCandidates.isPending ? (
              <div className="border-line flex w-full flex-wrap items-center justify-end gap-x-2 border-t pt-4 text-sm">
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
            {connectError ??
              "Gmail could not be disconnected. Please try again."}
          </p>
        ) : null}

        <div className="border-line border-t">
          <article className="flex flex-col gap-3 px-7 py-6 max-[620px]:grid-cols-[44px_1fr] max-[620px]:px-5">
            <div>
              <h2 className="font-display m-0 text-xl">Sign out</h2>
              <p className="text-muted mt-1 text-sm">
                End your current subTracker session on this device.
              </p>
            </div>
            <Button
              className="min-h-11 max-[620px]:col-span-2 max-[620px]:w-full"
              onClick={handleSignOut}
              variant="outline"
            >
              Sign out
            </Button>
          </article>

          <article className="border-line flex flex-col gap-3 gap-4 border-t px-7 py-6 max-[620px]:grid-cols-[44px_1fr] max-[620px]:px-5">
            <div>
              <h2 className="font-display m-0 text-xl">Delete account</h2>
              <p className="text-muted mt-1 text-sm">
                Permanently remove your account and all subscriptions stored in
                subTracker.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="min-h-11 max-[620px]:col-span-2 max-[620px]:w-full"
                  variant="destructive"
                >
                  Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes your subscriptions, Gmail scan
                    data, and subTracker account. This action cannot be undone.
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
                    {deleteAccount.isPending
                      ? "Deleting…"
                      : "Permanently delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </article>
        </div>
      </div>

      {signOutError ? (
        <p className="mt-3 text-sm text-[#c02846]" role="alert">
          {signOutError}
        </p>
      ) : null}
    </section>
  );
}
