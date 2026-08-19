const googleRevokeUrl = "https://oauth2.googleapis.com/revoke";
const googleRequestTimeoutMs = 10_000;

export async function revokeGoogleToken(accessToken: string) {
    const response = await fetch(googleRevokeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: accessToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(googleRequestTimeoutMs),
    });

    if (!response.ok && response.status !== 400) {
        throw new Error(`GOOGLE_REVOKE_${response.status}`);
    }
}
