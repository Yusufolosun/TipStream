;; TipStream Token (TIPS)
;; SIP-010 compliant fungible token for the TipStream ecosystem
;; Earned through tipping activity, used for governance voting

(impl-trait .tipstream-traits.sip-010-trait)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u200))
(define-constant err-not-authorized (err u201))

(define-fungible-token tips-token)

(define-data-var token-uri (optional (string-utf8 256)) none)

;; Track which contracts are allowed to mint
(define-map authorized-minters principal bool)

;; ---------- SIP-010 Implementation ----------

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq tx-sender sender) err-not-authorized)
        (try! (ft-transfer? tips-token amount sender recipient))
        (ok true)
    )
)

(define-read-only (get-name)
    (ok "TipStream Token")
)

(define-read-only (get-symbol)
    (ok "TIPS")
)

(define-read-only (get-decimals)
    (ok u6)
)

(define-read-only (get-balance (account principal))
    (ok (ft-get-balance tips-token account))
)

(define-read-only (get-total-supply)
    (ok (ft-get-supply tips-token))
)

(define-read-only (get-token-uri)
    (ok (var-get token-uri))
)

;; ---------- Minting ----------

(define-public (mint (amount uint) (recipient principal))
    (begin
        (asserts! (or (is-eq contract-caller contract-owner)
                      (default-to false (map-get? authorized-minters contract-caller)))
                  err-not-authorized)
        (ft-mint? tips-token amount recipient)
    )
)

;; ---------- Admin ----------

(define-public (add-minter (minter principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (ok (map-set authorized-minters minter true))
    )
)

(define-public (remove-minter (minter principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (ok (map-set authorized-minters minter false))
    )
)

(define-public (set-token-uri (new-uri (optional (string-utf8 256))))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set token-uri new-uri)
        (ok true)
    )
)

;; ---------- Read-only ----------

(define-read-only (is-authorized-minter (who principal))
    (default-to false (map-get? authorized-minters who))
)
