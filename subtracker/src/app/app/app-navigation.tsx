"use client";
import { LayoutDashboard, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "~/server/better-auth/client";

const navigation = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/settings", label: "Manage", icon: SlidersHorizontal },
] as const;

function isCurrentPath(pathname: string, href: string) {
  return href === "/app" ? pathname === href : pathname.startsWith(href);
}

export function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const manageIsCurrent = isCurrentPath(pathname, "/app/settings");

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <aside className="border-line flex min-h-screen flex-col border-r bg-white px-[19px] pt-[31px] pb-[22px] max-[760px]:hidden">
        <Link
          href="/app"
          className="text-ink text-[1.28rem] font-[760] tracking-[-0.07em] no-underline"
        >
          subTracker
        </Link>
        <nav
          className="mt-[57px] grid gap-[5px]"
          aria-label="Primary navigation"
        >
          {navigation.map((item) => (
            <Link
              className={`block w-full rounded-lg border-0 px-[13px] py-[11px] text-left text-[.88rem] font-semibold no-underline transition-colors ${
                isCurrentPath(pathname, item.href)
                  ? "bg-soft-violet text-violet"
                  : "hover:bg-soft-violet hover:text-violet bg-transparent text-[#65636c]"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <button
            className="hover:bg-soft-violet hover:text-violet block w-full cursor-pointer rounded-lg border-0 bg-transparent px-[13px] py-[11px] text-left text-[.88rem] font-semibold text-[#65636c] transition-colors"
            onClick={handleSignOut}
            type="button"
          >
            Sign out
          </button>
        </div>
      </aside>

      <nav
        className={`border-line before:bg-soft-violet fixed right-0 bottom-0 left-0 z-20 hidden grid-cols-2 gap-2 border-t bg-white/95 px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(39,36,48,0.1)] backdrop-blur-md before:pointer-events-none before:absolute before:top-2 before:left-3 before:h-14 before:w-[calc(50%-1rem)] before:rounded-xl before:shadow-[inset_0_0_0_1px_rgba(75,64,233,0.08)] before:transition-transform before:duration-200 before:ease-out before:content-[''] motion-reduce:before:transition-none max-[760px]:grid ${
          manageIsCurrent
            ? "before:translate-x-[calc(100%+0.5rem)]"
            : "before:translate-x-0"
        }`}
        aria-label="Mobile navigation"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          const isCurrent = isCurrentPath(pathname, item.href);

          return (
            <Link
              aria-current={isCurrent ? "page" : undefined}
              className={`relative z-10 flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[.72rem] font-[680] no-underline transition-colors duration-200 ${
                isCurrent
                  ? "text-violet"
                  : "text-[#77727f] hover:text-[#27242d]"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="size-5 stroke-[2.2]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
