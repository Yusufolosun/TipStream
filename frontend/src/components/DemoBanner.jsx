import { useDemoMode } from '../context/DemoContext';

export default function DemoBanner() {
  const { isDemo, exitDemo } = useDemoMode();

  if (!isDemo) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-3 z-50 relative">
      <span className="inline-flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Demo Mode — No real STX is being used. Transactions are simulated.
      </span>
      <button
        onClick={exitDemo}
        className="ml-2 px-3 py-0.5 bg-amber-950 text-amber-100 rounded-full text-xs font-bold hover:bg-amber-900 transition-colors"
      >
        Exit Demo
      </button>
    </div>
  );
}
