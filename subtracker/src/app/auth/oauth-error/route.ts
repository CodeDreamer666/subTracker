import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function GET(request: NextRequest) {
    const error = request.nextUrl.searchParams.get("error");

    if (error === "access_denied") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    console.error("Google OAuth callback failed.", {
        error: error ?? "unknown",
    });

    const landingUrl = new URL("/", request.url);

    landingUrl.searchParams.set("authError", "oauth_failed");
    
    return NextResponse.redirect(landingUrl);
}
