import { auth } from ".";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getSession = cache(async () =>
    auth.api.getSession({ headers: await headers() }),
);

export async function requireUserName() {
    const session = await getSession();
    if (!session?.user) redirect("/");
    return session.user.name;
}
