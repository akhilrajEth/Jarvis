import { z } from "zod";
import { WrapEthSchema } from "./schemas";
import { encodeFunctionData, Hex } from "viem";

import { WETH_ABI, WETH_ADDRESS } from "./constants";

import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";

/**
 * WethActionProvider is an action provider for WETH.
 */
export class WethActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Constructor for the WethActionProvider.
   */
  constructor() {
    super("weth", []);
  }

  /**
   * Wraps ETH to WETH.
   *
   * @param walletProvider - The wallet provider to use for the action.
   * @param args - The input arguments for the action.
   * @returns A message containing the transaction hash.
   */
  @CreateAction({
    name: "wrap_eth",
    description: `
    This tool can only be used to wrap ETH to WETH.
Do not use this tool for any other purpose, or trading other assets.

Inputs:
- Amount of ETH to wrap.

Important notes:
- The amount is a string and cannot have any decimal points, since the unit of measurement is wei.
- Make sure to use the exact amount provided, and if there's any doubt, check by getting more information before continuing with the action.
- 1 wei = 0.000000000000000001 WETH
- Minimum purchase amount is 100000000000000 wei (0.0000001 WETH)
`,
    schema: WrapEthSchema,
  })
  async wrapEth(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof WrapEthSchema>,
  ): Promise<string> {
    console.log("Currently wrapping eth with the following args", args);
    try {
      const hash = await walletProvider.sendTransaction({
        to: WETH_ADDRESS as Hex,
        data: encodeFunctionData({
          abi: WETH_ABI,
          functionName: "deposit",
        }),
        value: BigInt(args.amountToWrap),
      });

      await walletProvider.waitForTransactionReceipt(hash);

      return `Wrapped ETH with transaction hash: ${hash}`;
    } catch (error) {
      return `Error wrapping ETH: ${error}`;
    }
  }

  supportsNetwork = (network: Network) => true;
}

export const wethActionProvider = () => new WethActionProvider();
