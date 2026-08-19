"use client";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import ManualSubscriptionDialog from "~/components/shared/ManualSubscriptionDialog";
import SubscriptionRow from "~/components/app/SubscriptionRow";
import DashboardEmptyState from "~/components/app/DashboardEmptyState";

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
                ) : subscriptions.isError ? (
                    <p
                        className="grid min-h-48 place-items-center text-sm text-[#c02846]"
                        role="alert"
                    >
                        Subscriptions could not be loaded. Please try again.
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
                    <svg
                        className="size-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                        />
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