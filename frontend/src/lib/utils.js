import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const MICRO_STX = 1_000_000;

/**
 * Convert micro-STX (integer) to STX (decimal string).
 * @param {number} microStx - Amount in micro-STX
 * @param {number} [decimals=6] - Decimal places to display
 * @returns {string} Formatted STX amount
 */
export function formatSTX(microStx, decimals = 6) {
    const value = Number(microStx) / MICRO_STX;
    return value.toFixed(decimals);
}

/**
 * Convert STX (decimal) to micro-STX (integer).
 * @param {number|string} stx - Amount in STX
 * @returns {number} Amount in micro-STX
 */
export function toMicroSTX(stx) {
    return Math.floor(parseFloat(stx) * MICRO_STX);
}
