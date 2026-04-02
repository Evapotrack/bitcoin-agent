export interface UTXOStatus {
  confirmed: boolean;
  block_height?: number;
}

export interface UTXODisplay {
  txid: string;
  vout: number;
  value: number;
  status: UTXOStatus;
  address: string;
  addressIndex: number;
  label?: string;
}

export interface FeeEstimates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export interface SelectedUtxoInfo {
  txid: string;
  vout: number;
  value: number;
}

export interface BuildPsbtResult {
  psbtBase64: string;
  psbtHex: string;
  fee: number;
  inputCount: number;
  outputCount: number;
  changeAmount: number;
  changeAddress: string;
  destination: string;
  amountSats: number;
  requiresConfirmation: boolean;
  selectedUtxos: SelectedUtxoInfo[];
}

export type PsbtStatus = 'built' | 'signed' | 'broadcast' | 'confirming' | 'confirmed';

export interface PsbtRecord {
  id: string;
  destination: string;
  amountSats: number;
  fee: number;
  status: PsbtStatus;
  txid?: string;
  createdAt: number;
}

// Agent types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolResults?: { tool: string; result: string }[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface UsageRecord {
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

export interface AgentResponse {
  message: string;
  toolResults: { tool: string; input: Record<string, unknown>; result: string }[];
  usage?: TokenUsage;
}

// Add label to UTXO display
