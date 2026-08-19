"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
    { href: "/app", label: "Overview" },
    { href: "/app/manage", label: "Manage" },
] as const;

function isCurrentPath(pathname: string, href: string) {
    return href === "/app" ? pathname === href : pathname.startsWith(href);
}

export default function AppNavigation() {
    const pathname = usePathname();

    return (
        <header className="border-line sticky top-0 z-40 border-b bg-[color-mix(in_oklch,var(--bg)_90%,transparent)] backdrop-blur-xl">
            <nav
                className="mx-auto flex min-h-[72px] max-w-[1120px] items-center justify-between gap-5 px-6 max-[620px]:min-h-16 max-[620px]:px-4"
                aria-label="App navigation"
            >
                <Link
                    href="/app"
                    className="inline-flex min-h-11 items-center gap-2.5 text-xl font-[750] tracking-[-0.03em] max-[430px]:gap-2 max-[430px]:text-lg"
                    aria-label="subTracker overview"
                >
                    <span
                        className="border-line bg-surface grid size-[30px] content-center gap-1 rounded-[9px] border p-[7px] shadow-[0_5px_16px_var(--fg-soft)]"
                        aria-hidden="true"
                    >
                        <i className="bg-ink block h-0.5 rounded-full" />
                        <i className="bg-brand block h-0.5 w-[70%] rounded-full" />
                        <i className="bg-ink block h-0.5 rounded-full" />
                    </span>
                    <span className="max-[390px]:sr-only">
                        sub<span className="text-brand">Tracker</span>
                    </span>
                </Link>
                <div className="flex items-center gap-1 rounded-xl">
                    {navigation.map((item) => (
                        <Link
                            className={`hover:bg-ink-soft inline-flex min-h-11 items-center justify-center rounded-[9px] px-4 text-sm font-semibold transition-colors duration-300 max-[430px]:px-3`}
                            href={item.href}
                            key={item.href}
                            aria-current={
                                isCurrentPath(pathname, item.href) ? "page" : undefined
                            }
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </nav>
        </header>
    );
}
