import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useWalletStore } from '../store/walletStore';

type Step = 'form' | 'confirm' | 'export' | 'broadcast' | 'done';

const FEE_LABELS = {
  fast: 'Fast (~10 min)',
  normal: 'Normal (~30 min)',
  economy: 'Economy (~1 hr)',
} as const;

function formatSats(sats: number): string {
  return sats.toLocaleString();
}

export function SendView() {
  const {
    balanceConfirmed,
    feeEstimates,
    currentPsbt,
    signedTxHex,
    psbtHistory,
    isLoading,
    error,
    fetchFees,
    buildPsbt,
    exportPsbtFile,
    importSignedPsbt,
    broadcastTx,
    clearCurrentPsbt,
    setView,
  } = useWalletStore();

  const [step, setStep] = useState<Step>('form');
  const [destination, setDestination] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [feePreset, setFeePreset] = useState<'fast' | 'normal' | 'economy' | 'custom'>('normal');
  const [customFeeRate, setCustomFeeRate] = useState('');
  const [broadcastTxid, setBroadcastTxid] = useState<string | null>(null);

  useEffect(() => {
    fetchFees();
  }, []);

  const getFeeRate = (): number => {
    if (!feeEstimates) return 1;
    switch (feePreset) {
      case 'fast':
        return feeEstimates.fastestFee;
      case 'normal':
        return feeEstimates.halfHourFee;
      case 'economy':
        return feeEstimates.economyFee;
      case 'custom':
        return parseInt(customFeeRate) || 1;
    }
  };

  const amountSats = parseInt(amountStr) || 0;
  const isLargeAmount = amountSats > 1_000_000;

  const handleReview = () => {
    if (!destination || !amountSats) return;
    setStep('confirm');
  };

  const handleBuild = async () => {
    await buildPsbt(destination, amountSats, getFeeRate());
    if (!useWalletStore.getState().error) {
      setStep('export');
    }
  };

  const handleExportFile = async () => {
    await exportPsbtFile();
  };

  const handleImportSigned = async () => {
    await importSignedPsbt();
    if (useWalletStore.getState().signedTxHex) {
      setStep('broadcast');
    }
  };

  const handleBroadcast = async () => {
    await broadcastTx();
    const state = useWalletStore.getState();
    const latest = state.psbtHistory[0];
    if (latest?.txid) {
      setBroadcastTxid(latest.txid);
      setStep('done');
    }
  };

  const handleCancel = () => {
    clearCurrentPsbt();
    setView('dashboard');
  };

  const handleMax = () => {
    // Rough estimate: leave room for fee
    const feeRate = getFeeRate();
    const estimatedFee = Math.ceil(feeRate * 140); // ~1 input, 1 output
    const max = Math.max(0, balanceConfirmed - estimatedFee);
    setAmountStr(String(max));
  };

  // Step 1: Form
  if (step === 'form') {
    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-bold text-white mb-6">Send Bitcoin</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Destination Address
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="tb1q... (testnet)"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Amount (sats)</label>
              <button
                onClick={handleMax}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                Max
              </button>
            </div>
            <input
              type="text"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ''))}
              placeholder="50000"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
            />
            {isLargeAmount && (
              <p className="text-xs text-orange-400 mt-1">
                This is more than 0.01 BTC. Please verify carefully.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Fee Rate
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['fast', 'normal', 'economy'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setFeePreset(preset)}
                  className={`px-2 py-2 rounded text-xs transition-colors ${
                    feePreset === preset
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <div>{FEE_LABELS[preset]}</div>
                  {feeEstimates && (
                    <div className="font-mono mt-0.5">
                      {preset === 'fast' && feeEstimates.fastestFee}
                      {preset === 'normal' && feeEstimates.halfHourFee}
                      {preset === 'economy' && feeEstimates.economyFee}
                      {' sat/vB'}
                    </div>
                  )}
                </button>
              ))}
              <button
                onClick={() => setFeePreset('custom')}
                className={`px-2 py-2 rounded text-xs transition-colors ${
                  feePreset === 'custom'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Custom
              </button>
            </div>
            {feePreset === 'custom' && (
              <input
                type="text"
                value={customFeeRate}
                onChange={(e) =>
                  setCustomFeeRate(e.target.value.replace(/\D/g, ''))
                }
                placeholder="sat/vB"
                className="mt-2 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
              />
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded p-3 mt-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleReview}
            disabled={!destination || !amountSats}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Review Transaction
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Confirmation
  if (step === 'confirm') {
    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-bold text-white mb-6">
          Confirm Transaction
        </h2>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-400">To</span>
            <span className="text-sm font-mono text-gray-200 max-w-xs truncate">
              {destination}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-400">Amount</span>
            <span className="text-sm font-mono text-white">
              {formatSats(amountSats)} sats
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-400">Fee Rate</span>
            <span className="text-sm font-mono text-gray-300">
              {getFeeRate()} sat/vB
            </span>
          </div>
        </div>

        {isLargeAmount && (
          <div className="bg-orange-900/20 border border-orange-800 rounded p-3 mt-4">
            <p className="text-sm text-orange-400">
              Large amount: {formatSats(amountSats)} sats (&gt;0.01 BTC).
              Verify the destination address carefully.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded p-3 mt-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleBuild}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Building PSBT...' : 'Build PSBT'}
          </button>
          <button
            onClick={() => setStep('form')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Export
  if (step === 'export' && currentPsbt) {
    const psbtTooLarge = currentPsbt.psbtBase64.length > 2900;

    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-bold text-white mb-2">
          Export Unsigned PSBT
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Sign this PSBT on your hardware wallet (Coldcard, Jade, or Sparrow),
          then import the signed file back here.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-3 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-400">Inputs</span>
            <span className="text-sm font-mono text-gray-300">
              {currentPsbt.inputCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-400">Amount</span>
            <span className="text-sm font-mono text-white">
              {formatSats(currentPsbt.amountSats)} sats
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-400">Fee</span>
            <span className="text-sm font-mono text-gray-300">
              {formatSats(currentPsbt.fee)} sats
            </span>
          </div>
          {currentPsbt.changeAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Change</span>
              <span className="text-sm font-mono text-gray-300">
                {formatSats(currentPsbt.changeAmount)} sats
              </span>
            </div>
          )}
        </div>

        {!psbtTooLarge && (
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded">
              <QRCodeSVG
                value={currentPsbt.psbtBase64}
                size={200}
                level="L"
              />
            </div>
          </div>
        )}

        {psbtTooLarge && (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3 mb-4">
            <p className="text-xs text-yellow-400">
              PSBT too large for QR code. Use file export instead.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded p-3 mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={handleExportFile}
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm transition-colors"
          >
            Export .psbt File
          </button>
          <button
            onClick={handleImportSigned}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Importing...' : 'Import Signed PSBT'}
          </button>
          <button
            onClick={handleCancel}
            className="w-full px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-400 rounded text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Broadcast
  if (step === 'broadcast' && signedTxHex) {
    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-bold text-white mb-2">
          Broadcast Transaction
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Signed transaction is ready. Broadcast it to the Bitcoin network.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500 mb-1">Signed Transaction Hex</p>
          <p className="text-xs font-mono text-gray-400 break-all">
            {signedTxHex.slice(0, 80)}...
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded p-3 mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleBroadcast}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Broadcasting...' : 'Broadcast Transaction'}
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Done
  if (step === 'done' && broadcastTxid) {
    return (
      <div className="max-w-lg">
        <h2 className="text-2xl font-bold text-white mb-2">
          Transaction Broadcast
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Your transaction has been submitted to the network.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
          <p className="text-xs font-mono text-orange-400 break-all">
            {broadcastTxid}
          </p>
          <a
            href={`https://mempool.space/testnet/tx/${broadcastTxid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-400 mt-2 inline-block"
          >
            View on mempool.space
          </a>
        </div>

        <button
          onClick={() => setView('dashboard')}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return null;
}
