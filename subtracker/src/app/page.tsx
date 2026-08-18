"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import { GoogleSignInButton } from "~/app/auth-buttons";

type Subscription = {
  name: string;
  initial: string;
  price: string;
  billing: string;
  renewal: string;
  id: string;
};

const subscriptions: Subscription[] = [
  {
    name: "Nintendo",
    initial: "N",
    price: "$19.90",
    billing: "Monthly",
    renewal: "18 Sep 2026",
    id: "nintendo",
  },
  {
    name: "Netflix",
    initial: "N",
    price: "$15.49",
    billing: "Monthly",
    renewal: "25 Sep 2026",
    id: "netflix",
  },
];

const detectedSubscriptions = [
  {
    id: "staytion-team",
    name: "Staytion Team",
    email: "Welcome to Staytion — Your Complete Workspace Solution",
    price: "$17.50 / month",
  },
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    email: "Your ChatGPT Plus subscription renews monthly",
    price: "$20 / month",
  },
];

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a
      className="inline-flex items-center gap-2.5 text-xl font-[750] tracking-[-0.03em] max-[620px]:text-lg"
      href="#top"
      data-od-id={footer ? "footer-brand-link" : "brand-link"}
      aria-label="subTracker home"
    >
      <span
        className="border-line bg-surface grid size-[30px] content-center gap-1 rounded-[9px] border p-[7px] shadow-[0_5px_16px_var(--fg-soft)]"
        aria-hidden="true"
      >
        <i className="bg-ink block h-0.5 rounded-full" />
        <i className="bg-brand block h-0.5 w-[70%] rounded-full" />
        <i className="bg-ink block h-0.5 rounded-full" />
      </span>
      <span>
        sub<span className="text-brand">Tracker</span>
      </span>
    </a>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="m4 20 4.3-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5.3 16 4 20Z" />
      <path d="m14.5 7 3 3" />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="size-4"
    >
      <path d="M4 7l8 6 8-6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
      <path d="m4 7 3-2h10l3 2" />
    </svg>
  );
}

