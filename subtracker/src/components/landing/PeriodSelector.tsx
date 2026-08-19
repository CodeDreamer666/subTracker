export default function PeriodSelector({ wide = false }: { wide?: boolean }) {
    const selected = "All mail";
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
                        className={`min-h-11 rounded-[9px] border px-2 text-[10px] ${isSelected
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