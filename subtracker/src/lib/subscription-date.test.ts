import { describe, expect, it } from "vitest";
import { formatSubscriptionDate, subscriptionDate } from "./subscription-date";

describe("subscription date formatting", () => {
  it("keeps a database date stable across local time zones", () => {
    expect(formatSubscriptionDate(new Date("2026-09-18T00:00:00.000Z"))).toBe(
      "Sep 18, 2026",
    );
  });

  it("stores date-only input at UTC midnight", () => {
    expect(subscriptionDate("2026-09-18").toISOString()).toBe(
      "2026-09-18T00:00:00.000Z",
    );
  });
});
