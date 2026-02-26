import { useEffect, useState, useCallback } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';
import { formatSTX } from '../lib/utils';
import CopyButton from './ui/copy-button';

const API_BASE = 'https://api.hiro.so';

export default function RecentTips() {
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        } catch (err) {
            console.error('Failed to fetch recent tips:', err.message || err);
            setError(err.message || 'Failed to load tips');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecentTips();
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Live Feed</h2>

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
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
