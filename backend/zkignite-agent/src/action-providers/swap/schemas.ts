import { z } from "zod";

/**
 * Input schema for Kyberswap token swap action
 */
export const ExecuteSwapSchema = z
  .object({
    tokenIn: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address format")
      .describe("Input token contract address"),
    tokenOut: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address format")
      .describe("Output token contract address"),
    amountIn: z
      .string()
      .regex(/^\d+\.?\d*$|^\.\d+$/, "Must be valid decimal format")
      .describe("Amount of input token to swap in whole units"),
  })
  .describe("Input schema for Kyberswap token swap action");
