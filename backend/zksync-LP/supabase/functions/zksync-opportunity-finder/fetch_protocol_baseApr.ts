import axios from "https://deno.land/x/axiod@0.26.2/mod.ts";
import {
  PancakePoolData,
  PancakeSubgraphResponse,
  KoiPoolData,
  KoiSubgraphResponse,
  APRResult,
  MaverickPoolData,
  SyncSwapSubgraphResponse,
} from "./types.ts";
import { getPoolFee } from "./fetch_pool_fee.ts";

export async function getPancakeSwapAPR(
  poolAddresses: string[]
): Promise<APRResult> {
  // Convert all pool addresses to lowercase for comparison
  const lowercasedPoolAddresses = poolAddresses.map((address) =>
    address.toLowerCase()
  );

  const SUBGRAPH_URL =
    "https://api.studio.thegraph.com/query/45376/exchange-v3-zksync/version/latest";

  const query = `
    {
      pools(first:1000) {
        feeTier
        totalValueLockedUSD
        feesUSD
        poolDayData(first: 7, orderBy: date, orderDirection: desc) {
          feesUSD
        }
        id
      }
    }
  `;

  try {
    const response = await axios.post<PancakeSubgraphResponse>(SUBGRAPH_URL, {
      query,
    });

    const pools = response.data.data.pools;

    if (!pools || pools.length === 0) {
      console.error("No Pancake Swap pools found");
      return {};
    }

    // Filter pools based on the provided pool addresses
    const filteredPools = pools.filter((pool) =>
      lowercasedPoolAddresses.includes(pool.id)
    );

    const poolAPRs: APRResult = {};

    filteredPools.forEach((pool: PancakePoolData) => {
      const weeklyFees = pool.poolDayData.reduce(
        (acc, day) => acc + parseFloat(day.feesUSD),
        0
      );

      const annualFees = weeklyFees * 52;
      const tvlUSD = parseFloat(pool.totalValueLockedUSD);

      const feeAPR = tvlUSD > 0 ? (annualFees / tvlUSD) * 100 : 0;

      poolAPRs[pool.id] = feeAPR;
    });

    return poolAPRs;
  } catch (error) {
    console.error(
      "Error fetching APR:",
      error instanceof Error ? error.message : error
    );
    return {};
  }
}

export async function getKoiFinanceAPR(
  poolAddresses: string[]
): Promise<APRResult> {
  const api_key = "5db37e23ce820eb4087f65bc3d79438c";
  const SUBGRAPH_URL = `https://gateway.thegraph.com/api/${api_key}/subgraphs/id/3gLgwpvmNybVfKeVLKcFLnpLvbtiwTQ4rLceVP7gWcjT`;

  const lowercasedPoolAddresses = poolAddresses.map((address) =>
    address.toLowerCase()
  );

  const query = `
    {
      pools(first: 1000) {
        totalValueLockedUSD
        poolHourData(
          first: 168
          orderBy: periodStartUnix
          orderDirection: desc
        ) {
          feesUSD
        }
        id
      }
    }
  `;

  try {
    const response = await axios.post<KoiSubgraphResponse>(SUBGRAPH_URL, {
      query,
    });
    const pools = response.data.data.pools;

    if (!pools || pools.length === 0) {
      console.error("No Koi pools found");
      return {};
    }

    //Only keep Koi Pools which have ZkIgnite opportunities
    const filteredPools = pools.filter((pool) =>
      lowercasedPoolAddresses.includes(pool.id)
    );

    const poolAPRs: APRResult = {};

    filteredPools.forEach((pool: KoiPoolData) => {
      // Calculate weekly fees from 168 hours data (7 days)
      const weeklyFees = pool.poolHourData.reduce(
        (acc, hour) => acc + parseFloat(hour.feesUSD),
        0
      );

      const annualFees = weeklyFees * 52;
      const tvlUSD = parseFloat(pool.totalValueLockedUSD);

      const feeAPR = tvlUSD > 0 ? (annualFees / tvlUSD) * 100 : 0;

      poolAPRs[pool.id] = feeAPR;
    });
    return poolAPRs;
  } catch (error) {
    console.error(
      "Koi APR error:",
      error instanceof Error ? error.message : error
    );
  }

  return {}
}

