import { z } from "zod";

/**
 * Input schema for getting the current LP SyncSwap and PancakeSwap opportunities from the Supabase database, along with their token addresses, pool addresses, and total APRs.
 */
export const FetchOpportunitiesSchema = z.object({}).describe(
  `Retrieves current liquidity pool opportunities from Supabase
    - Protocols: SyncSwap and PancakeSwap
    - Included Data:
      • Token pair addresses (token0/token1)
      • Pool contract addresses
      • TokenId of the active position
      • Calculated APRs
    - Source: Supabase database table 'agent_subscriptions'
    - Filter: Only returns active opportunities from specified protocols`,
);
