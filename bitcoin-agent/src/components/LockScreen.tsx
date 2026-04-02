import { useState } from 'react';

interface LockScreenProps {
  hasExistingPassword: boolean;
  onUnlock: () => void;
}

export function LockScreen({ hasExistingPassword, onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) return;
    setIsLoading(true);
    setError(null);
    const valid = await window.bitcoinAgent.verifyPassword(password);
    if (valid) {
      onUnlock();
    } else {
      setError('Incorrect password');
      setIsLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError(null);
    await window.bitcoinAgent.setPassword(password);
    onUnlock();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (hasExistingPassword) {
        handleLogin();
      } else if (confirmPassword) {
        handleSetup();
      }
    }
  };

  if (!hasExistingPassword) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="w-full max-w-lg bg-gray-900 rounded-lg border border-gray-800 p-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            BTC Agent App
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Welcome. This app is a watch-only Bitcoin wallet with an AI agent
            that helps you manage self-custody. To get started:
          </p>

          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 space-y-2">
            <p className="text-xs text-gray-300">
              <span className="text-orange-400 font-mono mr-2">1.</span>
              Set a password below to protect your app on launch
            </p>
            <p className="text-xs text-gray-300">
              <span className="text-orange-400 font-mono mr-2">2.</span>
              Import your extended public key (tpub/xpub) for watch-only access
            </p>
            <p className="text-xs text-gray-300">
              <span className="text-orange-400 font-mono mr-2">3.</span>
              View your balance, build unsigned PSBTs, and manage UTXOs
            </p>
            <p className="text-xs text-gray-300">
              <span className="text-orange-400 font-mono mr-2">4.</span>
              Sign transactions on your hardware wallet (Coldcard, Jade, Sparrow)
            </p>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Your password and keys are stored in the macOS Keychain — never on
            disk. The app never holds private signing keys.
          </p>

          <label className="block text-sm text-gray-300 mb-1">
            Create a password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter password"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 mb-3"
          />

          <label className="block text-sm text-gray-300 mb-1">
            Confirm password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Confirm password"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded p-3 mt-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleSetup}
            disabled={isLoading || !password || !confirmPassword}
            className="mt-4 w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Setting up...' : 'Set Password & Continue'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <div className="w-full max-w-sm bg-gray-900 rounded-lg border border-gray-800 p-8">
        <h1 className="text-2xl font-bold text-white mb-1 text-center">
          BTC Agent App
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your password to unlock
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Password"
          autoFocus
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
        />

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded p-3 mt-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading || !password}
          className="mt-4 w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Unlocking...' : 'Unlock'}
        </button>
      </div>
    </div>
  );
}
