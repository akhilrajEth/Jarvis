interface PoolDayDataItem {
  feesUSD: string;
}

interface TokenDetails {
  id: string;
  symbol: string;
}

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

export interface UniswapV3PoolData {
  feeTier: string;
  feesUSD: string;
  id: string;
  poolDayData: PoolDayDataItem[];
  token0: TokenDetails;
  token1: TokenDetails;
  totalValueLockedUSD: string;
  volumeUSD: string;
}

export interface UniswapV3SubgraphResponse {
  data: {
    pools: UniswapV3PoolData[];
  };
}
