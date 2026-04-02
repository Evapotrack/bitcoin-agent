import type {
  UTXODisplay,
  FeeEstimates,
  BuildPsbtResult,
  AgentResponse,
  UsageRecord,
} from './bitcoin';

interface BitcoinAgentAPI {
  // Auth
  hasPassword: () => Promise<boolean>;
  verifyPassword: (password: string) => Promise<boolean>;
  setPassword: (password: string) => Promise<{ success: boolean }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Recovery
  createRecoveryKey: () => Promise<string>;
  getRecoveryKey: (password: string) => Promise<{ success: boolean; recoveryKey?: string; error?: string }>;
  resetWithRecovery: (
    recoveryKey: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Agent
  hasApiKey: () => Promise<boolean>;
  setApiKey: (key: string) => Promise<{ success: boolean }>;
  sendAgentMessage: (message: string) => Promise<AgentResponse>;

  // UTXO Labels
  labelUtxo: (txid: string, vout: number, label: string) => Promise<void>;
  getUtxoLabels: () => Promise<Record<string, string>>;

  // M1 — Wallet
  importXpub: (xpub: string) => Promise<{ success: boolean; error?: string }>;
  getXpub: () => Promise<string | null>;
  getBalance: () => Promise<{ confirmed: number; unconfirmed: number }>;
  getAddresses: (start: number, count: number) => Promise<string[]>;

  // M2 — PSBT
  getUtxos: () => Promise<UTXODisplay[]>;
  getFees: () => Promise<FeeEstimates>;
  buildPsbt: (params: {
    destination: string;
    amountSats: number;
    feeRate: number;
  }) => Promise<BuildPsbtResult>;
  exportPsbtFile: (psbtBase64: string) => Promise<{ success: boolean; filePath?: string }>;
  importSignedPsbt: () => Promise<{ success: boolean; txHex?: string; error?: string }>;
  broadcastTx: (txHex: string) => Promise<{ success: boolean; txid?: string; error?: string }>;
}

declare global {
  interface Window {
    bitcoinAgent: BitcoinAgentAPI;
  }
}

export {};
