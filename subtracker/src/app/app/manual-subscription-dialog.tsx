"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";

type ManualSubscriptionDialogProps = {
    trigger?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showOverviewAfterCreate?: boolean;
    subscription?: {
        id: string;
        name: string;
        amountMinor: number | null;
        billingInterval: "MONTHLY" | "YEARLY" | null;
        nextRenewalOn: Date | null;
    };
};

function textField(formData: FormData, name: string) {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
}

export function ManualSubscriptionDialog({
    trigger,
    open,
    onOpenChange,
    showOverviewAfterCreate = false,
    subscription,
}: ManualSubscriptionDialogProps) {
    const router = useRouter();
    const utils = api.useUtils();
    const formRef = useRef<HTMLFormElement>(null);
    const [internalOpen, setInternalOpen] = useState(false);
    const createSubscription = api.subscription.create.useMutation();
    const updateSubscription = api.subscription.update.useMutation();
    const isOpen = open ?? internalOpen;
    const isPending =
        createSubscription.isPending || updateSubscription.isPending;

    function resetForm() {
        formRef.current?.reset();
        createSubscription.reset();
        updateSubscription.reset();
    }

    function setDialogOpen(nextOpen: boolean) {
        if (open === undefined) setInternalOpen(nextOpen);
        onOpenChange?.(nextOpen);
    }

    function handleOpenChange(nextOpen: boolean) {
        if (isPending) return;
        setDialogOpen(nextOpen);
        if (!nextOpen) resetForm();
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        createSubscription.reset();
        updateSubscription.reset();
        const formData = new FormData(event.currentTarget);
        const billingInterval = textField(formData, "billingInterval");
        const nextRenewalOn = textField(formData, "nextRenewalOn");
        const normalizedBillingInterval: "MONTHLY" | "YEARLY" | null =
            billingInterval === "MONTHLY" || billingInterval === "YEARLY"
                ? billingInterval
                : null;
        const values = {
            name: textField(formData, "name"),
            price: textField(formData, "price"),
            billingInterval: normalizedBillingInterval,
            nextRenewalOn: nextRenewalOn || null,
        };

        try {
            if (subscription) {
                await updateSubscription.mutateAsync({
                    id: subscription.id,
                    ...values,
                });
            } else {
                await createSubscription.mutateAsync(values);
            }
        } catch {
            return;
        }

        await utils.subscription.dashboard.invalidate();
        setDialogOpen(false);
        resetForm();

        if (!subscription && showOverviewAfterCreate) router.push("/app");
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {subscription ? "Edit subscription" : "Add subscription"}
                    </DialogTitle>
                    <DialogDescription>
                        {subscription
                            ? "Update the subscription details shown in Overview."
                            : "Add a subscription that Gmail did not find."}
                    </DialogDescription>
                </DialogHeader>

                <form className="grid gap-5" ref={formRef} onSubmit={handleSubmit}>
                    <label className="grid gap-2 text-sm font-semibold">
                        Subscription name
                        <input
                            autoFocus
                            className="border-line h-11 rounded-[10px] border bg-white px-3 font-normal placeholder:text-[#97949f]"
                            maxLength={120}
                            name="name"
                            placeholder="ChatGPT Plus"
                            required
                            defaultValue={subscription?.name}
                        />
                    </label>

                    <label className="grid gap-2 text-sm font-semibold">
                        <span>
                            Price <span className="text-muted font-normal">(optional)</span>
                        </span>
                        <span className="relative">
                            <span className="text-muted pointer-events-none absolute inset-y-0 left-3 grid place-items-center font-normal">
                                $
                            </span>
                            <input
                                className="border-line h-11 w-full rounded-[10px] border bg-white pr-3 pl-7 font-normal placeholder:text-[#97949f]"
                                inputMode="decimal"
                                maxLength={12}
                                name="price"
                                pattern="(?:0|[1-9][0-9]*)(?:\.[0-9]{1,2})?"
                                placeholder="20.00"
                                defaultValue={
                                    subscription?.amountMinor === null ||
                                        subscription?.amountMinor === undefined
                                        ? ""
                                        : (subscription.amountMinor / 100).toFixed(2)
                                }
                            />
                        </span>
                        <small className="text-muted font-normal">USD</small>
                    </label>

                    <label className="grid gap-2 text-sm font-semibold">
                        <span>
                            Billing <span className="text-muted font-normal">(optional)</span>
                        </span>
                        <select
                            className="border-line h-11 rounded-[10px] border bg-white px-3 font-normal"
                            name="billingInterval"
                            defaultValue={subscription?.billingInterval ?? ""}
                        >
                            <option value="">Not specified</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                    </label>

                    <label className="grid gap-2 text-sm font-semibold">
                        <span>
                            Next renewal{" "}
                            <span className="text-muted font-normal">(optional)</span>
                        </span>
                        <input
                            className="border-line h-11 rounded-[10px] border bg-white px-3 font-normal "
                            name="nextRenewalOn"
                            type="date"
                            defaultValue={subscription?.nextRenewalOn
                                ?.toISOString()
                                .slice(0, 10)}
                        />
                    </label>

                    {createSubscription.error || updateSubscription.error ? (
                        <p className="text-sm text-[#c02846]" role="alert">
                            Check the subscription details and try again.
                        </p>
                    ) : null}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button disabled={isPending} type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button disabled={isPending} type="submit">
                            {isPending
                                ? subscription
                                    ? "Saving changes…"
                                    : "Adding subscription…"
                                : subscription
                                    ? "Save changes"
                                    : "Add subscription"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
