import { z } from "zod";
import { Decimal } from "decimal.js";
import { encodeFunctionData, parseEther, TransactionReceipt } from "viem";
import { ethers, Interface } from "ethers";
import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { CreatePositionSchema, GetTokenIdsSchema, RemoveLiquiditySchema } from "./schemas";

import { NFPM_ABI, POOL_ABI, NFPM_ADDRESS } from "./constants";

import {
  approve,
  removeActivePositionFromSupabase,
  deleteActivePositionInDynamo,
  addActivePositionInDynamo,
  addActivePositionInSupabase,
  getPositionRemovalStatus,
} from "../utils";

import { supabase } from "../supabaseClient";

/**
 * SyncSwapActionProvider handles concentrated liquidity positions on SyncSwap V3
 */
export class UniswapActionProvider extends ActionProvider<EvmWalletProvider> {
  constructor() {
    super("uniswap", []);
  }

  @CreateAction({
    name: "removeLiquidity",
    description: `
Removes liquidity from a Uniswap V3 LP position and burns the NFT. 

Parameters:
- tokenId: Numeric NFT position ID to remove liquidity from (e.g. 340250)

Process:
1. Decreases liquidity to 0 (if position still has liquidity)
2. Collects remaining tokens from the position
3. Burns the NFT position

Important notes:
- Will fail if position doesn't exist or already closed
- Automatically handles token approvals
- Recipient defaults to transaction sender address
`,
    schema: RemoveLiquiditySchema,
  })
  async removeLiquidity(
    wallet: EvmWalletProvider,
    args: z.infer<typeof RemoveLiquiditySchema>,
  ): Promise<string> {
    try {
      // Step 1: Validate if the position can be removed
      const canRemovePositition = await getPositionRemovalStatus(args.userId, args.tokenId);

      if (!canRemovePosition) {
        return createErrorResponse(
          `Position can't be removed for token ID ${args.tokenId} since one of the assets has decreased in value over the 10% threshold.`,
        );
      }

      console.log("Removing liquidity from Uniswap V3 position", args);

      const tokenId = BigInt(args.tokenId);
      const txs: `0x${string}`[] = [];
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org/");
      const nfpm = new ethers.Contract(NFPM_ADDRESS, NFPM_ABI, provider);

      // Step 2:  Fetch position details
      const position = await nfpm.positions(tokenId);
      const liquidity = position[7];
      console.log(`Position ${tokenId} liquidity: ${liquidity.toString()}`);

      // Step 3: Handle liquidity decrease if applicable
      if (liquidity > BigInt(0)) {
        txs.push(await executeTransaction(wallet, encodeDecreaseLiquidity(tokenId, liquidity)));
      }

      // Step 4: Collect remaining tokens
      txs.push(
        await executeTransaction(wallet, encodeCollectTokens(tokenId, await wallet.getAddress())),
      );

      // Step 5: Burn the position
      const burnTx = await executeTransaction(wallet, encodeBurnPosition(tokenId));
      const burnReceipt = await wallet.waitForTransactionReceipt(burnTx);

      // Step 6: Remove position from databases
      await removePositionFromDatabases(args.userId, args.tokenId);

      return createSuccessResponse(tokenId, txs, burnReceipt.blockNumber.toString());
    } catch (error) {
      return this.formatError(error);
    }
  }

