import type { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/better-auth", () => ({
    auth: { api: { getSession: vi.fn() } },
}));
vi.mock("~/server/db", () => ({ db: {} }));

import { manualPrice, subscriptionRouter } from "./subscription";

describe("subscription procedure ownership", () => {
    const findMany = vi.fn();
    const updateMany = vi.fn();
    const deleteMany = vi.fn();

    beforeEach(() => {
        findMany.mockReset();
        updateMany.mockReset();
        deleteMany.mockReset();
    });

    function caller() {
        return subscriptionRouter.createCaller({
            db: { subscription: { findMany, updateMany, deleteMany } },
            session: { user: { id: "user-a" } },
            headers: new Headers(),
        } as never);
    }

    it("scopes dashboard reads to the authenticated user", async () => {
        findMany.mockResolvedValue([]);

        await caller().dashboard();

        expect(findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: "user-a" } }),
        );
    });

    it("scopes updates to the authenticated user and rejects missing rows", async () => {
        updateMany.mockResolvedValue({ count: 0 });

        await expect(
            caller().update({ id: "cm12345678901234567890123", name: "Updated" }),
        ).rejects.toMatchObject({ code: "NOT_FOUND" } satisfies Partial<TRPCError>);

        expect(updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: "cm12345678901234567890123",
                    userId: "user-a",
                },
            }),
        );
    });

    it("scopes deletion to the authenticated user", async () => {
        deleteMany.mockResolvedValue({ count: 1 });

        await caller().deleteSubscription({ id: "cm12345678901234567890123" });

        expect(deleteMany).toHaveBeenCalledWith({
            where: {
                id: "cm12345678901234567890123",
                userId: "user-a",
            },
        });
    });
});

describe("manual subscription validation", () => {
    it("converts valid USD text and rejects unsafe values", () => {
        expect(manualPrice.parse("20.05")).toBe(2_005);
        expect(manualPrice.parse("")).toBeNull();
        expect(() => manualPrice.parse("1.234")).toThrow();
        expect(() => manualPrice.parse("1000000.01")).toThrow();
    });
});
