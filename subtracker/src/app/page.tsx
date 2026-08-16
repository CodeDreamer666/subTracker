import type { Metadata } from "next";
import { LandingPage } from "~/app/landing/landing-page";
import { getSession } from "~/server/better-auth/server";

export const metadata: Metadata = {
  title: "subTracker — See what you’re paying for",
  description:
    "Bring subscriptions into one organised Overview, review what you pay, and decide what stays",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ authError?: string }>;
}) {
  const [session, { authError }] = await Promise.all([
    getSession(),
    searchParams,
  ]);

  return (
    <LandingPage
      authenticated={Boolean(session?.user)}
      authError={Boolean(authError)}
    />
  );
}
