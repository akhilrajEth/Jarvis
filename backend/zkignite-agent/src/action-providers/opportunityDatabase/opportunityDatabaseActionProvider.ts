import { z } from "zod";
import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { createClient } from "@supabase/supabase-js";
import { FetchOpportunitiesSchema } from "./schemas";
import { OpportunityRecord } from "./types";
import { ethers } from "ethers";
import { POOL_ABI } from "./constants";
import { supabase } from "../supabaseClient";

/**
 * Custom Action Provider for fetching liquidity opportunities from supabase db
 */
export class OpportunitiesActionProvider extends ActionProvider {
  constructor() {
    super("opportunities", []);
  }

  @CreateAction({
    name: "fetchOpportunities",
    description: `
Retrieves current liquidity pool opportunities from Supabase database
- Protocols: SyncSwap and PancakeSwap
- Returns: Token pairs, pool addresses, APRs, and the tokenId of the active position
- Filters: Active opportunities only`,
    schema: FetchOpportunitiesSchema,
  })
  async fetchOpportunities(): Promise<string> {
    console.log("Currently fetching opportunities...");
    try {
      const { data, error } = await supabase
        .from("agent_subscription_data")
        .select("opportunity_id, subscription_data, active_positions, subscription_data_hash")
        .or("subscription_data->>protocol.eq.PancakeSwap,subscription_data->>protocol.eq.SyncSwap");

      if (error) throw error;

      //CHECK AGENT INGESTED DATA INTEGRITY
      async function hashData(data: string): Promise<string> {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      }

      for (const record of data) {
        const calculatedHash = await hashData(JSON.stringify(record.subscription_data));
        if (calculatedHash !== record.subscription_data_hash) {
          console.error(`Data integrity check failed for opportunity_id: ${record.opportunity_id}`);
        }
      }

      // Process records and validate that token addresses are in the correct order
      const validatedRecords = await Promise.all(
        data?.map(async ({ opportunity_id, subscription_data, active_positions }) => {
          try {
            // Fetch current pool tokens from pool contract
            const currentTokens = await this.getPoolTokens(subscription_data.poolAddress);

            // Create updated subscription data copy
            const updatedSubscription = { ...subscription_data };

            // Validate and update token addresses if there's a mismatch
            if (updatedSubscription.token0Address !== currentTokens.token0) {
              updatedSubscription.token0Address = currentTokens.token0;
            }

            if (updatedSubscription.token1Address !== currentTokens.token1) {
              updatedSubscription.token1Address = currentTokens.token1;
            }

            return {
              opportunity_id,
              ...updatedSubscription,
              active_positions: active_positions || "",
              protocol: updatedSubscription.protocol as "PancakeSwap" | "SyncSwap",
            };
          } catch (error) {
            console.error(`Error processing pool ${subscription_data.poolAddress}:`, error);
            return null;
          }
        }) || [],
      );

      const records = validatedRecords.filter(Boolean) as OpportunityRecord[];

      return this.formatSuccess(records);
    } catch (error: any) {
      return this.formatError(error);
    }
  }

  private formatSuccess(records: OpportunityRecord[]): string {
    return JSON.stringify(
      {
        success: true,
        data: records.map(record => ({
          protocol: record.protocol,
          poolAddress: record.poolAddress,
          active_positions: record.active_positions,
          apr: parseFloat(record.totalAPR.replace("%", "")),
          token0: record.token0Address,
          token1: record.token1Address,
        })),
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  private formatError(error: Error): string {
    return JSON.stringify(
      {
        success: false,
        error: {
          message: error.message,
          type: "OPPORTUNITIES_FETCH_ERROR",
          details: [],
        },
      },
      null,
      2,
    );
  }

  private async getPoolTokens(poolAddress: string) {
    const provider = new ethers.JsonRpcProvider("https://mainnet.era.zksync.io");

    const pool = new ethers.Contract(poolAddress as `0x${string}`, POOL_ABI, provider);

    const [token0, token1] = await Promise.all([pool.token0(), pool.token1()]);

    return {
      token0: token0 as string,
      token1: token1 as string,
    };
  }

  supportsNetwork = () => true;
}

export const opportunitiesActionProvider = () => new OpportunitiesActionProvider();
