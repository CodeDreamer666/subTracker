import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAccessToken, revokeGoogleToken } = vi.hoisted(() => ({
    getAccessToken: vi.fn(),
    revokeGoogleToken: vi.fn(),
}));

vi.mock("~/server/better-auth", () => ({
    auth: { api: { getAccessToken, getSession: vi.fn() } },
}));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/better-auth/google-token", () => ({ revokeGoogleToken }));

import { accountRouter } from "./account";

describe("account deletion", () => {
    const deleteUser = vi.fn();

    beforeEach(() => {
        deleteUser.mockReset();
        getAccessToken.mockReset();
        revokeGoogleToken.mockReset();
        deleteUser.mockResolvedValue({ id: "user-a" });
        getAccessToken.mockResolvedValue({ accessToken: "test-token" });
    });

    function caller() {
        return accountRouter.createCaller({
            db: { user: { delete: deleteUser } },
            session: { user: { id: "user-a" } },
            headers: new Headers(),
        } as never);
    }

    it("deletes the signed-in user so owned rows cascade away", async () => {
        await expect(
            caller().deleteAccount({ confirmation: "DELETE" }),
        ).resolves.toEqual({ success: true });

        expect(revokeGoogleToken).toHaveBeenCalledWith("test-token");
        expect(deleteUser).toHaveBeenCalledWith({ where: { id: "user-a" } });
    });

    it("still deletes locally when Google revocation fails", async () => {
        revokeGoogleToken.mockRejectedValue(new Error("network unavailable"));

        await expect(
            caller().deleteAccount({ confirmation: "DELETE" }),
        ).resolves.toEqual({ success: true });

        expect(deleteUser).toHaveBeenCalledWith({ where: { id: "user-a" } });
    });
});
