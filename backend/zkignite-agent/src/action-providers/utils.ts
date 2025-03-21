import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { createClient } from "@supabase/supabase-js";
import { encodeFunctionData } from "viem";
import { EvmWalletProvider } from "@coinbase/agentkit";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

/**
 * Approves a spender to spend tokens on behalf of the owner
 *
 * @param wallet - The wallet provider
 * @param tokenAddress - The address of the token contract
 * @param spenderAddress - The address of the spender
 * @param amount - The amount to approve in atomic units (wei)
 * @returns A success message or error message
 */
export async function approve(
  wallet: EvmWalletProvider,
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint,
): Promise<string> {
  console.log("APPROVE IS CALLED");
  try {
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress as `0x${string}`, amount],
    });

    const txHash = await wallet.sendTransaction({
      to: tokenAddress as `0x${string}`,
      data,
    });

    await wallet.waitForTransactionReceipt(txHash);

    return `Successfully approved ${spenderAddress} to spend ${amount} tokens`;
  } catch (error) {
    return `Error approving tokens: ${error}`;
  }
}

/**
 * Scales a gas estimate by a given multiplier.
 *
 * This function converts the gas estimate to a number, applies the multiplier,
 * rounds the result to the nearest integer, and returns it as a bigint.
 *
 * @param gas - The original gas estimate (bigint).
 * @param multiplier - The factor by which to scale the estimate.
 * @returns The adjusted gas estimate as a bigint.
 */
export function applyGasMultiplier(gas: bigint, multiplier: number): bigint {
  return BigInt(Math.round(Number(gas) * multiplier));
}

export async function removeActivePositionFromSupabase(
  userId: string,
  tokenId: string,
): Promise<string> {
  console.log(
    "Currently removing position from user's positions array in supabase:",
    tokenId,
    poolAddress,
  );

  try {
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("positions")
      .eq("id", userId);

    if (fetchError) throw fetchError;

    // Check if user exists
    if (!userData || userData.length === 0) {
      throw new Error(`No user found with ID ${userId}`);
    }

    const userPositions = userData[0]?.positions || ([] as SupabasePosition[]);

    // Filter out the position to remove
    const updatedPositions = userPositions.filter(
      (position: SupabasePosition) => !(position.token_id === tokenId),
    );

    // If no positions were removed, throw an error
    if (updatedPositions.length === userPositions.length) {
      throw new Error(`Position not found for tokenId ${tokenId}`);
    }

    // Update the user's positions array
    const { data, error } = await supabase
      .from("users")
      .update({ positions: updatedPositions })
      .eq("id", userId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(`Failed to update user with ID ${userId}`);
    }

    console.log("Successfully removed position from user's positions array");

    return JSON.stringify({
      success: true,
      token_id: tokenId,
    });
  } catch (error: any) {
    console.error("Error removing active position in Supabase:", error);
    return JSON.stringify({
      success: false,
      error: {
        message: error.message,
        type: "POSITION_REMOVAL_ERROR",
        details: {
          token_id: tokenId,
        },
      },
    });
  }
}

export async function deleteActivePositionInDynamo(
  userId: string,
  tokenId: string,
): Promise<string> {
  console.log("Currently removing position from dynamo db:", tokenId, poolAddress);
  const params = {
    TableName: "positions",
    Key: {
      userId: userId,
      tokenId: tokenId,
    },
  };

  try {
    const command = new DeleteCommand(params);
    await docClient.send(command);
    console.log("Position deleted successfully with tokenId:", tokenId);
    return JSON.stringify({
      success: true,
      token_id: tokenId,
    });
  } catch (error: any) {
    console.error("Error deleting position:", error);
    return JSON.stringify({
      success: false,
      error: {
        message: error.message,
        type: "POSITION_REMOVAL_ERROR",
        details: {
          token_id: tokenId,
        },
      },
    });
  }
}
