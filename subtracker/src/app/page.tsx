import { redirect } from "next/navigation";
import { GoogleSignInButton } from "~/app/auth-buttons";
import { getSession } from "~/server/better-auth/server";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ authError?: string }>;
}) {
  const session = await getSession();
  const { authError } = await searchParams;

  if (session?.user) redirect("/app");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_87%_10%,#e7e5ff_0,transparent_26rem)]">
      <nav className="mx-auto flex max-w-[1160px] items-center justify-between px-9 py-[29px] max-[760px]:px-5 max-[760px]:py-[23px]">
        <span className="text-ink text-[1.28rem] font-[760] tracking-[-0.07em]">
          subTracker
        </span>
        <GoogleSignInButton compact />
      </nav>
      <section className="mx-auto max-w-[760px] px-9 pt-[142px] pb-20 text-center max-[760px]:px-6 max-[760px]:pt-[110px] max-[760px]:pb-[60px] max-[760px]:text-left">
        <p className="text-violet m-0 text-[.69rem] font-extrabold tracking-[.13em]">
          ONE HOME FOR EVERY RENEWAL
        </p>
        <h1 className="my-[13px] mb-[22px] text-[clamp(3rem,8vw,6.2rem)] leading-[.96] tracking-[-.075em]">
          Subscriptions, without the surprises.
        </h1>
        <p className="text-muted mx-auto mb-8 max-w-[520px] text-[1.15rem] leading-[1.6] max-[760px]:ml-0">
          Connect Gmail to find recurring subscriptions, then decide what stays
          and what goes.
        </p>
        <GoogleSignInButton />
        {authError ? (
          <p
            className="mx-auto mt-4 max-w-[420px] rounded-[10px] border border-[#f0c8cf] bg-[#fff5f6] px-4 py-3 text-sm text-[#9e283c] max-[760px]:ml-0"
            role="alert"
          >
            Google sign-in could not be completed. Please try again.
          </p>
        ) : null}
        <p className="text-muted mx-auto my-[18px] max-w-[420px] text-xs leading-normal max-[760px]:ml-0">
          Google sign-in is for your account. Gmail access is asked for
          separately, only when you choose to scan.
        </p>
      </section>
    </main>
  );
}
