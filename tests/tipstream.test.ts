import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("TipStream Contract Tests", () => {
    it("can send tip successfully", () => {
        const { result, events } = simnet.callPublicFn(
            "tipstream",
            "send-tip",
            [
                Cl.principal(wallet2),
                Cl.uint(1000000),
                Cl.stringUtf8("Great content!")
            ],
            wallet1
        );

        expect(result).toBeOk(Cl.uint(0));
        expect(events).toHaveLength(2);
    });

    it("cannot send tip to self", () => {
        const { result } = simnet.callPublicFn(
            "tipstream",
            "send-tip",
            [
                Cl.principal(wallet1),
                Cl.uint(1000000),
                Cl.stringUtf8("Tipping myself")
            ],
            wallet1
        );

        expect(result).toBeErr(Cl.uint(101));
    });

    it("user stats update correctly", () => {
        simnet.callPublicFn(
            "tipstream",
            "send-tip",
            [
                Cl.principal(wallet2),
                Cl.uint(1000000),
                Cl.stringUtf8("Tip 1")
            ],
            wallet1
        );

        const { result } = simnet.callReadOnlyFn(
            "tipstream",
            "get-user-stats",
            [Cl.principal(wallet1)],
            wallet1
        );

        expect(result).toBeTuple({
            "tips-sent": Cl.uint(1),
            "tips-received": Cl.uint(0),
            "total-sent": Cl.uint(1000000),
            "total-received": Cl.uint(0)
        });
    });

    it("fee calculation is correct", () => {
        const { result } = simnet.callReadOnlyFn(
            "tipstream",
            "get-fee-for-amount",
            [Cl.uint(1000000)],
            wallet1
        );

        expect(result).toBeOk(Cl.uint(5000));
    });

    it("platform stats track correctly", () => {
        simnet.callPublicFn(
            "tipstream",
            "send-tip",
            [
                Cl.principal(wallet2),
                Cl.uint(1000000),
                Cl.stringUtf8("Tip 1")
            ],
            wallet1
        );

        const { result } = simnet.callReadOnlyFn(
            "tipstream",
            "get-platform-stats",
            [],
            wallet1
        );

        expect(result).toBeTuple({
            "total-tips": Cl.uint(1),
            "total-volume": Cl.uint(1000000),
            "platform-fees": Cl.uint(5000)
        });
    });

    describe("Privacy Controls", () => {
        it("can block and unblock a user", () => {
            // Wallet 2 blocks Wallet 1
            const { result: blockResult } = simnet.callPublicFn(
                "tipstream",
                "toggle-block-user",
                [Cl.principal(wallet1)],
                wallet2
            );
            expect(blockResult).toBeOk(Cl.bool(true));

            // Check if blocked
            const { result: isBlocked } = simnet.callReadOnlyFn(
                "tipstream",
                "is-user-blocked",
                [Cl.principal(wallet2), Cl.principal(wallet1)],
                wallet1
            );
            expect(isBlocked).toBeBool(true);

            // Wallet 1 tries to tip Wallet 2
            const { result: tipResult } = simnet.callPublicFn(
                "tipstream",
                "send-tip",
                [Cl.principal(wallet2), Cl.uint(1000000), Cl.stringUtf8("Let me tip you!")],
                wallet1
            );
            expect(tipResult).toBeErr(Cl.uint(106));

            // Wallet 2 unblocks Wallet 1
            const { result: unblockResult } = simnet.callPublicFn(
                "tipstream",
                "toggle-block-user",
                [Cl.principal(wallet1)],
                wallet2
            );
            expect(unblockResult).toBeOk(Cl.bool(false));

            // Wallet 1 can now tip Wallet 2
            const { result: retryTipResult } = simnet.callPublicFn(
                "tipstream",
                "send-tip",
                [Cl.principal(wallet2), Cl.uint(1000000), Cl.stringUtf8("Finally!")],
                wallet1
            );
            expect(retryTipResult).toBeOk(Cl.uint(0));
        });
    });
});
