import { z } from "zod";
import { formatEther } from "ethers";
import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { WeiToEthConverterSchema } from "./schemas";

/**
 * WeiToEthConverterActionProvider handles unit conversions for Ethereum assets
 */
export class WeiToEthConverterActionProvider extends ActionProvider<EvmWalletProvider> {
  constructor() {
    super("converter", []);
  }

  /**
   * Converts wei amounts to ETH
   */
  @CreateAction({
    name: "convertWeiToEth",
    description: `
    Converts wei amounts to eth units with decimal precision.
    
    Important notes:
    - Input must be in wei as a string
    - Handles values up to 18 decimal places
    - Returns exact decimal representation
    - Does not perform any transactions - read-only conversion
    `,
    schema: WeiToEthConverterSchema,
  })
  async convertWeiToEth(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof WeiToEthConverterSchema>,
  ): Promise<string> {
    try {
      console.log("Converting wei to eth with args:", args);

      const ethValue = formatEther(args.weiAmount);

      console.log("Converted value:", ethValue);
      return ethValue;
    } catch (error) {
      console.log("Error during conversion:", error);
      return `Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  supportsNetwork = (network: Network) => true;
}

export const weiToEthConverterActionProvider = () => new WeiToEthConverterActionProvider();
