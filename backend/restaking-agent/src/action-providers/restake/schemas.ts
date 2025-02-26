import { z } from "zod";

/**
 * Input schema for initiating restaking requests via P2P API
 */
export const RestakeSchema = z.object({}).describe(`Initiates restaking requests via P2P API`);
