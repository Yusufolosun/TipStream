;; TipStream Vault
;; Community treasury for pooled funds
;; Anyone can deposit, only authorized principals can withdraw

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u700))
(define-constant err-not-authorized (err u701))
(define-constant err-insufficient-funds (err u702))
(define-constant err-invalid-amount (err u703))

(define-map authorized-withdrawers principal bool)

(define-data-var total-deposits uint u0)
(define-data-var total-withdrawals uint u0)
(define-data-var deposit-count uint u0)

(define-map depositor-totals principal uint)

;; Anyone can deposit STX into the vault
(define-public (deposit (amount uint))
    (let
        (
            (current-total (default-to u0 (map-get? depositor-totals tx-sender)))
        )
        (asserts! (> amount u0) err-invalid-amount)
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        (map-set depositor-totals tx-sender (+ current-total amount))
        (var-set total-deposits (+ (var-get total-deposits) amount))
        (var-set deposit-count (+ (var-get deposit-count) u1))
        (ok true)
    )
)

;; Withdraw funds (owner or authorized contract like the DAO)
(define-public (withdraw (amount uint) (recipient principal))
    (begin
        (asserts! (or (is-eq contract-caller contract-owner)
                      (default-to false (map-get? authorized-withdrawers contract-caller)))
                  err-not-authorized)
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (<= amount (get-vault-balance)) err-insufficient-funds)
        (try! (as-contract (stx-transfer? amount tx-sender recipient)))
        (var-set total-withdrawals (+ (var-get total-withdrawals) amount))
        (ok true)
    )
)

;; Admin: authorize a contract or principal for withdrawals
(define-public (add-authorized (who principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (ok (map-set authorized-withdrawers who true))
    )
)

(define-public (remove-authorized (who principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (ok (map-set authorized-withdrawers who false))
    )
)

;; ---------- Read-only ----------

(define-read-only (get-vault-balance)
    (stx-get-balance (as-contract tx-sender))
)

(define-read-only (get-total-deposits)
    (var-get total-deposits)
)

(define-read-only (get-total-withdrawals)
    (var-get total-withdrawals)
)

(define-read-only (get-deposit-count)
    (var-get deposit-count)
)

(define-read-only (get-depositor-total (user principal))
    (default-to u0 (map-get? depositor-totals user))
)

(define-read-only (is-authorized (who principal))
    (default-to false (map-get? authorized-withdrawers who))
)
