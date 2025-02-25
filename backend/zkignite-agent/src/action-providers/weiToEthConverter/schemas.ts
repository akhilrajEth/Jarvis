import { z } from "zod";

export const WeiToEthConverterSchema = z
  .object({
    weiAmount: z
      .string()
      .regex(/^\d+$/, "Must be non-negative integer in string format")
      .describe("The quantity of wei to convert to ETH (1 ETH = 10^18 wei)"),
  })
  .describe("Schema for converting wei amounts to amounts in eth conversion");
