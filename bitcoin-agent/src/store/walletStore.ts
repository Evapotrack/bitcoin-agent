import { create } from 'zustand';

type View = 'dashboard' | 'reference' | 'howto';

interface WalletState {
  xpub: string | null;
  isLoading: boolean;
  error: string | null;
  balanceConfirmed: number;
  balanceUnconfirmed: number;
  network: 'testnet' | 'mainnet';
  currentView: View;

  importXpub: (xpub: string) => Promise<void>;
  loadExistingWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  setView: (view: View) => void;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  xpub: null,
  isLoading: false,
  error: null,
  balanceConfirmed: 0,
  balanceUnconfirmed: 0,
  network: 'testnet',
  currentView: 'dashboard',

  importXpub: async (xpub: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.bitcoinAgent.importXpub(xpub);
      if (!result.success) {
        set({ isLoading: false, error: result.error || 'Import failed' });
        return;
      }
      set({ xpub });
      await get().refreshBalance();
    } catch (err) {
      set({
        isLoading: false,
        error: (err as Error).message,
      });
    }
  },

  loadExistingWallet: async () => {
    try {
      const xpub = await window.bitcoinAgent.getXpub();
      if (xpub) {
        set({ xpub });
        await get().refreshBalance();
      }
    } catch (err) {
      console.error('Failed to load wallet:', err);
    }
  },

  refreshBalance: async () => {
    set({ isLoading: true, error: null });
    try {
      const balance = await window.bitcoinAgent.getBalance();
      set({
        balanceConfirmed: balance.confirmed,
        balanceUnconfirmed: balance.unconfirmed,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: (err as Error).message,
      });
    }
  },

  setView: (view: View) => set({ currentView: view }),

  clearWallet: () =>
    set({
      xpub: null,
      balanceConfirmed: 0,
      balanceUnconfirmed: 0,
      error: null,
    }),
}));
