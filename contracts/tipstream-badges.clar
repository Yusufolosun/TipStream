;; TipStream Badges
;; SIP-009 NFT achievement badges earned through tipping milestones
;; Badge types: 1=First Tip, 2=10 Tips, 3=50 Tips, 4=100 Tips, 5=Whale (1000+ STX)

(impl-trait .tipstream-traits.sip-009-trait)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u800))
(define-constant err-not-authorized (err u801))
(define-constant err-already-claimed (err u803))
(define-constant err-not-eligible (err u804))
(define-constant err-invalid-badge (err u805))

(define-non-fungible-token tipstream-badge uint)

(define-data-var last-token-id uint u0)

;; Track which badges each user has claimed
(define-map user-badges
    { user: principal, badge-type: uint }
    uint ;; token-id
)

;; Map token-id back to badge type
(define-map token-badge-type uint uint)

;; ---------- Badge Claims ----------

(define-public (claim-badge (badge-type uint))
    (let
        (
            (user-stats (contract-call? .tipstream get-user-stats tx-sender))
            (tips-sent (get tips-sent user-stats))
            (total-sent (get total-sent user-stats))
            (token-id (+ (var-get last-token-id) u1))
            (tip-threshold (get-tip-threshold badge-type))
            (volume-threshold (get-volume-threshold badge-type))
        )
        (asserts! (or (> tip-threshold u0) (> volume-threshold u0)) err-invalid-badge)
        (asserts! (is-none (map-get? user-badges { user: tx-sender, badge-type: badge-type })) err-already-claimed)
        (asserts! (>= tips-sent tip-threshold) err-not-eligible)
        (asserts! (>= total-sent volume-threshold) err-not-eligible)
        (try! (nft-mint? tipstream-badge token-id tx-sender))
        (map-set user-badges { user: tx-sender, badge-type: badge-type } token-id)
        (map-set token-badge-type token-id badge-type)
        (var-set last-token-id token-id)
        (ok token-id)
    )
)

;; ---------- Threshold Lookups ----------

(define-read-only (get-tip-threshold (badge-type uint))
    (if (is-eq badge-type u1) u1
        (if (is-eq badge-type u2) u10
            (if (is-eq badge-type u3) u50
                (if (is-eq badge-type u4) u100
                    u0))))
)

(define-read-only (get-volume-threshold (badge-type uint))
    (if (is-eq badge-type u5) u1000000000 ;; 1000 STX in microSTX
        u0)
)

;; ---------- SIP-009 Implementation ----------

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
    (begin
        (asserts! (is-eq tx-sender sender) err-not-authorized)
        (nft-transfer? tipstream-badge token-id sender recipient)
    )
)

(define-read-only (get-last-token-id)
    (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
    (ok none)
)

(define-read-only (get-owner (token-id uint))
    (ok (nft-get-owner? tipstream-badge token-id))
)

;; ---------- Badge Queries ----------

(define-read-only (has-badge (user principal) (badge-type uint))
    (is-some (map-get? user-badges { user: user, badge-type: badge-type }))
)

(define-read-only (get-badge-token-id (user principal) (badge-type uint))
    (map-get? user-badges { user: user, badge-type: badge-type })
)

(define-read-only (get-token-badge-type (token-id uint))
    (map-get? token-badge-type token-id)
)
