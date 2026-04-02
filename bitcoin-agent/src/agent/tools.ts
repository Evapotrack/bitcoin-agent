import * as bitcoin from 'bitcoinjs-lib';
import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import {
  getDefaultAddresses,
  deriveAddresses,
  fetchBalance,
} from '../bitcoin/wallet';
import { fetchUtxos, stripScriptPubKey } from '../bitcoin/utxo';
import { fetchFeeEstimates } from '../bitcoin/fees';
import { buildPsbt } from '../bitcoin/transactions';
import type { NetworkType } from '../bitcoin/config';

export interface AgentContext {
  xpub: string;
  network: bitcoin.Network;
  networkType: NetworkType;
}

export const TOOL_DEFINITIONS: Tool[] = [
  {
    name: 'get_balance',
    description:
      'Get the current wallet balance in satoshis. Returns confirmed and unconfirmed amounts.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_receive_address',
    description:
      'Generate the next unused BIP84 bech32 receive address. A fresh address is used every time — never reused.',
    input_schema: {
      type: 'object' as const,
      properties: {
        index: {
          type: 'number',
          description: 'Address derivation index. Defaults to 0 if not specified.',
        },
      },
      required: [],
    },
  },
  {
    name: 'estimate_fees',
    description:
      'Get current Bitcoin network fee estimates from mempool.space. Returns fee rates in sat/vB for fast (~10 min), normal (~30 min), and economy (~1 hr) confirmation targets.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_utxos',
    description:
      'List all unspent transaction outputs (UTXOs) in the wallet. Each UTXO shows txid, vout, value in sats, confirmation status, and owning address.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'build_send_psbt',
    description:
      'Build an unsigned PSBT (Partially Signed Bitcoin Transaction) to send sats to a destination address. The PSBT must be signed on the user\'s hardware wallet before broadcast. Always confirm the destination and amount with the user before calling this tool.',
    input_schema: {
      type: 'object' as const,
      properties: {
        destination: {
          type: 'string',
          description: 'The recipient Bitcoin address (bech32 format, e.g. tb1q... for testnet)',
        },
        amount_sats: {
          type: 'number',
          description: 'Amount to send in satoshis',
        },
        fee_rate: {
          type: 'number',
          description: 'Fee rate in sat/vB. Use estimate_fees to get current rates.',
        },
      },
      required: ['destination', 'amount_sats', 'fee_rate'],
    },
  },
  {
    name: 'get_transactions',
    description:
      'Get the recent transaction history showing PSBTs that have been built, signed, or broadcast. Each entry shows destination, amount, fee, status, and txid if broadcast.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

// In-memory address index counter
let nextAddressIndex = 0;

// PSBT history tracked via IPC — agent reports results, renderer store is source of truth

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  context: AgentContext
): Promise<string> {
  switch (toolName) {
    case 'get_balance': {
      const addresses = getDefaultAddresses(context.xpub, context.network);
      const balance = await fetchBalance(addresses, context.networkType);
      return JSON.stringify({
        confirmed: balance.confirmed,
        unconfirmed: balance.unconfirmed,
        total: balance.confirmed + balance.unconfirmed,
        unit: 'sats',
      });
    }

    case 'get_receive_address': {
      const index =
        typeof input.index === 'number' ? input.index : nextAddressIndex++;
      const addresses = deriveAddresses(
        context.xpub,
        context.network,
        index,
        1
      );
      return JSON.stringify({
        address: addresses[0],
        index,
        note: 'Fresh address — share with sender. Do not reuse.',
      });
    }

    case 'estimate_fees': {
      const fees = await fetchFeeEstimates(context.networkType);
      return JSON.stringify({
        fast: `${fees.fastestFee} sat/vB (~10 min)`,
        normal: `${fees.halfHourFee} sat/vB (~30 min)`,
        economy: `${fees.economyFee} sat/vB (~1 hr)`,
        minimum: `${fees.minimumFee} sat/vB`,
      });
    }

    case 'get_utxos': {
      const utxos = await fetchUtxos(
        context.xpub,
        context.network,
        context.networkType
      );
      const display = stripScriptPubKey(utxos);
      if (display.length === 0) {
        return JSON.stringify({ utxos: [], message: 'No UTXOs found.' });
      }
      return JSON.stringify({
        count: display.length,
        total_sats: display.reduce((sum, u) => sum + u.value, 0),
        utxos: display.map((u) => ({
          txid: u.txid.slice(0, 8) + '...',
          vout: u.vout,
          value: u.value,
          confirmed: u.status.confirmed,
          address: u.address.slice(0, 12) + '...',
        })),
      });
    }

    case 'build_send_psbt': {
      const destination = input.destination as string;
      const amountSats = input.amount_sats as number;
      const feeRate = input.fee_rate as number;

      if (!destination || !amountSats || !feeRate) {
        return JSON.stringify({
          error: 'Missing required fields: destination, amount_sats, fee_rate',
        });
      }

      const utxos = await fetchUtxos(
        context.xpub,
        context.network,
        context.networkType
      );

      const result = await buildPsbt({
        destination,
        amountSats,
        feeRate,
        utxos,
        xpub: context.xpub,
        network: context.network,
        networkType: context.networkType,
      });

      return JSON.stringify({
        status: 'PSBT built successfully',
        destination,
        amount: `${amountSats} sats`,
        fee: `${result.fee} sats`,
        change: `${result.changeAmount} sats`,
        inputs: result.inputCount,
        note: 'Export this PSBT and sign it on your hardware wallet. Use the Send view to export the file.',
        psbt_base64_length: result.psbtBase64.length,
      });
    }

    case 'get_transactions': {
      // Transaction history is managed by the renderer store
      // Return a note directing the agent to inform the user
      return JSON.stringify({
        message: 'Transaction history is available in the Transactions tab. Use the sidebar to view past PSBTs and their status.',
      });
    }

    default:
      return JSON.stringify({
        error: `Unknown tool: ${toolName}. Available tools: get_balance, get_receive_address, estimate_fees, get_utxos, build_send_psbt, get_transactions.`,
      });
  }
}