  @CreateAction({
    name: "createPosition",
    description: `
This tool allows creating a UniswapV3 LP position. 

It takes:
- poolAddress: The address of the Syncswap LP pool to deposit to
- amount0Desired: The quantity of assets to add to the LP pool, in whole units
  Examples for USDC:
  - 12 USDC
  - 0.12 USDC
  - 0.012 USDC
- amount1Desired: The quantity of assets to add to the LP pool, in whole units
  Examples of WETH: 
  - 1 WETH
  - 0.1 WETH 
  - 0.01 WEth

Important notes:
- Please use a token address (example 0x4200000000000000000000000000000000000006) for the tokenAddress field.
`,
    schema: CreatePositionSchema,
  })
  async createPosition(
    wallet: EvmWalletProvider,
    args: z.infer<typeof CreatePositionSchema>,
  ): Promise<string> {
    try {
      const { token0, token1, fee, tickSpacing, currentTick } = await this.getPoolParameters(
        args.poolAddress,
      );

      console.log("Currently creating a uniswapv3 position with the following args", args);

      console.log("Pool parameters", { token0, token1, fee, tickSpacing, currentTick });

      const tickOffset = 10;
      const tickLower = this.calculateTick(currentTick, tickSpacing, -tickOffset);
      const tickUpper = this.calculateTick(currentTick, tickSpacing, tickOffset);

      const amount0Desired = parseEther(args.amount0Desired);
      const amount1Desired = parseEther(args.amount1Desired);

      const result1 = await approve(wallet, token0, NFPM_ADDRESS, amount0Desired);
      console.log("Result 1", result1);
      const result2 = await approve(wallet, token1, NFPM_ADDRESS, amount1Desired);
      console.log("Result 2", result2);
      const txHash = await wallet.sendTransaction({
        to: NFPM_ADDRESS,
        data: this.encodeMintCall({
          token0,
          token1,
          fee,
          tickLower,
          tickUpper,
          tickSpacing,
          sqrtPriceX96: 0,
          amount0Desired,
          amount1Desired,
          recipient: wallet.getAddress(),
        }),
      });

      const receipt = await wallet.waitForTransactionReceipt(txHash);
      const tokenId = this.parseTokenIdFromReceipt(receipt);

      await addPositionInDatabases(
        args.userId,
        args.poolAddress,
        token0,
        token1,
        args.amount0Desired,
        args.amount1Desired,
        tokenId,
      );
      return this.formatSuccess(txHash, receipt);
    } catch (error) {
      return this.formatError(error);
    }
  }

  @CreateAction({
    name: "getTokenIds",
    description: `
Retrieves all LP position NFT token IDs owned by a specific address from Uniswap V3.

Parameters:
- userAddress: The Ethereum address to check for owned liquidity positions (e.g. 0x1234...abcd)

Returns: 
- Array of token IDs representing the user's liquidity positions in NFT form
- Will return empty array if no positions found
`,
    schema: GetTokenIdsSchema,
  })
  async getTokenIds(
    wallet: EvmWalletProvider,
    args: z.infer<typeof GetTokenIdsSchema>,
  ): Promise<string> {
    console.log("Currently getting active syncswap positions", args);
    try {
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org/");
      const nfpm = new ethers.Contract(NFPM_ADDRESS, NFPM_ABI, provider);

      // Query the Transfer events to find events where the user is recipient
      const filter = nfpm.filters.Transfer(null, args.userAddress);
      const events = await nfpm.queryFilter(filter);

      const tokenIds = events
        .filter((e): e is ethers.EventLog => e instanceof ethers.EventLog)
        .map(event => event.args.tokenId.toString());

      console.log("Successfully retrieved token IDs", tokenIds);

      return JSON.stringify(
        {
          success: true,
          tokenIds,
          contractAddress: NFPM_ADDRESS,
        },
        null,
        2,
      );
    } catch (error) {
      return this.formatError(error);
    }
  }

  // removeLiquidity func's helper functions
  private createErrorResponse(message: string): string {
    return JSON.stringify({ success: false, message });
  }

  private createSuccessResponse(
    tokenId: bigint,
    transactions: `0x${string}`[],
    burnedBlock: string,
  ): string {
    return JSON.stringify({
      success: true,
      message: `Removed liquidity from position ${tokenId}`,
      transactions,
      burnedBlock,
    });
  }

  private encodeDecreaseLiquidity(tokenId: bigint, liquidity: bigint): `0x${string}` {
    return encodeFunctionData({
      abi: NFPM_ABI,
      functionName: "decreaseLiquidity",
      args: [
        {
          tokenId,
          liquidity,
          amount0Min: 0,
          amount1Min: 0,
          deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
        },
      ],
    }) as `0x${string}`;
  }

