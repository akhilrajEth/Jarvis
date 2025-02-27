import { z } from "zod";
import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { FetchAllocationSchema } from "./schemas";
import { supabase } from "../supabaseClient";

/**
 * Custom Action Provider for fetching allocation amount for lp pools from supabase db
 */
export class AllocationCalculatorActionProvider extends ActionProvider {
  constructor() {
    super("opportunities", []);
  }

  @CreateAction({
    name: "fetchAllocationAmount",
    description: `Retrieves max allocation percent of ETH to liquidity pools. If allocation percent is 65% and user has 1 ETH, you only use 0.65 to deposit to the chosen LP Pool.`,
    schema: FetchAllocationSchema,
  })
  async fetchAllocationAmount(): Promise<string> {
    console.log("Fetching max allocation for LP pools...");
    try {
      // Fetch LP value from verified_risk_profile table
      const { data, error } = await supabase
        .from("verified_risk_profile")
        .select("lp")
        .eq("id", 2)
        .single();

      if (error) throw error;

      // Convert numeric value to percentage string
      const lpPercentage = `${data.lp}%`;
      const resultMessage = `max eth allocation is ${lpPercentage}`;

      console.log(resultMessage);
      return resultMessage;
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

  supportsNetwork = () => true;
}

export const allocationCalculatorActionProvider = () => new AllocationCalculatorActionProvider();
