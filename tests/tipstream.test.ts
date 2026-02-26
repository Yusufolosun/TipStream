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
        expect(events).toHaveLength(3);
    });

    it("verifies exact STX transfer amounts in tip events", () => {
        const { result, events } = simnet.callPublicFn(
            "tipstream",
            "send-tip",
            [
                Cl.principal(wallet2),
                Cl.uint(1000000),
                Cl.stringUtf8("Verify amounts")
            ],
            wallet1
        );

        expect(result).toBeOk(Cl.uint(0));

        const transfers = events.filter(e => e.event === "stx_transfer_event");
        expect(transfers).toHaveLength(2);

        const recipientTransfer = transfers[0];
        expect(recipientTransfer.data.amount).toBe("995000");
        expect(recipientTransfer.data.recipient).toBe(wallet2);
        expect(recipientTransfer.data.sender).toBe(wallet1);

        const feeTransfer = transfers[1];
        expect(feeTransfer.data.amount).toBe("5000");
        expect(feeTransfer.data.recipient).toBe(deployer);
        expect(feeTransfer.data.sender).toBe(wallet1);
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

    it("rejects tips below minimum amount", () => {
        const { result } = simnet.callPublicFn(
            "tipstream",
            "send-tip",
            [
                Cl.principal(wallet2),
                Cl.uint(999),
                Cl.stringUtf8("Too small")
            ],
            wallet1
        );

        expect(result).toBeErr(Cl.uint(101));
    });

    it("accepts tips at exactly the minimum amount", () => {
        const { result } = simnet.callPublicFn(
            "tipstream",
            "send-tip",
            [
                Cl.principal(wallet2),
                Cl.uint(1000),
                Cl.stringUtf8("Minimum tip")
            ],
            wallet1
        );

        expect(result).toBeOk(Cl.uint(0));
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

    it("enforces minimum fee of 1 uSTX when raw calculation truncates to zero", () => {
        simnet.callPublicFn("tipstream", "set-fee-basis-points", [Cl.uint(1)], deployer);

        const { result } = simnet.callReadOnlyFn(
            "tipstream",
            "get-fee-for-amount",
            [Cl.uint(1000)],
            wallet1
        );

        expect(result).toBeOk(Cl.uint(1));

        simnet.callPublicFn("tipstream", "set-fee-basis-points", [Cl.uint(50)], deployer);
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

    describe("User Profiles", () => {
        it("can set and get user profile", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "update-profile",
                [
                    Cl.stringUtf8("Alice"),
                    Cl.stringUtf8("Software Engineer & Crypto Enthusiast"),
                    Cl.stringUtf8("https://example.com/avatar.png")
                ],
                wallet1
            );

            expect(result).toBeOk(Cl.bool(true));

            const { result: profileResult } = simnet.callReadOnlyFn(
                "tipstream",
                "get-profile",
                [Cl.principal(wallet1)],
                wallet1
            );

            expect(profileResult).toBeSome(Cl.tuple({
                "display-name": Cl.stringUtf8("Alice"),
                "bio": Cl.stringUtf8("Software Engineer & Crypto Enthusiast"),
                "avatar-url": Cl.stringUtf8("https://example.com/avatar.png")
            }));
        });

        it("cannot set profile with empty display name", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "update-profile",
                [
                    Cl.stringUtf8(""),
                    Cl.stringUtf8("No name"),
                    Cl.stringUtf8("")
                ],
                wallet1
            );

            expect(result).toBeErr(Cl.uint(105));
        });
    });

    describe("Recursive Tipping", () => {
        it("can tip a previous tip sender", () => {
            simnet.callPublicFn(
                "tipstream",
                "send-tip",
                [Cl.principal(wallet2), Cl.uint(1000000), Cl.stringUtf8("First Tip")],
                wallet1
            );

            const { result } = simnet.callPublicFn(
                "tipstream",
                "tip-a-tip",
                [Cl.uint(0), Cl.uint(500000), Cl.stringUtf8("Supporting your tip!")],
                wallet2
            );

            expect(result).toBeOk(Cl.uint(1));

            const { result: tipResult } = simnet.callReadOnlyFn(
                "tipstream",
                "get-tip",
                [Cl.uint(1)],
                wallet1
            );

            expect(tipResult).not.toBeNone();
        });

        it("fails if target tip doesn't exist", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "tip-a-tip",
                [Cl.uint(99), Cl.uint(500000), Cl.stringUtf8("Ghost tip")],
                wallet2
            );

            expect(result).toBeErr(Cl.uint(104));
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

    describe("Admin Controls", () => {
        it("only owner can pause and unpause", () => {
            // Non-owner fails
            const { result: failPause } = simnet.callPublicFn(
                "tipstream",
                "set-paused",
                [Cl.bool(true)],
                wallet1
            );
            expect(failPause).toBeErr(Cl.uint(100));

            // Owner succeeds
            const { result: successPause } = simnet.callPublicFn(
                "tipstream",
                "set-paused",
                [Cl.bool(true)],
                deployer
            );
            expect(successPause).toBeOk(Cl.bool(true));

            // Tipping fails while paused
            const { result: tipFail } = simnet.callPublicFn(
                "tipstream",
                "send-tip",
                [Cl.principal(wallet2), Cl.uint(1000000), Cl.stringUtf8("Fail!")],
                wallet1
            );
            expect(tipFail).toBeErr(Cl.uint(107));

            // Owner unpauses
            simnet.callPublicFn("tipstream", "set-paused", [Cl.bool(false)], deployer);

            // Tipping works again
            const { result: tipSuccess } = simnet.callPublicFn(
                "tipstream",
                "send-tip",
                [Cl.principal(wallet2), Cl.uint(1000000), Cl.stringUtf8("Works!")],
                wallet1
            );
            expect(tipSuccess).toBeOk(Cl.uint(0));
        });

        it("owner can update fee", () => {
            // Update fee to 2% (200 basis points)
            simnet.callPublicFn("tipstream", "set-fee-basis-points", [Cl.uint(200)], deployer);

            const { result } = simnet.callReadOnlyFn(
                "tipstream",
                "get-fee-for-amount",
                [Cl.uint(1000000)],
                wallet1
            );

            expect(result).toBeOk(Cl.uint(20000));
        });

        it("accepts fee at exactly the maximum limit of 1000 basis points", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "set-fee-basis-points",
                [Cl.uint(1000)],
                deployer
            );
            expect(result).toBeOk(Cl.bool(true));

            const { result: fee } = simnet.callReadOnlyFn(
                "tipstream",
                "get-fee-for-amount",
                [Cl.uint(1000000)],
                wallet1
            );
            expect(fee).toBeOk(Cl.uint(100000));
        });

        it("rejects fee above the maximum limit of 1000 basis points", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "set-fee-basis-points",
                [Cl.uint(1001)],
                deployer
            );
            expect(result).toBeErr(Cl.uint(101));
        });

        it("accepts zero fee to disable platform fees", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "set-fee-basis-points",
                [Cl.uint(0)],
                deployer
            );
            expect(result).toBeOk(Cl.bool(true));

            const { result: fee } = simnet.callReadOnlyFn(
                "tipstream",
                "get-fee-for-amount",
                [Cl.uint(1000000)],
                wallet1
            );
            expect(fee).toBeOk(Cl.uint(0));
        });

        it("non-owner cannot change fee", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "set-fee-basis-points",
                [Cl.uint(100)],
                wallet1
            );
            expect(result).toBeErr(Cl.uint(100));
        });

        it("sending a tip with zero fee transfers full amount to recipient", () => {
            simnet.callPublicFn(
                "tipstream",
                "set-fee-basis-points",
                [Cl.uint(0)],
                deployer
            );

            const { result, events } = simnet.callPublicFn(
                "tipstream",
                "send-tip",
                [Cl.principal(wallet2), Cl.uint(1000000), Cl.stringUtf8("No fee tip")],
                wallet1
            );

            expect(result).toBeOk(Cl.uint(0));

            const transfers = events.filter(e => e.event === "stx_transfer_event");
            expect(transfers).toHaveLength(1);
            expect(transfers[0].data.amount).toBe("1000000");
            expect(transfers[0].data.recipient).toBe(wallet2);
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

    describe("Strict Batch Tipping", () => {
        it("sends all tips when all are valid", () => {
            const tips = [
                Cl.tuple({ recipient: Cl.principal(wallet2), amount: Cl.uint(1000000), message: Cl.stringUtf8("Strict A") }),
                Cl.tuple({ recipient: Cl.principal(wallet2), amount: Cl.uint(2000000), message: Cl.stringUtf8("Strict B") })
            ];

            const { result } = simnet.callPublicFn(
                "tipstream",
                "send-batch-tips-strict",
                [Cl.list(tips)],
                wallet1
            );

            expect(result).toBeOk(Cl.uint(2));
        });

        it("aborts entire batch when any tip fails", () => {
            simnet.callPublicFn(
                "tipstream",
                "toggle-block-user",
                [Cl.principal(wallet1)],
                wallet2
            );

            const tips = [
                Cl.tuple({ recipient: Cl.principal(deployer), amount: Cl.uint(1000000), message: Cl.stringUtf8("Valid") }),
                Cl.tuple({ recipient: Cl.principal(wallet2), amount: Cl.uint(1000000), message: Cl.stringUtf8("Blocked") })
            ];

            const { result } = simnet.callPublicFn(
                "tipstream",
                "send-batch-tips-strict",
                [Cl.list(tips)],
                wallet1
            );

            expect(result).toBeErr(Cl.uint(106));

            simnet.callPublicFn(
                "tipstream",
                "toggle-block-user",
                [Cl.principal(wallet1)],
                wallet2
            );
        });
    });

    describe("ownership transfer", () => {
        it("allows owner to propose a new owner", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "propose-new-owner",
                [Cl.principal(wallet1)],
                deployer
            );
            expect(result).toBeOk(Cl.bool(true));

            const { result: pending } = simnet.callReadOnlyFn(
                "tipstream",
                "get-pending-owner",
                [],
                deployer
            );
            expect(pending).toBeOk(Cl.some(Cl.principal(wallet1)));
        });

        it("rejects proposal from non-owner", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "propose-new-owner",
                [Cl.principal(wallet2)],
                wallet1
            );
            expect(result).toBeErr(Cl.uint(100));
        });

        it("rejects acceptance from wrong principal", () => {
            simnet.callPublicFn(
                "tipstream",
                "propose-new-owner",
                [Cl.principal(wallet1)],
                deployer
            );

            const { result } = simnet.callPublicFn(
                "tipstream",
                "accept-ownership",
                [],
                wallet2
            );
            expect(result).toBeErr(Cl.uint(108));
        });

        it("completes two-step ownership transfer", () => {
            simnet.callPublicFn(
                "tipstream",
                "propose-new-owner",
                [Cl.principal(wallet1)],
                deployer
            );

            const { result } = simnet.callPublicFn(
                "tipstream",
                "accept-ownership",
                [],
                wallet1
            );
            expect(result).toBeOk(Cl.bool(true));

            const { result: owner } = simnet.callReadOnlyFn(
                "tipstream",
                "get-contract-owner",
                [],
                deployer
            );
            expect(owner).toBeOk(Cl.principal(wallet1));

            const { result: pending } = simnet.callReadOnlyFn(
                "tipstream",
                "get-pending-owner",
                [],
                deployer
            );
            expect(pending).toBeOk(Cl.none());
        });
    });

    describe("multi-user stats", () => {
        it("returns stats for multiple users in a single call", () => {
            simnet.callPublicFn(
                "tipstream",
                "send-tip",
                [Cl.principal(wallet2), Cl.uint(1000000), Cl.stringUtf8("test")],
                wallet1
            );

            const { result } = simnet.callReadOnlyFn(
                "tipstream",
                "get-multiple-user-stats",
                [Cl.list([Cl.principal(wallet1), Cl.principal(wallet2)])],
                deployer
            );

            expect(result).toBeOk(Cl.list([
                Cl.tuple({
                    "tips-sent": Cl.uint(1),
                    "tips-received": Cl.uint(0),
                    "total-sent": Cl.uint(1000000),
                    "total-received": Cl.uint(0)
                }),
                Cl.tuple({
                    "tips-sent": Cl.uint(0),
                    "tips-received": Cl.uint(1),
                    "total-sent": Cl.uint(0),
                    "total-received": Cl.uint(1000000)
                })
            ]));
        });
    });

    describe("Concurrent Tipping", () => {
        it("maintains consistent state with multiple users tipping in sequence", () => {
            const wallet3 = accounts.get("wallet_3")!;

            simnet.callPublicFn(
                "tipstream", "send-tip",
                [Cl.principal(wallet2), Cl.uint(1000000), Cl.stringUtf8("User 1 tip")],
                wallet1
            );

            simnet.callPublicFn(
                "tipstream", "send-tip",
                [Cl.principal(wallet1), Cl.uint(2000000), Cl.stringUtf8("User 2 tip")],
                wallet2
            );

            simnet.callPublicFn(
                "tipstream", "send-tip",
                [Cl.principal(wallet2), Cl.uint(500000), Cl.stringUtf8("User 3 tip")],
                wallet3
            );

            const { result: stats } = simnet.callReadOnlyFn(
                "tipstream", "get-platform-stats", [], deployer
            );

            expect(stats).toBeTuple({
                "total-tips": Cl.uint(3),
                "total-volume": Cl.uint(3500000),
                "platform-fees": Cl.uint(17500)
            });

            const { result: w1Stats } = simnet.callReadOnlyFn(
                "tipstream", "get-user-stats", [Cl.principal(wallet1)], deployer
            );
            expect(w1Stats).toBeTuple({
                "tips-sent": Cl.uint(1),
                "tips-received": Cl.uint(1),
                "total-sent": Cl.uint(1000000),
                "total-received": Cl.uint(2000000)
            });

            const { result: w2Stats } = simnet.callReadOnlyFn(
                "tipstream", "get-user-stats", [Cl.principal(wallet2)], deployer
            );
            expect(w2Stats).toBeTuple({
                "tips-sent": Cl.uint(1),
                "tips-received": Cl.uint(2),
                "total-sent": Cl.uint(2000000),
                "total-received": Cl.uint(1500000)
            });
        });

        it("assigns sequential tip IDs across concurrent senders", () => {
            const wallet3 = accounts.get("wallet_3")!;

            const { result: r1 } = simnet.callPublicFn(
                "tipstream", "send-tip",
                [Cl.principal(wallet2), Cl.uint(1000000), Cl.stringUtf8("First")],
                wallet1
            );
            expect(r1).toBeOk(Cl.uint(0));

            const { result: r2 } = simnet.callPublicFn(
                "tipstream", "send-tip",
                [Cl.principal(wallet1), Cl.uint(1000000), Cl.stringUtf8("Second")],
                wallet2
            );
            expect(r2).toBeOk(Cl.uint(1));

            const { result: r3 } = simnet.callPublicFn(
                "tipstream", "send-tip",
                [Cl.principal(wallet1), Cl.uint(1000000), Cl.stringUtf8("Third")],
                wallet3
            );
            expect(r3).toBeOk(Cl.uint(2));
        });
    });

    describe("Multi-sig Governance", () => {
        const multisigContract = () => `${deployer}.tipstream-multisig`;

        function setupMultisig() {
            simnet.callPublicFn(
                "tipstream",
                "set-multisig",
                [Cl.some(Cl.principal(multisigContract()))],
                deployer
            );
            simnet.callPublicFn(
                "tipstream-multisig",
                "add-signer",
                [Cl.principal(wallet1)],
                deployer
            );
            simnet.callPublicFn(
                "tipstream-multisig",
                "add-signer",
                [Cl.principal(wallet2)],
                deployer
            );
            simnet.callPublicFn(
                "tipstream-multisig",
                "set-required-signatures",
                [Cl.uint(2)],
                deployer
            );
        }

        it("owner can authorize a multisig contract", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "set-multisig",
                [Cl.some(Cl.principal(multisigContract()))],
                deployer
            );
            expect(result).toBeOk(Cl.bool(true));

            const { result: msig } = simnet.callReadOnlyFn(
                "tipstream",
                "get-multisig",
                [],
                deployer
            );
            expect(msig).toBeOk(Cl.some(Cl.principal(multisigContract())));
        });

        it("non-owner cannot authorize a multisig contract", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "set-multisig",
                [Cl.some(Cl.principal(multisigContract()))],
                wallet1
            );
            expect(result).toBeErr(Cl.uint(100));
        });

        it("multisig signers can pause contract through governance", () => {
            setupMultisig();

            const { result: proposeResult } = simnet.callPublicFn(
                "tipstream-multisig",
                "propose-tx",
                [
                    Cl.stringUtf8("Pause contract for maintenance"),
                    Cl.stringAscii("set-paused"),
                    Cl.uint(1)
                ],
                wallet1
            );
            expect(proposeResult).toBeOk(Cl.uint(0));

            simnet.callPublicFn(
                "tipstream-multisig",
                "sign-tx",
                [Cl.uint(0)],
                wallet2
            );

            const { result: execResult } = simnet.callPublicFn(
                "tipstream-multisig",
                "execute-tx",
                [Cl.uint(0)],
                wallet1
            );
            expect(execResult).toBeOk(Cl.bool(true));

            const { result: tipResult } = simnet.callPublicFn(
                "tipstream",
                "send-tip",
                [Cl.principal(wallet2), Cl.uint(1000000), Cl.stringUtf8("Should fail")],
                wallet1
            );
            expect(tipResult).toBeErr(Cl.uint(107));
        });

        it("multisig signers can change fee through governance", () => {
            setupMultisig();

            simnet.callPublicFn(
                "tipstream-multisig",
                "propose-tx",
                [Cl.stringUtf8("Increase fee to 1%"), Cl.stringAscii("set-fee"), Cl.uint(100)],
                wallet1
            );

            simnet.callPublicFn("tipstream-multisig", "sign-tx", [Cl.uint(0)], wallet2);

            const { result } = simnet.callPublicFn(
                "tipstream-multisig",
                "execute-tx",
                [Cl.uint(0)],
                wallet1
            );
            expect(result).toBeOk(Cl.bool(true));

            const { result: feeResult } = simnet.callReadOnlyFn(
                "tipstream",
                "get-fee-for-amount",
                [Cl.uint(1000000)],
                wallet1
            );
            expect(feeResult).toBeOk(Cl.uint(10000));
        });

        it("execution fails without sufficient signatures", () => {
            setupMultisig();

            simnet.callPublicFn(
                "tipstream-multisig",
                "propose-tx",
                [Cl.stringUtf8("Pause without quorum"), Cl.stringAscii("set-paused"), Cl.uint(1)],
                wallet1
            );

            const { result } = simnet.callPublicFn(
                "tipstream-multisig",
                "execute-tx",
                [Cl.uint(0)],
                wallet1
            );
            expect(result).toBeErr(Cl.uint(1104));
        });

        it("owner can revoke multisig authorization", () => {
            simnet.callPublicFn(
                "tipstream",
                "set-multisig",
                [Cl.some(Cl.principal(multisigContract()))],
                deployer
            );

            const { result: revoke } = simnet.callPublicFn(
                "tipstream",
                "set-multisig",
                [Cl.none()],
                deployer
            );
            expect(revoke).toBeOk(Cl.bool(true));

            const { result: msig } = simnet.callReadOnlyFn(
                "tipstream",
                "get-multisig",
                [],
                deployer
            );
            expect(msig).toBeOk(Cl.none());
        });
    });

    describe("SIP-010 Token Tipping", () => {
        it("rejects token tip for non-whitelisted token", () => {
            const { result } = simnet.callPublicFn(
                "tipstream",
                "send-token-tip",
                [
                    Cl.contractPrincipal(deployer.split(".")[0] || deployer, "tipstream-token"),
                    Cl.principal(wallet2),
                    Cl.uint(1000),
                    Cl.stringUtf8("token tip"),
                ],
                wallet1
            );
            expect(result).toBeErr(Cl.uint(113));
        });

        it("admin can whitelist a token", () => {
            const tokenPrincipal = `${deployer}.tipstream-token`;
            const { result } = simnet.callPublicFn(
                "tipstream",
                "whitelist-token",
                [Cl.principal(tokenPrincipal), Cl.bool(true)],
                deployer
            );
            expect(result).toBeOk(Cl.bool(true));

            const { result: check } = simnet.callReadOnlyFn(
                "tipstream",
                "is-token-whitelisted",
                [Cl.principal(tokenPrincipal)],
                deployer
            );
            expect(check).toBeOk(Cl.bool(true));
        });

        it("non-admin cannot whitelist tokens", () => {
            const tokenPrincipal = `${deployer}.tipstream-token`;
            const { result } = simnet.callPublicFn(
                "tipstream",
                "whitelist-token",
                [Cl.principal(tokenPrincipal), Cl.bool(true)],
                wallet1
            );
            expect(result).toBeErr(Cl.uint(100));
        });

        it("sends token tip with whitelisted token", () => {
            const tokenPrincipal = `${deployer}.tipstream-token`;

            simnet.callPublicFn(
                "tipstream",
                "whitelist-token",
                [Cl.principal(tokenPrincipal), Cl.bool(true)],
                deployer
            );

            simnet.callPublicFn(
                "tipstream-token",
                "mint",
                [Cl.uint(1000000), Cl.principal(wallet1)],
                deployer
            );

            const { result } = simnet.callPublicFn(
                "tipstream",
                "send-token-tip",
                [
                    Cl.contractPrincipal(deployer.split(".")[0] || deployer, "tipstream-token"),
                    Cl.principal(wallet2),
                    Cl.uint(5000),
                    Cl.stringUtf8("TIPS for you!"),
                ],
                wallet1
            );
            expect(result).toBeOk(Cl.uint(0));

            const { result: tipData } = simnet.callReadOnlyFn(
                "tipstream",
                "get-token-tip",
                [Cl.uint(0)],
                deployer
            );
            expect(tipData).not.toBeNone();
        });

        it("tracks total token tips count", () => {
            const tokenPrincipal = `${deployer}.tipstream-token`;

            simnet.callPublicFn(
                "tipstream",
                "whitelist-token",
                [Cl.principal(tokenPrincipal), Cl.bool(true)],
                deployer
            );

            simnet.callPublicFn(
                "tipstream-token",
                "mint",
                [Cl.uint(1000000), Cl.principal(wallet1)],
                deployer
            );

            simnet.callPublicFn(
                "tipstream",
                "send-token-tip",
                [
                    Cl.contractPrincipal(deployer.split(".")[0] || deployer, "tipstream-token"),
                    Cl.principal(wallet2),
                    Cl.uint(1000),
                    Cl.stringUtf8("tip 1"),
                ],
                wallet1
            );

            const { result } = simnet.callReadOnlyFn(
                "tipstream",
                "get-total-token-tips",
                [],
                deployer
            );
            const count = (result as any).value.value;
            expect(Number(count)).toBeGreaterThanOrEqual(1);
        });
    });
});
