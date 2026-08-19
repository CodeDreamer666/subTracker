import { afterEach, describe, expect, it, vi } from "vitest";
import {
    getGmailMessageForDetection,
    gmailMessageLimit,
    listGmailMessageIds,
} from "./client";

describe("Gmail client", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("applies a bounded timeout to Gmail requests", async () => {
        const timeoutSignal = new AbortController().signal;
        const timeout = vi
            .spyOn(AbortSignal, "timeout")
            .mockReturnValue(timeoutSignal);
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(new Response(JSON.stringify({ messages: [] })));
        vi.stubGlobal("fetch", fetchMock);

        await listGmailMessageIds("token", "newer_than:7d");

        expect(timeout).toHaveBeenCalledWith(10_000);
        expect(fetchMock.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({ signal: timeoutSignal }),
        );
    });

    it("applies the period filter and caps message IDs", async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
            new Response(
                JSON.stringify({
                    messages: Array.from(
                        { length: gmailMessageLimit + 1 },
                        (_, index) => ({
                            id: `message-${index}`,
                        }),
                    ),
                }),
                { status: 200 },
            ),
        );
        vi.stubGlobal("fetch", fetchMock);

        const ids = await listGmailMessageIds("token", "newer_than:1y");
        const requestUrl = fetchMock.mock.calls[0]?.[0];

        expect(requestUrl).toBeInstanceOf(URL);
        expect((requestUrl as URL).searchParams.get("q")).toBe("newer_than:1y");
        expect((requestUrl as URL).searchParams.get("maxResults")).toBe("500");
        expect(ids).toHaveLength(gmailMessageLimit);
    });

    it("omits the Gmail query for All mail", async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(new Response(JSON.stringify({ messages: [] })));
        vi.stubGlobal("fetch", fetchMock);

        await listGmailMessageIds("token", null);

        const requestUrl = fetchMock.mock.calls[0]?.[0] as URL;
        expect(requestUrl.searchParams.has("q")).toBe(false);
    });

    it("decodes nested plain-text message bodies", async () => {
        const body = Buffer.from("Your subscription renews monthly").toString(
            "base64url",
        );
        vi.stubGlobal(
            "fetch",
            vi.fn<typeof fetch>().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        id: "message-1",
                        internalDate: "1700000000000",
                        snippet: "Subscription receipt",
                        payload: {
                            headers: [
                                { name: "From", value: "Service <billing@example.com>" },
                                { name: "Subject", value: "Your subscription" },
                            ],
                            parts: [
                                {
                                    mimeType: "multipart/alternative",
                                    parts: [{ mimeType: "text/plain", body: { data: body } }],
                                },
                            ],
                        },
                    }),
                ),
            ),
        );

        const message = await getGmailMessageForDetection("token", "message-1");

        expect(message?.from).toBe("Service <billing@example.com>");
        expect(message?.textBody).toBe("Your subscription renews monthly");
    });

    it("rejects Gmail API failures instead of returning an empty message", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn<typeof fetch>()
                .mockResolvedValue(new Response(null, { status: 401 })),
        );

        await expect(
            getGmailMessageForDetection("token", "message-1"),
        ).rejects.toThrow("GMAIL_401");
    });
});
