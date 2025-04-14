import { z } from "zod";
import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { createClient } from "@supabase/supabase-js";
import { FetchOpportunitiesSchema } from "./schemas";
import { Pool } from "./types";
import { supabase } from "../supabaseClient";

/**
 * Custom Action Provider for fetching LP opportunities from supabase db
 */
export class OpportunitiesActionProvider extends ActionProvider {
  constructor() {
    super("opportunities", []);
  }

  @CreateAction({
    name: "fetchOpportunities",
    description: `
Retrieves current liquidity pool opportunities from Supabase database
- Protocols: Uniswap
- Returns: Token pairs, pool addresse, total apr, TVL, volume, and fees for each UniswapV3 pool on Base
`,
    schema: FetchOpportunitiesSchema,
  })
  async fetchOpportunities(): Promise<string> {
    console.log("Currently fetching opportunities...");
    try {
      const { data, error } = await supabase.from("base_uniswapv3_opps").select(`
        data->poolAddress,
        data->totalAPR,
        data->token0Address,
        data->token1Address,
        data->volumeUSD,
        data->totalValueLockedUSD,
        data->feeTier,
        data->feesUSD
      `);

      if (error) {
        console.error("Error fetching data from Supabase:", error.message);
      }

      if (!data || data.length === 0) {
        console.log("No pools found in base_uniswapv3_opps table.");
      }

      console.log(`Fetched ${data.length} pools from Supabase.`);

      return this.formatSuccess(data);
    } catch (error: Error) {
      return this.formatError(error);
    }
  }

  private formatSuccess(pools: Pool[]): string {
    const successResponse = {
      success: true,
      data: pools.map(pool => ({
        poolAddress: pool.poolAddress,
        totalAPR: pool.totalAPR,
        token0: pool.token0Address,
        token1: pool.token1Address,
        volumeUSD: pool.volumeUSD,
        totalValueLockedUSD: pool.totalValueLockedUSD,
      })),
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(successResponse, null, 2);
  }

  private formatError(error: Error): string {
    const errorResponse = {
      success: false,
      error: {
        message: error.message,
        type: "OPPORTUNITIES_FETCH_ERROR",
        details: [],
      },
    };

    return JSON.stringify(errorResponse, null, 2);
  }

  supportsNetwork = () => true;
}

export const opportunitiesActionProvider = () => new OpportunitiesActionProvider();
