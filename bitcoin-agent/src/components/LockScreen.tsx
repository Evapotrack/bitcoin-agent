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

  // Recovery key display after initial setup
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);

  // Forgot password flow
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

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
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError(null);
    await window.bitcoinAgent.setPassword(password);
    // Generate and show recovery key
    const key = await window.bitcoinAgent.createRecoveryKey();
    setRecoveryKey(key);
    setIsLoading(false);
  };

  const handleRecoveryReset = async () => {
    if (!recoveryInput.trim()) {
      setError('Enter your recovery key');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await window.bitcoinAgent.resetWithRecovery(
      recoveryInput.trim(),
      newPassword
    );
    if (result.success) {
      onUnlock();
    } else {
      setError(result.error || 'Invalid recovery key');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showRecovery) {
        handleRecoveryReset();
      } else if (hasExistingPassword) {
        handleLogin();
      } else if (confirmPassword) {
        handleSetup();
      }
    }
  };

  // Recovery key display after initial setup
  if (recoveryKey) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="w-full max-w-lg bg-gray-900 rounded-lg border border-gray-800 p-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Recovery Key
          </h1>
          <p className="text-sm text-gray-400 mb-4">
            Write this recovery key down and store it somewhere safe. If you
            forget your password, this is the only way to regain access to the
            app.
          </p>

          <div className="bg-gray-800 rounded-lg p-4 mb-4 text-center">
            <p className="text-lg font-mono text-orange-400 tracking-wider select-all">
              {recoveryKey}
            </p>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3 mb-6">
            <p className="text-xs text-yellow-400">
              This key is shown only once during setup. It is stored securely in
              your macOS Keychain, but if you lose access to this machine and
              don't have the key written down, you cannot recover your app
              password. Your Bitcoin is always safe on your hardware wallet.
            </p>
          </div>

          <button
            onClick={onUnlock}
            className="w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors"
          >
            I've saved my recovery key — Continue
          </button>
        </div>
      </div>
    );
  }

  // First-time setup
  if (!hasExistingPassword) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 overflow-y-auto">
        <div className="w-full max-w-lg bg-gray-900 rounded-lg border border-gray-800 p-8 my-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            BTC Agent App
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Welcome. This is a Bitcoin wallet app with an AI agent that helps
            you manage your sats. To get started:
          </p>

          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 space-y-2">
            <p className="text-xs text-gray-300">
              <span className="text-orange-400 font-mono mr-2">1.</span>
              Set a password below to protect your app on launch
            </p>
            <p className="text-xs text-gray-300">
              <span className="text-orange-400 font-mono mr-2">2.</span>
              Save your recovery key (shown after password is set)
            </p>
            <p className="text-xs text-gray-300">
              <span className="text-orange-400 font-mono mr-2">3.</span>
              Connect your wallet or use testnet to explore
            </p>
            <p className="text-xs text-gray-300">
              <span className="text-orange-400 font-mono mr-2">4.</span>
              Chat with the agent, check balance, build transactions
            </p>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Your password and keys are stored in the macOS Keychain — never on
            disk.
          </p>

          <label className="block text-sm text-gray-300 mb-1">
            Create a password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter password (8+ characters)"
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

  // Forgot password / recovery flow
  if (showRecovery) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="w-full max-w-sm bg-gray-900 rounded-lg border border-gray-800 p-8">
          <h1 className="text-xl font-bold text-white mb-1 text-center">
            Reset Password
          </h1>
          <p className="text-xs text-gray-500 text-center mb-6">
            Enter your recovery key and a new password
          </p>

          <input
            type="text"
            value={recoveryInput}
            onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 mb-3 tracking-wider text-center"
          />

          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New password (8+ characters)"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 mb-3"
          />

          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Confirm new password"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded p-3 mt-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleRecoveryReset}
            disabled={isLoading || !recoveryInput || !newPassword}
            className="mt-4 w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>

          <button
            onClick={() => {
              setShowRecovery(false);
              setError(null);
            }}
            className="mt-2 w-full px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-500 hover:text-gray-300 rounded text-sm transition-colors"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Normal login
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

        <button
          onClick={() => setShowRecovery(true)}
          className="mt-3 w-full px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-600 hover:text-gray-400 rounded text-xs transition-colors"
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
}
