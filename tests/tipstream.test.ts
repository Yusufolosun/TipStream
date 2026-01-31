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

    describe("Batch Tipping", () => {
        it("can send multiple tips in one transaction", () => {
            const tips = [
                Cl.tuple({ recipient: Cl.principal(wallet2), amount: Cl.uint(1000000), message: Cl.stringUtf8("Tip A") }),
                Cl.tuple({ recipient: Cl.principal(wallet2), amount: Cl.uint(2000000), message: Cl.stringUtf8("Tip B") })
            ];

            const { result, events } = simnet.callPublicFn(
                "tipstream",
                "send-batch-tips",
                [Cl.list(tips)],
                wallet1
            );

            expect(result).toBeOk(Cl.list([Cl.ok(Cl.uint(0)), Cl.ok(Cl.uint(1))]));

            // Should have 4 transfer events (2 tips + 2 fees)
            const transferEvents = events.filter(e => e.event === "stx_transfer_event");
            expect(transferEvents).toHaveLength(4);

            const { result: stats } = simnet.callReadOnlyFn(
                "tipstream",
                "get-user-stats",
                [Cl.principal(wallet1)],
                wallet1
            );

            expect(stats).toBeTuple({
                "tips-sent": Cl.uint(2),
                "tips-received": Cl.uint(0),
                "total-sent": Cl.uint(3000000),
                "total-received": Cl.uint(0)
            });
        });
    });
});
