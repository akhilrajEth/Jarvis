import { z } from "zod";
import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { FetchUserPositionsSchema } from "./schemas";
import { getPositionsByUserId } from "../utils";
/**
 * Custom Action Provider for fetching liquidity opportunities from supabase db
 */
export class UserPositionsActionProvider extends ActionProvider {
  constructor() {
    super("userPositions", []);
  }

  @CreateAction({
    name: "fetchUserPositions",
    description: `
Retrieves current user positions from Dyanmo database. Each record contains:
    - poolAddress
    - token0Address
    - token1Address
    - token0LiquidityAmount
    - token1LiquidityAmount
    - tokenId
    - token0InitialPrice
    - token1InitialPrice`,
    schema: FetchUserPositionsSchema,
  })
  async fetchOpportunities(): Promise<string> {
    const userId = args.userId;
    console.log(`Currently fetching the user's ${userId} active positions...`);

    const positions = await getPositionsByUserId(userId);

    console.log(`Fetched ${positions.length} positions for user ${userId}`);
    console.log("Positions:", positions);

    return positions;
  }

  supportsNetwork = () => true;
}

export const userPositionsActionProvider = () => new UserPositionsActionProvider();
