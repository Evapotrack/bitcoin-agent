import { useWalletStore } from '../store/walletStore';
import type { PsbtStatus } from '../types/bitcoin';

function formatSats(sats: number): string {
  return sats.toLocaleString();
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
}

const STATUS_STYLES: Record<PsbtStatus, { bg: string; text: string; label: string }> = {
  built: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', label: 'Built' },
  signed: { bg: 'bg-blue-600/20', text: 'text-blue-400', label: 'Signed' },
  broadcast: { bg: 'bg-orange-600/20', text: 'text-orange-400', label: 'Broadcast' },
  confirming: { bg: 'bg-purple-600/20', text: 'text-purple-400', label: 'Confirming' },
  confirmed: { bg: 'bg-green-600/20', text: 'text-green-400', label: 'Confirmed' },
};

export function TransactionsView() {
  const { psbtHistory, network } = useWalletStore();

  if (psbtHistory.length === 0) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Transactions</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">No transactions yet.</p>
          <p className="text-xs text-gray-600 mt-1">
            Build and broadcast a PSBT from the Send view.
          </p>
        </div>
      </div>
    );
  }

  const mempoolBase =
    network === 'testnet'
      ? 'https://mempool.space/testnet'
      : 'https://mempool.space';

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Transactions</h2>

      <div className="space-y-2">
        {psbtHistory.map((record) => {
          const statusStyle = STATUS_STYLES[record.status];
          return (
            <div
              key={record.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-gray-300">
                  {truncateAddress(record.destination)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                >
                  {statusStyle.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formatDate(record.createdAt)}
                </span>
                <div className="text-right">
                  <span className="text-sm font-mono text-white">
                    {formatSats(record.amountSats)} sats
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    +{formatSats(record.fee)} fee
                  </span>
                </div>
              </div>
              {record.txid && (
                <div className="mt-2 pt-2 border-t border-gray-800">
                  <a
                    href={`${mempoolBase}/tx/${record.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-orange-400 hover:text-orange-300"
                  >
                    {record.txid.slice(0, 16)}...
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
