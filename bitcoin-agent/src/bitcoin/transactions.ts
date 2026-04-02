import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import { MEMPOOL_BASE, NetworkType } from './config';
import { UTXO } from './utxo';

const bip32 = BIP32Factory(ecc);

// RBF-enabled sequence number (BIP 125)
const RBF_SEQUENCE = 0xfffffffd;

export interface BuildPsbtParams {
  destination: string;
  amountSats: number;
  feeRate: number;
  utxos: UTXO[];
  xpub: string;
  network: bitcoin.Network;
  networkType: NetworkType;
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
  selectedUtxos: { txid: string; vout: number; value: number }[];
}

function estimateVsize(inputCount: number, outputCount: number): number {
  // P2WPKH vsize: ~10.5 overhead + 31 per output + 68 per input
  return Math.ceil(10.5 + 31 * outputCount + 68 * inputCount);
}

function selectUtxos(
  utxos: UTXO[],
  targetAmount: number,
  feeRate: number
): { selected: UTXO[]; fee: number; changeAmount: number } {
  // Sort by value descending (largest first)
  const sorted = [...utxos].sort((a, b) => b.value - a.value);

  let selected: UTXO[] = [];
  let totalInput = 0;

  // Two-pass: estimate fee, select inputs, recompute
  for (const utxo of sorted) {
    selected.push(utxo);
    totalInput += utxo.value;

    // 2 outputs: destination + change (may drop to 1 if no change)
    const outputCount = 2;
    const vsize = estimateVsize(selected.length, outputCount);
    const fee = Math.ceil(feeRate * vsize);
    const needed = targetAmount + fee;

    if (totalInput >= needed) {
      const changeAmount = totalInput - targetAmount - fee;
      // If change is dust (< 546 sats for segwit), absorb it into the fee
      if (changeAmount > 0 && changeAmount < 546) {
        const vsizeNoChange = estimateVsize(selected.length, 1);
        const feeNoChange = Math.ceil(feeRate * vsizeNoChange);
        return {
          selected,
          fee: totalInput - targetAmount,
          changeAmount: 0,
        };
      }
      return { selected, fee, changeAmount };
    }
  }

  throw new Error(
    `Insufficient funds. Available: ${totalInput} sats, needed: ${targetAmount} + fees`
  );
}

export async function buildPsbt(
  params: BuildPsbtParams
): Promise<BuildPsbtResult> {
  const { destination, amountSats, feeRate, utxos, xpub, network } = params;

  if (utxos.length === 0) {
    throw new Error('No UTXOs available');
  }

  // Select UTXOs
  const { selected, fee, changeAmount } = selectUtxos(
    utxos,
    amountSats,
    feeRate
  );

  // Derive change address from internal chain (m/84'/0'/0'/1/0)
  const accountNode = bip32.fromBase58(xpub, network);
  const changeChild = accountNode.derive(1).derive(0);
  const changePayment = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(changeChild.publicKey),
    network,
  });
  const changeAddress = changePayment.address!;

  // Build PSBT
  const psbt = new bitcoin.Psbt({ network });

  // Add inputs
  for (const utxo of selected) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: utxo.scriptPubKey,
        value: BigInt(utxo.value),
      },
      sequence: RBF_SEQUENCE,
    });
  }

  // Add destination output
  psbt.addOutput({
    address: destination,
    value: BigInt(amountSats),
  });

  // Add change output if non-dust
  if (changeAmount > 0) {
    psbt.addOutput({
      address: changeAddress,
      value: BigInt(changeAmount),
    });
  }

  const outputCount = changeAmount > 0 ? 2 : 1;

  return {
    psbtBase64: psbt.toBase64(),
    psbtHex: psbt.toHex(),
    fee,
    inputCount: selected.length,
    outputCount,
    changeAmount,
    changeAddress,
    selectedUtxos: selected.map((u) => ({
      txid: u.txid,
      vout: u.vout,
      value: u.value,
    })),
    destination,
    amountSats,
    requiresConfirmation: amountSats > 1_000_000,
  };
}

export function validateSignedPsbt(
  psbtBase64: string,
  network: bitcoin.Network
): { valid: boolean; txHex?: string; error?: string } {
  try {
    const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { network });

    // Check if already finalized (Coldcard does this)
    let alreadyFinalized = false;
    try {
      // If we can extract, it's already finalized
      psbt.extractTransaction();
      alreadyFinalized = true;
    } catch {
      // Not finalized yet — need to validate and finalize
    }

    if (alreadyFinalized) {
      const tx = psbt.extractTransaction();
      return { valid: true, txHex: tx.toHex() };
    }

    // Validate signatures on each input
    for (let i = 0; i < psbt.data.inputs.length; i++) {
      const input = psbt.data.inputs[i];
      if (
        !input.partialSig ||
        input.partialSig.length === 0
      ) {
        return {
          valid: false,
          error: `Input ${i} has no signature. The PSBT may not be signed.`,
        };
      }
    }

    // Finalize all inputs
    psbt.finalizeAllInputs();
    const tx = psbt.extractTransaction();
    return { valid: true, txHex: tx.toHex() };
  } catch (err) {
    return {
      valid: false,
      error: `Invalid PSBT: ${(err as Error).message}`,
    };
  }
}

export async function broadcastTransaction(
  txHex: string,
  networkType: NetworkType
): Promise<string> {
  const baseUrl = MEMPOOL_BASE[networkType];
  const { data } = await axios.post(`${baseUrl}/tx`, txHex, {
    headers: { 'Content-Type': 'text/plain' },
  });
  // mempool.space returns the txid as plain text
  return data as string;
}
