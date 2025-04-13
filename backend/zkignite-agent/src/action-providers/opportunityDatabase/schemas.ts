import { z } from "zod";

/**
 * Input schema for getting the current Uniswap V3 Base pools and their total APRs from Supabase DB.
 */
export const FetchOpportunitiesSchema = z.object({}).describe(
  `Retrieves current liquidity pool opportunities from Supabase
    - Protocols: UniswapV3
    - Included Data:
      • Token pair addresses (token0/token1)
      • Pool contract addresses
      • Total APRs
      • Total Value Locked (TVL) in USD
      • Volume in USD
      • Fees in USD
    - Source: Supabase database table 'base_uniswapv3_opps'
    - Filter: Only returns active opportunities from specified protocols`,
);
