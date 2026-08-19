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
import { formatSubscriptionAmount } from "~/lib/subscription-amount";
import { formatSubscriptionDate } from "~/lib/subscription-date";
import { type EditableSubscription } from "../shared/ManualSubscriptionDialog";
import ManualSubscriptionDialog from "../shared/ManualSubscriptionDialog";

export default function SubscriptionRow({
    subscription,
    onDeleteDialogOpened,
    onDeleted,
    deleteError,
    isDeleting,
}: {
    subscription: EditableSubscription;
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
                                {formatSubscriptionAmount(subscription.amountMinor)}
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
                            formatSubscriptionDate(subscription.nextRenewalOn)
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