function PeriodSelector({ wide = false }: { wide?: boolean }) {
  const [selected, setSelected] = useState("All mail");
  const options = ["Past week", "Past month", "Past year", "All mail"];

  return (
    <div
      className={
        wide
          ? "grid grid-cols-4 gap-1.5 max-[620px]:grid-cols-2"
          : "grid grid-cols-2 gap-1.5"
      }
      role="group"
      aria-label="Email history to scan"
    >
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <button
            key={option}
            className={`min-h-11 rounded-[9px] border px-2 text-[10px] ${
              isSelected
                ? "border-ink bg-ink text-surface font-bold"
                : "border-line bg-surface text-ink"
            }`}
            type="button"
            aria-pressed={isSelected}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  return (
    <article
      className="border-line bg-surface rounded-2xl border p-3"
      data-od-id={`subscription-${subscription.id}`}
    >
      <div className="border-line flex items-center justify-between gap-3.5 border-b pb-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="border-line grid size-[38px] shrink-0 place-items-center rounded-[11px] border bg-[color-mix(in_oklch,var(--fg)_5%,var(--surface))] text-[13px] font-extrabold">
            {subscription.initial}
          </span>
          <p className="m-0 text-sm font-bold">{subscription.name}</p>
        </div>
        <button
          className="text-muted grid size-11 place-items-center rounded-[10px] border-0 bg-transparent transition-colors"
          type="button"
          data-od-id={`overview-edit-${subscription.id}`}
          aria-label={`Edit ${subscription.name} subscription`}
        >
          <span className="size-[18px]">
            <PencilIcon />
          </span>
        </button>
      </div>
      <div className="border-line grid grid-cols-2 gap-5 border-b py-3">
        <div>
          <span className="text-muted mb-1 block font-mono text-[9px] font-bold tracking-[0.07em] uppercase">
            Cost
          </span>
          <span className="text-muted text-xs">
            <strong className="text-ink font-mono text-xs font-bold">
              {subscription.price}
            </strong>{" "}
            / month
          </span>
        </div>
        <div>
          <span className="text-muted mb-1 block font-mono text-[9px] font-bold tracking-[0.07em] uppercase">
            Next renewal
          </span>
          <span className="text-muted text-xs">{subscription.renewal}</span>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button
          className="border-line bg-surface text-ink min-h-11 rounded-lg border px-4 text-[11px] transition-colors"
          type="button"
          data-od-id={`overview-cancel-${subscription.id}`}
        >
          Cancel
        </button>
      </div>
    </article>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-muted text-xs" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function SubTrackerLandingPage() {
  return (
    <>
      <header
        className="border-line sticky top-0 z-30 border-b bg-[color-mix(in_oklch,var(--bg)_92%,transparent)] backdrop-blur-2xl"
        data-od-id="topnav"
      >
        <div className="mx-auto flex min-h-[72px] w-full max-w-[1180px] items-center justify-between gap-7 px-8 max-[620px]:min-h-16 max-[620px]:px-5">
          <Brand />
          <div className="ml-auto flex items-center gap-3.5">
            <GoogleSignInButton
              className="border-line bg-surface text-ink inline-flex min-h-11 items-center justify-center rounded-xl border px-[19px] py-2.5 text-sm font-semibold tracking-[-0.01em] transition-[transform,background,border-color] duration-150 hover:-translate-y-px hover:border-[color-mix(in_oklch,var(--fg)_36%,var(--border))] hover:bg-[color-mix(in_oklch,var(--fg)_3%,var(--surface))] active:translate-y-0"
              dataOdId="nav-login"
              label="Log in"
            />
          </div>
        </div>
      </header>

      <main id="content">
        <section
          className="overflow-hidden py-[clamp(68px,8vw,116px)] pb-[clamp(82px,10vw,136px)] max-[620px]:pt-12 max-[620px]:pb-[76px]"
          id="top"
          data-od-id="hero"
        >
          <div className="mx-auto grid w-full max-w-[1180px] grid-cols-[minmax(0,.82fr)_minmax(540px,1.18fr)] items-center gap-[clamp(48px,7vw,100px)] px-8 max-[1050px]:grid-cols-[minmax(0,.75fr)_minmax(500px,1.25fr)] max-[1050px]:gap-[42px] max-[920px]:grid-cols-1 max-[620px]:px-5">
            <div className="max-[920px]:max-w-[650px]">
              <h1
                className="font-display m-0 text-[clamp(46px,5.7vw,76px)] leading-[0.99] tracking-[-0.035em] max-[620px]:text-[clamp(44px,14vw,60px)] max-[620px]:leading-[1.02]"
                data-od-id="hero-heading"
              >
                See what you&apos;re
                <br />
                paying for
                <br />
                <span className="text-brand">Decide what stays</span>
              </h1>
              <p className="text-muted mt-6 max-w-[54ch] text-lg leading-[1.55]">
                subTracker brings your subscriptions into one organised list, so
                you can review what you pay and remove what you no longer want
                to track
              </p>
              <div className="mt-[30px] inline-flex flex-wrap gap-3 max-[620px]:flex max-[620px]:w-full">
                <GoogleSignInButton
                  className="border-brand bg-brand text-surface inline-flex min-h-11 items-center justify-center rounded-xl border px-[19px] py-2.5 text-sm font-semibold tracking-[-0.01em] shadow-[0_9px_22px_color-mix(in_oklch,var(--accent)_22%,transparent)] transition-[transform,background,border-color] duration-150 hover:-translate-y-px hover:border-[color-mix(in_oklch,var(--accent)_88%,var(--fg))] hover:bg-[color-mix(in_oklch,var(--accent)_88%,var(--fg))] active:translate-y-0 max-[620px]:flex-1"
                  dataOdId="hero-get-started"
                  label="Get started"
                />
                <a
                  className="group border-line bg-surface text-ink inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-[19px] py-2.5 text-sm font-semibold tracking-[-0.01em] transition-[transform,background,border-color] duration-150 hover:-translate-y-px hover:border-[color-mix(in_oklch,var(--fg)_36%,var(--border))] hover:bg-[color-mix(in_oklch,var(--fg)_3%,var(--surface))] active:translate-y-0 max-[620px]:flex-1"
                  href="#how-it-works"
                  data-od-id="hero-see-how"
                >
                  See how it works
                  <span className="transition-transform duration-150 group-hover:translate-x-[3px]">
                    →
                  </span>
                </a>
              </div>
              <div
                className="text-muted mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-xs max-[620px]:gap-x-[15px] max-[620px]:gap-y-[9px]"
                data-od-id="hero-product-points"
              >
                {[
                  "Simple overview",
                  "Read-only Gmail access",
                  "Rescan anytime",
                ].map((point) => (
                  <span
                    key={point}
                    className="inline-flex items-center gap-[7px]"
                  >
                    <i className="bg-brand size-[5px] rounded-full" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="relative min-h-[780px] max-w-[680px] max-[620px]:min-h-[736px]"
              data-od-id="hero-product-preview"
            >
              <div className="border-line bg-surface absolute inset-y-0 right-11 left-0 overflow-hidden rounded-3xl border shadow-[0_30px_70px_color-mix(in_oklch,var(--fg)_12%,transparent)] max-[1050px]:right-6 max-[620px]:relative max-[620px]:inset-auto max-[620px]:h-auto max-[620px]:rounded-[20px]">
                <div className="border-line flex h-12 items-center gap-1.5 border-b bg-[color-mix(in_oklch,var(--bg)_56%,var(--surface))] px-[18px] max-[620px]:h-[42px]">
                  <i className="bg-line size-[7px] rounded-full" />
                  <i className="bg-line size-[7px] rounded-full" />
                  <i className="bg-line size-[7px] rounded-full" />
                  <span className="text-muted ml-2 font-mono text-[10px]">
                    subtracker.app / overview
                  </span>
                </div>
                <div className="px-6 pt-6 pb-5 max-[620px]:px-4 max-[620px]:pt-[19px] max-[620px]:pb-[17px]">
                  <div className="flex items-end justify-between gap-4 pb-[17px]">
                    <div>
                      <p className="text-muted m-0 mb-[3px] text-[11px]">
                        Overview
                      </p>
                      <h2
                        className="font-display m-0 text-[27px] tracking-[-0.02em] max-[620px]:text-2xl"
                        data-od-id="overview-heading"
                      >
                        Your subscriptions
                      </h2>
                    </div>
                    <div className="flex gap-2 max-[620px]:hidden">
                      <button
                        className="border-line bg-surface text-ink min-h-11 rounded-[9px] border px-[11px] py-[7px] text-[11px] font-semibold"
                        type="button"
                      >
                        Add manually
                      </button>
                      <button
                        className="border-line bg-surface text-ink min-h-11 rounded-[9px] border px-[11px] py-[7px] text-[11px] font-semibold"
                        type="button"
                      >
                        Scan Gmail
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {subscriptions.map((subscription) => (
                      <SubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                      />
                    ))}
                  </div>
                  <p className="text-muted mt-[15px] flex items-start gap-[9px] text-[10px]">
                    <span>
                      Subscriptions in your overview are ones you keep. Cancel
                      with the provider before removing them from subTracker
                    </span>
                  </p>
                </div>
              </div>

              <aside
                className="border-line bg-surface absolute right-0 bottom-0 w-[310px] rounded-[18px] border p-5 shadow-[0_24px_60px_color-mix(in_oklch,var(--fg)_16%,transparent)] max-[1050px]:w-[292px] max-[620px]:relative max-[620px]:inset-auto max-[620px]:mx-auto max-[620px]:-mt-2 max-[620px]:w-[calc(100%-24px)] max-[620px]:p-[18px]"
                data-od-id="gmail-scan-preview"
              >
                <div className="mb-2.5 flex items-center gap-[11px]">
                  <span
                    className="border-line bg-page grid size-[34px] place-items-center rounded-[10px] border"
                    aria-hidden="true"
                  >
                    <span className="size-[19px]">
                      <GmailIcon />
                    </span>
                  </span>
                  <h3 className="font-display m-0 text-base">Scan Gmail</h3>
                </div>
                <p className="text-muted mb-3.5 text-xs leading-[1.45]">
                  We&apos;ll look for subscription emails and add what we find
                  to your overview
                </p>
                <p className="text-muted mb-2 font-mono text-[9px] tracking-[0.08em] uppercase">
                  Scan period
                </p>
                <PeriodSelector />
                <button
                  className="border-ink bg-ink text-surface mt-2.5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-[19px] py-2.5 text-xs font-semibold tracking-[-0.01em] transition-[transform,background,border-color] duration-150"
                  type="button"
                  data-od-id="start-scan"
                >
                  Start scan
                </button>
              </aside>
            </div>
          </div>
        </section>

        <section
          className="border-line border-t py-[clamp(64px,9vw,112px)]"
          id="features"
          data-od-id="features"
        >
          <div className="mx-auto grid w-full max-w-[1180px] grid-cols-[.72fr_1.28fr] items-start gap-[clamp(48px,8vw,110px)] px-8 max-[920px]:grid-cols-1 max-[620px]:px-5">
            <div className="sticky top-[116px] max-[920px]:static">
              <h2
                className="font-display m-0 text-[clamp(34px,4vw,52px)] leading-[1.06] tracking-[-0.025em] max-[620px]:text-[clamp(34px,10vw,44px)]"
                data-od-id="features-heading"
              >
                Everything you need to review subscriptions
              </h2>
              <p className="text-muted mt-[18px] max-w-[54ch] text-lg leading-[1.55]">
                No analytics dashboard and no decision labels, just the
                information and actions that help you understand what stays
              </p>
            </div>

            <div className="grid gap-4">
              <article
                className="border-line grid grid-cols-[46px_minmax(0,1fr)] gap-4 border-t pt-6 pb-1.5 max-[620px]:grid-cols-[38px_1fr] max-[620px]:gap-3"
                data-od-id="feature-scan-gmail"
              >
                <span className="border-line bg-surface text-muted grid size-[38px] place-items-center rounded-xl border font-mono text-[11px]">
                  01
                </span>
                <div>
                  <h3 className="font-display m-0 text-[21px] leading-[1.25] font-semibold">
                    Scan Gmail
                  </h3>
                  <p className="text-muted mt-1.5 text-sm">
                    Choose how much email history to scan and bring detected
                    subscriptions into subTracker
                  </p>
                  <div className="border-line bg-surface mt-[15px] rounded-[14px] border p-3.5">
                    <PeriodSelector wide />
                  </div>
                </div>
              </article>

              <article
                className="border-line grid grid-cols-[46px_minmax(0,1fr)] gap-4 border-t pt-6 pb-1.5 max-[620px]:grid-cols-[38px_1fr] max-[620px]:gap-3"
                data-od-id="feature-add-manually"
              >
                <span className="border-line bg-surface text-muted grid size-[38px] place-items-center rounded-xl border font-mono text-[11px]">
                  02
                </span>
                <div>
                  <h3 className="font-display m-0 text-[21px] leading-[1.25] font-semibold">
                    Add manually
                  </h3>
                  <p className="text-muted mt-1.5 text-sm">
                    Add subscriptions that were not found through Gmail, with
                    only the subscription name required
                  </p>
                  <div className="border-line bg-surface mt-[15px] grid grid-cols-2 items-end gap-3 rounded-[14px] border p-3.5 max-[620px]:grid-cols-1">
                    <Field label="Subscription name" htmlFor="manual-name">
                      <input
                        className="border-line bg-surface text-ink focus:border-brand min-h-11 w-full rounded-[10px] border px-3 py-2.5 text-sm focus:outline-[3px] focus:outline-[color-mix(in_oklch,var(--accent)_22%,transparent)]"
                        id="manual-name"
                        defaultValue="Adobe Photography"
                        data-od-id="manual-name-field"
                        readOnly={true}
                      />
                    </Field>
                    <Field label="Cost (optional)" htmlFor="manual-price">
                      <input
                        className="border-line bg-surface text-ink focus:border-brand min-h-11 w-full rounded-[10px] border px-3 py-2.5 font-mono text-sm focus:outline-[3px] focus:outline-[color-mix(in_oklch,var(--accent)_22%,transparent)]"
                        id="manual-price"
                        defaultValue="$19.99"
                        data-od-id="manual-cost-field"
                        readOnly={true}
                      />
                    </Field>
                    <Field
                      label="Billing interval (optional)"
                      htmlFor="manual-billing"
                    >
                      <select
                        className="border-line bg-surface text-ink focus:border-brand min-h-11 w-full rounded-[10px] border px-3 py-2.5 text-sm focus:outline-[3px] focus:outline-[color-mix(in_oklch,var(--accent)_22%,transparent)]"
                        id="manual-billing"
                        defaultValue="Monthly"
                        data-od-id="manual-billing-field"
                      >
                        <option>Not specified</option>
                        <option>Monthly</option>
                        <option>Yearly</option>
                      </select>
                    </Field>
                    <Field
                      label="Next renewal date (optional)"
                      htmlFor="manual-renewal"
                    >
                      <input
                        className="border-line bg-surface text-ink focus:border-brand min-h-11 w-full rounded-[10px] border px-3 py-2.5 text-sm focus:outline-[3px] focus:outline-[color-mix(in_oklch,var(--accent)_22%,transparent)]"
                        id="manual-renewal"
                        defaultValue="18 Sep 2026"
                        data-od-id="manual-renewal-field"
                        readOnly={true}
                      />
                    </Field>
                    <button
                      className="border-line bg-surface text-ink col-span-2 inline-flex min-h-11 items-center justify-center justify-self-end rounded-xl border px-[19px] py-2.5 text-sm font-semibold tracking-[-0.01em] transition-[transform,background,border-color] duration-150 max-[620px]:col-auto max-[620px]:w-full"
                      type="button"
                    >
                      Add subscription
                    </button>
                  </div>
                </div>
              </article>

              <article
                className="border-line grid grid-cols-[46px_minmax(0,1fr)] gap-4 border-t pt-6 pb-1.5 max-[620px]:grid-cols-[38px_1fr] max-[620px]:gap-3"
                data-od-id="feature-review-one-place"
              >
                <span className="border-line bg-surface text-muted grid size-[38px] place-items-center rounded-xl border font-mono text-[11px]">
                  03
                </span>
                <div>
                  <h3 className="font-display m-0 text-[21px] leading-[1.25] font-semibold">
                    Review in one place
                  </h3>
                  <p className="text-muted mt-1.5 text-sm">
                    See the subscription name, cost, billing interval, and next
                    renewal, then edit details or begin removal
                  </p>
                  <div
                    className="border-line bg-surface mt-[15px] rounded-2xl border p-[18px]"
                    data-od-id="review-subscription-card"
                  >
                    <div className="border-line flex items-center justify-between gap-3.5 border-b pb-[17px]">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="bg-brand-soft text-brand grid size-[42px] shrink-0 place-items-center rounded-[11px] border border-transparent text-[13px] font-extrabold">
                          A
                        </span>
                        <strong className="text-sm">Adobe Photography</strong>
                      </div>
                      <button
                        className="text-muted grid size-11 place-items-center rounded-[10px] border-0 bg-transparent transition-colors"
                        type="button"
                        aria-label="Edit Adobe Photography subscription"
                      >
                        <span className="size-[18px]">
                          <PencilIcon />
                        </span>
                      </button>
                    </div>
                    <div className="border-line grid grid-cols-2 gap-[22px] border-b py-[18px] max-[620px]:gap-3.5">
                      <div>
                        <span className="text-muted mb-[7px] block font-mono text-[10px] font-bold tracking-[0.07em] uppercase">
                          Cost
                        </span>
                        <span className="text-muted block text-[13px]">
                          <strong className="text-ink font-mono font-semibold">
                            $19.99
                          </strong>{" "}
                          / month
                        </span>
                      </div>
                      <div>
                        <span className="text-muted mb-[7px] block font-mono text-[10px] font-bold tracking-[0.07em] uppercase">
                          Next renewal
                        </span>
                        <span className="text-muted block text-[13px]">
                          18 Sep 2026
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end pt-[18px]">
                      <button
                        className="border-line bg-surface text-ink min-h-11 rounded-lg border px-4 text-[11px] transition-colors"
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </article>

              <article
                className="border-line grid grid-cols-[46px_minmax(0,1fr)] gap-4 border-t pt-6 pb-1.5 max-[620px]:grid-cols-[38px_1fr] max-[620px]:gap-3"
                data-od-id="feature-stay-in-control"
              >
                <span className="border-line bg-surface text-muted grid size-[38px] place-items-center rounded-xl border font-mono text-[11px]">
                  04
                </span>
                <div>
                  <h3 className="font-display m-0 text-[21px] leading-[1.25] font-semibold">
                    Stay in control
                  </h3>
                  <p className="text-muted mt-1.5 text-sm">
                    subTracker does not cancel subscriptions for you, you remain
                    responsible for cancelling through the actual provider
                  </p>
                  <div className="border-line mt-[15px] flex items-start gap-3 rounded-[14px] border bg-[color-mix(in_oklch,var(--accent)_5%,var(--surface))] p-3.5">
                    <svg
                      className="mt-0.5 size-[18px] shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      aria-hidden="true"
                    >
                      <path d="M12 3 4 6v6c0 4.4 3.1 7.3 8 9 4.9-1.7 8-4.6 8-9V6l-8-3Z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    <div>
                      <strong className="text-sm">
                        External cancellation stays with you
                      </strong>
                      <p className="text-muted mt-1.5 text-sm">
                        Removing an item changes your subTracker overview only
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          className="border-line border-t py-[clamp(64px,9vw,112px)]"
          id="how-it-works"
          data-od-id="how-it-works"
        >
          <div className="mx-auto w-full max-w-[1180px] px-8 max-[620px]:px-5">
            <div className="mb-[58px] flex items-end justify-between gap-10 max-[920px]:flex-col max-[920px]:items-start max-[620px]:mb-9">
              <div className="max-w-[700px]">
                <h2
                  className="font-display m-0 text-[clamp(34px,4vw,52px)] leading-[1.06] tracking-[-0.025em] max-[620px]:text-[clamp(34px,10vw,44px)]"
                  data-od-id="walkthrough-heading"
                >
                  How subTracker works
                </h2>
              </div>
              <p className="text-muted max-w-[54ch] text-lg leading-[1.55]">
                Find the subscriptions, check the details, then remove only what
                you no longer want to track
              </p>
            </div>

            <div className="border-ink border-t">
              <article
                className="border-line grid grid-cols-[90px_.85fr_1.15fr] items-start gap-8 border-b py-10 max-[920px]:grid-cols-[60px_1fr] max-[620px]:grid-cols-1 max-[620px]:gap-3.5 max-[620px]:py-[30px]"
                data-od-id="step-find-subscriptions"
              >
                <span className="text-muted pt-[5px] font-mono text-xs">
                  Step 01
                </span>
                <div>
                  <h3 className="font-display m-0 text-[21px] leading-[1.25] font-semibold">
                    Find subscriptions
                  </h3>
                  <p className="text-muted mt-2.5 text-[15px]">
                    Connect Gmail and choose how much history to scan, or add a
                    subscription manually
                  </p>
                </div>
                <div
                  className="border-line bg-surface rounded-2xl border p-[18px] shadow-[0_12px_32px_var(--fg-soft)] max-[920px]:col-start-2 max-[620px]:col-start-1"
                  data-od-id="step-one-scan-period"
                >
                  <PeriodSelector wide />
                </div>
              </article>

              <article
                className="border-line grid grid-cols-[90px_.85fr_1.15fr] items-start gap-8 border-b py-10 max-[920px]:grid-cols-[60px_1fr] max-[620px]:grid-cols-1 max-[620px]:gap-3.5 max-[620px]:py-[30px]"
                data-od-id="step-review-subscriptions"
              >
                <span className="text-muted pt-[5px] font-mono text-xs">
                  Step 02
                </span>
                <div>
                  <h3 className="font-display m-0 text-[21px] leading-[1.25] font-semibold">
                    Confirm what Gmail found
                  </h3>
                  <p className="text-muted mt-2.5 text-[15px]">
                    Review each possible subscription and select only the ones
                    that look correct before adding them to Overview
                  </p>
                </div>
                <div
                  className="border-line bg-surface grid gap-3 rounded-2xl border p-[18px] shadow-[0_12px_32px_var(--fg-soft)] max-[920px]:col-start-2 max-[620px]:col-start-1"
                  data-od-id="scan-result-confirmation"
                >
                  <div className="border-line border-b pb-3.5">
                    <span className="bg-brand-soft text-brand inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] tracking-[0.04em] uppercase">
                      Scan results
                    </span>
                    <strong className="mt-2.5 block text-sm">
                      Gmail found 2 possible subscriptions
                    </strong>
                    <p className="text-muted mt-1 text-[11px]">
                      Confirm what belongs in your Overview
                    </p>
                  </div>
                  <div className="grid gap-[9px]">
                    {detectedSubscriptions.map((candidate) => {
                      return (
                        <label
                          key={candidate.id}
                          className="border-line bg-surface grid min-h-11 grid-cols-[22px_minmax(0,1fr)] items-start gap-[11px] rounded-xl border p-[13px]"
                        >
                          <input
                            className="accent-ink mt-px size-5"
                            type="checkbox"
                            checked
                            readOnly
                          />
                          <span className="min-w-0">
                            <strong className="block text-[13px]">
                              {candidate.name}
                            </strong>
                            <span className="text-muted mt-0.5 block text-[10px] leading-[1.4]">
                              {candidate.email}
                            </span>
                            <strong className="mt-2 block font-mono text-xs">
                              {candidate.price}
                            </strong>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-0.5 max-[620px]:flex-col max-[620px]:items-stretch">
                    <button
                      className="border-brand bg-brand text-surface inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border px-[19px] py-2.5 text-[11px] font-semibold tracking-[-0.01em] shadow-[0_9px_22px_color-mix(in_oklch,var(--accent)_22%,transparent)] transition-[transform,background,border-color] duration-150 max-[620px]:w-full"
                      type="button"
                    >
                      Add 2 Subscriptions
                    </button>
                    <div className="text-muted flex items-center justify-end gap-[5px] text-[13px] leading-[1.4]">
                      <span>Didn&apos;t find one?</span>
                      <button
                        className="text-ink min-h-11 rounded-[9px] border-0 bg-transparent px-0 py-2 text-left text-[13px] font-bold"
                        type="button"
                      >
                        Add manually
                      </button>
                    </div>
                  </div>
                </div>
              </article>

              <article
                className="border-line grid grid-cols-[90px_.85fr_1.15fr] items-start gap-8 border-b py-10 max-[920px]:grid-cols-[60px_1fr] max-[620px]:grid-cols-1 max-[620px]:gap-3.5 max-[620px]:py-[30px]"
                data-od-id="step-remove-subscription"
              >
                <span className="text-muted pt-[5px] font-mono text-xs">
                  Step 03
                </span>
                <div>
                  <h3 className="font-display m-0 text-[21px] leading-[1.25] font-semibold">
                    Remove what you no longer want
                  </h3>
                  <p className="text-muted mt-2.5 text-[15px]">
                    Cancel with the provider first, then confirm removal from
                    your subTracker overview
                  </p>
                </div>
                <div
                  className="border-line bg-surface grid grid-cols-[1fr_22px_1fr_22px_1fr] items-center gap-1.5 rounded-2xl border p-[18px] shadow-[0_12px_32px_var(--fg-soft)] max-[920px]:col-start-2 max-[620px]:col-start-1 max-[620px]:grid-cols-1"
                  data-od-id="removal-flow-preview"
                >
                  <div className="border-ink bg-ink text-surface grid min-h-[60px] place-items-center rounded-xl border p-2.5 text-center text-[11px]">
                    <strong>1. Cancel with provider</strong>
                  </div>
                  <span className="text-muted text-center max-[620px]:rotate-90">
                    →
                  </span>
                  <div className="border-line grid min-h-[60px] place-items-center rounded-xl border p-2.5 text-center text-[11px]">
                    <strong>2. Click Cancel in subTracker</strong>
                  </div>
                  <span className="text-muted text-center max-[620px]:rotate-90">
                    →
                  </span>
                  <div className="border-line grid min-h-[60px] place-items-center rounded-xl border p-2.5 text-center text-[11px]">
                    <strong>3. Confirm list removal</strong>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          className="border-line border-t py-[clamp(64px,9vw,112px)]"
          id="privacy"
          data-od-id="privacy"
        >
          <div className="mx-auto grid w-full max-w-[1180px] grid-cols-[.9fr_1.1fr] items-center gap-[clamp(52px,9vw,120px)] px-8 max-[920px]:grid-cols-1 max-[620px]:px-5">
            <div>
              <h2
                className="font-display m-0 text-[clamp(34px,4vw,52px)] leading-[1.06] tracking-[-0.025em] max-[620px]:text-[clamp(34px,10vw,44px)]"
                data-od-id="privacy-heading"
              >
                Your inbox stays yours
              </h2>
              <p className="text-muted mt-[18px] max-w-[54ch] text-lg leading-[1.55]">
                Gmail access is used to find subscription information, with
                every scan started and scoped by you
              </p>
              <ul className="mt-7 grid list-none gap-[13px] p-0">
                {[
                  "Messages are read for subscription information, not edited or deleted",
                  "Scanning begins only when you choose to start it",
                  "You choose how far back subTracker looks",
                ].map((item) => (
                  <li key={item} className="text-muted flex gap-2.5">
                    <svg
                      className="text-ink mt-[3px] size-[18px] shrink-0"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="m4 10 4 4 8-8" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="border-line bg-surface rounded-[22px] border p-[30px] shadow-[0_22px_55px_var(--fg-soft)] max-[620px]:p-[22px]"
              data-od-id="gmail-permission-card"
            >
              <div className="border-line flex items-center gap-3.5 border-b pb-[22px]">
                <span className="border-line bg-page grid size-8 place-items-center rounded-[10px] border">
                  <GmailIcon />
                </span>
                <div>
                  <p className="font-display m-0 text-[13px] font-semibold">
                    Gmail connection
                  </p>
                  <p className="text-muted mt-0.75 text-xs">
                    Read-only subscription scanning
                  </p>
                </div>
              </div>
              <div className="border-line flex gap-3.5 border-b py-[18px]">
                <span className="border-line text-ink grid size-8 shrink-0 place-items-center rounded-[10px] border">
                  <svg
                    className="size-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 5h14v10H3z" />
                    <path d="m3 5 7 5 7-5" />
                  </svg>
                </span>
                <div>
                  <strong className="text-[13px]">
                    Find subscription emails
                  </strong>
                  <p className="text-muted mt-[3px] text-xs">
                    Look for recurring-payment details that can be added to your
                    overview
                  </p>
                </div>
              </div>
              <div className="border-line flex gap-3.5 border-b py-[18px]">
                <span className="border-line text-ink grid size-8 shrink-0 place-items-center rounded-[10px] border">
                  <svg
                    className="size-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="10" cy="10" r="7" />
                    <path d="M10 6v4l3 2" />
                  </svg>
                </span>
                <div>
                  <strong className="text-[13px]">
                    You choose the time range
                  </strong>
                  <p className="text-muted mt-[3px] text-xs">
                    Past week, past month, past year, or all mail
                  </p>
                </div>
              </div>
              <div
                className="border-line flex gap-3.5 border-b py-[18px]"
                data-od-id="usd-accuracy-note"
              >
                <span className="border-line text-ink grid size-8 shrink-0 place-items-center rounded-[10px] border font-mono">
                  $
                </span>
                <div>
                  <strong className="text-[13px]">USD-focused estimates</strong>
                  <p className="text-muted mt-[3px] text-xs">
                    Converted prices use a reference rate and may differ
                    slightly from the final charge; edit missing details or add
                    a subscription manually
                  </p>
                </div>
              </div>
              <p className="text-muted mt-[18px] text-[11px]">
                subTracker does not edit, delete, or send Gmail messages
              </p>
            </div>
          </div>
        </section>

        <section
          className="border-line border-t py-[clamp(64px,9vw,112px)]"
          id="get-started"
          data-od-id="cta-strip"
        >
          <div
            className="mx-auto grid w-full max-w-[1180px] grid-cols-[minmax(0,1fr)_auto] items-end gap-[clamp(32px,7vw,88px)] px-8 text-left max-[620px]:grid-cols-1 max-[620px]:gap-6 max-[620px]:px-5"
            id="login"
          >
            <div className="max-w-[720px]">
              <h2
                className="font-display m-0 text-[clamp(34px,4vw,52px)] leading-[1.06] tracking-[-0.025em] max-[620px]:text-[clamp(34px,10vw,44px)]"
                data-od-id="cta-heading"
              >
                See your subscriptions clearly
              </h2>
              <p className="text-muted mt-[15px] max-w-[54ch] text-lg leading-[1.55]">
                One overview for what you pay and what stays
              </p>
            </div>
            <GoogleSignInButton
              className="border-brand bg-brand text-surface mb-[5px] inline-flex min-h-11 items-center justify-center justify-self-end rounded-xl border px-[19px] py-2.5 text-sm font-semibold tracking-[-0.01em] shadow-[0_9px_22px_color-mix(in_oklch,var(--accent)_22%,transparent)] transition-[transform,background,border-color] duration-150 hover:-translate-y-px hover:border-[color-mix(in_oklch,var(--accent)_88%,var(--fg))] hover:bg-[color-mix(in_oklch,var(--accent)_88%,var(--fg))] max-[620px]:mb-0 max-[620px]:justify-self-start"
              dataOdId="cta-get-started"
              label="Get started"
            />
          </div>
        </section>
      </main>

      <footer
        className="border-line text-muted border-t py-11 text-[13px]"
        data-od-id="footer"
      >
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-5 px-8 max-[620px]:flex-col max-[620px]:items-start max-[620px]:px-5">
          <Brand footer />
          <span className="text-muted font-mono text-xs">
            © 2026 subTracker
          </span>
        </div>
      </footer>
    </>
  );
}
