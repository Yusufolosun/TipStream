import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tipstream_onboarding_completed';

const steps = [
    {
        title: 'Welcome to TipStream',
        description: 'TipStream lets you send STX tips to creators and supporters on the Stacks blockchain, secured by Bitcoin.',
        icon: '👋',
    },
    {
        title: 'How Tipping Works',
        description: 'Enter a Stacks address, choose an amount, and add an optional message. A small 0.5% platform fee is deducted automatically. The rest goes directly to the recipient.',
        icon: '⚡',
    },
    {
        title: 'Stacks Addresses',
        description: 'Stacks addresses start with "SP" on mainnet or "ST" on testnet. You can find someone\'s address on their profile or from the Stacks explorer.',
        icon: '🔗',
    },
    {
        title: 'Track Your Activity',
        description: 'View your tip history, check the leaderboard, and manage your profile. All transactions are recorded on-chain for full transparency.',
        icon: '📊',
    },
];

export default function Onboarding({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed) {
            setVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setVisible(false);
        if (onComplete) onComplete();
    };

    if (!visible) return null;

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
                <div className="text-center mb-6">
                    <span className="text-5xl block mb-4">{step.icon}</span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h2>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>

                <div className="flex justify-center gap-1.5 mb-6">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${
                                i === currentStep ? 'w-8 bg-gray-900' : 'w-1.5 bg-gray-200'
                            }`}
                        />
                    ))}
                </div>

                <div className="flex gap-3">
                    {!isLast && (
                        <button
                            onClick={handleSkip}
                            className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Skip
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className={`${isLast ? 'w-full' : 'flex-1'} py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors`}
                    >
                        {isLast ? 'Start Tipping' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
}
