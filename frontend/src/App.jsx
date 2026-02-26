import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { userSession, authenticate, disconnect } from './utils/stacks';
import Header from './components/Header';
import SendTip from './components/SendTip';
import OfflineBanner from './components/OfflineBanner';
import Onboarding from './components/Onboarding';
import { AnimatedHero } from './components/ui/animated-hero';
import { ToastContainer, useToast } from './components/ui/toast';
import { analytics } from './lib/analytics';

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
  const [authLoading, setAuthLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const location = useLocation();

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
    analytics.trackSession();
  }, []);

  useEffect(() => {
    analytics.trackPageView(location.pathname);
    analytics.trackTabNavigation(location.pathname);
  }, [location.pathname]);

  const handleAuth = async () => {
    if (userData) {
      disconnect();
      setUserData(null);
      analytics.trackWalletDisconnect();
      return;
    }

    setAuthLoading(true);
    try {
      await authenticate();
      analytics.trackWalletConnect();
    } catch (error) {
      console.error('Authentication failed:', error.message || error);
      addToast(error.message || 'Failed to connect wallet. Please try again.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const navItems = [
    { path: '/send', label: 'Send Tip', icon: '⚡' },
    { path: '/activity', label: 'My Activity', icon: '👤' },
    { path: '/feed', label: 'Recent Tips', icon: '📡' },
    { path: '/stats', label: 'Platform Stats', icon: '📊' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/batch', label: 'Batch Tip', icon: '📦' },
    { path: '/profile', label: 'Profile', icon: '⚙️' },
    { path: '/privacy', label: 'Privacy', icon: '🔒' },
    { path: '/admin', label: 'Admin', icon: '🛠️' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 transition-colors">
      <OfflineBanner />
      <Header userData={userData} onAuth={handleAuth} authLoading={authLoading} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {userData ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Onboarding />
            <nav className="mb-16 -mx-4 sm:mx-0">
              <div className="overflow-x-auto scrollbar-hide px-4 sm:px-0">
                <div className="flex justify-start sm:justify-center min-w-max sm:min-w-0">
                  <div
                    className="inline-flex p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-[2rem] shadow-xl shadow-gray-500/5 border border-gray-100 dark:border-gray-700"
                    role="navigation"
                    aria-label="Main navigation"
                  >
                    {navItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-300 min-h-[44px] ${
                            isActive
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-gray-900 shadow-lg shadow-slate-200 dark:shadow-none'
                              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-700'
                          }`
                        }
                      >
                        <span>{item.icon}</span>
                        <span className={location.pathname === item.path ? 'block' : 'hidden sm:block'}>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            </nav>

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
              <Routes>
                <Route path="/send" element={<SendTip addToast={addToast} />} />
                <Route path="/activity" element={<TipHistory userAddress={userData.profile.stxAddress.mainnet} />} />
                <Route path="/feed" element={<RecentTips addToast={addToast} />} />
                <Route path="/stats" element={<PlatformStats />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/batch" element={<BatchTip addToast={addToast} />} />
                <Route path="/profile" element={<ProfileManager addToast={addToast} />} />
                <Route path="/privacy" element={<BlockManager addToast={addToast} />} />
                <Route path="/admin" element={<AdminDashboard addToast={addToast} />} />
                <Route path="*" element={<Navigate to="/send" replace />} />
              </Routes>
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
