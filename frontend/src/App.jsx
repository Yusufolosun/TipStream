import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { userSession, authenticate, disconnect } from './utils/stacks';
import Header from './components/Header';
import SendTip from './components/SendTip';
import { AnimatedHero } from './components/ui/animated-hero';
import { ToastContainer, useToast } from './components/ui/toast';

const TipHistory = lazy(() => import('./components/TipHistory'));
const PlatformStats = lazy(() => import('./components/PlatformStats'));
const RecentTips = lazy(() => import('./components/RecentTips'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const ProfileManager = lazy(() => import('./components/ProfileManager'));
const BlockManager = lazy(() => import('./components/BlockManager'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const BatchTip = lazy(() => import('./components/BatchTip'));

function App() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('send');
  const [authLoading, setAuthLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  const handleAuth = async () => {
    if (userData) {
      disconnect();
      setUserData(null);
      return;
    }

    setAuthLoading(true);
    try {
      await authenticate();
    } catch (error) {
      console.error('Authentication failed:', error.message || error);
      addToast(error.message || 'Failed to connect wallet. Please try again.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const tabs = [
    { id: 'send', label: 'Send Tip', icon: '⚡' },
    { id: 'history', label: 'My Activity', icon: '👤' },
    { id: 'recent', label: 'Recent Tips', icon: '📡' },
    { id: 'stats', label: 'Platform Stats', icon: '📊' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'batch', label: 'Batch Tip', icon: '📦' },
    { id: 'profile', label: 'Profile', icon: '⚙️' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'admin', label: 'Admin', icon: '🛠️' },
  ];

  const tabRefs = useRef([]);

  const handleTabKeyDown = useCallback((e) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    setActiveTab(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 transition-colors">
      <Header userData={userData} onAuth={handleAuth} authLoading={authLoading} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {userData ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-16 -mx-4 sm:mx-0">
              <div className="overflow-x-auto scrollbar-hide px-4 sm:px-0">
                <div className="flex justify-start sm:justify-center min-w-max sm:min-w-0">
                  <div
                    role="tablist"
                    aria-label="Main navigation"
                    className="inline-flex p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-[2rem] shadow-xl shadow-gray-500/5 border border-gray-100 dark:border-gray-700"
                    onKeyDown={handleTabKeyDown}
                  >
                    {tabs.map((tab, index) => (
                      <button
                        key={tab.id}
                        ref={(el) => { tabRefs.current[index] = el; }}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`tabpanel-${tab.id}`}
                        id={`tab-${tab.id}`}
                        tabIndex={activeTab === tab.id ? 0 : -1}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-300 min-h-[44px] ${activeTab === tab.id
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-gray-900 shadow-lg shadow-slate-200 dark:shadow-none'
                          : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-700'
                          }`}
                      >
                        <span>{tab.icon}</span>
                        <span className={activeTab === tab.id ? 'block' : 'hidden sm:block'}>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Suspense
              fallback={
                <div className="flex justify-center items-center py-20">
                  <div className="animate-pulse space-y-4 w-full max-w-md">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
                  </div>
                </div>
              }
            >
              <div
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                className="transition-all duration-500 transform"
              >
                {activeTab === 'send' && <SendTip addToast={addToast} />}
                {activeTab === 'history' && (
                  <TipHistory userAddress={userData.profile.stxAddress.mainnet} />
                )}
                {activeTab === 'stats' && <PlatformStats />}
                {activeTab === 'recent' && <RecentTips addToast={addToast} />}
                {activeTab === 'leaderboard' && <Leaderboard />}
                {activeTab === 'batch' && <BatchTip addToast={addToast} />}
                {activeTab === 'profile' && <ProfileManager addToast={addToast} />}
                {activeTab === 'privacy' && <BlockManager addToast={addToast} />}
                {activeTab === 'admin' && <AdminDashboard addToast={addToast} />}
              </div>
            </Suspense>
          </div>
        ) : (
          <AnimatedHero onGetStarted={handleAuth} loading={authLoading} />
        )}
      </main>

      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center text-gray-500 dark:text-gray-400 text-sm font-medium gap-4">
          <p className="text-center md:text-left">© 2025 TipStream - Built with Transparency</p>
          <nav aria-label="Footer links" className="flex flex-wrap justify-center gap-4 sm:gap-8">
            <a href="https://x.com/search?q=%23TipStream" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">Twitter</a>
            <a href="https://github.com/Mosas2000/TipStream" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">GitHub</a>
            <a href="https://explorer.hiro.so/txid/SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T.tipstream?chain=mainnet" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contract</a>
            <a href="https://github.com/Mosas2000/TipStream#readme" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">Documentation</a>
          </nav>
        </div>
      </footer>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
