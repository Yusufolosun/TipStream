import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { openContractCall } from '@stacks/connect';
import {
    PostConditionMode,
    Pc
} from '@stacks/transactions';
import { buildSendCategorizedTipArgs, CONTRACT_FUNCTIONS } from '../types/contracts';
import { network, appDetails, userSession, authenticate } from '../utils/stacks';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';
import { toMicroSTX, formatSTX } from '../lib/utils';
import { useTipContext } from '../context/TipContext';
import { useBalance } from '../hooks/useBalance';
import { useStxPrice } from '../hooks/useStxPrice';
import { analytics } from '../lib/analytics';
import { useDemoMode } from '../context/DemoContext';
import ConfirmDialog from './ui/confirm-dialog';
import TxStatus from './ui/tx-status';

const FEE_BASIS_POINTS = 50;
const BASIS_POINTS_DIVISOR = 10000;
const MIN_TIP_STX = 0.001;
const MAX_TIP_STX = 10000;
const COOLDOWN_SECONDS = 10;

const TIP_CATEGORIES = [
    { id: 0, label: 'General' },
    { id: 1, label: 'Content Creation' },
    { id: 2, label: 'Open Source' },
    { id: 3, label: 'Community Help' },
    { id: 4, label: 'Appreciation' },
    { id: 5, label: 'Education' },
    { id: 6, label: 'Bug Bounty' },
];

