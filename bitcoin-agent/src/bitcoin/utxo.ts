import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import { MEMPOOL_BASE, GAP_LIMIT, NetworkType } from './config';

const bip32 = BIP32Factory(ecc);

export interface UTXOStatus {
  confirmed: boolean;
  block_height?: number;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  status: UTXOStatus;
  address: string;
  addressIndex: number;
  scriptPubKey: Buffer;
}

// Renderer-safe version without Buffer
export interface UTXODisplay {
  txid: string;
  vout: number;
  value: number;
  status: UTXOStatus;
  address: string;
  addressIndex: number;
}

interface MempoolUTXO {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
    block_height?: number;
  };
}

export async function fetchUtxos(
  xpub: string,
  network: bitcoin.Network,
  networkType: NetworkType
): Promise<UTXO[]> {
  const baseUrl = MEMPOOL_BASE[networkType];
  const node = bip32.fromBase58(xpub, network);
  const external = node.derive(0);
  const allUtxos: UTXO[] = [];

  for (let i = 0; i < GAP_LIMIT; i++) {
    const child = external.derive(i);
    const payment = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(child.publicKey),
      network,
    });
    const address = payment.address!;
    const scriptPubKey = Buffer.from(payment.output!);

    try {
      const { data } = await axios.get<MempoolUTXO[]>(
        `${baseUrl}/address/${address}/utxo`
      );
      for (const utxo of data) {
        allUtxos.push({
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.value,
          status: utxo.status,
          address,
          addressIndex: i,
          scriptPubKey,
        });
      }
    } catch (err) {
      console.error(`Failed to fetch UTXOs for ${address}:`, err);
    }
  }

  return allUtxos;
}

export function stripScriptPubKey(utxos: UTXO[]): UTXODisplay[] {
  return utxos.map(({ scriptPubKey, ...rest }) => rest);
}
