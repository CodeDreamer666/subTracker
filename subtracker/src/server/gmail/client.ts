import type { EmailForDetection } from "./detection/detection-types";

const gmailApi = "https://gmail.googleapis.com/gmail/v1/users/me";

type GmailPart = {
    mimeType?: string;
    headers?: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: GmailPart[];
};

type GmailMessage = {
    id?: string;
    internalDate?: string;
    snippet?: string;
    payload?: GmailPart;
};

type GmailMessagePage = {
    messages?: Array<{ id?: string }>;
};

function findTextBody(part: GmailPart): string {
    if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf8");
    }

    for (const child of part.parts ?? []) {
        const text = findTextBody(child);
        if (text) return text;
    }

    return "";
}

function getHeader(
    messageHeaders: Array<{ name: string; value: string }>,
    name: string,
) {
    return (
        messageHeaders.find(
            (header) => header.name.toLowerCase() === name.toLowerCase(),
        )?.value ?? ""
    );
}

export async function listGmailMessageIds(
    accessToken: string,
    timeFilter: string | null,
) {
    const listUrl = new URL(`${gmailApi}/messages`);

    listUrl.searchParams.set("labelIds", "INBOX");
    listUrl.searchParams.set("maxResults", "500");
    if (timeFilter) listUrl.searchParams.set("q", timeFilter);

    const response = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`GMAIL_${response.status}`);
    }

    const data = (await response.json()) as GmailMessagePage;
    
    return (data.messages ?? []).flatMap((message) =>
        message.id ? [message.id] : [],
    );
}

export async function getGmailMessageForDetection(
    accessToken: string,
    messageId: string,
): Promise<EmailForDetection | null> {
    const messageUrl = new URL(
        `${gmailApi}/messages/${encodeURIComponent(messageId)}`,
    );
    messageUrl.searchParams.set("format", "full");
    messageUrl.searchParams.set(
        "fields",
        "id,internalDate,snippet,payload(headers,body/data,parts(mimeType,body/data,parts(mimeType,body/data)))",
    );

    const response = await fetch(messageUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
    });

    if (!response.ok) return null;

    const message = (await response.json()) as GmailMessage;
    if (!message.id) return null;

    const messageHeaders = message.payload?.headers ?? [];

    return {
        id: message.id,
        from: getHeader(messageHeaders, "From"),
        subject: getHeader(messageHeaders, "Subject"),
        date: getHeader(messageHeaders, "Date"),
        internalDate: message.internalDate ?? "",
        snippet: message.snippet ?? "",
        textBody: findTextBody(message.payload ?? {}),
    };
}
