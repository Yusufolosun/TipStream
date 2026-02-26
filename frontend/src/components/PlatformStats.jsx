import { useEffect, useState, useCallback } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { network } from '../utils/stacks';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';
import { formatSTX } from '../lib/utils';
import { useTipContext } from '../context/TipContext';

export default function PlatformStats() {
    const { refreshCounter } = useTipContext();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

    const fetchPlatformStats = useCallback(async () => {
        try {
            const result = await fetchCallReadOnlyFunction({
                network,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'get-platform-stats',
                functionArgs: [],
                senderAddress: CONTRACT_ADDRESS,
            });

            const jsonResult = cvToJSON(result);
            setStats(jsonResult.value);
            setLoading(false);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Failed to fetch platform stats:', error.message || error);
            const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network') || error.name === 'TypeError';
            setError(
                isNetworkError
                    ? 'Unable to reach the Stacks API. Check your connection and try again.'
                    : `Failed to load platform statistics: ${error.message || 'Unknown error'}`
            );
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlatformStats();
    }, [fetchPlatformStats, refreshCounter]);

    useEffect(() => {
        const interval = setInterval(fetchPlatformStats, 60000);
        return () => clearInterval(interval);
    }, [fetchPlatformStats]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-100 h-32 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-red-100 text-center">
                <p className="text-red-600 font-medium mb-4">{error}</p>
                <button
                    onClick={() => { setError(null); setLoading(true); fetchPlatformStats(); }}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Global Impact</h2>
                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <span className="text-xs text-gray-400">
                            Updated {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={fetchPlatformStats}
                        className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                    >
                        Refresh
                    </button>
                    <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center">
                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        Live
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100/50 group hover:scale-[1.02] transition-all">
                    <p className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-tighter">Total Tips</p>
                    <p className="text-5xl font-black text-black">
                        {stats['total-tips'].value.toLocaleString()}
                    </p>
                </div>

                <div className="bg-gray-100/50 p-8 rounded-3xl border border-gray-200/50 group hover:scale-[1.02] transition-all">
                    <p className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-tighter">Total Volume</p>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-5xl font-black text-black">
                            {formatSTX(stats['total-volume'].value, 2)}
                        </p>
                        <span className="text-xl font-bold text-gray-600">STX</span>
                    </div>
                </div>

                <div className="bg-purple-50/50 p-8 rounded-3xl border border-purple-100/50 group hover:scale-[1.02] transition-all">
                    <p className="text-sm font-bold text-purple-600 mb-2 uppercase tracking-tighter">Platform Fees</p>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-5xl font-black text-purple-900">
                            {formatSTX(stats['platform-fees'].value, 4)}
                        </p>
                        <span className="text-xl font-bold text-purple-400">STX</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
