import { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import {
    stringUtf8CV,
    uintCV,
    principalCV,
    PostConditionMode,
    Pc
} from '@stacks/transactions';
import { network, appDetails, userSession } from '../utils/stacks';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';
import { toMicroSTX, formatSTX } from '../lib/utils';
import ConfirmDialog from './ui/confirm-dialog';

const FEE_BASIS_POINTS = 50;
const BASIS_POINTS_DIVISOR = 10000;

export default function SendTip({ addToast }) {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const validateAndConfirm = () => {
        if (!recipient || !amount) {
            addToast('Please fill in all required fields', 'warning');
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            addToast('Please enter a valid tip amount greater than zero', 'warning');
            return;
        }

        if (parsedAmount < 0.001) {
            addToast('Minimum tip amount is 0.001 STX', 'warning');
            return;
        }

        setShowConfirm(true);
    };

    const handleSendTip = async () => {
        setShowConfirm(false);

        setLoading(true);

        try {
            const microSTX = toMicroSTX(amount);
            const senderAddress = userSession.loadUserData().profile.stxAddress.mainnet;

            const postConditions = [
                Pc.principal(senderAddress).willSendLte(microSTX).ustx()
            ];

            const functionArgs = [
                principalCV(recipient),
                uintCV(microSTX),
                stringUtf8CV(message || 'Thanks!')
            ];

            const options = {
                network,
                appDetails,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'send-tip',
                functionArgs,
                postConditions,
                postConditionMode: PostConditionMode.Deny,
                onFinish: (data) => {
                    setLoading(false);
                    setRecipient('');
                    setAmount('');
                    setMessage('');
                    addToast('Tip sent successfully! Transaction: ' + data.txId, 'success');
                },
                onCancel: () => {
                    console.info('Transaction cancelled by user');
                    setLoading(false);
                    addToast('Transaction cancelled. Your funds were not transferred.', 'info');
                }
            };

            await openContractCall(options);
        } catch (error) {
            console.error('Failed to send tip:', error.message || error);
            addToast('Failed to send tip. Please try again.', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Send a Tip</h2>

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Recipient Address
                    </label>
                    <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
                        placeholder="SP2..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Amount (STX)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
                        placeholder="0.5"
                        step="0.1"
                        min="0.01"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Message (optional)
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none resize-none"
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

                {amount && parseFloat(amount) > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
                        <p className="font-semibold text-gray-700 mb-2">Transaction Breakdown</p>
                        <div className="space-y-1 text-gray-600">
                            <div className="flex justify-between">
                                <span>Tip amount</span>
                                <span>{parseFloat(amount).toFixed(6)} STX</span>
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
                                    {formatSTX(
                                        toMicroSTX(amount) - Math.floor(toMicroSTX(amount) * FEE_BASIS_POINTS / BASIS_POINTS_DIVISOR),
                                        6
                                    )} STX
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={validateAndConfirm}
                    disabled={loading}
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
                    ) : 'Send Tip'}
                </button>
            </div>

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
                    {message && <p className="italic text-gray-500">"{message}"</p>}
                </div>
            </ConfirmDialog>
        </div>
    );
}
