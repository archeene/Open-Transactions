'use client';

import { useState, useCallback } from 'react';
import { CHAINS } from '@/lib/chains';
import { SupportedChain, OpenTxEvent } from '@/lib/types';
import { generateCsv, downloadCsv } from '@/lib/csv';
import { fetchTransactions, validateAddress } from '@/adapters';

type ExportMode = 'strict' | 'enriched';

export default function Home() {
  const [chain, setChain] = useState<SupportedChain>('bittensor');
  const [address, setAddress] = useState('');
  const [transactions, setTransactions] = useState<OpenTxEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [exportMode, setExportMode] = useState<ExportMode>('strict');

  const chainInfo = CHAINS[chain];

  const handleScan = useCallback(async () => {
    if (!address.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    if (!validateAddress(chain, address.trim())) {
      setError(`Invalid ${chainInfo.name} address format`);
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    setTransactions([]);

    try {
      const txs = await fetchTransactions(chain, address.trim(), (p) => {
        setProgress(p);
      });
      setTransactions(txs);
      setProgress(100);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [chain, address, chainInfo.name]);

  const handleDownload = useCallback(() => {
    if (transactions.length === 0) return;
    
    const csv = generateCsv(transactions, exportMode);
    const filename = `${chain}_${address.slice(0, 8)}_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsv(csv, filename);
  }, [transactions, exportMode, chain, address]);

  const totalReceived = transactions.reduce((sum, tx) => {
    if (tx.receivedQty && tx.receivedCurrency === chainInfo.symbol) {
      return sum + parseFloat(tx.receivedQty);
    }
    return sum;
  }, 0);

  const totalSent = transactions.reduce((sum, tx) => {
    if (tx.sentQty && tx.sentCurrency === chainInfo.symbol) {
      return sum + parseFloat(tx.sentQty);
    }
    return sum;
  }, 0);

  const totalFees = transactions.reduce((sum, tx) => {
    if (tx.feeAmount && tx.feeCurrency === chainInfo.symbol) {
      return sum + parseFloat(tx.feeAmount);
    }
    return sum;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-primary mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Multi-Chain Support
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Chain <span className="text-primary">Scan</span>
        </h1>
        <p className="text-white/60 max-w-2xl mx-auto">
          Export transaction history.
        </p>
      </div>

      {/* Chain Selection & Address Input */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Chain Selector */}
            <div className="sm:w-48">
              <select
                value={chain}
                onChange={(e) => {
                  setChain(e.target.value as SupportedChain);
                  setTransactions([]);
                  setError(null);
                }}
                className="select"
              >
                {Object.entries(CHAINS).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Address Input */}
            <div className="flex-1">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={`Paste ${chainInfo.name} wallet address`}
                className="input"
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
            </div>

            {/* Scan Button */}
            <button
              onClick={handleScan}
              disabled={loading || !address.trim()}
              className="btn btn-primary whitespace-nowrap"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning...
                </>
              ) : (
                <>
                  Scan
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-white/60 mb-2">
                <span>Fetching transactions...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          {/* Supported Chains */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-sm text-white/40 mb-3">Supported chains:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CHAINS).map(([key, info]) => (
                <span
                  key={key}
                  className={`px-3 py-1 rounded-full text-sm ${
                    chain === key
                      ? 'bg-primary/20 text-primary'
                      : 'bg-white/5 text-white/60'
                  }`}
                >
                  {info.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {transactions.length > 0 && (
        <div className="animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-6">
              <p className="text-white/60 text-sm mb-1">Total Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
            <div className="glass rounded-xl p-6">
              <p className="text-white/60 text-sm mb-1">Total Received</p>
              <p className="text-2xl font-bold text-green-400">
                {totalReceived.toFixed(4)} {chainInfo.symbol}
              </p>
            </div>
            <div className="glass rounded-xl p-6">
              <p className="text-white/60 text-sm mb-1">Total Sent</p>
              <p className="text-2xl font-bold text-red-400">
                {totalSent.toFixed(4)} {chainInfo.symbol}
              </p>
            </div>
            <div className="glass rounded-xl p-6">
              <p className="text-white/60 text-sm mb-1">Total Fees</p>
              <p className="text-2xl font-bold text-yellow-400">
                {totalFees.toFixed(6)} {chainInfo.symbol}
              </p>
            </div>
          </div>

          {/* Export Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-white/60 text-sm">Export format:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportMode('strict')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    exportMode === 'strict'
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  Awaken Tax (Strict)
                </button>
                <button
                  onClick={() => setExportMode('enriched')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    exportMode === 'enriched'
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  Enriched
                </button>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV
            </button>
          </div>

          {/* Transaction Table */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="tx-table">
                <thead>
                  <tr className="bg-white/5">
                    <th>Date (UTC)</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Currency</th>
                    <th>Fee</th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 100).map((tx, i) => (
                    <tr key={`${tx.txHash}-${i}`}>
                      <td className="text-white/80 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td>
                        {tx.receivedQty ? (
                          <span className="badge badge-received">Received</span>
                        ) : (
                          <span className="badge badge-sent">Sent</span>
                        )}
                      </td>
                      <td className={tx.receivedQty ? 'text-green-400' : 'text-red-400'}>
                        {tx.receivedQty ? `+${tx.receivedQty}` : `-${tx.sentQty}`}
                      </td>
                      <td className="text-white/80">
                        {tx.receivedCurrency || tx.sentCurrency}
                      </td>
                      <td className="text-white/60">
                        {tx.feeAmount ? `${tx.feeAmount} ${tx.feeCurrency}` : '-'}
                      </td>
                      <td>
                        {tx.explorerUrl ? (
                          <a
                            href={tx.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {tx.txHash?.slice(0, 8)}...{tx.txHash?.slice(-6)}
                          </a>
                        ) : (
                          <span className="text-white/40">
                            {tx.txHash?.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions.length > 100 && (
              <div className="p-4 text-center text-white/40 border-t border-white/5">
                Showing 100 of {transactions.length} transactions. Download CSV for full data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && transactions.length === 0 && address && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-white/60">No transactions found for this address.</p>
        </div>
      )}
    </div>
  );
}
