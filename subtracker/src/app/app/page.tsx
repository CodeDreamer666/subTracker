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
import { Separator } from "~/components/ui/separator";
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
        <>
            <header className="flex items-end justify-between gap-5 py-10 max-[760px]:items-start max-[760px]:py-7">
                <div>
                    <p className="text-violet m-0 text-[.69rem] font-extrabold tracking-[.13em]">
                        OVERVIEW
                    </p>
                    <h1 className="my-2 text-[clamp(2rem,4vw,2.75rem)] leading-none tracking-[-.055em]">
                        Your subscriptions
                    </h1>
                    <p className="text-muted leading-normal">
                        Review the subscriptions you track.
                    </p>
                </div>
                <ManualSubscriptionDialog
                    trigger={<Button variant="outline">Add subscription</Button>}
                />
            </header>

            <section>
                <div className="flex items-end justify-between gap-4 pb-4">
                    <div>
                        <h2 className="mb-1 text-xl tracking-[-.035em]">Subscriptions</h2>
                        <p className="text-muted text-sm leading-normal">
                            Review costs and upcoming renewals.
                        </p>
                    </div>
                </div>
                <Separator />

                {subscriptions.isLoading ? (
                    <p className="text-muted py-8 text-sm">Loading subscriptions…</p>
                ) : items.length ? (
                    <div className="grid gap-3 pt-4">
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

                <div className="text-muted border-line mt-6 border-t pt-5 text-sm leading-6">
                    <p className="font-medium text-[#5d5968]">
                        Subscriptions left in your overview are treated as ones you want to
                        keep.
                    </p>
                    <p className="mt-1 text-xs">
                        If you no longer want a subscription, cancel it with the provider
                        first, then remove it from subTracker.
                    </p>
                </div>
            </section>

            {deleteSubscription.error ? (
                <p className="mt-4 text-sm text-[#c02846]" role="alert">
                    Your change could not be saved. Please try again.
                </p>
            ) : null}
        </>
    );
}

function DashboardEmptyState() {
    return (
        <section className="border-line mt-4 grid gap-8 rounded-[14px] border bg-white p-6 sm:grid-cols-[minmax(0,1.2fr)_minmax(240px,.8fr)] sm:p-8">
            <div>
                <h2 className="mt-4 mb-2 text-2xl tracking-[-.045em]">
                    Add your first subscription
                </h2>
                <p className="text-muted max-w-md text-sm leading-6">
                    Connect Gmail from Settings or enter a subscription yourself.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild>
                        <Link href="/app/settings">Scan Gmail</Link>
                    </Button>
                    <ManualSubscriptionDialog
                        trigger={<Button variant="outline">Add subscription</Button>}
                    />
                </div>
            </div>
            <ol className="border-line grid content-center gap-4 border-t pt-6 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-7">
                <li className="grid grid-cols-[28px_1fr] gap-3 text-sm">
                    <span className="bg-soft-violet text-violet grid size-7 place-items-center rounded-full text-xs font-bold">
                        1
                    </span>
                    <span>
                        <strong className="block">Add or connect</strong>
                        <small className="text-muted">
                            Choose the quickest way to begin.
                        </small>
                    </span>
                </li>
                <li className="grid grid-cols-[28px_1fr] gap-3 text-sm">
                    <span className="bg-soft-violet text-violet grid size-7 place-items-center rounded-full text-xs font-bold">
                        2
                    </span>
                    <span>
                        <strong className="block">Review subscriptions</strong>
                        <small className="text-muted">
                            Track costs and renewal dates in Overview.
                        </small>
                    </span>
                </li>
            </ol>
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
        <article className="border-line rounded-xl border bg-white p-4 sm:grid sm:grid-cols-[minmax(180px,1fr)_minmax(190px,.9fr)_auto] sm:items-center sm:gap-5 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
                <span className="bg-soft-violet text-violet grid size-10 shrink-0 place-items-center rounded-[10px] font-extrabold">
                    {subscription.name.charAt(0).toUpperCase()}
                </span>
                <strong className="min-w-0 flex-1 truncate text-sm">
                    {subscription.name}
                </strong>
                <ManualSubscriptionDialog
                    subscription={subscription}
                    trigger={
                        <Button
                            aria-label="Edit subscription"
                            className="text-muted size-8"
                            size="icon"
                            title="Edit subscription"
                            variant="ghost"
                        >
                            <Pencil aria-hidden="true" className="size-4" />
                        </Button>
                    }
                />
            </div>

            <dl className="border-line my-4 grid grid-cols-2 gap-3 border-y py-3 text-sm sm:my-0 sm:border-0 sm:py-0">
                <div>
                    <dt className="text-muted text-[.7rem] font-semibold tracking-[.06em] uppercase">
                        Cost
                    </dt>
                    <dd className="mt-1 font-semibold">
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
                    <dt className="text-muted text-[.7rem] font-semibold tracking-[.06em] uppercase">
                        Next renewal
                    </dt>
                    <dd className="mt-1 font-semibold">
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

            <div className="flex justify-end">
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
                            className="max-[640px]:h-11"
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
