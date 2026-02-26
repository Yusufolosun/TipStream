import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function OfflineBanner() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-center py-2 px-4 text-sm font-medium shadow-lg" role="alert">
            <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 9v4m0 4h.01" />
                </svg>
                <span>You are offline. Some features may not work until your connection is restored.</span>
            </div>
        </div>
    );
}
