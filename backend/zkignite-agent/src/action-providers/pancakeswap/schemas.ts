import { z } from "zod";

/**
 * Input schema for Pancakeswap create LP position action.
 */
export const CreatePositionSchema = z
  .object({
    poolAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .describe("The address of the Pancakeswap LP pool to create a position in"),
    amount0Desired: z
      .string()
      .regex(/^\d+\.?\d*$|^\.\d+$/, "Must be valid decimal format")
      .describe("The quantity of assets to add to the LP pool, in whole units"),
    amount1Desired: z
      .string()
      .regex(/^\d+\.?\d*$|^\.\d+$/, "Must be valid decimal format")
      .describe("The quantity of assets to add to the LP pool, in whole units"),
  })
  .describe("Input schema for Pancakeswap create LP position action");

/**
 * Input schema for retrieving Token IDs for Pancakeswap LP positions action.
 */
export const GetTokenIdsSchema = z
  .object({
    userAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .describe("The address that owns the LP positions in the Pancakeswap pool"),
  })
  .describe("Input schema for retrieving Token IDs for Pancakeswap LP positions action");

/**
 * Input schema for removing liquidity for a specific Pancakeswap LP position action.
 */
export const RemoveLiquiditySchema = z
  .object({
    tokenId: z
      .string()
      .regex(/^[0-9]+$/, "Token ID must be numeric characters only (e.g. '340250')")
      .describe("The NFT token ID representing the Syncswap liquidity position to remove"),
    userId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        "Invalid user id format",
      )
      .describe("The user's id in the supabase and dynamo db tables"),
  })
  .describe("Input schema for removing liquidity from a Pancakeswap LP position");
