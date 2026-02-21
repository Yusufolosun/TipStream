import { useState, useEffect, useRef, useCallback } from 'react';
import { userSession, authenticate, disconnect } from './utils/stacks';
import Header from './components/Header';
import SendTip from './components/SendTip';
import TipHistory from './components/TipHistory';
import PlatformStats from './components/PlatformStats';
import RecentTips from './components/RecentTips';
import Leaderboard from './components/Leaderboard';
import { AnimatedHero } from './components/ui/animated-hero';
import { ToastContainer, useToast } from './components/ui/toast';

function App() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('send');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  const handleAuth = () => {
    if (userData) {
      disconnect();
      setUserData(null);
    } else {
      authenticate();
    }
  };

  const tabs = [
    { id: 'send', label: 'Send Tip', icon: '⚡' },
    { id: 'history', label: 'My Activity', icon: '👤' },
    { id: 'recent', label: 'Recent Tips', icon: '📡' },
    { id: 'stats', label: 'Platform Stats', icon: '📊' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header userData={userData} onAuth={handleAuth} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {userData ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              <div
                role="tablist"
                aria-label="Main navigation"
                className="inline-flex p-1.5 bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl shadow-gray-500/5 border border-gray-100"
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
                    className={`flex items-center space-x-2 px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-300 ${activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                  >
                    <span>{tab.icon}</span>
                    <span className={activeTab === tab.id ? 'block' : 'hidden sm:block'}>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

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
              {activeTab === 'recent' && <RecentTips />}
              {activeTab === 'leaderboard' && <Leaderboard />}
            </div>
          </div>
        ) : (
          <AnimatedHero onGetStarted={handleAuth} />
        )}
      </main>

      <footer className="border-t border-gray-100 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm font-medium">
          <p>© 2025 TipStream - Built with Transparency</p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">Twitter</a>
            <a href="https://github.com/Mosas2000/TipStream" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">GitHub</a>
            <a href="https://explorer.hiro.so/txid/SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T.tipstream?chain=mainnet" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">Contract</a>
            <a href="https://docs.stacks.co" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
