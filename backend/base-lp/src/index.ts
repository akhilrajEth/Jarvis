import axios from "axios";
import { Pool, UniswapV3PoolData, UniswapV3SubgraphResponse } from "./types";

async function getUniswapV3Pools(): Promise<UniswapV3PoolData[]> {
  const API_KEY = "5db37e23ce820eb4087f65bc3d79438c";
  const SUBGRAPH_URL = `https://gateway.thegraph.com/api/${API_KEY}/subgraphs/id/HMuAwufqZ1YCRmzL2SfHTVkzZovC9VL2UAKhjvRqKiR1`;

  const QUERY = `
  {
    pools(orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      feeTier
      totalValueLockedUSD
      volumeUSD
      token1 {
        symbol
        id
      }
      token0 {
        symbol
        id
      }
      poolDayData(first: 7, orderBy: date, orderDirection: desc) {
        feesUSD
      }
      feesUSD
    }
  }
`;

  try {
    const response = await axios.post<UniswapV3SubgraphResponse>(SUBGRAPH_URL, {
      query: QUERY,
    });

    const pools = response.data.data.pools;

    if (!pools || pools.length === 0) {
      console.error("No pools found");
      return [];
    }

    return pools;
  } catch (error) {
    console.error("Error fetching Uniswap V3 pools:", error);
    return [];
  }
}

async function calculateAPRs(): Promise<Pool[]> {
  const uniswapPools = await getUniswapV3Pools();

  console.log("Number of uniswap pools fetched from subgraph:", uniswapPools.length);

  if (!uniswapPools || uniswapPools.length === 0) {
    console.error("No pools data available for APR calculation.");
    return [];
  }

  // Convert Uniswap V3 pool data into Pool objects with calculated APRs
  const poolsWithAPRs = uniswapPools.map(poolData => {
    const feeTier = parseFloat(poolData.feeTier);
    const totalValueLockedUSD = parseFloat(poolData.totalValueLockedUSD);
    const volumeUSD = parseFloat(poolData.volumeUSD);
    const feesUSD = parseFloat(poolData.feesUSD);

    // Calc the avg daily fees over last week
    const weeklyFees = poolData.poolDayData.reduce((sum, day) => sum + parseFloat(day.feesUSD), 0);
    const averageDailyFees = weeklyFees / (poolData.poolDayData.length || 1);

    // Note: APR = (365 * averageDailyFees / totalValueLockedUSD) * 100
    const totalAPR =
      totalValueLockedUSD > 0 ? ((365 * averageDailyFees) / totalValueLockedUSD) * 100 : 0;

    return {
      id: poolData.id,
      feeTier,
      feesUSD,
      token0: poolData.token0,
      token1: poolData.token1,
      totalValueLockedUSD,
      volumeUSD,
      totalAPR,
    };
  });

  return poolsWithAPRs;
}

// To-Do: Remove this section once testing is complete
(async () => {
  try {
    const poolsWithAPRs = await calculateAPRs();

    // Note: Sorting by decending order
    const sortedPools = poolsWithAPRs.sort((a, b) => b.totalAPR - a.totalAPR);

    console.log("Pools with APRs (sorted by descending totalAPR):", sortedPools);
  } catch (error) {
    console.error("Error calculating APRs:", error);
  }
})();
