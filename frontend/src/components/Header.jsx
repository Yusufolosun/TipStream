export default function Header({ userData, onAuth }) {
    return (
        <nav className="bg-gradient-to-r from-blue-700 to-indigo-800 shadow-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white p-2 rounded-xl shadow-inner">
                            <svg className="h-8 w-8 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">TipStream</h1>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200 bg-blue-900/50 px-2 py-0.5 rounded-full">v1.0.0</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        {userData && (
                            <div className="hidden lg:flex flex-col items-end">
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-tighter">Connected Wallet</span>
                                <p className="text-sm font-mono text-white/90 bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                                    {userData.profile.stxAddress.mainnet.slice(0, 6)}...
                                    {userData.profile.stxAddress.mainnet.slice(-4)}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={onAuth}
                            className={`px-8 py-2.5 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg ${userData
                                    ? 'bg-red-500/10 text-red-100 border border-red-500/50 hover:bg-red-500 hover:text-white'
                                    : 'bg-white text-blue-800 hover:bg-blue-50 hover:shadow-white/10'
                                }`}
                        >
                            {userData ? 'Disconnect' : 'Connect Wallet'}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
