import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import SendTip from './components/SendTip';
import { useTipContext, TipProvider } from './context/TipContext';

const WidgetModal = ({ address, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="ts-widget-overlay" onClick={onClose}>
            <div className="ts-widget-modal" onClick={(e) => e.stopPropagation()}>
                <button className="ts-widget-close" onClick={onClose}>&times;</button>
                <SendTip defaultRecipient={address} addToast={(msg, type) => console.log(`[TipStream] ${type}: ${msg}`)} />
            </div>
        </div>
    );
};

const TipWidget = ({ address }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="ts-widget-container">
            <button
                className="ts-widget-button"
                onClick={() => setIsOpen(true)}
            >
                <img src="https://tipstream.app/logo.png" alt="TipStream" className="ts-widget-logo" />
                Tip with TipStream
            </button>

            <WidgetModal
                address={address}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />

            <style>{`
        .ts-widget-container {
          all: initial;
          display: inline-block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .ts-widget-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        .ts-widget-button:hover {
          background: #000;
          transform: translateY(-1px);
        }
        .ts-widget-logo {
          width: 20px;
          height: 20px;
        }
        .ts-widget-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
        }
        .ts-widget-modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 450px;
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
        }
        .ts-widget-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
          z-index: 10;
        }
      `}</style>
        </div>
    );
};

const initWidget = () => {
    const elements = document.querySelectorAll('.tipstream-widget');
    elements.forEach(el => {
        if (el.dataset.tsInitialized) return;

        const address = el.dataset.address;
        if (!address) {
            console.warn('[TipStream] Widget missing data-address attribute');
            return;
        }

        const shadow = el.attachShadow({ mode: 'open' });
        const mountPoint = document.createElement('div');
        shadow.appendChild(mountPoint);

        createRoot(mountPoint).render(
            <TipProvider>
                <TipWidget address={address} />
            </TipProvider>
        );

        el.dataset.tsInitialized = 'true';
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
} else {
    initWidget();
}

// Re-run on dynamic content updates
const observer = new MutationObserver(initWidget);
observer.observe(document.body, { childList: true, subtree: true });
