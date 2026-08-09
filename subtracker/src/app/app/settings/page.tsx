"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

function formatCurrency(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gmailCallbackStatus = searchParams.get("gmail");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [startedScanId, setStartedScanId] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<
    string[] | null
  >(null);
  const lastProcessedBatch = useRef<string | null>(null);
  const utils = api.useUtils();
  const connection = api.gmail.connection.useQuery();
  const activeScan = api.gmail.activeScan.useQuery();
  const scanId = startedScanId ?? activeScan.data?.id ?? null;
  const scan = api.gmail.review.useQuery(
    { scanId: scanId ?? "invalid" },
    { enabled: Boolean(scanId) },
  );
  const pendingCandidateIds =
    scan.data?.status === "REVIEW_READY"
      ? scan.data.candidates
          .filter((candidate) => candidate.decision === "PENDING")
          .map((candidate) => candidate.id)
      : [];
  const selectedCandidateIdsForScan =
    selectedCandidateIds ?? pendingCandidateIds;
  const startScan = api.gmail.startScan.useMutation({
    onSuccess: (result) => {
      setStartedScanId(result.id);
    },
  });
  const processBatch = api.gmail.processNextBatch.useMutation({
    onSuccess: async () => {
      await scan.refetch();
    },
    onError: async () => {
      await scan.refetch();
    },
  });
  const confirmCandidates = api.gmail.confirm.useMutation({
    onSuccess: async () => {
      await Promise.all([
        scan.refetch(),
        utils.subscription.dashboard.invalidate(),
      ]);
    },
  });
  const disconnect = api.gmail.disconnect.useMutation({
    onSuccess: async () => {
      setStartedScanId(null);
      setSelectedCandidateIds(null);
      await connection.refetch();
    },
  });
  const deleteAccount = api.account.deleteAccount.useMutation();

  useEffect(() => {
    const currentScan = scan.data;
    if (
      !scanId ||
      currentScan?.status !== "RUNNING" ||
      processBatch.isPending
    ) {
      return;
    }

    const batchKey = `${currentScan.id}:${currentScan.processedMessages}:${currentScan.pageToken ?? "complete"}`;
    if (lastProcessedBatch.current === batchKey) return;

    lastProcessedBatch.current = batchKey;
    processBatch.mutate({ scanId });
  }, [processBatch, scan.data, scanId]);

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

  async function handleStartScan() {
    setSelectedCandidateIds(null);
    lastProcessedBatch.current = null;
    await startScan.mutateAsync();
  }

  async function handleConfirmCandidates() {
    if (!scanId || selectedCandidateIdsForScan.length === 0) return;

    await confirmCandidates.mutateAsync({
      scanId,
      candidateIds: selectedCandidateIdsForScan,
    });
  }

  function toggleCandidate(candidateId: string) {
    setSelectedCandidateIds((currentIds) =>
      (currentIds ?? pendingCandidateIds).includes(candidateId)
        ? (currentIds ?? pendingCandidateIds).filter((id) => id !== candidateId)
        : [...(currentIds ?? pendingCandidateIds), candidateId],
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
  const scanIsRunning =
    startScan.isPending ||
    processBatch.isPending ||
    (Boolean(scanId) && (!scan.data || scan.data.status === "RUNNING"));
  const scanNeedsReview = scan.data?.status === "REVIEW_READY";

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
              <Button
                disabled={
                  scanIsRunning || scanNeedsReview || activeScan.isLoading
                }
                onClick={handleStartScan}
              >
                {scanIsRunning
                  ? "Scanning Gmail…"
                  : scanNeedsReview
                    ? "Review results below"
                    : "Scan Gmail"}
              </Button>
              <Button
                disabled={disconnect.isPending || scanIsRunning}
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

        {connection.data?.connected && scanId ? (
          <section aria-label="Gmail scan status">
            {!scan.data || scan.data.status === "RUNNING" ? (
              <div className="border-line rounded-xl border bg-[#faf9f8] p-5">
                <Badge variant="secondary">Scanning</Badge>
                <h3 className="mt-3 text-base font-semibold tracking-[-.025em]">
                  Scanning Gmail…
                </h3>
                <p className="text-muted mt-1 text-sm leading-6">
                  Checking subscription-related emails.{" "}
                  {scan.data?.processedMessages ?? 0} emails checked so far.
                </p>
              </div>
            ) : scan.data.status === "REVIEW_READY" ? (
              <div className="grid gap-4">
                <div className="border-line rounded-xl border bg-[#faf9f8] p-5">
                  <Badge variant="success">Scan complete</Badge>
                  <h3 className="mt-3 text-base font-semibold tracking-[-.025em]">
                    Found {scan.data.candidates.length} possible subscription
                    {scan.data.candidates.length === 1 ? "" : "s"}.
                  </h3>
                  <p className="text-muted mt-1 text-sm leading-6">
                    Select the subscriptions you want to add to Overview.
                  </p>
                </div>

                <div className="grid gap-2">
                  {scan.data.candidates.map((candidate) => (
                    <label
                      className="border-line grid cursor-pointer grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-4 max-[560px]:grid-cols-[20px_minmax(0,1fr)]"
                      key={candidate.id}
                    >
                      <input
                        checked={selectedCandidateIdsForScan.includes(
                          candidate.id,
                        )}
                        className="accent-violet size-4"
                        type="checkbox"
                        onChange={() => toggleCandidate(candidate.id)}
                      />
                      <span className="min-w-0">
                        <strong className="block truncate text-sm">
                          {candidate.name}
                        </strong>
                        <small className="text-muted block text-xs">
                          {candidate.category ?? "Other"} · Renews{" "}
                          {formatDate(candidate.nextRenewalOn)}
                        </small>
                      </span>
                      <span className="text-sm font-semibold max-[560px]:col-start-2">
                        {formatCurrency(
                          candidate.amountMinor,
                          candidate.currency,
                        )}
                        /{candidate.billingInterval === "MONTHLY" ? "mo" : "yr"}
                      </span>
                    </label>
                  ))}
                </div>

                <div>
                  <Button
                    disabled={
                      selectedCandidateIdsForScan.length === 0 ||
                      confirmCandidates.isPending
                    }
                    onClick={handleConfirmCandidates}
                  >
                    {confirmCandidates.isPending
                      ? "Adding subscriptions…"
                      : "Add selected subscriptions"}
                  </Button>
                </div>
              </div>
            ) : scan.data.status === "NO_RESULTS" ? (
              <div className="border-line rounded-xl border bg-[#faf9f8] p-5">
                <Badge variant="outline">Scan complete</Badge>
                <h3 className="mt-3 text-base font-semibold tracking-[-.025em]">
                  No subscription emails were found.
                </h3>
                <p className="text-muted mt-1 text-sm leading-6">
                  Gmail was scanned successfully, but no matching subscriptions
                  were detected.
                </p>
                <Button
                  className="mt-4"
                  onClick={handleStartScan}
                  variant="outline"
                >
                  Scan again
                </Button>
              </div>
            ) : scan.data.status === "FAILED" ? (
              <div className="rounded-xl border border-[#f0c8cf] bg-[#fff5f6] p-5">
                <Badge variant="destructive">Scan failed</Badge>
                <h3 className="mt-3 text-base font-semibold tracking-[-.025em]">
                  Couldn&apos;t scan Gmail.
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#9e283c]">
                  Reconnect Gmail if access changed, or try the scan again.
                </p>
                <Button
                  className="mt-4"
                  onClick={handleStartScan}
                  variant="outline"
                >
                  Try again
                </Button>
              </div>
            ) : (
              <div className="border-line rounded-xl border bg-[#faf9f8] p-5">
                <Badge variant="success">Subscriptions added</Badge>
                <h3 className="mt-3 text-base font-semibold tracking-[-.025em]">
                  Scan complete.
                </h3>
                <p className="text-muted mt-1 text-sm leading-6">
                  Added{" "}
                  {
                    scan.data.candidates.filter(
                      (candidate) => candidate.decision === "ACCEPTED",
                    ).length
                  }{" "}
                  subscription
                  {scan.data.candidates.filter(
                    (candidate) => candidate.decision === "ACCEPTED",
                  ).length === 1
                    ? ""
                    : "s"}{" "}
                  to Overview.
                </p>
                <Button
                  className="mt-4"
                  onClick={handleStartScan}
                  variant="outline"
                >
                  Scan again
                </Button>
              </div>
            )}

            {startScan.error ||
            processBatch.error ||
            confirmCandidates.error ? (
              <p className="mt-3 text-sm text-[#c02846]" role="alert">
                {confirmCandidates.error
                  ? "The selected subscriptions could not be added. Please try again."
                  : processBatch.error
                    ? "Gmail could not be scanned. Please try again."
                    : "The Gmail scan could not be started. Please try again."}
              </p>
            ) : null}
          </section>
        ) : (
          <p className="text-muted text-xs leading-5">
            Access is read-only. Email contents, subjects, and attachments are
            not stored.
          </p>
        )}
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
