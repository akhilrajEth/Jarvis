import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";
import { supabase } from "./supabaseClient";
import { ActivePositionDetails, PositionData } from "./types";
import { PANCAKE_POSITION_MANAGER, SYNC_POSITION_MANAGER } from "./constants";

export async function getStakedEthPositionData(): Promise<number | null> {
  const { data, error } = await supabase
    .from("user_staked_eth")
    .select("staked_amount")
    .limit(1);

  if (error) {
    console.error("Error fetching staked ETH:", error);
    return null;
  }

  return data?.[0]?.staked_amount ?? null;
}

export async function getActivePositionData(): Promise<
  ActivePositionDetails[]
> {
  const supabaseUrl = "https://nibfafwhlabdjvkzpvuv.supabase.co";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYmZhZndobGFiZGp2a3pwdnV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ5MDk3NTUsImV4cCI6MjAyMDQ4NTc1NX0.jWvB1p6VVEgG0sqjjsbL9EXNZpSWZfaAqA3uMCKx5AU";

  const supabase = createClient(supabaseUrl, supabaseKey);

  //  Get active positions with opportunity IDs
  const { data: positionsData, error: positionsError } = await supabase
    .from("agent_subscription_data")
    .select("active_positions, opportunity_id")
    .not("active_positions", "is", null);

  if (positionsError) throw positionsError;
  if (!positionsData?.length) return [];

  // Extract unique opportunity IDs
  const opportunityIds = positionsData
    .map((p) => p.opportunity_id)
    .filter((id): id is string => !!id);

  // Get opportunity details
  const { data: opportunitiesData, error: opportunitiesError } = await supabase
    .from("opportunities")
    .select("id, pool_address, name, tvl, total_apr")
    .in("id", opportunityIds);

  if (opportunitiesError) throw opportunitiesError;
  if (!opportunitiesData?.length) return [];

  // Combine data from both queries
  return positionsData
    .filter(
      (position) =>
        opportunitiesData.some((opp) => opp.id === position.opportunity_id) &&
        position.active_positions !== null &&
        position.active_positions.trim() !== ""
    )
    .map((position) => {
      const opportunity = opportunitiesData.find(
        (opp) => opp.id === position.opportunity_id
      )!;

      return {
        active_position_id: position.active_positions!,
        pool_address: opportunity.pool_address,
        name: opportunity.name,
        tvl: String(opportunity.tvl),
        total_apr: String(opportunity.total_apr),
      };
    });
}

export async function getPositionDetails(
  tokenId: string,
  chain: "pancake" | "sync"
): Promise<PositionData> {
  const provider = new ethers.JsonRpcProvider("https://mainnet.era.zksync.io");

  const positionManager = new ethers.Contract(
    chain === "pancake" ? PANCAKE_POSITION_MANAGER : SYNC_POSITION_MANAGER,
    [
      "function positions(uint256) view returns (uint96, address, address, address, uint24, int24, int24, uint128, uint256, uint256, uint128, uint128)",
      "function tokenOfOwnerByIndex(address, uint256) view returns (uint256)",
    ],
    provider
  );

  const position = await positionManager.positions(tokenId);
  const [
    ,
    ,
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    liquidity,
    ,
    ,
    tokensOwed0,
    tokensOwed1,
  ] = position;

  const token0Contract = new ethers.Contract(
    token0,
    ["function decimals() view returns (uint8)"],
    provider
  );

  const token1Contract = new ethers.Contract(
    token1,
    ["function decimals() view returns (uint8)"],
    provider
  );

  const [decimals0, decimals1] = await Promise.all([
    token0Contract.decimals(),
    token1Contract.decimals(),
  ]);

  // Calculate token amounts
  const amount0 = (liquidity * 10n ** BigInt(decimals0)) / 10n ** 18n;
  const amount1 = (liquidity * 10n ** BigInt(decimals1)) / 10n ** 18n;

  return {
    token0Amount: ethers.formatUnits(amount0, decimals0),
    token1Amount: ethers.formatUnits(amount1, decimals1),
    uncollectedFees: {
      token0: ethers.formatUnits(tokensOwed0, decimals0),
      token1: ethers.formatUnits(tokensOwed1, decimals1),
    },
  };
}
