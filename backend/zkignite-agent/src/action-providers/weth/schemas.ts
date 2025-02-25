import { z } from "zod";

export const WrapEthSchema = z
  .object({
    amountToWrap: z.string().describe("Amount of ETH to wrap in units of wei"),
  })
  .strip()
  .describe("Instructions for wrapping ETH to WETH. You can enter the amount in units of wei.");
