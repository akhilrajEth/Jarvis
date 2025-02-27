import { z } from "zod";

/**
 * Input schema for getting the agent's ETH wallet balance.
 */
export const FetchBalanceSchema = z
  .object({})
  .describe(`Returns the agent's wallet balance of the native token (ETH)`);
