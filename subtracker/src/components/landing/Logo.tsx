export default function Logo() {
    return (
        <p
            className="inline-flex items-center gap-2.5 text-xl font-[750] tracking-[-0.03em] max-[620px]:text-lg"
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
        </p>
    );
}