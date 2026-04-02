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
    <div className="flex items-center justify-center h-screen bg-gray-950 overflow-y-auto">
      <div className="w-full max-w-lg bg-gray-900 rounded-lg border border-gray-800 p-8 my-8">
        <h1 className="text-2xl font-bold text-white mb-4">BTC Agent App</h1>

        {/* What is this step */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <p className="text-xs font-medium text-orange-400 mb-1">
            What is this?
          </p>
          <p className="text-xs text-gray-400">
            This app is a watch-only wallet. It needs your extended public key
            (xpub) to see your balance and build unsigned transactions. Your
            private keys stay on your hardware wallet — they are never stored
            here.
          </p>
        </div>

        {/* Do I need a wallet first? */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <p className="text-xs font-medium text-orange-400 mb-1">
            Do I need a wallet already?
          </p>
          <p className="text-xs text-gray-400 mb-2">
            Yes — this app connects to an existing Bitcoin wallet. It does not
            create a new wallet or generate seed phrases. You need a wallet set
            up on one of these:
          </p>
          <div className="space-y-1 ml-2">
            <p className="text-xs text-gray-400">
              <span className="text-gray-300">Hardware wallet:</span> Coldcard,
              Blockstream Jade, Trezor, or Ledger
            </p>
            <p className="text-xs text-gray-400">
              <span className="text-gray-300">Software wallet:</span> Sparrow
              Wallet (recommended), Blockstream Green, or Electrum
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            If you don't have a wallet yet, download Sparrow Wallet
            (sparrowwallet.com), create a new wallet, and export the xpub from
            Settings &rarr; Keystore.
          </p>
        </div>

        {/* Testing mode */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <p className="text-xs font-medium text-orange-400 mb-1">
            Just testing?
          </p>
          <p className="text-xs text-gray-400">
            The app defaults to testnet (no real Bitcoin). You can generate a
            test key at iancoleman.io/bip39 — select "BIP84" and "Bitcoin
            Testnet", then copy the "Account Extended Public Key" (starts with
            tpub). No real funds are involved.
          </p>
        </div>

        {/* Where to find your xpub */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-5">
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
            <span className="text-orange-400 font-mono mr-1">Jade:</span>
            Connect via USB &rarr; export xpub through Blockstream Green
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
          Watch-only — no private keys are stored in this app. Your xpub is
          saved in the macOS Keychain.
        </p>
      </div>
    </div>
  );
}
