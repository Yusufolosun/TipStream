import { useState, useCallback } from 'react';
import { openContractCall } from '@stacks/connect';
import {
  listCV,
  tupleCV,
  uintCV,
  stringUtf8CV,
  principalCV,
  PostConditionMode,
  Pc,
} from '@stacks/transactions';
import { network, appDetails, userSession } from '../utils/stacks';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/contracts';
import { toMicroSTX, formatSTX } from '../lib/utils';
import { useTipContext } from '../context/TipContext';
import { analytics } from '../lib/analytics';

const MAX_RECIPIENTS = 50;
const MIN_TIP_STX = 0.001;
const MAX_TIP_STX = 10000;
const FEE_BASIS_POINTS = 50;
const BASIS_POINTS_DIVISOR = 10000;

function emptyEntry() {
  return { recipient: '', amount: '', message: '', error: '' };
}

export default function BatchTip({ addToast }) {
  const { notifyTipSent } = useTipContext();
  const [entries, setEntries] = useState([emptyEntry(), emptyEntry()]);
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState('strict');

  const isValidStacksAddress = (address) => {
    if (!address) return false;
    const trimmed = address.trim();
    if (trimmed.length < 38 || trimmed.length > 41) return false;
    return /^(SP|SM|ST)[0-9A-Z]{33,39}$/i.test(trimmed);
  };

  const updateEntry = useCallback((index, field, value) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value, error: '' };
      return next;
    });
  }, []);

  const addEntry = () => {
    if (entries.length >= MAX_RECIPIENTS) return;
    setEntries((prev) => [...prev, emptyEntry()]);
  };

  const removeEntry = (index) => {
    if (entries.length <= 1) return;
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const validEntries = entries.filter(
    (e) => e.recipient.trim() && e.amount && parseFloat(e.amount) >= MIN_TIP_STX
  );

  const totalAmount = validEntries.reduce(
    (sum, e) => sum + parseFloat(e.amount || '0'),
    0
  );

  const totalFee =
    totalAmount * (FEE_BASIS_POINTS / BASIS_POINTS_DIVISOR);

  const validate = () => {
    let valid = true;
    const sender = userSession.loadUserData().profile.stxAddress.mainnet;
    const updated = entries.map((entry) => {
      const errs = [];
      if (!entry.recipient.trim()) {
        errs.push('Address required');
      } else if (!isValidStacksAddress(entry.recipient.trim())) {
        errs.push('Invalid Stacks address');
      } else if (entry.recipient.trim() === sender) {
        errs.push('Cannot tip yourself');
      }
      if (!entry.amount || parseFloat(entry.amount) < MIN_TIP_STX) {
        errs.push(`Min ${MIN_TIP_STX} STX`);
      } else if (parseFloat(entry.amount) > MAX_TIP_STX) {
        errs.push(`Max ${MAX_TIP_STX} STX`);
      }
      if (errs.length) valid = false;
      return { ...entry, error: errs.join('. ') };
    });
    setEntries(updated);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSending(true);
    analytics.trackBatchTipStarted();

    try {
      const totalMicro = toMicroSTX(totalAmount + totalFee);
      const sender = userSession.loadUserData().profile.stxAddress.mainnet;

      const tipsList = validEntries.map((e) =>
        tupleCV({
          recipient: principalCV(e.recipient.trim()),
          amount: uintCV(toMicroSTX(parseFloat(e.amount))),
          message: stringUtf8CV(e.message || 'Batch tip'),
        })
      );

      const functionName =
        mode === 'strict' ? 'send-batch-tips-strict' : 'send-batch-tips';

      await openContractCall({
        network,
        appDetails,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs: [listCV(tipsList)],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [
          Pc.principal(sender).willSendLte(totalMicro).ustx(),
        ],
        onFinish: () => {
          notifyTipSent();
          analytics.trackBatchTipSubmitted();
          addToast(`Batch of ${validEntries.length} tips submitted`, 'success');
          setEntries([emptyEntry(), emptyEntry()]);
        },
        onCancel: () => {
          addToast('Transaction cancelled', 'info');
        },
      });
    } catch (err) {
      analytics.trackError('BatchTip', err.message || 'Unknown error');
      addToast(err.message || 'Failed to send batch tips', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Batch Tipping</h2>
          <p className="text-gray-500 mt-1">
            Send tips to multiple recipients in a single transaction (up to {MAX_RECIPIENTS}).
          </p>
        </div>

        <div className="p-8 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium text-gray-700">Mode:</label>
            <button
              type="button"
              onClick={() => setMode('strict')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                mode === 'strict'
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Strict (all-or-nothing)
            </button>
            <button
              type="button"
              onClick={() => setMode('partial')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                mode === 'partial'
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Partial (skip failures)
            </button>
          </div>

          {entries.map((entry, i) => (
            <div
              key={i}
              className="relative bg-gray-50 rounded-2xl p-5 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Recipient {i + 1}
                </span>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                    aria-label={`Remove recipient ${i + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="SP... address"
                  value={entry.recipient}
                  onChange={(e) => updateEntry(i, 'recipient', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
                <input
                  type="number"
                  placeholder="Amount (STX)"
                  step="0.000001"
                  min={MIN_TIP_STX}
                  max={MAX_TIP_STX}
                  value={entry.amount}
                  onChange={(e) => updateEntry(i, 'amount', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
                <input
                  type="text"
                  placeholder="Message (optional)"
                  maxLength={280}
                  value={entry.message}
                  onChange={(e) => updateEntry(i, 'message', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              {entry.error && (
                <p className="mt-2 text-xs text-red-500 font-medium">
                  {entry.error}
                </p>
              )}
            </div>
          ))}

          {entries.length < MAX_RECIPIENTS && (
            <button
              type="button"
              onClick={addEntry}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
            >
              + Add Recipient
            </button>
          )}
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">
                {validEntries.length} valid recipient{validEntries.length !== 1 ? 's' : ''}
              </p>
              <p className="text-lg font-bold text-gray-900">
                Total: {formatSTX(toMicroSTX(totalAmount))} STX
                <span className="text-sm font-normal text-gray-500 ml-2">
                  + ~{formatSTX(toMicroSTX(totalFee))} fee
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending || validEntries.length === 0}
              className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? 'Sending...' : `Send ${validEntries.length} Tips`}
            </button>
          </div>
          {mode === 'strict' && (
            <p className="text-xs text-gray-400">
              Strict mode: if any tip fails, the entire batch is reverted.
            </p>
          )}
          {mode === 'partial' && (
            <p className="text-xs text-gray-400">
              Partial mode: successful tips go through even if some fail.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
