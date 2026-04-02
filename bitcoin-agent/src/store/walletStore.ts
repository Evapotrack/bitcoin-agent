import { create } from 'zustand';
import type {
  UTXODisplay,
  FeeEstimates,
  BuildPsbtResult,
  PsbtRecord,
  PsbtStatus,
} from '../types/bitcoin';

type View = 'dashboard' | 'send' | 'transactions' | 'reference' | 'howto';

interface WalletState {
  // M1
  xpub: string | null;
  isLoading: boolean;
  error: string | null;
  balanceConfirmed: number;
  balanceUnconfirmed: number;
  network: 'testnet' | 'mainnet';
  currentView: View;

  // M2
  utxos: UTXODisplay[];
  feeEstimates: FeeEstimates | null;
  currentPsbt: BuildPsbtResult | null;
  signedTxHex: string | null;
  psbtHistory: PsbtRecord[];

  // M1 Actions
  importXpub: (xpub: string) => Promise<void>;
  loadExistingWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  setView: (view: View) => void;
  clearWallet: () => void;

  // M2 Actions
  fetchUtxos: () => Promise<void>;
  fetchFees: () => Promise<void>;
  buildPsbt: (
    destination: string,
    amountSats: number,
    feeRate: number
  ) => Promise<void>;
  exportPsbtFile: () => Promise<{ success: boolean; filePath?: string }>;
  importSignedPsbt: () => Promise<void>;
  broadcastTx: () => Promise<void>;
  clearCurrentPsbt: () => void;
}

let nextPsbtId = 1;

export const useWalletStore = create<WalletState>((set, get) => ({
  // M1 State
  xpub: null,
  isLoading: false,
  error: null,
  balanceConfirmed: 0,
  balanceUnconfirmed: 0,
  network: 'testnet',
  currentView: 'dashboard',

  // M2 State
  utxos: [],
  feeEstimates: null,
  currentPsbt: null,
  signedTxHex: null,
  psbtHistory: [],

  // M1 Actions
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
      set({ isLoading: false, error: (err as Error).message });
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
      set({ isLoading: false, error: (err as Error).message });
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

  // M2 Actions
  fetchUtxos: async () => {
    try {
      const utxos = await window.bitcoinAgent.getUtxos();
      set({ utxos });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchFees: async () => {
    try {
      const feeEstimates = await window.bitcoinAgent.getFees();
      set({ feeEstimates });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  buildPsbt: async (
    destination: string,
    amountSats: number,
    feeRate: number
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.bitcoinAgent.buildPsbt({
        destination,
        amountSats,
        feeRate,
      });
      const record: PsbtRecord = {
        id: String(nextPsbtId++),
        destination,
        amountSats,
        fee: result.fee,
        status: 'built',
        createdAt: Date.now(),
      };
      set((state) => ({
        currentPsbt: result,
        psbtHistory: [record, ...state.psbtHistory],
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  exportPsbtFile: async () => {
    const { currentPsbt } = get();
    if (!currentPsbt) return { success: false };
    return window.bitcoinAgent.exportPsbtFile(currentPsbt.psbtBase64);
  },

  importSignedPsbt: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.bitcoinAgent.importSignedPsbt();
      if (!result.success) {
        set({
          isLoading: false,
          error: result.error || 'Failed to import signed PSBT',
        });
        return;
      }
      // Update the latest PSBT record to 'signed'
      set((state) => ({
        signedTxHex: result.txHex || null,
        psbtHistory: state.psbtHistory.map((r, i) =>
          i === 0 && r.status === 'built' ? { ...r, status: 'signed' as PsbtStatus } : r
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  broadcastTx: async () => {
    const { signedTxHex } = get();
    if (!signedTxHex) {
      set({ error: 'No signed transaction to broadcast' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const result = await window.bitcoinAgent.broadcastTx(signedTxHex);
      if (!result.success) {
        set({
          isLoading: false,
          error: result.error || 'Broadcast failed',
        });
        return;
      }
      set((state) => ({
        psbtHistory: state.psbtHistory.map((r, i) =>
          i === 0 && r.status === 'signed'
            ? { ...r, status: 'broadcast' as PsbtStatus, txid: result.txid }
            : r
        ),
        currentPsbt: null,
        signedTxHex: null,
        isLoading: false,
      }));
      // Refresh balance after broadcast
      get().refreshBalance();
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  clearCurrentPsbt: () =>
    set({ currentPsbt: null, signedTxHex: null, error: null }),
}));
