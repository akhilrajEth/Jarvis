// Merkl Related Types

interface Chain {
  id: number;
  name: string;
  icon: string;
}

interface Protocol {
  id: string;
  tags: string[];
  name: string;
  description: string;
  url: string;
  icon: string;
}

interface Record {
  id?: string;
  total: number;
  timestamp: string;
}

interface Token {
  id: string;
  name: string;
  chainId: number;
  address: string; // Ethereum checksum address
  decimals: number;
  icon: string; // URL to token icon or empty string
  verified: boolean;
  isTest: boolean;
  price: number;
  symbol: string;
}

export interface Opportunity {
  chainId: number;
  type: string;
  identifier: string;
  name: string;
  depositUrl: string;
  status: string;
  action: string;
  tvl: number;
  apr: number;
  dailyRewards: number;
  tags: string[];
  id: string;
  tokens: Token[];
  chain: Chain;
  protocol: Protocol;
  aprRecord: Record & {
    cumulated: number;
    breakdowns: any[];
  };
  tvlRecord: Record & {
    breakdowns: any[];
  };
  rewardsRecord: Record & {
    breakdowns: any[];
  };
}

export interface ProtocolOpportunities {
  [key: string]: Opportunity[];
}

export interface EnhancedOpportunity extends Opportunity {
    baseApr: number;
    // totalAPR: number;
}

// APR Calculation Types
export interface PancakePoolData {
  feeTier: string;
  totalValueLockedUSD: string;
  feesUSD: string;
  poolDayData: {
    feesUSD: string;
  }[];
  id: string;
}

export interface PancakeSubgraphResponse {
  data: {
    pools: PancakePoolData[];
  };
}

export interface KoiPoolData {
  totalValueLockedUSD: string;
  poolHourData: {
    feesUSD: string;
  }[];
  id: string;
}

export interface KoiSubgraphResponse {
  data: {
    pools: KoiPoolData[];
  };
}

export interface SyncSwapPoolData {
  totalValueLockedUSD: string;
  poolHourData: {
    feesUSD: string;
  }[];
  id: string;
}

export interface SyncSwapSubgraphResponse {
  data: {
    pools: SyncSwapPoolData[];
  };
}

export interface MaverickPoolData {
  ticker_id: string;
  base_currency: string;
  target_currency: string;
  last_price: number;
  base_volume: number;
  target_volume: number;
  pool_id: string;
  liquidity_in_usd: number;
}

export interface APRResult {
  [poolAddress: string]: number;
}
