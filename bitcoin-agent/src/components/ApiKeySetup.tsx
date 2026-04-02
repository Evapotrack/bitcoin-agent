import { useState } from 'react';

interface ApiKeySetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ApiKeySetup({ onComplete, onSkip }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('sk-ant-') || trimmed.length < 30) {
      setError('Invalid API key. It should start with sk-ant- and be at least 30 characters.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await window.bitcoinAgent.setApiKey(trimmed);
      onComplete();
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-950 overflow-y-auto">
      <div className="w-full max-w-lg bg-gray-900 rounded-lg border border-gray-800 p-8 my-8">
        <h1 className="text-2xl font-bold text-white mb-4">BTC Agent App</h1>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs font-medium text-orange-400 mb-1">
              What is this?
            </p>
            <p className="text-xs text-gray-400">
              BTC Agent App includes an AI assistant powered by Claude that can
              check your balance, estimate fees, build transactions, and answer
              questions about your wallet — all through natural language chat.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs font-medium text-orange-400 mb-1">
              Why do I need an API key?
            </p>
            <p className="text-xs text-gray-400">
              The AI agent runs on Anthropic's Claude API. An API key connects
              your app to Claude so it can process your requests. Without it,
              the agent chat won't work — but everything else in the app still
              does.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs font-medium text-orange-400 mb-1">
              How much does it cost?
            </p>
            <p className="text-xs text-gray-400">
              API credits are prepaid (not a subscription). $20 gets you started,
              $50 lasts months of personal use. A typical chat costs less than
              $0.01. Credits expire after 1 year.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs font-medium text-orange-400 mb-1">
              Is it secure?
            </p>
            <p className="text-xs text-gray-400">
              Your API key is stored in the macOS Keychain — the same system
              that stores your passwords and certificates. It is never written
              to disk, never in environment variables, and never leaves your
              machine.
            </p>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 mb-5 space-y-2">
          <p className="text-xs font-medium text-gray-300 mb-2">
            How to get your key:
          </p>
          <p className="text-xs text-gray-400">
            <span className="text-orange-400 font-mono mr-1">1.</span>
            Go to console.anthropic.com/settings/keys
          </p>
          <p className="text-xs text-gray-400">
            <span className="text-orange-400 font-mono mr-1">2.</span>
            Buy credits ($20–$100) if you haven't already
          </p>
          <p className="text-xs text-gray-400">
            <span className="text-orange-400 font-mono mr-1">3.</span>
            Create a new API key and paste it below
          </p>
        </div>

        <label className="block text-sm text-gray-300 mb-1">
          Anthropic API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="sk-ant-..."
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
        />

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded p-3 mt-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isLoading || !apiKey.trim()}
          className="mt-4 w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </button>

        <button
          onClick={onSkip}
          className="mt-3 w-full px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-500 hover:text-gray-300 rounded text-sm transition-colors"
        >
          Skip for now
        </button>

        <p className="text-xs text-gray-600 mt-3 text-center">
          Without an API key, Dashboard, Send, Transactions, Reference, and How
          To all work normally. Only the Agent chat requires it. You can add
          your key later in Settings.
        </p>
      </div>
    </div>
  );
}
