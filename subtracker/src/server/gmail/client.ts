import type { GmailMessage } from "~/server/gmail/detector";

const gmailApi = "https://gmail.googleapis.com/gmail/v1/users/me";

export type GmailMessagePage = {
  messages?: Array<{ id: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

const request = async <T>(path: string, accessToken: string) => {
  const response = await fetch(`${gmailApi}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GMAIL_${response.status}`);
  }

  return (await response.json()) as T;
};

export const listSubscriptionMessages = (
  accessToken: string,
  pageToken?: string | null,
) => {
  const query = new URLSearchParams({
    q: "newer_than:12m (subscription OR renewal OR receipt OR invoice OR billing)",
    maxResults: "20",
  });
  if (pageToken) query.set("pageToken", pageToken);
  return request<GmailMessagePage>(
    `/messages?${query.toString()}`,
    accessToken,
  );
};

export const getGmailMessage = (accessToken: string, messageId: string) =>
  request<GmailMessage>(
    `/messages/${encodeURIComponent(messageId)}?format=full`,
    accessToken,
  );
