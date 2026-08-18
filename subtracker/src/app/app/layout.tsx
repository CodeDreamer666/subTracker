import { redirect } from "next/navigation";
import { AppNavigation } from "~/app/app/app-navigation";
import { getSession } from "~/server/better-auth/server";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  return (
    <div className="bg-page text-ink min-h-screen">
      <AppNavigation />
      <main>{children}</main>
    </div>
  );
}
