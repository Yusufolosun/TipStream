;; TipStream Rewards
;; Earn TIPS tokens for tipping activity on the platform
;; Reads tip counts from tipstream.clar and mints TIPS via tipstream-token.clar

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u300))
(define-constant err-nothing-to-claim (err u301))

;; TIPS tokens awarded per tip sent (6 decimals, so 1000000 = 1 TIPS)
(define-data-var reward-per-tip uint u1000000)

;; Track how many tips each user has already claimed rewards for
(define-map claimed-tip-count principal uint)

;; Claim TIPS token rewards for unclaimed tips
(define-public (claim-rewards)
    (let
        (
            (user-stats (contract-call? .tipstream get-user-stats tx-sender))
            (total-sent (get tips-sent user-stats))
            (already-claimed (default-to u0 (map-get? claimed-tip-count tx-sender)))
            (unclaimed (- total-sent already-claimed))
            (reward (* unclaimed (var-get reward-per-tip)))
        )
        (asserts! (> unclaimed u0) err-nothing-to-claim)
        (try! (contract-call? .tipstream-token mint reward tx-sender))
        (map-set claimed-tip-count tx-sender total-sent)
        (ok reward)
    )
)

;; Admin: set the reward rate
(define-public (set-reward-per-tip (new-reward uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set reward-per-tip new-reward)
        (ok true)
    )
)

;; ---------- Read-only ----------

(define-read-only (get-unclaimed-rewards (user principal))
    (let
        (
            (user-stats (contract-call? .tipstream get-user-stats user))
            (total-sent (get tips-sent user-stats))
            (already-claimed (default-to u0 (map-get? claimed-tip-count user)))
            (unclaimed (- total-sent already-claimed))
        )
        (* unclaimed (var-get reward-per-tip))
    )
)

(define-read-only (get-claimed-count (user principal))
    (default-to u0 (map-get? claimed-tip-count user))
)

(define-read-only (get-reward-rate)
    (var-get reward-per-tip)
)
