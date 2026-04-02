import { useEffect, useState } from 'react';
import { useWalletStore } from './store/walletStore';
import { LockScreen } from './components/LockScreen';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ImportXpubModal } from './components/ImportXpubModal';
import { ReferenceView } from './components/ReferenceView';
import { HowToView } from './components/HowToView';
import { SendView } from './components/SendView';
import { TransactionsView } from './components/TransactionsView';

export function App() {
  const { xpub, currentView, loadExistingWallet } = useWalletStore();
  const [isLocked, setIsLocked] = useState(true);
  const [hasExistingPassword, setHasExistingPassword] = useState<boolean | null>(null);

  useEffect(() => {
    window.bitcoinAgent.hasPassword().then(setHasExistingPassword);
  }, []);

  const handleUnlock = () => {
    setIsLocked(false);
    loadExistingWallet();
  };

  // Loading — checking if password exists
  if (hasExistingPassword === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  // Lock screen
  if (isLocked) {
    return (
      <LockScreen
        hasExistingPassword={hasExistingPassword}
        onUnlock={handleUnlock}
      />
    );
  }

  // No wallet imported yet
  if (!xpub) {
    return <ImportXpubModal />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'send':
        return <SendView />;
      case 'transactions':
        return <TransactionsView />;
      case 'reference':
        return <ReferenceView />;
      case 'howto':
        return <HowToView />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{renderView()}</main>
    </div>
  );
}
