import { useEffect, useState, useCallback } from 'react';
import { openContractCall } from '@stacks/connect';
import {
    fetchCallReadOnlyFunction,
    cvToJSON,
    principalCV,
    stringUtf8CV,
    PostConditionMode
} from '@stacks/transactions';
import { network, appDetails, userSession } from '../utils/stacks';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';

export default function ProfileManager({ addToast }) {
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [hasProfile, setHasProfile] = useState(false);

    const userAddress = userSession.isUserSignedIn()
        ? userSession.loadUserData().profile.stxAddress.mainnet
        : null;

    const fetchProfile = useCallback(async () => {
        if (!userAddress) {
            setFetching(false);
            return;
        }
        try {
            const result = await fetchCallReadOnlyFunction({
                network,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'get-profile',
                functionArgs: [principalCV(userAddress)],
                senderAddress: userAddress,
            });

            const json = cvToJSON(result);
            if (json.value) {
                setDisplayName(json.value['display-name'].value || '');
                setBio(json.value['bio'].value || '');
                setAvatarUrl(json.value['avatar-url'].value || '');
                setHasProfile(true);
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err.message || err);
        }
        setFetching(false);
    }, [userAddress]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!displayName.trim()) {
            addToast('Display name is required', 'warning');
            return;
        }

        setLoading(true);

        try {
            const options = {
                network,
                appDetails,
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'update-profile',
                functionArgs: [
                    stringUtf8CV(displayName.trim()),
                    stringUtf8CV(bio.trim()),
                    stringUtf8CV(avatarUrl.trim()),
                ],
                postConditionMode: PostConditionMode.Deny,
                postConditions: [],
                onFinish: (data) => {
                    setLoading(false);
                    setHasProfile(true);
                    addToast('Profile updated. Transaction: ' + data.txId, 'success');
                },
                onCancel: () => {
                    setLoading(false);
                    addToast('Profile update cancelled', 'info');
                },
            };

            await openContractCall(options);
        } catch (err) {
            console.error('Failed to update profile:', err.message || err);
            addToast('Failed to update profile', 'error');
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-500 font-medium">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {hasProfile ? 'Edit Profile' : 'Create Profile'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
                        placeholder="Your display name"
                        maxLength={50}
                    />
                    <p className="text-xs text-gray-400 mt-1">{displayName.length}/50</p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Bio
                    </label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none resize-none"
                        placeholder="Tell others about yourself"
                        maxLength={280}
                        rows={3}
                    />
                    <p className="text-xs text-gray-400 mt-1">{bio.length}/280</p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Avatar URL
                    </label>
                    <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
                        placeholder="https://example.com/avatar.png"
                        maxLength={256}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !displayName.trim()}
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform active:scale-95 transition-all disabled:bg-gray-400 disabled:shadow-none"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </span>
                    ) : hasProfile ? 'Update Profile' : 'Create Profile'}
                </button>
            </form>
        </div>
    );
}
