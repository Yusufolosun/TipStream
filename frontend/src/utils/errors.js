/**
 * TipStream Smart Contract Error Codes Mapping
 * Mapping of Clarity error codes (u100-u114) to human-readable descriptions.
 */

export const ERROR_CODES = {
    100: 'Only the contract owner can perform this action.',
    101: 'The tip amount is invalid. Please ensure it is above the minimum and you are not tipping yourself.',
    102: 'Insufficient balance to complete the transaction.',
    103: 'STX transfer failed. Please try again.',
    104: 'The requested resource (e.g., tip ID) was not found.',
    105: 'Invalid profile data. Please check your display name and bio.',
    106: 'This transaction was blocked by the recipient.',
    107: 'The contract is currently paused for maintenance.',
    108: 'Only the pending owner can accept ownership.',
    109: 'The administrative timelock has not yet expired.',
    110: 'No pending change was found to execute.',
    111: 'You are not authorized to perform this administrative action.',
    112: 'Token transfer failed. Please ensure you have enough tokens.',
    113: 'This token is not whitelisted for tipping.',
    114: 'The selected tip category is invalid.',
};

/**
 * Retrieves a human-readable error message for a given error code.
 * @param {number|string} code - The numeric error code from the smart contract.
 * @returns {string} - A user-friendly error message.
 */
export function getErrorMessage(code) {
    const numericCode = parseInt(code);
    return ERROR_CODES[numericCode] || `An unexpected error occurred (Code: ${code}).`;
}

/**
 * Parses a Clarity error response string to extract the numeric code.
 * Handles formats like "(err u100)" or hex strings if necessary.
 * @param {string} result - The tx_result from the Stacks API.
 * @returns {number|null} - The extracted error code or null if not found.
 */
export function parseErrorCode(result) {
    if (!result) return null;

    // Handle (err u100) format
    const match = result.match(/\(err u(\d+)\)/);
    if (match) return parseInt(match[1]);

    // Handle hex format (Response err [uint]) if API returns it
    // This is a simplified check for common Stacks hex error responses
    if (result.startsWith('0x0801')) {
        try {
            // Very basic extraction for uint error values in this project's range (100-114)
            const hexValue = result.slice(-4);
            return parseInt(hexValue, 16);
        } catch (e) {
            return null;
        }
    }

    return null;
}
