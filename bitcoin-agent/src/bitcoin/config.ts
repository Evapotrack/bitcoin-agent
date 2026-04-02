export type NetworkType = 'testnet' | 'mainnet';

export const MEMPOOL_BASE: Record<NetworkType, string> = {
  testnet: 'https://mempool.space/testnet/api',
  mainnet: 'https://mempool.space/api',
};

export const GAP_LIMIT = 20;
