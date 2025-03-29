import { z } from "zod";

/**
 * Input schema for fetching a user's active positions.
 */
export const FetchUserPositionsSchema = z
  .object({
    userId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        "Invalid user id format",
      )
      .describe("The user's id in the supabase and dynamo db tables"),
  })
  .describe("Input schema for fetching a user's active positions");
