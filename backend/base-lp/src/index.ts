import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { Pool, UniswapV3PoolData, UniswapV3SubgraphResponse } from "./types";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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
      poolAddress: poolData.id,
      totalAPR,
      token0Address: poolData.token0.id,
      token1Address: poolData.token1.id,
      feeTier,
      feesUSD,
      totalValueLockedUSD,
      volumeUSD,
    };
  });

  return poolsWithAPRs;
}

async function savePoolsToSupabase(pools: Pool[]): Promise<void> {
  try {
    for (const pool of pools) {
      const { error } = await supabase.from("base_uniswapv3_opps").upsert({
        pool_address: pool.poolAddress,
        data: pool,
      });

      if (error) {
        console.error(`Error inserting/updating pool ${pool.poolAddress}:`, error.message);
      } else {
        console.log(`Successfully inserted/updated pool ${pool.poolAddress}`);
      }
    }
  } catch (error) {
    console.error("Error saving pools to Supabase:", error);
  }
}

// To-Do: Remove this section once testing is complete
(async () => {
  try {
    const poolsWithAPRs = await calculateAPRs();

    // Note: Sorting by decending order
    const sortedPools = poolsWithAPRs.sort((a, b) => b.totalAPR - a.totalAPR);

    console.log("Pools with APRs (sorted by descending totalAPR):", sortedPools);

    await savePoolsToSupabase(sortedPools);
  } catch (error) {
    console.error("Error calculating APRs:", error);
  }
})();
