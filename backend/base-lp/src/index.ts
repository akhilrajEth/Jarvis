import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { Pool, UniswapV3PoolData, UniswapV3SubgraphResponse } from "./types";
import { QUERY } from "./constants";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
);

async function getUniswapV3Pools(): Promise<UniswapV3PoolData[]> {
  const SUBGRAPH_URL = `https://gateway.thegraph.com/api/${process.env.SUBGRAPH_API_KEY}/subgraphs/id/HMuAwufqZ1YCRmzL2SfHTVkzZovC9VL2UAKhjvRqKiR1`;

  try {
    const response = await axios.post<UniswapV3SubgraphResponse>(SUBGRAPH_URL, {
      query: QUERY,
    });

    console.log("Response from subgraph:", response.data);
    const pools = response.data.data.pools;

    console.log("Number of pools fetched from subgraph:", pools.length);
    console.log("First pool data:", pools[0]);
    console.log("Last pool data:", pools[pools.length - 1]);
    if (!pools || pools.length === 0) {
      console.error("No pools found");
      return [];
    }

    const filteredPools = pools.filter((pool: UniswapV3PoolData) => {
      return (
        pool.feeTier !== null &&
        pool.feesUSD !== null &&
        pool.id !== null &&
        pool.token0 !== null &&
        pool.token1 !== null &&
        pool.totalValueLockedUSD !== null &&
        pool.volumeUSD !== null &&
        pool.poolDayData !== null &&
        pool.poolDayData.length > 0 &&
        parseFloat(pool.totalValueLockedUSD) >= 2500000 &&
        parseFloat(pool.volumeUSD) >= 1000000
      );
    });

    return filteredPools;
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

async function fetchPoolsFromSupabase(): Promise<Pool[]> {
  try {
    const { data, error } = await supabase.from("base_uniswapv3_opps").select(`
        data->poolAddress,
        data->totalAPR,
        data->token0Address,
        data->token1Address,
        data->volumeUSD,
        data->totalValueLockedUSD,
        data->feeTier,
        data->feesUSD
      `);

    if (error) {
      console.error("Error fetching data from Supabase:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("No pools found in base_uniswapv3_opps table.");
      return [];
    }

    console.log(`Fetched ${data.length} pools from Supabase.`);
    return data as Pool[];
  } catch (error) {
    console.error("Unexpected error fetching pools from Supabase:", error);
    return [];
  }
}

// To-Do: Remove this section once testing is complete
(async () => {
  try {
    // Note: Uncomment code below to fetch Uniswap V3 pools and calculate APRs
    const poolsWithAPRs = await calculateAPRs();
    // // Note: Sorting by decending order
    const sortedPools = poolsWithAPRs.sort((a, b) => b.totalAPR - a.totalAPR);
    console.log("Pools with APRs (sorted by descending totalAPR):", sortedPools);
    // await savePoolsToSupabase(sortedPools);
    // Note: Uncomment the following line to fetch pools from Supabase
    // const pools = await fetchPoolsFromSupabase();
    // console.log("Fetched pools from Supabase:", pools);
  } catch (error) {
    console.error("Error calculating APRs:", error);
  }
})();
