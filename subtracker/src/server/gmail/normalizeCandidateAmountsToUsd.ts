import type {
    SubscriptionCandidate,
} from "~/server/gmail/detection/detection-types"

type FrankfurterRate = {
    base?: string;
    quote?: string;
    rate?: number;
};

type NormalizedSubscriptionCandidate = Omit<
    SubscriptionCandidate,
    "sourceCurrency"
>;

type SourceCurrency = NonNullable<SubscriptionCandidate["sourceCurrency"]>;

export default async function normalizeCandidateAmountsToUsd(
    candidates: SubscriptionCandidate[],
): Promise<NormalizedSubscriptionCandidate[]> {

    const currenciesToConvert = new Set<SourceCurrency>();

    for (const candidate of candidates) {
        if (
            candidate.amountMinor !== null &&
            candidate.sourceCurrency !== null &&
            candidate.sourceCurrency !== "USD"
        ) {
            currenciesToConvert.add(candidate.sourceCurrency);
        }
    }

    const usdRates = new Map<SourceCurrency, number>();

    await Promise.all(
        Array.from(currenciesToConvert).map(async (sourceCurrency) => {
            const response = await fetch(
                `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(sourceCurrency)}/USD`,
                { cache: "no-store" },
            );

            if (!response.ok) throw new Error("FRANKFURTER_UNAVAILABLE");

            const result = (await response.json()) as FrankfurterRate;

            if (
                result.base !== sourceCurrency ||
                result.quote !== "USD" ||
                typeof result.rate !== "number" ||
                !Number.isFinite(result.rate) ||
                result.rate <= 0
            ) {
                throw new Error("FRANKFURTER_INVALID_RATE");
            }

            usdRates.set(sourceCurrency, result.rate);
        }),
    );

    return candidates.map((candidate) => {
        const { sourceCurrency, ...candidateWithoutSourceCurrency } = candidate;

        if (candidate.amountMinor === null || sourceCurrency === null) {
            return {
                ...candidateWithoutSourceCurrency,
                amountMinor: null,
            };
        }

        if (sourceCurrency === "USD") return candidateWithoutSourceCurrency;

        const usdRate = usdRates.get(sourceCurrency);

        if (!usdRate) throw new Error("FRANKFURTER_MISSING_RATE");

        return {
            ...candidateWithoutSourceCurrency,
            amountMinor: Math.round(candidate.amountMinor * usdRate),
        };
    })
}