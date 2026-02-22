;; TipStream DAO
;; Token-weighted governance for the TipStream platform
;; TIPS token holders can create proposals and vote

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u600))
(define-constant err-not-found (err u601))
(define-constant err-already-voted (err u602))
(define-constant err-proposal-ended (err u603))
(define-constant err-no-voting-power (err u605))
(define-constant err-invalid-input (err u606))

;; ~1 day in Stacks blocks
(define-data-var voting-period uint u144)
(define-data-var proposal-nonce uint u0)

(define-map proposals
    { proposal-id: uint }
    {
        proposer: principal,
        title: (string-utf8 100),
        description: (string-utf8 500),
        start-height: uint,
        end-height: uint,
        votes-for: uint,
        votes-against: uint,
        executed: bool
    }
)

(define-map votes
    { proposal-id: uint, voter: principal }
    { amount: uint, in-favor: bool }
)

;; Create a governance proposal (must hold TIPS tokens)
(define-public (create-proposal (title (string-utf8 100)) (description (string-utf8 500)))
    (let
        (
            (proposal-id (var-get proposal-nonce))
            (voter-balance (unwrap-panic (contract-call? .tipstream-token get-balance tx-sender)))
        )
        (asserts! (> voter-balance u0) err-no-voting-power)
        (asserts! (> (len title) u0) err-invalid-input)
        (map-set proposals
            { proposal-id: proposal-id }
            {
                proposer: tx-sender,
                title: title,
                description: description,
                start-height: block-height,
                end-height: (+ block-height (var-get voting-period)),
                votes-for: u0,
                votes-against: u0,
                executed: false
            }
        )
        (var-set proposal-nonce (+ proposal-id u1))
        (ok proposal-id)
    )
)

;; Vote on a proposal (token-weighted, one vote per address)
(define-public (vote (proposal-id uint) (in-favor bool))
    (let
        (
            (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) err-not-found))
            (voter-balance (unwrap-panic (contract-call? .tipstream-token get-balance tx-sender)))
        )
        (asserts! (> voter-balance u0) err-no-voting-power)
        (asserts! (<= block-height (get end-height proposal)) err-proposal-ended)
        (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: tx-sender })) err-already-voted)
        (map-set votes
            { proposal-id: proposal-id, voter: tx-sender }
            { amount: voter-balance, in-favor: in-favor }
        )
        (map-set proposals
            { proposal-id: proposal-id }
            (merge proposal {
                votes-for: (if in-favor
                    (+ (get votes-for proposal) voter-balance)
                    (get votes-for proposal)),
                votes-against: (if (not in-favor)
                    (+ (get votes-against proposal) voter-balance)
                    (get votes-against proposal))
            })
        )
        (ok true)
    )
)

;; Mark a proposal as executed (owner only, after voting ends)
(define-public (execute-proposal (proposal-id uint))
    (let
        (
            (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> block-height (get end-height proposal)) err-proposal-ended)
        (asserts! (> (get votes-for proposal) (get votes-against proposal)) err-no-voting-power)
        (map-set proposals
            { proposal-id: proposal-id }
            (merge proposal { executed: true })
        )
        (ok true)
    )
)

;; Admin: adjust voting period
(define-public (set-voting-period (new-period uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> new-period u0) err-invalid-input)
        (var-set voting-period new-period)
        (ok true)
    )
)

;; ---------- Read-only ----------

(define-read-only (get-proposal (proposal-id uint))
    (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
    (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (get-proposal-count)
    (var-get proposal-nonce)
)

(define-read-only (get-voting-period)
    (var-get voting-period)
)

(define-read-only (has-proposal-passed (proposal-id uint))
    (match (map-get? proposals { proposal-id: proposal-id })
        proposal (and (> block-height (get end-height proposal))
                      (> (get votes-for proposal) (get votes-against proposal)))
        false
    )
)
