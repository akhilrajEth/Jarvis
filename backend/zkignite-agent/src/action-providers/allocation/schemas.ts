import { z } from "zod";

/**
 * Input schema for getting the current eth allocation towards SyncSwap and PancakeSwap opportunities.
 */
export const FetchAllocationSchema = z
  .object({})
  .describe(
    `Retrieves max allocation percent of ETH to liquidity pools. If allocation percent is 65% and user has 1 ETH, you only use 0.65 to deposit to the chosen LP Pool.`,
  );
