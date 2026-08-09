import { redirect } from "next/navigation";

import { AppNavigation } from "~/app/app/app-navigation";
import { getSession } from "~/server/better-auth/server";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  return (
    <main className="grid min-h-screen grid-cols-[234px_minmax(0,1fr)] bg-[#fbfbfa] max-[760px]:block max-[760px]:pb-[70px]">
      <AppNavigation />
      <section className="mx-auto w-[min(1160px,calc(100vw-234px))] px-11 pb-20 max-[760px]:w-full max-[760px]:px-[19px] max-[760px]:pb-[35px]">
        {children}
      </section>
    </main>
  );
}
