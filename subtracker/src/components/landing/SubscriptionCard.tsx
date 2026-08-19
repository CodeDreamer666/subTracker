import PencilIcon from "../icons/Pencil";

type Subscription = {
    name: string;
    initial: string;
    price: string;
    billing: string;
    renewal: string;
    id: string;
};

export default function SubscriptionCard({ subscription }: { subscription: Subscription }) {
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