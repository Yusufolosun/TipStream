import { useEffect, useState, useCallback } from 'react';
import { openContractCall } from '@stacks/connect';
import {
    fetchCallReadOnlyFunction,
    cvToJSON,
    boolCV,
    uintCV,
    PostConditionMode,
    principalCV
} from '@stacks/transactions';
import { buildPrincipalArg, CONTRACT_FUNCTIONS } from '../types/contracts';

import { network, appDetails, userSession } from '../utils/stacks';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';
import { formatSTX } from '../lib/utils';
import { analytics } from '../lib/analytics';

export default function AdminDashboard({ addToast }) {
    const [stats, setStats] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [currentFee, setCurrentFee] = useState('50');
    const [newFee, setNewFee] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);

    const userAddress = userSession.isUserSignedIn()
        ? userSession.loadUserData().profile.stxAddress.mainnet
        : null;

    const fetchAdminData = useCallback(async () => {
        try {
            const [statsResult, ownerResult, feeResult] = await Promise.all([
                fetchCallReadOnlyFunction({
                    network,
                    contractAddress: CONTRACT_ADDRESS,
                    contractName: CONTRACT_NAME,
                    functionName: CONTRACT_FUNCTIONS.GET_PLATFORM_STATS,
                    functionArgs: [],
                    senderAddress: CONTRACT_ADDRESS,
                }),
                fetchCallReadOnlyFunction({
                    network,
                    contractAddress: CONTRACT_ADDRESS,
                    contractName: CONTRACT_NAME,
                    functionName: CONTRACT_FUNCTIONS.GET_CONTRACT_OWNER || 'get-contract-owner',
                    functionArgs: [],
                    senderAddress: CONTRACT_ADDRESS,
                }),
                fetchCallReadOnlyFunction({
                    network,
                    contractAddress: CONTRACT_ADDRESS,
                    contractName: CONTRACT_NAME,
                    functionName: CONTRACT_FUNCTIONS.GET_FEE_FOR_AMOUNT || 'get-fee-for-amount',
                    functionArgs: [uintCV(10000)],
                    senderAddress: CONTRACT_ADDRESS,
                }),
            ]);

            const statsJson = cvToJSON(statsResult);
            setStats(statsJson.value);

            const ownerJson = cvToJSON(ownerResult);
            const contractOwner = ownerJson.value.value || ownerJson.value;
            setIsOwner(userAddress === contractOwner);

            const feeJson = cvToJSON(feeResult);
            const feeFor10000 = parseInt(feeJson.value.value || feeJson.value);
            const basisPoints = Math.round((feeFor10000 / 10000) * 10000);
            setCurrentFee(String(basisPoints));
        } catch (err) {
            console.error('Failed to fetch admin data:', err.message || err);
        }
        setLoading(false);
    }, [userAddress]);

    useEffect(() => {
        fetchAdminData();
        setAnalyticsData(analytics.getSummary());
    }, [fetchAdminData]);

    const handlePauseToggle = async () => {
        setActionLoading(true);
        try {
            await openContractCall({
                network,
                appDetails,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: CONTRACT_FUNCTIONS.SET_PAUSED || 'set-paused',
                functionArgs: [boolCV(!isPaused)],
                postConditionMode: PostConditionMode.Deny,
                postConditions: [],
                onFinish: (data) => {
                    setActionLoading(false);
                    setIsPaused(!isPaused);
                    addToast(`Contract ${!isPaused ? 'paused' : 'resumed'}. Tx: ${data.txId}`, 'success');
                },
                onCancel: () => {
                    setActionLoading(false);
                    addToast('Action cancelled', 'info');
                },
            });
        } catch (err) {
            console.error('Pause toggle failed:', err.message || err);
            addToast('Failed to update pause state', 'error');
            setActionLoading(false);
        }
    };

    const handleFeeUpdate = async () => {
        const fee = parseInt(newFee);
        if (isNaN(fee) || fee < 0 || fee > 1000) {
            addToast('Fee must be between 0 and 1000 basis points', 'warning');
            return;
        }

        setActionLoading(true);
        try {
            await openContractCall({
                network,
                appDetails,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: CONTRACT_FUNCTIONS.SET_FEE_BASIS_POINTS || 'set-fee-basis-points',
                functionArgs: [uintCV(fee)],
                postConditionMode: PostConditionMode.Deny,
                postConditions: [],
                onFinish: (data) => {
                    setActionLoading(false);
                    setCurrentFee(String(fee));
                    setNewFee('');
                    addToast(`Fee updated to ${fee} bps. Tx: ${data.txId}`, 'success');
                },
                onCancel: () => {
                    setActionLoading(false);
                    addToast('Action cancelled', 'info');
                },
            });
        } catch (err) {
            console.error('Fee update failed:', err.message || err);
            addToast('Failed to update fee', 'error');
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-500 font-medium">Loading admin panel...</p>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="max-w-lg mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Admin Dashboard</h2>
                <p className="text-gray-500">Only the contract owner can access admin controls.</p>
            </div>
        );
    }

    const AnalyticsPanel = () => {
        if (!analyticsData) return null;
        const a = analyticsData;

        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">Usage Analytics</h3>
                    <button
                        onClick={() => setAnalyticsData(analytics.getSummary())}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                    >
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-black text-gray-900">{a.totalPageViews}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Page Views</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-black text-gray-900">{a.walletConnections}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Wallet Connects</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-black text-gray-900">{a.sessions}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Sessions</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-black text-gray-900">{a.totalErrors}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Errors</p>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Tip Funnel</h4>
                    <div className="space-y-1.5">
                        {[
                            ['Started', a.tipsStarted],
                            ['Submitted', a.tipsSubmitted],
                            ['Confirmed', a.tipsConfirmed],
                            ['Cancelled', a.tipsCancelled],
                            ['Failed', a.tipsFailed],
                        ].map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{label}</span>
                                <span className="font-semibold text-gray-900">{count}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-100 pt-1.5 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Completion Rate</span>
                            <span className="font-bold text-green-600">{a.tipCompletionRate}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Drop-off Rate</span>
                            <span className="font-bold text-orange-500">{a.tipDropOffRate}%</span>
                        </div>
                    </div>
                </div>

                {a.sortedTabs.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Tab Navigation</h4>
                        <div className="space-y-1">
                            {a.sortedTabs.map(([tab, count]) => (
                                <div key={tab} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 font-mono text-xs">{tab}</span>
                                    <span className="font-semibold text-gray-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {a.sortedErrors.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Errors</h4>
                        <div className="space-y-1">
                            {a.sortedErrors.map(([error, count]) => (
                                <div key={error} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 truncate max-w-[70%]" title={error}>{error}</span>
                                    <span className="font-semibold text-red-600">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {a.firstSeen && (
                    <p className="text-xs text-gray-400 text-right">
                        Tracking since {new Date(a.firstSeen).toLocaleDateString()}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>

            {stats && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-black text-gray-900">{stats['total-tips'].value}</p>
                        <p className="text-sm text-gray-500 font-medium mt-1">Total Tips</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-black text-gray-900">{formatSTX(stats['total-volume'].value, 2)}</p>
                        <p className="text-sm text-gray-500 font-medium mt-1">Volume (STX)</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-3xl font-black text-gray-900">{formatSTX(stats['platform-fees'].value, 2)}</p>
                        <p className="text-sm text-gray-500 font-medium mt-1">Fees (STX)</p>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Contract State</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-700">Pause Contract</p>
                        <p className="text-sm text-gray-500">Disable all tipping when paused</p>
                    </div>
                    <button
                        onClick={handlePauseToggle}
                        disabled={actionLoading}
                        className={`px-6 py-2 font-bold rounded-xl transition-all disabled:opacity-50 ${isPaused
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Fee Configuration</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Current fee: {currentFee} basis points ({(parseInt(currentFee) / 100).toFixed(2)}%)
                </p>
                <div className="flex gap-3">
                    <input
                        type="number"
                        value={newFee}
                        onChange={(e) => setNewFee(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                        placeholder="New fee (0-1000 bps)"
                        min="0"
                        max="1000"
                    />
                    <button
                        onClick={handleFeeUpdate}
                        disabled={actionLoading || !newFee}
                        className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                        Update
                    </button>
                </div>
            </div>

            <AnalyticsPanel />
        </div>
    );
}
