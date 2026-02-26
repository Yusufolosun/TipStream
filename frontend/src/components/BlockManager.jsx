import { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import {
    fetchCallReadOnlyFunction,
    cvToJSON,
    principalCV,
    PostConditionMode
} from '@stacks/transactions';
import { network, appDetails, userSession } from '../utils/stacks';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';

export default function BlockManager({ addToast }) {
    const [targetAddress, setTargetAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkResult, setCheckResult] = useState(null);

    const userAddress = userSession.isUserSignedIn()
        ? userSession.loadUserData().profile.stxAddress.mainnet
        : null;

    const isValidAddress = (addr) => {
        if (!addr) return false;
        const trimmed = addr.trim();
        return trimmed.length >= 38 && trimmed.length <= 41 && /^(SP|SM|ST)[0-9A-Z]{33,39}$/i.test(trimmed);
    };

    const checkBlockStatus = async () => {
        if (!isValidAddress(targetAddress)) {
            addToast('Enter a valid Stacks address', 'warning');
            return;
        }

        try {
            const result = await fetchCallReadOnlyFunction({
                network,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'is-user-blocked',
                functionArgs: [principalCV(userAddress), principalCV(targetAddress.trim())],
                senderAddress: userAddress,
            });

            const json = cvToJSON(result);
            setCheckResult(json.value);
        } catch (err) {
            console.error('Failed to check block status:', err.message || err);
            addToast('Failed to check block status', 'error');
        }
    };

    const handleToggleBlock = async () => {
        if (!isValidAddress(targetAddress)) {
            addToast('Enter a valid Stacks address', 'warning');
            return;
        }

        setLoading(true);
        try {
            const options = {
                network,
                appDetails,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'toggle-block-user',
                functionArgs: [principalCV(targetAddress.trim())],
                postConditionMode: PostConditionMode.Deny,
                postConditions: [],
                onFinish: (data) => {
                    setLoading(false);
                    const action = checkResult ? 'unblocked' : 'blocked';
                    addToast(`User ${action}. Transaction: ${data.txId}`, 'success');
                    setCheckResult(!checkResult);
                },
                onCancel: () => {
                    setLoading(false);
                    addToast('Action cancelled', 'info');
                },
            };

            await openContractCall(options);
        } catch (err) {
            console.error('Failed to toggle block:', err.message || err);
            addToast('Failed to update block status', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Privacy Controls</h2>
            <p className="text-sm text-gray-500 mb-6">
                Block users to prevent them from sending you tips. Blocked users will
                receive an error when they try to tip you.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                        User Address
                    </label>
                    <input
                        type="text"
                        value={targetAddress}
                        onChange={(e) => {
                            setTargetAddress(e.target.value);
                            setCheckResult(null);
                        }}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
                        placeholder="SP2..."
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={checkBlockStatus}
                        disabled={!isValidAddress(targetAddress)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
                    >
                        Check Status
                    </button>
                    <button
                        onClick={handleToggleBlock}
                        disabled={loading || !isValidAddress(targetAddress)}
                        className={`flex-1 font-bold py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 ${
                            checkResult
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                    >
                        {loading ? 'Processing...' : checkResult ? 'Unblock User' : 'Block User'}
                    </button>
                </div>

                {checkResult !== null && (
                    <div className={`p-4 rounded-xl border text-sm font-medium ${
                        checkResult
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-green-50 border-green-200 text-green-700'
                    }`}>
                        {checkResult
                            ? 'This user is currently blocked from tipping you.'
                            : 'This user is not blocked.'}
                    </div>
                )}
            </div>
        </div>
    );
}
