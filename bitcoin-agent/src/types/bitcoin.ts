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
}

export interface FeeEstimates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
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
