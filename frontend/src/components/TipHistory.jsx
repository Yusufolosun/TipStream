import { useEffect, useState } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, principalCV } from '@stacks/transactions';
import { network } from '../utils/stacks';

const CONTRACT_ADDRESS = 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T';
const CONTRACT_NAME = 'tipstream';

export default function TipHistory({ userAddress }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userAddress) {
            fetchUserStats();
        }
    }, [userAddress]);

    const fetchUserStats = async () => {
        try {
            const result = await fetchCallReadOnlyFunction({
                network,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'get-user-stats',
                functionArgs: [principalCV(userAddress)],
                senderAddress: userAddress,
            });

            const jsonResult = cvToJSON(result);
            setStats(jsonResult.value);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-500 font-medium">Loading activity...</p>
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
            <h2 className="text-2xl font-bold mb-8 text-gray-800">Your Activity</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        </div>
    );
}
