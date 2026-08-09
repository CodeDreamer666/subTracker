"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

type BillingInterval = "MONTHLY" | "YEARLY";

type SubscriptionFormValues = {
  name: string;
  amount: string;
  billingInterval: BillingInterval;
  nextRenewalOn: string;
  category: string;
  cancellationUrl: string;
  reminderEnabled: boolean;
};

const initialValues: SubscriptionFormValues = {
  name: "",
  amount: "",
  billingInterval: "MONTHLY",
  nextRenewalOn: "",
  category: "Other",
  cancellationUrl: "",
  reminderEnabled: true,
};

export default function AddSubscriptionPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [values, setValues] = useState(initialValues);
  const createSubscription = api.subscription.create.useMutation();

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
    await utils.subscription.dashboard.invalidate();
    router.push("/app");
  }

  return (
    <>
      <div className="flex items-end justify-between gap-5 py-[54px] max-[760px]:items-start max-[760px]:py-[33px_25px]">
        <div>
          <p className="text-violet m-0 text-[.69rem] font-extrabold tracking-[.13em]">
            MANUAL ENTRY
          </p>
          <h1 className="my-[7px] text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-.06em]">
            Add a subscription
          </h1>
          <p className="text-muted leading-normal">
            Add a plan Gmail did not find.
          </p>
        </div>
      </div>
      <form
        className="border-line [&_input]:text-ink [&_input]:outline-violet [&_select]:text-ink [&_select]:outline-violet grid max-w-[620px] grid-cols-2 gap-[17px] rounded-[14px] border bg-white p-[25px] max-[760px]:grid-cols-1 max-[760px]:p-[19px] [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-[#d9d6d4] [&_input]:bg-white [&_input]:p-[11px] [&_select]:min-w-0 [&_select]:rounded-lg [&_select]:border [&_select]:border-[#d9d6d4] [&_select]:bg-white [&_select]:p-[11px] [&>label]:grid [&>label]:gap-[7px] [&>label]:text-[.8rem] [&>label]:font-[650] [&>label]:text-[#4d4b51]"
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
            required
            min="0.01"
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
                billingInterval: event.target.value as BillingInterval,
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
          className="bg-violet col-span-full cursor-pointer rounded-[10px] border-0 px-[22px] py-[15px] text-base font-[650] text-white shadow-[0_5px_16px_#4b40e92b] transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-[#3e35d0] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-65"
          disabled={createSubscription.isPending}
          type="submit"
        >
          {createSubscription.isPending ? "Saving…" : "Save subscription"}
        </button>
        {createSubscription.error ? (
          <p
            className="col-span-full text-[.82rem] text-[#c02846]"
            role="alert"
          >
            {createSubscription.error.message}
          </p>
        ) : null}
      </form>
    </>
  );
}
