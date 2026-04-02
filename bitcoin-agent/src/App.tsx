import { useEffect } from 'react';
import { useWalletStore } from './store/walletStore';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ImportXpubModal } from './components/ImportXpubModal';
import { ReferenceView } from './components/ReferenceView';
import { HowToView } from './components/HowToView';

export function App() {
  const { xpub, currentView, loadExistingWallet } = useWalletStore();

  useEffect(() => {
    loadExistingWallet();
  }, []);

  if (!xpub) {
    return <ImportXpubModal />;
  }

  const renderView = () => {
    switch (currentView) {
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
