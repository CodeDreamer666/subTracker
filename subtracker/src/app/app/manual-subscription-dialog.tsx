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
}: ManualSubscriptionDialogProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const formRef = useRef<HTMLFormElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const createSubscription = api.subscription.create.useMutation();
  const isOpen = open ?? internalOpen;

  function resetForm() {
    formRef.current?.reset();
    createSubscription.reset();
  }

  function setDialogOpen(nextOpen: boolean) {
    if (open === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (createSubscription.isPending) return;
    setDialogOpen(nextOpen);
    if (!nextOpen) resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createSubscription.reset();
    const formData = new FormData(event.currentTarget);
    const billingInterval = textField(formData, "billingInterval");
    const nextRenewalOn = textField(formData, "nextRenewalOn");

    try {
      await createSubscription.mutateAsync({
        name: textField(formData, "name"),
        price: textField(formData, "price"),
        billingInterval:
          billingInterval === "MONTHLY" || billingInterval === "YEARLY"
            ? billingInterval
            : null,
        nextRenewalOn: nextRenewalOn || null,
      });
    } catch {
      return;
    }

    await utils.subscription.dashboard.invalidate();
    setDialogOpen(false);
    resetForm();

    if (showOverviewAfterCreate) router.push("/app");
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add subscription</DialogTitle>
          <DialogDescription>
            Add a subscription that Gmail did not find.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" ref={formRef} onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold">
            Subscription name
            <input
              autoFocus
              className="border-line focus:ring-violet/15 h-11 rounded-[10px] border bg-white px-3 font-normal transition-shadow outline-none placeholder:text-[#97949f] focus:border-[#8d86ee] focus:ring-2"
              maxLength={120}
              name="name"
              placeholder="ChatGPT Plus"
              required
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
                className="border-line focus:ring-violet/15 h-11 w-full rounded-[10px] border bg-white pr-3 pl-7 font-normal transition-shadow outline-none placeholder:text-[#97949f] focus:border-[#8d86ee] focus:ring-2"
                inputMode="decimal"
                maxLength={12}
                name="price"
                pattern="(?:0|[1-9][0-9]*)(?:\.[0-9]{1,2})?"
                placeholder="20.00"
              />
            </span>
            <small className="text-muted font-normal">USD</small>
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            <span>
              Billing <span className="text-muted font-normal">(optional)</span>
            </span>
            <select
              className="border-line focus:ring-violet/15 h-11 rounded-[10px] border bg-white px-3 font-normal transition-shadow outline-none focus:border-[#8d86ee] focus:ring-2"
              name="billingInterval"
              defaultValue=""
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
              className="border-line focus:ring-violet/15 h-11 rounded-[10px] border bg-white px-3 font-normal transition-shadow outline-none focus:border-[#8d86ee] focus:ring-2"
              name="nextRenewalOn"
              type="date"
            />
          </label>

          {createSubscription.error ? (
            <p className="text-sm text-[#c02846]" role="alert">
              Check the subscription details and try again.
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                disabled={createSubscription.isPending}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={createSubscription.isPending} type="submit">
              {createSubscription.isPending
                ? "Adding subscription…"
                : "Add subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
