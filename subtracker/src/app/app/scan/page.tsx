"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

function formatCurrency(amountMinor: number, code: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
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

export default function ScanPage() {
    const router = useRouter();
    const utils = api.useUtils();
    const connection = api.gmail.connection.useQuery();
    const activeScan = api.gmail.activeScan.useQuery();
    const [scanId, setScanId] = useState<string | null>(null);
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(
        [],
    );
    const [showManualForm, setShowManualForm] = useState(false);
    const lastProcessedBatch = useRef<string | null>(null);
    const scan = api.gmail.review.useQuery(
        { scanId: scanId ?? "invalid" },
        { enabled: Boolean(scanId) },
    );

    const startScan = api.gmail.startScan.useMutation({
        onSuccess: (result) => setScanId(result.id),
    });

    const processBatch = api.gmail.processNextBatch.useMutation({
        onSuccess: async () => {
            await scan.refetch();
        },
    });

    const confirmCandidates = api.gmail.confirm.useMutation({
        onSuccess: async () => {
            await utils.subscription.dashboard.invalidate();
            router.push("/app");
        },
    });

    useEffect(() => {
        if (!scanId && activeScan.data) setScanId(activeScan.data.id);
    }, [activeScan.data, scanId]);

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

    useEffect(() => {
        if (scan.data?.status !== "REVIEW_READY") return;
        setSelectedCandidateIds(
            scan.data.candidates
                .filter((candidate) => candidate.decision === "PENDING")
                .map((candidate) => candidate.id),
        );
    }, [scan.data]);

    async function handleStartScan() {
        await startScan.mutateAsync();
    }

    async function handleConfirmCandidates() {
        if (!scanId || selectedCandidateIds.length === 0) return;
        await confirmCandidates.mutateAsync({
            scanId,
            candidateIds: selectedCandidateIds,
        });
    }

    function toggleCandidate(candidateId: string) {
        setSelectedCandidateIds((currentIds) =>
            currentIds.includes(candidateId)
                ? currentIds.filter((id) => id !== candidateId)
                : [...currentIds, candidateId],
        );
    }

    if (connection.isLoading || activeScan.isLoading) {
        return (
            <p className="rounded-[14px] border border-dashed border-[#d6d2cf] bg-white px-[27px] py-[45px] text-center">
                Preparing Gmail scan…
            </p>
        );
    }

    if (connection.isError || activeScan.isError) {
        return (
            <section className="rounded-[14px] border border-dashed border-[#d6d2cf] bg-white px-[27px] py-[45px] text-center">
                <h1 className="my-[7px] text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-.06em]">
                    Gmail status is unavailable
                </h1>
                <p className="text-muted mx-auto mt-[10px] mb-[21px] max-w-[430px]">
                    Refresh the page to check your Gmail connection again.
                </p>
            </section>
        );
    }

    if (!connection.data?.connected) {
        return (
            <>
                <div className="flex items-end justify-between gap-5 py-[54px] max-[760px]:items-start max-[760px]:py-[33px_25px]">
                    <div>
                        <p className="text-violet m-0 text-[.69rem] font-extrabold tracking-[.13em]">
                            GMAIL SCAN
                        </p>
                        <h1 className="my-[7px] text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-.06em]">
                            Connect Gmail first
                        </h1>
                        <p className="text-muted leading-normal">
                            Gmail read-only permission is required before scanning.
                        </p>
                    </div>
                </div>
                <Link
                    className="bg-violet inline-flex rounded-[10px] px-4 py-3 font-[650] text-white no-underline shadow-[0_5px_16px_#4b40e92b] transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-[#3e35d0]"
                    href="/app/settings"
                >
                    Open Settings
                </Link>
            </>
        );
    }

    if (!scanId) {
        return (
            <>
                <div className="flex items-end justify-between gap-5 py-[54px] max-[760px]:items-start max-[760px]:py-[33px_25px]">
                    <div>
                        <p className="text-violet m-0 text-[.69rem] font-extrabold tracking-[.13em]">
                            GMAIL SCAN
                        </p>
                        <h1 className="my-[7px] text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-.06em]">
                            Find your subscriptions
                        </h1>
                        <p className="text-muted leading-normal">
                            We&apos;ll check subscription-related emails from the last year.
                        </p>
                    </div>
                </div>
                <button
                    className="bg-violet cursor-pointer rounded-[10px] border-0 px-[22px] py-[15px] text-base font-[650] text-white no-underline shadow-[0_5px_16px_#4b40e92b] transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-[#3e35d0] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-65"
                    disabled={startScan.isPending}
                    onClick={handleStartScan}
                    type="button"
                >
                    {startScan.isPending ? "Starting scan…" : "Start Gmail scan"}
                </button>
                {startScan.error ? (
                    <p className="text-[.82rem] text-[#c02846]" role="alert">
                        {startScan.error.message}
                    </p>
                ) : null}
            </>
        );
    }

    if (!scan.data || scan.data.status === "RUNNING") {
        return (
            <section className="mt-20 rounded-[14px] border border-[#d6d2cf] bg-white px-[27px] py-[45px] text-center">
                <div className="border-t-violet mx-auto mb-5 size-11 animate-spin rounded-full border-4 border-[#e2e0ff]" />
                <p className="text-violet m-0 text-[.69rem] font-extrabold tracking-[.13em]">
                    SCANNING GMAIL
                </p>
                <h1 className="my-[7px] text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-.06em]">
                    Looking for recurring plans…
                </h1>
                <p className="text-muted leading-normal">
                    Checked {scan.data?.processedMessages ?? 0} emails so far. Keep this
                    tab open while the scan runs.
                </p>
                {processBatch.error ? (
                    <p className="text-[.82rem] text-[#c02846]" role="alert">
                        {processBatch.error.message}
                    </p>
                ) : null}
            </section>
        );
    }

    if (scan.data.status === "NO_RESULTS") {
        return (
            <section className="rounded-[14px] border border-dashed border-[#d6d2cf] bg-white px-[27px] py-[45px] text-center">
                <h1 className="my-[7px] text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-.06em]">
                    No subscriptions found
                </h1>
                <p className="text-muted mx-auto mt-[10px] mb-[21px] max-w-[430px]">
                    We couldn&apos;t identify a recurring plan from the emails checked.
                    You can still add one manually.
                </p>
                <Link
                    className="bg-violet cursor-pointer rounded-[10px] border-0 px-4 py-3 font-[650] text-white no-underline shadow-[0_5px_16px_#4b40e92b] transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-[#3e35d0] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-65"
                    href="/app"
                >
                    Back to dashboard
                </Link>
            </section>
        );
    }

    if (scan.data.status === "FAILED") {
        return (
            <section className="rounded-[14px] border border-dashed border-[#d6d2cf] bg-white px-[27px] py-[45px] text-center">
                <h1 className="my-[7px] text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-.06em]">
                    Gmail needs reconnecting
                </h1>
                <p className="text-muted mx-auto mt-[10px] mb-[21px] max-w-[430px]">
                    Reconnect Gmail in Settings, then start a new scan.
                </p>
                <Link
                    className="bg-violet cursor-pointer rounded-[10px] border-0 px-4 py-3 font-[650] text-white no-underline shadow-[0_5px_16px_#4b40e92b] transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-[#3e35d0] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-65"
                    href="/app/settings"
                >
                    Open settings
                </Link>
            </section>
        );
    }

    return (
        <>
            <div className="flex items-end justify-between gap-5 py-[54px] max-[760px]:items-start max-[760px]:py-[33px_25px]">
                <div>
                    <p className="text-violet m-0 text-[.69rem] font-extrabold tracking-[.13em]">
                        SCAN RESULTS
                    </p>
                    <h1 className="my-[7px] text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-.06em]">
                        We found {scan.data.candidates.length} subscription
                        {scan.data.candidates.length === 1 ? "" : "s"}.
                    </h1>
                    <p className="text-muted leading-normal">
                        Select the plans you want to add. You can edit them later.
                    </p>
                </div>
            </div>
            <div className="grid gap-[10px]">
                {scan.data.candidates.map((candidate) => (
                    <label
                        className="border-line [&>input]:accent-violet [&_small]:text-muted grid cursor-pointer grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-[13px] rounded-xl border bg-white p-[17px] [&_small]:text-[.76rem] [&>b]:text-[.88rem] [&>input]:size-4 [&>span]:grid [&>span]:gap-1"
                        key={candidate.id}
                    >
                        <input
                            checked={selectedCandidateIds.includes(candidate.id)}
                            type="checkbox"
                            onChange={() => toggleCandidate(candidate.id)}
                        />
                        <span>
                            <strong>{candidate.name}</strong>
                            <small>
                                {candidate.category ?? "Other"} · Renews{" "}
                                {formatDate(candidate.nextRenewalOn)}
                            </small>
                        </span>
                        <b>
                            {formatCurrency(candidate.amountMinor, candidate.currency)}/
                            {candidate.billingInterval === "MONTHLY" ? "mo" : "yr"}
                        </b>
                    </label>
                ))}
            </div>
            <div className="mt-6 flex items-center gap-[17px] max-[760px]:flex-wrap">
                <button
                    className="bg-violet cursor-pointer rounded-[10px] border-0 px-[22px] py-[15px] text-base font-[650] text-white no-underline shadow-[0_5px_16px_#4b40e92b] transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-[#3e35d0] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-65"
                    disabled={
                        selectedCandidateIds.length === 0 || confirmCandidates.isPending
                    }
                    onClick={handleConfirmCandidates}
                    type="button"
                >
                    {confirmCandidates.isPending
                        ? "Adding subscriptions…"
                        : "Add selected subscriptions"}
                </button>
                <button
                    className="text-ink hover:text-violet cursor-pointer rounded-[10px] border-0 bg-transparent px-1 py-[9px] font-[650] transition-colors"
                    onClick={() => setShowManualForm((isVisible) => !isVisible)}
                    type="button"
                >
                    {showManualForm ? "Close manual entry" : "Add a plan manually"}
                </button>
            </div>
            {showManualForm ? (
                <ManualSubscriptionForm onDone={() => setShowManualForm(false)} />
            ) : null}
            {confirmCandidates.error ? (
                <p className="text-[.82rem] text-[#c02846]" role="alert">
                    {confirmCandidates.error.message}
                </p>
            ) : null}
        </>
    );
}

function ManualSubscriptionForm({ onDone }: { onDone: () => void }) {
    const createSubscription = api.subscription.create.useMutation();
    const [values, setValues] = useState({
        name: "",
        amount: "",
        billingInterval: "MONTHLY" as "MONTHLY" | "YEARLY",
        nextRenewalOn: "",
        category: "Other",
        cancellationUrl: "",
        reminderEnabled: true,
    });

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await createSubscription.mutateAsync({
            name: values.name,
            amountMinor: Math.round(Number(values.amount) * 100),
            billingInterval: values.billingInterval,
            nextRenewalOn: values.nextRenewalOn,
            category: values.category,
            cancellationUrl: values.cancellationUrl || undefined,
            reminderEnabled: values.reminderEnabled,
        });
        onDone();
    }

    return (
        <form
            className="border-line [&_input]:text-ink [&_input]:outline-violet [&_select]:text-ink [&_select]:outline-violet mt-6 grid max-w-[620px] grid-cols-2 gap-[17px] rounded-[14px] border bg-white p-[25px] max-[760px]:grid-cols-1 max-[760px]:p-[19px] [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-[#d9d6d4] [&_input]:bg-white [&_input]:p-[11px] [&_select]:min-w-0 [&_select]:rounded-lg [&_select]:border [&_select]:border-[#d9d6d4] [&_select]:bg-white [&_select]:p-[11px] [&>label]:grid [&>label]:gap-[7px] [&>label]:text-[.8rem] [&>label]:font-[650] [&>label]:text-[#4d4b51]"
            onSubmit={handleSubmit}
        >
            <label>
                Name
                <input
                    required
                    value={values.name}
                    onChange={(event) =>
                        setValues({ ...values, name: event.target.value })
                    }
                />
            </label>
            <label>
                Amount (USD)
                <input
                    min="0.01"
                    required
                    step="0.01"
                    type="number"
                    value={values.amount}
                    onChange={(event) =>
                        setValues({ ...values, amount: event.target.value })
                    }
                />
            </label>
            <label>
                Billing cycle
                <select
                    value={values.billingInterval}
                    onChange={(event) =>
                        setValues({
                            ...values,
                            billingInterval: event.target.value as "MONTHLY" | "YEARLY",
                        })
                    }
                >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                </select>
            </label>
            <label>
                Next renewal
                <input
                    required
                    type="date"
                    value={values.nextRenewalOn}
                    onChange={(event) =>
                        setValues({ ...values, nextRenewalOn: event.target.value })
                    }
                />
            </label>
            <label>
                Category
                <input
                    required
                    value={values.category}
                    onChange={(event) =>
                        setValues({ ...values, category: event.target.value })
                    }
                />
            </label>
            <label>
                Cancellation link (optional)
                <input
                    placeholder="https://…"
                    type="url"
                    value={values.cancellationUrl}
                    onChange={(event) =>
                        setValues({ ...values, cancellationUrl: event.target.value })
                    }
                />
            </label>
            <label className="col-span-full! flex! flex-row! items-center gap-2">
                <input
                    checked={values.reminderEnabled}
                    type="checkbox"
                    onChange={(event) =>
                        setValues({ ...values, reminderEnabled: event.target.checked })
                    }
                />
                Remind me three days before renewal
            </label>
            <button
                className="bg-violet col-span-full cursor-pointer rounded-[10px] border-0 px-4 py-3 font-[650] text-white no-underline shadow-[0_5px_16px_#4b40e92b] transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-[#3e35d0] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-65"
                disabled={createSubscription.isPending}
                type="submit"
            >
                {createSubscription.isPending ? "Saving…" : "Save subscription"}
            </button>
            {createSubscription.error ? (
                <p className="col-span-full text-[.82rem] text-[#c02846]" role="alert">
                    {createSubscription.error.message}
                </p>
            ) : null}
        </form>
    );
}
