import {
    principalCV,
    uintCV,
    stringUtf8CV,
    ClarityValue
} from '@stacks/transactions';

// Contract Constants
export const CONTRACT_FUNCTIONS = {
    SEND_TIP: 'send-tip',
    SEND_CATEGORIZED_TIP: 'send-categorized-tip',
    UPDATE_PROFILE: 'update-profile',
    GET_PROFILE: 'get-profile',
    GET_USER_STATS: 'get-user-stats',
    GET_PLATFORM_STATS: 'get-platform-stats',
    IS_USER_BLOCKED: 'is-user-blocked',
    TOGGLE_BLOCK_USER: 'toggle-block-user',
    SET_PAUSED: 'set-paused',
    SET_FEE_BASIS_POINTS: 'set-fee-basis-points',
    GET_CONTRACT_OWNER: 'get-contract-owner',
    GET_FEE_FOR_AMOUNT: 'get-fee-for-amount',
} as const;

export type ContractFunctionName = typeof CONTRACT_FUNCTIONS[keyof typeof CONTRACT_FUNCTIONS];

export interface TipEvent {
    event: string;
    sender: string;
    recipient: string;
    amount: string;
    fee: string;
    message: string;
    tipId: string;
}

export interface UserStats {
    totalSent: number;
    totalReceived: number;
    tipsSentCount: number;
    tipsReceivedCount: number;
}

// Contract Response Interfaces (after cvToJSON)
export interface ProfileResponse {
    value?: {
        'display-name': { value: string };
        'bio': { value: string };
        'avatar-url': { value: string };
    };
}

export interface StatsResponse {
    value: {
        'tips-sent': { value: string };
        'tips-received': { value: string };
        'total-sent': { value: string };
        'total-received': { value: string };
    };
}

export interface UserProfile {
    displayName: string;
    bio: string;
    avatarUrl?: string;
}

// Function Argument Interfaces
export interface SendTipArgs {
    recipient: string;
    amount: number; // in microSTX
    message: string;
}

export interface SendCategorizedTipArgs extends SendTipArgs {
    category: number;
}

export interface UpdateProfileArgs {
    displayName: string;
    bio: string;
    avatarUrl: string;
}

// Argument Builder Helpers
export const buildSendTipArgs = (args: SendTipArgs): ClarityValue[] => [
    principalCV(args.recipient),
    uintCV(args.amount),
    stringUtf8CV(args.message || 'Thanks!')
];

export const buildSendCategorizedTipArgs = (args: SendCategorizedTipArgs): ClarityValue[] => [
    principalCV(args.recipient),
    uintCV(args.amount),
    stringUtf8CV(args.message || 'Thanks!'),
    uintCV(args.category)
];

export const buildUpdateProfileArgs = (args: UpdateProfileArgs): ClarityValue[] => [
    stringUtf8CV(args.displayName),
    stringUtf8CV(args.bio),
    stringUtf8CV(args.avatarUrl)
];

export const buildPrincipalArg = (address: string): ClarityValue[] => [
    principalCV(address)
];

// Re-exporting common types
export interface BatchTipEntry {
    recipient: string;
    amount: string;
}

export interface PendingTransaction {
    txId: string;
    recipient: string;
    amount: number;
}

export type TransactionStatus = 'pending' | 'success' | 'abort_by_response' | 'abort_by_post_condition';

export interface TransactionResult {
    tx_id: string;
    tx_status: TransactionStatus;
    tx_type: string;
    block_height?: number;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}
