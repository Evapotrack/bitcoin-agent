import { useWalletStore } from '../store/walletStore';

function formatSats(sats: number): string {
  return sats.toLocaleString();
}

export function Sidebar() {
  const { balanceConfirmed, network, currentView, setView } = useWalletStore();

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: '~' },
    { id: 'chat' as const, label: 'Agent', icon: '@' },
    { id: 'transactions' as const, label: 'Transactions', icon: '>' },
    { id: 'reference' as const, label: 'Reference', icon: '?' },
    { id: 'howto' as const, label: 'How To', icon: 'i' },
    { id: 'settings' as const, label: 'Settings', icon: '*' },
  ];

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">BTC Agent App</h1>
        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-mono rounded bg-yellow-600/20 text-yellow-400 uppercase tracking-wide">
          {network}
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              currentView === item.id
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <span className="inline-block w-5 text-center mr-2 font-mono text-xs">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          Balance
        </p>
        <p className="text-lg font-mono text-white">
          {formatSats(balanceConfirmed)}
          <span className="text-xs text-gray-500 ml-1">sats</span>
        </p>
      </div>
    </aside>
  );
}
