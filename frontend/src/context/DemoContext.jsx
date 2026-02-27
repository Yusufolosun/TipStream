import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const DemoContext = createContext(null);

// Realistic mock addresses
const DEMO_ADDRESSES = [
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
  'SP000000000000000000002Q6VF78',
  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
  'SPNWZ5V2TPWGQGVDR6T7B6RQ4XMGZ4PXTEE0VQ0S',
  'SP2C2YFP12AJZB1MATRSD34F5Z6KNPZMC2P3RCXGE',
];

const DEMO_USER_ADDRESS = 'SP1DEMO000000000000000000000SANDBOX';

const DEMO_CATEGORIES = ['General', 'Content Creation', 'Open Source', 'Community Help', 'Appreciation', 'Education', 'Bug Bounty'];

function generateDemoTips(count = 15) {
  const messages = [
    'Great article on Stacks development!',
    'Thanks for the open source contribution!',
    'Loved your tutorial on Clarity',
    'Awesome community support',
    'Keep up the great work!',
    'Your documentation was super helpful',
    'Bug fix saved my project!',
    'Really enjoyed the livestream',
    'Best explanation of post-conditions ever',
    'Incredible smart contract work',
    'Your NFT marketplace tutorial was perfect',
    'Thanks for answering my question',
    'Great podcast episode!',
    'Your code review was thorough',
    'Amazing contribution to the ecosystem',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    sender: DEMO_ADDRESSES[i % DEMO_ADDRESSES.length],
    recipient: DEMO_ADDRESSES[(i + 1) % DEMO_ADDRESSES.length],
    amount: Math.floor(Math.random() * 50_000_000) + 100_000, // 0.1 - 50 STX in microSTX
    message: messages[i % messages.length],
    category: i % DEMO_CATEGORIES.length,
    categoryLabel: DEMO_CATEGORIES[i % DEMO_CATEGORIES.length],
    blockHeight: 180000 - i * 12,
    timestamp: Date.now() - i * 3600_000, // 1 hour apart
  }));
}

const DEMO_PLATFORM_STATS = {
  'total-tips': { value: '1247' },
  'total-volume': { value: '8439000000' }, // 8,439 STX
  'platform-fees': { value: '42195000' },  // ~42 STX
  'unique-tippers': { value: '312' },
};

const DEMO_LEADERBOARD = DEMO_ADDRESSES.map((addr, i) => ({
  address: addr,
  totalSent: (500 - i * 80) * 1_000_000,
  tipCount: 50 - i * 8,
}));

const DEMO_BALANCE = 125_500_000; // 125.5 STX

let demoTxCounter = 0;

export function DemoProvider({ children }) {
  const [isDemo, setIsDemo] = useState(false);
  const [demoTips, setDemoTips] = useState(() => generateDemoTips());
  const [demoNotifications, setDemoNotifications] = useState([]);

  const enterDemo = useCallback(() => {
    setIsDemo(true);
    setDemoTips(generateDemoTips());
    setDemoNotifications([]);
    demoTxCounter = 0;
  }, []);

  const exitDemo = useCallback(() => {
    setIsDemo(false);
  }, []);

  const simulateTipSend = useCallback(({ recipient, amount, message, category }) => {
    demoTxCounter += 1;
    const fakeTxId = `0xdemo${demoTxCounter.toString().padStart(6, '0')}${'a'.repeat(54)}`;
    const newTip = {
      id: Date.now(),
      sender: DEMO_USER_ADDRESS,
      recipient,
      amount,
      message: message || 'Thanks!',
      category,
      categoryLabel: DEMO_CATEGORIES[category] || 'General',
      blockHeight: 180000 + demoTxCounter,
      timestamp: Date.now(),
    };
    setDemoTips(prev => [newTip, ...prev]);
    return { txId: fakeTxId, success: true };
  }, []);

  const value = useMemo(() => ({
    isDemo,
    enterDemo,
    exitDemo,
    demoTips,
    demoNotifications,
    simulateTipSend,
    demoUserAddress: DEMO_USER_ADDRESS,
    demoBalance: DEMO_BALANCE,
    demoPlatformStats: DEMO_PLATFORM_STATS,
    demoLeaderboard: DEMO_LEADERBOARD,
  }), [isDemo, enterDemo, exitDemo, demoTips, demoNotifications, simulateTipSend]);

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoProvider');
  }
  return context;
}
