import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import { MEMPOOL_BASE, GAP_LIMIT, NetworkType } from './config';

const bip32 = BIP32Factory(ecc);

export function validateXpub(xpub: string, network: bitcoin.Network): boolean {
  try {
    const node = bip32.fromBase58(xpub, network);
    // Reject if this contains a private key — watch-only only
    if (node.privateKey) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function deriveAddresses(
  xpub: string,
  network: bitcoin.Network,
  start: number,
  count: number
): string[] {
  const node = bip32.fromBase58(xpub, network);
  // xpub/tpub is the account-level key (m/84'/0'/0')
  // External chain is .derive(0), then .derive(index)
  const external = node.derive(0);
  const addresses: string[] = [];
  for (let i = start; i < start + count; i++) {
    const child = external.derive(i);
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(child.publicKey),
      network,
    });
    if (address) {
      addresses.push(address);
    }
  }
  return addresses;
}

interface AddressStats {
  funded_txo_sum: number;
  spent_txo_sum: number;
}

interface AddressResponse {
  chain_stats: AddressStats;
  mempool_stats: AddressStats;
}

export interface BalanceResult {
  confirmed: number;
  unconfirmed: number;
}

async function fetchAddressBalance(
  address: string,
  baseUrl: string
): Promise<BalanceResult> {
  const { data } = await axios.get<AddressResponse>(
    `${baseUrl}/address/${address}`
  );
  const confirmed =
    data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  const unconfirmed =
    data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
  return { confirmed, unconfirmed };
}

export async function fetchBalance(
  addresses: string[],
  networkType: NetworkType
): Promise<BalanceResult> {
  const baseUrl = MEMPOOL_BASE[networkType];
  let totalConfirmed = 0;
  let totalUnconfirmed = 0;

  // Fetch sequentially to avoid rate limiting
  for (const address of addresses) {
    try {
      const balance = await fetchAddressBalance(address, baseUrl);
      totalConfirmed += balance.confirmed;
      totalUnconfirmed += balance.unconfirmed;
    } catch (err) {
      // Skip addresses that fail — may not have any history
      console.error(`Failed to fetch balance for ${address}:`, err);
    }
  }

  return { confirmed: totalConfirmed, unconfirmed: totalUnconfirmed };
}

export function getDefaultAddresses(
  xpub: string,
  network: bitcoin.Network
): string[] {
  return deriveAddresses(xpub, network, 0, GAP_LIMIT);
}
