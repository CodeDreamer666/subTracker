"use client";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { ManualSubscriptionDialog } from "./manual-subscription-dialog";

type SubscriptionItem = {
    id: string;
    name: string;
    amountMinor: number | null;
    billingInterval: "MONTHLY" | "YEARLY" | null;
    nextRenewalOn: Date | null;
};

function formatCurrency(amountMinor: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
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

export default function DashboardPage() {
    const subscriptions = api.subscription.dashboard.useQuery();
    const utils = api.useUtils();

    const deleteSubscription = api.subscription.deleteSubscription.useMutation({
        onSuccess: async () => {
            await utils.subscription.dashboard.invalidate();
        },
    });

    const items = subscriptions.data ?? [];

    return (
        <section className="mx-auto w-full max-w-[920px] px-6 py-[clamp(48px,8vw,88px)] max-[620px]:px-4 max-[620px]:pt-9">
            <header className="mb-9 flex flex-col gap-4">
                <div>
                    <h1 className="font-display m-0 text-[clamp(36px,6vw,56px)] leading-[1.02] tracking-[-0.03em]">
                        Your subscriptions
                    </h1>
                    <p className="text-muted mt-4 max-w-[58ch] text-[15px] leading-[1.6]">
                        Review what you pay and when it renews. Subscriptions left here are
                        the ones you want to keep.
                    </p>
                </div>
                <ManualSubscriptionDialog
                    trigger={
                        <Button className="border-brand bg-brand text-surface min-h-11 shrink-0 rounded-xl px-[19px] shadow-[0_9px_22px_color-mix(in_oklch,var(--accent)_22%,transparent)] hover:-translate-y-px max-[430px]:px-3">
                            Add manually
                        </Button>
                    }
                />
            </header>

            <div className="border-line rounded-[22px] border bg-[color-mix(in_oklch,var(--bg)_48%,var(--surface))] p-5 shadow-[0_18px_55px_var(--fg-soft)] max-[620px]:p-3.5">
                {subscriptions.isLoading ? (
                    <p className="text-muted grid min-h-48 place-items-center text-sm">
                        Loading subscriptions…
                    </p>
                ) : items.length ? (
                    <div className="grid gap-3">
                        {items.map((subscription) => (
                            <SubscriptionRow
                                key={subscription.id}
                                subscription={subscription}
                                deleteError={deleteSubscription.isError}
                                isDeleting={deleteSubscription.isPending}
                                onDeleteDialogOpened={deleteSubscription.reset}
                                onDeleted={async (id) => {
                                    await deleteSubscription.mutateAsync({ id });
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <DashboardEmptyState />
                )}

                <p className="text-muted mt-4 flex gap-2.5 text-xs leading-[1.55]">
                    <svg className="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>

                    <span>
                        Cancel with the provider before using Cancel here. subTracker
                        removes the item from this list only.
                    </span>
                </p>
            </div>

            {deleteSubscription.error ? (
                <p className="mt-4 text-sm text-[#c02846]" role="alert">
                    Your change could not be saved. Please try again.
                </p>
            ) : null}
        </section>
    );
}

function DashboardEmptyState() {
    return (
        <section className="border-line bg-surface grid min-h-48 place-items-center rounded-2xl border border-dashed p-7 text-center">
            <div>
                <h2 className="font-display m-0 text-2xl">Your overview is clear</h2>
                <p className="text-muted mt-2 text-sm">
                    Add a subscription manually or scan Gmail from Manage.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Button asChild>
                        <Link href="/app/manage">Scan Gmail</Link>
                    </Button>
                    <ManualSubscriptionDialog
                        trigger={<Button variant="outline">Add manually</Button>}
                    />
                </div>
            </div>
        </section>
    );
}

function SubscriptionRow({
    subscription,
    onDeleteDialogOpened,
    onDeleted,
    deleteError,
    isDeleting,
}: {
    subscription: SubscriptionItem;
    onDeleteDialogOpened: () => void;
    onDeleted: (id: string) => Promise<void>;
    deleteError: boolean;
    isDeleting: boolean;
}) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    return (
        <article className="border-line bg-surface rounded-2xl border p-3">
            <div className="border-line flex items-center justify-between gap-3.5 border-b pb-2.5">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="border-line grid size-[38px] shrink-0 place-items-center rounded-[11px] border bg-[color-mix(in_oklch,var(--fg)_5%,var(--surface))] text-[13px] font-extrabold">
                        {subscription.name.charAt(0).toUpperCase()}
                    </span>
                    <strong className="min-w-0 flex-1 truncate text-sm">
                        {subscription.name}
                    </strong>
                </div>
                <ManualSubscriptionDialog
                    subscription={subscription}
                    trigger={
                        <Button
                            aria-label="Edit subscription"
                            className="text-muted hover:bg-ink-soft hover:text-ink grid size-11 shrink-0 place-items-center rounded-[10px]"
                            size="icon"
                            title="Edit subscription"
                            variant="ghost"
                        >
                            <Pencil aria-hidden="true" className="size-4" />
                        </Button>
                    }
                />
            </div>

            <dl className="border-line grid grid-cols-2 gap-5 border-b py-3 text-sm max-[430px]:grid-cols-1 max-[430px]:gap-3">
                <div>
                    <dt className="text-muted mb-1 font-mono text-[9px] font-bold tracking-[.07em] uppercase">
                        Cost
                    </dt>
                    <dd className="font-mono text-xs font-bold">
                        {subscription.amountMinor !== null ? (
                            <>
                                {formatCurrency(subscription.amountMinor)}
                                {subscription.billingInterval ? (
                                    <span className="text-muted ml-1 text-xs font-normal">
                                        /
                                        {subscription.billingInterval === "MONTHLY"
                                            ? "month"
                                            : "year"}
                                    </span>
                                ) : null}
                            </>
                        ) : (
                            <span className="text-muted text-xs font-normal">
                                Price not found
                            </span>
                        )}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted mb-1 font-mono text-[9px] font-bold tracking-[.07em] uppercase">
                        Next renewal
                    </dt>
                    <dd className="text-muted text-xs">
                        {subscription.nextRenewalOn ? (
                            formatDate(subscription.nextRenewalOn)
                        ) : (
                            <span className="text-muted text-xs font-normal">
                                Renewal date not found
                            </span>
                        )}
                    </dd>
                </div>
            </dl>

            <div className="flex justify-end pt-2">
                <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={(open) => {
                        if (isDeleting) return;
                        if (open) onDeleteDialogOpened();
                        setIsDeleteDialogOpen(open);
                    }}
                >
                    <AlertDialogTrigger asChild>
                        <Button
                            className="min-h-11 rounded-lg px-4 text-[11px]"
                            disabled={isDeleting}
                            size="sm"
                            variant="outline"
                        >
                            Cancel
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove this subscription?</AlertDialogTitle>
                            <AlertDialogDescription className="grid gap-3">
                                <span>
                                    subTracker cannot cancel this subscription with the provider
                                    for you.
                                </span>
                                <span>
                                    We recommend cancelling it through the provider&apos;s website
                                    or app first.
                                </span>
                                <span>
                                    Continuing will only remove this subscription from your
                                    subTracker overview.
                                </span>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {deleteError ? (
                            <p className="text-sm text-[#c02846]" role="alert">
                                This subscription could not be removed. Please try again.
                            </p>
                        ) : null}
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>
                                Go back
                            </AlertDialogCancel>
                            <Button
                                disabled={isDeleting}
                                onClick={async () => {
                                    try {
                                        await onDeleted(subscription.id);
                                    } catch {
                                        return;
                                    }
                                    setIsDeleteDialogOpen(false);
                                }}
                                variant="destructive"
                            >
                                {isDeleting ? "Removing…" : "Remove from subTracker"}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </article>
    );
}
