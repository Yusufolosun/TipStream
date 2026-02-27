;; TipStream Subscriptions
;; Deposit-and-claim recurring patronage payments
;; Subscribers deposit STX; creators or relayers claim after each interval

(define-constant err-invalid-amount (err u500))
(define-constant err-not-found (err u501))
(define-constant err-not-authorized (err u502))
(define-constant err-too-early (err u503))
(define-constant err-already-cancelled (err u504))
(define-constant err-not-claimant (err u505))
(define-constant err-insufficient-deposit (err u506))

(define-data-var subscription-nonce uint u0)

(define-map subscriptions
    { sub-id: uint }
    {
        subscriber: principal,
        creator: principal,
        amount: uint,
        interval-blocks: uint,
        last-payment-height: uint,
        total-paid: uint,
        payments-made: uint,
        deposit: uint,
        relayer: (optional principal),
        active: bool
    }
)

(define-map subscriber-sub-count principal uint)
(define-map creator-sub-count principal uint)

;; Create a subscription with an immediate first payment and optional deposit
(define-public (create-subscription (creator principal) (amount uint) (interval-blocks uint) (initial-deposit uint) (relayer (optional principal)))
    (let
        (
            (sub-id (var-get subscription-nonce))
            (sub-count (default-to u0 (map-get? subscriber-sub-count tx-sender)))
            (creator-subs (default-to u0 (map-get? creator-sub-count creator)))
        )
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (> interval-blocks u0) err-invalid-amount)
        (asserts! (not (is-eq tx-sender creator)) err-invalid-amount)
        ;; Transfer first payment directly to creator
        (try! (stx-transfer? amount tx-sender creator))
        ;; Transfer deposit to contract for future claims
        (if (> initial-deposit u0)
            (try! (stx-transfer? initial-deposit tx-sender (as-contract tx-sender)))
            true
        )
        (map-set subscriptions
            { sub-id: sub-id }
            {
                subscriber: tx-sender,
                creator: creator,
                amount: amount,
                interval-blocks: interval-blocks,
                last-payment-height: block-height,
                total-paid: amount,
                payments-made: u1,
                deposit: initial-deposit,
                relayer: relayer,
                active: true
            }
        )
        (map-set subscriber-sub-count tx-sender (+ sub-count u1))
        (map-set creator-sub-count creator (+ creator-subs u1))
        (var-set subscription-nonce (+ sub-id u1))
        (ok sub-id)
    )
)

