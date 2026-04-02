import { useState, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';

function formatCost(cost: number): string {
  if (cost < 0.01) return '< $0.01';
  return `$${cost.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function SettingsView() {
  const {
    network,
    xpub,
    totalInputTokens,
    totalOutputTokens,
    usageHistory,
  } = useWalletStore();

  // Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState(false);

  // Recovery key
  const [recoveryPw, setRecoveryPw] = useState('');
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // API key
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [keyMessage, setKeyMessage] = useState<string | null>(null);

  useEffect(() => {
    window.bitcoinAgent.hasApiKey().then(setHasKey);
  }, []);

  const handleChangePassword = async () => {
    if (newPw.length < 8) {
      setPwMessage('Password must be at least 8 characters');
      setPwError(true);
      return;
    }
    if (newPw !== confirmPw) {
      setPwMessage('Passwords do not match');
      setPwError(true);
      return;
    }
    const result = await window.bitcoinAgent.changePassword(currentPw, newPw);
    if (result.success) {
      setPwMessage('Password changed successfully');
      setPwError(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } else {
      setPwMessage(result.error || 'Current password is incorrect');
      setPwError(true);
    }
  };

  const handleUpdateApiKey = async () => {
    const trimmed = newApiKey.trim();
    if (!trimmed.startsWith('sk-ant-') || trimmed.length < 30) {
      setKeyMessage('Invalid key format');
      return;
    }
    await window.bitcoinAgent.setApiKey(trimmed);
    setHasKey(true);
    setNewApiKey('');
    setKeyMessage('API key updated. Restart the app for changes to take effect.');
  };

  // Usage cost calculation
  const totalCost =
    totalInputTokens * (3 / 1_000_000) +
    totalOutputTokens * (15 / 1_000_000);

  const xpubDisplay = xpub
    ? `${xpub.slice(0, 12)}...${xpub.slice(-4)}`
    : 'Not imported';

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>

      {/* Password */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-1">
          Change Password
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Your password protects the app on launch. It is stored in the macOS
          Keychain.
        </p>
        <div className="space-y-2">
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Current password"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="New password (8+ characters)"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Confirm new password"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
        </div>
        {pwMessage && (
          <p
            className={`text-xs mt-2 ${
              pwError ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {pwMessage}
          </p>
        )}
        <button
          onClick={handleChangePassword}
          disabled={!currentPw || !newPw || !confirmPw}
          className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Change Password
        </button>
      </div>

      {/* Recovery Key */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-1">
          Recovery Key
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Your recovery key can reset your password if you forget it. Enter
          your current password to view it. Store it somewhere safe and private.
        </p>
        {recoveryKey ? (
          <div>
            <div className="bg-gray-800 rounded-lg p-4 text-center mb-3">
              <p className="text-lg font-mono text-orange-400 tracking-wider select-all">
                {recoveryKey}
              </p>
            </div>
            <button
              onClick={() => {
                setRecoveryKey(null);
                setRecoveryPw('');
              }}
              className="text-xs text-gray-500 hover:text-gray-400"
            >
              Hide recovery key
            </button>
          </div>
        ) : (
          <div>
            <input
              type="password"
              value={recoveryPw}
              onChange={(e) => setRecoveryPw(e.target.value)}
              placeholder="Enter current password to reveal"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
            />
            {recoveryError && (
              <p className="text-xs text-red-400 mt-2">{recoveryError}</p>
            )}
            <button
              onClick={async () => {
                setRecoveryError(null);
                const result = await window.bitcoinAgent.getRecoveryKey(recoveryPw);
                if (result.success && result.recoveryKey) {
                  setRecoveryKey(result.recoveryKey);
                } else {
                  setRecoveryError(result.error || 'Failed to retrieve recovery key');
                }
              }}
              disabled={!recoveryPw}
              className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Show Recovery Key
            </button>
          </div>
        )}
      </div>

      {/* API Key */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-1">API Key</h3>
        <p className="text-xs text-gray-500 mb-3">
          The Agent chat uses Claude (claude-sonnet-4-6). Your API key is stored
          in the macOS Keychain.
        </p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-400">Status:</span>
          {hasKey ? (
            <span className="text-xs text-green-400">Configured</span>
          ) : (
            <span className="text-xs text-yellow-400">Not configured</span>
          )}
        </div>
        <input
          type="password"
          value={newApiKey}
          onChange={(e) => setNewApiKey(e.target.value)}
          placeholder={hasKey ? 'Enter new key to replace' : 'sk-ant-...'}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
        />
        {keyMessage && (
          <p className="text-xs text-green-400 mt-2">{keyMessage}</p>
        )}
        <button
          onClick={handleUpdateApiKey}
          disabled={!newApiKey.trim()}
          className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasKey ? 'Update API Key' : 'Save API Key'}
        </button>
      </div>

      {/* API Usage */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-1">
          API Usage (This Session)
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Token usage and estimated cost for agent conversations. Credits are
          prepaid and expire after 1 year. Usage resets when the app restarts
          (persistent tracking in a future update).
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Input Tokens</p>
            <p className="text-lg font-mono text-white">
              {formatTokens(totalInputTokens)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Output Tokens</p>
            <p className="text-lg font-mono text-white">
              {formatTokens(totalOutputTokens)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Estimated Cost</p>
            <p className="text-lg font-mono text-white">
              {formatCost(totalCost)}
            </p>
          </div>
        </div>

        {usageHistory.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">
              Recent Conversations ({usageHistory.length})
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {usageHistory
                .slice()
                .reverse()
                .slice(0, 20)
                .map((r, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-xs text-gray-400 bg-gray-800/50 rounded px-2 py-1"
                  >
                    <span>
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-mono">
                      {r.inputTokens + r.outputTokens} tokens
                    </span>
                    <span className="font-mono">{formatCost(r.estimatedCost)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {usageHistory.length === 0 && (
          <p className="text-xs text-gray-600">
            No conversations yet. Usage will appear here after you chat with the
            agent.
          </p>
        )}
      </div>

      {/* Wallet Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Wallet</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Network</span>
            <span className="text-xs font-mono text-yellow-400 uppercase">
              {network}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Extended Public Key</span>
            <span className="text-xs font-mono text-gray-400">
              {xpubDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-3">About</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">App</span>
            <span className="text-xs text-gray-400">BTC Agent App v0.3.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Agent Model</span>
            <span className="text-xs font-mono text-gray-400">
              claude-sonnet-4-6
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Security</span>
            <span className="text-xs text-gray-400">
              Watch-only, PSBT signing on hardware
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Created by Andrew Brown. Built with Claude Code.
        </p>
      </div>
    </div>
  );
}
