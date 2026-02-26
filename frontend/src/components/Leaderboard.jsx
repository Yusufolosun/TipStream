import { useEffect, useState, useCallback } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';
import { formatSTX, formatAddress } from '../lib/utils';
import CopyButton from './ui/copy-button';

const API_BASE = 'https://api.hiro.so';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState('sent');

    const fetchLeaderboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const contractId = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
            const response = await fetch(
                `${API_BASE}/extended/v1/contract/${contractId}/events?limit=50&offset=0`
            );

            if (!response.ok) throw new Error(`API returned ${response.status}`);

            const data = await response.json();
            const userStats = {};

            data.results.forEach(event => {
                if (!event.contract_log?.value?.repr) return;
                const repr = event.contract_log.value.repr;
                if (!repr.includes('tip-sent')) return;

                const senderMatch = repr.match(/sender\s+'([A-Z0-9]+)/i);
                const recipientMatch = repr.match(/recipient\s+'([A-Z0-9]+)/i);
                const amountMatch = repr.match(/amount\s+u(\d+)/);

                if (!senderMatch || !recipientMatch || !amountMatch) return;

                const sender = senderMatch[1];
                const recipient = recipientMatch[1];
                const amount = parseInt(amountMatch[1], 10);

                if (!userStats[sender]) {
                    userStats[sender] = { address: sender, totalSent: 0, tipsSent: 0, totalReceived: 0, tipsReceived: 0 };
                }
                userStats[sender].totalSent += amount;
                userStats[sender].tipsSent += 1;

                if (!userStats[recipient]) {
                    userStats[recipient] = { address: recipient, totalSent: 0, tipsSent: 0, totalReceived: 0, tipsReceived: 0 };
                }
                userStats[recipient].totalReceived += amount;
                userStats[recipient].tipsReceived += 1;
            });

            const usersArray = Object.values(userStats);
            setLeaders(usersArray);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err.message || err);
            setError(err.message || 'Failed to load leaderboard');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const sorted = [...leaders].sort((a, b) => {
        if (tab === 'sent') return b.totalSent - a.totalSent;
        return b.totalReceived - a.totalReceived;
    }).slice(0, 20);

    const truncateAddress = (addr) => formatAddress(addr, 8, 6);

    if (loading) {
        return (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
                <p className="text-red-500 font-medium mb-4">{error}</p>
                <button
                    onClick={fetchLeaderboard}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">Leaderboard</h2>

            <div className="flex gap-2 mb-8">
                <button
                    onClick={() => setTab('sent')}
                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'sent' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Top Senders
                </button>
                <button
                    onClick={() => setTab('received')}
                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'received' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Top Receivers
                </button>
            </div>

            {sorted.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No activity yet. Be the first to tip!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sorted.map((user, index) => (
                        <div key={user.address} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white hover:shadow-md rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-slate-700 text-sm">{truncateAddress(user.address)}</span>
                                        <CopyButton text={user.address} className="text-slate-400 hover:text-slate-600" />
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {tab === 'sent' ? `${user.tipsSent} tips sent` : `${user.tipsReceived} tips received`}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-900">
                                    {formatSTX(tab === 'sent' ? user.totalSent : user.totalReceived, 2)} STX
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
