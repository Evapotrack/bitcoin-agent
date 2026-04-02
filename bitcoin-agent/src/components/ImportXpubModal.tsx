import { useState } from 'react';
import { useWalletStore } from '../store/walletStore';

export function ImportXpubModal() {
  const [xpubInput, setXpubInput] = useState('');
  const { importXpub, isLoading, error } = useWalletStore();

  const handleImport = async () => {
    const trimmed = xpubInput.trim();
    if (!trimmed) return;
    await importXpub(trimmed);
  };

  const hasValidPrefix =
    xpubInput.trim().length === 0 ||
    xpubInput.trim().startsWith('tpub') ||
    xpubInput.trim().startsWith('xpub') ||
    xpubInput.trim().startsWith('zpub');

  return (
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <div className="w-full max-w-lg bg-gray-900 rounded-lg border border-gray-800 p-8">
        <h1 className="text-2xl font-bold text-white mb-2">BTC Agent App</h1>
        <p className="text-sm text-gray-400 mb-4">
          Import your extended public key to create a watch-only wallet. This
          lets the app see your balance and build unsigned transactions — your
          private keys stay on your hardware device.
        </p>

        <div className="bg-gray-800/50 rounded-lg p-4 mb-5 space-y-2">
          <p className="text-xs font-medium text-gray-300 mb-2">
            Where to find your xpub:
          </p>
          <p className="text-xs text-gray-400">
            <span className="text-orange-400 font-mono mr-1">Sparrow:</span>
            Settings &rarr; Keystore &rarr; xpub (use BIP84 / Native Segwit)
          </p>
          <p className="text-xs text-gray-400">
            <span className="text-orange-400 font-mono mr-1">Coldcard:</span>
            Advanced &rarr; Export Wallet &rarr; Generic JSON &rarr; copy the
            BIP84 tpub/zpub
          </p>
          <p className="text-xs text-gray-400">
            <span className="text-orange-400 font-mono mr-1">Testing:</span>
            Use a testnet tpub from{' '}
            <span className="text-gray-300">iancoleman.io/bip39</span>{' '}
            (select BIP84 + Bitcoin Testnet)
          </p>
        </div>

        <label className="block text-sm text-gray-300 mb-2">
          Extended Public Key (tpub for testnet)
        </label>
        <textarea
          value={xpubInput}
          onChange={(e) => setXpubInput(e.target.value)}
          placeholder="tpub..."
          rows={4}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-none"
        />

        {!hasValidPrefix && (
          <p className="text-xs text-yellow-400 mt-1">
            Expected prefix: tpub (testnet), xpub, or zpub
          </p>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded p-3 mt-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={isLoading || xpubInput.trim().length === 0}
          className="mt-4 w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Importing...' : 'Import Watch-Only Wallet'}
        </button>

        <p className="text-xs text-gray-600 mt-4 text-center">
          Watch-only — no private keys are stored in this app
        </p>
      </div>
    </div>
  );
}
