import {
    CheckCircle2,
    Clock3,
    LockKeyhole,
    Pencil,
    Plus,
    RefreshCw,
    ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { GoogleSignInButton } from "~/app/auth-buttons";

type LandingPageProps = {
    authenticated: boolean;
    authError: boolean;
};

const previewSubscriptions = [
    {
        name: "Netflix",
        price: "$15.49",
        renewal: "May 28, 2025",
        initial: "N",
        color: "bg-[#111114] text-[#e50914]",
    },
    {
        name: "Spotify",
        price: "$10.99",
        renewal: "May 30, 2025",
        initial: "S",
        color: "bg-[#42d77d] text-[#111114]",
    },
    {
        name: "Nintendo",
        price: "$19.90",
        renewal: "Jun 1, 2025",
        initial: "N",
        color: "bg-[#ef4a4f] text-white",
    },
    {
        name: "Notion",
        price: "$8.00",
        renewal: "Jun 4, 2025",
        initial: "N",
        color: "bg-[#e8e5ff] text-[#5547df]",
    },
];

export function LandingPage({ authenticated, authError }: LandingPageProps) {
    return (
        <main className="overflow-hidden bg-white text-[#11182e]">
            <LandingNav authenticated={authenticated} />

            <section className="relative px-4 pt-12 sm:px-8 sm:pt-16 lg:pt-20 pb-12">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_67%_16%,rgba(93,76,242,.12),transparent_29rem)]"
                />
                <div className="relative mx-auto grid max-w-[1180px] items-center gap-14 lg:grid-cols-[.86fr_1.14fr] lg:gap-12">
                    <div className="pt-2 text-center motion-safe:animate-[landing-rise_650ms_cubic-bezier(.2,.8,.2,1)_both] lg:pt-5 lg:text-left">
                        <h1 className="mt-6 text-[clamp(2.8rem,4.55vw,3.6rem)] leading-[1.04] font-bold tracking-[-0.055em]">
                            See what you’re
                            <br />
                            paying for.
                            <br />
                            <span className="text-[#5145ec]">Decide what stays</span>
                        </h1>
                        <p className="text-muted mx-auto mt-6 max-w-[450px] text-base leading-7 lg:mx-0">
                            subTracker brings your subscriptions into one organised list, so
                            you can review what you pay and remove what you no longer want to
                            track
                        </p>

                        <div className="mt-7 w-full flex flex-col items-stretch gap-3">
                            <PrimaryAction authenticated={authenticated} />
                        </div>

                        {authError ? (
                            <p
                                className="mt-4 rounded-lg border border-[#f0c8cf] bg-[#fff5f6] px-4 py-3 text-sm text-[#9e283c]"
                                role="alert"
                            >
                                Google sign-in could not be completed Please try again
                            </p>
                        ) : null}

                        <div className="text-muted mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] lg:justify-start">
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                Simple Overview
                            </span>
                            <span className="flex items-center gap-1.5">
                                <LockKeyhole className="size-3.5" aria-hidden="true" />
                                Read-only Gmail access
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock3 className="size-3.5" aria-hidden="true" />
                                Rescan anytime
                            </span>
                        </div>
                    </div>

                    <figure
                        aria-label="Illustrative subTracker Overview with Gmail scan panel"
                        className="relative mx-auto w-full max-w-[650px]"
                    >
                        <div className="border-line overflow-hidden rounded-2xl border bg-white shadow-[0_28px_70px_rgba(58,47,145,.13)]">
                            <div className="flex items-start justify-between gap-3 px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
                                <div>
                                    <h2 className="text-lg font-bold tracking-[-0.035em]">Overview</h2>
                                    <p className="text-muted mt-1 text-[10px]">
                                        Your subscriptions at a glance
                                    </p>
                                </div>
                                <div className="flex gap-2" aria-hidden="true">
                                    <span className="border-line hidden h-9 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-bold sm:flex">
                                        <Plus className="size-3.5" />
                                        Add manually
                                    </span>
                                    <span className="border-line grid size-9 place-items-center rounded-lg border">
                                        <RefreshCw className="size-3.5" />
                                    </span>
                                </div>
                            </div>

                            <div className="text-muted hidden grid-cols-[1fr_100px_92px] px-[72px] pb-2 text-[8px] font-semibold uppercase sm:grid">
                                <span />
                                <span>Cost</span>
                                <span>Next renewal</span>
                            </div>

                            <div className="grid gap-2 px-3 sm:px-5">
                                {previewSubscriptions.map((subscription) => (
                                    <div
                                        className="border-line grid min-h-[62px] grid-cols-[34px_minmax(68px,1fr)_auto_auto] items-center gap-2 rounded-[10px] border px-2.5 shadow-[0_2px_5px_rgba(24,27,48,.025)] sm:grid-cols-[36px_minmax(90px,1fr)_96px_82px_18px_56px] sm:gap-2.5 sm:px-3"
                                        key={subscription.name}
                                    >
                                        <span
                                            className={`grid size-8 place-items-center rounded-lg text-base font-extrabold sm:size-9 ${subscription.color}`}
                                        >
                                            {subscription.initial}
                                        </span>
                                        <span className="min-w-0">
                                            <strong className="block truncate text-[10px] sm:text-[11px]">
                                                {subscription.name}
                                            </strong>
                                        </span>
                                        <span className="text-[9px] whitespace-nowrap sm:text-[10px]">
                                            <strong>{subscription.price}</strong>
                                            <small className="text-muted ml-0.5 hidden text-[8px] sm:inline">
                                                /month
                                            </small>
                                        </span>
                                        <span className="text-muted hidden text-[8px] whitespace-nowrap sm:block">
                                            {subscription.renewal}
                                        </span>
                                        <Pencil
                                            className="text-muted hidden size-3 sm:block"
                                            aria-hidden="true"
                                        />
                                        <span className="border-line rounded-md border px-1 py-2 text-center text-[8px] sm:px-2">
                                            Cancel
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-muted flex min-h-[66px] items-start gap-2 px-4 py-4 text-[9px] leading-4 sm:items-center sm:px-6 sm:py-0">
                                <ShieldCheck
                                    className="mt-0.5 size-3.5 shrink-0 sm:mt-0"
                                    aria-hidden="true"
                                />
                                Subscriptions left in your Overview are treated as ones you want to
                                keep
                            </div>
                        </div>
                    </figure>
                </div>
            </section>
        </main>
    );
}

function LandingNav({ authenticated }: { authenticated: boolean }) {
    return (
        <header className="border-line border-b bg-white/95 px-4 sm:px-8">
            <div className="mx-auto h-[68px] max-w-[1180px] flex justify-between items-center">
                <Logo />

                <PrimaryAction authenticated={authenticated} />
            </div>
        </header>
    );
}

function PrimaryAction({
    authenticated,
    compact = false,
}: {
    authenticated: boolean;
    compact?: boolean;
}) {
    if (authenticated) {
        return (
            <Link
                className={`bg-violet inline-flex min-h-12 items-center justify-center rounded-lg px-6 text-sm font-bold text-white shadow-[0_8px_18px_rgba(81,69,236,.18)] transition-transform hover:-translate-y-px ${compact ? "min-h-10 px-5" : "sm:min-w-[145px]"}`}
                href="/app"
            >
                Open Overview
            </Link>
        );
    }

    return <GoogleSignInButton label="Get started" />;
}

function Logo() {
    return (
        <span className="inline-flex items-center gap-3">
            <span
                className="
            relative grid size-11 shrink-0 place-items-center
            overflow-hidden rounded-[13px]
            bg-[linear-gradient(145deg,#91d2ff_0%,#826ff5_100%)]
            shadow-[0_8px_22px_rgba(99,81,229,0.2)]
        "
            >
                <span className="absolute inset-x-1 top-1 h-5 rounded-full bg-white/15 blur-md" />

                <span className="relative flex w-[23px] flex-col gap-[4px]">
                    <span className="flex items-center gap-[4px]">
                        <span className="size-[4px] rounded-full bg-white" />
                        <span className="h-[3px] w-[15px] rounded-full bg-white" />
                    </span>

                    <span className="flex items-center gap-[4px]">
                        <span className="size-[4px] rounded-full bg-white/80" />
                        <span className="h-[3px] w-[11px] rounded-full bg-white/90" />
                    </span>

                    <span className="flex items-center gap-[4px]">
                        <span className="size-[4px] rounded-full bg-white/65" />
                        <span className="h-[3px] w-[13px] rounded-full bg-white/80" />
                    </span>
                </span>
            </span>

            <span className="flex items-baseline text-[26px] leading-none tracking-[-0.045em]">
                <span className="font-[550] text-[#17182f]">
                    sub
                </span>

                <span
                    className="
                bg-[linear-gradient(100deg,#6657e8_0%,#846cf1_55%,#668ee8_100%)]
                bg-clip-text
                font-[650]
                text-transparent
            "
                >
                    Tracker
                </span>
            </span>
        </span>
    );
}