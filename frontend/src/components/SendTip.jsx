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

// Use a placeholder address for now, will be updated during deployment
const CONTRACT_ADDRESS = 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T';
const CONTRACT_NAME = 'tipstream';

export default function SendTip() {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendTip = async () => {
        if (!recipient || !amount) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            const microSTX = Math.floor(parseFloat(amount) * 1000000);
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
                    console.log('Transaction:', data.txId);
                    setLoading(false);
                    setRecipient('');
                    setAmount('');
                    setMessage('');
                    alert('Tip sent successfully! (Transaction: ' + data.txId + ')');
                },
                onCancel: () => {
                    setLoading(false);
                }
            };

            await openContractCall(options);
        } catch (error) {
            console.error('Error sending tip:', error);
            alert('Failed to send tip');
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

                <button
                    onClick={handleSendTip}
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
        </div>
    );
}
