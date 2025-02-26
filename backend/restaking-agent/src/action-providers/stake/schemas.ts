import { z } from "zod";

/**
 * Input schema for initiating staking requests via P2P API
 */
export const StakeSchema = z.object({}).describe(`Initiates staking requests via P2P API`);
