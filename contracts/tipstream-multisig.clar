;; TipStream Multisig
;; Multi-signature admin operations for secure platform management
;; Requires multiple signers to approve transactions before execution

(define-constant contract-owner tx-sender)
(define-constant err-not-signer (err u1100))
(define-constant err-already-signed (err u1101))
(define-constant err-not-found (err u1102))
(define-constant err-already-executed (err u1103))
(define-constant err-threshold-not-met (err u1104))
(define-constant err-invalid-params (err u1105))
(define-constant err-owner-only (err u1106))

(define-data-var signer-count uint u0)
(define-data-var required-signatures uint u2)
(define-data-var tx-nonce uint u0)

;; Authorized signers
(define-map signers principal bool)

;; Multi-sig transaction proposals
(define-map multisig-txs
    { tx-id: uint }
    {
        proposer: principal,
        description: (string-utf8 200),
        signatures: uint,
        executed: bool,
        action-type: (string-ascii 20),
        action-value: uint
    }
)

;; Track individual signatures per transaction
(define-map tx-signatures
    { tx-id: uint, signer: principal }
    bool
)

;; ---------- Signer Management ----------

(define-public (add-signer (signer principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (not (is-signer signer)) err-invalid-params)
        (map-set signers signer true)
        (var-set signer-count (+ (var-get signer-count) u1))
        (ok true)
    )
)

(define-public (remove-signer (signer principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-signer signer) err-invalid-params)
        (map-set signers signer false)
        (var-set signer-count (- (var-get signer-count) u1))
        (ok true)
    )
)

(define-public (set-required-signatures (required uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> required u0) err-invalid-params)
        (asserts! (<= required (var-get signer-count)) err-invalid-params)
        (var-set required-signatures required)
        (ok true)
    )
)

;; ---------- Transaction Lifecycle ----------

;; Propose a new multi-sig transaction (proposer auto-signs)
(define-public (propose-tx (description (string-utf8 200)) (action-type (string-ascii 20)) (action-value uint))
    (let
        (
            (tx-id (var-get tx-nonce))
        )
        (asserts! (is-signer tx-sender) err-not-signer)
        (map-set multisig-txs
            { tx-id: tx-id }
            {
                proposer: tx-sender,
                description: description,
                signatures: u1,
                executed: false,
                action-type: action-type,
                action-value: action-value
            }
        )
        (map-set tx-signatures { tx-id: tx-id, signer: tx-sender } true)
        (var-set tx-nonce (+ tx-id u1))
        (ok tx-id)
    )
)

;; Sign a proposed transaction
(define-public (sign-tx (tx-id uint))
    (let
        (
            (tx-data (unwrap! (map-get? multisig-txs { tx-id: tx-id }) err-not-found))
        )
        (asserts! (is-signer tx-sender) err-not-signer)
        (asserts! (not (get executed tx-data)) err-already-executed)
        (asserts! (not (has-signed tx-id tx-sender)) err-already-signed)
        (map-set tx-signatures { tx-id: tx-id, signer: tx-sender } true)
        (map-set multisig-txs
            { tx-id: tx-id }
            (merge tx-data { signatures: (+ (get signatures tx-data) u1) })
        )
        (ok true)
    )
)

;; Dispatch admin action to the core contract
(define-private (dispatch-action (action (string-ascii 20)) (value uint))
    (if (is-eq action "set-paused")
        (contract-call? .tipstream set-paused (> value u0))
        (if (is-eq action "set-fee")
            (contract-call? .tipstream set-fee-basis-points value)
            (if (is-eq action "propose-fee")
                (contract-call? .tipstream propose-fee-change value)
                (if (is-eq action "execute-fee")
                    (contract-call? .tipstream execute-fee-change)
                    (if (is-eq action "cancel-fee")
                        (contract-call? .tipstream cancel-fee-change)
                        (if (is-eq action "propose-pause")
                            (contract-call? .tipstream propose-pause-change (> value u0))
                            (if (is-eq action "execute-pause")
                                (contract-call? .tipstream execute-pause-change)
                                (ok true)
                            )
                        )
                    )
                )
            )
        )
    )
)

;; Execute a transaction once signature threshold is met
(define-public (execute-tx (tx-id uint))
    (let
        (
            (tx-data (unwrap! (map-get? multisig-txs { tx-id: tx-id }) err-not-found))
        )
        (asserts! (is-signer tx-sender) err-not-signer)
        (asserts! (not (get executed tx-data)) err-already-executed)
        (asserts! (>= (get signatures tx-data) (var-get required-signatures)) err-threshold-not-met)
        (try! (dispatch-action (get action-type tx-data) (get action-value tx-data)))
        (map-set multisig-txs
            { tx-id: tx-id }
            (merge tx-data { executed: true })
        )
        (ok true)
    )
)

;; ---------- Read-Only Queries ----------

(define-read-only (get-tx (tx-id uint))
    (map-get? multisig-txs { tx-id: tx-id })
)

(define-read-only (get-tx-count)
    (var-get tx-nonce)
)

(define-read-only (is-signer (who principal))
    (default-to false (map-get? signers who))
)

(define-read-only (get-required-signatures)
    (var-get required-signatures)
)

(define-read-only (get-signer-count)
    (var-get signer-count)
)

(define-read-only (has-signed (tx-id uint) (signer principal))
    (default-to false (map-get? tx-signatures { tx-id: tx-id, signer: signer }))
)
