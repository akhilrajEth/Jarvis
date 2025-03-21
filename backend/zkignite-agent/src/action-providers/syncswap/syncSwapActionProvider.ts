import { z } from "zod";
import { Decimal } from "decimal.js";
import { encodeFunctionData, parseEther, TransactionReceipt } from "viem";
import { ethers, Interface } from "ethers";
import { ActionProvider, EvmWalletProvider, Network, CreateAction } from "@coinbase/agentkit";
import { CreatePositionSchema, GetTokenIdsSchema, RemoveLiquiditySchema } from "./schemas";

import { NFPM_ABI, POOL_ABI, NFPM_ADDRESS } from "./constants";

import { approve, removeActivePositionFromSupabase, deleteActivePositionInDynamo } from "../utils";

import { supabase } from "../supabaseClient";

/**
 * SyncSwapActionProvider handles concentrated liquidity positions on SyncSwap V3
 */
export class SyncSwapActionProvider extends ActionProvider<EvmWalletProvider> {
  constructor() {
    super("syncswap", []);
  }

  @CreateAction({
    name: "removeLiquidity",
    description: `
Removes liquidity from a Syncswap V3 LP position and burns the NFT. 

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
    console.log("Currently removing liquidity from syncswap position", args);
    try {
      const tokenId = BigInt(args.tokenId);
      const txs: `0x${string}`[] = [];
      const MAX_UINT128 = BigInt(2) ** BigInt(128) - BigInt(1);

      const provider = new ethers.JsonRpcProvider("https://mainnet.era.zksync.io");
      const nfpm = new ethers.Contract(NFPM_ADDRESS, NFPM_ABI, provider);

      // 1. Get position details
      const position = await nfpm.positions(tokenId);
      const liquidity = position[7];
      console.log(`Position ${tokenId} liquidity: ${liquidity.toString()}`);

      // Encode params to call NFPM contract
      const encodeParams = (params: any) =>
        encodeFunctionData({
          abi: NFPM_ABI,
          ...params,
        }) as `0x${string}`;

      // 2. Decrease liquidity
      if (liquidity > BigInt(0)) {
        const decreaseData = encodeParams({
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
        });

        const decreaseTx = await wallet.sendTransaction({
          to: NFPM_ADDRESS as `0x${string}`,
          data: decreaseData,
        });
        txs.push(decreaseTx);
        await wallet.waitForTransactionReceipt(decreaseTx);
      }

      // 3. Collect remaining tokens
      const collectData = encodeParams({
        functionName: "collect",
        args: [
          {
            tokenId,
            recipient: await wallet.getAddress(),
            amount0Max: MAX_UINT128,
            amount1Max: MAX_UINT128,
          },
        ],
      });

      const collectTx = await wallet.sendTransaction({
        to: NFPM_ADDRESS as `0x${string}`,
        data: collectData,
      });
      txs.push(collectTx);
      await wallet.waitForTransactionReceipt(collectTx);

      // 4. Burn the position
      const burnData = encodeParams({
        functionName: "burn",
        args: [tokenId],
      });

      const burnTx = await wallet.sendTransaction({
        to: NFPM_ADDRESS as `0x${string}`,
        data: burnData,
      });
      txs.push(burnTx);
      const burnReceipt = await wallet.waitForTransactionReceipt(burnTx);

      // 5. Remove position from active positions in both supabase and dynamo db
      await this.removeActivePositionFromSupabase(args.userId, args.tokenId);
      await this.deleteActivePositionInDynamo(args.userId, args.tokenId);

      return JSON.stringify({
        success: true,
        message: `Removed liquidity from position ${tokenId}`,
        transactions: txs,
        burnedBlock: burnReceipt.blockNumber.toString(),
      });
    } catch (error) {
      return this.formatError(error);
    }
  }

  @CreateAction({
    name: "getTokenIds",
    description: `
Retrieves all LP position NFT token IDs owned by a specific address from SyncSwap V3.

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
      const provider = new ethers.JsonRpcProvider("https://mainnet.era.zksync.io");
      const nfpm = new ethers.Contract(NFPM_ADDRESS, NFPM_ABI, provider);

      // Query the Transfer events to find events where the user is recipient
      const filter = nfpm.filters.Transfer(null, args.userAddress);
      const events = await nfpm.queryFilter(filter);

      const tokenIds = events
        .filter((e): e is ethers.EventLog => e instanceof ethers.EventLog)
        .map(event => event.args.tokenId.toString());

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

  @CreateAction({
    name: "createPosition",
    description: `
This tool allows creating a LP position on Syncswap. 

It takes:
- poolAddress: The address of the Syncswap LP pool to deposit to
- amount0Desired: The quantity of assets to add to the LP pool, in whole units
  Examples for ZKSync:
  - 12 ZKSync
  - 0.12 ZKSync
  - 0.012 ZKSync
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

      console.log("Currently creating a syncswap position with the following args", args);

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

      await this.addActivePosition(tokenId, args.poolAddress);

      return this.formatSuccess(txHash, receipt);
    } catch (error) {
      return this.formatError(error);
    }
  }

  private calculateTick(currentTick: number, spacing: number, offset: number): number {
    return Math.round((currentTick + offset * spacing) / spacing) * spacing;
  }

  private encodeMintCall(params: {
    token0: string;
    token1: string;
    fee: number;
    tickLower: number;
    tickUpper: number;
    tickSpacing: number;
    sqrtPriceX96: number;
    amount0Desired: bigint;
    amount1Desired: bigint;
    recipient: string;
  }): `0x${string}` {
    return encodeFunctionData({
      abi: NFPM_ABI,
      functionName: "mint",
      args: [
        {
          ...params,
          fee: params.fee,
          amount0Min: 0,
          amount1Min: 0,
          deadline: Math.floor(Date.now() / 1000) + 1200,
        },
      ],
    });
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

  private async addActivePosition(positionId: string, poolAddress: string): Promise<string> {
    console.log("Adding active position to db for syncswap position", positionId, poolAddress);
    try {
      const { data, error } = await supabase
        .from("agent_subscription_data")
        .update({ active_positions: positionId })
        .eq("subscription_data->>poolAddress", poolAddress)
        .select();

      if (error) throw error;

      if (!data?.length) {
        throw new Error(`No subscription found for pool ${poolAddress}`);
      }

      return JSON.stringify({
        success: true,
        updated_count: data.length,
        position_id: positionId,
        pool_address: poolAddress,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: {
          message: error.message,
          type: "POSITION_UPDATE_ERROR",
          details: {
            position_id: positionId,
            pool_address: poolAddress,
          },
        },
      });
    }
  }

  private formatSuccess(txHash: string, receipt: any): string {
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
    const provider = new ethers.JsonRpcProvider("https://mainnet.era.zksync.io");

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

export const syncSwapActionProvider = () => new SyncSwapActionProvider();
