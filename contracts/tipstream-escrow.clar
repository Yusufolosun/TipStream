;; TipStream Escrow
;; Time-locked tips that release to the recipient after a specified block height
;; Sender can cancel before the unlock height to reclaim funds

(define-constant err-invalid-amount (err u400))
(define-constant err-not-found (err u401))
(define-constant err-not-authorized (err u402))
(define-constant err-not-yet-unlocked (err u403))
(define-constant err-already-settled (err u404))

(define-data-var escrow-nonce uint u0)

(define-map escrows
    { escrow-id: uint }
    {
        sender: principal,
        recipient: principal,
        amount: uint,
        message: (string-utf8 280),
        unlock-height: uint,
        released: bool,
        cancelled: bool
    }
)

(define-map user-escrow-count principal uint)

;; Create a time-locked escrow tip
(define-public (create-escrow (recipient principal) (amount uint) (message (string-utf8 280)) (unlock-height uint))
    (let
        (
            (escrow-id (var-get escrow-nonce))
            (sender-count (default-to u0 (map-get? user-escrow-count tx-sender)))
        )
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (not (is-eq tx-sender recipient)) err-invalid-amount)
        (asserts! (> unlock-height block-height) err-invalid-amount)
        ;; Transfer STX from sender to this contract
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        (map-set escrows
            { escrow-id: escrow-id }
            {
                sender: tx-sender,
                recipient: recipient,
                amount: amount,
                message: message,
                unlock-height: unlock-height,
                released: false,
                cancelled: false
            }
        )
        (map-set user-escrow-count tx-sender (+ sender-count u1))
        (var-set escrow-nonce (+ escrow-id u1))
        (ok escrow-id)
    )
)

;; Release escrowed funds to recipient (anyone can trigger after unlock)
(define-public (release-escrow (escrow-id uint))
    (let
        (
            (escrow (unwrap! (map-get? escrows { escrow-id: escrow-id }) err-not-found))
            (recipient (get recipient escrow))
            (amount (get amount escrow))
        )
        (asserts! (not (get released escrow)) err-already-settled)
        (asserts! (not (get cancelled escrow)) err-already-settled)
        (asserts! (>= block-height (get unlock-height escrow)) err-not-yet-unlocked)
        (try! (as-contract (stx-transfer? amount tx-sender recipient)))
        (map-set escrows
            { escrow-id: escrow-id }
            (merge escrow { released: true })
        )
        (ok true)
    )
)

;; Cancel escrow and return funds to sender (only sender, only before unlock)
(define-public (cancel-escrow (escrow-id uint))
    (let
        (
            (escrow (unwrap! (map-get? escrows { escrow-id: escrow-id }) err-not-found))
            (sender (get sender escrow))
            (amount (get amount escrow))
        )
        (asserts! (is-eq tx-sender sender) err-not-authorized)
        (asserts! (not (get released escrow)) err-already-settled)
        (asserts! (not (get cancelled escrow)) err-already-settled)
        (asserts! (< block-height (get unlock-height escrow)) err-not-authorized)
        (try! (as-contract (stx-transfer? amount tx-sender sender)))
        (map-set escrows
            { escrow-id: escrow-id }
            (merge escrow { cancelled: true })
        )
        (ok true)
    )
)

;; ---------- Read-only ----------

(define-read-only (get-escrow (escrow-id uint))
    (map-get? escrows { escrow-id: escrow-id })
)

(define-read-only (get-escrow-count)
    (var-get escrow-nonce)
)

(define-read-only (get-user-escrow-count (user principal))
    (default-to u0 (map-get? user-escrow-count user))
)

(define-read-only (get-contract-balance)
    (stx-get-balance (as-contract tx-sender))
)
