import { useState } from 'react';

interface ApiKeySetupProps {
  onComplete: () => void;
}

export function ApiKeySetup({ onComplete }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('sk-ant-')) {
      setError('API key should start with sk-ant-');
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
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <div className="w-full max-w-lg bg-gray-900 rounded-lg border border-gray-800 p-8">
        <h1 className="text-2xl font-bold text-white mb-2">BTC Agent App</h1>
        <p className="text-sm text-gray-400 mb-6">
          Enter your Anthropic API key to enable the AI agent. The key is stored
          securely in the macOS Keychain — never on disk or in environment
          variables.
        </p>

        <div className="bg-gray-800/50 rounded-lg p-4 mb-5 space-y-2">
          <p className="text-xs text-gray-400">
            <span className="text-orange-400 font-mono mr-1">1.</span>
            Go to{' '}
            <span className="text-gray-300">console.anthropic.com/settings/keys</span>
          </p>
          <p className="text-xs text-gray-400">
            <span className="text-orange-400 font-mono mr-1">2.</span>
            Create a new API key
          </p>
          <p className="text-xs text-gray-400">
            <span className="text-orange-400 font-mono mr-1">3.</span>
            Paste it below (starts with sk-ant-)
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

        <p className="text-xs text-gray-600 mt-4 text-center">
          The agent uses Claude (claude-sonnet-4-6) for tool-use conversations
        </p>
      </div>
    </div>
  );
}
