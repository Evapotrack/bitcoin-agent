import { useWalletStore } from '../store/walletStore';

function formatSats(sats: number): string {
  return sats.toLocaleString();
}

export function Dashboard() {
  const {
    balanceConfirmed,
    balanceUnconfirmed,
    isLoading,
    error,
    network,
    refreshBalance,
  } = useWalletStore();

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400 uppercase tracking-wider">
            Confirmed Balance
          </p>
          <span className="px-2 py-0.5 text-xs font-mono rounded bg-yellow-600/20 text-yellow-400 uppercase">
            {network}
          </span>
        </div>

        <p className="text-4xl font-mono text-white mb-1">
          {formatSats(balanceConfirmed)}
          <span className="text-lg text-gray-500 ml-2">sats</span>
        </p>

        {balanceUnconfirmed !== 0 && (
          <p className="text-sm text-gray-400 mt-2 font-mono">
            {balanceUnconfirmed > 0 ? '+' : ''}
            {formatSats(balanceUnconfirmed)} sats unconfirmed
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={refreshBalance}
        disabled={isLoading}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Refreshing...' : 'Refresh Balance'}
      </button>
    </div>
  );
}