;; Subscriber tops up the deposit for an active subscription
(define-public (fund-subscription (sub-id uint) (funding-amount uint))
    (let
        (
            (sub (unwrap! (map-get? subscriptions { sub-id: sub-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get subscriber sub)) err-not-authorized)
        (asserts! (get active sub) err-already-cancelled)
        (asserts! (> funding-amount u0) err-invalid-amount)
        (try! (stx-transfer? funding-amount tx-sender (as-contract tx-sender)))
        (map-set subscriptions
            { sub-id: sub-id }
            (merge sub { deposit: (+ (get deposit sub) funding-amount) })
        )
        (ok true)
    )
)

;; Creator or relayer claims a payment from the subscription deposit
(define-public (claim-payment (sub-id uint))
    (let
        (
            (sub (unwrap! (map-get? subscriptions { sub-id: sub-id }) err-not-found))
            (amount (get amount sub))
            (creator (get creator sub))
        )
        (asserts! (get active sub) err-already-cancelled)
        (asserts! (or
            (is-eq tx-sender creator)
            (is-eq (some tx-sender) (get relayer sub))
        ) err-not-claimant)
        (asserts! (>= block-height (+ (get last-payment-height sub) (get interval-blocks sub))) err-too-early)
        (asserts! (>= (get deposit sub) amount) err-insufficient-deposit)
        (try! (as-contract (stx-transfer? amount tx-sender creator)))
        (map-set subscriptions
            { sub-id: sub-id }
            (merge sub {
                last-payment-height: block-height,
                total-paid: (+ (get total-paid sub) amount),
                payments-made: (+ (get payments-made sub) u1),
                deposit: (- (get deposit sub) amount)
            })
        )
        (ok true)
    )
)

;; Subscriber self-triggers a payment from deposit
(define-public (process-payment (sub-id uint))
    (let
        (
            (sub (unwrap! (map-get? subscriptions { sub-id: sub-id }) err-not-found))
            (amount (get amount sub))
        )
        (asserts! (get active sub) err-already-cancelled)
        (asserts! (is-eq tx-sender (get subscriber sub)) err-not-authorized)
        (asserts! (>= block-height (+ (get last-payment-height sub) (get interval-blocks sub))) err-too-early)
        (asserts! (>= (get deposit sub) amount) err-insufficient-deposit)
        (try! (as-contract (stx-transfer? amount tx-sender (get creator sub))))
        (map-set subscriptions
            { sub-id: sub-id }
            (merge sub {
                last-payment-height: block-height,
                total-paid: (+ (get total-paid sub) amount),
                payments-made: (+ (get payments-made sub) u1),
                deposit: (- (get deposit sub) amount)
            })
        )
        (ok true)
    )
)

;; Cancel subscription and refund remaining deposit (subscriber only)
(define-public (cancel-subscription (sub-id uint))
    (let
        (
            (sub (unwrap! (map-get? subscriptions { sub-id: sub-id }) err-not-found))
            (remaining (get deposit sub))
        )
        (asserts! (is-eq tx-sender (get subscriber sub)) err-not-authorized)
        (asserts! (get active sub) err-already-cancelled)
        (if (> remaining u0)
            (try! (as-contract (stx-transfer? remaining tx-sender (get subscriber sub))))
            true
        )
        (map-set subscriptions
            { sub-id: sub-id }
            (merge sub { active: false, deposit: u0 })
        )
        (ok true)
    )
)

;; Update subscription amount (subscriber only)
(define-public (update-amount (sub-id uint) (new-amount uint))
    (let
        (
            (sub (unwrap! (map-get? subscriptions { sub-id: sub-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get subscriber sub)) err-not-authorized)
        (asserts! (get active sub) err-already-cancelled)
        (asserts! (> new-amount u0) err-invalid-amount)
        (map-set subscriptions
            { sub-id: sub-id }
            (merge sub { amount: new-amount })
        )
        (ok true)
    )
)

;; Update relayer (subscriber only)
(define-public (set-relayer (sub-id uint) (new-relayer (optional principal)))
    (let
        (
            (sub (unwrap! (map-get? subscriptions { sub-id: sub-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get subscriber sub)) err-not-authorized)
        (asserts! (get active sub) err-already-cancelled)
        (map-set subscriptions
            { sub-id: sub-id }
            (merge sub { relayer: new-relayer })
        )
        (ok true)
    )
)

;; ---------- Read-only ----------

(define-read-only (get-subscription (sub-id uint))
    (map-get? subscriptions { sub-id: sub-id })
)

(define-read-only (get-subscription-count)
    (var-get subscription-nonce)
)

(define-read-only (get-subscriber-count (user principal))
    (default-to u0 (map-get? subscriber-sub-count user))
)

(define-read-only (get-creator-subscribers (creator principal))
    (default-to u0 (map-get? creator-sub-count creator))
)

(define-read-only (is-payment-due (sub-id uint))
    (match (map-get? subscriptions { sub-id: sub-id })
        sub (and (get active sub)
                 (>= block-height (+ (get last-payment-height sub) (get interval-blocks sub))))
        false
    )
)

(define-read-only (get-next-payment-height (sub-id uint))
    (match (map-get? subscriptions { sub-id: sub-id })
        sub (ok (+ (get last-payment-height sub) (get interval-blocks sub)))
        err-not-found
    )
)
