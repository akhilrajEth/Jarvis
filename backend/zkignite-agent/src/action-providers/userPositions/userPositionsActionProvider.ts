import { z } from "zod";
import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { FetchUserPositionsSchema } from "./schemas";
import { getPositionsByUserId } from "../utils";
import { Position } from "./types";

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
  async fetchOpportunities(
    wallet: EvmWalletProvider,
    args: z.infer<typeof FetchUserPositionsSchema>,
  ): Promise<string> {
    const userId = args.userId;
    console.log(`Currently fetching the user's ${userId} active positions...`);

    const positions = await getPositionsByUserId(userId);

    console.log(`Fetched ${positions.length} positions for user ${userId}`);

    return this.formatUserPositions(positions);
  }

  private formatUserPositions(positions: Position[]): string {
    const formattedResponse = {
      success: true,
      data: positions.map(position => ({
        userId: position.userId,
        poolAddress: position.poolAddress,
        token0: {
          address: position.token0Address,
          liquidityAmount: position.token0LiquidityAmount,
          initialPrice: position.token0InitialPrice,
        },
        token1: {
          address: position.token1Address,
          liquidityAmount: position.token1LiquidityAmount,
          initialPrice: position.token1InitialPrice,
        },
        tokenId: position.tokenId,
      })),
      timestamp: new Date().toISOString(),
    };

    console.log("Successfully fetched user positions:", formattedResponse);

    return JSON.stringify(formattedResponse, null, 2);
  }

  supportsNetwork = () => true;
}

export const userPositionsActionProvider = () => new UserPositionsActionProvider();