export async function getSyncSwapAPR(addresses: string[]): Promise<APRResult> {
  const api_key = "1b27686c313fa4b973fc53fe1a8f9819";
  const SUBGRAPH_URL = `https://gateway.thegraph.com/api/${api_key}/subgraphs/id/6pXVWtpsLXMLAyS7UU49ftu38MCSVh5fqVoSWLiLBkmP`;

  const lowercasedPoolAddresses = addresses.map((address) =>
    address.toLowerCase()
  );

  const query = `
    {
      pools(first: 1000) {
        totalValueLockedUSD
        poolHourData(
          first: 168
          orderBy: periodStartUnix
          orderDirection: desc
        ) {
          feesUSD
        }
        id
      }
    }
  `;

  try {
    const response = await axios.post<SyncSwapSubgraphResponse>(SUBGRAPH_URL, {
      query,
    });
    const pools = response.data.data.pools;

    if (!pools || pools.length === 0) {
      console.error("No SyncSwap pools found");
      return {};
    }

    //Only keep SyncSwap Pools which have ZkIgnite opportunities
    const filteredPools = pools.filter((pool) =>
      lowercasedPoolAddresses.includes(pool.id)
    );

    const poolAPRs: APRResult = {};

    filteredPools.forEach((pool: KoiPoolData) => {
      // Calculate weekly fees from 168 hours data (7 days)
      const weeklyFees = pool.poolHourData.reduce(
        (acc, hour) => acc + parseFloat(hour.feesUSD),
        0
      );

      const annualFees = weeklyFees * 52;
      const tvlUSD = parseFloat(pool.totalValueLockedUSD);

      const feeAPR = tvlUSD > 0 ? (annualFees / tvlUSD) * 100 : 0;

      poolAPRs[pool.id] = feeAPR;
    });
    return poolAPRs;
  } catch (error) {
    console.error(
      "SyncSwap APR error:",
      error instanceof Error ? error.message : error
    );
  }

  return {}
}

export async function getMaverickAPR(poolPairMap: {
  [key: string]: string;
}): Promise<APRResult> {
  const DAYS_IN_YEAR = 365;

  async function getTokenPrice(address: string): Promise<number> {
    const baseUrl = "https://api.geckoterminal.com/api/v2";
    const network = "zksync";
    const endpoint = `/simple/networks/${network}/token_price/${address}`;

    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const priceValue = Object.values(data.data.attributes.token_prices)[0];
      return typeof priceValue === 'string' ? parseFloat(priceValue) : 0;
    } catch (error) {
      console.error("Error fetching token price:", error);
      throw error;
    }
  }

  async function calculatePoolAPR(poolData: MaverickPoolData): Promise<number> {
    const baseTokenPriceInUSD = await getTokenPrice(poolData.base_currency);
    const dailyVolumeUSD = poolData.base_volume * baseTokenPriceInUSD;
    const feeTier = await getPoolFee(poolData.pool_id);
    const dailyFees = dailyVolumeUSD * (feeTier / 100);
    const annualizedFees = dailyFees * DAYS_IN_YEAR;
    const apr = (annualizedFees / poolData.liquidity_in_usd) * 100;
    return Math.round(apr * 100) / 100;
  }

  try {
    const apiBaseUrl = "https://v2-api.mav.xyz";
    const response = await axios.get(`${apiBaseUrl}/api/latest/tickers`, {
      params: { chainId: "324" },
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid API response format");
    }

    const pairIDs = Object.values(poolPairMap);
    const pairToOpportunityIdMap = Object.entries(poolPairMap).reduce((acc, [opportunityId, pairID]) => {
      acc[pairID] = opportunityId;
      return acc;
    }, {} as { [tickerId: string]: string });

    const validPools = response.data.filter((poolData: MaverickPoolData) =>
      pairIDs.includes(poolData.ticker_id) &&
      poolData.liquidity_in_usd > 0 &&
      poolData.last_price > 0 &&
      poolData.target_volume > 0 &&
      poolData.base_volume > 0
    );

    if (validPools.length === 0) {
      console.log("No valid pools found matching the specified ticker IDs");
      return {};
    }

    const poolAPRs = await Promise.all(
      validPools.map(async (poolData) => {
        const apr = await calculatePoolAPR(poolData);
        const opportunityId = pairToOpportunityIdMap[poolData.ticker_id];
        return { poolAddress: opportunityId, apr };
      })
    );

    const result: APRResult = {};
    poolAPRs.forEach((poolData) => {
      if (poolData.apr > 0 && poolData.poolAddress) {
        result[poolData.poolAddress] = poolData.apr;
      }
    });
    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to calculate APRs: ${error.message}`);
    }
    throw error;
  }
}

