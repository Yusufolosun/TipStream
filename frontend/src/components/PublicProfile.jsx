import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { buildPrincipalArg, CONTRACT_FUNCTIONS } from '../types/contracts';

import { network } from '../utils/stacks';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';
import { formatSTX } from '../lib/utils';
import SendTip from './SendTip';

export default function PublicProfile({ addToast }) {
    const { address } = useParams();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPublicData = useCallback(async () => {
        if (!address) return;
        setLoading(true);
        try {
            // Fetch Profile
            const profilePromise = fetchCallReadOnlyFunction({
                network,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: CONTRACT_FUNCTIONS.GET_PROFILE,
                functionArgs: buildPrincipalArg(address),
                senderAddress: address,
            });

            // Fetch Stats
            const statsPromise = fetchCallReadOnlyFunction({
                network,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: CONTRACT_FUNCTIONS.GET_USER_STATS,
                functionArgs: buildPrincipalArg(address),
                senderAddress: address,
            });

            const [profileResult, statsResult] = await Promise.all([profilePromise, statsPromise]);

            const profileJson = cvToJSON(profileResult);
            const statsJson = cvToJSON(statsResult);

            if (profileJson.value) {
                setProfile({
                    displayName: profileJson.value['display-name'].value,
                    bio: profileJson.value['bio'].value,
                    avatarUrl: profileJson.value['avatar-url'].value,
                });
            }

            setStats({
                tipsSent: statsJson.value['tips-sent'].value,
                tipsReceived: statsJson.value['tips-received'].value,
                totalSent: statsJson.value['total-sent'].value,
                totalReceived: statsJson.value['total-received'].value,
            });

        } catch (err) {
            console.error('Failed to fetch public profile:', err);
            setError('Failed to load profile details. Please check the address.');
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchPublicData();
    }, [fetchPublicData]);

    const copyShareLink = () => {
        navigator.clipboard.writeText(window.location.href);
        addToast('Profile link copied to clipboard!', 'success');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
                <p className="text-slate-500 font-medium animate-pulse">Loading destination...</p>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="max-w-md mx-auto p-12 bg-white rounded-[2.5rem] shadow-sm border border-red-100 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Profile Not Found</h3>
                <p className="text-slate-500 mb-8">{error || 'This address hasn\'t received any tips yet.'}</p>
                <a href="/send" className="inline-block px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all">
                    Go Back Home
                </a>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-slate-900 to-slate-400 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-white dark:border-gray-800 shadow-xl">
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-300">
                                    {address.slice(address.length - 2)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {profile?.displayName || 'Stacks Creator'}
                            </h1>
                            <p className="font-mono text-sm text-slate-400 break-all bg-slate-50 dark:bg-gray-800/50 px-3 py-1 rounded-full inline-block">
                                {address}
                            </p>
                        </div>

                        {profile?.bio && (
                            <p className="text-slate-600 dark:text-gray-400 text-lg leading-relaxed max-w-2xl">
                                {profile.bio}
                            </p>
                        )}

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                            <button
                                onClick={copyShareLink}
                                className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span>Share Profile</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Received</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.tipsReceived}</p>
                        <p className="text-[10px] text-slate-400">Total Tips</p>
                    </div>
                    <div className="space-y-1 border-l border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Volume</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{formatSTX(stats.totalReceived, 2)}</p>
                        <p className="text-[10px] text-slate-400">STX Tipped</p>
                    </div>
                    <div className="space-y-1 border-l border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Impact</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.tipsSent}</p>
                        <p className="text-[10px] text-slate-400">Tips Sent</p>
                    </div>
                    <div className="space-y-1 border-l border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Support</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{formatSTX(stats.totalSent, 1)}</p>
                        <p className="text-[10px] text-slate-400">STX Given</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Send Tip Section */}
                <div className="lg:col-span-12">
                    <SendTip
                        addToast={addToast}
                        defaultRecipient={address}
                    />
                </div>
            </div>
        </div>
    );
}
