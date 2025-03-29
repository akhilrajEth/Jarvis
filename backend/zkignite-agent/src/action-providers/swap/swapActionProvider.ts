import { z } from "zod";
import { encodeFunctionData, parseEther } from "viem";
import axios from "axios";

import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { ExecuteSwapSchema } from "./schemas";

import { approve } from "../utils";
import { URLSearchParams } from "url";

import { API_URL, NATIVE_TOKEN } from "./constants";

/**
 * SwapActionProvider handles token swaps via KyberSwap Aggregator
 */
export class SwapActionProvider extends ActionProvider<EvmWalletProvider> {
  constructor() {
    super("swap", []);
  }

  @CreateAction({
    name: "swap",
    description: `
This tool executes token swaps through KyberSwap on ZKSync network.

Parameters:
- tokenIn: Input token contract address 
- tokenOut: Output token contract address
- amountIn: Amount of input token to swap in whole units
  Examples:
  - 1.5 ETH
  - 100 USDC
  - 0.025 WBTC

Important notes:
- Always use exact token contract addresses
- Native currency amounts should be specified in base units (e.g., 1 ETH not 1000000000000000000 wei)
- Slippage is fixed at 0.5% for transaction safety
- Only supports ZKSync network transactions
`,
    schema: ExecuteSwapSchema,
  })
  async swap(wallet: EvmWalletProvider, args: z.infer<typeof ExecuteSwapSchema>): Promise<string> {
    try {
      console.log("Currently trying to swap tokens with the following args", args);
      const signerAddress = await wallet.getAddress();

      const parsedAmountIn = parseEther(args.amountIn).toString();

      // Step 1: Get swap route
      const routeResponse = await axios.get(`${API_URL}/routes`, {
        params: {
          tokenIn: args.tokenIn,
          tokenOut: args.tokenOut,
          amountIn: parsedAmountIn,
          to: signerAddress,
        },
        headers: { "X-Client-Id": "jarvis144" },
      });

      const { routeSummary, routerAddress } = routeResponse.data.data;

      // Handle token approval if not native currency
      if (args.tokenIn !== NATIVE_TOKEN) {
        await approve(wallet, args.tokenIn, routerAddress, parseEther(args.amountIn));
      }

      // Step 2: Build swap transaction
      const buildResponse = await axios.post(
        `${API_URL}/route/build`,
        {
          routeSummary,
          sender: signerAddress,
          recipient: signerAddress,
          slippageTolerance: 50, // 0.5%
        },
        { headers: { "X-Client-Id": "jarvis144" } },
      );

      const { data: encodedSwapData } = buildResponse.data.data;

      // Step 3: Execute swap
      const txHash = await wallet.sendTransaction({
        to: routerAddress,
        data: encodedSwapData,
        value: args.tokenIn === NATIVE_TOKEN ? parseEther(args.amountIn) : BigInt(0),
      });

      const receipt = await wallet.waitForTransactionReceipt(txHash);
      return this.formatSuccess(txHash, receipt);
    } catch (error: any) {
      console.error(error.response?.data?.details);
      return this.formatError(error);
    }
  }

  private formatSuccess(txHash: string, receipt: any): string {
    console.log(
      JSON.stringify(
        {
          success: true,
          txHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          network: "ZKSync",
        },
        null,
        2,
      ),
    );

    return JSON.stringify(
      {
        success: true,
        txHash,
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        network: "ZKSync",
      },
      null,
      2,
    );
  }

  private formatError(error: unknown): string {
    const errorDetails = {
      success: false,
      error: {
        message: "Unknown error",
        code: "UNKNOWN",
        details: [] as string[],
        requestId: "",
      },
    };

    if (axios.isAxiosError(error)) {
      const resData = error.response?.data;
      errorDetails.error = {
        message: resData?.message || error.message,
        code: resData?.code || error.code || "NO_CODE",
        details: resData?.details?.map((d: any) => d.reason) || [],
        requestId: resData?.requestId || "N/A",
      };
    }

    console.log(JSON.stringify(errorDetails, null, 2));

    return JSON.stringify(errorDetails, null, 2);
  }

  supportsNetwork = (network: Network) => true;
}

export const swapActionProvider = () => new SwapActionProvider();
