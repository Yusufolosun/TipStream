;; TipStream Referral
;; Referral tracking with voluntary bonus payments
;; Users register who referred them, then can send voluntary STX bonuses

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u900))
(define-constant err-already-referred (err u901))
(define-constant err-self-referral (err u902))
(define-constant err-no-referrer (err u903))
(define-constant err-invalid-amount (err u904))

;; referred user -> referrer
(define-map referrals principal principal)

;; referrer -> number of users referred
(define-map referral-count principal uint)

;; referrer -> total STX bonus earned
(define-map total-bonus-earned principal uint)

(define-data-var total-referrals uint u0)

;; ---------- Referral Registration ----------

(define-public (register-referral (referrer principal))
    (begin
        (asserts! (not (is-eq tx-sender referrer)) err-self-referral)
        (asserts! (is-none (map-get? referrals tx-sender)) err-already-referred)
        (map-set referrals tx-sender referrer)
        (map-set referral-count referrer
            (+ (default-to u0 (map-get? referral-count referrer)) u1))
        (var-set total-referrals (+ (var-get total-referrals) u1))
        (ok true)
    )
)

;; ---------- Bonus Payments ----------

;; Send a voluntary STX bonus to your referrer
(define-public (send-referral-bonus (amount uint))
    (let
        (
            (referrer (unwrap! (map-get? referrals tx-sender) err-no-referrer))
            (current-earned (default-to u0 (map-get? total-bonus-earned referrer)))
        )
        (asserts! (> amount u0) err-invalid-amount)
        (try! (stx-transfer? amount tx-sender referrer))
        (map-set total-bonus-earned referrer (+ current-earned amount))
        (ok true)
    )
)

;; ---------- Read-Only Queries ----------

(define-read-only (get-referrer (user principal))
    (map-get? referrals user)
)

(define-read-only (get-referral-count (referrer principal))
    (default-to u0 (map-get? referral-count referrer))
)

(define-read-only (get-total-bonus-earned (referrer principal))
    (default-to u0 (map-get? total-bonus-earned referrer))
)

(define-read-only (get-total-referrals)
    (var-get total-referrals)
)

(define-read-only (is-referred (user principal))
    (is-some (map-get? referrals user))
)
