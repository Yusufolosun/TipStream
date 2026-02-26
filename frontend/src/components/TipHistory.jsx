import { useEffect, useState, useCallback } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, principalCV } from '@stacks/transactions';
import { network } from '../utils/stacks';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';
import { formatSTX } from '../lib/utils';
import { useTipContext } from '../context/TipContext';
import CopyButton from './ui/copy-button';
import ShareTip from './ShareTip';

const API_BASE = 'https://api.hiro.so';

const CATEGORY_LABELS = {
    0: 'General',
    1: 'Content Creation',
    2: 'Open Source',
    3: 'Community Help',
    4: 'Appreciation',
    5: 'Education',
    6: 'Bug Bounty',
};

export default function TipHistory({ userAddress }) {
    const { refreshCounter } = useTipContext();
    const [stats, setStats] = useState(null);
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [lastRefresh, setLastRefresh] = useState(null);

    const fetchData = useCallback(async () => {
        if (!userAddress) return;
        try {
            setError(null);
            const [statsResult, tipsResult] = await Promise.all([
                fetchCallReadOnlyFunction({
                    network,
                    contractAddress: CONTRACT_ADDRESS,
                    contractName: CONTRACT_NAME,
                    functionName: 'get-user-stats',
                    functionArgs: [principalCV(userAddress)],
                    senderAddress: userAddress,
                }),
                fetch(
                    `${API_BASE}/extended/v1/contract/${CONTRACT_ADDRESS}.${CONTRACT_NAME}/events?limit=50&offset=0`
                ).then(r => {
                    if (!r.ok) throw new Error(`API returned ${r.status}`);
                    return r.json();
                })
            ]);

            const jsonResult = cvToJSON(statsResult);
            setStats(jsonResult.value);

            const allEvents = tipsResult.results
                .filter(e => e.contract_log?.value?.repr)
                .map(e => parseTipEvent(e.contract_log.value.repr))
                .filter(Boolean);

            // Build a map of tip-id → category from tip-categorized events
            const categoryMap = {};
            allEvents
                .filter(e => e.event === 'tip-categorized')
                .forEach(e => { categoryMap[e.tipId] = Number(e.category || 0); });

            const userTips = allEvents
                .filter(t => t.event === 'tip-sent')
                .filter(t => t.sender === userAddress || t.recipient === userAddress)
                .map(t => ({
                    ...t,
                    direction: t.sender === userAddress ? 'sent' : 'received',
                    category: categoryMap[t.tipId] ?? null,
                }));

            setTips(userTips);
            setLoading(false);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Failed to fetch tip history:', err.message || err);
            const isNetworkError = err.message?.includes('fetch') || err.message?.includes('network') || err.name === 'TypeError';
            setError(
                isNetworkError
                    ? 'Unable to reach the Stacks API. Check your connection and try again.'
                    : `Failed to load activity: ${err.message || 'Unknown error'}`
            );
            setLoading(false);
        }
    }, [userAddress]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshCounter]);

    useEffect(() => {
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const parseTipEvent = (repr) => {
        try {
            const eventMatch = repr.match(/event\s+u?"([^"]+)"/);
            if (!eventMatch) return null;
            const senderMatch = repr.match(/sender\s+'([A-Z0-9]+)/i);
            const recipientMatch = repr.match(/recipient\s+'([A-Z0-9]+)/i);
            const amountMatch = repr.match(/amount\s+u(\d+)/);
            const feeMatch = repr.match(/fee\s+u(\d+)/);
            const messageMatch = repr.match(/message\s+u"([^"]*)"/);
            const tipIdMatch = repr.match(/tip-id\s+u(\d+)/);
            const categoryMatch = repr.match(/category\s+u(\d+)/);
            return {
                event: eventMatch[1],
                sender: senderMatch ? senderMatch[1] : '',
                recipient: recipientMatch ? recipientMatch[1] : '',
                amount: amountMatch ? amountMatch[1] : '0',
                fee: feeMatch ? feeMatch[1] : '0',
                message: messageMatch ? messageMatch[1] : '',
                tipId: tipIdMatch ? tipIdMatch[1] : '0',
                category: categoryMatch ? categoryMatch[1] : null,
            };
        } catch {
            return null;
        }
    };

    const truncateAddr = (addr) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

    const filteredTips = tips.filter(t => {
        if (tab === 'sent' && t.direction !== 'sent') return false;
        if (tab === 'received' && t.direction !== 'received') return false;
        if (categoryFilter !== 'all' && t.category !== Number(categoryFilter)) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-500 font-medium">Loading activity...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900/30 p-8">
                <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>
                <button
                    onClick={() => { setError(null); setLoading(true); fetchData(); }}
                    className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold hover:bg-black dark:hover:bg-gray-100 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500">No activity data available</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Your Activity</h2>
                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <span className="text-xs text-gray-400">
                            Updated {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                            <svg className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">Tips Sent</h3>
                    </div>
                    <p className="text-4xl font-black text-gray-900 leading-none mb-3">
                        {stats['tips-sent'].value}
                    </p>
                    <p className="text-sm font-medium text-gray-500">
                        Total Volume: <span className="text-gray-700 font-bold">{(stats['total-sent'].value / 1000000).toFixed(2)} STX</span>
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 17l-4 4m0 0l-4-4m4 4V3" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">Tips Received</h3>
                    </div>
                    <p className="text-4xl font-black text-green-600 leading-none mb-3">
                        {stats['tips-received'].value}
                    </p>
                    <p className="text-sm font-medium text-gray-500">
                        Total Earned: <span className="text-gray-700 font-bold">{(stats['total-received'].value / 1000000).toFixed(2)} STX</span>
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Tip History</h3>
                    <div className="flex flex-wrap items-center gap-2">
                        {['all', 'sent', 'received'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {t}
                            </button>
                        ))}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border-none outline-none hover:bg-slate-200 transition-all dark:bg-gray-800 dark:text-gray-300"
                        >
                            <option value="all">All Categories</option>
                            {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                                <option key={id} value={id}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {filteredTips.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-medium">No tips found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredTips.map((tip, i) => (
                            <div key={tip.tipId || i} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white hover:shadow-sm rounded-xl border border-transparent hover:border-gray-100 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${tip.direction === 'sent' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {tip.direction === 'sent' ? '-' : '+'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 text-sm">
                                            <span className="text-slate-500 font-medium">
                                                {tip.direction === 'sent' ? 'To' : 'From'}
                                            </span>
                                            <span className="font-bold text-slate-700">
                                                {truncateAddr(tip.direction === 'sent' ? tip.recipient : tip.sender)}
                                            </span>
                                            <CopyButton
                                                text={tip.direction === 'sent' ? tip.recipient : tip.sender}
                                                className="text-slate-400 hover:text-slate-600"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {tip.category != null && CATEGORY_LABELS[tip.category] && (
                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {CATEGORY_LABELS[tip.category]}
                                                </span>
                                            )}
                                            {tip.message && (
                                                <span className="text-xs text-slate-400 italic">"{tip.message}"</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className={`font-black ${tip.direction === 'sent' ? 'text-red-600' : 'text-green-600'}`}>
                                    {tip.direction === 'sent' ? '-' : '+'}{formatSTX(tip.amount, 2)} STX
                                </p>
                                <ShareTip tip={{ type: tip.direction, amount: formatSTX(tip.amount, 6) }} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
