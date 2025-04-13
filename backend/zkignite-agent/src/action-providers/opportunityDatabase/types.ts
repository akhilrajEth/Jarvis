export interface Pool {
  totalAPR: number;
  feeTier: number;
  feesUSD: number;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  totalValueLockedUSD: number;
  volumeUSD: number;
}
