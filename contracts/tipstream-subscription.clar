;; TipStream Subscriptions
;; Recurring patronage payments from subscribers to content creators
;; Subscribers control their own payment triggers

(define-constant err-invalid-amount (err u500))
(define-constant err-not-found (err u501))
(define-constant err-not-authorized (err u502))
(define-constant err-too-early (err u503))
(define-constant err-already-cancelled (err u504))

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
        active: bool
    }
)

(define-map subscriber-sub-count principal uint)
(define-map creator-sub-count principal uint)

;; Create a subscription with an immediate first payment
(define-public (create-subscription (creator principal) (amount uint) (interval-blocks uint))
    (let
        (
            (sub-id (var-get subscription-nonce))
            (sub-count (default-to u0 (map-get? subscriber-sub-count tx-sender)))
            (creator-subs (default-to u0 (map-get? creator-sub-count creator)))
        )
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (> interval-blocks u0) err-invalid-amount)
        (asserts! (not (is-eq tx-sender creator)) err-invalid-amount)
        ;; First payment
        (try! (stx-transfer? amount tx-sender creator))
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
                active: true
            }
        )
        (map-set subscriber-sub-count tx-sender (+ sub-count u1))
        (map-set creator-sub-count creator (+ creator-subs u1))
        (var-set subscription-nonce (+ sub-id u1))
        (ok sub-id)
    )
)

;; Process a recurring payment (subscriber calls this when interval has elapsed)
(define-public (process-payment (sub-id uint))
    (let
        (
            (sub (unwrap! (map-get? subscriptions { sub-id: sub-id }) err-not-found))
            (amount (get amount sub))
            (last-payment (get last-payment-height sub))
            (interval (get interval-blocks sub))
        )
        (asserts! (get active sub) err-already-cancelled)
        (asserts! (is-eq tx-sender (get subscriber sub)) err-not-authorized)
        (asserts! (>= block-height (+ last-payment interval)) err-too-early)
        (try! (stx-transfer? amount tx-sender (get creator sub)))
        (map-set subscriptions
            { sub-id: sub-id }
            (merge sub {
                last-payment-height: block-height,
                total-paid: (+ (get total-paid sub) amount),
                payments-made: (+ (get payments-made sub) u1)
            })
        )
        (ok true)
    )
)

;; Cancel subscription (subscriber only)
(define-public (cancel-subscription (sub-id uint))
    (let
        (
            (sub (unwrap! (map-get? subscriptions { sub-id: sub-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get subscriber sub)) err-not-authorized)
        (asserts! (get active sub) err-already-cancelled)
        (map-set subscriptions
            { sub-id: sub-id }
            (merge sub { active: false })
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