  private encodeCollectTokens(tokenId: bigint, recipient: string): `0x${string}` {
    const MAX_UINT128 = BigInt(2) ** BigInt(128) - BigInt(1);
    return encodeFunctionData({
      abi: NFPM_ABI,
      functionName: "collect",
      args: [
        {
          tokenId,
          recipient,
          amount0Max: MAX_UINT128,
          amount1Max: MAX_UINT128,
        },
      ],
    }) as `0x${string}`;
  }

  private encodeBurnPosition(tokenId: bigint): `0x${string}` {
    return encodeFunctionData({
      abi: NFPM_ABI,
      functionName: "burn",
      args: [tokenId],
    }) as `0x${string}`;
  }

  private async executeTransaction(
    wallet: EvmWalletProvider,
    data: `0x${string}`,
  ): Promise<`0x${string}`> {
    const tx = await wallet.sendTransaction({ to: NFPM_ADDRESS as `0x${string}`, data });
    await wallet.waitForTransactionReceipt(tx);
    return tx;
  }

  private async removePositionFromDatabases(userId: string, tokenId: string): Promise<void> {
    await removeActivePositionFromSupabase(userId, tokenId);
    await deleteActivePositionInDynamo(userId, tokenId);
  }

  // createPosition func's healper functions
  private calculateTick(currentTick: number, spacing: number, offset: number): number {
    return Math.round((currentTick + offset * spacing) / spacing) * spacing;
  }

  private parseTokenIdFromReceipt(receipt: TransactionReceipt): string {
    const nfpmInterface = new Interface(NFPM_ABI);

    for (const log of receipt.logs) {
      try {
        const parsedLog = nfpmInterface.parseLog(log);
        if (parsedLog?.name === "Transfer" && parsedLog.args.from === ethers.ZeroAddress) {
          return parsedLog.args.tokenId.toString();
        }
      } catch (e) {
        // Skip non-matching logs
      }
    }

    throw new Error("No NFT tokenId found in transaction logs");
  }

  private async addPositionInDatabases(
    userId: string,
    poolAddress: string,
    token0: string,
    token1: string,
    amount0Desired: string,
    amount1Desired: string,
    tokenId: string,
  ): Promise<void> {
    await addActivePositionInDynamo(
      userId,
      poolAddress,
      token0,
      token1,
      amount0Desired,
      amount1Desired,
      tokenId,
    );

    await addActivePositionInSupabase(userId, tokenId, poolAddress);
  }

  // General helper functions
  private formatSuccess(txHash: string, receipt: any): string {
    console.log(
      JSON.stringify(
        {
          success: true,
          txHash,
          blockNumber: receipt.blockNumber.toString(),
          positionNFT: {
            contract: receipt.to,
            tokenId: receipt.logs?.[0]?.topics?.[2]?.toString(),
          },
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
        positionNFT: {
          contract: receipt.to,
          tokenId: receipt.logs?.[0]?.topics?.[2]?.toString(),
        },
      },
      null,
      2,
    );
  }

  private formatError(error: unknown): string {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    console.log(
      JSON.stringify(
        {
          success: false,
          error: errorMessage.replace(/\[(BigInt:\d+)\]/g, '"$1"'),
        },
        null,
        2,
      ),
    );

    return JSON.stringify(
      {
        success: false,
        error: errorMessage.replace(/\[(BigInt:\d+)\]/g, '"$1"'),
      },
      null,
      2,
    );
  }

  private async getPoolParameters(poolAddress: string) {
    const provider = new ethers.JsonRpcProvider("https://mainnet.base.org/");

    const pool = new ethers.Contract(poolAddress as `0x${string}`, POOL_ABI, provider);

    const [token0, token1, fee, tickSpacing, slot0] = await Promise.all([
      pool.token0(),
      pool.token1(),
      pool.fee(),
      pool.tickSpacing(),
      pool.slot0(),
    ]);

    return {
      token0: token0 as string,
      token1: token1 as string,
      fee: Number(fee),
      tickSpacing: Number(tickSpacing),
      currentTick: Number(slot0.tick.toString()),
    };
  }

  supportsNetwork = (network: Network) => true;
}

export const uniswapActionProvider = () => new UniswapActionProvider();
