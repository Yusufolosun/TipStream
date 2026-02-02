import { useState, useEffect } from 'react';
import { userSession, authenticate, disconnect } from './utils/stacks';
import Header from './components/Header';
import SendTip from './components/SendTip';
import TipHistory from './components/TipHistory';
import PlatformStats from './components/PlatformStats';
import RecentTips from './components/RecentTips';
import Leaderboard from './components/Leaderboard';
import { AnimatedHero } from './components/ui/animated-hero';

function App() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('send');

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

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header userData={userData} onAuth={handleAuth} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {userData ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              <div className="inline-flex p-1.5 bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl shadow-blue-500/5 border border-gray-100">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
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

            <div className="transition-all duration-500 transform">
              {activeTab === 'send' && <SendTip />}
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
          <p>© 2026 TipStream - Built with Transparency</p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-blue-600 transition-colors">Twitter</a>
            <a href="#" className="hover:text-blue-600 transition-colors">GitHub</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
