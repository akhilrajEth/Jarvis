import { z } from "zod";
import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { FetchBalanceSchema } from "./schemas";
import { supabase } from "../supabaseClient";
import { ethers } from "ethers";

/**
 * Custom Action Provider for fetching allocation amount for lp pools from supabase db
 */
export class CheckNativeEthBalanceActionProvider extends ActionProvider {
  constructor() {
    super("balance", []);
  }

  @CreateAction({
    name: "fetchEthBalance",
    description: `Fetches ETH balance of agent's wallet on Holesky testnet`,
    schema: FetchBalanceSchema,
  })
  async fetchEthBalance(wallet: EvmWalletProvider): Promise<string> {
    console.log("FETCH ETH BALANCE CALLED");
    try {
      const HOLESKY_RPC_URL = "https://holesky.drpc.org";
      const holeskyProvider = new ethers.JsonRpcProvider(HOLESKY_RPC_URL);

      const address = wallet.getAddress();

      console.log("ADDRESS:", address);
      const balanceWei = await holeskyProvider.getBalance(address);

      console.log("BALANCE IN WEI:", balanceWei);

      console.log(
        JSON.stringify({
          success: true,
          data: {
            address,
            balance: balanceWei,
            network: "holesky",
            unit: "ETH",
          },
          timestamp: new Date().toISOString(),
        }),
      );
      return JSON.stringify({
        success: true,
        data: {
          address,
          balance: balanceWei,
          network: "holesky",
          unit: "ETH",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return error;
    }
  }

  supportsNetwork = () => true;
}

export const checkNativeEthBalanceActionProvider = () => new CheckNativeEthBalanceActionProvider();
