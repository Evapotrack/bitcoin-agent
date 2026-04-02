import axios from 'axios';
import { MEMPOOL_BASE, NetworkType } from './config';

export interface FeeEstimates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export async function fetchFeeEstimates(
  networkType: NetworkType
): Promise<FeeEstimates> {
  const baseUrl = MEMPOOL_BASE[networkType];
  const { data } = await axios.get<FeeEstimates>(
    `${baseUrl}/v1/fees/recommended`
  );
  return data;
}
