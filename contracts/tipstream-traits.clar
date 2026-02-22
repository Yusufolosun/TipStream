;; TipStream Traits
;; Shared trait definitions for the TipStream contract ecosystem

;; SIP-010 Fungible Token Standard
(define-trait sip-010-trait
    (
        (transfer (uint principal principal (optional (buff 34))) (response bool uint))
        (get-name () (response (string-ascii 32) uint))
        (get-symbol () (response (string-ascii 32) uint))
        (get-decimals () (response uint uint))
        (get-balance (principal) (response uint uint))
        (get-total-supply () (response uint uint))
        (get-token-uri () (response (optional (string-utf8 256)) uint))
    )
)

;; SIP-009 Non-Fungible Token Standard
(define-trait sip-009-trait
    (
        (get-last-token-id () (response uint uint))
        (get-token-uri (uint) (response (optional (string-utf8 256)) uint))
        (get-owner (uint) (response (optional principal) uint))
        (transfer (uint principal principal) (response bool uint))
    )
)
