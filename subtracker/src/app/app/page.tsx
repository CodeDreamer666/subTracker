"use client";
import Link from "next/link";
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
import { api } from "~/trpc/react";
import { ManualSubscriptionDialog } from "./manual-subscription-dialog";

type SubscriptionItem = {
  id: string;
  name: string;
  amountMinor: number | null;
  billingInterval: "MONTHLY" | "YEARLY" | null;
  nextRenewalOn: Date | null;
  cancellationUrl: string | null;
  status: "ACTIVE" | "CANCELLED";
  renewalIntent: "UNDECIDED" | "KEEP" | "CANCEL";
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

function decisionFor(subscription: SubscriptionItem) {
  if (
    subscription.status === "CANCELLED" ||
    subscription.renewalIntent === "CANCEL"
  ) {
    return "Cancel";
  }
  if (subscription.renewalIntent === "KEEP") return "Keep";
  return "Undecided";
}

export default function DashboardPage() {
  const subscriptions = api.subscription.dashboard.useQuery();
  const utils = api.useUtils();
  const setIntent = api.subscription.setRenewalIntent.useMutation({
    onSuccess: async () => {
      await utils.subscription.dashboard.invalidate();
    },
  });
  const markCancelled = api.subscription.markCancelled.useMutation({
    onSuccess: async () => {
      await utils.subscription.dashboard.invalidate();
    },
  });

  const items = subscriptions.data ?? [];
  const keepCount = items.filter(
    (subscription) => decisionFor(subscription) === "Keep",
  ).length;
  const cancelCount = items.filter(
    (subscription) => decisionFor(subscription) === "Cancel",
  ).length;
  const undecidedCount = items.length - keepCount - cancelCount;
  const actionsDisabled = setIntent.isPending || markCancelled.isPending;

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
            Decide what to keep or cancel.
          </p>
        </div>
        <ManualSubscriptionDialog
          trigger={<Button variant="outline">Add subscription</Button>}
        />
      </header>

      <section
        aria-label="Subscription decisions"
        className="border-line grid grid-cols-4 overflow-hidden rounded-[14px] border bg-white max-[640px]:grid-cols-2"
      >
        <DecisionMetric label="Total subscriptions" value={items.length} />
        <DecisionMetric label="Keep" value={keepCount} tone="keep" />
        <DecisionMetric label="Cancel" value={cancelCount} tone="cancel" />
        <DecisionMetric label="Undecided" value={undecidedCount} />
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 pb-4">
          <div>
            <h2 className="mb-1 text-xl tracking-[-.035em]">Subscriptions</h2>
            <p className="text-muted text-sm leading-normal">
              Review each renewal and record your decision.
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
                actionsDisabled={actionsDisabled}
                key={subscription.id}
                subscription={subscription}
                onCancelled={async (id) => {
                  await markCancelled.mutateAsync({ id });
                }}
                onIntent={async (id, intent) => {
                  await setIntent.mutateAsync({ id, intent });
                }}
              />
            ))}
          </div>
        ) : (
          <DashboardEmptyState />
        )}
      </section>

      {setIntent.error || markCancelled.error ? (
        <p className="mt-4 text-sm text-[#c02846]" role="alert">
          Your change could not be saved. Please try again.
        </p>
      ) : null}
    </>
  );
}

function DecisionMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "keep" | "cancel";
}) {
  const valueColor =
    tone === "keep"
      ? "text-[#17744d]"
      : tone === "cancel"
        ? "text-[#ad2840]"
        : "text-ink";

  return (
    <div className="border-line flex min-h-28 flex-col justify-between border-r p-5 last:border-r-0 max-[640px]:min-h-24 max-[640px]:border-b max-[640px]:p-4 max-[640px]:even:border-r-0 max-[640px]:nth-[n+3]:border-b-0">
      <span className="text-muted text-xs font-semibold">{label}</span>
      <strong className={`text-3xl tracking-[-.05em] ${valueColor}`}>
        {value}
      </strong>
    </div>
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
            <strong className="block">Make a decision</strong>
            <small className="text-muted">Mark each one Keep or Cancel.</small>
          </span>
        </li>
      </ol>
    </section>
  );
}

function SubscriptionRow({
  subscription,
  onIntent,
  onCancelled,
  actionsDisabled,
}: {
  subscription: SubscriptionItem;
  onIntent: (id: string, intent: "KEEP" | "CANCEL") => Promise<void>;
  onCancelled: (id: string) => Promise<void>;
  actionsDisabled: boolean;
}) {
  const decision = decisionFor(subscription);
  const isCancelled = subscription.status === "CANCELLED";

  return (
    <article className="border-line rounded-xl border bg-white p-4 sm:grid sm:grid-cols-[minmax(180px,1fr)_minmax(190px,.9fr)_auto] sm:items-center sm:gap-5 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-soft-violet text-violet grid size-10 shrink-0 place-items-center rounded-[10px] font-extrabold">
          {subscription.name.charAt(0).toUpperCase()}
        </span>
        <strong className="min-w-0 truncate text-sm">
          {subscription.name}
        </strong>
        <DecisionBadge className="ml-auto sm:hidden" decision={decision} />
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

      <div className="flex flex-wrap items-center gap-2 sm:max-w-72 sm:justify-end">
        <DecisionBadge className="hidden sm:inline-flex" decision={decision} />
        {isCancelled ? null : subscription.renewalIntent === "CANCEL" ? (
          <>
            {subscription.cancellationUrl ? (
              <Button asChild size="sm" variant="outline">
                <a
                  href={subscription.cancellationUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Manage cancellation
                </a>
              </Button>
            ) : null}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="max-[640px]:h-11 max-[640px]:flex-1"
                  disabled={actionsDisabled}
                  size="sm"
                  variant="ghost"
                >
                  I&apos;ve cancelled
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Confirm {subscription.name} is cancelled?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Only confirm after completing the cancellation with the
                    provider. This removes the subscription from your active
                    Overview.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={actionsDisabled}>
                    Not yet
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={actionsDisabled}
                    onClick={async () => {
                      await onCancelled(subscription.id);
                    }}
                  >
                    Confirm cancellation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <>
            <Button
              aria-pressed={subscription.renewalIntent === "KEEP"}
              className="max-[640px]:h-11 max-[640px]:flex-1"
              disabled={actionsDisabled}
              onClick={async () => {
                await onIntent(subscription.id, "KEEP");
              }}
              size="sm"
              variant={
                subscription.renewalIntent === "KEEP" ? "secondary" : "outline"
              }
            >
              Keep
            </Button>
            <Button
              className="max-[640px]:h-11 max-[640px]:flex-1"
              disabled={actionsDisabled}
              onClick={async () => {
                await onIntent(subscription.id, "CANCEL");
              }}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </article>
  );
}

function DecisionBadge({
  decision,
  className,
}: {
  decision: "Keep" | "Cancel" | "Undecided";
  className?: string;
}) {
  const variant =
    decision === "Keep"
      ? "success"
      : decision === "Cancel"
        ? "destructive"
        : "outline";

  return (
    <Badge className={className} variant={variant}>
      {decision}
    </Badge>
  );
}
