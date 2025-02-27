import { z } from "zod";

/**
 * Input schema for getting the current user allocation towards eth staking/restaking.
 */
export const FetchAllocationSchema = z
  .object({})
  .describe(
    `Retrieves max allocation percent of ETH to stake. If allocation percent is 65% and user has 1 ETH, you only use 0.65 to stake.`,
  );
