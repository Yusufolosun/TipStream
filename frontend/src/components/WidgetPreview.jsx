import { useState } from 'react';
import CopyButton from './ui/copy-button';

export default function WidgetPreview({ address }) {
    const embedCode = `<!-- TipStream Widget -->
<div class="tipstream-widget" data-address="${address}"></div>
<script src="https://tipstream.app/widget.js" async></script>`;

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Embeddable Widget</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Add a TipStream button to your own website, blog, or README. Visitors can tip you without leaving your site.
            </p>

            <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Preview
                </label>
                <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                    <button className="flex items-center gap-2 bg-[#0f172a] hover:bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all">
                        <img src="/logo.png" alt="TipStream" className="w-5 h-5" />
                        Tip with TipStream
                    </button>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Embed Code
                    </label>
                    <CopyButton text={embedCode} label="Copy Code" />
                </div>
                <div className="relative">
                    <pre className="p-4 bg-gray-900 text-gray-300 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
                        {embedCode}
                    </pre>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Make sure to use your actual wallet address for the <code>data-address</code> attribute.</span>
            </div>
        </div>
    );
}