export default function SendTip({ addToast, defaultRecipient = '', initialAmount = '', initialMessage = '', initialCategory = 0 }) {
    const { notifyTipSent } = useTipContext();
    const { toUsd } = useStxPrice();
    const { isDemo, simulateTipSend, demoBalance } = useDemoMode();
    const [recipient, setRecipient] = useState(defaultRecipient);
    const [amount, setAmount] = useState(initialAmount);
    const [message, setMessage] = useState(initialMessage);
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState(initialCategory);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingTx, setPendingTx] = useState(null);
    const [recipientError, setRecipientError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const cooldownRef = useRef(null);

    useEffect(() => {
        if (defaultRecipient) {
            setRecipient(defaultRecipient);
            setRecipientError('');
        }
    }, [defaultRecipient]);

    useEffect(() => {
        return () => {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, []);

    const startCooldown = useCallback(() => {
        setCooldown(COOLDOWN_SECONDS);
        cooldownRef.current = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current);
                    cooldownRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const senderAddress = useMemo(() => {
        if (isDemo) return 'SP1DEMO000000000000000000000SANDBOX';
        try {
            return userSession.loadUserData().profile.stxAddress.mainnet;
        } catch {
            return null;
        }
    }, [isDemo]);

    const { balance, loading: balanceLoading, refetch: refetchBalance } = useBalance(isDemo ? null : senderAddress);

    const balanceSTX = isDemo
        ? demoBalance / 1_000_000
        : balance !== null ? Number(balance) / 1_000_000 : null;

    const isValidStacksAddress = (address) => {
        if (!address) return false;
        const trimmed = address.trim();
        if (trimmed.length < 38 || trimmed.length > 41) return false;
        return /^(SP|SM|ST)[0-9A-Z]{33,39}$/i.test(trimmed);
    };

    const handleRecipientChange = (value) => {
        setRecipient(value);
        if (value && !isValidStacksAddress(value)) {
            setRecipientError('Enter a valid Stacks address (SP... or SM...)');
        } else {
            setRecipientError('');
        }
    };

    const handleAmountChange = (value) => {
        setAmount(value);
        if (!value) {
            setAmountError('');
            return;
        }
        const parsed = parseFloat(value);
        if (isNaN(parsed) || parsed <= 0) {
            setAmountError('Amount must be a positive number');
        } else if (parsed < MIN_TIP_STX) {
            setAmountError(`Minimum tip is ${MIN_TIP_STX} STX`);
        } else if (parsed > MAX_TIP_STX) {
            setAmountError(`Maximum tip is ${MAX_TIP_STX.toLocaleString()} STX`);
        } else if (balanceSTX !== null && parsed > balanceSTX) {
            setAmountError('Insufficient balance');
        } else {
            setAmountError('');
        }
    };

    const validateAndConfirm = () => {
        if (!userSession.isUserSignedIn()) {
            authenticate().catch(e => addToast(e.message || 'Failed to connect wallet', 'error'));
            return;
        }

        if (cooldown > 0) {
            addToast(`Please wait ${cooldown}s before sending another tip`, 'warning');
            return;
        }

        if (!recipient || !amount) {
            addToast('Please fill in all required fields', 'warning');
            return;
        }

        if (!isValidStacksAddress(recipient)) {
            addToast('Invalid Stacks address format', 'warning');
            return;
        }

        if (senderAddress && recipient.trim() === senderAddress) {
            addToast('You cannot send a tip to yourself', 'warning');
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            addToast('Please enter a valid tip amount greater than zero', 'warning');
            return;
        }

        if (parsedAmount < MIN_TIP_STX) {
            addToast(`Minimum tip amount is ${MIN_TIP_STX} STX`, 'warning');
            return;
        }

        if (parsedAmount > MAX_TIP_STX) {
            addToast(`Maximum tip amount is ${MAX_TIP_STX.toLocaleString()} STX`, 'warning');
            return;
        }

        if (balanceSTX !== null && parsedAmount > balanceSTX) {
            addToast('Insufficient STX balance for this tip', 'warning');
            return;
        }

        setShowConfirm(true);
        analytics.trackTipStarted();
    };

    const handleSendTip = async () => {
        setShowConfirm(false);
        analytics.trackTipSubmitted();

        setLoading(true);

        // Demo mode: simulate tip sending
        if (isDemo) {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
            const result = simulateTipSend({
                recipient: recipient.trim(),
                amount: toMicroSTX(amount),
                message: message || 'Thanks!',
                category,
            });
            setLoading(false);
            setPendingTx({
                txId: result.txId,
                recipient,
                amount: parseFloat(amount),
            });
            setRecipient('');
            setAmount('');
            setMessage('');
            setCategory(0);
            notifyTipSent();
            startCooldown();
            addToast('Demo tip sent! (simulated — no real STX used)', 'success');
            return;
        }

        try {
            const microSTX = toMicroSTX(amount);
            // senderAddress is already computed via useMemo

            const postConditions = [
                Pc.principal(senderAddress).willSendLte(microSTX).ustx()
            ];

            const functionArgs = buildSendCategorizedTipArgs({
                recipient,
                amount: microSTX,
                message: message || 'Thanks!',
                category
            });


            const options = {
                network,
                appDetails,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: CONTRACT_FUNCTIONS.SEND_CATEGORIZED_TIP,
                functionArgs,
                postConditions,
                postConditionMode: PostConditionMode.Deny,
                onFinish: (data) => {
                    setLoading(false);
                    setPendingTx({
                        txId: data.txId,
                        recipient,
                        amount: parseFloat(amount),
                    });
                    setRecipient('');
                    setAmount('');
                    setMessage('');
                    setCategory(0);
                    notifyTipSent();
                    refetchBalance();
                    startCooldown();
                    analytics.trackTipConfirmed();
                    addToast('Tip sent successfully! Transaction: ' + data.txId, 'success');
                },
                onCancel: () => {
                    console.info('Transaction cancelled by user');
                    setLoading(false);
                    analytics.trackTipCancelled();
                    addToast('Transaction cancelled. Your funds were not transferred.', 'info');
                }
            };

            await openContractCall(options);
        } catch (error) {
            console.error('Failed to send tip:', error.message || error);
            analytics.trackTipFailed();
            analytics.trackError('SendTip', error.message || 'Unknown error');
            addToast('Failed to send tip. Please try again.', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Send a Tip</h2>

            {senderAddress && (
                <div className="mb-5 flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Your Balance</p>
                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {balanceLoading
                                ? 'Loading...'
                                : balanceSTX !== null
                                    ? `${balanceSTX.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} STX`
                                    : 'Unavailable'}
                        </p>
                    </div>
                    <button
                        onClick={refetchBalance}
                        disabled={balanceLoading}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                        title="Refresh balance"
                    >
                        <svg className={`w-4 h-4 ${balanceLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                        Recipient Address
                    </label>
                    <input
                        type="text"
                        value={recipient}
                        onChange={(e) => handleRecipientChange(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none dark:bg-gray-800 dark:text-white ${recipientError ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                        placeholder="SP2..."
                    />
                    {recipientError && (
                        <p className="mt-1 text-xs text-red-500">{recipientError}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                        Amount (STX)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none dark:bg-gray-800 dark:text-white ${amountError ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                        placeholder="0.5"
                        step="0.001"
                        min={MIN_TIP_STX}
                        max={MAX_TIP_STX}
                    />
                    {amountError && (
                        <p className="mt-1 text-xs text-red-500">{amountError}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                        Message (optional)
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none resize-none"
                        placeholder="Great work!"
                        maxLength={280}
                        rows={3}
                    />
                    <div className="flex justify-end mt-1">
                        <p className={`text-xs ${message.length >= 280 ? 'text-red-500' : 'text-gray-400'}`}>
                            {message.length}/280 characters
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                        Category
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition-all outline-none"
                    >
                        {TIP_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>

                {amount && parseFloat(amount) > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
                        <p className="font-semibold text-gray-700 mb-2">Transaction Breakdown</p>
                        <div className="space-y-1 text-gray-600">
                            <div className="flex justify-between">
                                <span>Tip amount</span>
                                <span>
                                    {parseFloat(amount).toFixed(6)} STX
                                    {toUsd(amount) && <span className="text-gray-400 ml-1">(~${toUsd(amount)})</span>}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Platform fee (0.5%)</span>
                                <span>
                                    {formatSTX(
                                        Math.floor(toMicroSTX(amount) * FEE_BASIS_POINTS / BASIS_POINTS_DIVISOR),
                                        6
                                    )} STX
                                </span>
                            </div>
                            <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between font-semibold text-gray-800">
                                <span>Recipient receives</span>
                                <span>
                                    {(() => {
                                        const net = toMicroSTX(amount) - Math.floor(toMicroSTX(amount) * FEE_BASIS_POINTS / BASIS_POINTS_DIVISOR);
                                        const netStx = formatSTX(net, 6);
                                        return (
                                            <>
                                                {netStx} STX
                                                {toUsd(parseFloat(netStx)) && <span className="font-normal text-gray-400 ml-1">(~${toUsd(parseFloat(netStx))})</span>}
                                            </>
                                        );
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={validateAndConfirm}
                    disabled={loading || cooldown > 0}
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform active:scale-95 transition-all disabled:bg-gray-400 disabled:shadow-none"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : cooldown > 0 ? `Wait ${cooldown}s` : 'Send Tip'}
                </button>
            </div>

            {pendingTx && (
                <div className="mt-6">
                    <p className="text-sm text-gray-700 mb-1">
                        Sent {pendingTx.amount} STX to{' '}
                        <span className="font-mono text-xs">{pendingTx.recipient.slice(0, 8)}...{pendingTx.recipient.slice(-4)}</span>
                    </p>
                    <TxStatus
                        txId={pendingTx.txId}
                        onConfirmed={() => addToast('Tip confirmed on-chain!', 'success')}
                        onFailed={(reason) => addToast(`Transaction failed: ${reason}`, 'error')}
                    />
                    <button
                        onClick={() => setPendingTx(null)}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <ConfirmDialog
                open={showConfirm}
                title="Confirm Tip"
                onConfirm={handleSendTip}
                onCancel={() => setShowConfirm(false)}
                confirmLabel="Send Tip"
            >
                <div className="space-y-2">
                    <p>You are about to send <strong>{amount} STX</strong> to:</p>
                    <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">{recipient}</p>
                    <p className="text-sm text-gray-600">Category: <strong>{TIP_CATEGORIES.find(c => c.id === category)?.label || 'General'}</strong></p>
                    {message && <p className="italic text-gray-500">"{message}"</p>}
                </div>
            </ConfirmDialog>
        </div>
    );
}
