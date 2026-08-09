import { BillingInterval } from "../../../generated/prisma";

type GmailHeader = { name?: string; value?: string };

export type GmailMessage = {
  id?: string;
  internalDate?: string;
  payload?: {
    mimeType?: string;
    body?: { data?: string };
    headers?: GmailHeader[];
    parts?: GmailMessage["payload"][];
  };
};

export type DetectedSubscriptionInput = {
  sourceMessageId: string;
  merchantKey: string;
  name: string;
  amountMinor: number;
  currency: string;
  billingInterval: BillingInterval;
  category: string;
  planName?: string;
  nextRenewalOn: Date;
  messageDate: Date;
};

const knownMerchants = [
  { key: "netflix", name: "Netflix", category: "Entertainment" },
  { key: "spotify", name: "Spotify", category: "Entertainment" },
  { key: "youtube", name: "YouTube", category: "Entertainment" },
  { key: "apple", name: "Apple", category: "Software" },
  { key: "google", name: "Google", category: "Software" },
  { key: "microsoft", name: "Microsoft", category: "Software" },
  { key: "adobe", name: "Adobe", category: "Software" },
  { key: "notion", name: "Notion", category: "Software" },
  { key: "canva", name: "Canva", category: "Software" },
  { key: "dropbox", name: "Dropbox", category: "Software" },
  { key: "github", name: "GitHub", category: "Software" },
  { key: "amazon", name: "Amazon", category: "Shopping" },
];

const header = (message: GmailMessage, name: string) =>
  message.payload?.headers?.find((item) => item.name?.toLowerCase() === name)
    ?.value ?? "";

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
};

const plainText = (part: GmailMessage["payload"]): string => {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }

  const nested = part.parts?.map(plainText).filter(Boolean).join("\n") ?? "";
  if (nested) return nested;

  if (part.mimeType === "text/html" && part.body?.data) {
    return decodeBase64Url(part.body.data)
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&");
  }

  return "";
};

const amountFrom = (value: string) => {
  const match = /(?:USD\s*|US\$|\$)\s*([0-9]{1,6}(?:[,.][0-9]{2})?)/i.exec(
    value,
  );
  if (!match) return null;
  const amount = Number.parseFloat(match[1]!.replace(",", ""));
  return Number.isFinite(amount) && amount > 0
    ? Math.round(amount * 100)
    : null;
};

const dateFrom = (value: string, fallback: Date) => {
  const match =
    /(?:renews?|next billing date|next payment|due)\D{0,24}([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})/i.exec(
      value,
    );
  if (!match) return fallback;
  const parsed = new Date(match[1]!);
  return Number.isNaN(parsed.valueOf()) ? fallback : parsed;
};

const intervalFrom = (value: string) =>
  /annual|annually|yearly|per year|12 months/i.test(value)
    ? BillingInterval.YEARLY
    : BillingInterval.MONTHLY;

/**
 * Derives only normalized subscription fields from a Gmail message. The original
 * headers and body are intentionally not returned or stored.
 */
export const detectSubscription = (
  message: GmailMessage,
): DetectedSubscriptionInput | null => {
  if (!message.id) return null;

  const subject = header(message, "subject");
  const from = header(message, "from");
  const text = `${subject}\n${from}\n${plainText(message.payload)}`.slice(
    0,
    40_000,
  );
  const lower = text.toLowerCase();
  const merchant = knownMerchants.find((item) => lower.includes(item.key));
  const amountMinor = amountFrom(text);

  if (
    !merchant ||
    !amountMinor ||
    !/(subscription|membership|renewal|renewed|receipt|invoice|billing|payment)/i.test(
      text,
    )
  ) {
    return null;
  }

  const messageDate = message.internalDate
    ? new Date(Number(message.internalDate))
    : new Date();
  const safeMessageDate = Number.isNaN(messageDate.valueOf())
    ? new Date()
    : messageDate;
  const renewal = new Date(safeMessageDate);
  renewal.setUTCMonth(
    renewal.getUTCMonth() +
      (intervalFrom(text) === BillingInterval.YEARLY ? 12 : 1),
  );

  return {
    sourceMessageId: message.id,
    merchantKey: merchant.key,
    name: merchant.name,
    amountMinor,
    currency: "USD",
    billingInterval: intervalFrom(text),
    category: merchant.category,
    nextRenewalOn: dateFrom(text, renewal),
    messageDate: safeMessageDate,
  };
};
