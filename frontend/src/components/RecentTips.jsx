import { useEffect, useState, useCallback } from 'react';
import { openContractCall } from '@stacks/connect';
import { uintCV, stringUtf8CV, PostConditionMode, Pc } from '@stacks/transactions';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';
import { formatSTX, toMicroSTX } from '../lib/utils';
import { network, appDetails, userSession } from '../utils/stacks';
import { useTipContext } from '../context/TipContext';
import CopyButton from './ui/copy-button';

const API_BASE = 'https://api.hiro.so';

export default function RecentTips({ addToast }) {
    const { refreshCounter } = useTipContext();
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tipBackTarget, setTipBackTarget] = useState(null);
    const [tipBackAmount, setTipBackAmount] = useState('0.5');
    const [tipBackMessage, setTipBackMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);

    const fetchRecentTips = useCallback(async () => {
        try {
            setError(null);
            const contractId = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
            const response = await fetch(
                `${API_BASE}/extended/v1/contract/${contractId}/events?limit=10&offset=0`
            );

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            const tipEvents = data.results
                .filter(e => e.contract_log && e.contract_log.value && e.contract_log.value.repr)
                .map(e => {
                    const repr = e.contract_log.value.repr;
                    return parseTipEvent(repr);
                })
                .filter(t => t !== null && t.event === 'tip-sent');

            setTips(tipEvents);
            setLoading(false);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Failed to fetch recent tips:', err.message || err);
            setError(err.message || 'Failed to load tips');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecentTips();
    }, [fetchRecentTips, refreshCounter]);

    useEffect(() => {
        const interval = setInterval(fetchRecentTips, 60000);
        return () => clearInterval(interval);
    }, [fetchRecentTips]);

    const parseTipEvent = (repr) => {
        try {
            const eventMatch = repr.match(/event\s+u?"([^"]+)"/);
            if (!eventMatch) return null;

            const senderMatch = repr.match(/sender\s+'([A-Z0-9]+)/);
            const recipientMatch = repr.match(/recipient\s+'([A-Z0-9]+)/);
            const amountMatch = repr.match(/amount\s+u(\d+)/);
            const feeMatch = repr.match(/fee\s+u(\d+)/);
            const messageMatch = repr.match(/message\s+u"([^"]*)"/);
            const tipIdMatch = repr.match(/tip-id\s+u(\d+)/);

            return {
                event: eventMatch[1],
                sender: senderMatch ? senderMatch[1] : '',
                recipient: recipientMatch ? recipientMatch[1] : '',
                amount: amountMatch ? amountMatch[1] : '0',
                fee: feeMatch ? feeMatch[1] : '0',
                message: messageMatch ? messageMatch[1] : '',
                tipId: tipIdMatch ? tipIdMatch[1] : '0',
            };
        } catch {
            return null;
        }
    };

    const truncateAddress = (address) => {
        const addrStr = typeof address === 'string' ? address : (address.value || '');
        return `${addrStr.slice(0, 8)}...${addrStr.slice(-6)}`;
    };

    const fullAddress = (address) => {
        return typeof address === 'string' ? address : (address.value || '');
    };

    const handleTipBack = async (tip) => {
        if (!userSession.isUserSignedIn()) return;
        const microSTX = toMicroSTX(tipBackAmount);
        const senderAddress = userSession.loadUserData().profile.stxAddress.mainnet;

        setSending(true);
        try {
            await openContractCall({
                network,
                appDetails,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'tip-a-tip',
                functionArgs: [
                    uintCV(parseInt(tip.tipId)),
                    uintCV(microSTX),
                    stringUtf8CV(tipBackMessage || 'Tipping back!'),
                ],
                postConditions: [Pc.principal(senderAddress).willSendLte(microSTX).ustx()],
                postConditionMode: PostConditionMode.Deny,
                onFinish: (data) => {
                    setSending(false);
                    setTipBackTarget(null);
                    setTipBackMessage('');
                    if (addToast) addToast('Tip-a-tip sent! Tx: ' + data.txId, 'success');
                },
                onCancel: () => {
                    setSending(false);
                    if (addToast) addToast('Tip-a-tip cancelled', 'info');
                },
            });
        } catch (err) {
            console.error('Tip-a-tip failed:', err.message || err);
            if (addToast) addToast('Failed to send tip-a-tip', 'error');
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Live Feed</h2>
                <div className="text-center py-20 bg-red-50 rounded-3xl border-2 border-dashed border-red-200">
                    <p className="text-red-500 font-medium mb-4">{error}</p>
                    <button
                        onClick={fetchRecentTips}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Live Feed</h2>
                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <span className="text-xs text-gray-400">
                            Updated {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={fetchRecentTips}
                        className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {tips.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No tips in the stream yet. Be the first!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {tips.map((tip, index) => (
                        <div key={tip.tipId || index} className="group p-6 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-gray-500/5 rounded-3xl border border-transparent hover:border-gray-100 transition-all duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-white shadow-lg shadow-gray-500/20">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2 text-sm text-slate-400 font-bold uppercase tracking-tighter">
                                            <span>{truncateAddress(tip.sender)}</span>
                                            <CopyButton text={fullAddress(tip.sender)} className="text-slate-400 hover:text-slate-600" />
                                            <svg className="h-3 w-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                            <span>{truncateAddress(tip.recipient)}</span>
                                            <CopyButton text={fullAddress(tip.recipient)} className="text-slate-400 hover:text-slate-600" />
                                        </div>
                                        <p className="text-2xl font-black text-slate-900 mt-1">
                                            {formatSTX(tip.amount, 4)} <span className="text-gray-900 text-lg">STX</span>
                                        </p>
                                    </div>
                                </div>
                                {tip.message && (
                                    <div className="flex-1 md:max-w-md bg-white p-4 rounded-2xl border border-slate-100 shadow-inner">
                                        <p className="text-slate-600 italic text-sm leading-relaxed">
                                            "{tip.message}"
                                        </p>
                                    </div>
                                )}
                                {userSession.isUserSignedIn() && (
                                    <button
                                        onClick={() => setTipBackTarget(tip)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        Tip Back
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tipBackTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Tip Back</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Send a tip to the original sender of tip #{tipBackTarget.tipId}
                        </p>
                        <div className="space-y-3 mb-4">
                            <input
                                type="number"
                                value={tipBackAmount}
                                onChange={(e) => setTipBackAmount(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                placeholder="Amount (STX)"
                                step="0.001"
                                min="0.001"
                            />
                            <input
                                type="text"
                                value={tipBackMessage}
                                onChange={(e) => setTipBackMessage(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                placeholder="Message (optional)"
                                maxLength={280}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setTipBackTarget(null)}
                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleTipBack(tipBackTarget)}
                                disabled={sending}
                                className="flex-1 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {sending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
