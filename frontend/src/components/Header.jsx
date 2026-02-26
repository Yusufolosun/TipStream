import CopyButton from './ui/copy-button';
import { useTheme } from '../context/ThemeContext';

export default function Header({ userData, onAuth, authLoading }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="bg-gradient-to-r from-gray-900 to-black shadow-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center space-x-3">
                        <img
                            src="/logo.png"
                            alt="TipStream"
                            width={48}
                            height={48}
                            className="h-12 w-12 object-contain"
                        />
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">TipStream</h1>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 bg-gray-800/50 px-2 py-0.5 rounded-full">v1.0.0</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:space-x-6">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {userData && (
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Connected Wallet</span>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs sm:text-sm font-mono text-white/90 bg-white/10 px-2 sm:px-3 py-1 rounded-lg border border-white/5 truncate max-w-[140px] sm:max-w-none">
                                        {userData.profile.stxAddress.mainnet.slice(0, 6)}...
                                        {userData.profile.stxAddress.mainnet.slice(-4)}
                                    </p>
                                    <CopyButton text={userData.profile.stxAddress.mainnet} className="text-white/70 hover:text-white" />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={onAuth}
                            disabled={authLoading}
                            className={`px-4 sm:px-8 py-2.5 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base ${userData
                                ? 'bg-red-500/10 text-red-100 border border-red-500/50 hover:bg-red-500 hover:text-white'
                                : 'bg-white text-gray-900 hover:bg-gray-50 hover:shadow-white/10'
                                }`}
                        >
                            {authLoading ? 'Connecting...' : userData ? 'Disconnect' : 'Connect Wallet'}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
